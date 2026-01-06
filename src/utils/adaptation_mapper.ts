import { GeminiProvider } from '../llm/gemini.provider';
import { ADAPTATION_PROMPT } from '../engine/prompts/adaptation';
import { logger } from './logger';

export class AdaptationMapper {
    /**
     * Checks compliance and adapts entity if necessary.
     */
    static async ensureCompliance(entity: any, genreRules: any, llm: GeminiProvider): Promise<any> {
        // 1. naive check: If genre allows "Any" or tags match allowed list, skip.
        const allowed = genreRules.meta?.allowed_entities || [];
        const isPermissive = allowed.includes("Any") || allowed.length === 0; // Default to allow if undefined

        if (isPermissive) return entity;

        // Check if any tag matches allowed list (lenient check)
        const tags = entity.tags || [];
        // Add implicit species from name/desc tokens if possible, but for now rely on tags
        const hasMatch = tags.some((t: string) => allowed.map((a: string) => a.toLowerCase()).includes(t.toLowerCase()));

        if (hasMatch) {
            logger.info('AdaptationMapper', `Entity '${entity.name.display}' seems compliant via tags.`, { tags });
            return entity;
        }

        // 2. If no match, Logic: "Unknown" -> Adapt using LLM to be safe/sure.
        logger.info('AdaptationMapper', `Entity '${entity.name.display}' may violate genre. Triggering Adaptation...`);
        return await this.adaptEntity(entity, genreRules, llm);
    }

    private static async adaptEntity(entity: any, genreRules: any, llm: GeminiProvider): Promise<any> {
        const prompt = ADAPTATION_PROMPT
            .replace('{{name}}', entity.name.display)
            .replace('{{description}}', entity.appearance.visuals) // Use visuals as proxy for description if desc is missing on entity object (it's split)
            .replace('{{visuals}}', entity.appearance.visuals)
            .replace('{{tags}}', JSON.stringify(entity.tags || []))
            .replace('{{genre_name}}', genreRules.meta.name)
            .replace('{{genre_tone}}', (genreRules.narrative_flavor?.tone_keywords || []).join(', '))
            .replace('{{allowed_species}}', (genreRules.meta?.allowed_entities || []).join(', '))
            .replace('{{biases}}', JSON.stringify(genreRules.physics?.biases || {}));

        try {
            const response = await llm.generate(prompt, "logic");
            let result: any = {};
            try {
                const jsonStr = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
                result = JSON.parse(jsonStr);
            } catch (pError) {
                logger.warn('AdaptationMapper', 'JSON parse failed', pError);
                return entity; // Fail safe
            }

            if (result.adapted) {
                logger.info('AdaptationMapper', `Adapted Entity: ${result.reasoning}`);
                return {
                    ...entity,
                    appearance: {
                        ...entity.appearance,
                        visuals: result.new_appearance.visuals,
                        impression: result.new_appearance.impression
                    },
                    tags: result.new_tags || entity.tags,
                    // Note: We might want to update a 'description' field if we had one on the entity, 
                    // but Entity struct splits it into appearance.
                };
            }

            return entity;

        } catch (e) {
            logger.error('AdaptationMapper', 'Adaptation failed', e);
            return entity;
        }
    }
}
