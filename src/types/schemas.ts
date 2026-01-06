import { z } from 'zod';

// ===== CORE TYPES =====
export const EngagementLevelSchema = z.enum(['background', 'acquaintance', 'recurring', 'major']);
export const SimulationModeSchema = z.enum(['passive', 'active_tracking']);
export const ProficiencySchema = z.enum(['untrained', 'basic', 'competent', 'expert', 'master']);
export const ActionComplexitySchema = z.enum(['trivial', 'standard', 'critical']);

export const GoalSchema = z.object({
    id: z.string(),
    description: z.string(),
    priority: z.enum(['low', 'medium', 'high', 'critical']),
    created_turn: z.number(),
    status: z.enum(['active', 'completed', 'failed', 'abandoned'])
});

// ===== EVENT KNOWLEDGE =====
export const EventKnowledgeSchema = z.object({
    event_id: z.string(),
    awareness: z.enum(['witnessed', 'heard_gossip', 'participated']),
    impression: z.string(),
    learned_turn: z.number(),
});

// ===== CURRENT ACTION TRACKING =====
export const CurrentActionSchema = z.object({
    action_type: z.string(),
    description: z.string(),
    target_id: z.string().optional(),
    start_turn: z.number(),
    duration_turns: z.number(),
    completion_status: z.enum(['in_progress', 'interrupted', 'completed']),
}).nullable();

// ===== METADATA TRACKING =====
export const SimulationMetadataSchema = z.object({
    last_simulated_turn: z.number(),
    total_generation_tokens: z.number(),
    total_api_calls: z.number(),
    last_modified: z.string(),
    creation_turn: z.number(),
    total_player_interactions: z.number(),
});

// ===== SENTIENT FIELDS =====
export const SentientFieldsSchema = z.object({
    is_player: z.boolean(),

    name: z.object({
        first: z.string(),
        display: z.string(),
        known_to_player: z.boolean(),
    }),

    appearance: z.object({
        visuals: z.string(),
        impression: z.string(),
    }),

    voice: z.object({
        reference: z.string(),
        tone_tags: z.array(z.string()),
        mannerisms: z.array(z.string()),
    }).optional(),

    psychology: z.object({
        motivation: z.string(),
        core_wound: z.string().nullable(),
        insecurities: z.array(z.string()),
        social_strategy: z.string(),
    }).optional(),

    moral_compass: z.object({
        virtues: z.array(z.string()),
        vices: z.array(z.string()),
    }).optional(),

    goals: z.array(GoalSchema).default([]),

    simulation_mode: SimulationModeSchema,
    engagement_level: EngagementLevelSchema,
    capabilities: z.record(z.string(), ProficiencySchema).optional(),
    constraints: z.array(z.string()).optional(),

    state: z.object({
        current_location_id: z.string().nullable(),
        health_status: z.string(),
        emotional_state: z.string(),
        current_action: CurrentActionSchema,
    }),

    inventory: z.array(z.string()).optional(),

    relationships: z.array(z.object({
        entity_id: z.string(),
        type: z.string(),
        trust: z.string(),
        impression: z.string(),
        tags: z.array(z.string()).default([]),
        history: z.array(z.string()).default([]),
    })).optional(),

    knowledge: z.array(z.string()).optional(),
    beliefs: z.array(z.string()).optional(),
    memories: z.array(z.string()).optional(),
    event_knowledge: z.union([z.array(EventKnowledgeSchema), z.literal('ALL')]).optional(),

    generated_depth: z.enum(['minimal', 'basic', 'detailed', 'full']),
    generation_context: z.string(),
    autonomous_action_frequency: z.enum(['never', 'low', 'medium', 'high']),

    meta: SimulationMetadataSchema,
});

// ===== OBJECT & LOCATION FIELDS (Placeholder imports for now, implementing basics) =====
export const ObjectFieldsSchema = z.object({
    description: z.string(),
    location_id: z.string().nullable(),
    meta: SimulationMetadataSchema.optional(), // Make optional for now
});

export const LocationFieldsSchema = z.object({
    description: z.string(),
    parent_location_id: z.string().nullable(),
    connected_location_ids: z.array(z.string()),
    meta: SimulationMetadataSchema.optional(),
});


// ===== ENTITY SCHEMA =====
export const EntitySchema = z.union([
    z.intersection(
        z.object({ entity_id: z.string(), entity_type: z.enum(['player', 'npc', 'creature']) }),
        SentientFieldsSchema
    ),
    z.intersection(
        z.object({ entity_id: z.string(), entity_type: z.literal('object'), name: z.string() }),
        ObjectFieldsSchema
    ),
    z.intersection(
        z.object({ entity_id: z.string(), entity_type: z.literal('location'), name: z.string() }),
        LocationFieldsSchema
    ),
]);

export type Entity = z.infer<typeof EntitySchema>;
export type SentientEntity = Extract<Entity, { entity_type: 'player' | 'npc' | 'creature' }>;
