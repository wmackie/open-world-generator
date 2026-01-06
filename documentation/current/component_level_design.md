# INTERACTIVE FICTION ENGINE - COMPONENT LEVEL DESIGN

**Simplified Overview - How Everything Fits Together**

---

## CORE PHILOSOPHY (What drives all design decisions)

**The System Facilitates Journeys, Doesn't Plan Paths**
- Player actions are resolved one at a time (atomic resolution)
- World State is the single source of truth - everything reads from it, writes to it
- Entities are generated lazily (only when needed, progressively detailed)
- System presents situations, player makes all decisions

---

## THE BIG PICTURE: ONE TURN FLOW

```
Player Input
    ↓
Reference Resolution (Step 1) - "What are you talking about?"
    ↓
Entity Instantiation (Step 2.5) - "Create it if it doesn't exist"
    ↓
Pre-Action Validation (Step 3.5) - "Is this physically possible?"
    ↓
Action Classification (Step 4) - "Certain or Uncertain?"
    ↓
    ├─→ CERTAIN (~95%) ──→ Time Estimator → Update World State
    │
    └─→ UNCERTAIN (~5%) → Consequence Engine → Update World State
                                ↓
                        Opportunity Generator
                                ↓
                        Ambient Event Generator (3% chance)
                                ↓
                        NPC Agency System
                                ↓
                        Time Management
                                ↓
                        Scene Narrator (presents everything to player)
```

---

## COMPONENT BREAKDOWN

### 1. REFERENCE RESOLUTION (Step 1)
**What it does:** Figures out what the player is talking about

**Responsibilities:**
- Detects pronouns, partial names, ambiguous references in player input
- Searches World State for matching entities
- Routes to three outcomes:
  - CLEAR: Unambiguous, proceed
  - AMBIGUOUS: Multiple matches, ask player to clarify
  - GIBBERISH: Can't parse, request rephrase

**Inputs:** Player text, World State (all entities)
**Outputs:** Resolved entity IDs or clarification request
**Connection:** Gates the entire turn - nothing proceeds without clear references

---

### 2. ENTITY INSTANTIATION SYSTEM (Step 2.5)
**What it does:** Creates entities on-demand when player references something that doesn't exist yet

**Responsibilities:**
- Detects when player references non-existent entities
- Creates "skeleton" entities (Minimum Viable Entity)
- Three tiers of detail:
  - **Scenery**: Background elements (trees, cars) - minimal tracking
  - **Named**: Referenced entities get IDs and basic properties
  - **Detailed**: Frequently interacted entities get full details
- Prevents "that doesn't exist" responses

**Inputs:** Player reference to unknown entity, current scene context
**Outputs:** New entity record in World State
**Connection:** Runs after Reference Resolution, before classification

---

### 3. PRE-ACTION VALIDATION SYSTEM (Step 3.5)
**What it does:** Checks if "certain" actions are physically possible before executing

**Responsibilities:**
- Validates player has necessary items/abilities
- Checks if target entities are present/accessible
- Verifies physical constraints (can't unlock door without key)
- Reclassifies CERTAIN→UNCERTAIN if validation fails
- Prevents impossible "certain" actions from bypassing Consequence Engine

**Inputs:** Classified action, World State
**Outputs:** VALID (proceed) or INVALID (reclassify to uncertain)
**Connection:** Safety gate between Classification and execution

---

### 4. ACTION CLASSIFICATION (Step 4)
**What it does:** Decides if action outcome is predictable or requires simulation

**Responsibilities:**
- Analyzes player action in context
- Classifies as CERTAIN (~95%) or UNCERTAIN (~5%)
- **CERTAIN examples**: Mundane actions (walk to store, read book, make coffee)
- **UNCERTAIN examples**: Social persuasion, risky actions, anything involving other agents' responses
- Routes to appropriate resolution path

**Inputs:** Player action, World State context
**Outputs:** Classification tag (CERTAIN/UNCERTAIN)
**Connection:** Determines if Consequence Engine runs or simple state update happens

---

### 5. CONSEQUENCE ENGINE (Step 5, Uncertain path only)
**What it does:** Simulates what happens for unpredictable actions

**Responsibilities:**
- Generates immediate outcomes based on context
- Creates consequences (success/failure/partial/unexpected)
- Updates World State (entity properties, relationships, events)
- **NEVER decides what player does next** - only what world does
- Considers: entity properties, relationships, recent history, environmental factors
- Applies context-aware weighting (not fixed probabilities)

**Inputs:** Player action, full World State context
**Outputs:** Outcome description, state changes, events to log
**Connection:** Core simulation engine - where drama happens

---

### 6. TIME ESTIMATOR (Step 5, Certain path only)
**What it does:** Calculates how much time passes for mundane actions

**Responsibilities:**
- Estimates realistic duration for certain actions
- Considers: action type, complexity, distance, interruptions
- Updates game clock
- **Does not generate narrative** - just time passage

**Inputs:** Certain action details
**Outputs:** Time duration (minutes)
**Connection:** Bypasses Consequence Engine for efficiency

---

### 7. OPPORTUNITY GENERATOR (Step 6)
**What it does:** Creates hooks/options for player to pursue

**Responsibilities:**
- Triggered by specific events (e.g., conversation reveals quest, item found)
- Generates opportunities with:
  - Clear trigger condition (what caused this)
  - Opportunity type (quest, item, relationship, information, location)
  - Dramatic weight (major/minor/flavor)
  - Expiration condition (all opportunities expire eventually)
- **Does not force player to pursue** - presents options only
- Pacing-aware (reduces frequency if too many opportunities exist)

**Inputs:** Consequence Engine output, current opportunity count
**Outputs:** New opportunity records in World State
**Connection:** Creates narrative hooks from consequences

---

### 8. AMBIENT EVENT GENERATOR (Step 7)
**What it does:** Adds unprompted world activity (3% chance per turn)

**Responsibilities:**
- Random chance each turn (independent of player action)
- Three severity tiers:
  - MINOR (70%): Background color (weather change, distant sound)
  - MODERATE (25%): Noticeable (NPC walks by, phone rings)
  - MAJOR (5%): Interrupting (fire alarm, urgent message)
- Grounded in current scene context
- Can interrupt planned narration for major events

**Inputs:** Current scene, time, recent events
**Outputs:** Event description (woven into narration)
**Connection:** Keeps world feeling alive between player actions

---

### 9. NPC AGENCY SYSTEM (Step 8)
**What it does:** Handles what NPCs do when player isn't interacting with them

**Responsibilities:**
- **Two-tier tracking:**
  - **Passive Mode**: NPCs outside current scene (lazy evaluation, minimal tracking)
  - **Active Mode**: NPCs in current scene (real-time decision-making)
- Generates NPC autonomous actions based on:
  - NPC goals/motivations
  - Recent events they witnessed
  - Relationships
  - Time pressure
- NPCs can initiate conversation, leave scene, react to events
- Updates NPC entity states

**Inputs:** All NPC entities, event logs, current time
**Outputs:** NPC actions (added to narrative)
**Connection:** Makes world feel lived-in, not player-reactive

---

### 10. TIME MANAGEMENT SYSTEM (Step 9)
**What it does:** Tracks game time progression

**Responsibilities:**
- Maintains current game time (timestamp)
- Advances clock based on:
  - Time Estimator output (certain actions)
  - Consequence Engine output (uncertain actions)
- Conversation timing (multi-turn accumulation)
- Scene transition handling (resolves NPCs, expires opportunities)
- Triggers opportunity expiration checks

**Inputs:** Time deltas from all action resolutions
**Outputs:** Updated game clock, expired opportunity notifications
**Connection:** Drives all time-based systems

---

### 11. SCENE NARRATOR (Step 10)
**What it does:** Presents everything that happened to the player

**Responsibilities:**
- Collects all outputs:
  - Action outcome (from Consequence Engine or simple update)
  - Ambient events (if triggered)
  - NPC actions (if any)
  - New opportunities (if generated)
  - Time passage
- Weaves into coherent narrative prose
- Highlights what changed (state updates, relationship shifts)
- Natural language presentation (not bullet points)
- Maintains tone and style consistency

**Inputs:** All system outputs from this turn
**Outputs:** Narrative text shown to player
**Connection:** Final presentation layer - player-facing

---

### 12. EVENT LOGGING SYSTEM (Runs throughout turn)
**What it does:** Records everything that happens for NPC knowledge

**Responsibilities:**
- Creates one event record per turn
- Captures:
  - What action occurred
  - Who was involved (participants)
  - Who was present (witnesses)
  - Who was mentioned (gossip targets)
  - Location, time, outcome
- Distributes event knowledge:
  - **Full fidelity**: Participants and witnesses
  - **Partial/distorted**: Second-hand (gossip, rumors)
  - **No knowledge**: Not present, not told
- Enables NPC memory/reactions later

**Inputs:** Turn outcomes, entity positions
**Outputs:** Event records stored in World State
**Connection:** Enables consistent world memory, NPC reactions

---

### 13. WORLD STATE DATABASE (Always present)
**What it does:** Single source of truth for everything

**Responsibilities:**
- Stores all entities (people, objects, locations)
- Stores all events (chronological log)
- Stores all opportunities (active and expired)
- Stores relationships (asymmetric network)
- Stores current game time
- **Every component reads from and writes to this**

**Structure:**
- **Entities**: Discriminated union (Sentient/Object/Location types)
- **Events**: Chronological log with participant/witness/mention tracking
- **Relationships**: Asymmetric pairs with qualitative descriptors
- **Opportunities**: Trigger, type, dramatic weight, expiration

**Connection:** Central hub - all components depend on this

---

### 14. CONTEXT SYSTEM (Supports all LLM calls)
**What it does:** Assembles relevant information for each component

**Responsibilities:**
- Extracts relevant subset of World State
- For each LLM call, provides:
  - Immediate scene entities (people, objects, exits)
  - Recent events (last N turns)
  - Relevant relationships
  - Active opportunities
  - Current goals/motivations
  - Genre/setting constraints
- Prevents context overload (selective inclusion)
- Ensures consistency (same facts to all components)

**Inputs:** World State, current component needs
**Outputs:** Formatted context for LLM prompt
**Connection:** Supports all LLM-based components

---

### 15. RELATIONSHIP SYSTEM (Part of World State)
**What it does:** Tracks how entities feel about each other

**Responsibilities:**
- Asymmetric pairs (A→B different from B→A)
- Qualitative descriptors (not numeric scores)
- Examples: "trusts completely", "fears", "finds annoying", "protective of"
- Updated by events (event-driven evolution)
- Used by Consequence Engine for social outcomes
- Used by NPC Agency for decision-making

**Structure:** Database matrix of entity pairs
**Connection:** Informs social dynamics throughout system

---

### 16. SCENE TRANSITION MANAGER (Part of Time Management)
**What it does:** Handles when player changes location/context

**Responsibilities:**
- Detects material context changes:
  - Leaving a location
  - Time jump (sleep, long travel)
  - Situation shift (end of event)
- Triggers workflow:
  - Resolve active scene NPCs (what do they do now?)
  - Expire completed opportunities
  - Update environmental states
  - Load new scene context
- **Does not run on minor movement** (room to room in same building)

**Inputs:** Player movement actions, time jumps
**Outputs:** World State updates, expired opportunities
**Connection:** Maintains world coherence across scenes

---

## DATA FLOW SUMMARY

**Every Turn:**
1. Player input → Reference Resolution
2. Create missing entities (if needed)
3. Validate feasibility (if certain)
4. Classify action
5. Resolve outcome (Consequence or Time)
6. Generate opportunities (if applicable)
7. Roll for ambient event (3% chance)
8. Process NPC agency
9. Update time
10. Expire opportunities (if scene transition)
11. Log event
12. Narrate everything

**World State is always:**
- Read by: All components
- Written by: Consequence Engine, Entity Instantiation, NPC Agency, Time Management
- Never directly modified by player (actions modify it through resolution)

---

## KEY CONNECTIONS

**Reference Resolution → Entity Instantiation:**
"Player mentioned X" → "X doesn't exist" → "Create X"

**Entity Instantiation → Classification:**
"Now X exists" → "Classify player's action with X"

**Classification → Consequence Engine OR Time Estimator:**
"Uncertain" → Full simulation
"Certain" → Quick time update

**Consequence Engine → Opportunity Generator:**
"Action had outcome Y" → "Y might create opportunity Z"

**Consequence Engine → Event Logging:**
"Action happened" → "Record for NPC memory"

**Event Logging → NPC Agency:**
"NPCs know about X" → "NPCs react to X"

**All Components → Scene Narrator:**
Everything that happened → Coherent prose for player

**Time Management → Scene Transition:**
"Enough time passed or location changed" → "Resolve scene"

**Scene Transition → Opportunity Expiration:**
"Scene ended" → "Incomplete opportunities fade"

---

## WHAT EACH COMPONENT NEEDS FROM WORLD STATE

**Reference Resolution:**
- All entity names/IDs
- Current scene entities
- Recently mentioned entities

**Entity Instantiation:**
- Current scene description
- Existing entities (to avoid duplicates)

**Pre-Action Validation:**
- Player inventory
- Scene entities
- Entity properties (locked/unlocked, etc.)

**Action Classification:**
- Player character sheet
- Target entity properties
- Recent events
- Relationship context

**Consequence Engine:**
- Full context: entities, relationships, events, goals, scene
- Entity properties (capabilities, states)
- Time of day
- Genre constraints

**Opportunity Generator:**
- Consequence outcomes
- Existing opportunities (pacing check)
- Player goals

**Ambient Event Generator:**
- Current scene description
- Time of day
- Recent events (context)

**NPC Agency:**
- All NPCs in active mode
- NPC goals/motivations
- Events they witnessed
- Relationships
- Current time

**Time Management:**
- Current timestamp
- All opportunities (expiration checks)

**Scene Narrator:**
- Current scene description
- Action outcomes
- Ambient events
- NPC actions
- Opportunities
- State changes

**Event Logging:**
- Action taken
- All participants
- Scene witnesses
- Mentioned entities

---

## CRITICAL RULES (What Never Happens)

**System does NOT:**
- Decide player's next action
- Force player to pursue opportunities
- Plan multi-step narratives ahead
- Make player abandon goals
- Override player agency
- Change genre/setting rules
- Track numeric "relationship scores"
- Guarantee action success
- Make NPCs omniscient
- Detail entities before player interacts with them

**System DOES:**
- Present situations
- Simulate consequences
- Track world state
- Generate options
- Maintain consistency
- Respect physics/genre
- Let player fail
- Let world evolve
- Create NPCs with limited knowledge
- Build detail progressively

---

## IMPLEMENTATION NOTES

**LLM Usage:**
- Every component with "Generator/Engine/Resolution/Classification" uses LLM
- Each has specific prompt structure
- All receive context from Context System
- All output structured data (JSON)
- Validation: 3 retry attempts before fallback

**Database:**
- Single source of truth
- All components read/write here
- No distributed state
- Save = snapshot entire database
- Load = replace entire database

**Time:**
- Every action advances clock
- Accumulates in conversations
- Triggers opportunity expiration
- Drives NPC schedules

**Opportunities:**
- All have expiration conditions
- Prevent infinite accumulation
- Generated from events, not arbitrarily
- Player can ignore without penalty

**NPCs:**
- Switch passive→active when in scene
- Switch active→passive when leaving scene
- Only active NPCs get real-time agency
- Passive NPCs tracked minimally

---

## SUMMARY: THE PIECES AND HOW THEY FIT

**Player does something** →
**System figures out what they mean** (Reference) →
**Creates it if it doesn't exist** (Instantiation) →
**Checks if it's possible** (Validation) →
**Decides if it's predictable** (Classification) →
**Simulates outcome or calculates time** (Consequence/Time) →
**Creates hooks from outcome** (Opportunities) →
**Adds world flavor** (Ambient) →
**NPCs react** (Agency) →
**Clock advances** (Time) →
**Records what happened** (Events) →
**Tells player the story** (Narrator) →
**Repeat**

Everything flows through World State.
Every component reads current state, generates outputs, writes back to state.
Player only sees final narration.
World persists between turns.
