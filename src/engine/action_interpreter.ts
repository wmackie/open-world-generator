
import { GeminiProvider } from '../llm/gemini.provider';
import { ILLMProvider } from '../llm/provider.interface'; // NEW
import { logger } from '../utils/logger';

export interface EntityReference {
    mentioned_as: string;
    entity_name: string;
    entity_id: string;
    entity_type: 'npc' | 'item' | 'location' | 'other';
    confidence: number;
}

export interface AmbiguityOption {
    interpretation: string;
    entities: { name: string; entity_id: string }[];
    confidence: number;
}

export interface ActionInterpretation {
    understanding: 'CLEAR' | 'AMBIGUOUS' | 'GIBBERISH';
    normalized_input: string; // Was action_intent
    complexity?: 'TRIVIAL' | 'NORMAL' | 'COMPLEX'; // New Field

    // For CLEAR
    referenced_entities?: EntityReference[];

    // For AMBIGUOUS
    ambiguity_type?: 'UNCLEAR_REFERENCE' | 'MULTIPLE_MATCHES' | 'TYPO_SUSPECTED' | 'NONEXISTENT_ENTITY';
    ambiguity_explanation?: string;
    clarification_question?: string;
    possible_interpretations?: AmbiguityOption[];

    // For GIBBERISH
    gibberish_reason?: string;

    // Spec 2.5: Instantiation
    missing_entities?: { descriptor: string; reason: string; plausible: boolean }[];

    // Spec 3.0: Dynamic Travel
    travel_intent?: boolean;
    target_location?: string;
}

import { PromptManager } from './prompts/prompt_manager';

export class ActionInterpreter {
    private llm: ILLMProvider;
    private promptManager: PromptManager;

    constructor(llm: ILLMProvider, promptManager: PromptManager) {
        this.llm = llm;
        this.promptManager = promptManager;
    }

    async interpret(
        input: string,
        context: {
            locationName: string;
            locationDesc?: string; // NEW
            visibleExits: string[];
            npcs: any[];
            objects: any[];
            inventory: string[];
            recentHistory: string[];
        }
    ): Promise<ActionInterpretation> {
        logger.info('ActionInterpreter', `Interpreting input: "${input}"`);

        const prompt = this.promptManager.render('ACTION_INTERPRET', {
            INPUT: input,
            INVENTORY: context.inventory.join(', ') || 'Empty',
            HISTORY: [...new Set(context.recentHistory)].slice(-3).join('\n') || 'None',
            LOCATION_DESC: context.locationDesc || "Unknown Location Description",
            // Pass raw context for Scene Bundle
            locationName: context.locationName,
            locationDesc: context.locationDesc, // NEW
            visibleExits: context.visibleExits,
            npcs: context.npcs,
            objects: context.objects
        });

        try {
            const response = await this.llm.generate(prompt, 'logic', {
                responseFormat: 'json',
                temperature: 0.1 // Lowered temp for rule adherence
            });
            logger.info('ActionInterpreter', `Raw LLM Response: ${response.text}`); // DEBUG
            const parsed = JSON.parse(response.text) as ActionInterpretation;
            if (parsed.missing_entities && parsed.missing_entities.length > 0) {
                logger.info('ActionInterpreter', `Detailed Missing Entities`, { missing: parsed.missing_entities });
            }
            return parsed;
        } catch (error) {
            logger.error('ActionInterpreter', 'Failed to interpret action', error);
            // Fallback to treating as clear but unparsed, or throw? 
            // Better to fail safe.
            // [FIX] Return gibberish on failure so system knows interpretation failed
            return {
                understanding: 'GIBBERISH',
                normalized_input: input,
                gibberish_reason: 'Failed to parse action - system error'
            };
        }
    }
}
