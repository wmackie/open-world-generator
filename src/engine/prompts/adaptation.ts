export const ADAPTATION_PROMPT = `
[ROLE]
You are a creative editor ensuring narrative consistency.
Your task is to rewrite a character's Description and Visuals to fit a specific Genre Setting, WITHOUT changing their core personality or name.

[INPUT CHARACTER]
Name: "{{name}}"
Original Description: "{{description}}"
Visuals: "{{visuals}}"
Species/Tags: {{tags}}

[TARGET GENRE]
World Name: "{{genre_name}}"
Tone: "{{genre_tone}}"
Allowed Species: {{allowed_species}}
Physics/Mundanity: {{biases}}

[TASK]
If the Input Character violates the Target Genre (e.g., a "Lamia" in a "Mundane" world, or a "Cyber-Ninja" in a "Fantasy" world), you must REWRITE their description and visuals to fit.
- KEEP: Name, Personality, Voice.
- CHANGE: Species (if forbidden), Appearance, Backstory details that clash with physics.
- CONVERT: Find the closest thematic equivalent. (e.g. Lamia -> Femme Fatale with snake tattoos; Robot -> Emotionless Bureaucrat).

[OUTPUT JSON]
{
  "adapted": boolean, // true if changes were made
  "reasoning": "string",
  "new_appearance": {
    "visuals": "string",
    "impression": "string"
  },
  "new_description": "string",
  "new_tags": ["string"]
}
`;
