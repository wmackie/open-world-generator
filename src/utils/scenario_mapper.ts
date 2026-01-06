import { CardMetadata } from './png_parser';
import { logger } from './logger';
import { GeminiProvider } from '../llm/gemini.provider';
import { SCENARIO_INGESTION_PROMPT } from '../engine/prompts/scenario_ingestion';

export class ScenarioMapper {
    /**
     * Uses LLM to analyze the card and produce Genre Attribute Overrides.
     */
    static async transformToGenreRules(card: CardMetadata, llm: GeminiProvider): Promise<any> {
        logger.info('ScenarioMapper', `Transforming scenario '${card.data.name}' via LLM...`);

        // 1. Prepare Prompt
        const prompt = SCENARIO_INGESTION_PROMPT
            .replace('{{name}}', card.data.name)
            .replace('{{scenario}}', card.data.scenario || card.data.description || "")
            .replace('{{first_mes}}', card.data.first_mes || "")
            .replace('{{tags}}', JSON.stringify(card.data.tags || []));

        try {
            // 2. Call LLM
            const response = await llm.generate(prompt, "logic");
            let extracted: any = {};
            try {
                // Robust JSON extraction
                const jsonStr = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
                extracted = JSON.parse(jsonStr);
            } catch (pError) {
                logger.warn('ScenarioMapper', 'Raw JSON parse failed', pError);
                extracted = {};
            }

            return extracted;

        } catch (e: any) {
            logger.error('ScenarioMapper', 'LLM Transformation failed', e);
            return {};
        }
    }
}
