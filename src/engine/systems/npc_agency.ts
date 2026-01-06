
import { ILLMProvider } from '../../llm/provider.interface';
import { getEntityName } from '../../utils/entity_helpers';
import { PromptManager } from '../prompts/prompt_manager';
import { logger } from '../../utils/logger';
import { EntityManager } from '../managers';

export interface NPCAction {
    npc_id: string;
    npc_name: string;
    action_type: 'REACTIVE' | 'PROACTIVE' | 'IDLE';
    description: string;
    dialogue?: string | null;
    target_id?: string | null;
    goal_progress?: string; // Justification for action
}

interface GoalUpdate {
    npc_id: string;
    goal_id: string;
    new_status: 'active' | 'completed' | 'failed' | 'abandoned';
    new_goal_description?: string;
}

export class NPCAgencySystem {
    constructor(
        private llm: ILLMProvider,
        private promptManager: PromptManager,
        private entityManager: EntityManager
    ) { }

    /**
     * Resolves the "Turn" for all NPCs in the scene using a single batch prompt.
     */
    async resolveAgencyTurn(
        locationName: string,
        playerAction: string,
        playerInput: string,
        actionOutcome: string,
        npcs: any[],
        npcTriggers?: any[] // [DIRECTOR v2] New Parameter
    ): Promise<NPCAction[]> {

        // 1. Filter viable (active) NPCs
        const activeNPCs = npcs.filter(n => n.state?.status !== 'Unconscious' && n.state?.status !== 'Dead');
        if (activeNPCs.length === 0) return [];

        // 2. Build Roster String
        const roster = activeNPCs.map(npc => {
            const name = getEntityName(npc);

            const status = npc.state?.status || "Active";
            const currentAction = npc.state?.current_action?.description || "Idle";

            // Extract Goals & History
            const motivation = npc.psychology?.motivation || "Unknown";
            const goals = (npc.goals || []).filter((g: any) => g.status === 'active').map((g: any) => `"${g.description}"`).join(', ') || "None";
            const recentHistory = (npc.memories || []).join('\n') || "None";

            // Extract Relationship with Player
            const playerId = (this.entityManager as any).playerId || 'player';
            let rels = npc.relationships;
            if (typeof rels === 'string') { try { rels = JSON.parse(rels); } catch { rels = []; } }
            if (!Array.isArray(rels)) rels = [];
            const playerRel = rels.find((r: any) => r.entity_id === playerId);
            const relString = playerRel
                ? `Trust: ${playerRel.trust}, Impression: "${playerRel.impression}", Tags: [${playerRel.tags.join(', ')}]`
                : "Neutral (Unknown)";

            // [DIRECTOR NOTE INJECTION]
            let directorNote = "";
            if (npcTriggers) {
                const trigger = npcTriggers.find(t => t.npc_id === npc.entity_id);
                if (trigger) {
                    directorNote = `\n  [DIRECTOR NOTE]: MUST RESPOND! Reason: ${trigger.trigger_reason}`;
                }
            }

            return `- [${name}] (Status: ${status}, Doing: ${currentAction})\n  Motivation: ${motivation}\n  Current Goals: ${goals}\n  Relationship to Player: ${relString}\n  Recent History: ${recentHistory}${directorNote}`;
        }).join('\n\n');

        // 3. Render Prompt
        const prompt = this.promptManager.render('NPC_AGENCY_TURN', {
            LOCATION_NAME: locationName,
            PLAYER_ACTION_SUMMARY: playerAction,
            PLAYER_INPUT: playerInput,
            ACTION_OUTCOME: actionOutcome,
            NPC_LIST: roster,
            location: { name: locationName }
        });

        logger.info('NPCAgencySystem', `Resolving Agency Turn for ${activeNPCs.length} NPCs`, { location: locationName });

        try {
            const response = await this.llm.generate(prompt, 'logic', { // Logic or Creative? 
                temperature: 0.7,
                responseFormat: 'json'

            });

            let cleanText = response.text.trim();
            if (cleanText.startsWith('```json')) cleanText = cleanText.replace(/```json/g, '').replace(/```/g, '');

            const result = JSON.parse(cleanText);
            const actions = result.npc_actions || [];

            // Meaningful Actions
            const meaningfulActions = actions.filter((a: NPCAction) => a.action_type !== 'IDLE');

            logger.info('NPCAgencySystem', `Agency Resolution Complete`, {
                count: meaningfulActions.length,
                actions: meaningfulActions.map((a: any) => `${a.npc_name}: ${a.action_type} [${a.goal_progress || 'No logic'}]`)
            });

            const goalUpdates = result.goal_updates || [];
            if (goalUpdates.length > 0) {
                this.processGoalUpdates(goalUpdates);
            }

            return meaningfulActions;

        } catch (error: any) {
            logger.error('NPCAgencySystem', 'Resolution Failed', { error: error.message });
            return [];
        }
    }

    private processGoalUpdates(updates: GoalUpdate[]) {
        for (const update of updates) {
            try {
                const npc = this.entityManager.getEntity(update.npc_id);
                if (!npc || npc.entity_type !== 'npc') continue;

                let goals = npc.goals || [];
                const existingGoalIndex = goals.findIndex((g: any) => g.id === update.goal_id);

                if (existingGoalIndex >= 0) {
                    // Update Existing
                    goals[existingGoalIndex].status = update.new_status;
                    logger.debug('NPCAgencySystem', `Updated Goal for ${npc.name.display}`, { goal: update.goal_id, status: update.new_status });
                } else if (update.new_goal_description) {
                    // Create New
                    goals.push({
                        id: update.goal_id,
                        description: update.new_goal_description,
                        priority: 'medium', // Default
                        created_turn: 0, // Need accurate turn count? For now use 0 or Todo
                        status: 'active'
                    });
                    logger.debug('NPCAgencySystem', `Created Goal for ${npc.name.display}`, { goal: update.new_goal_description });
                }

                this.entityManager.updateEntity(update.npc_id, { goals });

            } catch (err) {
                logger.error('NPCAgencySystem', `Failed to update goal for ${update.npc_id}`, { error: err });
            }
        }
    }
}
