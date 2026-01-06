import { PROMPT_TEMPLATES } from './templates';
import { GenreManager } from '../genre_manager';

export class PromptManager {
    constructor(private genreManager: GenreManager) { }

    /**
     * Renders a template by name, injecting the GENRE_BUNDLE and any provided variables.
     */
    render(templateName: keyof typeof PROMPT_TEMPLATES, variables: Record<string, any> = {}): string {
        const template = PROMPT_TEMPLATES[templateName];
        if (!template) {
            throw new Error(`PromptManager: Template not found for ${String(templateName)}`);
        }

        // 1. Construct Dynamic Bundles
        const genreBundle = this.genreManager.getGenrePrompt(); // Existing method returns the full strict block
        const sceneBundle = this.constructSceneBundle(variables);

        // 2. Base Replacements
        let output = template
            .replace('{{BUNDLE_GENRE}}', genreBundle)
            .replace('{{BUNDLE_SCENE}}', sceneBundle);

        // 3. Variable Replacements
        for (const [key, value] of Object.entries(variables)) {
            // Check if value is object/array -> stringify
            let stringVal = value;
            if (typeof value === 'object') {
                stringVal = JSON.stringify(value, null, 2);
            }
            // Replace all instances
            const placeholder = `{{${key}}}`;
            output = output.split(placeholder).join(stringVal);
        }

        return output.trim();
    }

    private constructSceneBundle(ctx: any): string {
        // Expects context to potentially have: locationName, visibleExits, npcs, objects OR location (entity), time
        // We need to support both ConsequenceContext and ActionInterpreterContext formats or standardize them.
        // For now, let's look for common keys.

        // Format A (Interpreter): locationName, visibleExits, npcs, objects
        if (ctx.locationName) {
            const locName = ctx.locationName;
            const locDesc = ctx.locationDesc || "No description provided.";
            const exits = ctx.visibleExits ? ctx.visibleExits.join(', ') : 'None';
            const npcs = ctx.npcs ? ctx.npcs.map((n: any) => {
                const name = (typeof n.name === 'string' ? n.name : n.name?.display) || "Unknown";
                return `${name} (${n.entity_id})`;
            }).join(', ') : 'None';
            const objs = ctx.objects ? ctx.objects.map((o: any) => `${o.name} (${o.entity_id})`).join(', ') : 'None';

            return `
[CURRENT SCENE]
Location: ${locName}
Description: "${locDesc}"
Visible Exits: ${exits}
NPCs Present: ${npcs}
Objects: ${objs}
            `.trim();
        }

        // Format B (Narrator/Consequence): location object
        if (ctx.location && ctx.location.name) {
            const locName = ctx.location.name;
            // We generally pass 'npcs' and 'objects' arrays in worldContext?
            // If not present, we can't invent them.
            // If they are missing, we just omit the detail or verify usage.
            // Looking at Narrator usage: it gets 'worldContext' which has location, time, opportunities.
            // It doesn't seem to pass explicit visible exits lists in Narrator calls often.
            return `
[CURRENT SCENE]
Location: ${locName}
Time: ${ctx.time?.current_time || ctx.time || 0}
            `.trim();
        }

        return "";
    }
}
