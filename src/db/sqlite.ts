import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import { logger } from '../utils/logger';

export class SQLiteDB {
  public db: Database.Database;

  constructor(dbPath: string = path.join(process.cwd(), 'data', 'world.db')) {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.initializeSchema();
    this.runMigrations(); // Added migration step
  }

  private runMigrations() {
    try {
      // Check if 'tags' column exists in relationships
      const tableInfo = this.db.pragma('table_info(relationships)') as any[];
      const hasTags = tableInfo.some(col => col.name === 'tags');

      if (!hasTags) {
        logger.info('SQLiteDB', 'Migrating: Adding tags and history to relationships table');
        this.db.prepare('ALTER TABLE relationships ADD COLUMN tags JSON').run();
        this.db.prepare('ALTER TABLE relationships ADD COLUMN history JSON').run();
      }
    } catch (e) {
      logger.warn('SQLiteDB', 'Migration failed (possibly already exists)', e);
    }
  }

  private initializeSchema() {
    this.db.exec(`
      -- Event Log Table
      CREATE TABLE IF NOT EXISTS event_log (
        event_id TEXT PRIMARY KEY,
        turn_number INTEGER NOT NULL,
        location_id TEXT,
        observer_id TEXT,
        action_type TEXT NOT NULL,
        event_data JSON NOT NULL,
        timestamp TEXT NOT NULL
      );

      -- CRITICAL INDEX: Enables fast "Negative Observation" checks
      CREATE INDEX IF NOT EXISTS idx_negative_observations 
      ON event_log(location_id, turn_number, observer_id);

      -- CRITICAL INDEX: Enables fast NPC action history retrieval
      CREATE INDEX IF NOT EXISTS idx_npc_actions 
      ON event_log(observer_id, turn_number DESC);

      -- CRITICAL INDEX: Enables fast location history queries
      CREATE INDEX IF NOT EXISTS idx_location_timeline 
      ON event_log(location_id, turn_number DESC);

      -- Entity State Table
      CREATE TABLE IF NOT EXISTS entities (
        entity_id TEXT PRIMARY KEY,
        entity_type TEXT NOT NULL,
        entity_data JSON NOT NULL,
        last_modified TEXT NOT NULL
      );

      -- NEW INDEX: Fast lookups by type and location
      CREATE INDEX IF NOT EXISTS idx_entities_by_type 
      ON entities(entity_type);

      CREATE INDEX IF NOT EXISTS idx_entities_by_location 
      ON entities(json_extract(entity_data, '$.state.current_location_id'))
      WHERE entity_type IN ('player', 'npc', 'creature');

      -- Metadata Tracking Table
      CREATE TABLE IF NOT EXISTS simulation_metrics (
        metric_id TEXT PRIMARY KEY,
        turn_number INTEGER NOT NULL,
        total_tokens_used INTEGER NOT NULL,
        total_api_calls INTEGER NOT NULL,
        pipeline_stage_timings JSON NOT NULL, 
        active_entities INTEGER NOT NULL,
        timestamp TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_metrics_timeline 
      ON simulation_metrics(turn_number DESC);
      
      -- Global State (Settings/Metadata)
      CREATE TABLE IF NOT EXISTS global_state (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
      
      -- Relationship Table
      CREATE TABLE IF NOT EXISTS relationships (
          from_entity_id TEXT,
          to_entity_id TEXT,
          type TEXT,
          trust_level TEXT,
          romantic_interest TEXT,
          emotional_tone TEXT,
          status TEXT,
          last_interaction INTEGER,
          major_events JSON,
          tags JSON,
          history JSON,
          PRIMARY KEY (from_entity_id, to_entity_id)
      );

      CREATE INDEX IF NOT EXISTS idx_from ON relationships(from_entity_id);
      CREATE INDEX IF NOT EXISTS idx_to ON relationships(to_entity_id);
    `);

    logger.info('SQLiteDB', 'Schema initialized');
  }

  // Basic CRUD methods
  getOne(table: string, id: string) {
    if (table === 'entities') {
      return this.db.prepare('SELECT * FROM entities WHERE entity_id = ?').get(id);
    }
    return null;
  }

  // Global State (Key-Value)
  setGlobal(key: string, value: string) {
    this.db.prepare('INSERT OR REPLACE INTO global_state (key, value) VALUES (?, ?)').run(key, value);
  }

  getGlobal(key: string): string | null {
    const row = this.db.prepare('SELECT value FROM global_state WHERE key = ?').get(key) as { value: string } | undefined;
    return row ? row.value : null;
  }

  // Fetch recent narrative context for Interpreter
  getRecentNarratives(observerId: string, limit: number = 3): string[] {
    try {
      const rows = this.db.prepare(`
              SELECT event_data FROM event_log 
              WHERE action_type = 'NARRATION'
              ORDER BY turn_number DESC
              LIMIT ?
          `).all(limit);

      return rows.map((r: any) => {
        const data = JSON.parse(r.event_data);
        return data.narrative || "";
      }).reverse();
    } catch (e) {
      logger.error('SQLiteDB', 'Failed to fetch narratives', e);
      return [];
    }
  }

  // Snapshot Logic (Added Turn-Based Save Logic)
  snapshot(gameId: string, turnNumber: number): string {
    const savesDir = path.join(process.cwd(), 'data', 'saves');
    if (!fs.existsSync(savesDir)) {
      fs.mkdirSync(savesDir, { recursive: true });
    }

    const filename = `${gameId}-${turnNumber}.db`;
    const savePath = path.join(savesDir, filename);

    // Delete existing snapshot if it implies an overwrite (Tape Recorder Logic)
    if (fs.existsSync(savePath)) {
      fs.unlinkSync(savePath);
    }

    try {
      this.db.prepare(`VACUUM INTO ?`).run(savePath);
      logger.info('SQLiteDB', `Snapshot created: ${filename}`);
      return savePath;
    } catch (error: any) {
      logger.error('SQLiteDB', `Failed to create snapshot ${filename}`, error);
      throw error;
    }
  }

  // Restore Logic
  restore(gameId: string, turnNumber: number, targetDbPath: string): boolean {
    const savesDir = path.join(process.cwd(), 'data', 'saves');
    const filename = `${gameId}-${turnNumber}.db`;
    const savePath = path.join(savesDir, filename);

    if (!fs.existsSync(savePath)) {
      logger.error('SQLiteDB', `Snapshot not found: ${filename}`);
      return false;
    }

    // Since we're overwriting the database file we are currently using (or about to use),
    // we should ensure no other connections are holding it open if possible.
    // However, explicit file copying usually requires the target to be not locked.
    // The engine's DB connection is separate.

    // Safety check: Close 'this' connection if strict mode? 
    // Usually the caller handles closing the OLD connection before calling restore.

    try {
      // NOTE: Windows might lock checks if WAL mode is active.
      // Ideally, the server should shutdown the engine (closing DB) before this.
      fs.copyFileSync(savePath, targetDbPath);
      logger.info('SQLiteDB', `Restored from ${filename}`);
      return true;
    } catch (e: any) {
      logger.error('SQLiteDB', `Failed to restore ${filename}`, e);
      return false;
    }
  }

  close() {
    if (this.db) {
      this.db.close();
      logger.info('SQLiteDB', 'Database connection closed');
    }
  }
} // End Class
