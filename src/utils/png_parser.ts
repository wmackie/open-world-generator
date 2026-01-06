
import * as fs from 'fs';
import { logger } from './logger';

export interface CardMetadata {
    spec: string;
    spec_version: string;
    data: {
        name: string;
        description: string;
        personality?: string;
        first_mes?: string;
        mes_example?: string;
        scenario?: string;
        tags?: string[];
        creator_notes?: string;
        system_prompt?: string;
        post_history_instructions?: string;
        alternate_greetings?: string[];
        extensions?: Record<string, any>;
    };
}

export class PngCardParser {
    static parse(filePath: string): CardMetadata | null {
        try {
            // Handle plain JSON files
            if (filePath.endsWith('.json')) {
                const content = fs.readFileSync(filePath, 'utf-8');
                const json = JSON.parse(content);
                // Normalize (some JSONs have 'data' wrapper, some don't)
                if (json.data) return json as CardMetadata;
                return { spec: 'v2', spec_version: '2.0', data: json } as CardMetadata;
            }

            // Handle PNG files
            const buffer = fs.readFileSync(filePath);
            let offset = 8; // Skip PNG signature

            while (offset < buffer.length) {
                if (offset + 8 > buffer.length) break;

                const length = buffer.readUInt32BE(offset);
                const type = buffer.toString('ascii', offset + 4, offset + 8);

                if (type === 'tEXt') {
                    const data = buffer.subarray(offset + 8, offset + 8 + length);
                    let nullSeparatorIndex = -1;
                    for (let i = 0; i < data.length; i++) {
                        if (data[i] === 0) {
                            nullSeparatorIndex = i;
                            break;
                        }
                    }

                    if (nullSeparatorIndex !== -1) {
                        const keyword = data.toString('ascii', 0, nullSeparatorIndex);
                        const text = data.toString('utf8', nullSeparatorIndex + 1);

                        if (keyword === 'chara') {
                            const decoded = Buffer.from(text, 'base64').toString('utf8');
                            const json = JSON.parse(decoded);
                            // Normalize structure (handle 'data' wrapper vs flat)
                            if (json.data) return json as CardMetadata;
                            return { spec: 'v2', spec_version: '2.0', data: json } as CardMetadata;
                        }
                    }
                }

                offset += 12 + length;
            }
        } catch (e) {
            logger.error('PngCardParser', `Failed to parse card: ${filePath}`, e);
        }
        return null;
    }
}
