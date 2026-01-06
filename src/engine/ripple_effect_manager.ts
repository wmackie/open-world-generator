import { SQLiteDB } from '../db/sqlite';
import { logger } from '../utils/logger';
import { Consequence } from './director';

export class RippleEffectManager {
    constructor(private db: SQLiteDB) { }

    async applyRippleEffects(
        turn: number,
        consequences: Consequence[],
        playerId: string,
        target?: any,
        witnesses: any[] = []
    ): Promise<void> {

        const primaryConsequence = consequences[0]; // Assuming main action is first
        if (!primaryConsequence || !primaryConsequence.tags) return;

        const tags = primaryConsequence.tags.map(t => t.toUpperCase());
        logger.info('RippleEffectManager', 'Processing Tags', { tags, turn });

        // 1. VIOLENCE LOGIC
        if (tags.includes('VIOLENCE')) {
            if (target && target.entity_type === 'npc') {
                await this.updateRelationship(playerId, target.entity_id, {
                    trust: 'broken',
                    impression: 'fearful',
                    add_tags: ['witnessed_violence', 'victim_of_violence'],
                    add_history: `Turn ${turn}: Player committed violence against me.`
                });
                await this.createRevengeGoal(target.entity_id, playerId, turn);
            }
            // Witnesses
            for (const witness of witnesses) {
                await this.updateRelationship(playerId, witness.entity_id, {
                    trust: 'distrustful',
                    add_tags: ['witnessed_violence'],
                    add_history: `Turn ${turn}: Witnessed player commit violence.`
                });
            }
        }

        // 2. THEFT LOGIC
        // 2. THEFT LOGIC
        if (tags.includes('THEFT')) {
            if (target && target.entity_type === 'npc') {
                await this.updateRelationship(playerId, target.entity_id, {
                    trust: 'suspicious',
                    add_tags: ['victim_of_theft'],
                    add_history: `Turn ${turn}: Suspected player of left.`
                });
            }
        }
    }

    private async updateRelationship(fromId: string, toId: string, update: { trust?: string, impression?: string, add_tags?: string[], add_history?: string }) {
        // Check if relationship exists
        const row = this.db.db.prepare(
            'SELECT * FROM relationships WHERE from_entity_id = ? AND to_entity_id = ?'
        ).get(toId, fromId) as any;

        let existingTags: string[] = [];
        let existingHistory: string[] = [];

        if (row) {
            if (row.tags) {
                try { existingTags = JSON.parse(row.tags); } catch (e) { }
            }
            if (row.history) {
                try { existingHistory = JSON.parse(row.history); } catch (e) { }
            }
        }

        // Apply Updates
        if (update.add_tags) {
            for (const t of update.add_tags) {
                if (!existingTags.includes(t)) existingTags.push(t);
            }
        }

        if (update.add_history) {
            existingHistory.push(update.add_history);
        }

        // Determine new values (coalesce with existing)
        const newTrust = update.trust !== undefined ? update.trust : (row?.trust_level || 'neutral');
        const newImpression = update.impression !== undefined ? update.impression : (row?.status || 'neutral'); // Mapping status to impression for now if needed

        // Update or Insert
        this.db.db.prepare(`
            INSERT OR REPLACE INTO relationships (from_entity_id, to_entity_id, trust_level, status, tags, history)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(
            toId,
            fromId,
            newTrust,
            newImpression,
            JSON.stringify(existingTags),
            JSON.stringify(existingHistory)
        );

        logger.info('RippleEffectManager', `Updated relationship`, { npc: toId, trust: newTrust, tags: update.add_tags });
    }

    private async createRevengeGoal(npcId: string, targetId: string, turn: number) {
        // Fetch NPC
        const row = this.db.db.prepare('SELECT entity_data FROM entities WHERE entity_id = ?').get(npcId) as any;
        if (!row) return;

        const npc = JSON.parse(row.entity_data);
        if (!npc.state) npc.state = {};
        if (!npc.state.goals) npc.state.goals = {};
        if (!npc.state.active_goals) npc.state.active_goals = [];

        // Check if already has revenge goal
        const hasRevenge = Object.values(npc.state.goals).some((g: any) => g.type === 'REVENGE' && g.target === targetId);
        if (hasRevenge) return;

        const goalId = `goal_revenge_${turn}_${Math.floor(Math.random() * 1000)}`;
        const goal = {
            id: goalId,
            type: 'REVENGE',
            target: targetId,
            status: 'active',
            priority: 'high',
            created_at_turn: turn,
            duration_est: 60 * 24 // 24 hours
        };

        npc.state.goals[goalId] = goal;
        npc.state.active_goals.push(goalId);

        // Update DB
        this.db.db.prepare('UPDATE entities SET entity_data = ? WHERE entity_id = ?')
            .run(JSON.stringify(npc), npcId);

        logger.info('RippleEffectManager', `Created Revenge Goal`, { npc: npcId, goalId });
    }
}
