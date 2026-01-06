import * as fs from 'fs';
import * as path from 'path';

export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}

export interface LogEntry {
    timestamp: string;
    level: LogLevel;
    component: string;
    message: string;
    metadata?: any;
}

export class EngineLogger {
    private logFile: string;
    private minLevel: LogLevel;

    constructor(logFile: string, minLevel: LogLevel = LogLevel.INFO) {
        this.logFile = logFile;
        this.minLevel = minLevel;

        const dir = path.dirname(logFile);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    private write(level: LogLevel, component: string, message: string, metadata?: any) {
        if (level < this.minLevel) return;

        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            component,
            message,
            metadata
        };

        fs.appendFileSync(this.logFile, JSON.stringify(entry) + '\n');

        // Also log to console for development visibility, but formatted
        const levelName = LogLevel[level];
        const metaStr = metadata ? JSON.stringify(metadata) : '';
        console.log(`[${entry.timestamp}] [${levelName}] [${component}] ${message} ${metaStr}`);
    }

    debug(component: string, message: string, metadata?: any) {
        this.write(LogLevel.DEBUG, component, message, metadata);
    }

    info(component: string, message: string, metadata?: any) {
        this.write(LogLevel.INFO, component, message, metadata);
    }

    warn(component: string, message: string, metadata?: any) {
        this.write(LogLevel.WARN, component, message, metadata);
    }

    error(component: string, message: string, metadata?: any) {
        this.write(LogLevel.ERROR, component, message, metadata);
    }

    logLLMCall(
        component: string,
        prompt: string,
        response: string,
        metadata: {
            model: string;
            thinkingTokens?: number;
            outputTokens?: number;
            temperature: number;
        }
    ) {
        this.debug(component, 'LLM_CALL', {
            prompt: prompt.substring(0, 500) + '...', // Truncate for log file
            response: response.substring(0, 500) + '...',
            ...metadata
        });
    }
}

// Singleton instance for general usage
export const logger = new EngineLogger(
    path.join(process.cwd(), 'logs', 'engine.log'),
    (process.env.LOG_LEVEL as any) || LogLevel.INFO
);
