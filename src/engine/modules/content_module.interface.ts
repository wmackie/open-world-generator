export interface ContentModule {
    name: string;

    /**
     * Called when the engine initializes a new game session (Turn 0).
     * Use this to inject initial state, override genres, or modify the player profile.
     */
    onInitialize(engine: any): Promise<void>;

    /**
     * Called at the start of every turn, before player input is processed.
     * Use this to inject dynamic events, spawn entities, or update module state.
     */
    onTurnStart(engine: any): Promise<void>;
}
