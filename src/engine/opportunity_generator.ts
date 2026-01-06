import { ILLMProvider } from '../llm/provider.interface';
import { GeminiProvider } from '../llm/gemini.provider';
import { logger } from '../utils/logger';

export interface Opportunity {
    type: string; // 'conversation' | 'object' | 'person' | 'location' | 'social' | 'information' | 'ambient';
    description: string;
    dramatic_weight: number; // 0.0 - 1.0
    expiration_minutes: number; // Estimated availability duration
    sensory_details?: string; // SPEC 9.5
    severity?: 'MINOR' | 'MODERATE' | 'MAJOR'; // SPEC 9.5
}

export class OpportunityGenerator {
    private llmProvider: ILLMProvider;

    constructor(llmProvider?: ILLMProvider) {
        const apiKey = process.env.GOOGLE_API_KEY || "";
        this.llmProvider = llmProvider || new GeminiProvider(apiKey);
    }

    async generate(context: any): Promise<Opportunity[]> {
        const prompt = `
        You are the Opportunity Generator for an interactive fiction engine.
        Your job is to generate purely optional "hooks" or "ambient events" that the player *could* react to, but doesn't have to.
        
        CURRENT CONTEXT:
        Location: ${context.location.name} - ${context.location.description}
        Time: ${context.time}
        Player Status: ${JSON.stringify(context.player.state)}
        Recent Narrative: "${context.recentNarrative}"
        Active Opportunities: ${JSON.stringify(context.activeOpportunities || [])}
        
        TASK:
        Generate 0-2 potential opportunities that fit this scene.

        QUALITY CRITERIA:
        1. **Plot-Relevant**: Should connect to established narrative threads found in "Recent Narrative" or "Player Status".
           - Look for unfinished business, mysteries, or active quests.
           
        2. **Actionable**: Should suggest clear player actions if engaged.
           
        3. **Escalating**: If similar opportunities were ignored last turn, don't repeat them.

        4. **Sparse**: It's better to generate 0 opportunities than generic ones.

        GENERATION RULES:
        - IF player ignored 2+ similar opportunities: Don't generate more of that type.
        - IF no plot-relevant opportunity exists: Return empty array [].
        - IF Active Opportunities > 3: Return empty array [] (too cluttered).
        - NEVER generate opportunities about NPCs that are already active in scene.

        [EXAMPLES OF GOOD VS BAD]
        GOOD: "A sticky note on the board has fallen partially loose, revealing a phone number beneath."
        WHY: Plot-relevant, specific, actionable.

        BAD: "The metallic tang in the air sharpens near some photos."
        WHY: Vague, no clear action, generic atmosphere.

        GOOD: "A phone buzzes on the table, screen briefly showing 'Urgent Update'."
        WHY: Creates dramatic tension, suggests player could ask about it.

        BAD: "A camera's red light blinks steadily."
        WHY: No narrative significance, just scene clutter.
        
        FORMAT:
        [
            {
                "type": "social",
                "description": "Two patrons arguing about a debt in the corner.",
                "dramatic_weight": 0.6,
                "expiration_minutes": 10
            }
        ]
        `;

        try {
            const response = await this.llmProvider.generate(prompt, 'creative');
            const cleanJson = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
            const opportunities: Opportunity[] = JSON.parse(cleanJson);
            // Validate minimal structure
            return opportunities.filter(op => op.description && op.type && typeof op.expiration_minutes === 'number');
        } catch (error) {
            logger.error('OpportunityGenerator', 'Failed to generate opportunities', { error });
            return []; // Fail gracefully with no opportunities
        }
    }

    async generateAmbient(context: any, severity: 'MINOR' | 'MODERATE' | 'MAJOR'): Promise<Opportunity | null> {
        const prompt = `
You are generating an ambient event for an interactive fiction scene.

SEVERITY: ${severity}
LOCATION: ${context.location.name}
TIME: ${context.time}
CURRENT SITUATION: Player is present. (See narrative context)

Generate an ambient event appropriate to this context and severity level.

SEVERITY GUIDELINES:

MINOR (background detail):
- Doesn't demand attention
- Easily woven into flow
- Examples: rain starts, distant sound, light flickers, wind picks up
- Should feel like natural background texture

MODERATE (noticeable disruption):
- Creates momentary pause or shift
- Noticeable but doesn't force reaction
- Examples: phone rings, lights go out briefly, loud noise, someone walks in
- Can be acknowledged or ignored

MAJOR (demands attention):
- Hard to ignore
- Forces awareness and possible reaction
- Examples: crash outside window, alarm sounds, person in distress, sudden emergency
- Becomes immediate focus of scene

OUTPUT AS JSON:
{
  "description": "brief description of what happens (1-2 sentences)",
  "sensory_details": "what player hears/sees/smells/feels",
  "context_appropriate": true
}

CRITICAL:
- Event must fit the current context (location, time, situation)
- Respect severity level - don't escalate MINOR to MODERATE
- Be specific and concrete, not vague
- Consider what's realistic for this setting and time
- Events should feel organic, not forced

OUTPUT VALID JSON ONLY.
`;

        try {
            const response = await this.llmProvider.generate(prompt, 'creative');
            const cleanJson = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
            const result = JSON.parse(cleanJson);

            if (result && result.description) {
                // Map to Opportunity Interface
                return {
                    type: 'ambient',
                    description: result.description,
                    sensory_details: result.sensory_details,
                    severity: severity,
                    dramatic_weight: severity === 'MAJOR' ? 0.8 : (severity === 'MODERATE' ? 0.4 : 0.1),
                    expiration_minutes: severity === 'MINOR' ? 2 : (severity === 'MODERATE' ? 10 : 30)
                };
            }
            return null;
        } catch (error) {
            logger.warn('OpportunityGenerator', 'Failed to generate ambient event', { error });
            return null;
        }
    }
}
