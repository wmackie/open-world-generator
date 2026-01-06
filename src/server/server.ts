import express from 'express';
import cors from 'cors';
import * as fs from 'fs';
import * as path from 'path';
import { NarrativeEngine } from '../engine/core';
import { logger } from '../utils/logger';

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('client')); // Serve static files from 'client' dir

// Engine Instance
const engine = new NarrativeEngine();
let isInitialized = false;

// Routes

// 1. Get Genres
app.get('/api/genres', async (req, res) => {
    try {
        const genresDir = path.join(process.cwd(), 'src', 'data', 'genres');
        if (!fs.existsSync(genresDir)) {
            return res.json([]);
        }
        const files = fs.readdirSync(genresDir).filter(f => f.endsWith('.json'));
        const genres = files.map(f => {
            const content = fs.readFileSync(path.join(genresDir, f), 'utf-8');
            const json = JSON.parse(content);
            return {
                id: f.replace('.json', ''),
                name: json.meta?.name || f.replace('.json', ''),
                description: json.meta?.description || '',
                premises: json.narrative_flavor?.premise_flavors || []
            };
        });
        res.json(genres);
    } catch (error: any) {
        logger.error('Server', 'Error fetching genres', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// 2. Start/Reset Game
app.post('/api/start', async (req, res) => {
    try {
        const { genre, tone, premise, playerName, playerDescription, startTime, gameId } = req.body;
        logger.info('Server', 'Starting new game session', { genre, tone, premise, playerName, gameId });

        await engine.resetWorld();

        // Unique Game ID (or provided)
        const newGameId = gameId || `session_${Date.now()}`;
        engine.setGameId(newGameId);

        // Set Genre (Default to 'mundane' if not provided)
        await engine.setGenre(genre || 'mundane', tone, premise);

        // Dynamic Player Generation
        const playerProfile = await engine.initializePlayer(playerName || 'Protagonist', playerDescription || 'A weary stranger.');

        // Load default state (in a real app, this might come from a save file or config)
        // [DYNAMIC GENESIS]
        const scenario = await engine.generateScenario(playerName || 'Protagonist', playerDescription || 'A weary stranger.');

        // Helper to slugify names for IDs
        const toId = (name: string, prefix: string) => `${prefix}_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

        const startLocId = toId(scenario.location.name, 'loc');
        const entityList: any[] = [];

        // 1. Create Start Location
        entityList.push({
            entity_id: startLocId,
            entity_type: 'location',
            name: scenario.location.name,
            description: scenario.location.description,
            connected_location_ids: scenario.location.initial_exits.map(exitName => toId(exitName, 'loc')),
            state: {}
        });

        // 2. Create Exits (Placeholders)
        scenario.location.initial_exits.forEach(exitName => {
            entityList.push({
                entity_id: toId(exitName, 'loc'),
                entity_type: 'location',
                name: exitName,
                description: `A location leading to ${exitName}.`,
                connected_location_ids: [startLocId], // Back link
                state: {}
            });
        });

        // 3. Create Entities (NPCs/Objects)
        scenario.entities.forEach((ent, index) => {
            // Construct base description, potentially appending traits for immediate visibility
            let entDesc = ent.description;
            if (ent.personality_traits && ent.personality_traits.length > 0) {
                entDesc += ` [Traits: ${ent.personality_traits.join(', ')}]`;
            }

            entityList.push({
                entity_id: toId(ent.name, ent.type) + `_${index}`,
                entity_type: ent.type,
                name: ent.name,
                description: entDesc,
                state: {
                    current_location_id: startLocId,
                    status: 'active',
                    current_action: ent.initial_state, // Store initial state as action description for now
                    goals: ent.initial_goal ? [{ description: ent.initial_goal, priority: 'medium', status: 'active', created_at: 0 }] : []
                }
            });
        });

        // 4. Construct World State
        const initialWorldState = {
            player: {
                entity_id: 'player',
                entity_type: 'player',
                name: playerName || 'Protagonist',
                description: playerDescription || 'A weary stranger.',
                capabilities: playerProfile.capabilities,
                traits: playerProfile.traits,
                state: {
                    current_location_id: startLocId,
                    inventory: playerProfile.inventory,
                    status: 'active',
                    health_status: playerProfile.health_status || 'healthy',
                    emotional_state: playerProfile.emotional_state || 'neutral'
                }
            },
            entities: entityList,
            // Inject metadata
            metadata: {
                start_time: startTime,
                opening_narrative: scenario.opening_narrative // Pass deep narrative hook
            }
        };
        engine.loadWorldState(initialWorldState);

        // [CRITICAL FIX] Flesh out Genesis NPCs immediately
        // Loop through entities, find NPCs, and trigger Tier 2 generation
        for (const ent of entityList) {
            if (ent.entity_type === 'npc') {
                logger.info('Server', `Triggering immediate Flesh Out for Genesis NPC`, { name: ent.name, id: ent.entity_id });
                // We don't await this inside the loop to avoid stalling startup too long, 
                // OR we await if we want to ensure they are ready before the first prompt.
                // Given the user wants them "full", we should probably await.
                await engine.fleshOutEntity(ent.entity_id);
            }
        }

        // Inject the Opening Narrative into memory so it acts as Turn 0 history
        if (scenario.opening_narrative) {
            await engine.injectGenesisNarrative(
                scenario.opening_narrative,
                startLocId,
                initialWorldState.player.entity_id
            );
        }

        // Also set time in engine if needed, but engine starts at 0.
        // We might want to pass startTime to engine.setStartTime() if it existed.

        isInitialized = true;

        // Initialize but wait for input
        res.json({
            narrative: scenario.opening_narrative || `System initialized. Welcome, ${playerName || 'Agent'}. Awaiting command.`,
            worldStateDelta: {
                player: initialWorldState.player,
                time: { current_time: 0 }
            }
        });
    } catch (error: any) {
        logger.error('Server', 'Error starting game', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// 2. Process Action
app.post('/api/action', async (req, res) => {
    try {
        if (!isInitialized) {
            return res.status(400).json({ error: "Game not started. Call /api/start first." });
        }

        const { input } = req.body;
        if (!input) {
            return res.status(400).json({ error: "Input required" });
        }

        logger.info('Server', 'Processing action', { input });
        const output = await engine.processPlayerInput(input);

        res.json({
            narrative: output.narrative,
            worldStateDelta: output.worldStateDelta
        });
    } catch (error: any) {
        logger.error('Server', 'Error processing action', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// 3. Load Snapshot
app.post('/api/load', async (req, res) => {
    try {
        const { turnNumber } = req.body;
        if (turnNumber === undefined) {
            return res.status(400).json({ error: "Turn number required" });
        }

        logger.info('Server', `Loading snapshot request via API`, { turnNumber });
        const success = await engine.loadSnapshot(turnNumber);

        if (success) {
            res.json({ message: `Successfully loaded Turn ${turnNumber}.` });
        } else {
            res.status(404).json({ error: `Snapshot for Turn ${turnNumber} not found.` });
        }
    } catch (error: any) {
        logger.error('Server', 'Error loading snapshot', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// 4. Undo
app.post('/api/undo', async (req, res) => {
    try {
        logger.info('Server', `Undo request via API`);
        const success = await engine.undo();

        if (success) {
            res.json({ message: "Undo successful." });
        } else {
            res.status(400).json({ error: "Cannot undo further (or no snapshot found)." });
        }
    } catch (error: any) {
        logger.error('Server', 'Error processing undo', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// 5. GET Settings
app.get('/api/settings', (req, res) => {
    try {
        const settings = engine.modules.map(m => ({
            name: m.name,
            enabled: engine.getModuleStatus(m.name)
        }));
        res.json({ modules: settings });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// 6. POST Settings
app.post('/api/settings', (req, res) => {
    try {
        const { updates } = req.body; // e.g., [{ module: 'CardImporter', enabled: false }]
        if (Array.isArray(updates)) {
            updates.forEach((u: any) => {
                if (u.module && typeof u.enabled === 'boolean') {
                    engine.toggleModule(u.module, u.enabled);
                }
            });
        }
        res.json({ success: true });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// Start Server
app.listen(port, () => {
    console.log(`IF Engine Server running at http://localhost:${port}`);
    logger.info('Server', `Server started on port ${port}`);
});
