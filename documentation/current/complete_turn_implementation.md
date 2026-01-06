### 6.5 Complete Turn Sequence (Implementation Guide)

**Purpose:** This section provides a detailed, step-by-step breakdown of exactly what happens during each turn of gameplay. This is the implementation-level specification that an AI agent would follow to build the system.

**Design Priority:** Exemplary output quality is the primary goal. Take as many LLM calls as needed, send full context every time, no time constraints, no token count optimization. Quality over speed/efficiency in all cases.

---

#### Turn Types

1. **Action Turn** - Player takes an action that affects the world
2. **Observation Turn** - Player observes without acting ("look around", "wait")
3. **Scene Transition Turn** - Player moves to new location

---

#### MAIN TURN SEQUENCE (Action Turn)

**STEP 1: Receive Player Input**

**Component:** Input Handler  
**Input:** Raw natural language from player  
**Output:** Sanitized text string

**Example:**
```
Player types: "I slap Olga across the face"
Output: "I slap Olga across the face"
```

**Edge Cases:**
- Empty input → Request clarification
- Multi-action input → Treat as complete intent (see Edge Cases section below)
- Ambiguous input → Proceed to reference resolution (handles there)

---



**NOTE:** Detailed implementation of Reference Resolution (STEP 2) and Action Classification (STEP 3) have been moved to Section 9.1 and 9.2 for better organization. See those sections for complete specifications.

The steps below provide an overview. For full implementation details, see Section 8.

**STEP 4: World State Query**

**Component:** World State Database (Section 4.1)  
**Input:** Resolved action structure  
**Output:** Complete context for consequence generation

**Query Operations:**
1. Get player entity (full state, inventory, capabilities)
2. Get target entity (if exists)
3. Get all entities at current location
4. Get location properties
5. Get recent events (last 10-20 turns from event log)
6. Get relevant relationships (player ↔ present entities)
7. Get active opportunities at location
8. Get genre rules for setting

**Example Output:**
```json
{
  "player": {
    "entity_id": "player_001",
    "name": "You",
    "health_status": "healthy",
    "inventory": [],
    "capabilities": {"strength": "average", "combat": "untrained"},
    "current_stress": "moderate",
    "event_knowledge": "ALL"
  },
  "target": {
    "entity_id": "npc_olga_001",
    "name": "Olga",
    "health_status": "healthy",
    "traits": {"personality": "tough, short-tempered", "appearance": "intimidating"},
    "relationships": [rel_olga_player_001],
    "inventory": ["obj_revolver_001"],
    "capabilities": {"combat": "expert"},
    "event_knowledge": [...]
  },
  "location": {
    "entity_id": "loc_bar_001",
    "name": "The Dirty Ditch",
    "type": "bar",
    "atmosphere": "crowded (~20 patrons), dim lighting, moderate noise",
    "notable_features": "bouncer_present"
  },
  "witnesses": [
    {"entity_id": "npc_marcus_001", "name": "Marcus", "role": "bouncer"},
    {"entity_id": "npc_frank_001", "name": "Frank", "role": "bartender"}
  ],
  "genre_rules": {
    "setting": "mundane_earth",
    "magic": false,
    "realistic_physics": true
  },
  "recent_events": [
    "Turn 48: Player arrived at bar",
    "Turn 49: Olga has been watching player suspiciously"
  ]
}
```

---

**STEP 5: Consequence Engine - Stage 1 (Action Outcome)**

**Note:** This step is **ONLY executed for UNCERTAIN actions**. CERTAIN actions bypass the Consequence Engine entirely (see STEP 3).

**Component:** Consequence Engine (Section 4.5)  
**Input:** Action + World State Context  
**Output:** Single selected outcome

**Process:**

**5A. LLM Generation**
```
Prompt includes:
- Player action
- Player capabilities, health_status, inventory, constraints, state
- Target state (if applicable)
- Location context
- Genre rules
- Instruction: Generate FULL SPECTRUM of outcomes (CRITICAL_SUCCESS through CRITICAL_FAILURE)
- Instruction: All outcome types must be represented

LLM returns:
[
  {outcome: "perfect_slap", type: "CRITICAL_SUCCESS", weight: 0.05, ...},
  {outcome: "slap_connects", type: "SUCCESS", weight: 0.4, ...},
  {outcome: "slap_connects_hurt_hand", type: "SUCCESS_WITH_COMP", weight: 0.25, ...},
  {outcome: "glancing_blow", type: "PARTIAL_SUCCESS", weight: 0.15, ...},
  {outcome: "miss_completely", type: "FAILURE", weight: 0.1, ...},
  {outcome: "olga_dodges_counters", type: "FAILURE_WITH_COMP", weight: 0.03, ...},
  {outcome: "slip_fall", type: "CRITICAL_FAILURE", weight: 0.02, ...}
]
```

**5B. Validation**
```
For each outcome:
  Check Consistency Enforcer:
  - Does player have required capabilities?
  - Does target exist and conscious?
  - Does outcome violate genre rules?
  - Are all entity references valid?

Invalid outcomes → Filter out

IF all outcomes invalid:
  Retry generation with corrections (max 3 attempts)
  IF still invalid after 3 attempts:
    Use fallthrough (accept with warning log)
```

**5C. Probabilistic Selection**
```python
valid_outcomes = [outcomes that passed validation]
weights = [outcome.weight for outcome in valid_outcomes]

selected_outcome = random.choices(valid_outcomes, weights=weights)[0]
```

**5D. Apply World State Changes**
```
For each effect in selected_outcome.effects:
  world_state.apply(effect)

Example:
- olga.health_status = "hit"
- olga.damage_level = "minor"
- location.alert_level = "high"
```

**Output:**
```json
{
  "outcome_id": "action_outcome_001",
  "type": "SUCCESS",
  "description": "Slap connects cleanly across her cheek",
  "effects_applied": ["olga_hit", "damage_minor", "crowd_attention"]
}
```

---

**STEP 6: Consequence Engine - Stage 2 (Target Reaction)**

**Component:** Consequence Engine  
**Input:** Action outcome + Target entity state  
**Output:** Single selected reaction

**Process:**

**5A. Check if Target Can React**
```
IF target is:
  - Unconscious → Skip to Stage 3
  - Dead → Skip to Stage 3
  - Not sentient (object) → Skip to Stage 3
ELSE → Generate reaction
```

**5B. LLM Generation**
```
Prompt includes:
- What just happened (action outcome from Stage 1)
- Target's health_status, traits, capabilities, state
- Target's relationship to player
- Target's event_knowledge (relevant past interactions)
- Location context
- Full spectrum instruction

LLM returns reactions:
[
  {reaction: "draws_weapon_threatens", weight: 0.4, ...},
  {reaction: "swings_back", weight: 0.3, ...},
  {reaction: "stumbles_back_shocked", weight: 0.2, ...},
  {reaction: "laughs_dismissively", weight: 0.08, ...},
  {reaction: "calls_for_help", weight: 0.02, ...}
]
```

**5C. Validation**
```
For each reaction:
  - Does target have required items (weapon, phone)?
  - Is reaction physically possible given target state?
  - Does reaction match target capabilities?

Invalid → Filter out
```

**5D. Selection & Application**
```python
selected_reaction = random.choices(valid_reactions, weights)[0]

Apply to world state:
- olga.state = "weapon_drawn"
- olga.held_item = "revolver"
- olga.stance = "threatening"
```

**Output:**
```json
{
  "reaction_id": "target_reaction_001",
  "entity": "npc_olga_001",
  "reaction": "draws_weapon_threatens",
  "description": "Olga's hand moves to her jacket, producing a revolver"
}
```

---

**STEP 7: Consequence Engine - Stage 3 (Witness Reactions)**

**Component:** Consequence Engine  
**Input:** Action outcome + Target reaction + Witness entities  
**Output:** Array of witness reactions (one per named witness)

**Process:**

**6A. Identify Witnesses**
```
witnesses = entities_at_location - [player, target]

Filter to NAMED entities only:
- npc_marcus_001 (named: Marcus) → Include
- npc_frank_001 (named: Frank) → Include
- generic_patron_001 (unnamed: "a patron") → Exclude (handled by narrator as scenery)
```

**6B. For Each Named Witness**
```
Loop through witnesses:
  
  6B.1 - LLM Generation
    Prompt includes:
    - What witness observed (action outcome + target reaction)
    - Witness's relationship to player and target
    - Witness's role, capabilities, traits
    - Witness's current state
    - Witness's event_knowledge (relevant history)
    
    Returns weighted reactions
  
  6B.2 - Validation
    Check consistency (can witness perform this action?)
  
  6B.3 - Selection
    Dice roll selects one reaction
  
  6B.4 - Apply to world state
    Update witness entity state
```

**Example for Marcus (bouncer):**
```
LLM returns:
[
  {reaction: "moves_to_intervene", weight: 0.5},
  {reaction: "calls_police", weight: 0.2},
  {reaction: "watches_carefully", weight: 0.2},
  {reaction: "ignores_escalates", weight: 0.1}
]

Selected: "moves_to_intervene"

Apply:
- marcus.position = "approaching"
- marcus.intent = "de-escalate"
- marcus.state = "alert"
```

**Output:**
```json
{
  "witness_reactions": [
    {
      "entity": "npc_marcus_001",
      "reaction": "moves_to_intervene",
      "description": "Marcus is already moving toward you"
    },
    {
      "entity": "npc_frank_001",
      "reaction": "ducks_behind_bar",
      "description": "Frank disappears below the bar with a curse"
    }
  ]
}
```

---

**STEP 8: Consequence Engine - Stage 4 (Scene Narration)**

**Component:** Scene Narrator (Section 4.11)  
**Input:** All selected outcomes (action + target + witnesses) + Location state  
**Output:** Prose description

**Process:**

**7A. Compile Context**
```json
{
  "action_outcome": "Slap connects cleanly",
  "target_reaction": "Olga draws weapon and threatens",
  "witness_reactions": [
    "Marcus moves to intervene",
    "Frank ducks behind bar"
  ],
  "location": "The Dirty Ditch (bar)",
  "nameless_npcs": "~20 bar patrons present",
  "atmosphere": "Tense, suddenly silent"
}
```

**7B. LLM Generation (NO DICE ROLL)**
```
Prompt:
- Compile into 2-4 paragraphs
- Second person present tense
- Natural flow (action → reaction → consequences)
- Include atmospheric details
- Mention nameless NPCs as crowd behavior
- NO meta-game language

Single LLM call returns prose
```

**7C. Entity Validation (Soft)**
```
Check: Does narration reference entities that don't exist?

IF invalid:
  Regenerate (max 2 attempts)
  IF still invalid:
    Sanitize (remove invalid references)
```

**Output:**
```
You slap Olga hard across the face. Your hand connects with a sharp crack 
that echoes through the bar. Her head snaps to the side, and for a heartbeat, 
there's shocked silence.

Then her hand moves to her jacket with practiced speed, producing a snub-nosed 
revolver that she levels at your chest. The metal gleams under the bar's dim 
lights. "You just made the worst mistake of your life," she says, her voice 
deadly calm despite the red mark blooming on her cheek.

Marcus, the bouncer, is already moving toward you, his large frame cutting 
through the scattering crowd. "Easy, Olga," he says, hands up, positioning 
himself to intervene. Behind the bar, Frank disappears from view with a muttered 
curse. Around you, patrons scramble for the exits or dive under tables, chairs 
scraping against the floor in panic.
```

---

**STEP 9: Consequence Engine - Stage 5 (Ripple Effects)**

**Component:** Deterministic World State Updates  
**Input:** All participants and witnesses  
**Output:** Updated relationships, goals, memories, event_knowledge (NO LLM)

**Process:**

**8A. Update Relationships**
```python
# Olga was slapped by player
relationships.update(
  entity_a=npc_olga_001,
  entity_b=player_001,
  changes={
    'strength': 'hostile',  # Escalated from neutral to hostile
    'tags': ['physically_assaulted_me', 'dangerous'],
    'history': append('player_slapped_me_in_public')
  }
)

# Marcus witnessed player violence
relationships.update(
  entity_a=npc_marcus_001,
  entity_b=player_001,
  changes={
    'strength': 'negative',  # Worsened opinion
    'tags': ['troublemaker', 'witnessed_violence'],
    'history': append('witnessed_start_violence')
  }
)

# Frank witnessed violence in his bar
relationships.update(
  entity_a=npc_frank_001,
  entity_b=player_001,
  changes={
    'strength': 'strained',  # Customer relationship damaged
    'tags': ['caused_violence_in_my_bar'],
    'history': append('caused_violence_in_my_bar')
  }
)
```

**8B. Create/Update Goals**
```python
# Olga sets revenge goal
goals.create(
  entity=npc_olga_001,
  goal={
    'type': 'REVENGE',
    'target': player_001,
    'priority': 'HIGH',
    'created_turn': current_turn
  }
)

# Frank sets avoidance goal
goals.create(
  entity=npc_frank_001,
  goal={
    'type': 'AVOID',
    'target': player_001,
    'action': 'ban_from_bar',
    'priority': 'MEDIUM'
  }
)
```

**8C. Record Event and Update event_knowledge**
```python
event = {
  'event_id': generate_id(),
  'type': 'violence',
  'turn': current_turn,
  'timestamp': current_timestamp(),
  'description': 'Player slapped Olga in bar, Olga drew weapon',
  'location': loc_bar_001,
  'participants': [player_001, npc_olga_001],
  'witnesses': [npc_marcus_001, npc_frank_001],
  'consequences': ['olga_hostile', 'marcus_intervening', 'crowd_fleeing'],
  'visibility': {
    'public': false,
    'known_by': [player_001, npc_olga_001, npc_marcus_001, npc_frank_001],
    'witnessed_by': [npc_marcus_001, npc_frank_001],
    'reported_by': []
  },
  'tags': ['violence', 'confrontation']
}

# Log event globally
world_state.event_log.append(event)

# Update participant event_knowledge
npc_olga_001.event_knowledge.append({
  'event_id': event.event_id,
  'turn': current_turn,
  'role': 'participant',
  'summary': 'Player slapped me in bar, I drew weapon'
})

# Update witness event_knowledge
npc_marcus_001.event_knowledge.append({
  'event_id': event.event_id,
  'turn': current_turn,
  'role': 'witness',
  'summary': 'Witnessed player slap Olga, intervened'
})

npc_frank_001.event_knowledge.append({
  'event_id': event.event_id,
  'turn': current_turn,
  'role': 'witness',
  'summary': 'Witnessed violence in my bar'
})

# Player has event_knowledge = "ALL", no update needed
```

**8D. NPC Pending Actions**
```python
# Marcus might call police (pending)
npc_marcus_001.pending_actions.append({
  'action_id': generate_id(),
  'action': 'call_police',
  'probability': 0.7,
  'trigger': 'if_violence_escalates',
  'created_turn': current_turn
})

# Frank might ban player (pending)
npc_frank_001.pending_actions.append({
  'action_id': generate_id(),
  'action': 'ban_player',
  'probability': 0.9,
  'trigger': 'after_incident_ends',
  'created_turn': current_turn
})
```

---

**STEP 10: Present Narration to Player**

**Component:** Output Handler  
**Input:** Compiled narration from Step 7  
**Output:** Display to user interface

**Process:**
```
1. Format narration for display
2. Add any system messages if needed (warnings, clarifications)
3. Send to UI
4. Log turn completion
```

**Example Output to Player:**
```
You slap Olga hard across the face. Your hand connects with a sharp crack 
that echoes through the bar...

[Full narration from Step 7]

What do you do?
```

---

**STEP 11: Increment Turn Counter & Update State**

**Component:** Game State Manager  
**Input:** Current turn number  
**Output:** Updated turn counter + timestamp

**Process:**
```python
game_state.current_turn += 1
game_state.last_action_timestamp = current_timestamp()
game_state.turns_history.append({
  'turn': game_state.current_turn,
  'action': action_summary,
  'location': current_location
})
```

---

**STEP 12: Post-Turn Processing**

**11A. Resolve Immediate Pending Actions**
```
Check all NPCs at current location:
  IF npc.pending_actions has trigger == "immediate":
    Resolve now (becomes new scene complication)
```

**Example:**
```
Olga has gun drawn (from Stage 2)
System might prompt: "Olga's finger tightens on the trigger. What do you do?"
(This could trigger another turn before player gets normal input)
```

**11B. Check for Ambient Events**
```
Query Ambient Event Generator:
- Location
- Time of day
- World state
- Recent tension level

IF ambient event triggered (low probability):
  Present as part of scene
  
Example (rare):
  "Police sirens approach in the distance"
```

**11C. Update Pacing Monitor**
```
pacing_monitor.record_turn({
  'tension_level': calculate_tension(turn_events),
  'violence': True,
  'stakes': 'high',
  'turn': current_turn
})

pacing_monitor.analyze_recent_pattern()
# Stores for use in next Opportunity Generation
```

---

**STEP 13: Await Player Input**

**Component:** Input Handler  
**State:** Idle, waiting for next action

```
System is now ready for next player input
Game loop returns to STEP 1
```

---

#### OBSERVATION TURN (Modified Sequence)

When player takes no action ("look around", "wait", "examine room"):

**Differences from Action Turn:**

STEPS 1-4: Same (input, reference resolution, action classification, world query)

**Note:** Observation actions are typically classified as CERTAIN, so they bypass full Consequence Engine.

STEP 5: **SKIP Consequence Engine Stages 1-3** (or bypass if CERTAIN)
- No action outcome (nothing to resolve)
- No target reaction (no target)
- No witness reactions (nothing to react to)

STEP 5-ALT: **Opportunity Generation**
```
Query Opportunity Generator:
- Current location
- Recent events
- Player goals
- Time passage

Generate 1-3 opportunities:
- Conversation snippets
- Noticed objects
- People approaching
- Information available
```

STEP 6: **Scene Narration**
```
LLM generates description of:
- Current location state
- Entities present
- Available opportunities
- Atmosphere
```

STEPS 7-13: Same (ripple effects minimal, present narration, await input)

---

#### SCENE TRANSITION TURN

When player moves to new location ("I leave the bar", "I go to the office"):

**Differences:**

STEPS 1-4: Same (input, reference resolution, action classification, world query)

**Note:** Travel actions are typically classified as CERTAIN unless there are complications (dangerous travel, stealth required, etc.)

STEP 5: **Location Change** (if CERTAIN) or **Consequence Engine** (if UNCERTAIN travel)
```
1. Validate: Can player access new location?
   - Check prerequisites (locked? accessible?)
   - Check distance (realistic travel time?)
   
2. Apply location change:
   - player.current_location = new_location
   
3. Update time:
   - Estimate travel time
   - Advance world clock
   
4. Resolve time-based pending actions:
   - Any NPC actions triggered during travel
```

STEP 6: **New Location Scene Setup**
```
Query world state for new location:
- Location properties
- Entities present at new location
- Active opportunities at location

IF location visited before:
  - Load existing location state
  - Check for changes since last visit
  
IF location new:
  - Generate location details (lazy)
  - Populate with appropriate entities
```

STEP 7: **Scene Narration**
```
Describe:
- Transition (leaving old location)
- Travel (if significant)
- Arrival at new location
- Initial impressions of new scene
```

STEPS 8-13: Same

---

#### EDGE CASES & SPECIAL HANDLING

**Multiple Actions in One Input**
```
Player: "I punch Marcus and then run out the door"

Approach: Treat as complete stated intent, generate outcomes that account for full plan

Consequence Engine generates outcomes spanning the entire intent:
[
  {
    outcome: "both_succeed",
    type: "SUCCESS",
    weight: 0.25,
    description: "Punch lands, Marcus stumbles, you sprint out before anyone reacts"
  },
  {
    outcome: "punch_succeeds_escape_blocked",
    type: "SUCCESS_WITH_COMPLICATION",
    weight: 0.35,
    description: "Marcus takes the hit, but Olga blocks the exit with gun drawn"
  },
  {
    outcome: "punch_fails_grabbed",
    type: "FAILURE_WITH_COMPLICATION",
    weight: 0.30,
    description: "Marcus deflects and grabs your arm. You're not going anywhere"
  },
  {
    outcome: "complete_failure",
    type: "CRITICAL_FAILURE",
    weight: 0.10,
    description: "You swing wildly, miss, lose balance. Marcus pins you down"
  }
]

Narration flows naturally without meta-questions:
"You swing at Marcus with everything you've got. Your fist connects with his jaw 
and his head snaps back. You pivot toward the door, already running. But Olga is 
faster. She steps into your path, revolver leveled at your chest."

No system interruptions asking which action to take first. Player intent is respected,
world determines realistic outcomes based on capabilities and circumstances.
```

**Impossible Actions**
```
Player: "I fly to the moon"
Setting: mundane_earth (no flight, no space travel)

Consequence Engine Stage 1 returns:
[
  {outcome: "confused_onlookers", type: "FAILURE", weight: 0.7,
   description: "You spread your arms and jump. Nothing happens. People stare."},
  {outcome: "mental_health_concern", type: "FAILURE_WITH_COMP", weight: 0.2,
   description: "You announce you're flying to the moon. People look concerned."},
  {outcome: "metaphorical_interpretation", type: "SUCCESS", weight: 0.1,
   description: "You decide to pursue aerospace engineering degree."}
]

Validation passes all (realistic reactions to impossible attempt)
Dice roll selects one
```

**Ambiguous References**
```
Player: "I talk to the man"
Scene: Two men present (Marcus and patron)

Reference Resolver:
1. Detect ambiguity
2. Return to player:
   "Which person do you mean?
   1. Marcus (the bouncer)
   2. The patron at the bar"
3. Player selects
4. Continue to Step 3
```

**LLM Failure**
```
IF LLM API call fails:
  Retry (max 3 attempts with exponential backoff)
  
  IF still failing:
    Use fallback:
    - Deterministic outcome (most likely based on stats)
    - Generic narration from template
    - Log error for debugging
    - Continue game (don't block player)
```

**Validation Exhaustion**
```
After 3 validation failures:
  Log warning
  Use invalid output anyway
  Mark in development mode with ⚠️
  Continue game (don't block player)
```

---

#### IMPLEMENTATION CHECKLIST

For an AI agent implementing this:

- [ ] Set up turn counter and game state
- [ ] Implement input handler (Step 1)
- [ ] Implement reference resolver (Step 2)
- [ ] Implement world state query system (Step 3)
- [ ] Implement Consequence Engine Stage 1 (Step 4)
- [ ] Implement Consequence Engine Stage 2 (Step 5)
- [ ] Implement Consequence Engine Stage 3 (Step 6)
- [ ] Implement Scene Narrator (Step 7)
- [ ] Implement ripple effects system (Step 8)
- [ ] Implement output handler (Step 9)
- [ ] Implement turn increment (Step 10)
- [ ] Implement post-turn processing (Step 11)
- [ ] Implement game loop (Step 12)
- [ ] Add observation turn variant
- [ ] Add scene transition variant
- [ ] Add edge case handlers
- [ ] Add error handling and fallbacks
