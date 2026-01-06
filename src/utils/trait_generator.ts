import * as fs from 'fs';
import * as path from 'path';
import { logger } from './logger';

interface Trait {
    name: string;
    tags: string[];
}

interface TraitDatabase {
    npc_traits: {
        CoreMotivation: Trait[];
        PrimaryFlaw: Trait[];
        SocialStrategy: Trait[];
    };
}

export interface PersonalityScaffold {
    motivation: string;
    flaw: string;
    strategy: string;
    vibe: string;
}

export class TraitGenerator {
    private traits: TraitDatabase | null = null;
    private readonly traitsPath: string;

    constructor() {
        this.traitsPath = path.join(process.cwd(), 'src', 'data', 'tables', 'npc_traits.json');
        this.loadTraits();
    }

    private loadTraits() {
        try {
            if (fs.existsSync(this.traitsPath)) {
                const raw = fs.readFileSync(this.traitsPath, 'utf-8');
                this.traits = JSON.parse(raw);
                logger.info('TraitGenerator', 'Loaded NPC Trait Tables');
            } else {
                logger.error('TraitGenerator', 'Trait tables not found', { path: this.traitsPath });
            }
        } catch (e: any) {
            logger.error('TraitGenerator', 'Failed to load trait tables', { error: e.message });
        }
    }

    /**
     * Generates a 3-part personality scaffold based on Genre Biases.
     */
    /**
     * Generates a 3-part personality scaffold based on Genre Biases.
     */
    generateScaffold(genreBiases: Record<string, any> = {}): PersonalityScaffold {
        const candidates = this.generateCandidates(1, genreBiases);
        return candidates[0];
    }

    /**
     * Generates N unique personality scaffolds.
     */
    generateCandidates(count: number, genreBiases: Record<string, any> = {}): PersonalityScaffold[] {
        if (!this.traits) return Array(count).fill({ motivation: "Survival", flaw: "Paranoia", strategy: "Aloof", vibe: "Unknown" });

        const candidates: PersonalityScaffold[] = [];
        for (let i = 0; i < count; i++) {
            // Re-roll until unique, but basic implementation for now
            const motivation = this.selectWeighted(this.traits.npc_traits.CoreMotivation, genreBiases);
            const flaw = this.selectWeighted(this.traits.npc_traits.PrimaryFlaw, genreBiases);
            const strategy = this.selectWeighted(this.traits.npc_traits.SocialStrategy, genreBiases);

            candidates.push({
                motivation: motivation.name,
                flaw: flaw.name,
                strategy: strategy.name,
                vibe: `${strategy.name} driven by ${motivation.name}, hindered by ${flaw.name}`
            });
        }
        return candidates;
    }

    private selectWeighted(traits: Trait[], biases: Record<string, any>): Trait {
        // Rudimentary weighted selection
        // In V2: Use Genre Definition "biases" to boost tags (e.g. "Noir" boosts "cynical")
        // For now: Uniform random is better than nothing
        const index = Math.floor(Math.random() * traits.length);
        return traits[index];
    }
}
