
import { PromptManager } from './prompts/prompt_manager';
import { GenreManager } from './genre_manager';
import { GeminiProvider } from '../llm/gemini.provider';
import { logger } from '../utils/logger';
import { getEntityName } from '../utils/entity_helpers';

export interface StartingScenario {
    location: {
        name: string;
        description: string;
        initial_exits: string[];
    };
    entities: {
        name: string;
        type: 'npc' | 'object';
        description: string;
        initial_state: string;
        initial_goal?: string; // Optional for objects, required for NPCs
        personality_traits?: string[]; // Optional for objects, required for NPCs
    }[];
    opening_narrative: string;
}

export class ScenarioGenerator {
    private llmProvider: GeminiProvider;
    private promptManager: PromptManager;
    private genreManager: GenreManager;

    constructor(
        llmProvider: GeminiProvider,
        promptManager: PromptManager,
        genreManager: GenreManager
    ) {
        this.llmProvider = llmProvider;
        this.promptManager = promptManager;
        this.genreManager = genreManager;
    }

    async generateStartingState(
        playerName: string,
        playerBio: string
    ): Promise<StartingScenario> {
        logger.info('ScenarioGenerator', 'Generating dynamic scenario...', { playerName });

        const prompt = this.promptManager.render('SCENARIO_GENESIS', {
            GENRE_PROMPT: this.genreManager.getGenrePrompt(),
            PLAYER_NAME: playerName,
            PLAYER_BIO: playerBio
        });

        try {
            const result = await this.llmProvider.generate(prompt, 'creative', {
                responseFormat: 'json',
                temperature: 0.7 // Higher temp for creative variations
            });

            const text = result.text.replace(/```json/g, '').replace(/```/g, '').trim();
            const scenario = JSON.parse(text) as StartingScenario;

            // Basic validation
            if (!scenario.location || !scenario.entities) {
                throw new Error("Invalid Scenario JSON structure");
            }

            logger.info('ScenarioGenerator', 'Scenario Generated', {
                location: scenario.location.name,
                entityCount: scenario.entities.length
            });

            return scenario;

        } catch (error) {
            logger.error('ScenarioGenerator', 'Failed to generate scenario', { error });
            // Fallback to "Bedroom" if generation fails
            return {
                location: {
                    name: "Bedroom",
                    description: "A standard bedroom. The world generation failed, so you woke up here.",
                    initial_exits: ["Hallway"]
                },
                entities: [],
                opening_narrative: "You wake up in your bedroom. Something went wrong with the dream."
            };
        }
    }

    async generateLocation(targetName: string, context: { genre: string, previousLocation: string }): Promise<any> {
        logger.info('ScenarioGenerator', `Generating new location: ${targetName}`);

        // Reuse the Genesis prompt structure but focused on a specific target
        // We cheat slightly by using SCENARIO_GENESIS but forcing the "Player Bio" to just describe where they are going.
        // A dedicated template would be cleaner, but this works for V4.9.
        const prompt = this.promptManager.render('SCENARIO_GENESIS', {
            GENRE_PROMPT: this.genreManager.getGenrePrompt(),
            PLAYER_NAME: "Traveler",
            PLAYER_BIO: `The protagonist is traveling from ${context.previousLocation} to ${targetName}. Create the destination location.`
        });

        try {
            const result = await this.llmProvider.generate(prompt, 'creative', {
                responseFormat: 'json',
                temperature: 0.7
            });

            const text = result.text.replace(/```json/g, '').replace(/```/g, '').trim();
            const scenario = JSON.parse(text) as StartingScenario;

            // Convert to Entity format expected by EntityManager
            const newLocationEntity = {
                entity_id: `loc_${targetName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`,
                entity_type: 'location',
                name: { display: scenario.location.name },
                description: scenario.location.description,
                state: {
                    initial_exits: scenario.location.initial_exits,
                    generated: true
                }
            };

            // Map NPCs and Objects
            const generatedEntities = scenario.entities.map((ent, idx) => {
                let entDesc = ent.description;
                if (ent.personality_traits && ent.personality_traits.length > 0) {
                    entDesc += ` [Traits: ${ent.personality_traits.join(', ')}]`;
                }

                return {
                    entity_id: `${newLocationEntity.entity_id}_ent_${idx}`,
                    entity_type: ent.type,
                    name: { display: ent.name, first: ent.name.split(' ')[0], known_to_player: false },
                    // Ideally we'd map to { display: ent.name } but let's stick to simple string for core.ts compatibility unless updated
                    description: entDesc,
                    state: {
                        current_location_id: newLocationEntity.entity_id,
                        status: 'active',
                        current_action: ent.initial_state,
                        goals: ent.initial_goal ? [{ description: ent.initial_goal, priority: 'medium', status: 'active', created_at: 0 }] : []
                    }
                };
            });

            return { location: newLocationEntity, entities: generatedEntities };

        } catch (error) {
            logger.error('ScenarioGenerator', 'Failed to generate location', { error });
            return null;
        }
    }
}
