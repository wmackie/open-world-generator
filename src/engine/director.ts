import { ILLMProvider } from '../llm/provider.interface';
import { logger } from '../utils/logger';

export interface Consequence {
    outcome_type: string;
    mechanic_summary: string; // Renamed from narrative_summary
    probability_weight: number;
    immediate_effects?: string[];
    delayed_effects?: string[];
    world_state_changes?: any;
    duration_minutes?: number; // Added from ConsequenceEngine
    target_reaction?: any;     // Added from 3-Stage Pipeline
    witness_reactions?: any[]; // Added from 3-Stage Pipeline
    tags?: string[];           // Added from Ripple Effects
}

export class Director {
    constructor(private llm: ILLMProvider) { }

    async curateConsequences(candidates: Consequence[]): Promise<Consequence[]> {
        // Spec 9.2 Refactor: "Single Batch Generation" means the input 'candidates' 
        // IS already a curated spectrum from the ConsequenceEngine.
        // We simply pass it through for Selection.
        // Optional: Filter out invalid entries if needed, but ConsistencyEnforcer handles that later.

        logger.info('Director', 'Received Mechanistic Spectrum', { count: candidates.length });
        return candidates;
    }

    selectOutcome(distribution: Consequence[]): Consequence {
        // Weighted random selection
        const totalWeight = distribution.reduce((sum, c) => sum + (c.probability_weight || 1), 0);
        let random = Math.random() * totalWeight;

        for (const consequence of distribution) {
            const weight = consequence.probability_weight || 1;
            if (random < weight) {
                return consequence;
            }
            random -= weight;
        }

        return distribution[distribution.length - 1];
    }

    async populateLocation(location: any): Promise<any[]> {
        logger.info('Director', 'Lazily populating location', { name: location.name });

        const prompt = `
        You are the Set Designer for an interactive fiction game.
        Your task is to populate a new location with interesting, interactive OBJECTS.
        
        LOCATION: "${location.name}"
        DESCRIPTION: "${location.description}"
        
        TASK:
        Generate 3-5 distinct objects that would be found here.
        - Some should be mundane (furniture, trash).
        - Some should be interesting (documents, tools, oddities).
        - At least one should hint at recent activity.
        
        OUTPUT FORMAT (JSON Array):
        [
            {
                "name": "Mahogany Desk",
                "description": "A heavy, scratched mahogany desk covered in papers.",
                "keywords": ["desk", "table"],
                "state": { "searchable": true }
            }
        ]
        
        CRITICAL: 
        - Return VALID JSON ONLY.
        `;

        try {
            const response = await this.llm.generate(prompt, 'creative');
            const cleanJson = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
            const objects = JSON.parse(cleanJson);

            // Hydrate into full Entity format
            return objects.map((obj: any) => ({
                entity_id: `obj_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
                entity_type: 'object',
                name: obj.name,
                description: obj.description,
                state: {
                    current_location_id: location.entity_id,
                    ...obj.state,
                    keywords: obj.keywords || []
                }
            }));

        } catch (error) {
            logger.error('Director', 'Populate location failed', { error });
            return [];
        }
    }
}
