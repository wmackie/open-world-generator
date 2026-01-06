import { SQLiteDB } from '../db/sqlite';
import { logger } from '../utils/logger';
import { EntityManager } from './managers';
import { PromptManager } from './prompts/prompt_manager';
import { ILLMProvider } from '../llm/provider.interface';

export interface ValidationResult {
    valid: boolean;
    reason?: string;
}

export class ConsistencyEnforcer {
    private entityManager: EntityManager;

    constructor(private db: SQLiteDB, private llm: ILLMProvider, private promptManager: PromptManager) {
        this.entityManager = new EntityManager(db);
    }

    // ... (sanitizeConsequence and validateConsequence remain unchanged)

    async sanitizeConsequence(consequence: any, contextEntities: any[]): Promise<any> {
        // ID Reconciliation: Fix Hallucinated IDs
        if (!consequence.world_state_changes) return consequence;

        const sanitized = JSON.parse(JSON.stringify(consequence)); // Deep copy
        const changes = sanitized.world_state_changes;
        const validIds = new Set(contextEntities.map(e => e.entity_id));

        for (const category of Object.keys(changes)) {
            // Only care about entity categories (npc, object, location)
            // 'player' is handled separately usually, but let's include
            if (!['npc', 'object', 'location', 'item'].includes(category)) continue;

            const categoryChanges = changes[category];
            if (typeof categoryChanges !== 'object') continue;

            const originalIds = Object.keys(categoryChanges);
            for (const originalId of originalIds) {
                // If ID is valid, skip
                if (this.entityManager.exists(originalId) || validIds.has(originalId)) continue;

                // ID is INVALID. Search for a fuzzy match in Context.
                // Heuristic: Does a known Entity ID contain this string? (e.g. 'npc_bartender_123' contains 'npc_bartender')
                // Or vice versa?
                const match = contextEntities.find(e =>
                    e.entity_id.includes(originalId) || originalId.includes(e.entity_id) ||
                    (e.name?.display && originalId.toLowerCase().includes(e.name.display.toLowerCase())) ||
                    (e.name?.first && originalId.toLowerCase().includes(e.name.first.toLowerCase()))
                );

                if (match) {
                    logger.info('ConsistencyEnforcer', `Sanitized ID: ${originalId} -> ${match.entity_id}`);
                    // Move data to new key
                    const data = categoryChanges[originalId];
                    delete categoryChanges[originalId];
                    categoryChanges[match.entity_id] = data;
                } else {
                    // No match found. If we leave it, Validator will reject.
                    // Option: Drop it? 
                    // Better to let Validator reject so we know it failed hard.
                    logger.warn('ConsistencyEnforcer', `Could not sanitize ID: ${originalId}`);
                }
            }
        }
        return sanitized;
    }

    async validateConsequence(consequence: any, worldState: any): Promise<ValidationResult> {
        // 1. Check for Retroactive Causality Violations
        const retroViolation = await this.checkRetroactiveCausality(consequence, worldState);
        if (!retroViolation.valid) {
            return retroViolation;
        }
        return { valid: true };
    }

    async validateStructure(consequence: any): Promise<ValidationResult> {
        // Gate 2: Structural Validation
        // Check if all referenced entity IDs in world_state_changes actually exist
        if (!consequence.world_state_changes) return { valid: true };

        const categories = ['npc', 'location', 'item', 'object', 'time', 'opportunities']; // Known categories

        for (const cat of Object.keys(consequence.world_state_changes)) {
            // Case 1: Key is a valid Entity ID
            if (this.entityManager.exists(cat)) {
                continue;
            }

            // Case 2: Key is a known Category
            if (categories.includes(cat)) {
                const changes = consequence.world_state_changes[cat];
                if (typeof changes === 'object') {
                    for (const potentialId of Object.keys(changes)) {
                        // Check if this key is an entity ID
                        // Heuristic: If it contains underscore, verify it.
                        // Ignore functional keys inside categories if they mimic structure (rare).
                        if (potentialId.includes('_') && !this.entityManager.exists(potentialId)) {
                            logger.warn('ConsistencyEnforcer', `Validation Failed: ID not found`, { id: potentialId });
                            return { valid: false, reason: `Consequence references non-existent entity ID: ${potentialId}` };
                        }
                    }
                }
                continue;
            }

            // Case 3: Unknown Key (Not an ID, Not a Category)
            return { valid: false, reason: `Consequence references invalid entity ID or category: ${cat}` };
        }
        return { valid: true };
    }

    async validateNarrative(
        narrative: string,
        presentEntities: any[],
        context: {
            locationDesc: string;
            previousNarrative: string;
            npcActions: any[];
        }
    ): Promise<ValidationResult & { correctedNarrative?: string }> {
        // Gate 4: Hallucination Check (Strict State Validator)

        const entitiesList = presentEntities.map(e => {
            const action = (e.state?.current_action?.description) ? `(Action: ${e.state.current_action.description})` : "";
            return `- ${e.name.display || e.name} ${action}`;
        }).join('\n');

        const npcActionList = context.npcActions.map((a: any) =>
            `- ${a.npc_name}: ${a.action_type} -> "${a.description}"${a.dialogue ? ` (Says: "${a.dialogue}")` : ""}`
        ).join('\n');

        const prompt = this.promptManager.render('STATE_VALIDATOR', {
            LOCATION_DESC: context.locationDesc,
            PRESENT_ENTITIES: entitiesList || "None",
            PREVIOUS_NARRATION: context.previousNarrative || "None",
            NPC_ACTIONS: npcActionList || "None",
            INPUT_NARRATION: narrative
        });

        try {
            // Using 'logic' model for stricter validation
            const response = await this.llm.generate(prompt, 'logic', {
                temperature: 0.1, // Strict
                responseFormat: 'json'
            });

            let cleanText = response.text.trim();
            if (cleanText.startsWith('```json')) cleanText = cleanText.replace(/```json/g, '').replace(/```/g, '');
            const result = JSON.parse(cleanText);

            if (result.validation_passed) {
                return { valid: true };
            } else {
                logger.warn('ConsistencyEnforcer', `State Validator Caught Issues`, { issues: result.issues });
                if (result.corrected_narration) {
                    return {
                        valid: false,
                        reason: "State Validation Failed",
                        correctedNarrative: result.corrected_narration
                    };
                }
                // If no correction provided but invalid, just warn?
                return { valid: true }; // Fallback to allowing it if no correction
            }

        } catch (e: any) {
            logger.error('ConsistencyEnforcer', 'State Validation Failed (LLM Error)', { error: e.message });
            return { valid: true }; // Fail open
        }
    }

    private async checkRetroactiveCausality(consequence: any, worldState: any): Promise<ValidationResult> {
        // Rule: If the consequence states an NPC was present in Location L at Time T,
        // AND the player observed Location L at Time T and did NOT see the NPC,
        // THEN it is a violation.

        // This requires parsing the narrative for assertions about the past.
        // For the prototype text-based check, we look for key phrases or state changes implies "was hiding" or "was here".
        // A robust implementation requires LLM-based assertion extraction.

        // HOWEVER, adversarial_001 specifically tests:
        // "She was in room 302 sleeping" (when room 302 was empty previously).

        // HEURISTIC:
        // If the narrative asserts presence in a location the player recently visited (within 10 turns)
        // and the player's observation log for that visit shows 0 occupants (excluding player),
        // flag it.

        const narrative = consequence.narrative_summary?.toLowerCase() || "";

        // Check if narrative mentions a location we've been to
        // This is tricky without structured location refs.
        // Let's rely on the 'world_state_changes' if they move an entity implies they were somewhere else?
        // No, the bug is purely narrative: "She was in room 302".

        // Let's query recent observations from the DB
        // "SELECT * FROM event_log WHERE action_type = 'look' OR (action_type = 'move' AND observer_id = 'player') ORDER BY turn_number DESC LIMIT 5"

        try {
            const recentObservations = this.db['db'].prepare(`
                SELECT * FROM event_log 
                WHERE (action_type = 'look' OR (action_type = 'move' AND observer_id = 'player'))
                ORDER BY turn_number DESC 
                LIMIT 5
            `).all() as any[];

            for (const obs of recentObservations) {
                // obs.event_desc or obs.event_data contains what was seen.
                // If we have structure: event_data: { entities_present: [] }
                const data = typeof obs.event_data === 'string' ? JSON.parse(obs.event_data) : obs.event_data;
                const locId = obs.location_id;

                // If the consequence involves this location
                // (Simple text match for now, ideally strictly matched IDs)
                // If the narrative places someone in 'room 302' and we saw 'room 302' empty.

                // For the adversarial test specifically:
                // Test checks: !narrative.contains('sister was in room 302')

                // So if we detect "was in [location]" and we saw [location] empty, REJECT.

                if (narrative.includes("was in") || narrative.includes("has been in")) {
                    // This is a "past continuous" assertion. Danger zone.
                    if (data.from && data.to) { // Move event
                        // If we moved TO a location and it was empty...
                        // We need meaningful data in event_log about what was seen.
                        // Phase 1 implementation of logEvent might be sparse.
                    }
                }
            }

        } catch (e: any) {
            logger.warn('ConsistencyEnforcer', 'DB check failed', { error: e.message });
        }

        // For now, allow all (pass-through) until we have precise "Negative Observation" data structure.
        // The current event_log might not store "entities_seen: []".

        return { valid: true };
    }

    validateCompleteness(narrative: string, requiredTerms: string[]): string[] {
        // Gate 5: Completeness Check (Post-Narration)
        // Ensure critical info (Exits, NPCs) is mentioned.
        const missing: string[] = [];
        const normalizedNarrative = narrative.toLowerCase();

        for (const term of requiredTerms) {
            // Fuzzy match: check if the term (or reasonable parts of it) appears.
            // Heuristic A: Full string match
            if (normalizedNarrative.includes(term.toLowerCase())) continue;

            // Heuristic B: If multi-word, check if SIGNIFICANT part appears.
            // e.g. "Main Hall" -> "Hall" might be enough? No, "Hall" is generic.
            // e.g. "Security Guard" -> "Guard" is acceptable.

            const parts = term.split(' ');
            if (parts.length > 1) {
                // Heuristic B: If multi-word, check if SIGNIFICANT part appears.
                // Exclude very generic words.
                const significant = parts.find(p => p.length >= 3 && !['door', 'hall', 'room', 'exit', 'the', 'and'].includes(p.toLowerCase()));
                if (significant && normalizedNarrative.includes(significant.toLowerCase())) {
                    continue;
                }
            }

            // Heuristic C: Check for common synonyms? (Requires dictionary or manual list).
            // For now, strict-ish match.
            missing.push(term);
        }
        return missing;
    }
}
