import { CardMetadata } from './png_parser';
import { logger } from './logger';
import { GeminiProvider } from '../llm/gemini.provider';
import { CARD_INGESTION_PROMPT } from '../engine/prompts/card_ingestion';

export class EntityMapper {
    /**
     * Uses LLM to deeply analyze the card and produce a schema-compliant Entity.
     */
    static async transformToEntity(card: CardMetadata, llm: GeminiProvider): Promise<any> {
        logger.info('EntityMapper', `Transforming card '${card.data.name}' via LLM...`);

        // 1. Prepare Prompt
        const prompt = CARD_INGESTION_PROMPT
            .replace('{{name}}', card.data.name)
            .replace('{{description}}', card.data.description || "")
            .replace('{{mes_example}}', card.data.mes_example || "")
            .replace('{{first_mes}}', card.data.first_mes || "")
            .replace('{{scenario}}', card.data.scenario || "")
            .replace('{{tags}}', JSON.stringify(card.data.tags || []));

        try {
            // 2. Call LLM
            const response = await llm.generate(prompt, "logic");
            let extracted: any = {};
            try {
                // Robust JSON extraction (strip markdown)
                const jsonStr = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
                extracted = JSON.parse(jsonStr);
            } catch (pError) {
                logger.warn('EntityMapper', 'Raw JSON parse failed, trying partial recovery or fallback');
                extracted = {};
            }

            // 3. Merge with Basic Data
            const visuals = extracted.appearance?.visuals || (card.data.description ? card.data.description.substring(0, 100) + "..." : "A mysterious figure.");
            const impression = extracted.appearance?.impression || (card.data.tags ? card.data.tags.join(', ') : "Unknown");

            return {
                name: {
                    first: card.data.name.split(' ')[0],
                    display: card.data.name,
                    known_to_player: false
                },
                appearance: {
                    visuals: visuals,
                    impression: impression
                },
                voice: extracted.voice || {
                    reference: "Standard",
                    tone_tags: [],
                    mannerisms: []
                },
                psychology: extracted.psychology,
                moral_compass: extracted.moral_compass,
                tags: card.data.tags || []
            };

        } catch (e: any) {
            logger.error('EntityMapper', 'LLM Transformation failed, falling back to heuristic.', e);
            return this.mapToEntity(card);
        }
    }

    /**
     * Uses LLM to deeply analyze the card and produce a Player Profile.
     */
    static async transformToPlayerProfile(card: CardMetadata, llm: GeminiProvider): Promise<any> {
        // For now, allow the same prompt to extract the data, but map it to profile structure
        // In future, a specific Player Profile prompt might be better
        // But the Schema extraction (Capabilities, Psychology) is reusable.

        const entityData = await this.transformToEntity(card, llm);

        return {
            capabilities: {
                perception: 'average', // TODO: Extract from Capabilities text if added to prompt
                endurance: 'average',
                combat: 'competent',
                social: 'average'
            },
            traits: [...(card.data.tags || []), ...(entityData.psychology?.social_strategy ? [entityData.psychology.social_strategy] : [])],
            inventory: [],
            health_status: 'healthy',
            emotional_state: entityData.psychology?.motivation || 'determined'
        };
    }

    /**
     * Maps a Card to a partial Entity object (Heuristic Fallback).
     */
    static mapToEntity(card: CardMetadata): any {
        logger.info('EntityMapper', `Mapping card '${card.data.name}' to Entity (Heuristic)`);

        const visuals = card.data.description ? card.data.description.substring(0, 100) + "..." : "A mysterious figure.";

        return {
            name: {
                first: card.data.name.split(' ')[0],
                display: card.data.name,
                known_to_player: false
            },
            appearance: {
                visuals: visuals,
                impression: card.data.tags ? card.data.tags.join(', ') : "Unknown"
            },
            voice: {
                reference: "Standard",
                tone_tags: [],
                mannerisms: []
            },
            tags: card.data.tags || []
        };
    }

    static mapToPlayerProfile(card: CardMetadata): any {
        // Heuristic Fallback
        return {
            capabilities: { perception: 'average', endurance: 'average', combat: 'novice', social: 'average' },
            traits: card.data.tags || ['adventurous'],
            inventory: [],
            health_status: 'healthy',
            emotional_state: 'determined'
        };
    }
}
