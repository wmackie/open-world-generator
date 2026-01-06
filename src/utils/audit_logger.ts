import * as fs from 'fs';
import * as path from 'path';

export interface AuditEntry {
    timestamp: string;
    game_id: string;
    turn: number;
    type: 'llm_request' | 'llm_response' | 'context_snapshot' | 'user_input';
    component: string;
    data: any; // The full JSON object or string
}

export class AuditLogger {
    private logFile: string;
    private gameId: string;

    constructor(gameId: string) {
        this.gameId = gameId;
        const dir = path.join(process.cwd(), 'audit_logs');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        // One file per game session
        this.logFile = path.join(dir, `audit_${gameId}.jsonl`);
    }

    private write(type: AuditEntry['type'], component: string, data: any, turn: number = 0) {
        const entry: AuditEntry = {
            timestamp: new Date().toISOString(),
            game_id: this.gameId,
            turn,
            type,
            component,
            data
        };
        fs.appendFileSync(this.logFile, JSON.stringify(entry) + '\n');
    }

    logLLMRequest(component: string, prompt: string, config: any, turn: number) {
        this.write('llm_request', component, { prompt, config }, turn);
    }

    logLLMResponse(component: string, response: any, metadata: any, turn: number) {
        this.write('llm_response', component, { response, metadata }, turn);
    }

    logContext(component: string, context: any, turn: number) {
        this.write('context_snapshot', component, context, turn);
    }

    logInput(input: string, turn: number) {
        this.write('user_input', 'System', { input }, turn);
    }
}

// Global instance management
let instance: AuditLogger | null = null;

export const initializeAuditLogger = (gameId: string) => {
    instance = new AuditLogger(gameId);
};

export const getAuditLogger = () => {
    if (!instance) {
        // Fallback for tests or uninitialized state
        instance = new AuditLogger('default_session');
    }
    return instance;
};
