import * as fs from 'fs';
import * as path from 'path';
import { GenreSchema, GenreRules } from '../types/genre';
import { logger } from '../utils/logger';

export class GenreManager {
    private currentGenre: GenreRules | null = null;
    private toneOverride: string | null = null;
    private premiseOverride: string | null = null;
    // Removed runtimeOverrides/compiledGenre/overrideVersion - simple state now
    private genresPath: string;

    // Rich Tone Mapping
    private readonly TONE_MAP: Record<string, string[]> = {
        'Gritty': ['cynical', 'dirty', 'dangerous', 'high-stakes', 'pessimistic', 'raw'],
        'Dark': ['shadowy', 'oppressive', 'dangerous', 'morally ambiguous', 'bleak'],
        'Hopeful': ['optimistic', 'bright', 'constructive', 'resilient', 'warm'],
        'Melancholic': ['sad', 'beautiful', 'reflective', 'slow', 'sense of loss'],
        'Whimsical': ['playful', 'dreamlike', 'absurd', 'slightly illogical', 'colorful', 'strange'],
        'Epic': ['grand', 'high-stakes', 'heroic', 'sweeping', 'momentous', 'legendary'],
        'Intimate': ['personal', 'quiet', 'emotional', 'close', 'character-focused'],
        'Lyrical': ['poetic', 'flowery', 'beautiful', 'metaphorical', 'rhythm-focused'],
        'Surreal': ['bizarre', 'dream-logic', 'non-sequitur', 'hallucinatory', 'symbolic'],
        'Mythic': ['archetypal', 'legendary', 'fateful', 'ancient', 'grand'],
        'Tragic': ['doomed', 'fatalistic', 'heavy', 'inevitable', 'dramatic'],
        'Ironic': ['detached', 'sardonic', 'self-aware', 'contradictory', 'satirical'],
        'Tense': ['suspenseful', 'urgent', 'anxious', 'pacing-focused', 'dangerous'],
        'Reflective': ['philosophical', 'internal', 'slow', 'thoughtful', 'memory-focused']
    };

    constructor() {
        this.genresPath = path.join(process.cwd(), 'src', 'data', 'genres');
    }

    setToneOverride(tone: string | null) {
        this.toneOverride = tone;
    }

    setPremiseOverride(premise: string | null) {
        this.premiseOverride = premise;
    }

    // [FIX 1] Serialization methods
    serialize(): string {
        return JSON.stringify({
            currentGenre: this.currentGenre,
            toneOverride: this.toneOverride,
            premiseOverride: this.premiseOverride
        });
    }

    deserialize(json: string): boolean {
        try {
            const data = JSON.parse(json);
            if (data.currentGenre) this.currentGenre = data.currentGenre; // Validate schema?
            this.toneOverride = data.toneOverride || null;
            this.premiseOverride = data.premiseOverride || null;
            logger.info('GenreManager', 'Deserialized genre state');
            return true;
        } catch (e) {
            logger.error('GenreManager', 'Failed to deserialize genre state', { error: e });
            return false;
        }
    }

    /**
     * MUTATES the current genre rules with a deep merge.
     * Used by Scenario Cards or Player Card Mutations.
     */
    /**
     * MUTATES the current genre rules with a deep merge.
     * Used by Scenario Cards or Player Card Mutations.
     */
    setRuntimeOverrides(overrides: Partial<GenreRules>) {
        if (!this.currentGenre) {
            logger.warn('GenreManager', 'Cannot set overrides: No genre loaded.');
            return;
        }

        // Deep Merge Logic (Simplified for now)
        // 1. Meta
        if (overrides.meta) {
            this.currentGenre.meta = { ...this.currentGenre.meta, ...overrides.meta };
        }
        // 2. Physics
        if (overrides.physics) {
            // Merge biases if present
            if (overrides.physics.biases && this.currentGenre.physics.biases) {
                this.currentGenre.physics.biases = { ...this.currentGenre.physics.biases, ...overrides.physics.biases };
            }
        }

        // 3. Narrative Flavor
        if (overrides.narrative_flavor) {
            this.currentGenre.narrative_flavor = { ...this.currentGenre.narrative_flavor, ...overrides.narrative_flavor };
        }

        // Direct mutation now - no separate tracking needed
        logger.info('GenreManager', 'Applied Runtime Overrides to Genre', { overrides: Object.keys(overrides) });
    }

    // Removed getRuntimeOverrides - we serialize the whole state now

    /**
     * Loads a genre ruleset by filename (e.g., 'mundane')
     */
    async loadGenre(genreId: string): Promise<boolean> {
        try {
            const filePath = path.join(this.genresPath, `${genreId}.json`);

            if (!fs.existsSync(filePath)) {
                logger.error('GenreManager', `Genre file not found: ${genreId}`);
                return false;
            }

            const rawData = fs.readFileSync(filePath, 'utf-8');
            const json = JSON.parse(rawData);

            // Validate against Schema
            const parsed = GenreSchema.parse(json);
            this.currentGenre = parsed;

            logger.info('GenreManager', `Genre Loaded: ${parsed.meta.name}`, { id: genreId });
            return true;
        } catch (error: any) {
            logger.error('GenreManager', `Failed to load genre: ${genreId}`, { error: error.message });
            return false;
        }
    }

    /**
     * Returns the currently active ruleset.
     * Throws if no genre is loaded (Critical system failure).
     */
    getRules(): GenreRules {
        if (!this.currentGenre) {
            throw new Error("GenreManager: No genre loaded. Call loadGenre() first.");
        }
        return this.currentGenre;
    }

    /**
     * Returns the effective tone list, respecting overrides.
     */
    getEffectiveTone(): string {
        if (!this.currentGenre) return "neutral";

        let toneKeywords = this.currentGenre.narrative_flavor.tone_keywords;

        // Resolve Tone Override
        if (this.toneOverride && this.toneOverride !== 'None') {
            const mappedTone = this.TONE_MAP[this.toneOverride];
            if (mappedTone) {
                toneKeywords = mappedTone;
            } else {
                // [FIX 9] Sanitize input
                const sanitized = this.toneOverride.replace(/[^a-zA-Z0-9\s,\-]/g, '');
                if (sanitized.length > 0) {
                    toneKeywords = [sanitized];
                } else {
                    logger.warn('GenreManager', 'Invalid tone override, using default');
                }
            }
        }
        return toneKeywords.join(', ');
    }

    /**
     * Returns a partial prompts string for the LLM context.
     */
    getGenrePrompt(): string {
        if (!this.currentGenre) return "";
        const g = this.currentGenre;

        let toneKeywords = g.narrative_flavor.tone_keywords;

        // Resolve Tone Override
        if (this.toneOverride && this.toneOverride !== 'None') {
            const mappedTone = this.TONE_MAP[this.toneOverride];
            if (mappedTone) {
                // Use curated list
                toneKeywords = mappedTone;
            } else {
                // [FIX 9] Sanitize
                const sanitized = this.toneOverride.replace(/[^a-zA-Z0-9\s,\-]/g, '');
                if (sanitized.length > 0) {
                    toneKeywords = [sanitized];
                }
            }
        }
        const toneString = toneKeywords.join(', ');

        // Resolve Premise
        let premiseString = "";
        if (this.premiseOverride) {
            const flavor = g.narrative_flavor.premise_flavors?.find(p => p.name === this.premiseOverride);
            if (flavor) {
                premiseString = `Premise: ${flavor.description} (Keywords: ${flavor.keywords.join(', ')})`;
            }
        }

        return `
[GENRE & PHYSICS RULES]
World: ${g.meta.name}
${premiseString}
Tone: ${toneString}
Physics: ${g.physics.supernatural_rules}
Allowed Entities: ${g.allowed_entities?.sentient_species?.join(', ') || 'Any'}
CRITICAL: Do NOT violate these constraints.
        `.trim();
    }
}

// Singleton for easy access if needed, though clean DI is preferred
export const genreManager = new GenreManager();
