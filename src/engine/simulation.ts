import { EntityManager } from './managers';
import { logger } from '../utils/logger';

// IMPORTANT: All goal.duration_est values are in MINUTES
// Do not use hours anywhere in the simulation system
export interface SimulationResult {
    interrupt?: {
        reason: string;
        timeElapsed: number;
    };
    completedGoals: any[];
}

export class SimulationManager {
    constructor(private entityManager: EntityManager) { }

    async advanceTime(minutesToAdvance: number, currentTime: number): Promise<SimulationResult> {
        // Fix: Treat inputs as minutes, not hours.
        logger.info('SimulationManager', `Advancing time by ${minutesToAdvance} minutes from ${currentTime}`);

        // 1. Get Active NPCs
        const allEntities = this.entityManager['db']['db'].prepare('SELECT entity_data FROM entities WHERE entity_type = ?').all('npc') as any[];
        const npcs = allEntities.map(r => JSON.parse(r.entity_data)).filter(npc =>
            npc.state?.active_goals && npc.state.active_goals.length > 0
        );

        let actualTimeElapsed = minutesToAdvance;
        const completedGoals = [];
        let interrupt = undefined;

        let earliestInterruptTime = Infinity;
        let interruptReason = "";

        // 2. Event-Driven Loop
        for (const npc of npcs) {
            if (!npc.state.goals) continue;

            for (const goalId of npc.state.active_goals) {
                const goal = npc.state.goals[goalId];
                if (!goal || goal.status !== 'active') continue;

                // Estimate completion time (assuming duration_est is in minutes now)
                const startTime = goal.started_at || currentTime;
                const duration = goal.duration_est || 10; // Default 10 mins
                const finishTime = startTime + duration;

                if (finishTime <= currentTime + minutesToAdvance) {
                    // Goal completes during this window!
                    logger.info('SimulationManager', `NPC ${npc.name} completed goal ${goalId} at t=${finishTime}`);

                    // Update Goal Logic
                    goal.status = 'completed';
                    goal.completed_at = finishTime;

                    // Remove from active
                    npc.state.active_goals = npc.state.active_goals.filter((id: string) => id !== goalId);

                    // Persist NPC
                    this.entityManager.updateEntity(npc.entity_id, npc);

                    completedGoals.push({ npc: npc.name, goal: goalId });

                    // Interrupt Logic:
                    // If this event happens BEFORE our current 'actualTimeElapsed', it cuts the action short.
                    // For now, treat ALL NPC goal completions as potential interrupts (e.g. someone walks in).
                    // In real system, we'd check if (goal.type === 'INTERRUPT' || npc.location === player.location).

                    if (finishTime < currentTime + actualTimeElapsed) {
                        // We found a new earliest interrupt
                        earliestInterruptTime = finishTime;
                        actualTimeElapsed = finishTime - currentTime;
                        interruptReason = `NPC ${npc.name} completed ${goalId}`;
                        interrupt = {
                            reason: interruptReason,
                            timeElapsed: actualTimeElapsed
                        };
                    }
                }
            }
        }

        return {
            completedGoals,
            interrupt
        };
    }
}
