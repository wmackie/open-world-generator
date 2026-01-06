import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { ILLMProvider, LLMRole, LLMResponse } from "./provider.interface";
import { logger } from "../utils/logger";
import { getAuditLogger } from "../utils/audit_logger";

export class GeminiProvider implements ILLMProvider {
    private genAI: GoogleGenerativeAI;
    private logicModel: any;
    private creativeModel: any;
    private embedModel: any;

    constructor(apiKey: string) {
        this.genAI = new GoogleGenerativeAI(apiKey);

        const safetySettings = [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE }
        ];

        // Logic Model: Uses thinking for reasoning (Consequence Engine)
        this.logicModel = this.genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            safetySettings
        });

        // Creative Model: Standard generation (Narration)
        this.creativeModel = this.genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            safetySettings
        });

        this.embedModel = this.genAI.getGenerativeModel({
            model: "text-embedding-004"
        });
    }

    async generate(
        prompt: string,
        role: LLMRole,
        config?: {
            temperature?: number;
            responseFormat?: 'json' | 'text';
            thinkingBudget?: number;
        }
    ): Promise<LLMResponse> {
        const model = role === 'logic' ? this.logicModel : this.creativeModel;

        const generationConfig: any = {
            temperature: config?.temperature ?? 0.7
        };

        if (config?.responseFormat === 'json') {
            generationConfig.responseMimeType = "application/json";
        }

        // Thinking budget logic (if supported by 2.5 flash in future/current)
        // currently we just pass standard config.

        // Audit Log Request
        const auditLogger = getAuditLogger();
        // Assuming 'turn' is not easily available here without threading it through everything. 
        // For now, pass 0 or try to get it from global state if possible. 
        // Better: Make turn optional in Logger or default to 0.
        auditLogger.logLLMRequest('GeminiProvider', prompt, generationConfig, 0);

        try {
            const result = await model.generateContent({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig
            });

            const response = result.response;

            const finalResponse = {
                text: response.text(),
                thinkingTokens: (response.usageMetadata as any)?.thinkingTokens,
                outputTokens: response.usageMetadata?.candidatesTokenCount,
                finishReason: response.candidates?.[0]?.finishReason || "STOP"
            };

            auditLogger.logLLMResponse('GeminiProvider', finalResponse, generationConfig, 0);

            return finalResponse;
        } catch (error: any) {
            logger.error('GeminiProvider', 'Generation failed', { error: error.message });
            throw error;
        }
    }

    async embed(text: string): Promise<number[]> {
        const result = await this.embedModel.embedContent(text);
        return result.embedding.values;
    }

    getModelName(role: LLMRole): string {
        return role === 'embedding' ? 'text-embedding-004' : 'gemini-2.5-flash';
    }

    getCostEstimate(tokens: number, role: LLMRole): number {
        // Gemini 2.5 Flash pricing (as of Dec 2024/Jan 2025)
        // Input: $0.075 per 1M tokens
        // Output: $0.30 per 1M tokens
        // Thinking cost assumed distinct if applicable, but using standard rates for estimation.
        const inputCostPer1M = 0.075;

        // Rough estimate: assume 1:2 input:output ratio
        const estimatedCost = (tokens * 1.5 * inputCostPer1M) / 1_000_000;
        return estimatedCost;
    }
}
