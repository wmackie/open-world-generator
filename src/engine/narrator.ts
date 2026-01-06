import { ILLMProvider } from '../llm/provider.interface';
import { logger } from '../utils/logger';

import { PromptManager } from './prompts/prompt_manager';

export class Narrator {
    private llmProvider: ILLMProvider;
    private promptManager: PromptManager;

    constructor(llmProvider: ILLMProvider, promptManager: PromptManager) {
        this.llmProvider = llmProvider;
        this.promptManager = promptManager;
    }

    async generateNarration(
        consequence: any,
        playerInput: string,
        worldContext: any,
        tone: string = "neutral", // Default tone
        ambientEvent?: any // Optional Ambient Event (Spec 9.5)
    ): Promise<string> {

        logger.info('Narrator', 'Generating narration', { tone, outcome: consequence.outcome_type, ambient: !!ambientEvent });

        // Check if consequence is a simple string (fallback/error)
        if (typeof consequence === 'string') {
            return consequence;
        }


        // Construct Ambient Event Block if present
        let ambientBlock = "";
        if (ambientEvent) {
            ambientBlock = `
[AMBIENT EVENT TO WEAVE IN]
Description: ${ambientEvent.description}
Sensory Details: ${ambientEvent.sensory_details}
Severity: ${ambientEvent.severity}

Integration guidelines by severity:
- MINOR: Brief mention, background detail, doesn't interrupt flow.
- MODERATE: Noticeable detail, creates momentary disruption but player can continue.
- MAJOR: Demands attention, hard to ignore, becomes focus of immediate scene.

Weave this event naturally into the prose. Match the severity!
             `.trim();
        }

        // --- Data Flow Fix: Construct CAST LIST ---
        // Iterate through NPCs in context to find voice/style data
        let castList = "None";
        if (worldContext.npcs && Array.isArray(worldContext.npcs) && worldContext.npcs.length > 0) {
            const castLines = worldContext.npcs.map((npc: any) => {
                const name = (typeof npc.name === 'string' ? npc.name : (npc.name?.display || npc.name?.first || "Unknown"));

                // Try to find voice data in various locations (schema drift handling)
                // V5 Schema: speech_style { reference, tone_tags }
                // V4 Schema: voice { style, sample_line }
                // Fallback: description/impression

                let voiceDesc = "";

                if (npc.speech_style) {
                    const ref = npc.speech_style.reference || "None";
                    const tones = npc.speech_style.tone_tags ? npc.speech_style.tone_tags.join(", ") : "";
                    voiceDesc = `Voice Ref: "${ref}" | Tones: [${tones}]`;
                } else if (npc.voice) {
                    const style = npc.voice.style || "Standard";
                    const sample = npc.voice.sample_line ? `Sample: "${npc.voice.sample_line}"` : "";
                    voiceDesc = `Style: "${style}" ${sample}`;
                } else {
                    voiceDesc = `Impression: ${npc.appearance?.impression || "Generic"}`;
                }

                // Check if there's a pending action for this NPC from the Director
                const pendingAction = (worldContext.npcActions || []).find((a: any) => a.npc_id === npc.entity_id);
                const actionDesc = pendingAction ? pendingAction.description : (npc.state?.current_action?.description || "Idle");

                return `- ${name} (Status: ${npc.state?.status || "Normal"} | Action: ${actionDesc}): ${voiceDesc}`;
            });
            castList = castLines.join("\n");
        }

        const prompt = this.promptManager.render('NARRATION_MAIN', {
            TONE: tone,
            INPUT: playerInput,
            OPPORTUNITIES: worldContext.opportunities ? JSON.stringify(worldContext.opportunities) : "None",
            CAST_LIST: castList, // NEW: Inject voice data
            AMBIENT_EVENT_BLOCK: ambientBlock,
            OUTCOME_TYPE: consequence.outcome_type,
            MECHANIC_SUMMARY: consequence.mechanic_summary,
            IMMEDIATE_EFFECTS: (consequence.immediate_effects || []).join(", "),
            ENTITIES_INVOLVED: (consequence.affected_entities || []).map((e: string) => e === 'Agent Cipher' ? 'YOU (The Protagonist)' : e).join(", "),
            location: worldContext.location, // For Scene Bundle
            time: worldContext.time,
            NPC_ACTIONS: (worldContext.npcActions && Array.isArray(worldContext.npcActions) && worldContext.npcActions.length > 0)
                ? worldContext.npcActions.map((a: any) => `[${a.action_type}] ${a.npc_name}: "${a.description}" ${a.dialogue ? `(Says: "${a.dialogue}")` : ''}`).join('\n')
                : "None"
        });

        try {
            // SPECIAL CASE: Nonsensical/Impossible Actions
            if (consequence.outcome_type === 'nonsensical' || consequence.outcome_type === 'impossible') {
                // Use a simpler prompt for rejection
                const rejectionPrompt = this.promptManager.render('NARRATION_REJECTION', {
                    INPUT: playerInput,
                    REASON: consequence.mechanic_summary
                });
                const rejection = await this.llmProvider.generate(rejectionPrompt, 'creative');
                const text = rejection.text.trim();
                logger.info('Narrator', 'Generated Rejection', { text });
                return text;
            }

            const response = await this.llmProvider.generate(prompt, 'creative');
            const finalProse = response.text.trim();

            // LOGGING: Log the final narrative output
            logger.info('Narrator', 'Generated Prose', { preview: finalProse.substring(0, 100) + "..." });

            return finalProse;
        } catch (error) {
            logger.error('Narrator', 'Failed to generate narration', { error });
            // Fallback to the summary if generation fails
            return consequence.mechanic_summary;
        }
    }
}
