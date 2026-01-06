export const CARD_INGESTION_PROMPT = `
[ROLE]
You are an expert narrative designer and data analyst. Your job is to convert raw character card data into a strict internal JSON schema for an Interactive Fiction engine.

[INPUT DATA]
Name: "{{name}}"
Description: "{{description}}"
Message Example: "{{mes_example}}"
First Message: "{{first_mes}}"
Scenario: "{{scenario}}"
Tags: {{tags}}

[SCHEMA REQUIREMENTS]
You must populate the following fields. Do not invent information if it contradicts the text, but infer reasonable defaults from the "Vibe" if missing.

1.  **Voice**: Analyze "Message Example" and "First Message".
    *   reference: 1-2 words describing the sound (e.g., "Rough Baritone", "Silky Alto").
    *   tone_tags: 3-5 adjectives (e.g., "sarcastic", "wistful", "authoritative").
    *   mannerisms: Specific speech patterns (e.g., "Uses archaic pronouns", "Stutters when nervous").
2.  **Psychology**: Analyze "Description" and "Personality".
    *   motivation: What drives them? (1 sentence).
    *   core_wound: A past trauma or defining negative belief (can be null).
    *   insecurities: List of specific fears or doubts.
    *   social_strategy: How they navigate people (e.g., "Intimidation", "Seduction", "Diplomacy").
3.  **Moral Compass**: Infer from behavior.
    *   virtues: Positive traits they value.
    *   vices: Negative traits they embody.
4.  **Capabilities**: Infer skills from description (Proficiency: untrained, basic, competent, expert, master).
5.  **Appearance**:
    *   visuals: Physical description.
    *   impression: The immediate specific vibe they give off.

[OUTPUT JSON FORMAT]
{
  "voice": {
    "reference": "string",
    "tone_tags": ["string"],
    "mannerisms": ["string"]
  },
  "psychology": {
    "motivation": "string",
    "core_wound": "string | null",
    "insecurities": ["string"],
    "social_strategy": "string"
  },
  "moral_compass": {
    "virtues": ["string"],
    "vices": ["string"]
  },
  "appearance": {
    "visuals": "string",
    "impression": "string"
  }
}
`;
