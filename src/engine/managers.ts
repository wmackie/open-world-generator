import { SQLiteDB } from '../db/sqlite';
import { Entity, EntitySchema } from '../types/schemas';
import { logger } from '../utils/logger';
import { getEntityName } from '../utils/entity_helpers';

export class EntityManager {
    constructor(private db: SQLiteDB) { }

    createEntity(entity: Entity): void {
        // [FIX] Validate schema before write to prevent corruption
        // Note: Using passthrough() or loose validation might be safer for prototype iterating if Zod is too strict,
        // but recommendation was to parse.
        // EntitySchema is a union, so parse should handle it.

        /* 
           NOTE: We use a try/catch or safeParse normally, but the request was:
           const validated = EntitySchema.parse(entity);
        */
        let processedEntity = entity;
        try {
            // We can't strictly enforce it if strict schema doesn't match prototype flux.
            // But let's try. If it throws, it saves us from bad data.
            processedEntity = EntitySchema.parse(entity) as Entity;
        } catch (e) {
            logger.warn('EntityManager', `Schema Validation Failed for ${entity.entity_id}`, { error: e });
            // For now, in prototype, maybe we don't block? 
            // The recommendation said "Throws if invalid". So we throw.
            throw e;
        }

        const stmt = this.db['db'].prepare(`
      INSERT OR REPLACE INTO entities (entity_id, entity_type, entity_data, last_modified)
      VALUES (?, ?, ?, ?)
    `);

        stmt.run(
            processedEntity.entity_id,
            processedEntity.entity_type,
            JSON.stringify(processedEntity),
            new Date().toISOString()
        );
        logger.debug('EntityManager', `Created entity ${processedEntity.entity_id}`);
    }

    getEntity(entityId: string): Entity | null {
        const row = this.db['db'].prepare('SELECT entity_data FROM entities WHERE entity_id = ?').get(entityId) as any;
        if (!row) return null;
        return JSON.parse(row.entity_data);
    }

    updateEntity(entityId: string, updates: Partial<Entity>): void {
        const current = this.getEntity(entityId);
        if (!current) throw new Error(`Entity ${entityId} not found`);

        const updated = { ...current, ...updates }; // Deep merge might be needed for real app

        this.db['db'].prepare(`
      UPDATE entities 
      SET entity_data = ?, last_modified = ?
      WHERE entity_id = ?
    `).run(
            JSON.stringify(updated),
            new Date().toISOString(),
            entityId
        );
    }
    getEntitiesInLocation(locationId: string): Entity[] {
        // This is inefficient (scan all), but fine for prototype with SQLite JSON
        // Better: Use the index we created in Phase 0 on 'current_location_id'
        // But we are storing JSON blob, so we rely on the index creation SQL
        // modifying the query to use json_extract

        const rows = this.db['db'].prepare(`
            SELECT entity_data 
            FROM entities 
            WHERE json_extract(entity_data, '$.state.current_location_id') = ?
        `).all(locationId) as any[];

        return rows.map(r => JSON.parse(r.entity_data));
    }
    getAllEntityNames(): { id: string, name: string, type: string }[] {
        const rows = this.db['db'].prepare('SELECT entity_id, entity_type, entity_data FROM entities WHERE entity_type IN (?, ?)').all('npc', 'creature') as any[];
        return rows.map(r => {
            const data = JSON.parse(r.entity_data);
            const name = getEntityName(data);
            return { id: r.entity_id, name: name, type: r.entity_type };
        });
    }

    exists(entityId: string): boolean {
        const row = this.db['db'].prepare('SELECT 1 FROM entities WHERE entity_id = ?').get(entityId);
        return !!row;
    }

    findEntitiesByName(name: string): Entity[] {
        // SQLite doesn't have great fuzzy search by default without FTS5, but we can do case-insensitive LIKE
        // We check both 'name' (simple string) and 'name.display' (complex object)
        const lowerName = name.toLowerCase();

        // This query checks:
        // 1. entity_data.name IS the string
        // 2. entity_data.name.display IS the string
        // Using json_extract

        const rows = this.db['db'].prepare(`
            SELECT entity_data 
            FROM entities 
            WHERE 
                LOWER(json_extract(entity_data, '$.name')) = ? 
                OR 
                LOWER(json_extract(entity_data, '$.name.display')) = ?
        `).all(lowerName, lowerName) as any[];

        return rows.map(r => JSON.parse(r.entity_data));
    }
}

export class LocationManager {
    constructor(private entityManager: EntityManager) { }

    // Initial simple implementation - just checks if connected
    canMove(fromId: string, toId: string): boolean {
        const fromLoc = this.entityManager.getEntity(fromId);
        if (!fromLoc || fromLoc.entity_type !== 'location') return false;

        return fromLoc.connected_location_ids.includes(toId);
    }

    getDescription(locationId: string): string {
        const loc = this.entityManager.getEntity(locationId);
        if (!loc || loc.entity_type !== 'location') return "Unknown location";
        return loc.description;
    }
}
