
import { ILLMProvider } from '../llm/provider.interface';
import { EntityManager } from './managers';
import { logger } from '../utils/logger';
import { GenreManager } from './genre_manager';
import { TraitGenerator } from '../utils/trait_generator';

export class EntityInstantiationSystem {
    private llmProvider: ILLMProvider;
    private entityManager: EntityManager;
    private genreManager: GenreManager;
    private traitGenerator: TraitGenerator;

    constructor(llmProvider: ILLMProvider, entityManager: EntityManager, genreManager: GenreManager) {
        this.llmProvider = llmProvider;
        this.entityManager = entityManager;
        this.genreManager = genreManager;
        this.traitGenerator = new TraitGenerator();
    }

    // ... (keep processNarrative and generateSkeleton as is, will replace below if needed but for this tool use context)
    // Actually, I need to be careful with replace_file_content over large blocks.
    // I will append the new method at the end and update imports/constructor at the top.
    // Wait, replace_file_content replaces a block. I should replace the class start and the end.
    // Let's do imports and constructor first.

    async processNarrative(narrative: string, locationId: string, knownEntities: string[] = [], forbiddenNames: string[] = []): Promise<any[]> {
        // Spec 4.4 / 9.9: Entity Instantiation
        // "I find a merchant" -> New entity.
        // "You see a kid with dead eyes" -> New entity if 'kid' not in knownEntities.

        // 1. Filter trivial narratives
        if (narrative.length < 50) return [];

        // 2. Build Prompt
        const existingList = knownEntities.length > 0 ? knownEntities.join(", ") : "None";
        const forbiddenList = forbiddenNames.length > 0 ? forbiddenNames.join(", ") : "None";

        const prompt = `
You are extracting NEW entities from a narrative description.
NARRATIVE: "${narrative}"

EXISTING ENTITIES (Ignore these): ${existingList}
DO NOT EXTRACT (Player/Self): ${forbiddenList}
LOCATION_ID: ${locationId}

[STRICT EXTRACTION RULES]

DO extract if:
✓ Object is named and player could plausibly interact with it
✓ Object was just created by action (player builds something)
✓ NPC explicitly hands/shows something to player

DO NOT extract if:
✗ Generic furniture mentioned in passing ("You sit down" -> don't extract "chair" unless specified)
✗ Body parts or clothing ("her hand", "his jacket")
✗ Abstract references ("the situation", "the interview")
✗ Atmospheric details ("shadows", "dust motes")
✗ Components of existing entities ("camera lens" when "camera" exists)
✗ Synonyms of existing entities
✗ The Player themselves (names: ${forbiddenList})

WHEN UNCERTAIN: Don't extract. Players can explicitly interact with items if they're important.

[EXAMPLES]
Narration: "Ashley gestures toward a worn armchair"
✓ Extract: armchair (specific, named, player expected to sit)

Narration: "She sweeps a hand around the room"
✗ Don't extract: hand, room (generic, not interactable)

Narration: "Brooke adjusts the camera lens"
✗ Don't extract: lens (it's part of existing "camera" entity)

Narration: "A manila folder lies on the desk, stamped CONFIDENTIAL"
✓ Extract: manila folder (specific, named, suggests interaction)

OUTPUT JSON ARRAY:
[
  {
    "name": "Exact Name used in text",
    "description": "Physical description based on text",
    "type": "npc" | "object",
    "reason": "Why this is a distinct entity"
  }
]
Return [] if no new entities found.
`;

        try {
            // Fix 1: Use generate() instead of generateJSON which doesn't exist on interface
            const response = await this.llmProvider.generate(prompt, 'logic', {
                temperature: 0.1, // Low temp for precision
                responseFormat: 'json'
            });

            // Basic JSON parsing
            const cleanJson = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
            let candidates: any[] = [];
            try {
                candidates = JSON.parse(cleanJson);
            } catch (e) {
                logger.warn('EntityInstantiation', 'Failed to parse JSON', { text: response.text });
                return [];
            }

            if (!Array.isArray(candidates)) return [];

            const created: any[] = [];

            for (const candidate of candidates) {
                // Code-side Deduplication
                const normalizedCandidate = candidate.name.toLowerCase().trim();
                const isDuplicate = knownEntities.some(known => {
                    const normalizedKnown = known.toLowerCase().trim();
                    return normalizedKnown.includes(normalizedCandidate) || normalizedCandidate.includes(normalizedKnown);
                });

                if (isDuplicate) {
                    logger.info('EntityInstantiation', `Skipping duplicate candidate`, { candidate: candidate.name });
                    continue;
                }

                // HARD FILTER: Check forbidden names
                const isForbidden = forbiddenNames.some(f => normalizedCandidate.includes(f.toLowerCase().trim()));
                if (isForbidden) {
                    logger.info('EntityInstantiation', `Filtered forbidden entity (Player name match)`, { candidate: candidate.name });
                    continue;
                }

                const id = `${candidate.type}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

                // Fix 2: Valid Entity Structure (matching schemas.ts)
                let entity: any;

                if (candidate.type === 'npc') {
                    entity = {
                        entity_id: id,
                        entity_type: 'npc' as 'npc', // Explicit cast for TS
                        name: {
                            first: candidate.name.split(' ')[0],
                            display: candidate.name,
                            known_to_player: true
                        },
                        appearance: {
                            visuals: candidate.description,
                            impression: candidate.reason || "Just appeared"
                        },
                        state: {
                            current_location_id: locationId,
                            health_status: "healthy",
                            emotional_state: "neutral",
                            inventory: [],
                            current_action: null
                        },
                        relationships: {},
                        goals: [],
                        memory: {},
                        tags: ["narrative_generated", "lazy_gen"]
                    };
                } else {
                    // Object
                    entity = {
                        entity_id: id,
                        entity_type: 'object',
                        name: candidate.name,
                        description: candidate.description,
                        state: {
                            current_location_id: locationId,
                            condition: "good",
                            is_container: false,
                            is_locked: false
                        }
                    };
                }

                // Persist
                await this.entityManager.createEntity(entity);
                logger.info('EntityInstantiation', `Created new entity from narrative`, { name: candidate.name, id });

                // Only generate traits if it's an NPC
                if (candidate.type === 'npc') {
                    await this.fleshOutEntity(id);
                }

                created.push(entity);
            }

            return created;

        } catch (error) {
            logger.warn('EntityInstantiation', 'Failed to extract entities', { error });
            return [];
        }
    }

    // Spec 2.5: Intent-Driven Instantiation
    async generateSkeleton(descriptor: string, locationId: string, context: any, currentTurn: number): Promise<any> {
        // [LLM PROMPT: ENTITY SKELETON GENERATION]
        // Use a single prompt to Determine Type and Generate Fields.

        const prompt = `
[LLM PROMPT: ENTITY SKELETON GENERATION]
Generate a minimal entity for this descriptor in the current context.

DESCRIPTOR: "${descriptor}"
LOCATION: ${context.locationName || 'Unknown'} (ID: ${locationId})
ATMOSPHERE: ${context.atmosphere || 'Unknown'}

[TASK]
1. Determine if this is an NPC (sentient) or an OBJECT (item/feature).
2. Generate minimal details.

[OUTPUT JSON]
{
  "type": "npc" | "object",
  "name": "Display Name",
  "description": "Visual description",
  // If NPC:
  "personality": "2-3 adjectives",
  "health_status": "healthy",
  "state": "neutral",
  // If OBJECT:
  "condition": "good",
  "is_container": boolean,
  "is_takeable": boolean,
  // If NPC (Voice):
  "voice_style": "Adjective (e.g. Rough)",
  "voice_sample": "Short sample line"
}
`;
        try {
            const response = await this.llmProvider.generate(prompt, 'creative');
            const cleanJson = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
            let skeleton: any = {};
            try {
                skeleton = JSON.parse(cleanJson);
            } catch (e) {
                logger.warn('EntityInstantiation', 'Failed to parse Skeleton JSON', { text: response.text });
                return null;
            }

            const id = `${skeleton.type}_${descriptor.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase()}_${Date.now()}`;
            let entity: any;

            if (skeleton.type === 'npc') {
                entity = {
                    entity_id: id,
                    entity_type: 'npc',
                    is_player: false,
                    name: {
                        first: skeleton.name.split(' ')[0],
                        display: skeleton.name,
                        known_to_player: true
                    },
                    appearance: {
                        visuals: skeleton.description || "A generic figure",
                        impression: skeleton.personality || "Standard"
                    },
                    voice: { // NEW: Add voice to skeleton
                        style: skeleton.voice_style || "Standard",
                        sample_line: skeleton.voice_sample || "Hello."
                    },
                    simulation_mode: 'passive',
                    engagement_level: 'acquaintance',
                    capabilities: {},
                    state: {
                        current_location_id: locationId,
                        health_status: skeleton.health_status || "healthy",
                        emotional_state: skeleton.state || "neutral",
                        current_action: null,
                        inventory: []
                    },
                    relationships: {},
                    goals: [],
                    memory: {},
                    tags: ["narrative_generated", "lazy_gen"]
                };
            } else {
                // Object
                entity = {
                    entity_id: id,
                    entity_type: 'object',
                    name: skeleton.name,
                    description: skeleton.description || "An object.", // Fixed mapping from skeleton.description
                    state: {
                        current_location_id: locationId,
                        condition: skeleton.condition || "good",
                        is_container: !!skeleton.is_container,
                        is_locked: false,
                        location_type: skeleton.is_takeable === false ? "fixed" : "movable" // Logic guess
                    },
                    tags: ["narrative_generated", "lazy_gen"]
                };
            }

            // Persist
            await this.entityManager.createEntity(entity);
            logger.info('EntityInstantiation', `Created Skeleton Entity (${skeleton.type})`, { descriptor, id, name: skeleton.name });
            return entity;

        } catch (error) {
            logger.error('EntityInstantiation', 'Error generating skeleton', error);
            return null;
        }
    }

    /**
     * Tier 2 Generation: Flesh out a Skeleton Entity into a Full NPC.
     * Uses TraitGenerator for probabilistic scaffolding and LLM for filling details.
     */
    async fleshOutEntity(entityId: string): Promise<boolean> {
        logger.info('EntityInstantiation', `Fleshing out entity...`, { entityId });
        const entity = this.entityManager.getEntity(entityId);
        if (!entity || entity.entity_type !== 'npc' || entity.generated_depth !== 'minimal') {
            return false; // Already fleshed out or invalid
        }

        // 1. Probabilistic Scaffold (Best of 3)
        const rules = this.genreManager.getRules();
        const genreBiases = rules.physics.biases || {};
        const candidates = this.traitGenerator.generateCandidates(3, genreBiases);

        // 2. LLM Prompt (Selection & Expansion)
        const prompt = `
[ROLE]
You are a Casting Director fleshing out a background character into a fully realized NPC.

[EXISTING SKELETON]
Name: ${entity.name.display}
Impression: ${entity.appearance.impression}
Visuals: ${entity.appearance.visuals}

[GENRE PROFILE]
World: ${rules.meta.name}
Tone: ${rules.narrative_flavor.tone_keywords.join(', ')}

[CANDIDATE PERSONALITIES (ROLLED)]
Option A: ${candidates[0].vibe}
Option B: ${candidates[1].vibe}
Option C: ${candidates[2].vibe}

[TASK]
1. Select the Option (A, B, or C) that creates the most interesting drama or conflict for this Genre.
2. Generate the missing psychological and biographical details based on that selection.

[OUTPUT JSON]
{
  "selected_option": "A|B|C",
  "psychology": {
    "motivation": "Selected Motivation",
    "flaw": "Selected Flaw",
    "social_strategy": "Selected Strategy",
    "mental_state": "Brief description of current thoughts",
    "fears": ["Specific fear 1"],
    "desires": ["Specific desire 1"]
  },
  "background": "2-3 sentences of history explaining why they are here.",
  "secrets": ["A secret relevant to the genre"],
  "voice": {
    "style": "Adjective (e.g. Rough)",
    "sample_line": "A typical line of dialogue"
  },
  "moral_compass": {
    "alignment": "Neutral Good/Chaotic Neutral etc",
    "core_value": "One word value"
  }
}
`;

        try {
            const response = await this.llmProvider.generate(prompt, 'creative', { temperature: 0.8 });

            // Robust JSON extraction
            const jsonMatch = response.text.match(/\{[\s\S]*\}/);
            const cleanText = jsonMatch ? jsonMatch[0] : response.text;

            let details;
            try {
                details = JSON.parse(cleanText);
            } catch (parseError) {
                logger.error('EntityInstantiation', 'JSON Parse Error in fleshOutEntity', { raw: response.text });
                return false;
            }

            // 3. Merge Back
            (entity as any).psychology = details.psychology;
            (entity as any).background = details.background;
            (entity as any).knowledge = details.secrets; // Mapping secrets to knowledge
            (entity as any).voice = details.voice;
            (entity as any).moral_compass = details.moral_compass;
            (entity as any).generated_depth = 'full'; // Mark as complete

            await this.entityManager.updateEntity(entityId, entity);
            logger.info('EntityInstantiation', `Fleshed out entity`, { id: entityId, chosen_motivation: details.psychology.motivation });
            return true;

        } catch (e: any) {
            logger.error('EntityInstantiation', 'Fleshing out failed', { error: e.message });
            return false;
        }
    }
    /**
     * Generate a player profile based on name and description.
     */
    async generatePlayerProfile(name: string, description: string, genreRules: any): Promise<any> {
        const prompt = `
[ROLE]
You are a Role-Playing Game System creating a character profile for a new player.

[INPUT]
Name: "${name}"
Description: "${description}"
Genre: ${genreRules.meta.name} (${genreRules.meta.description})
Review the Description carefully. If it mentions specific items (e.g. "carrying a sword"), INCLUDE THEM.

[TASK]
Generate a starting profile including Capabilities (Skills), Psychological Traits, and Starting Inventory.
The profile should be balanced and appropriate for the genre.

[INVENTORY GUIDANCE]
- **EXCLUDE** mundane "daily carry" items like keys, wallet, smartphone, lint, or gum unless they are specifically mentioned in the description or critical to the character's core gimmick.
- **INCLUDE** significant, narrative-driving items. Examples: "A crinkled photograph", "A loaded revolver", "A strange amulet", "A tarnished locket".
- If the character description implies no special items, return an EMPTY inventory list. Do not force items.

[OUTPUT JSON]
{
  "capabilities": {
    "perception": "average|good|expert",
    "endurance": "weak|average|strong",
    "combat": "untrained|novice|competent|expert",
    "social": "untrained|average|charming|intimidating",
    "specialized_skill": "optional_specific_skill (e.g. hacking, lockpicking)"
  },
  "traits": ["3-5 adjectives describing personality"],
  "inventory": ["list", "of", "significant", "items", "OR", "empty"],
  "health_status": "healthy",
  "emotional_state": "determined"
}
`;

        try {
            const response = await this.llmProvider.generate(prompt, 'logic', { temperature: 0.7 });
            const cleanJson = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
            const profile = JSON.parse(cleanJson);

            // Validate/Sanitize
            if (!profile.inventory) profile.inventory = []; // Default to empty if undefined
            if (!profile.capabilities) profile.capabilities = { perception: 'average' };

            logger.info('EntityInstantiation', `Generated Player Profile for ${name}`);
            return profile;

        } catch (error: any) {
            logger.error('EntityInstantiation', 'Failed to generate player profile', error);
            // Fallback
            return {
                capabilities: { perception: 'average', endurance: 'average', combat: 'untrained', social: 'average' },
                traits: ['neutral'],
                inventory: ['smartphone', 'wallet', 'keys'],
                health_status: 'healthy',
                emotional_state: 'neutral'
            };
        }
    }

    /**
     * Instantiates an entity from a fully formed blueprint (e.g. from CardImporter).
     * Handles validation and default hydration.
     */
    async instantiateFromBlueprint(blueprint: any): Promise<boolean> {
        if (!blueprint.entity_id || !blueprint.name) {
            logger.warn('EntityInstantiation', 'blueprint missing required fields', { blueprint });
            return false;
        }

        // Ensure defaults if missing
        const entity = {
            ...blueprint,
            entity_type: blueprint.entity_type || 'npc',
            state: {
                current_location_id: null,
                health_status: 'healthy',
                emotional_state: 'neutral',
                current_action: null,
                ...blueprint.state // override defaults if blueprint provides them
            },
            meta: {
                creation_turn: 0,
                last_modified: new Date().toISOString(),
                ...blueprint.meta
            }
        };

        try {
            await this.entityManager.createEntity(entity);
            logger.info('EntityInstantiation', `Instantiated imported entity`, { id: entity.entity_id });
            return true;
        } catch (e: any) {
            logger.error('EntityInstantiation', 'Failed to instantiate blueprint', { error: e.message });
            return false;
        }
    }
}
