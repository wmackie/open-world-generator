import { GeminiProvider } from '../llm/gemini.provider';
import { logger } from '../utils/logger';
import { GenreManager } from './genre_manager';
import { PromptManager } from './prompts/prompt_manager';

export interface PlausibilityResult {
    plausible: boolean;
    refusal?: string; // Reason for refusal (e.g., "That violates the laws of physics.")
}

export class PlausibilityChecker {
    private llm: GeminiProvider;
    private genreManager: GenreManager;
    private promptManager: PromptManager;

    constructor(apiKey: string, genreManager: GenreManager, promptManager: PromptManager) {
        this.llm = new GeminiProvider(apiKey);
        this.genreManager = genreManager;
        this.promptManager = promptManager;
    }

    async checkAction(action: string, context: any, npcs: any[] = [], objects: any[] = []): Promise<PlausibilityResult> {

        // Construct detailed entity list for context
        const entityList = [...npcs, ...objects].map(e => {
            return `${e.name?.display || e.name} (${e.entity_type})`;
        }).join(', ') || "None"; // Default to None if empty

        // Construct dynamic prompt
        const prompt = this.promptManager.render('PLAUSIBILITY_CHECK', {
            GENRE_PROMPT: this.genreManager.getGenrePrompt(),
            INPUT: action,
            LOCATION_NAME: context.location ? context.location.name : 'Unknown Location',
            ENTITY_LIST: entityList,
            INVENTORY: (context.player && context.player.state && context.player.state.inventory) ? context.player.state.inventory.join(', ') : 'None',
            STATUS: context.player?.state?.health_status || 'Healthy',
            EMOTIONAL_STATE: context.player?.state?.emotional_state || 'Stable',
            CONSTRAINTS: (context.player?.constraints && context.player.constraints.length > 0) ? context.player.constraints.join(', ') : 'None'
        });


        try {
            const result = await this.llm.generate(prompt, 'logic', {
                responseFormat: 'json',
                temperature: 0.1
            });
            const text = result.text.replace(/```json/g, '').replace(/```/g, '').trim();
            const response = JSON.parse(text);

            return {
                plausible: response.plausible,
                refusal: response.refusal
            };
        } catch (error) {
            logger.error('PlausibilityChecker', 'Failed to validate action', { error });
            // Fail safe: Allow it if we can't check, or maybe default to valid to avoid blocking valid play?
            // "Innocent until proven guilty"
            return { plausible: true };
        }
    }
}
