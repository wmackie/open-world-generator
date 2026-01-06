### 6.1 Primary Flow: Player Action

```
1. PLAYER INPUT (natural language)
    ↓
2. ACTION INTERPRETER & REFERENCE RESOLVER
   - Parse input with LLM (CLEAR/AMBIGUOUS/GIBBERISH)
   - MINIMAL CONTEXT QUERY: Only entities referenced in player input
   - Match entity references to entity_ids
   - Handle ambiguity (ask for clarification)
   - Output: Resolved action with entity_ids OR clarification request
    ↓
3. ACTION CLASSIFICATION (Certain vs Uncertain)
   - Classify action as CERTAIN (95%) or UNCERTAIN (5%)
   - CERTAIN: predetermined outcome, bypass Consequence Engine
   - UNCERTAIN: genuine probability distribution needed
   - Routing decision made here
    ↓
   [IF CERTAIN] ─────────────────────┐
    ↓                                 ↓
4. WORLD STATE CONTEXT QUERY         4-ALT. CERTAIN ACTION HANDLER
   - FULL CONTEXT QUERY: All scene entities  - Apply predetermined outcome
   - Gather relevant entities               - Estimate time deterministically
   - Prepare context for CE                 - Skip to STEP 9 or narration
   - Recent events, relationships           - (Uses minimal context only)
    ↓                                 ↓
5. CONSEQUENCE ENGINE: Generation     [Rejoins at STEP 9]
   - Generate 7 outcomes (spectrum)
   - All types represented
   - Context-aware weights
    ↓
6. VALIDATION: Multi-Pass
   - Entity validation
   - Consistency enforcement
   - Targeted regeneration (max 3)
   - Build valid_pool
    ↓
7. CONSEQUENCE ENGINE: Selection
   - Probabilistic roll
   - Select single outcome
   - Extract time_elapsed
    ↓
8. WORLD STATE DATABASE UPDATE
   - Apply consequence changes
   - Update entity states
   - Record event & distribute knowledge
   - Advance time
    ↓
9. NPC AGENCY SYSTEM
   - Affected NPCs react
   - Queue autonomous actions
   - Immediate vs delayed reactions
    ↓
10. AMBIENT EVENT GENERATOR
    - Roll for ambient event (3% per turn)
    - If triggered: determine severity
    - Generate contextual event
    - Will be woven into narration
    ↓
11. OPPORTUNITY GENERATOR
    - Scan updated world state
    - Generate hooks (location, goals, events)
    - Filter by pacing and context
    - Select 1-3 to present
    - All have expiration conditions
    ↓
12. PACING MONITOR
    - Calculate scene tension
    - Detect patterns (escalation/stagnation)
    - Adjust generator parameters
    ↓
13. SCENE NARRATOR: LLM Generation
    - Input: world state, consequence, opportunities, ambient event
    - Generate prose description
    - Weave ambient event by severity
    - Output: Scene narration text
    ↓
14. ENTITY VALIDATOR (Soft)
    - Check narration for invalid references
    - Regenerate or sanitize if needed
    - Output: Validated narration
    ↓
15. PRESENT TO PLAYER
    - Display narration
    - Wait for next player input
    ↓
[Loop back to step 1]
```

### 6.2 Secondary Flow: Time Passage / Scene Transition

```
1. TIME ADVANCES (player chooses to wait, travel, sleep, etc.)
    ↓
2. AMBIENT EVENT GENERATOR
   - Roll for events during time passage
   - Multiple rolls if significant time (days, weeks)
   - Apply events to world state
    ↓
3. NPC AGENCY SYSTEM
   - Resolve pending actions with time-based triggers
   - Generate autonomous NPC activities during time passage
   - Update NPC states (jobs, locations, relationships)
    ↓
4. WORLD STATE DATABASE UPDATE
   - Apply all changes from ambient events and NPC actions
    ↓
5. OPPORTUNITY GENERATOR
   - Generate opportunities for new scene/location
    ↓
6. SCENE NARRATOR
   - Describe new situation
    ↓
7. PRESENT TO PLAYER
```

### 6.3 Validation Gates (Critical Checkpoints)

**Gate 1: Reference Resolution (Before Consequence Generation)**
- Ensures player input references valid entities
- Prevents hallucination at input stage

**Gate 2: Entity Validation (After Consequence Generation)**
- Ensures LLM-generated consequences reference valid entities
- Removes invalid options before selection

**Gate 3: Consistency Enforcement (After Consequence Selection)**
- Ensures selected consequence doesn't violate world rules
- Final gate before world state modification

**Gate 4: Entity Validation (After Narration Generation)**
- Ensures narration doesn't reference invalid entities
- Soft gate (can sanitize rather than hard reject)

**Gate 5: World State Write Protection**
- Database itself rejects writes with invalid entity_ids
- Last resort safety net

### 6.4 Information Flow Constraints

**One-Way Flow:**
- Later stages cannot reach back to modify earlier stages
- Narrator cannot change consequences
- Opportunities cannot force actions
- Pacing cannot override consistency

**Separation of Concerns:**
- LLM components generate creative content
- Deterministic components validate and select
- Database maintains authoritative state
- No component has unchecked power

**Validation Before Application:**
- All state changes validated before committing
- Failed validations trigger regeneration, not patching
- Logs capture failures for prompt improvement

---

### 6.4.5 One Tick Per Turn Rule

**Core Constraint:** Every entity (player, NPCs, world systems) advances exactly one "tick" per turn, regardless of how much time passes during that turn.

**Definition of "Tick":**
- One state update per entity
- One action or reaction per NPC
- One logical story beat for the world

**Definition of "Turn":**
- One player action attempt (regardless of outcome)
- One world state update cycle
- Variable time duration (can be seconds, hours, or days)

**On-Screen Reactions:**

Each NPC may react once to the player's action during the turn. After reacting, that NPC cannot act again until the next turn. This prevents infinite reaction chains within a single turn.

Example:
```
Turn X: Player slaps Olga
├─ Olga draws gun (her ONE reaction for Turn X)
├─ Marcus intervenes (his ONE reaction for Turn X)  
└─ Frank ducks behind bar (his ONE reaction for Turn X)

Turn X ends.

Even if Olga's gun-draw creates new ripple effects:
- Olga cannot shoot until Turn X+1
- Marcus cannot react to the gun until Turn X+1
- Each NPC used their "action budget" for this turn
```

**Off-Screen Actions:**

Pending actions resolve one at a time across turns. Information cascades occur across multiple turns, not instantly within one turn.

Example:
```
Turn 47: Secretary tells Senator (one tick)
Turn 52: Senator mentions to colleague (one tick, different turn)
Turn 58: Colleague tells opponent (one tick, different turn)

Information cascades across MULTIPLE turns, not instantly
```

**Time-Based Trigger Interruptions:**

If the player attempts a long action (sleep, wait, travel), the turn ends when:
1. The action completes naturally, OR
2. A time-based trigger fires (NPC arrives, phone rings, etc.), OR  
3. An ambient event occurs

The system advances time until the earliest of these conditions, then ends the turn. This prevents players from "fast-forwarding" past timed events.

Example:
```
Turn 50: Current time 10:00 PM
Player: "I sleep for 8 hours" (intends to wake at 6:00 AM)

Pending trigger: Assassin arrives at 12:30 AM (2.5 hours from now)

Resolution:
1. Player falls asleep
2. Time advances to 12:30 AM (2.5 hours)
3. TRIGGER FIRES: Assassin arrives
4. Consequence Engine: "Breaking glass jolts you awake"
5. Turn ends at 12:30 AM
6. Player only slept 2.5 hours

Next turn: Player must deal with assassin
```

**Turn Resolution Rule:**
```
A turn advances time until ONE of these conditions:
1. Player's intended action completes, OR
2. A time-based trigger condition is met, OR
3. An ambient event occurs

Whichever comes FIRST ends the turn.
```

**Ripple Effects and NPC Agency:**
- Ripple Effects (Step 9) update relationships and goals
- NPC Agency queues pending actions (not immediate execution)
- Queued actions resolve in future turns when triggers are met
- NPCs who already reacted this turn cannot react again

Example:
```
Turn 47: Player slaps Olga
- Olga draws gun (uses her one action)
- Gun-draw updates relationships/goals (ripple effects)
- NPC Agency queues Marcus's reaction (for next turn)
- Turn ends

Turn 48: Player's next action
- Marcus's queued reaction can now resolve
- Each NPC gets a fresh "action budget"
```

**Why This Matters:**
- Prevents infinite recursion (NPCs can't react to reactions infinitely)
- Ensures time passes consistently for all entities
- Keeps computational complexity bounded (O(n) per turn, not exponential)
- Gives player opportunity to observe and intervene in unfolding events
- Players cannot "skip over" timed events by sleeping/waiting
- NPCs execute plans on their schedule, not player's convenience
- World has independent existence that doesn't wait for player