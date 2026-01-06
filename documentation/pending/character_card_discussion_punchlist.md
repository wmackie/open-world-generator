# Character Card Integration: Discussion Punchlist

## 1. Import Strategy & Schema Mapping
- **Format Support:** Which standards do we support? (V2 Spec, TavernPNG, SillyTavern extensions?)
- **Field Mapping:** How do we map loose text fields (e.g., `Description`, `Personality`) to our structured `Entity` schema (`psychology.motivation`, `appearance.visuals`)?
- **Data Loss:** What do we do with data we can't map? (Store in a `meta` field? Discard?)

## 2. Voice & Style Extraction (The "Face Claim" Problem)
- **Problem:** Cards rely on `example_dialogue` for voice. Our system relies on `voice.reference` (Face Claim) and `speech_style.tone_tags`.
- **Proposed Solution:** Do we run an "Ingestion LLM Pass" to analyze the card's dialogue and generate the appropriate tags/face claim for our DB?

## 3. Deployment & Instantiation
- **Spawning Logic:** When a user imports a card, where do they appear?
    - *Immediate:* Spawns in current room?
    - *World:* Spawns somewhere in the world, to be found later?
- **State Initialization:** How do we generate their initial `current_action`, `goals`, and `relationships` if the card doesn't specify them? (Likely use our existing `fleshOutEntity` logic?)

## 4. Scenario & Greeting Conflict
- **Greetings:** Cards often have a "First Message". Using this forces a specific context.
- **Conflict:** If the player is in a "Burning Building" and imports a "Maid in a Cafe" card with a greeting "Welcome to the cafe!", how do we reconcile the narrative reality?
    - *Option A:* Suppress greeting (Card adapts to World).
    - *Option B:* Force greeting (World warps to Card).

## 5. Genre & Plausibility Validation
- **The "Superman" Problem:** What happens when a High Fantasy card is imported into a Gritty Noir save file?
- **Plausibility Checker:** Will our newly enhanced Plausibility Checker reject the import's abilities/items? We need a "Genre Adaptation" or "Safety Override" flag.
