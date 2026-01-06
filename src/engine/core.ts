import { SQLiteDB } from '../db/sqlite';
import { VectorDB } from '../db/lancedb';
import { ContentModule } from './modules/content_module.interface';
import { CardImportModule } from './modules/card_importer';
import { logger } from '../utils/logger';
import * as path from 'path';
import * as fs from 'fs';
import { EntityManager, LocationManager } from './managers';
import { MemorySystem } from './memory';
import { GeminiProvider } from '../llm/gemini.provider';
import { ConsequenceEngine } from './consequence';
import { Director } from './director';
import { ConsistencyEnforcer } from './consistency';
import { SimulationManager } from './simulation';
import { Narrator } from './narrator';
import { OpportunityGenerator } from './opportunity_generator';
import { PlausibilityChecker } from './plausibility';
import { ActionInterpreter } from './action_interpreter';
import { EntityInstantiationSystem } from './entity_instantiation';
import { NPCAgencySystem } from './systems/npc_agency'; // NEW
import { GenreManager } from './genre_manager';
import { PromptManager } from './prompts/prompt_manager';
import { ScenarioGenerator, StartingScenario } from './scenario_generator';

import { RippleEffectManager } from './ripple_effect_manager';

export interface NarrativeOutput {
    narrative: string;
    consequences: any[];
    worldStateDelta: any;
    tokensUsed: number;
}

export class NarrativeEngine {
    private sqlite!: SQLiteDB;
    private vector!: VectorDB;
    private entityManager!: EntityManager;
    private locationManager!: LocationManager;
    private memorySystem!: MemorySystem;
    private llmProvider!: GeminiProvider;
    private consequenceEngine!: ConsequenceEngine;
    private director!: Director;
    private consistencyEnforcer!: ConsistencyEnforcer;
    private simulationManager!: SimulationManager;
    private narrator!: Narrator;
    private opportunityGenerator!: OpportunityGenerator;
    private plausibilityChecker!: PlausibilityChecker;
    private actionInterpreter!: ActionInterpreter;
    private rippleEffectManager!: RippleEffectManager;
    private npcAgencySystem!: NPCAgencySystem; // NEW
    private entityInstantiation!: EntityInstantiationSystem;
    private genreManager!: GenreManager;
    private promptManager!: PromptManager;
    private scenarioGenerator!: ScenarioGenerator;
    public modules: ContentModule[] = [];

    // Track player ID for prototype
    private playerId: string = 'player';
    private currentTurn: number = 0;
    private worldTime: number = 0; // Track time (minutes)
    private gameId: string = 'current_session'; // Default game ID

    public setGameId(id: string) {
        this.gameId = id;
        logger.info('NarrativeEngine', `Game ID set to: ${this.gameId}`);
    }

    // Module Management
    // public modules is already declared above at line 51
    private moduleSettings: Map<string, boolean> = new Map(); // Track enabled/disabled state

    constructor(dbPath?: string) {
        this.sqlite = new SQLiteDB(dbPath);
        this.vector = new VectorDB(dbPath ? dbPath.replace('.db', '_lancedb') : undefined);
        this.entityManager = new EntityManager(this.sqlite);
        this.locationManager = new LocationManager(this.entityManager);
        this.memorySystem = new MemorySystem(this.sqlite, this.vector);

        // Initialize LLM Provider
        const apiKey = process.env.GOOGLE_API_KEY || "";
        this.llmProvider = new GeminiProvider(apiKey);

        this.genreManager = new GenreManager(); // Initialize Genre Manager
        // Instantiate PromptManager (Centralized Prompts)
        this.promptManager = new PromptManager(this.genreManager);

        // Engines with PromptManager injection
        this.consequenceEngine = new ConsequenceEngine(this.llmProvider, this.promptManager);
        this.director = new Director(this.llmProvider);
        this.consistencyEnforcer = new ConsistencyEnforcer(this.sqlite, this.llmProvider, this.promptManager);
        this.simulationManager = new SimulationManager(this.entityManager);
        this.narrator = new Narrator(this.llmProvider, this.promptManager);
        this.opportunityGenerator = new OpportunityGenerator(this.llmProvider);
        this.plausibilityChecker = new PlausibilityChecker(apiKey, this.genreManager, this.promptManager);
        this.actionInterpreter = new ActionInterpreter(this.llmProvider, this.promptManager);
        this.rippleEffectManager = new RippleEffectManager(this.sqlite);
        this.npcAgencySystem = new NPCAgencySystem(this.llmProvider, this.promptManager, this.entityManager); // NEW
        this.entityInstantiation = new EntityInstantiationSystem(this.llmProvider, this.entityManager, this.genreManager);
        this.scenarioGenerator = new ScenarioGenerator(this.llmProvider, this.promptManager, this.genreManager);

        // Initialize Modules
        this.modules = [
            new CardImportModule()
        ];
        // Default all to enabled
        this.modules.forEach(m => this.moduleSettings.set(m.name, true));

        // Try to restore state

        // Try to restore state
        this.loadPersistedSettings();
    }



    // New Save/Load Methods
    async loadSnapshot(turnNumber: number): Promise<boolean> {
        const dbPath = path.join(process.cwd(), 'data', 'world.db'); // Target
        const savesDir = path.join(process.cwd(), 'data', 'saves');
        const filename = `${this.gameId}-${turnNumber}.db`;
        const savePath = path.join(savesDir, filename);

        if (!fs.existsSync(savePath)) {
            logger.error('NarrativeEngine', `Snapshot not found: ${filename}`);
            return false;
        }

        try {
            // 1. Close existing connection to unlock the file
            this.sqlite.close();

            // 2. Perform the file copy
            fs.copyFileSync(savePath, dbPath);
            logger.info('NarrativeEngine', `Restored database from ${filename}`);

            // 3. Re-initialize connections
            this.sqlite = new SQLiteDB(dbPath);

            // Re-bind managers to the new DB instance
            this.entityManager = new EntityManager(this.sqlite);
            this.consistencyEnforcer = new ConsistencyEnforcer(this.sqlite, this.llmProvider, this.promptManager);
            this.rippleEffectManager = new RippleEffectManager(this.sqlite);

            // We also need to update the various managers that might depend on the specific sqlite instance
            // Ideally managers should just take sqlite in constructor. 
            // Checking constructor calls...
            // LocationManager uses EntityManager, which we just refreshed.
            this.locationManager = new LocationManager(this.entityManager);

            // MemorySystem - uses SQLite
            this.memorySystem = new MemorySystem(this.sqlite, this.vector);

            // SimulationManager uses EntityManager
            this.simulationManager = new SimulationManager(this.entityManager);

            // Resync state
            this.currentTurn = turnNumber;

            // Reload global settings like Genre which might have been different in that snapshot
            await this.loadPersistedSettings();

            return true;
        } catch (e) {
            logger.error('NarrativeEngine', `Failed to load snapshot ${turnNumber}`, e);
            // Try to recover by reopening the DB at least?
            try {
                this.sqlite = new SQLiteDB(dbPath);
            } catch (recoveryErr) {
                logger.error('NarrativeEngine', `Critical failure: Could not reopen DB after failed load`, recoveryErr);
            }
            return false;
        }
    }

    async undo(): Promise<boolean> {
        if (this.currentTurn <= 0) return false;
        return await this.loadSnapshot(this.currentTurn - 1);
    }

    loadWorldState(state: any) {
        logger.info('NarrativeEngine', 'Loading world state', { stateKeys: Object.keys(state) });
        // Rudimentary loading for test harness
        if (state.entities) {
            for (const entity of state.entities) {
                this.entityManager.createEntity(entity);
            }
        }
        if (state.player) {
            this.entityManager.createEntity(state.player);
            this.playerId = state.player.entity_id;
        }
    }

    async generateScenario(playerName: string, playerBio: string): Promise<StartingScenario> {
        return this.scenarioGenerator.generateStartingState(playerName, playerBio);
    }

    async initializePlayer(name: string, description: string): Promise<any> {
        // [HOOK] Initialize Modules (Turn 0)
        // [HOOK] Initialize Modules (Turn 0)
        for (const module of this.modules) {
            if (this.moduleSettings.get(module.name) === false) continue; // Skip disabled
            logger.info('NarrativeEngine', `Initializing Module: ${module.name}`);
            await module.onInitialize(this);
        }

        if ((this as any).pendingPlayerOverride) {
            logger.info('NarrativeEngine', 'Using pending player override from modules.');
            const override = (this as any).pendingPlayerOverride;
            // Clear it
            delete (this as any).pendingPlayerOverride;
            return override;
        }

        const rules = this.genreManager.getRules();
        return await this.entityInstantiation.generatePlayerProfile(name, description, rules);
    }

    /**
     * Public wrapper to flesh out an entity (e.g. for Turn 0 setup)
     */
    async fleshOutEntity(entityId: string): Promise<boolean> {
        return await this.entityInstantiation.fleshOutEntity(entityId);
    }

    async setGenre(genreId: string, tone?: string, premise?: string) {
        logger.info('NarrativeEngine', `Setting genre to: ${genreId}, Tone: ${tone || 'Default'}, Premise: ${premise || 'None'}`);

        await this.genreManager.loadGenre(genreId);
        if (tone) {
            this.genreManager.setToneOverride(tone);
        }
        if (premise) {
            this.genreManager.setPremiseOverride(premise);
        }

        // Persistence
        this.sqlite.setGlobal('genre_id', genreId);
        if (tone) this.sqlite.setGlobal('tone_override', tone);
        if (premise) this.sqlite.setGlobal('premise_override', premise);
    }

    /**
     * Persists the current runtime overrides (from Scenario Cards, etc)
     */
    persistRuntimeOverrides() {
        const overrides = this.genreManager.getRuntimeOverrides();
        if (overrides) {
            this.sqlite.setGlobal('runtime_overrides', JSON.stringify(overrides));
            logger.info('NarrativeEngine', 'Persisted Genre Runtime Overrides');
        }
    }

    async loadPersistedSettings() {
        try {
            const genreId = this.sqlite.getGlobal('genre_id');
            const tone = this.sqlite.getGlobal('tone_override');

            if (genreId) {
                logger.info('NarrativeEngine', `Restoring persisted genre: ${genreId}`);
                await this.genreManager.loadGenre(genreId);
            }
            if (tone) {
                logger.info('NarrativeEngine', `Restoring persisted tone: ${tone}`);
                this.genreManager.setToneOverride(tone);
            }
            const premise = this.sqlite.getGlobal('premise_override');
            if (premise) {
                logger.info('NarrativeEngine', `Restoring persisted premise: ${premise}`);
                this.genreManager.setPremiseOverride(premise);
            }

            const runtimeOverrides = this.sqlite.getGlobal('runtime_overrides');
            if (runtimeOverrides) {
                try {
                    const parsed = JSON.parse(runtimeOverrides);
                    logger.info('NarrativeEngine', 'Restoring persisted runtime overrides');
                    this.genreManager.setRuntimeOverrides(parsed);
                } catch (e) {
                    logger.warn('NarrativeEngine', 'Failed to parse persisted runtime overrides', e);
                }
            }
        } catch (e) {
            logger.warn('NarrativeEngine', 'Failed to load persisted settings', e);
        }
    }

    async processPlayerInput(input: string, isGenesis: boolean = false): Promise<NarrativeOutput> {
        // 0. SNAPSHOT (The "Tape Recorder" Logic)
        if (!isGenesis) {
            try {
                this.sqlite.snapshot(this.gameId, this.currentTurn);
            } catch (e) {
                logger.error('NarrativeEngine', 'Snapshot failed', e);
            }
        }

        // Genre check
        try {
            this.genreManager.getRules();
        } catch (e) {
            logger.warn('NarrativeEngine', 'No genre loaded, falling back to mundane');
            await this.genreManager.loadGenre('mundane');
        }

        this.currentTurn++;
        logger.info('NarrativeEngine', 'Processing input', { input, turn: this.currentTurn });

        // [HOOK] Turn Start (Check for new imports, etc)
        // [HOOK] Turn Start (Check for new imports, etc)
        for (const module of this.modules) {
            if (this.moduleSettings.get(module.name) === false) continue; // Skip disabled
            await module.onTurnStart(this);
        }

        // 0. Load Player & Opportunities
        const playerEntity = this.entityManager.getEntity(this.playerId) as any;
        let activeOpportunities: any[] = (playerEntity?.state?.opportunities as any[]) || [];

        // 1. Expiration Check (Design Doc 6.9)
        const initialCount = activeOpportunities.length;
        activeOpportunities = activeOpportunities.filter(op => {
            if (op.expires_at && this.worldTime >= op.expires_at) {
                logger.info('NarrativeEngine', 'Opportunity Expired', { id: op.description, turn: this.currentTurn });
                return false;
            }
            return true;
        });

        // --- Action Interpreter Layer ---
        const player = this.entityManager.getEntity(this.playerId) as any; // Force Any
        let locationName = "Unknown";
        let locationDesc = "";
        let visibleExits: string[] = [];
        const currentLocId = player?.state?.current_location_id;

        if (currentLocId) {
            const loc = this.entityManager.getEntity(currentLocId);
            if (loc && loc.entity_type === 'location') {
                locationName = loc.name;
                locationDesc = loc.description;
                visibleExits = loc.connected_location_ids.map((id: string) => {
                    const l = this.entityManager.getEntity(id);
                    return l && l.entity_type === 'location' ? l.name : id;
                });
            }
        }

        const npcsInScene = currentLocId ?
            this.entityManager.getEntitiesInLocation(currentLocId).filter(e => e.entity_type === 'npc') : [];
        const objectsInScene = currentLocId ?
            this.entityManager.getEntitiesInLocation(currentLocId).filter(e => e.entity_type === 'object') : [];

        // Fetch Narrative History for Context
        const narrativeHistory = this.sqlite.getRecentNarratives(this.playerId, 5);

        // 3. INTERPRET INPUT
        const interpretation = await this.actionInterpreter.interpret(input, {
            locationName,
            locationDesc,
            visibleExits,
            npcs: npcsInScene,
            objects: objectsInScene,
            inventory: player?.state?.inventory || [],
            recentHistory: narrativeHistory
        });

        // Use the resolved intent
        const processedInput = interpretation.normalized_input || input;
        logger.info('NarrativeEngine', `Interpreted intent: "${processedInput}"`);

        // --- STEP 3.0: INTERPRETATION VALIDATION & DYNAMIC TRAVEL (Spec 3.0) ---
        // If the interpreter flagged the action as impossible or ambiguous, fail early.
        if (interpretation.understanding === 'AMBIGUOUS' && interpretation.ambiguity_explanation) {
            const failureConsequence = {
                outcome_type: 'FAILURE',
                narrative_summary: interpretation.ambiguity_explanation,
                probability_weight: 100,
                immediate_effects: [],
                world_state_changes: {},
                duration_minutes: 0
            };
            return {
                narrative: interpretation.ambiguity_explanation,
                consequences: [failureConsequence],
                worldStateDelta: {},
                tokensUsed: 0
            };
        }

        // --- SPEC 3.0: DYNAMIC TRAVEL & LOCATION GENERATION ---
        if (interpretation.travel_intent && interpretation.target_location) {
            logger.info('NarrativeEngine', `Dynamic Travel Triggered`, { target: interpretation.target_location });

            // 1. Check if location exists (Fuzzy Match)
            let targetLocationId: string | null = null;
            // FIX: using standard findEntitiesByName with filter
            const existingLocations = this.entityManager.findEntitiesByName(interpretation.target_location).filter(e => e.entity_type === 'location');

            if (existingLocations.length > 0) {
                targetLocationId = existingLocations[0].entity_id;
                logger.info('NarrativeEngine', `Found existing location`, { id: targetLocationId });
            } else {
                // 2. Generate New Location
                logger.info('NarrativeEngine', `Generating NEW location: ${interpretation.target_location}`);
                // FIX: getRules().meta.name
                // FIX: getRules().meta.name
                const generationResult = await this.scenarioGenerator.generateLocation(interpretation.target_location, {
                    genre: this.genreManager.getRules().meta.name,
                    previousLocation: locationName || 'Unknown'
                });

                if (generationResult && generationResult.location) {
                    const { location, entities } = generationResult;

                    // Save Location
                    this.entityManager.createEntity(location);
                    targetLocationId = location.entity_id;
                    logger.info('NarrativeEngine', `Location Generated & Saved`, { id: targetLocationId });

                    // Save Generated Entities
                    if (entities && entities.length > 0) {
                        for (const ent of entities) {
                            this.entityManager.createEntity(ent);
                        }
                        logger.info('NarrativeEngine', `Generated ${entities.length} Dynamic Entities`);
                    }
                }
            }

            // 3. Execute Travel
            if (targetLocationId) {
                // Move Player
                // FIX: Safe state update (read-modify-write)
                const player = this.entityManager.getEntity(this.playerId);
                if (player && player.entity_type === 'player') {
                    player.state.current_location_id = targetLocationId;
                    this.entityManager.updateEntity(this.playerId, player);
                }

                // Generate Travel Narrative
                // For now, we return a special narrative indicating travel, effectively skipping the standard consequence engine for this turn.
                const travelNarrative = `You make your way to **${interpretation.target_location}**.`;

                return {
                    narrative: travelNarrative,
                    consequences: [{
                        outcome_type: 'SUCCESS',
                        narrative_summary: `Traveled to ${interpretation.target_location}`,
                        world_state_changes: {}, // Movement already handled
                        duration_minutes: 15 // Travel takes time
                    }],
                    worldStateDelta: {},
                    tokensUsed: 0
                };
            }
        }
        // --- END SPEC 3.0 ---

        // --- STEP 2.5: INTENT-DRIVEN INSTANTIATION (Spec 2.5) ---
        if (interpretation.missing_entities && interpretation.missing_entities.length > 0) {
            logger.info('NarrativeEngine', `Step 2.5: Instantiation triggered`, { count: interpretation.missing_entities.length });

            for (const missing of interpretation.missing_entities) {
                if (missing.plausible) {
                    const sceneContext = {
                        locationName,
                        atmosphere: locationDesc,
                        presentEntities: [...npcsInScene, ...objectsInScene]
                    };

                    const newEntity = await this.entityInstantiation.generateSkeleton(missing.descriptor, currentLocId || 'unknown', sceneContext, this.currentTurn);

                    if (newEntity) {
                        if (!interpretation.referenced_entities) interpretation.referenced_entities = [];

                        interpretation.referenced_entities.push({
                            mentioned_as: missing.descriptor,
                            entity_name: newEntity.name.display,
                            entity_id: newEntity.entity_id,
                            entity_type: newEntity.entity_type,
                            confidence: 1.0
                        });

                        npcsInScene.push(newEntity);
                        logger.info('NarrativeEngine', `Instantiated plausible entity`, { id: newEntity.entity_id });
                    }
                }
            }
        }
        // --- END STEP 2.5 ---

        // 1. RAG Retrieval
        const memories = await this.memorySystem.getRelevantMemories(processedInput, this.playerId);

        // 2. Parse Input (Basic)
        const lowerInput = processedInput.toLowerCase();

        let narrative = "";
        let consequences: any[] = [];
        let worldStateDelta: any = {};

        // 3. LOGIC ROUTING (Refactored)
        // Check Interpretation for Intent
        const isMovementIntent = /^(go|move|travel|walk|run) to/i.test(processedInput) || lowerInput.startsWith('go to'); // Fallback check
        const complexity = interpretation.complexity || 'COMPLEX';
        const isCertain = complexity === 'TRIVIAL';

        // PATH A: DETERMINISTIC MOVEMENT (Fast Path)
        // Only if intent is Clear Movement AND Complexity is TRIVIAL (Safe Path)
        if (isMovementIntent && isCertain) {

            const targetName = processedInput.replace(/^(go|move|travel|walk|run) to (the )?/, '').trim();
            logger.info('NarrativeEngine', `Attempting Fast Path Movement to: "${targetName}"`);

            let targetLocId = null;
            const player = this.entityManager.getEntity(this.playerId);

            if (!player || player.entity_type !== 'player') {
                return { narrative: "Error: Player not found.", consequences: [], worldStateDelta: {}, tokensUsed: 0 };
            }

            const currentLocId = player.state.current_location_id;

            if (currentLocId) {
                const currentLoc = this.entityManager.getEntity(currentLocId);
                if (currentLoc && currentLoc.entity_type === 'location') {
                    for (const connId of currentLoc.connected_location_ids) {
                        const connLoc = this.entityManager.getEntity(connId);
                        if (connLoc && connLoc.entity_type === 'location') {
                            const matchName = connLoc.name.toLowerCase();
                            const matchTarget = targetName.toLowerCase();
                            if (matchName === matchTarget || connId === targetName) {
                                targetLocId = connId;
                                break;
                            }
                        }
                    }
                }
            }
            if (targetLocId) {
                player.state.current_location_id = targetLocId;
                this.entityManager.updateEntity(this.playerId, player);
                const newLoc = this.entityManager.getEntity(targetLocId);
                const newLocName = (newLoc && newLoc.entity_type === 'location') ? newLoc.name : "Unknown Location";
                const newLocDesc = (newLoc && newLoc.entity_type === 'location') ? newLoc.description : "";

                const entitiesInRoom = this.entityManager.getEntitiesInLocation(targetLocId);
                let entityIdsInRoom = entitiesInRoom.filter(e => e.entity_id !== this.playerId).map(e => e.entity_id);

                // --- LAZY GENERATION ---
                const significantEntities = entitiesInRoom.filter(e => e.entity_id !== this.playerId);
                let generatedNames: string[] = [];

                if (significantEntities.length === 0 && newLoc && newLoc.entity_type === 'location') {
                    logger.info('NarrativeEngine', 'Location is empty. Triggering Lazy Generation...');
                    const newEntities = await this.director.populateLocation(newLoc);

                    if (newEntities.length > 0) {
                        for (const e of newEntities) {
                            this.entityManager.createEntity(e);
                            entityIdsInRoom.push(e.entity_id);
                            generatedNames.push(e.name);
                        }
                    }
                }

                let finalDesc = newLocDesc;
                if (generatedNames.length > 0) {
                    finalDesc += ` You spot: ${generatedNames.join(", ")}.`;
                }

                // --- MOVEMENT NARRATION ---
                const safeEntitiesInRoom = this.entityManager.getEntitiesInLocation(targetLocId);
                const safeNpcs = safeEntitiesInRoom.filter(e => e.entity_type === 'npc' && e.entity_id !== this.playerId);
                const safeObjects = safeEntitiesInRoom.filter(e => e.entity_type === 'object' && e.entity_id !== this.playerId);

                const moveConsequence = {
                    outcome_type: 'success',
                    narrative_summary: `You moved to ${newLocName}. ${finalDesc}`,
                    immediate_effects: [`Moved to ${newLocName}`],
                    affected_entities: [this.playerId, targetLocId]
                };

                const context = {
                    location: newLoc,
                    time: { current_time: this.worldTime },
                    opportunities: activeOpportunities,
                    npcs: safeNpcs,
                    objects: safeObjects
                };

                // [TONE FIX] Use dynamic genre tone
                const activeTone = this.genreManager.getEffectiveTone();
                narrative = await this.narrator.generateNarration(moveConsequence, processedInput, context, activeTone, undefined);

                const knownNames = safeEntitiesInRoom.map((e: any) => {
                    if (typeof e.name === 'string') return e.name;
                    return e.name?.display || e.name?.first || "Unknown";
                });
                // [FIX] Pass player name to forbid extraction
                const playerEntity = this.entityManager.getEntity(this.playerId);
                let playerName = "Player";
                if (playerEntity) {
                    if (typeof playerEntity.name === 'string') {
                        playerName = playerEntity.name;
                    } else {
                        playerName = playerEntity.name.display || playerEntity.name.first || "Player";
                    }
                }

                await this.entityInstantiation.processNarrative(narrative, targetLocId, knownNames, [playerName]);

                consequences = [moveConsequence];
                worldStateDelta = { player: { state: { current_location_id: targetLocId } } };

                await this.memorySystem.logEvent({
                    turn_number: this.currentTurn,
                    location_id: targetLocId,
                    observer_id: this.playerId,
                    action_type: 'move',
                    event_summary: `Player moved to ${newLocName}`,
                    event_data: {
                        from: currentLocId,
                        to: targetLocId,
                        entities_seen: entityIdsInRoom
                    },
                    importance: 5
                });
            } else {
                narrative = `You can't go there from here.`;
            }

        } else if (processedInput.startsWith("REMEMBER:")) {
            const content = processedInput.replace("REMEMBER:", "").trim();
            narrative = `You note: "${content}"`;
            const player = this.entityManager.getEntity(this.playerId);
            const currentUserLoc = (player && player.entity_type === 'player' && player.state.current_location_id)
                ? player.state.current_location_id
                : "unknown";

            await this.memorySystem.logEvent({
                turn_number: this.currentTurn,
                location_id: currentUserLoc,
                observer_id: this.playerId,
                action_type: 'note',
                event_summary: content,
                event_data: { text: content },
                importance: 8
            });

        } else if (processedInput.startsWith("RECALL:")) {
            const memoryContext = memories.length > 0 ? "\n[Relevant Memories]:\n" + memories.map(m => `- ${m.summary}`).join("\n") : "";
            narrative = `Thinking... ${memoryContext}`;

        } else {
            // --- AMBIENT EVENT TICK ---
            let ambientEvent = undefined;
            if (Math.random() < 0.03) {
                logger.info('NarrativeEngine', 'Ambient Event Triggered (3%)');
                const severityRoll = Math.random();
                let severity: 'MINOR' | 'MODERATE' | 'MAJOR' = 'MINOR';
                if (severityRoll > 0.95) severity = 'MAJOR';
                else if (severityRoll > 0.70) severity = 'MODERATE';

                const player = this.entityManager.getEntity(this.playerId);
                const currentState = (player && 'state' in player) ? player.state : { current_location_id: null };
                const location = currentState.current_location_id ? this.entityManager.getEntity(currentState.current_location_id) : null;

                const ambientContext = {
                    location: location || { name: "Unknown" },
                    time: this.worldTime
                };

                const rawAmbient = await this.opportunityGenerator.generateAmbient(ambientContext, severity);

                if (rawAmbient) {
                    const minutes = rawAmbient.expiration_minutes || 5;
                    ambientEvent = {
                        ...rawAmbient,
                        id: `amb_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                        created_at: this.worldTime,
                        created_turn: this.currentTurn,
                        expires_at: this.worldTime + minutes,
                        expires_turn: this.currentTurn + Math.ceil(minutes / 4),
                        status: 'active'
                    };
                    activeOpportunities.push(ambientEvent);
                }
            }

            // 4. ACTION CLASSIFICATION & ROUTING

            // --- STEP 3.5: PRE-ACTION VALIDATION (Spec 3.5) ---
            const playerValidator = this.entityManager.getEntity(this.playerId);
            const currentStateValidator = (playerValidator && 'state' in playerValidator) ? (playerValidator as any).state : { current_location_id: null };
            const locationValidator = currentStateValidator.current_location_id ? this.entityManager.getEntity(currentStateValidator.current_location_id) : null;

            const worldContext = {
                player: playerValidator,
                location: locationValidator
            };

            const plausibility = await this.plausibilityChecker.checkAction(
                processedInput,
                worldContext,
                npcsInScene,
                objectsInScene
            );

            if (!plausibility.plausible) {
                logger.info('NarrativeEngine', 'Action rejected by PlausibilityChecker (Validation Layer)', { input: processedInput, refusal: plausibility.refusal });

                const refusalConsequence = {
                    outcome_type: 'FAILURE',
                    narrative_summary: `The action "${processedInput}" is impossible: ${plausibility.refusal}`,
                    probability_weight: 100,
                    immediate_effects: [],
                    world_state_changes: {},
                    duration_minutes: 0
                };

                narrative = await this.narrator.generateNarration(refusalConsequence, processedInput, { ...worldContext, opportunities: activeOpportunities });
                consequences = [refusalConsequence];

                // Skip both Certain and Uncertain paths
                // We effectively bypass everything below
            } else {
                // Proceed to Classification (LLM Based)
                // Use the complexity determined by the ActionInterpreter
                const complexity = interpretation.complexity || 'COMPLEX'; // Default to COMPLEX if missing
                const isCertain = complexity === 'TRIVIAL';

                // 5% chance of valid "Certain" actions becoming "Uncertain" (Surprise!)
                const surpriseRoll = Math.random();
                const surpriseTriggered = isCertain && surpriseRoll < 0.05;

                if (isCertain && !surpriseTriggered) {
                    // --- CERTAIN PATH ---
                    logger.info('NarrativeEngine', 'Processing as CERTAIN action', { input: processedInput });

                    const context = {
                        location: locationValidator || { name: "Unknown", description: "Unknown" },
                        time: this.worldTime,
                        player: { state: (playerValidator && 'state' in playerValidator) ? (playerValidator as any).state : {} },
                        npcs: npcsInScene, // Fix: Pass entities for Cast List
                        objects: objectsInScene
                    };

                    const syntheticConsequence: any = {
                        outcome_type: 'SUCCESS',
                        narrative_summary: `The player performs the action: "${processedInput}" without incident.`,
                        probability_weight: 100,
                        immediate_effects: [],
                        world_state_changes: {},
                        duration_minutes: /^(check|look|inventory|recall|remember|think)/i.test(processedInput) ? 0 : 1
                    };

                    const newOpportunities = await this.generateOpportunities(context, activeOpportunities);
                    const allOpportunities = [...activeOpportunities, ...newOpportunities];

                    // --- INJECT AGENCY (CERTAIN Actions) ---
                    // Even trivial actions ("Wait") allow NPCs to act.

                    const agencyCandidates = npcsInScene.filter(n =>
                        n.entity_id !== this.playerId &&
                        (n as any).state?.health_status !== 'incapacitated'
                    );

                    let npcActions: any[] = [];
                    if (agencyCandidates.length > 0) {
                        try {
                            // [FIX] Use 5-arg signature for Certain path too, though triggers likely null
                            npcActions = await this.npcAgencySystem.resolveAgencyTurn(
                                (locationValidator as any)?.name || "Unknown Location",
                                `Player Action: ${processedInput}`,
                                processedInput,
                                "SUCCESS",
                                agencyCandidates,
                                [] // No triggers for trivial actions
                            );
                            // Log
                            syntheticConsequence['npc_actions'] = npcActions;
                        } catch (e) {
                            logger.error('NarrativeEngine', 'Agency Failed in Certain Path', { error: e });
                        }
                    }

                    narrative = await this.narrator.generateNarration(
                        syntheticConsequence,
                        processedInput,
                        { ...context, opportunities: allOpportunities, npcActions: npcActions }, // Pass npcActions
                        this.genreManager.getEffectiveTone(), // [TONE FIX]
                        ambientEvent
                    );
                    consequences = [syntheticConsequence];

                    worldStateDelta = {
                        player: { state: { opportunities: allOpportunities } }
                    };

                    // [PERSISTENCE] NPC Agency State Updates
                    if (npcActions.length > 0) {
                        for (const action of npcActions) {
                            if (action.npc_id) {
                                if (!worldStateDelta[action.npc_id]) worldStateDelta[action.npc_id] = { state: {} };
                                worldStateDelta[action.npc_id].state.current_action = {
                                    description: action.description,
                                    type: action.action_type,
                                    target_id: action.target_id // Explicitly persist target for consistency
                                };
                            }
                        }
                    }

                } else {
                    // --- UNCERTAIN PATH ---
                    if (surpriseTriggered) {
                        logger.info('NarrativeEngine', 'SURPRISE! Certain action escalated to UNCERTAIN.', { input: processedInput });
                    } else {
                        logger.info('NarrativeEngine', 'Processing as UNCERTAIN action', { input: processedInput });
                    }

                    // B. COGNITIVE ENGINE (Phase 2)
                    // Replaces Spectrum/Director loop with specific Cognitive Analysis
                    const cognitiveResult = await this.consequenceEngine.resolveActionCognitive(
                        processedInput,
                        worldContext,
                        [...npcsInScene, ...objectsInScene]
                    );

                    let result: any = null;
                    if (cognitiveResult) {
                        // Map Cognitive JSON to Consequence Type
                        result = {
                            outcome_type: cognitiveResult.outcome.outcome_type,
                            mechanic_summary: cognitiveResult.outcome.narrative_summary,
                            delta: cognitiveResult.outcome.world_changes, // Pending Sanitization map
                            tags: [], // TODO: Cognitive Engine should likely return tags in Analysis or Outcome
                            probability_weight: 100,
                            npc_triggers: cognitiveResult.outcome.npc_triggers || []
                        };

                        // Sanitize (Transform 'delta'/'world_changes' to 'immediate_effects')
                        const contextEntities = [playerValidator, ...(locationValidator ? [locationValidator] : []), ...npcsInScene, ...objectsInScene];
                        result = await this.consistencyEnforcer.sanitizeConsequence(result, contextEntities);

                        // Log Analysis
                        logger.info('NarrativeEngine', `Cognitive Reasoning`, {
                            reasoning: cognitiveResult.analysis.reasoning,
                            difficulty: cognitiveResult.analysis.difficulty
                        });

                    } else {
                        // Fallback?
                        logger.error('NarrativeEngine', 'Cognitive Engine failed. Using default fallback.');
                        result = {
                            outcome_type: 'FAILURE',
                            mechanic_summary: 'The action fails due to confusion.',
                            probability_weight: 100,
                            immediate_effects: []
                        };
                    }

                    // --- STAGE 5 (Unified Director System) ---
                    // Director v2: Handles ALL NPC behavior (Reactions + Agency) in one pass.

                    // 1. Prepare Triggers (High Priority Instructions)
                    const triggers = result.npc_triggers || [];
                    const triggerMap = new Map<string, string>();
                    for (const t of triggers) {
                        triggerMap.set(t.npc_id, t.trigger_reason);
                    }

                    // 2. Filter Candidates (Everyone who is capable)
                    // REMOVED: Filtering out target/witnesses. The Director manages everyone now.
                    const agencyCandidates = npcsInScene.filter(n =>
                        n.entity_id !== this.playerId &&
                        (n as any).state?.health_status !== 'incapacitated'
                    );

                    // 3. Format Context for Director
                    let agencyContext = result.mechanic_summary;
                    // [CONTEXT] We append triggers to the context so the Director sees the "notes"
                    if (triggers.length > 0) {
                        const triggerText = triggers.map((t: any) => `[DIRECTOR NOTE: ${t.npc_id} MUST ACT because: ${t.trigger_reason}]`).join(' ');
                        agencyContext += ` ${triggerText}`;
                    }

                    // 4. Call Director
                    // The Director returns the definitive list of actions for ALL NPCs.
                    const npcActions = await this.npcAgencySystem.resolveAgencyTurn(
                        (locationValidator as any)?.name || "Unknown Location",
                        agencyContext,
                        processedInput,
                        result.outcome_type,
                        agencyCandidates,
                        triggers // Passing explicit trigger objects for structured handling
                    );

                    // Log NPC Actions to Metadata
                    result.npc_actions = npcActions;

                    // [RESTORED] Opportunity Logic
                    const opportunityContext = {
                        location: locationValidator || { name: "Unknown", description: "Unknown" },
                        time: this.worldTime,
                        player: { state: (playerValidator && 'state' in playerValidator) ? (playerValidator as any).state : {} },
                        recentNarrative: result.mechanic_summary
                    };

                    const newOps = await this.generateOpportunities(opportunityContext, activeOpportunities);
                    const allOps = [...activeOpportunities, ...newOps];

                    // --- STAGE 6: NARRATIVE GENERATION ---
                    consequences = [result];
                    worldStateDelta = result.world_state_changes || {};

                    // --- RIPPLE EFFECTS (Stage 4 moved here) ---
                    // Note: Ripple now only needs result, playerID. Target/Witness logic is internalized in Director.
                    await this.rippleEffectManager.applyRippleEffects(
                        this.currentTurn,
                        [result],
                        this.playerId,
                        null, // Target is now handled by Director consequences implicitly
                        []   // Witnesses handled by Director
                    );

                    const narrationContext = {
                        location: locationValidator ? locationValidator : null,
                        time: { current_time: this.worldTime },
                        opportunities: allOps,
                        npcs: npcsInScene,
                        objects: objectsInScene,
                        npcActions: npcActions // UNIFIED ACTIONS
                    };

                    // [PERSISTENCE] NPC Agency State Updates
                    if (npcActions.length > 0) {
                        for (const action of npcActions) {
                            if (action.npc_id) {
                                if (!worldStateDelta[action.npc_id]) worldStateDelta[action.npc_id] = { state: {} };
                                worldStateDelta[action.npc_id].state.current_action = {
                                    description: action.description,
                                    type: action.action_type,
                                    target_id: action.target_id
                                };
                            }
                        }
                    }

                    // [TONE FIX] Use dynamic genre tone instead of hardcoded noir
                    const activeTone = this.genreManager.getEffectiveTone();

                    narrative = await this.narrator.generateNarration(result, input, narrationContext, activeTone, ambientEvent);

                    const presentEntities = [...npcsInScene, ...objectsInScene];
                    // Removed target logic duplication preventer as logic is simpler now

                    const validationContext = {
                        locationDesc: (locationValidator && locationValidator.entity_type === 'location') ? locationValidator.description : "Unknown",
                        previousNarrative: narrativeHistory.map((n: any) => `[Turn ${n.turn_number}] ${n.narrative}`).join('\n'),
                        npcActions: npcActions || []
                    };

                    const narrativeValidation = await this.consistencyEnforcer.validateNarrative(narrative, presentEntities, validationContext);

                    if (!narrativeValidation.valid) {
                        logger.warn('NarrativeEngine', `Gate 4 Warning: State Validation Issues`, { reason: narrativeValidation.reason });

                        if ((narrativeValidation as any).correctedNarrative) {
                            logger.info('NarrativeEngine', 'Applying State Validator Correction');
                            narrative = (narrativeValidation as any).correctedNarrative;
                        }
                    }

                    // [REORDERED]: Instantiation now runs AFTER Validation/Correction
                    // This prevents hallucinated objects from being created in the DB
                    if (locationValidator && locationValidator.entity_type === 'location') {
                        const knownNames = [...npcsInScene, ...objectsInScene].map((e: any) => {
                            if (typeof e.name === 'string') return e.name;
                            return e.name?.display || e.name?.first || "Unknown";
                        });

                        // [FIX] Pass player name to forbid extraction
                        const playerEntity = this.entityManager.getEntity(this.playerId);
                        let playerName = "Player";
                        if (playerEntity) {
                            if (typeof playerEntity.name === 'string') {
                                playerName = playerEntity.name;
                            } else {
                                playerName = playerEntity.name.display || playerEntity.name.first || "Player";
                            }
                        }

                        await this.entityInstantiation.processNarrative(narrative, locationValidator.entity_id, knownNames, [playerName]);
                    }

                    worldStateDelta.player = { state: { opportunities: allOps } };
                }
            }
        }

        // --- TIME ADVANCE LOGIC ---
        let durationMinutes = 1;

        if (consequences.length > 0 && typeof consequences[0].duration_minutes === 'number') {
            durationMinutes = consequences[0].duration_minutes;
        }

        const instantVerbs = /^(check|look|inventory|recall|remember|think)/i;
        if (consequences.length === 0 && instantVerbs.test(input)) {
            durationMinutes = 0;
        }

        const hourMatch = input.match(/(?:sleep|wait) (?:for )?(\d+) (?:hours|hour|h)/i);
        if (hourMatch) {
            durationMinutes = parseInt(hourMatch[1], 10) * 60;
        }

        const minMatch = input.match(/(?:sleep|wait) (?:for )?(\d+) (?:minutes|minute|m|min)/i);
        if (minMatch) {
            durationMinutes = parseInt(minMatch[1], 10);
        }

        const simResult = await this.simulationManager.advanceTime(durationMinutes, this.worldTime);
        let actualAdvance = durationMinutes;
        if (simResult.interrupt) {
            actualAdvance = simResult.interrupt.timeElapsed;
            const hoursElapsedStr = (actualAdvance / 60).toFixed(1);
            narrative += `\n[INTERRUPT]: ${simResult.interrupt.reason} (after ${hoursElapsedStr} hours)`;
        }

        this.worldTime += actualAdvance;
        worldStateDelta.time = { current_time: this.worldTime };

        if (simResult.completedGoals.length > 0) {
            logger.info('NarrativeEngine', 'NPC Goals Completed', { goals: simResult.completedGoals });
        }

        if (narrative) {
            const observers = [this.playerId, ...npcsInScene.map((n: any) => n.entity_id)];
            const uniqueObservers = [...new Set(observers)];

            for (const obsId of uniqueObservers) {
                await this.memorySystem.logEvent({
                    turn_number: this.currentTurn,
                    location_id: (this.entityManager.getEntity(this.playerId) as any)?.state?.current_location_id || 'unknown',
                    observer_id: obsId,
                    action_type: 'NARRATION',
                    event_summary: `Turn ${this.currentTurn} Narrative`,
                    event_data: { narrative },
                    importance: 1
                });
            }
        }

        await this.applyWorldStateDelta(worldStateDelta);

        // [HOOK] Memory Persistence (Unbounded)
        // We write the "Narrative Summary" or "Event Summary" to the participants memories
        try {
            // Use narrative summary if available, otherwise truncated narrative
            const summary = consequences[0]?.narrative_summary || narrative.substring(0, 150) + "...";
            const memoryText = `[Turn ${this.currentTurn}] ${processedInput} -> ${summary}`;

            // 1. Identify Participants (Target + Witnesses)
            // We need unique IDs.
            const participants = new Set<string>();

            // Add Target if NPC
            if (interpretation.referenced_entities) {
                for (const ref of interpretation.referenced_entities) {
                    if (ref.entity_type === 'npc') participants.add(ref.entity_id);
                }
            }

            // Add Witnesses (All in scene)
            for (const npc of npcsInScene) {
                participants.add(npc.entity_id);
            }

            // 2. Update Memories
            for (const npcId of participants) {
                if (npcId === this.playerId) continue; // Skip player

                const npc = this.entityManager.getEntity(npcId);
                // Type guard: check if it has memories
                if (npc && typeof npc === 'object' && 'memories' in npc) {
                    const currentMemories = (npc as any).memories || [];
                    const updatedMemories = [...currentMemories, memoryText];

                    // Write back
                    this.entityManager.updateEntity(npcId, { memories: updatedMemories } as any);
                    logger.debug('NarrativeEngine', `Persisted memory for ${npcId}`);
                }
            }

        } catch (memErr) {
            logger.error('NarrativeEngine', 'Failed to persist NPC memories', { error: memErr });
        }

        return {
            narrative,
            consequences,
            worldStateDelta,
            tokensUsed: 0
        };
    }

    private async applyWorldStateDelta(delta: any) {
        // 1. Player Changes
        if (delta.player) {
            const player = this.entityManager.getEntity(this.playerId) as any;
            if (player) {
                if (delta.player.state) {
                    player.state = { ...player.state, ...delta.player.state };
                }
                if (delta.player.capabilities) player.capabilities = delta.player.capabilities;
                if (delta.player.traits) player.traits = delta.player.traits;
                await this.entityManager.updateEntity(this.playerId, player);
            }
        }

        // 2. Entity Changes (Generic)
        for (const key of Object.keys(delta)) {
            if (key === 'player' || key === 'time') continue;

            const entity = this.entityManager.getEntity(key) as any;
            if (entity) {
                const changes = delta[key];
                if (changes.state) {
                    entity.state = { ...entity.state, ...changes.state };
                }
                await this.entityManager.updateEntity(key, entity);
                logger.info('NarrativeEngine', `Applied delta to entity ${key}`);
            }
        }
    }



    async resetWorld() {
        logger.info('NarrativeEngine', 'Resulting world state');
        await this.memorySystem.reset();
        this.sqlite['db'].exec("DELETE FROM entities; DELETE FROM event_log; DELETE FROM simulation_metrics; DELETE FROM relationships;");
        this.currentTurn = 0;
    }

    async injectGenesisNarrative(narrative: string, locationId: string, playerId: string) {
        if (!narrative) return;
        logger.info('NarrativeEngine', 'Injecting Genesis Narrative');
        await this.memorySystem.logEvent({
            turn_number: 0,
            location_id: locationId,
            observer_id: playerId,
            action_type: 'NARRATION',
            event_summary: "Genesis: " + (narrative.substring(0, 50) + "..."),
            event_data: { narrative },
            event_context: narrative,
            importance: 10
        });
    }

    private async generateOpportunities(context: any, activeOpportunities: any[] = []): Promise<any[]> {

        // Capping Logic (Spec 9.5): Max 5 active opportunities
        if (activeOpportunities.length >= 5) {
            return [];
        }

        // Pass existing descriptions to prevent dupes
        context.activeOpportunities = activeOpportunities.map(o => o.description);

        const rawOps = await this.opportunityGenerator.generate(context);

        // Deduplication (Code-Side)
        const uniqueOps = rawOps.filter(op => {
            const isDuplicate = activeOpportunities.some(active =>
                active.description.toLowerCase().includes(op.description.toLowerCase()) ||
                op.description.toLowerCase().includes(active.description.toLowerCase())
            );
            return !isDuplicate;
        });

        // Final Capping
        const slotsAvailable = 5 - activeOpportunities.length;
        const cappedOps = uniqueOps.slice(0, slotsAvailable);

        return cappedOps.map(op => {
            const minutes = op.expiration_minutes || 15;
            return {
                ...op,
                id: `opp_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                created_at: this.worldTime,
                created_turn: this.currentTurn,
                expires_at: this.worldTime + minutes,
                expires_turn: this.currentTurn + Math.ceil(minutes / 4),
                status: 'active'
            };
        });
    }
    /**
     * Toggles a content module on or off.
     */
    toggleModule(moduleName: string, enabled: boolean) {
        if (this.modules.some(m => m.name === moduleName)) {
            this.moduleSettings.set(moduleName, enabled);
            logger.info('NarrativeEngine', `Module '${moduleName}' set to ${enabled ? 'ENABLED' : 'DISABLED'}`);
        } else {
            logger.warn('NarrativeEngine', `Cannot toggle unknown module: ${moduleName}`);
        }
    }

    /**
     * Gets the status of a specific module.
     */
    getModuleStatus(moduleName: string): boolean {
        return this.moduleSettings.get(moduleName) ?? true; // Default true if not set
    }
}
