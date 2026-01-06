export type LLMRole = 'logic' | 'creative' | 'embedding';

export interface LLMResponse {
    text: string;
    thinkingTokens?: number;
    outputTokens?: number;
    finishReason: string;
}

export interface ILLMProvider {
    generate(
        prompt: string,
        role: LLMRole,
        config?: {
            temperature?: number;
            responseFormat?: 'json' | 'text';
            thinkingBudget?: number;
        }
    ): Promise<LLMResponse>;

    embed(text: string): Promise<number[]>;

    getModelName(role: LLMRole): string;
    getCostEstimate(tokens: number, role: LLMRole): number;
}
