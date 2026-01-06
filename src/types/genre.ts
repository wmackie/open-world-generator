import { z } from 'zod';

export const GenreSchema = z.object({
    meta: z.object({
        name: z.string(),
        description: z.string(),
        defining_criteria: z.array(z.string()),
        is_earth_based: z.boolean(),
        worldview: z.string()
    }),
    physics: z.object({
        technology_level: z.string(),
        supernatural_rules: z.string(),
        biases: z.object({
            mundanity: z.number().min(0).max(1),
            supernatural: z.number().min(0).max(1),
            cinematic_action: z.number().min(0).max(1),
            horror: z.number().min(0).max(1).optional()
        })
    }),
    narrative_flavor: z.object({
        tone_keywords: z.array(z.string()),
        premise_flavors: z.array(z.object({
            name: z.string(),
            description: z.string(),
            keywords: z.array(z.string())
        })),
        atmosphere_defaults: z.record(z.string(), z.string())
    }),
    allowed_entities: z.object({
        sentient_species: z.array(z.string()).default(['human']),
        flora_fauna: z.string().default('real-world'),
        item_technology: z.string().default('contemporary')
    }).optional()
});

export type GenreRules = z.infer<typeof GenreSchema>;
