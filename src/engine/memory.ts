import { SQLiteDB } from '../db/sqlite';
import { VectorDB } from '../db/lancedb';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export interface GameEvent {
    event_id?: string;
    turn_number: number;
    location_id: string;
    observer_id: string;
    action_type: string;
    event_summary: string; // Human readable
    event_data: any;       // Full JSON data
    event_context?: string; // Text to embed
    importance: number; // 0-10
}

export class MemorySystem {
    constructor(
        private sqlite: SQLiteDB,
        private vector: VectorDB
    ) { }

    async logEvent(event: GameEvent) {
        // 1. Prepare Event
        const eventId = event.event_id || uuidv4();
        const timestamp = new Date().toISOString();

        // 2. Write to SQLite (Canonical Log)
        try {
            const stmt = this.sqlite['db'].prepare(`
                INSERT INTO event_log (
                    event_id, turn_number, location_id, observer_id, 
                    action_type, event_data, timestamp
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `);

            stmt.run(
                eventId,
                event.turn_number,
                event.location_id,
                event.observer_id,
                event.action_type,
                JSON.stringify(event.event_data),
                timestamp
            );
        } catch (err: any) {
            logger.error('MemorySystem', 'Failed to write to SQLite', { error: err.message });
            throw err;
        }

        // 3. Write to VectorDB (Semantic Memory)
        try {
            // Ensure context exists for embedding
            const textToEmbed = event.event_context || event.event_summary;

            await this.vector.addEvent({
                event_id: eventId,
                turn_number: event.turn_number,
                observer_id: event.observer_id,
                location_id: event.location_id,
                event_summary: event.event_summary,
                event_context: textToEmbed,
                emotional_valence: event.event_data.valence || 0,
                importance: event.importance,
                timestamp: timestamp
            });
        } catch (err: any) {
            logger.error('MemorySystem', 'Failed to write to VectorDB', { error: err.message });
            // Don't crash game if vector DB fails, just log error? 
            // For strict prototype, maybe throw, but usually RAG failure shouldn't kill app.
        }

        logger.debug('MemorySystem', `Logged event ${eventId}: ${event.event_summary}`);
    }

    async getRelevantMemories(query: string, observerId: string, limit: number = 5): Promise<any[]> {
        logger.debug('MemorySystem', `Retrieving memories for "${query}"`);
        try {
            const results = await this.vector.search(query, observerId, limit);
            return results.map(r => ({
                summary: r.event_summary,
                importance: r.importance,
                turn: r.turn_number,
                dist: r._distance // LanceDB returns distance
            }));
        } catch (err: any) {
            logger.error('MemorySystem', 'Failed to retrieve memories', { error: err.message });
            return [];
        }
    }

    async reset() {
        await this.vector.reset();
    }
}
