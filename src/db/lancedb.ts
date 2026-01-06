import * as lancedb from "@lancedb/lancedb";
import * as path from 'path';
import * as fs from 'fs';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from '../utils/logger';
import dotenv from 'dotenv';

dotenv.config();

export class VectorDB {
    private db: lancedb.Connection | null = null;
    private embedModel: any;
    private table: lancedb.Table | null = null;
    private initPromise: Promise<void>;

    private constructor(dbPath: string = path.join(process.cwd(), 'data', 'lancedb')) {
        const dir = path.dirname(dbPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        if (process.env.GOOGLE_API_KEY) {
            const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
            this.embedModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
        } else {
            logger.warn('VectorDB', 'GOOGLE_API_KEY not found in env. Embeddings will fail.');
        }

        this.initPromise = this.initialize(dbPath);
    }

    static async create(dbPath?: string): Promise<VectorDB> {
        const instance = new VectorDB(dbPath);
        await instance.initPromise;
        return instance;
    }

    private async initialize(dbPath: string) {
        const maxRetries = 3;
        let retryCount = 0;

        while (retryCount < maxRetries) {
            try {
                console.log(`[VectorDB] Connecting to ${dbPath} (Attempt ${retryCount + 1})...`);
                this.db = await lancedb.connect(dbPath);
                console.log(`[VectorDB] Connected!`);

                const tableNames = await this.db.tableNames();
                if (!tableNames.includes("event_memory")) {
                    logger.info('VectorDB', 'Creating event_memory table');
                } else {
                    this.table = await this.db.openTable("event_memory");
                }

                // Success!
                return;
            } catch (error: any) {
                retryCount++;
                console.error(`[VectorDB] Init Warning: ${error.message}. Retrying...`);
                logger.error('VectorDB', 'Init attempt failed', { error: error.message, attempt: retryCount });
                // Wait 1 second before retry
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        console.error(`[VectorDB] CRITICAL INIT FAILURE after ${maxRetries} attempts.`);
    }

    async ensureTable() {
        await this.initPromise;
        if (this.table) return;
        if (!this.db) throw new Error("DB not connected");

        const tableNames = await this.db.tableNames();
        if (tableNames.includes("event_memory")) {
            this.table = await this.db.openTable("event_memory");
        }
    }

    async createTable(initialData: any[]) {
        await this.initPromise;
        if (!this.db) throw new Error("DB not connected");
        this.table = await this.db.createTable("event_memory", initialData, { mode: "overwrite" });
    }

    async embedText(text: string): Promise<number[]> {
        if (!this.embedModel) throw new Error("Embedding model not initialized");
        const result = await this.embedModel.embedContent(text);
        return result.embedding.values;
    }

    async search(queryText: string, observerId: string, limit: number = 10): Promise<any[]> {
        await this.ensureTable();
        if (!this.table) return [];

        const vector = await this.embedText(queryText);
        const results = await this.table.vectorSearch(vector)
            .where(`observer_id = '${observerId}'`)
            .limit(limit)
            .toArray();

        return results;
    }

    async addEvent(event: any) {
        await this.initPromise;
        if (!this.db) return;

        // Calculate embedding if not present
        if (!event.vector && event.event_context) {
            event.vector = await this.embedText(event.event_context);
        }

        if (!this.table) {
            await this.createTable([event]);
        } else {
            await this.table.add([event]);
        }
    }
    async reset() {
        await this.initPromise;
        if (!this.db) return;
        try {
            const tableNames = await this.db.tableNames();
            if (tableNames.includes("event_memory")) {
                logger.info('VectorDB', 'Dropping event_memory table for reset');
                await this.db.dropTable("event_memory");
                this.table = null;
            }
        } catch (error: any) {
            logger.error('VectorDB', 'Failed to reset', { error: error.message });
        }
    }
}
