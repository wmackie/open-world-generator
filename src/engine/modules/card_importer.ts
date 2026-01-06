import { ContentModule } from './content_module.interface';
import { PngCardParser, CardMetadata } from '../../utils/png_parser';
import { EntityMapper } from '../../utils/entity_mapper';
import { ScenarioMapper } from '../../utils/scenario_mapper';
import { AdaptationMapper } from '../../utils/adaptation_mapper';
import { logger } from '../../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

export class CardImportModule implements ContentModule {
    name = "CardImporter";
    private importPath: string;
    private processedPath: string;

    constructor() {
        this.importPath = path.join(process.cwd(), 'imports');
        this.processedPath = path.join(process.cwd(), 'imports', 'processed');

        if (!fs.existsSync(this.importPath)) {
            fs.mkdirSync(this.importPath, { recursive: true });
        }
        if (!fs.existsSync(this.processedPath)) {
            fs.mkdirSync(this.processedPath, { recursive: true });
        }
    }

    async onInitialize(engine: any): Promise<void> {
        // TURN 0 Logic: Check for Player/Scenario Cards
        const files = this.scanDir();
        for (const file of files) {
            if (file.toLowerCase().includes('player')) {
                logger.info('CardImporter', `Processing Turn 0 Player Card: ${file}`);
                const metadata = PngCardParser.parse(path.join(this.importPath, file));
                if (metadata) {
                    await this.processPlayerCard(engine, metadata);
                    this.markProcessed(file);
                }
            } else if (file.toLowerCase().includes('scenario')) {
                // Scenario Handling
                logger.info('CardImporter', `Processing Scenario Card: ${file}`);
                const metadata = PngCardParser.parse(path.join(this.importPath, file));
                if (metadata) {
                    await this.processScenarioCard(engine, metadata);
                    this.markProcessed(file);
                }
            }
        }
    }

    async onTurnStart(engine: any): Promise<void> {
        // MID-GAME Logic: Check for New NPC Cards
        const files = this.scanDir();
        for (const file of files) {
            // Ignore player/scenario cards mid-game
            if (file.toLowerCase().includes('player') || file.toLowerCase().includes('scenario')) {
                continue;
            }

            logger.info('CardImporter', `Processing Mid-Game NPC Card: ${file}`);
            const metadata = PngCardParser.parse(path.join(this.importPath, file));
            if (metadata) {
                await this.processNPCCard(engine, metadata);
                this.markProcessed(file);
            }
        }
    }

    private scanDir(): string[] {
        if (!fs.existsSync(this.importPath)) return [];
        return fs.readdirSync(this.importPath).filter(f => f.endsWith('.png') || f.endsWith('.json'));
    }

    private markProcessed(filename: string) {
        try {
            const src = path.join(this.importPath, filename);
            const dest = path.join(this.processedPath, filename);
            fs.renameSync(src, dest);
        } catch (e) {
            logger.error('CardImporter', `Failed to move file to processed: ${filename}`, e);
        }
    }

    private async processPlayerCard(engine: any, card: CardMetadata) {
        // Use LLM to Transform
        let profile = null;
        if (engine.llmProvider) {
            profile = await EntityMapper.transformToPlayerProfile(card, engine.llmProvider);
        } else {
            profile = EntityMapper.mapToPlayerProfile(card);
        }

        // Inject into Engine via "Pending Override" slot
        (engine as any).pendingPlayerOverride = profile;

        logger.info('CardImporter', 'Injected Player Profile Override', { name: card.data.name });
    }

    private async processNPCCard(engine: any, card: CardMetadata) {
        // Use LLM to Transform
        let fullEntity = null;

        if (engine.llmProvider) {
            const partial = await EntityMapper.transformToEntity(card, engine.llmProvider);
            fullEntity = this.hydrateEntity(partial, card.data.name, engine.currentTurn);
        } else {
            const partial = EntityMapper.mapToEntity(card);
            fullEntity = this.hydrateEntity(partial, card.data.name, engine.currentTurn);
        }

        // 1.5. ADAPTATION (Genre Compliance)
        // If mid-game import, ensure it fits the current genre.
        // We can access engine.genreManager.getRules()
        if (engine.llmProvider && engine.genreManager) {
            const rules = engine.genreManager.getRules();
            fullEntity = await AdaptationMapper.ensureCompliance(fullEntity, rules, engine.llmProvider);
        }

        // Persist via EntityInstantiationSystem (Integration Step)
        if (engine.entityInstantiation && typeof engine.entityInstantiation.instantiateFromBlueprint === 'function') {
            await engine.entityInstantiation.instantiateFromBlueprint(fullEntity);
        } else {
            // Fallback for verification scripts that might mock engine incompletely
            await engine.entityManager.createEntity(fullEntity);
        }

        logger.info('CardImporter', 'Imported NPC Entity', { entityId: fullEntity.entity_id, name: fullEntity.name.display });
    }

    private hydrateEntity(partial: any, name: string, turn: number): any {
        const entityId = `npc_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`;
        return {
            ...partial,
            entity_id: entityId,
            entity_type: 'npc',
            is_player: false,
            simulation_mode: 'passive',
            engagement_level: 'acquaintance',
            generated_depth: partial.psychology ? 'detailed' : 'basic',
            state: {
                current_location_id: null,
                health_status: 'healthy',
                emotional_state: 'neutral',
                current_action: null
            },
            meta: {
                creation_turn: turn || 0,
                last_modified: new Date().toISOString(),
                last_simulated_turn: turn || 0,
                total_api_calls: 0,
                total_generation_tokens: 0,
                total_player_interactions: 0
            }
        };
    }

    private async processScenarioCard(engine: any, card: CardMetadata) {
        if (!engine.llmProvider) return; // Cannot process without LLM

        logger.info('CardImporter', 'Generating Genre Overrides from Scenario Card...');
        const overrides = await ScenarioMapper.transformToGenreRules(card, engine.llmProvider);

        if (engine.genreManager && typeof engine.genreManager.setRuntimeOverrides === 'function') {
            // 3. Apply overrides
            engine.genreManager.setRuntimeOverrides(overrides);

            // 4. Persist overrides to DB (Added for reliability)
            if (typeof engine.persistRuntimeOverrides === 'function') {
                engine.persistRuntimeOverrides();
            }

            logger.info('CardImporter', `Applied and Persisted Scenario Overrides from '${card.data.name}'`);
        } else {
            logger.warn('CardImporter', 'GenreManager does not support runtime overrides.');
        }
    }
}
