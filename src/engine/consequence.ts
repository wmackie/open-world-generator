import { ILLMProvider } from '../llm/provider.interface';
import { logger } from '../utils/logger';
import { PromptManager } from './prompts/prompt_manager';

export class ConsequenceEngine {
    constructor(private llm: ILLMProvider, private promptManager: PromptManager) { }

    // DEPRECATED: generateSpectrum replaced by resolveActionCognitive
    // Keeping empty stub if other files reference it, or just removing.
    // Removing to force compile errors where used.

    async resolveTargetReaction(
        actionOutcome: any,
        target: any,
        context: any
    ): Promise<any> {
        // If target is object or location, no reaction needed (handled in immediate_effects)
        if (!target || target.entity_type !== 'npc' && target.entity_type !== 'creature') {
            return null;
        }

        const prompt = this.promptManager.render('REACTION_TARGET', {
            MECHANIC_SUMMARY: actionOutcome.mechanic_summary,
            FULL_OUTCOME: actionOutcome,
            TARGET_JSON: target,
            location: context.location, // Passing raw context for Scene Bundle construction
            time: context.time
        });
        try {
            const response = await this.llm.generate(prompt, 'creative', {
                temperature: 0.7,
                responseFormat: 'json'
            });
            let cleanText = response.text.trim();
            if (cleanText.startsWith('```json')) cleanText = cleanText.replace(/```json/g, '').replace(/```/g, '');
            const result = JSON.parse(cleanText);
            logger.info('ConsequenceEngine', 'Target Reaction Resolved', { target: target.name, reaction: result.reaction });
            return result;
        } catch (e: any) {
            logger.error('ConsequenceEngine', 'Target Reaction Failed', { error: e.message });
            return null;
        }
    }

    async resolveWitnessReactions(
        actionOutcome: any,
        targetReaction: any,
        witnesses: any[],
        context: any
    ): Promise<any[]> {
        if (!witnesses || witnesses.length === 0) return [];

        const prompt = this.promptManager.render('REACTION_WITNESS', {
            MECHANIC_SUMMARY: actionOutcome.mechanic_summary,
            TARGET_REACTION: targetReaction ? targetReaction.description : "None",
            WITNESSES_JSON: witnesses.map(w => ({ name: w.name, id: w.entity_id, role: w.role || 'observer' }))
        });
        try {
            const response = await this.llm.generate(prompt, 'creative', {
                temperature: 0.6,
                responseFormat: 'json'
            });
            let cleanText = response.text.trim();
            if (cleanText.startsWith('```json')) cleanText = cleanText.replace(/```json/g, '').replace(/```/g, '');
            const result = JSON.parse(cleanText);
            logger.info('ConsequenceEngine', 'Witness Reactions Resolved', { count: result.reactions?.length });
            return result.reactions || [];
        } catch (e: any) {
            logger.error('ConsequenceEngine', 'Witness Reactions Failed', { error: e.message });
            return [];
        }
    }

    // --- COGNITIVE ENGINE (Phase 2) ---
    async resolveActionCognitive(
        input: string,
        worldState: any,
        contextEntities: any[] = []
    ): Promise<{ analysis: any, outcome: any } | null> {

        // 1. Build Player Context
        const player = worldState.player;
        const visuals = player?.appearance?.visuals || "Unknown Appearance";
        const playerDesc = player ? `Name: ${player.name?.display || "Unknown"}, Appearance: ${visuals}` : "Unknown";
        const playerCaps = player?.capabilities ? JSON.stringify(player.capabilities) : "None";
        const inventory = player?.inventory ? player.inventory.join(', ') : "Empty";

        // 2. Build Relationship Context (Semantic)
        const relationshipContext = contextEntities
            .filter((e: any) => e.entity_type === 'npc')
            .map((e: any) => {
                const rel = (Array.isArray(e.relationships)) ? e.relationships.find((r: any) => r.entity_id === player?.entity_id) : undefined;
                if (rel) {
                    // Use Semantic Logic if available, else fallback
                    const trust = rel.trust || "Neutral";
                    const tags = rel.tags ? rel.tags.join(',') : "";
                    const history = rel.history ? rel.history.slice(-2).join(';') : "";
                    return `- ${e.name.display}: Trust=${trust}, Tags=[${tags}], Recent=[${history}]`;
                }
                return `- ${e.name.display}: Unknown`;
            }).join('\n');

        // 3. Render Prompt
        const prompt = this.promptManager.render('CONSEQUENCE_COGNITIVE', {
            INPUT: input,
            PLAYER_DESC: playerDesc,
            PLAYER_CAPS: playerCaps,
            INVENTORY: inventory,
            RELATIONSHIP_CONTEXT: relationshipContext || "None",
            // Pass raw context for Scene Bundle construction
            locationName: worldState.location?.name,
            locationDesc: worldState.location?.description,
            npcs: contextEntities.filter(e => e.entity_type === 'npc'),
            objects: contextEntities.filter(e => e.entity_type === 'object'),
            time: worldState.time
        });

        logger.info('ConsequenceEngine', `Resolving Cognitive Outcome for "${input}"`);

        try {
            const response = await this.llm.generate(prompt, 'logic', {
                temperature: 0.4, // Lower variance for consistent logic
                responseFormat: 'json'
            });

            let cleanText = response.text.trim();
            if (cleanText.startsWith('```json')) cleanText = cleanText.replace(/```json/g, '').replace(/```/g, '');

            const result = JSON.parse(cleanText);

            // [SPECTRUM ARCHITECTURE]
            // We now get a 'possible_outcomes' array. We must select ONE based on weights.
            if (result.analysis && Array.isArray(result.possible_outcomes)) {

                logger.info('ConsequenceEngine', `Received Spectrum`, { count: result.possible_outcomes.length });

                // Validation: Filter out malformed probabilities
                const validCandidates = result.possible_outcomes.filter((o: any) =>
                    o.outcome_type && typeof o.probability === 'number'
                );

                if (validCandidates.length === 0) {
                    // Fallback safety
                    logger.warn('ConsequenceEngine', 'No valid outcomes from LLM. generating fallback failure.');
                    return {
                        analysis: result.analysis,
                        outcome: {
                            outcome_type: 'FAILURE',
                            narrative_summary: 'You attempt it, but something goes wrong.',
                            world_changes: [],
                            npc_triggers: []
                        }
                    };
                }

                // Weighted Selection Algorithm
                const totalWeight = validCandidates.reduce((sum: number, c: any) => sum + c.probability, 0);
                const roll = Math.random() * totalWeight;
                let cumulative = 0;
                let selected = validCandidates[0];

                for (const candidate of validCandidates) {
                    cumulative += candidate.probability;
                    if (roll < cumulative) {
                        selected = candidate;
                        break;
                    }
                }

                logger.info('ConsequenceEngine', `Selected Outcome`, {
                    id: selected.id,
                    type: selected.outcome_type,
                    probability: selected.probability
                });

                // Return structure matching old interface for compatibility
                return {
                    analysis: result.analysis,
                    outcome: {
                        outcome_type: selected.outcome_type,
                        narrative_summary: selected.narrative_summary,
                        world_changes: selected.world_changes || [],
                        audio_cue: selected.audio_cue || null,
                        npc_triggers: selected.npc_triggers || []
                    }
                };

            } else if (result.analysis && result.outcome) {
                // Fallback to legacy behavior if LLM ignores spectrum instruction
                logger.warn('ConsequenceEngine', 'LLM returned Legacy Single Outcome. Using it.');
                return result;
            } else {
                logger.warn('ConsequenceEngine', 'Invalid Cognitive Response Structure');
                return null;
            }

        } catch (error: any) {
            logger.error('ConsequenceEngine', 'Cognitive Resolution Failed', { error: error.message });
            return null;
        }
    }
}
