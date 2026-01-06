**INTERACTIVE FICTION NARRATIVE ENGINE - COMPREHENSIVE DESIGN DOCUMENT**

**Version:** 4.0.0 (Structural Reorganization)  
**Date:** December 29, 2025

---

## WHAT'S NEW IN VERSION 4.0.0

**Structural Changes:**
- Consolidated version history into Appendix A (all previous version notes preserved)
- Merged Quick Navigation Guide into enhanced Table of Contents
- Clarified conceptual vs. implementation boundaries (Section 4 is now purely conceptual)
- Restructured Section 6 into focused architecture sections
- Reorganized Appendix B for better logical flow
- Moved architectural principles from appendix into main body (Section 3.7)
- Improved cross-referencing and eliminated forward references where possible

**Content Improvements:**
- Eliminated duplicate content between sections
- Standardized terminology throughout (verified v3.5.1 changes applied consistently)
- Consolidated repeated specifications (e.g., "95% certain" definition now in single location: Section 4.5)
- Added clarity notes connecting conceptual and implementation sections
- Removed redundant explanations that appeared in multiple places

**No Functional Changes:** All technical specifications from v3.5.1 are preserved. This is purely a reorganization for improved readability and maintainability.

**For complete version history from v3.2-3.5.1, see Appendix A.**

---

## TABLE OF CONTENTS

**How to Use This Document:**

- **First-time readers:** Start with Sections 1-3 for philosophy, then Section 4 for component overview
- **Implementers:** Jump to Section 5 (data model), then Sections 8-9 (turn sequence and implementations)
- **Reference lookup:** Use the Component Quick Reference below, or Appendix C (Summary Table)
- **Debugging specific scenarios:** Check Appendix B (implementation decisions and edge cases)
- **Looking for prompts:** All LLM prompts are marked with [PROMPT] throughout Section 9

**Component Quick Reference:**

| What You're Building | Concept Location | Implementation Location | Key Prompts |
|---------------------|------------------|-------------------------|-------------|
| Overall Turn Flow | 6.1-6.3 | Section 8 | Throughout Section 9 |
| Reference Resolution | 4.3 | 9.1 | 9.1 [PROMPT] |
| Action Classification | 4.5 | 9.2 | 9.2 [PROMPT] |
| Consequence Engine | 4.5 | 9.3 | 9.3 [PROMPT] |
| Opportunity System | 4.7 | 9.4 | 9.4 [PROMPT] |
| Ambient Events | 4.8 | 9.5 | 9.5 [PROMPT] |
| NPC Agency | 4.9 | 9.6 | 9.6 [PROMPT] |
| Time & Scene Management | 6.4-6.7 | 9.7 | 9.7 [PROMPT] |
| Scene Narrator | 4.11 | 9.8 | 9.8 [PROMPT] |
| Entity Instantiation | 4.4 | 9.9 | 9.9 [PROMPT] |
| Pre-Action Validation | 6.3 | 9.10 | 9.10 [PROMPT] |
| Event Logging & Knowledge | Section 7 (complete) | - | 7.1-7.5 |

---

**PART I: DESIGN PHILOSOPHY & ARCHITECTURE**

1. Problems & Motivation
2. Design Goals & Player Experience Vision
3. Architectural Philosophy
   - 3.1 Core Principle: Facilitating Journeys, Not Planning Paths
   - 3.2 Atomic Action Resolution
   - 3.3 World State as Single Source of Truth
   - 3.4 Lazy Evaluation and Progressive Detail
   - 3.5 Separation of Concerns
   - 3.6 Uncertainty vs. Certainty
   - 3.7 Preserving Player Agency
4. System Components (Conceptual Overview)
   - 4.1 Core Architectural Flow
   - 4.2 Context System
   - 4.3 Reference Resolution
   - 4.4 Entity Generation Strategy
   - 4.5 Action Classification & Consequence Engine
   - 4.6 Narrative Presentation
   - 4.7 Opportunity Generation
   - 4.8 Ambient Event Generation
   - 4.9 NPC Agency System
   - 4.10 Memory & Relationship System
   - 4.11 Scene Narrator
5. Data Model
   - 5.1 Entity Schema
   - 5.2 Event Structure
   - 5.3 Relationship Model
   - 5.4 Opportunity Structure
   - 5.5 Game State Container

**PART II: INFORMATION FLOW ARCHITECTURE**

6. Core Architecture
   - 6.1 Primary Information Flow
   - 6.2 Secondary Information Flow
   - 6.3 Validation Gates & Constraints
   - 6.4 Time Tracking Architecture
   - 6.5 Scene Transition Architecture
   - 6.6 Conversation Timing Architecture
   - 6.7 Opportunity Expiration Architecture
7. Event Logging & NPC Knowledge System
   - 7.1 Event Structure & Propagation
   - 7.2 Interpretation & Minimal Structuring
   - 7.3 Event Knowledge Queries
   - 7.4 Structured Query System
   - 7.5 Player Exclusion Rules

**PART III: IMPLEMENTATION SPECIFICATIONS**

8. Turn Sequence (Complete Implementation)
9. Component Implementations
   - 9.1 Reference Resolution
   - 9.2 Action Classification
   - 9.3 Consequence Engine
   - 9.4 Opportunity Generator
   - 9.5 Ambient Event Generator
   - 9.6 NPC Agency System
   - 9.7 Time & Scene Management
   - 9.8 Scene Narrator
   - 9.9 Entity Instantiation System
   - 9.10 Pre-Action Validation System

**PART IV: DEVELOPMENT & REFERENCE**

10. LLM Usage Principles
11. Development Strategy
12. Success Metrics
13. Open Questions & Future Considerations

**APPENDICES**

- Appendix A: Version History (v3.2-3.5.1)
- Appendix B: Implementation Decisions & Edge Cases
- Appendix C: Quick Reference Summary Table

---

# PART I: DESIGN PHILOSOPHY & ARCHITECTURE

---

## 1. PROBLEMS & MOTIVATION

### 1.1 Core Pathologies of Current LLM-Based Interactive Fiction

**1.1.1 LLMs as Completion Engines, Not Simulation Engines**
- LLMs predict plausible narrative patterns based on training data
- No inherent tracking of world state, causality, or physical consistency
- Each generation samples from learned distributions without persistent memory
- Result: Contradictions accumulate, world state drifts

**1.1.2 Continuous Escalation Bias**
- Training data overrepresents dramatic narrative structures
- LLMs default to increasing tension and stakes
- Peaceful resolutions and mundane outcomes are underweighted
- "Interesting" is conflated with "dramatic" in learned patterns
- Result: Every story becomes high-stakes, every NPC becomes critical

**1.1.3 Pattern Matching Creates Predictability**
- Genre conventions deeply embedded in training data
- "Hero's journey" and "chosen one" tropes dominate
- Narrative formulas are easily recognized by players
- Railroading toward expected story beats
- Result: Players can predict outcomes, agency feels illusory

**1.1.4 No Verisimilitude**
- World state inconsistencies (object locations change, relationships forgotten)
- NPCs don't remember previous interactions
- Consequences are narratively convenient rather than realistic
- No understanding of prerequisite chains (becoming president requires campaign infrastructure)
- Result: World feels hollow, choices don't matter organically

**1.1.5 No Planning or Off-Screen Existence**
- NPCs have no autonomous life when not directly interacting with player
- No consideration of future story implications
- Actions don't ripple through social networks
- World only exists in immediate player proximity
- Result: World feels reactive rather than alive

---

## 2. DESIGN GOALS & PLAYER EXPERIENCE VISION

### 2.1 Core Fantasy

**"Living as a person in a believable world where choices matter organically"**

The player is not the protagonist of a predetermined story. They are a person inhabiting a world that continues to exist and evolve whether they engage with it or not. Narratives emerge from the intersection of player choices and world state, not from authorial mandate.

---

### 2.2 Key Design Pillars

**2.2.1 Believable Setting Consistency**
- Genre rules maintained without exception
  - Mundane Earth: no magic, no FTL, realistic physics
  - Urban Fantasy: magic exists but follows consistent rules
  - High Fantasy: dragons exist, spaceships don't
- Physical and social laws remain stable
- Technology level remains appropriate to setting
- World doesn't reshape itself to accommodate player desires

**2.2.2 Player Agency in Setup**
- Player defines:
  - Character identity (who am I?)
  - Initial goals (what do I want?)
  - Relationships (who do I know?)
  - Starting situation (what am I doing?)
- System supports player-declared objectives without mandating specific paths
- Character creation parallels traditional RPG setup but for narrative fiction

**2.2.3 Emergent Opportunities, Not Railroading**
- World presents hooks player can pursue or ignore
  - Overhear interesting conversation at cafe → follow up or don't
  - Meet someone interesting → befriend, recruit, ignore
  - Find mysterious map → investigate or discard
- No mandatory story beats
- No "main quest" unless player creates one
- Opportunities expire if ignored (world moves on)
- New opportunities emerge from player actions and world evolution

**2.2.4 Comprehensive Verisimilitude**

**Setting Consistency:**
- Magic/technology level adheres to genre
- No rule violations for narrative convenience

**Event Memory:**
- Actions are remembered by relevant entities
- "I shot Pedro" → Pedro remembers (if alive), companions remember, witnesses remember
- "I freed a kingdom" → kingdom remembers, political landscape shifts

**Relationship Persistence:**
- Relationships form based on interactions
- Relationships evolve (positive or negative)
- Relationship history affects future interactions
- NPCs remember how you've treated them

**Location Consistency:**
- Locations persist with stable properties
- "The Dirty Ditch" is a bar in Seattle → always in Seattle
- Staff changes are organic (people quit, get fired, die)
- But core identity persists unless something destroys it

**NPC Depth on Demand:**
- NPCs start as background scenery
- Can become critically important through player engagement
- Importance determined by player attention, not authorial fiat
- Secretary at senator's office → casual acquaintance → romantic interest (if player pursues)

**Realistic Probability Distributions:**
- High-difficulty goals have appropriately low success rates
- Prerequisite chains must be satisfied
- Wild cards exist but are rare
- Most outcomes are mundane

**2.2.5 Acceptable Failure States**

**What the system must NOT do:**
- Force dramatic narratives when player wants mundane existence
  - Barmaid in village can stay barmaid in village
  - War might come to town (low probability) but player isn't forced to become war hero
  - Player can flee, hide, die, or just move to another town
- Guarantee player success at difficult goals
  - Journalist running for president will almost certainly fail without extraordinary effort/luck
  - System models realistic prerequisites and obstacles
  - No "chosen one" narrative protection
- Escalate constantly
  - Tension has natural peaks and valleys
  - Peaceful days are common
  - Drama is the exception, not baseline
- Railroad toward predetermined beats
  - World offers opportunities but doesn't force engagement
  - Ignored hooks fade or evolve without player

---

### 2.3 Illustrative Use Case

**Scenario: Mundane Life with Potential**

Player is a husband and father typing at computer. This is acceptable and valid. The world presents potential:
- Buy ticket to Vegas (possible)
- Stow away on research vessel (difficult, consequences if caught)
- Break into supermarket after hours (possible, illegal, consequences likely)
- Continue typing (most probable outcome)

**System models all as realistic possibilities with appropriate probability weights based on:**
- Player's skills and resources
- World state (location of research vessel, supermarket security, flight availability)
- Social constraints (family obligations, legal risk)
- Prior behavior patterns

Player chooses. Consequences follow realistically. World doesn't judge or protect.

---

## 3. ARCHITECTURAL PHILOSOPHY

### 3.1 Core Principles

**3.1.1 Simulation Substrate with LLM Narration**

The system is fundamentally a simulation engine with LLM-powered presentation, NOT an LLM that we're trying to force into simulation.

- **Deterministic systems** handle: world state, physics, causality, validation
- **Probabilistic systems** handle: consequence weighting, opportunity frequency
- **LLM systems** handle: consequence generation, prose narration, dialogue
- **Separation of concerns** prevents narrative desires from overriding world logic

**3.1.2 Single Source of Truth**

World State Database is authoritative. Nothing else can contradict it. All queries for "what is true" resolve here.

**3.1.3 One-Way Information Flow**

Information flows in a directed graph. Components cannot reach backward to modify prior stages:
- Narrator cannot change world state
- Opportunities cannot force outcomes
- Consequence engine cannot bypass consistency validation

**3.1.4 Validation Gates**

Every state-changing operation passes through validation. Invalid operations are rejected and regenerated, not patched or ignored.

**3.1.5 Lazy Evaluation**

Generate detail when needed, not preemptively:
- NPCs: minimal detail until player engages
- Locations: basic structure until player visits
- Events: resolve when relevant, not in real-time for entire world

**3.1.6 Probability as Core Mechanic**

Most outcomes should be mundane. Drama is the exception. Probability distributions reflect reality, not narrative convenience.

---

### 3.2 LLM Usage Principles

**What LLMs Are Good At:**
- Pattern recognition and context synthesis
- Natural language generation
- Relative comparisons ("this is more likely than that")
- Creative possibility generation
- Understanding social dynamics and implications

**What LLMs Are Bad At:**
- Precise arithmetic
- Strict consistency across time
- Deterministic logic
- Memory/state tracking
- Adhering to hard constraints (will occasionally violate despite instructions)

**Design Implication: Use LLMs for Creativity, Not Authority**

**Let LLMs Do:**
- Generate consequence descriptions
- Assess relative likelihoods (as weights, not exact percentages)
- Create NPC dialogue
- Describe scenes and narration
- Suggest opportunities based on context
- Generate entity traits and backgrounds on-demand

**Make Deterministic Systems Do:**
- Exact probability calculations
- State tracking and queries
- Hard rule validation
- Prerequisite checking
- Relationship graph maintenance
- Event timeline ordering
- Entity resolution

**Example: Consequence Generation**
- LLM generates: List of possible outcomes with relative weights (0.8, 0.5, 0.1)
- LLM does NOT: Calculate percentages, ensure sum to 100, or pick the outcome
- System handles: Normalization, probabilistic selection, validation

**Example: Relationship Strength**
- LLM generates: "very_positive" or "strained" or "deep_bond"
- LLM does NOT: Calculate exact numeric strength or track historical changes
- System handles: Map to numbers, track over time, query for decision-making

---

## 4. SYSTEM COMPONENTS (DETAILED)

### 4.1 World State Database

**Purpose:** Single source of truth for everything that exists and has happened.

**Responsibilities:**
- Maintain registry of all entities (people, places, things, organizations)
- Track relationships between entities (with history and strength)
- Store complete event timeline (what happened, when, who was involved, who knows)
- Preserve location hierarchy and spatial consistency
- Record knowledge distribution (who knows what facts)
- Manage entity lifecycle (creation, modification, archival)

**Key Operations:**
- `query_entity(entity_id)` → full entity record
- `query_relationships(entity_id)` → all relationships for entity
- `query_location_contents(location_id)` → entities present
- `query_events(filters)` → event history matching criteria
- `query_knowledge(entity_id, fact)` → does entity know this fact
- `update_entity_state(entity_id, changes)` → modify entity
- `create_relationship(entity_a, entity_b, type, strength)` → new relationship
- `record_event(event_data)` → add to timeline

**Constraints:**
- No orphaned relationships (both entities must exist)
- No time paradoxes (events ordered consistently)
- No duplicate entity_ids
- All writes logged for audit trail

**Performance Considerations:**
- Index by: entity_id, location, entity_type, engagement_level
- Archive inactive entities (moved away, died, player hasn't interacted in long time)
- Lazy-load full entity details (keep registry lightweight)

---

### 4.2 Consistency Enforcer

**Purpose:** Hard validation gate ensuring world coherence. Absolute veto power over any operation that would violate world rules.

**Responsibilities:**
- Validate all generated content against world state before acceptance
- Check genre rule violations (magic in mundane world, FTL in medieval fantasy)
- Verify entity state consistency (can't interact with dead NPC, can't use broken object)
- Ensure relationship history isn't contradicted (can't be meeting someone you've known for years)
- Detect prerequisite violations (attempting actions that require unmet conditions)
- Validate entity references (ensure all referenced entities exist)

**Validation Categories:**

**Genre Rules:**
- Setting: mundane_earth → magic: REJECT, guns: ALLOW, FTL: REJECT
- Setting: high_fantasy → magic: ALLOW, guns: REJECT, dragons: ALLOW
- Setting: cyberpunk → cyberware: ALLOW, magic: REJECT, AI: ALLOW

**Physical State:**
- Entity state: dead → REJECT interactions
- Entity state: unconscious → REJECT voluntary actions by entity
- Object state: broken → REJECT usage
- Location accessibility: locked → REJECT entry without key/force

**Relationship Consistency:**
- Relationship history: enemies → REJECT instant friendship without cause
- Relationship history: never_met → REJECT familiar greetings
- Knowledge state: entity doesn't know fact → REJECT acting on that knowledge

**Prerequisite Chains:**
- Action: run_for_president → CHECK: filed paperwork, campaign funds, ballot access
- Action: pick_lock → CHECK: has lockpicks, has skill, lock is pickable
- Action: fly_to_paris → CHECK: has passport, has money for ticket, flights available

**Entity References:**
- All entity_ids mentioned must exist in World State Database
- Descriptions must map to known entities (no hallucinated NPCs)

**Key Operations:**
- `validate_consequence(consequence, world_state)` → PASS/REJECT + reason
- `validate_action(action, actor, world_state)` → PASS/REJECT + reason
- `validate_entity_reference(entity_id)` → EXISTS/DOES_NOT_EXIST
- `check_prerequisites(action, actor, world_state)` → MET/UNMET + missing prerequisites

**On Rejection:**
- Return specific reason (for logging and corrective prompting)
- Trigger regeneration in calling component
- Track rejection patterns (identify systematic prompt issues)

**This is deterministic logic, NOT LLM-based.** Rules are explicit and coded.

---

### 4.3 Reference Resolver

**Purpose:** Translate player's natural language references into canonical entity_ids.

**Responsibilities:**
- Parse player input for entity references (names, descriptions, pronouns)
- Match against entities in current scene context
- Handle synonyms, nicknames, abbreviations
- Resolve ambiguous references (ask for clarification or use context)
- Distinguish between referencing existing entities vs. requesting new entity generation
- Return canonical entity_ids for downstream processing

**Challenge:** Player doesn't know entity_ids and uses natural language:
- System: "There's a sketchy dude in the corner"
- Player: "I talk to the suspicious man"
- Resolver must recognize: "suspicious man" = "sketchy dude" = same entity

**Resolution Strategies:**

**Exact Name Match:**
- Player: "I call Marcus" → Check for entity with name "Marcus"
- Fast, deterministic

**Known Nickname/Alias:**
- Entity has nicknames: ["Sam", "Sammy", "S"]
- Player: "I call Sam" → Resolve to npc_samantha_001
- Requires entities to track aliases

**Description Cache Match:**
- When narrator describes entity, log the description
- Entity: npc_marcus_001, descriptions_used: ["sketchy dude in corner", "suspicious man"]
- Player uses description → match against cache

**Pronoun Resolution:**
- Track last-mentioned entity by gender
- Player: "I ask her about the case" → Resolve to last female entity referenced

**Contextual Disambiguation:**
- Multiple matches: use proximity, recent interaction, salience
- Example: Two men in scene, player said "the man" → ask for clarification OR choose based on context

**New Entity Detection:**
- Player: "I find a merchant selling swords" (no merchant exists yet)
- This is NOT a reference, it's a generation request
- Flag for Interaction Resolution System

**Ambiguity Handling:**
```
Scene: bartender and patron (both male)
Player: "I talk to the man"
System: "Which person do you mean?
1. The bartender
2. The patron at the bar"
```

**Implementation Approach: Hybrid**

**Fast Deterministic Path (try first):**
1. Exact name match
2. Known nickname match
3. Pronoun resolution (last-mentioned)
4. Return entity_id if found

**LLM Resolution Path (if deterministic fails):**
1. Provide LLM with:
   - Player input
   - Current scene entities with descriptions
   - Recent interaction history
2. Ask LLM to map player's reference to entity_id
3. Validate LLM response (ensure entity_id exists)
4. Return resolved entity_id

**Key Operations:**
- `resolve_reference(player_input, scene_context)` → entity_id or AMBIGUOUS or NEW_ENTITY_REQUEST
- `request_clarification(ambiguous_references)` → present choices to player
- `update_description_cache(entity_id, new_description)` → for future matching

**Integration Point:**
```
PLAYER INPUT
    ↓
REFERENCE RESOLVER
(natural language → entity_ids)
    ↓
If ambiguous → clarification loop → player chooses
If new entity needed → flag for Interaction Resolution
    ↓
CONSEQUENCE ENGINE
(operates on canonical entity_ids)
```

**Character Creation Mode**

**Purpose:** Parse initial narrative prompt to seed world state.

**Activation:** Player's first input, before any world state exists.

**Process:**
1. Detect character creation (long narrative, no existing player entity)
2. Send to LLM for structured extraction
3. Parse LLM output into world state operations
4. Create entities, relationships, organizations
5. Set genre rules and plot hooks
6. Generate initial scene
7. Switch to normal gameplay mode

**Output:**
- Populated World State Database
- Initial scene ready to present
- Player can begin normal gameplay

**Validation:**
- Extracted entities must be internally consistent
- Genre rules must be coherent
- Relationships must be bidirectional
- Plot hooks must reference valid entities



---

### 4.4 Entity Validator (Output Validation)

**Purpose:** Ensure LLM outputs reference only valid entities. Prevent hallucinated NPCs, objects, or locations from entering world state.

**Applies To:**
- LLM-generated consequences
- LLM-generated narration
- LLM-generated NPC actions
- Any LLM output that mentions entities

**Problem:**
Even with careful prompting, LLMs can hallucinate:
- "Marcus and his friend Tony are here" (Tony doesn't exist)
- "The detective approaches" (which detective? we have three)
- Inconsistent references across turns

**Validation Process:**

1. **Extract entity references** from LLM output
   - Named entities (proper nouns)
   - Descriptive references ("the bartender", "that suspicious guy")
   - Pronouns (if used without prior establishment)

2. **Resolve against world state**
   - Attempt to map each reference to existing entity_id
   - Use same logic as Reference Resolver

3. **Classify results:**
   - VALID: All references map to existing entities
   - INVALID: One or more references don't resolve

4. **On INVALID:**
   - Log the issue with full context
   - Regenerate with corrective prompt
   - Track retry count

5. **Retry budget exhausted:**
   - Apply fallback strategy (depends on criticality)

**Validation Tiers:**

**Tier 1: Critical Systems (Hard Validation)**
- Components: Consequence Engine, World State Updates, NPC Autonomous Actions
- On invalid reference:
  - Regenerate with correction: "Previous output mentioned '{X}' which doesn't exist. Only use entities from provided context."
  - Max 3 attempts
  - If all fail: **Abort operation, inform player of error**
- Rationale: Cannot allow world state corruption

**Tier 2: Narration (Soft Validation with Fallback)**
- Components: Scene Narrator, NPC Dialogue, Opportunity Generator
- On invalid reference:
  - Regenerate with correction
  - Max 2 attempts
  - If fails: **Sanitize output and continue**
- Rationale: Don't block gameplay over narrative glitches, but don't ignore them

**Tier 3: Player Input (Full Resolution)**
- Component: Reference Resolver
- Handles fuzzy matching, disambiguation, new entity requests
- Rationale: Player doesn't know entity_ids, needs translation

**Sanitization Strategies (for Narration):**

**Entity Stripping:**
- Remove mentions of non-existent entities
- Example: "Marcus and Tony talk" → "Marcus talks quietly"

**Generic Substitution:**
- Replace unknown entity with generic valid reference
- Example: "Tony tends bar" → "The bartender tends bar" (if bartender entity exists)

**Minimal Safe Output:**
- Generate basic scene description directly from world state
- Guaranteed valid but less interesting
- Last resort only

**Key Operations:**
- `validate_output(text, context, criticality_level)` → VALID or INVALID + issues
- `regenerate_with_correction(original_prompt, issues, attempt_number)` → new output
- `sanitize_text(text, issues)` → cleaned text with unknowns removed
- `generate_minimal_safe_output(world_state, scene_context)` → guaranteed valid description

**Integration Points:**

**After Consequence Generation:**
```
LLM generates consequence list
    ↓
Entity Validator checks each consequence
    ↓
Invalid consequences removed
    ↓
Valid consequences proceed to probabilistic selection
```

**After Narration Generation:**
```
LLM generates scene description
    ↓
Entity Validator checks references
    ↓
If invalid: regenerate (max 2 attempts)
    ↓
If still invalid: sanitize
    ↓
Present to player
```

---

### 4.5 Consequence Engine

**Purpose:** Determine realistic outcomes for player actions and generate cascading NPC reactions. Uses structured outcome categories (TTRPG-inspired) with true probabilistic selection independent of LLM biases.

**Core Architecture: Multi-Stage Consequence Resolution**

The Consequence Engine resolves player actions through a series of LLM calls with deterministic dice rolls:

1. **Player Action Outcome** - Does the action succeed? How well?
2. **Target Reaction** - How does the directly affected NPC respond?
3. **Witness Reactions** - How do other named NPCs in scene respond?
4. **Scene Narration** - Compile all outcomes into coherent prose
5. **Ripple Effects** - Update relationships, goals, memories (deterministic)

**IMPORTANT: Routing Based on Action Classification**

The Consequence Engine is **only invoked for UNCERTAIN actions**. CERTAIN actions bypass this entire pipeline (see Section 6.5, STEP 3 for classification details).

---

#### Action Classification Routing

```python
def process_action(resolved_action, world_state):
    """
    Route action based on classification.
    """
    # Classify action (STEP 3 in Section 6.5)
    classification = classify_action(resolved_action, world_state)
    
    if classification['classification'] == 'CERTAIN':
        # CERTAIN PATH: Bypass Consequence Engine
        return process_certain_action(resolved_action, classification, world_state)
    
    else:
        # UNCERTAIN PATH: Full Consequence Engine pipeline
        return invoke_consequence_engine(resolved_action, world_state)
```

**CERTAIN Action Handling** (Skips Consequence Engine):
```python
def process_certain_action(resolved_action, classification, world_state):
    """
    Handle actions with predetermined outcomes.
    No consequence generation needed.
    """
    # Extract predetermined outcome
    outcome = {
        'type': 'CERTAIN',
        'result': classification['outcome_if_certain'],
        'world_state_changes': derive_changes(
            resolved_action, 
            classification['outcome_if_certain']
        )
    }
    
    # Apply directly to world state
    world_state.apply_changes(outcome['world_state_changes'])
    
    # Log event
    event_logger.log_event(
        turn=world_state.current_turn,
        action=resolved_action,
        outcome=outcome,
        certainty='CERTAIN'
    )
    
    # Estimate time deterministically
    time_elapsed = estimate_certain_action_time(resolved_action, world_state)
    world_state.advance_time(time_elapsed)
    
    # Skip to narration (no consequence generation)
    return {
        'outcome': outcome,
        'time_elapsed': time_elapsed,
        'skip_consequence_engine': True
    }
```

**UNCERTAIN Action Handling** (Full Consequence Engine):
```python
def invoke_consequence_engine(resolved_action, world_state):
    """
    Full consequence generation pipeline for uncertain actions.
    Proceeds through all 5 stages.
    """
    # Stage 1: Player Action Outcome (see below)
    action_outcome = generate_action_outcome(resolved_action, world_state)
    
    # Stage 2: Target Reaction (if applicable)
    if resolved_action.has_target:
        target_reaction = generate_target_reaction(
            action_outcome, 
            resolved_action.target, 
            world_state
        )
    else:
        target_reaction = None
    
    # Stage 3: Witness Reactions
    witness_reactions = generate_witness_reactions(
        action_outcome,
        target_reaction,
        world_state
    )
    
    # Stage 4: Scene Narration
    narration = generate_scene_narration(
        action_outcome,
        target_reaction,
        witness_reactions,
        world_state
    )
    
    # Stage 5: Ripple Effects
    ripple_effects = process_ripple_effects(
        action_outcome,
        target_reaction,
        witness_reactions,
        world_state
    )
    
    # Time is generated as part of action_outcome by LLM
    time_elapsed = action_outcome['time_elapsed_minutes']
    world_state.advance_time(minutes(time_elapsed))
    
    return {
        'action_outcome': action_outcome,
        'target_reaction': target_reaction,
        'witness_reactions': witness_reactions,
        'narration': narration,
        'ripple_effects': ripple_effects,
        'time_elapsed': time_elapsed
    }
```

**Distribution of Actions:**
- ~95% of player actions are CERTAIN → Bypass Consequence Engine
- ~5% of player actions are UNCERTAIN → Full Consequence Engine

**Examples:**

**CERTAIN Actions** (bypass Consequence Engine):
- "Look around"
- "Pick up the revolver"
- "Walk to the door"
- "Read the note"
- "Check inventory"
- "Say hello"
- "Order coffee"

**UNCERTAIN Actions** (invoke Consequence Engine):
- "Slap Olga"
- "Persuade Marcus to betray his boss"
- "Hack the computer"
- "Sneak past the guard"
- "Lie to the detective"

---

**Critical Design Principle: LLM Generates, System Decides**

LLMs are pattern-matching engines that unconsciously favor dramatic outcomes. To prevent this bias:
- **LLM provides weighted possibilities** based on world state and entity traits
- **System uses true random selection** (`random.choices()`) to pick outcome
- **Weights are "vibes"** - LLM doesn't need to do math or sum to 1.0
- **Validation filters impossible options** before dice roll


### **Outcome Generation Pattern**

**The Consequence Engine generates weighted outcomes per action, representing the full spectrum of realistic possibilities.**

**Required distribution:**
- Most likely: 35-45%
- Common alternative: 20-25%
- Uncommon but realistic: 10-15%
- Positive surprise: 5-10%
- Negative surprise: 5-10%
- Edge cases: 2-5% each

**This ensures:**
- Variety across multiple actions
- Unpredictability (player can't metagame)
- Both positive and negative surprises occur naturally
- Realistic weight distribution (likely outcomes happen more often)
- World feels alive and dynamic

---

### Stage 1: Player Action Outcome

**Purpose:** Determine if and how well the player's action succeeds.

**TTRPG-Style Outcome Categories:**

```
CRITICAL_SUCCESS    - Exceeds expectations, bonus effects
SUCCESS             - Clean execution, goal achieved
SUCCESS_WITH_COMP   - Goal achieved but creates new problem
PARTIAL_SUCCESS     - Partially works, incomplete result
FAILURE             - Goal not achieved, no additional consequence
FAILURE_WITH_COMP   - Goal fails AND creates new problem  
CRITICAL_FAILURE    - Spectacular disaster, major consequence
```

Each outcome type must be represented, but some may be represented more than once.
**Example**
Acceptable (all are represented, with a few repeating):
CRITICAL_SUCCESS
CRITICAL_SUCCESS
SUCCESS 
SUCCESS_WITH_COMP
PARTIAL_SUCCESS
FAILURE
FAILURE_WITH_COMP
FAILURE_WITH_COMP
CRITICAL_FAILURE

Not Acceptable (not all options are represented):
CRITICAL_SUCCESS
CRITICAL_SUCCESS
SUCCESS 
SUCCESS_WITH_COMP
FAILURE
FAILURE_WITH_COMP
FAILURE_WITH_COMP


**LLM Prompt Structure:**
```
STEP 1: REASONING TRACE (Required - Complete Before JSON Generation)

Analyze the situation thoroughly before generating outcomes. Consider:
- Physics/Feasibility: Did Pre-Action Validation fail? Is the action physically possible?
- NPC Motivations and Psychology: What would each entity realistically do given their traits, goals, and state?
- Narrative Context: What recent events are relevant? What relationships matter?
- Mentions: Are any absent entities being discussed or gossiped about? (Track in 'mentions' field)
- Genre Constraints: What is impossible in this setting?

Write a brief analytical paragraph explaining your reasoning before proceeding to outcome generation.

STEP 2: JSON GENERATION

```
Player attempts: [action description]
Player capabilities: [relevant skills, resources, current state]
Target/Environment: [what they're acting on, difficulty factors]
Context: [location, witnesses, recent events, relationships]

Generate outcome possibilities across the full spectrum from CRITICAL_SUCCESS to CRITICAL_FAILURE.
For each outcome type, specify:
- action: Brief identifier
- type: Outcome category (CRITICAL_SUCCESS, SUCCESS, etc.)
- weight: Relative probability (vibes, doesn't need to sum to 1.0)
- description: What happens
- effects: List of world state changes
- requires: Prerequisites (optional, for validation)

Account for: player capabilities, difficulty, world physics, prerequisites
Weight toward realistic/mundane outcomes unless context justifies drama
Output as JSON.
```

**Example Output (Player slaps Olga):**
```json
{
  "outcomes": [
    {
      "action": "perfect_slap",
      "type": "CRITICAL_SUCCESS",
      "weight": 0.05,
      "description": "Perfect slap, Olga completely stunned",
      "effects": ["olga_dazed_2_turns", "olga_humiliated", "crowd_shocked"],
      "requires": ["conscious", "mobile"]
    },
    {
      "action": "slap_connects",
      "type": "SUCCESS",
      "weight": 0.4,
      "description": "Slap connects cleanly across her cheek",
      "effects": ["olga_hit", "damage_minor", "crowd_attention"],
      "requires": ["conscious", "mobile"]
    },
    {
      "action": "slap_connects_hurt_hand",
      "type": "SUCCESS_WITH_COMPLICATION",
      "weight": 0.25,
      "description": "Slap connects but player hurts hand on her cheekbone",
      "effects": ["olga_hit", "player_hand_injury_minor", "crowd_attention"],
      "requires": ["conscious", "mobile"]
    },
    {
      "action": "glancing_blow",
      "type": "PARTIAL_SUCCESS",
      "weight": 0.15,
      "description": "Glancing blow, Olga saw it coming and turned",
      "effects": ["olga_barely_fazed", "olga_prepared", "crowd_attention"],
      "requires": ["conscious", "mobile"]
    },
    {
      "action": "olga_dodges",
      "type": "FAILURE",
      "weight": 0.1,
      "description": "Olga dodges smoothly, clean miss",
      "effects": ["player_off_balance", "olga_advantage", "crowd_attention"],
      "requires": ["conscious", "mobile"]
    },
	{
	  "action": "slap_connects_olga_retaliates",
	  "type": "FAILURE_WITH_COMPLICATION",
	  "weight": 0.08,
	  "description": "Slap connects but Olga immediately slaps back harder",
	  "effects": ["olga_hit", "player_hit_harder", "crowd_attention", "olga_angry"],
	  "requires": ["conscious", "mobile"]
	},
		{
      "action": "wild_miss_crash",
      "type": "CRITICAL_FAILURE",
      "weight": 0.05,
      "description": "Wild swing, lose balance, crash into nearby table",
      "effects": ["player_prone", "player_injury_minor", "crowd_laughter", "olga_advantage"],
      "requires": ["conscious", "mobile"]
    }
  ]
}
```

**Validation & Selection**

The system uses a hybrid validation approach that preserves valid outcomes while iteratively fixing invalid ones.

**Stage 1: Initial Generation & Validation**

```python
# 1. Generate full spectrum of outcomes
raw_outcomes = llm_generate_outcomes(action, context)

# 2. Validate each outcome
valid_outcomes = []
invalid_outcomes = []

for outcome in raw_outcomes:
    validation_result = consistency_enforcer.validate(outcome, world_state)
    
    if validation_result.passed:
        valid_outcomes.append(outcome)
    else:
        invalid_outcomes.append({
            'outcome': outcome,
            'type': outcome['type'],  # e.g., "FAILURE", "SUCCESS_WITH_COMPLICATION"
            'failure_reason': validation_result.reason,
            'constraints_needed': validation_result.suggested_constraints
        })

# At this point:
# - valid_outcomes: Keep these, they're good
# - invalid_outcomes: Need to regenerate these specific types
```

**Stage 2: Targeted Regeneration (Max 2 Additional Attempts)**

```python
# 3. Attempt to fix invalid outcomes
for attempt in range(1, 3):  # Attempts 2 and 3 (attempt 1 was initial generation)
    if not invalid_outcomes:
        break  # All outcomes now valid!
    
    # Build constraint list from all failure reasons
    accumulated_constraints = []
    for inv in invalid_outcomes:
        accumulated_constraints.extend(inv['constraints_needed'])
    
    # Identify which outcome types need regeneration
    missing_types = [inv['type'] for inv in invalid_outcomes]
    
    # Regenerate ONLY the problematic types
    regenerated = llm_regenerate_specific_types(
        action=action,
        context=context,
        outcome_types=missing_types,
        constraints=accumulated_constraints,
        attempt_number=attempt + 1
    )
    
    # Re-validate the regenerated outcomes
    still_invalid = []
    for outcome in regenerated:
        validation_result = consistency_enforcer.validate(outcome, world_state)
        
        if validation_result.passed:
            valid_outcomes.append(outcome)
        else:
            still_invalid.append({
                'outcome': outcome,
                'type': outcome['type'],
                'failure_reason': validation_result.reason,
                'constraints_needed': validation_result.suggested_constraints
            })
    
    invalid_outcomes = still_invalid

# After all attempts:
# - valid_outcomes: All validated outcomes (from initial + all regeneration attempts)
# - invalid_outcomes: Any that still failed after 3 total attempts
```

**Stage 3: Final Selection**

```python
# 4. Handle edge case: no valid outcomes at all
if not valid_outcomes:
    log_critical_error("No valid outcomes after 3 attempts", {
        'action': action,
        'invalid_outcomes': invalid_outcomes
    })
    return create_generic_fallback(action)

# 5. Check outcome type coverage (warning only, not fatal)
represented_types = {o['type'] for o in valid_outcomes}
required_types = {
    'CRITICAL_SUCCESS', 'SUCCESS', 'SUCCESS_WITH_COMPLICATION',
    'PARTIAL_SUCCESS', 'FAILURE', 'FAILURE_WITH_COMPLICATION',
    'CRITICAL_FAILURE'
}

if not required_types.issubset(represented_types):
    missing_types = required_types - represented_types
    log_warning(f"Missing outcome types: {missing_types}", {
        'action': action,
        'valid_count': len(valid_outcomes),
        'represented_types': represented_types
    })
    # Continue anyway - partial coverage better than total failure

# 6. Probabilistic selection from valid pool
weights = [o['weight'] for o in valid_outcomes]
selected_outcome = random.choices(valid_outcomes, weights=weights, k=1)[0]

# 7. Apply effects to world state
for effect in selected_outcome['effects']:
    world_state.apply_effect(effect)

return selected_outcome
```

**Example: Validation Flow in Action**

```
ATTEMPT 1 (Initial Generation):
──────────────────────────────────────────────────────
Player action: "I slap Olga"

Generated 7 outcomes:
✅ CRITICAL_SUCCESS: "perfect_slap" 
   → Validation: PASS
   
✅ SUCCESS: "slap_connects"
   → Validation: PASS
   
❌ SUCCESS_WITH_COMPLICATION: "slap_connects_tony_intervenes"
   → Validation: FAIL
   → Reason: Entity 'tony' not found in world state
   → Constraint: "Only use entities: npc_olga_001, npc_marcus_001, npc_frank_001"
   
✅ PARTIAL_SUCCESS: "glancing_blow"
   → Validation: PASS
   
❌ FAILURE: "olga_uses_magic_shield"
   → Validation: FAIL
   → Reason: Genre violation (no magic in mundane_earth setting)
   → Constraint: "No magic/supernatural effects - realistic physics only"
   
✅ FAILURE_WITH_COMPLICATION: "miss_hurt_hand"
   → Validation: PASS
   
✅ CRITICAL_FAILURE: "slip_and_fall"
   → Validation: PASS

Valid pool: 5 outcomes
Invalid: 2 outcomes (SUCCESS_WITH_COMPLICATION, FAILURE)


ATTEMPT 2 (Targeted Regeneration):
──────────────────────────────────────────────────────
Regenerate types: [SUCCESS_WITH_COMPLICATION, FAILURE]
Applied constraints:
- "Only use entities: npc_olga_001, npc_marcus_001, npc_frank_001"
- "No magic/supernatural effects - realistic physics only"

Regenerated:
✅ SUCCESS_WITH_COMPLICATION: "slap_connects_marcus_intervenes"
   → Validation: PASS
   → Marcus is valid entity, physically present
   
❌ FAILURE: "olga_teleports_away"
   → Validation: FAIL
   → Reason: Still violating magic constraint
   → Constraint: "Outcome must use mundane dodge/block/duck - no teleportation"

Valid pool: 6 outcomes (added SUCCESS_WITH_COMPLICATION)
Invalid: 1 outcome (FAILURE)


ATTEMPT 3 (Final Regeneration):
──────────────────────────────────────────────────────
Regenerate types: [FAILURE]
Applied constraints:
- "Only use entities: npc_olga_001, npc_marcus_001, npc_frank_001"
- "No magic/supernatural effects - realistic physics only"
- "Outcome must use mundane dodge/block/duck - no teleportation"

Regenerated:
✅ FAILURE: "olga_ducks_clean_miss"
   → Validation: PASS

Valid pool: 7 outcomes (all types represented!)
Invalid: 0 outcomes


SELECTION:
──────────────────────────────────────────────────────
All 7 outcome types present in valid pool.
Weights: [0.05, 0.4, 0.25, 0.15, 0.1, 0.08, 0.05]
Random selection: SUCCESS (weight 0.4)

Outcome: "Slap connects cleanly across her cheek"
Effects applied: ["olga_hit", "damage_minor", "crowd_attention"]
```

**Critical Failure Scenario**

```
WORST CASE: After 3 attempts, still no valid FAILURE outcome

Valid pool: 6 outcomes (missing FAILURE type)

System response:
1. Log warning about missing type
2. Proceed with probabilistic selection from 6 valid outcomes
3. Game continues normally (still have variety)

Note: This is acceptable because:
- Player still gets realistic outcome
- System maintains consistency
- Better to proceed with 6 types than crash or use invalid data
```

**Why This Approach Works**

1. **Preserves Good Work**: Valid outcomes from initial generation aren't discarded
2. **Targeted Efficiency**: Only regenerates problematic types, not everything
3. **Progressive Learning**: Constraints accumulate with each attempt
4. **Graceful Degradation**: Can proceed even if some types remain invalid
5. **Maintains Quality**: Never accepts invalid data into world state
6. **Realistic Expectations**: Acknowledges LLMs will occasionally fail constraints

---

### Context-Aware Weight Assignment

**Critical Principle:** Outcome weights must reflect the COMPLETE situational context, not just generic "someone tries this action" patterns.

The LLM must perform holistic assessment by considering ALL relevant factors together when assigning outcome weights. This prevents pattern-matching that ignores whether the actor is actually equipped for success.

---

#### Required Context for Weight Assignment

The LLM must consider ALL of these factors together (not sequentially):

**1. Actor Capabilities**
- Relevant skills and experience level
- Physical and mental state
- Resources and inventory available
- Prior relevant events and history

**2. Prerequisite Analysis**
- What this action typically requires
- What the actor currently has
- What's missing (skills, resources, knowledge, connections)

**3. Situational Factors**
- Location advantages and obstacles
- Time pressure and constraints
- Witnesses and potential opposition
- Environmental conditions (weather, lighting, noise)
- Available tools and equipment

**4. Relationship Context**
- Target's disposition toward actor
- Witnesses' loyalties and relationships
- Actor's social capital in this context
- Prior interactions relevant to this attempt

**5. Recent Context**
- What just happened in the last few turns
- How recent events create momentum or obstacles
- Emerging patterns that affect this action

---

#### Comprehensive Prompting Structure

**Prompt Template for Outcome Generation:**

```python
def generate_outcome_weights_prompt(action, world_state):
    return f"""
ACTION: {action.description}

ACTOR ASSESSMENT (consider ALL of these together):
├─ Relevant Skills: {action.actor.capabilities}
├─ Experience Level: {action.actor.experience_with_similar_actions}
├─ Physical State: {action.actor.health_status}
├─ Mental State: {action.actor.emotional_state}
├─ Resources Available: {action.actor.inventory}
└─ Prior Relevant Events: {action.actor.relevant_history}

SITUATIONAL FACTORS (these modify difficulty):
├─ Location Advantages: {location.advantages_for_this_action}
├─ Location Obstacles: {location.obstacles_for_this_action}
├─ Time Pressure: {scene.time_constraints}
├─ Witnesses/Opposition: {entities_who_might_interfere}
├─ Environmental Conditions: {weather, lighting, noise, etc}
└─ Available Tools/Equipment: {tools_that_help_or_hinder}

PREREQUISITE ANALYSIS:
This action typically requires:
{list_prerequisites(action.type)}

Actor currently has:
{check_prerequisites(action.actor, action.type)}

Missing prerequisites: {missing_items}
Missing skills: {missing_capabilities}
Missing knowledge: {missing_information}

RELATIONSHIP CONTEXT (affects cooperation/opposition):
├─ Target's disposition toward actor: {relationship_state}
├─ Witnesses' loyalties: {witness_relationships}
├─ Social capital in this context: {actor.reputation_here}
└─ Prior interactions relevant to this: {relevant_relationship_history}

RECENT CONTEXT (what just happened):
{last_5_events_summary}

DIFFICULTY SYNTHESIS:
Given the COMPLETE picture above:
- How difficult is this action for THIS specific person?
- What specific factors make success more/less likely?
- What could go wrong? What could go better than expected?

WEIGHT ASSIGNMENT GUIDANCE:
Base your weights on the FULL analysis above, not just the action name.

For actions where actor is:
- Well-prepared (has prerequisites, skills, favorable conditions): 
  → Success outcomes: 60-80% combined weight
  
- Moderately prepared (has some but not all advantages):
  → Success/Partial success: 40-70% combined weight
  
- Unprepared (missing key prerequisites, unfavorable conditions):
  → Success outcomes: 10-30% combined weight
  → Failure outcomes: 60-80% combined weight
  
- Severely disadvantaged (multiple missing prerequisites, active opposition):
  → Success outcomes: 1-10% combined weight
  → Failure/Critical failure: 80-95% combined weight

CRITICAL: Your weights must reflect the SPECIFIC situation described above,
not a generic "someone tries this action" scenario.

Generate 7 outcomes (CRITICAL_SUCCESS through CRITICAL_FAILURE) with weights
that accurately reflect THIS actor's chances in THIS specific context.

Output as JSON.
"""
```

---

#### Concrete Example: Context Changes Everything

**Action:** "Get a fake passport"

**Scenario A: Unprepared Journalist**
```
ACTOR ASSESSMENT:
├─ Skills: research (expert), writing (expert), investigation (competent)
├─ Criminal skills: none
├─ Resources: $5,000 cash
└─ Connections: journalists, some political contacts

PREREQUISITE ANALYSIS:
Typically requires: criminal connections, knowledge of forgers, significant cash
Missing: criminal connections, knowledge of forgers

RELATIONSHIP CONTEXT:
└─ No connections to criminal underworld

SYNTHESIS: Extremely difficult - no pathway to access forgers

Expected weights:
- CRITICAL_SUCCESS: 0.01
- SUCCESS: 0.02-0.04
- SUCCESS_WITH_COMPLICATION: 0.05-0.08
- PARTIAL_SUCCESS: 0.08-0.12
- FAILURE: 0.50-0.60 (most likely outcome)
- FAILURE_WITH_COMPLICATION: 0.15-0.20
- CRITICAL_FAILURE: 0.03-0.05
```

**Scenario B: Same Journalist, But With Connection**
```
ACTOR ASSESSMENT:
├─ Skills: research (expert), writing (expert), investigation (competent)
├─ Criminal skills: none
├─ Resources: $5,000 cash
└─ Connections: journalists, political contacts

RECENT CONTEXT:
└─ Turn 145: Met underground journalist who mentioned "knowing people"
└─ Turn 156: Built trust with this contact over drinks
└─ Turn 163: Contact hinted they could help with "documents"

RELATIONSHIP CONTEXT:
└─ Underground journalist (trust: medium, willing to help)

SYNTHESIS: Still difficult, but now has actual pathway via trusted contact

Expected weights:
- CRITICAL_SUCCESS: 0.05-0.08
- SUCCESS: 0.12-0.18
- SUCCESS_WITH_COMPLICATION: 0.15-0.20
- PARTIAL_SUCCESS: 0.25-0.30 (contact tries but passport has flaws)
- FAILURE: 0.25-0.35 (contact can't/won't help after all)
- FAILURE_WITH_COMPLICATION: 0.08-0.12
- CRITICAL_FAILURE: 0.02-0.05
```

**Scenario C: Career Criminal**
```
ACTOR ASSESSMENT:
├─ Skills: streetwise (expert), criminal contacts (extensive)
├─ Resources: $5,000 cash
├─ Prior experience: Has obtained fake documents before
└─ Connections: multiple forgers, document specialists

RELATIONSHIP CONTEXT:
└─ Forger "Dmitri" (relationship: business associate, trust: medium)

RECENT CONTEXT:
└─ Turn 201: Dmitri owes actor a favor from previous job

SYNTHESIS: Moderate difficulty - has connections and experience, but still illegal/risky

Expected weights:
- CRITICAL_SUCCESS: 0.08-0.12
- SUCCESS: 0.40-0.50 (straightforward transaction)
- SUCCESS_WITH_COMPLICATION: 0.15-0.25 (works but costs extra/takes time)
- PARTIAL_SUCCESS: 0.08-0.12
- FAILURE: 0.08-0.12 (Dmitri unavailable or unwilling)
- FAILURE_WITH_COMPLICATION: 0.05-0.08
- CRITICAL_FAILURE: 0.01-0.03
```

---

#### Key Prompt Patterns for Holistic Thinking

**Pattern 1: "Consider ALL of these together"**
```
Don't just read the list - SYNTHESIZE the factors.
Missing prerequisites + unfavorable relationships + no relevant skills
= very low success weight
```

**Pattern 2: "For THIS specific person in THIS specific situation"**
```
Not: "Someone tries to get a fake passport" (generic)
But: "Inexperienced journalist with no criminal contacts but $5K tries to get passport"
```

**Pattern 3: "What specific factors make success more/less likely?"**
```
Forces LLM to articulate reasoning:
"Success weight low because: no connections, no experience, no knowledge of process"
```

**Pattern 4: Explicit prerequisite checking**
```
Required: criminal connections, $10K, knowledge of forgers
Has: $5K, journalism skills
Missing: connections, half the money, knowledge

→ This clearly suggests low success probability
```

**Pattern 5: Compare to reference scenarios**
```
If actor had criminal connections and $10K → success weight 0.60
Actor has neither → success weight should be <<0.60
```

---

#### Two-Step LLM Process (Optional Enhancement)

For maximum accuracy, use a two-step approach:

**Step 1: Difficulty Assessment**
```
Given the complete context, assess difficulty as:
- TRIVIAL: Actor is overqualified, has all prerequisites
- EASY: Actor has most prerequisites, favorable conditions  
- MODERATE: Mixed prerequisites and conditions
- DIFFICULT: Missing key prerequisites or unfavorable conditions
- EXTREMELY_DIFFICULT: Missing most prerequisites, active opposition
- NEARLY_IMPOSSIBLE: No realistic pathway to success

Output: difficulty_level + reasoning
```

**Step 2: Weight Generation**
```
Difficulty assessed as: EXTREMELY_DIFFICULT
Reasoning: No criminal connections, no forger knowledge, insufficient funds

Generate weights appropriate for EXTREMELY_DIFFICULT actions:
- Critical success: 0.01-0.02
- Success: 0.03-0.08
- Success with complication: 0.05-0.10
- Partial success: 0.10-0.15
- Failure: 0.60-0.70
- Failure with complication: 0.10-0.15
- Critical failure: 0.02-0.05

Generate specific outcomes matching these weight ranges...
```

This gives the LLM a **reasoning step** before assigning weights, improving accuracy.

---

#### Implementation Notes

**Context Building:**
```python
def build_consequence_context(action, world_state):
    return {
        'actor_capabilities': get_relevant_skills(action.actor, action.type),
        'actor_state': get_physical_mental_state(action.actor),
        'actor_resources': get_inventory(action.actor),
        'prerequisites': get_action_prerequisites(action.type),
        'missing_prerequisites': check_missing(action.actor, action.type),
        'situational_factors': analyze_situation(action.location, action.npcs),
        'relationships': get_relevant_relationships(action.actor, action.targets),
        'recent_events': get_recent_events(world_state, limit=5),
        'environmental': get_environment_modifiers(action.location)
    }
```

**Validation Integration:**
The comprehensive context must be provided to the LLM BEFORE validation, so that:
1. Initial generation already considers full context
2. Fewer outcomes get rejected for being contextually inappropriate
3. Regeneration can inject even more specific constraints if needed

**Critical Takeaway:**
Weight assignment is not about the action in isolation—it's about whether THIS SPECIFIC ACTOR in THIS SPECIFIC SITUATION has the means to succeed.

---

### Stage 2: Target NPC Reaction (If Applicable)

**Purpose:** Generate the immediate reaction of the NPC directly affected by player action.

**Reaction Framework:**

**Intensity Levels:**
- `SUBMIT` - Minimal response, accepts action
- `DE-ESCALATE` - Responds with less intensity than warranted  
- `PROPORTIONAL` - Matches the intensity of player action
- `ESCALATE` - Responds with greater intensity
- `REDIRECT` - Changes the nature of the conflict

**Reaction Types:**
- `PHYSICAL` - Physical action (hit back, draw weapon, flee)
- `VERBAL` - Speech (threaten, plead, insult)
- `SOCIAL` - Appeal to others (call for help, rally allies)
- `TACTICAL` - Strategic positioning (retreat, create distance)
- `EMOTIONAL` - Emotional display (cry, freeze, laugh)

**LLM Prompt Structure:**
```
NPC: [name, traits, current state]
What happened to NPC: [outcome from Stage 1]
NPC's relationship to player: [trust, anger, fear scores, history]
Context: [location, witnesses, NPC's goals, capabilities]

Generate immediate reaction possibilities across intensity spectrum.
For each reaction, specify:
- action: Brief identifier
- intensity: (SUBMIT, DE-ESCALATE, PROPORTIONAL, ESCALATE, REDIRECT)
- type: (PHYSICAL, VERBAL, SOCIAL, TACTICAL, EMOTIONAL)
- weight: Relative probability based on NPC traits and context
- description: What NPC does
- requires: What must be true for this to be possible (e.g., "has_weapon", "conscious")
- creates: New conditions this triggers (e.g., "weapon_drawn", "crowd_panic")

Weight based on: NPC personality, relationship to player, current emotional state, capabilities
Output as JSON.
```

**Example Output (Olga's reaction to being slapped):**
```json
{
  "reactions": [
    {
      "action": "slaps_back_hard",
      "intensity": "PROPORTIONAL",
      "type": "PHYSICAL",
      "weight": 0.45,
      "description": "Immediate physical retaliation, slaps player back",
      "requires": ["conscious", "mobile", "not_restrained"],
      "creates": ["mutual_combat", "crowd_reaction_intensifies"]
    },
    {
      "action": "draws_weapon_threatens",
      "intensity": "ESCALATE",
      "type": "PHYSICAL",
      "weight": 0.3,
      "description": "Pulls concealed pistol, aims at player but doesn't fire",
      "requires": ["has_weapon", "conscious"],
      "creates": ["weapon_drawn", "crowd_panic", "legal_consequences_pending"]
    },
    {
      "action": "verbal_fury",
      "intensity": "PROPORTIONAL",
      "type": "VERBAL",
      "weight": 0.25,
      "description": "Explosive verbal response, curses and threatens",
      "requires": ["conscious"],
      "creates": ["tension_high", "crowd_attention"]
    },
    {
      "action": "frozen_shock",
      "intensity": "SUBMIT",
      "type": "EMOTIONAL",
      "weight": 0.22,
      "description": "Completely unexpected, freezes in shock",
      "requires": ["conscious"],
      "creates": ["moment_of_silence", "crowd_uncertain"]
    },
    {
      "action": "cold_calculated_stare",
      "intensity": "DE-ESCALATE",
      "type": "TACTICAL",
      "weight": 0.07,
      "description": "Silent, calculating response - implied future threat",
      "requires": ["conscious"],
      "creates": ["tension_subtle", "revenge_goal_likely"]
    }
  ]
}
```

**Validation & Selection:**
```python
# 1. Validate requirements
valid_reactions = [r for r in reactions if validate_requirements(r['requires'], olga_state)]
# If Olga has no weapon, "draws_weapon" gets filtered out

# 2. True random selection
selected = random.choices(
    [r['action'] for r in valid_reactions],
    weights=[r['weight'] for r in valid_reactions],
    k=1
)[0]

# 3. Update NPC state based on creates
for condition in selected['creates']:
    world_state.add_condition(olga, condition)
```


---

### Stage 3: Witness Reactions (Named NPCs Only)

**Purpose:** Generate reactions from other named NPCs who are present in the scene.

**Key Principles:**
- **One reaction per named NPC** - Each gets a single LLM call to determine immediate response
- **Nameless NPCs handled by narrator** - Generic crowd behavior described in narration, no individual calls
- **Reactions informed by prior outcomes** - Marcus sees Olga draw weapon, reacts to THAT

**Named vs. Nameless:**
- **Named NPC:** Has entity record, personality traits, relationships → Gets individual reaction call
  - Example: Marcus (bouncer), Frank (bartender)
- **Nameless NPC:** Background scenery, no entity record → Handled collectively by narrator
  - Example: "The crowd scatters", "patrons duck for cover"

**LLM Prompt Structure (per named NPC):**
```
Witness NPC: [name, traits, role, current state]
What witness observed: [action outcome + target reaction from Stages 1-2]
Witness's relationships: [to player, to target, to location]
Context: [witness's goals, capabilities, position in scene]

Generate witness's immediate reaction to what they just saw.
For each reaction possibility, specify:
- action: Brief identifier  
- intensity/type: Same framework as Stage 2
- weight: Based on witness's personality and stake in situation
- description: What witness does
- requires: Prerequisites
- creates: New conditions

Consider: witness's relationship to involved parties, their role (bouncer vs. patron), personal stakes
Output as JSON.
```

**Example: Marcus (bouncer) witnesses weapon being drawn:**
```json
{
  "reactions": [
    {
      "action": "moves_to_intervene",
      "intensity": "PROPORTIONAL",
      "type": "TACTICAL",
      "weight": 0.6,
      "description": "Moves quickly toward conflict, hands up in placating gesture",
      "requires": ["mobile", "conscious"],
      "creates": ["intervening", "approaching_player", "de-escalation_attempt"]
    },
    {
      "action": "draws_own_weapon",
      "intensity": "ESCALATE",
      "type": "PHYSICAL",
      "weight": 0.15,
      "description": "Draws service weapon, orders everyone to freeze",
      "requires": ["armed", "mobile"],
      "creates": ["multiple_weapons_drawn", "security_escalation"]
    },
    {
      "action": "calls_police",
      "intensity": "REDIRECT",
      "type": "SOCIAL",
      "weight": 0.15,
      "description": "Immediately pulls out phone, calls 911",
      "requires": ["has_phone"],
      "creates": ["police_called", "authorities_incoming"]
    },
    {
      "action": "freezes_assessing",
      "intensity": "DE-ESCALATE",
      "type": "TACTICAL",
      "weight": 0.1,
      "description": "Freezes, assesses situation before acting",
      "requires": ["conscious"],
      "creates": ["moment_of_assessment"]
    }
  ]
}
```

**Processing Multiple Witnesses:**

Each named NPC in scene gets their own call, processed sequentially:
```python
named_npcs_in_scene = get_named_npcs(current_location)

witness_reactions = []
for npc in named_npcs_in_scene:
    if npc.id != target.id:  # Don't re-process the target
        reaction_options = llm_generate_witness_reaction(
            npc, 
            action_outcome, 
            target_reaction,
            world_state
        )
        valid_options = validate_reactions(reaction_options, npc, world_state)
        selected = random.choices(valid_options)
        witness_reactions.append((npc, selected))
        apply_reaction(npc, selected, world_state)
```

**Typical scene breakdown:**
- 2-4 named NPCs in scene → 2-4 witness reaction calls
- Dozens of nameless NPCs → handled by narrator, no individual calls

---

### Stage 4: Scene Narration

**Purpose:** Compile all outcomes into coherent, readable prose.

**LLM Prompt Structure:**
```
Compile the following outcomes into natural narrative prose:

Player action outcome: [selected outcome from Stage 1]
Target reaction: [selected reaction from Stage 2]  
Witness reactions: [list of selected witness reactions from Stage 3]
Nameless NPCs present: [count and type, e.g., "~20 bar patrons"]
Location: [current location details]

Create a 2-4 paragraph narration that:
- Flows naturally as continuous action
- Describes player action, immediate result, NPC reactions in sequence
- Includes atmospheric details from location
- Incorporates nameless NPC collective behavior naturally
- Does NOT mention dice rolls, weights, or meta-game elements
- Uses vivid sensory detail appropriate to setting

Output as prose text.
```

**Example Output:**
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

**This is pure narration:**
- No world state changes (already applied in previous stages)
- No validation needed (just describing what already happened)
- No dice roll (just prose generation)

---

### Stage 5: Ripple Effects (Deterministic)

**Purpose:** Update long-term consequences without additional LLM calls.

These are **deterministic state changes** based on what happened:

**Relationship Updates:**
```python
# Olga was slapped
relationships.update(olga, player, {
    'strength': 'hostile',  # Was neutral, now hostile due to assault
    'tags': ['physically_assaulted_me', 'dangerous', 'angry_at'],
    'history': ['Turn 42: Player slapped Olga in bar']
})

# Marcus witnessed player start violence
relationships.update(marcus, player, {
    'strength': 'negative',  # Opinion worsened
    'tags': ['troublemaker', 'witnessed_violence', 'unpredictable'],
    'history': ['Turn 42: Witnessed player slap Olga']
})

# Frank witnessed violence in his bar
relationships.update(frank, player, {
    'strength': 'strained',  # Was neutral/positive (customer), now strained
    'tags': ['caused_violence_in_my_bar', 'unwelcome'],
    'history': ['Turn 42: Started fight in my establishment']
})
```

**Goal Creation:**
```python
# Olga sets revenge goal
goals.create(olga, {
    'type': 'REVENGE',
    'target': player,
    'priority': 'HIGH',
    'created_turn': current_turn
})

# Frank sets avoidance goal
goals.create(frank, {
    'type': 'AVOIDANCE',
    'target': player,
    'action': 'discourage_return',
    'priority': 'MEDIUM'
})
```

**Memory Recording:**
```python
# All present entities remember this event
event = {
    'type': 'violence',
    'description': 'player_slapped_olga',
    'location': current_location,
    'turn': current_turn,
    'participants': [player, olga],
    'witnesses': [marcus, frank, ...nameless...]
}

for entity in present_entities:
    entity.memory.add_event(event)
```

These ripple effects **influence future interactions** but don't require resolution now:
- Olga's REVENGE goal → Opportunity Generator might create revenge scenarios
- Relationship changes → Affect reaction weights in future encounters
- Memories → Provide context for future LLM calls

---

### Complete Action Resolution Flow

**Example: Player slaps Olga in bar**

```
┌─────────────────────────────────────────────────────────────┐
│ Stage 1: Player Action Outcome                              │
├─────────────────────────────────────────────────────────────┤
│ LLM Call #1: Generate outcome possibilities                 │
│ Validation: Filter invalid outcomes                         │
│ Dice Roll: Select "SUCCESS - slap connects"                 │
│ World State: Olga takes minor damage, crowd alerted         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Stage 2: Target Reaction (Olga)                             │
├─────────────────────────────────────────────────────────────┤
│ LLM Call #2: Generate Olga's reaction possibilities         │
│ Validation: Check requirements (has weapon? conscious?)     │
│ Dice Roll: Select "draws_weapon_threatens"                  │
│ World State: Olga's state = weapon_drawn, stance_threatening│
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Stage 3: Witness Reactions (Named NPCs)                     │
├─────────────────────────────────────────────────────────────┤
│ LLM Call #3: Marcus reaction (sees weapon)                  │
│ Dice Roll: "moves_to_intervene"                             │
│ World State: Marcus approaching, intent = de-escalate       │
│                                                              │
│ LLM Call #4: Frank reaction (sees weapon in his bar)        │
│ Dice Roll: "ducks_behind_bar"                               │
│ World State: Frank position = hidden, alert = high          │
│                                                              │
│ Nameless NPCs: No individual calls, handled by narrator     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Stage 4: Scene Narration                                    │
├─────────────────────────────────────────────────────────────┤
│ LLM Call #5: Compile all outcomes into prose                │
│ Output: "You slap Olga... she draws a gun... Marcus moves..." │
│ No world state changes (pure description)                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Stage 5: Ripple Effects (Deterministic)                     │
├─────────────────────────────────────────────────────────────┤
│ Relationships: Olga ← Player (strength: hostile)         │
│ Goals: Olga sets REVENGE goal                               │
│ Memories: All present entities record event                 │
│ No LLM calls, pure state updates                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    STOP - AWAIT PLAYER INPUT
```

**Total LLM Calls: 5**
- 1 for action outcome
- 1 for target reaction  
- 2 for named witness reactions (Marcus, Frank)
- 1 for narration

---

### Special Cases

**No Direct Target (Environmental Action):**
```
Player: "I examine the bookshelf"
- Stage 1: Action outcome (find anything interesting?)
- Skip Stage 2: No target to react
- Skip Stage 3: No witnesses care about examining bookshelf
- Stage 4: Narration of what player finds
- Stage 5: Player memory updated (knows about bookshelf contents)

Total: 2 LLM calls
```

**Failed Action (Nothing Happens):**
```
Player: "I try to pick the lock" → Roll: CRITICAL_FAILURE (break lockpick)
- Stage 1: Break lockpick
- Skip Stages 2-3: No one reacts to failed lock attempt in private
- Stage 4: Narration of attempt and failure
- Stage 5: Player inventory (one less lockpick)

Total: 2 LLM calls
```

**Large Group Confrontation:**
```
Player starts fight in crowded room with 6 named NPCs
- Stage 1: Action outcome
- Stage 2: Target reaction
- Stage 3: 5 witness reactions (5 LLM calls)
- Stage 4: Narration
- Stage 5: Ripple effects

Total: 8 LLM calls (can get expensive for complex scenes)
```

---

### Key Operations

- `generate_action_outcome(player, action, context)` → weighted outcome list
- `generate_npc_reaction(npc, trigger_event, context)` → weighted reaction list
- `validate_options(option_list, entity, world_state)` → filtered valid options
- `dice_roll(valid_options)` → single selected option (using random.choices())
- `compile_narration(outcomes, location, npcs)` → prose text
- `update_ripple_effects(participants, event)` → relationship/goal/memory updates

### Integration Flow

```
PLAYER INPUT (natural language)
    ↓
REFERENCE RESOLVER (convert to entity_ids)
    ↓
┌─────────────────────────────────────────┐
│ CONSEQUENCE ENGINE - Stage 1            │
│ ├─ LLM: Generate action outcomes        │
│ ├─ Validate: Filter impossible options  │
│ └─ Dice: Select outcome                 │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ CONSEQUENCE ENGINE - Stage 2            │
│ ├─ LLM: Generate target reaction        │
│ ├─ Validate: Check requirements         │
│ └─ Dice: Select reaction                │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ CONSEQUENCE ENGINE - Stage 3            │
│ For each named witness:                 │
│ ├─ LLM: Generate witness reaction       │
│ ├─ Validate: Check requirements         │
│ └─ Dice: Select reaction                │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ CONSEQUENCE ENGINE - Stage 4            │
│ └─ LLM: Compile narration (no dice)     │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ CONSEQUENCE ENGINE - Stage 5            │
│ └─ Deterministic: Update relationships, │
│    goals, memories (no LLM)             │
└─────────────────────────────────────────┘
    ↓
WORLD STATE DATABASE UPDATED
    ↓
PRESENT NARRATION TO PLAYER
    ↓
AWAIT NEXT PLAYER INPUT
```

---
---

### 4.6 Interaction Resolution System

**Purpose:** Handle player-initiated interactions with dynamic entity generation. Entities become detailed through engagement, not pre-generated.

**Core Principle:** NPCs become important if player makes them important through repeated interaction. Not all interactions lead to deep relationships.

**Responsibilities:**
- Generate entities on-demand when player interacts with them
- Track engagement depth (background → acquaintance → recurring → major)
- Progressively deepen entity detail based on interaction frequency
- Create emergent opportunities from interactions
- Update world state with interaction outcomes

**Engagement Levels:**

**Background (0 interactions or mentioned only):**
- Minimal detail: name, role, basic descriptor
- Example: "Senator Johnson's secretary" - no name yet
- Generated: When first mentioned in context

**Acquaintance (1-3 interactions):**
- Basic personality traits
- Current disposition toward player
- Remember player and initial interaction
- Example: Secretary has name (Julia), is professional, curious about player

**Recurring (4-10 interactions):**
- Developed personality and background
- Own goals and motivations
- Relationship trajectory established
- Can offer subplots or opportunities
- Example: Julia is ambitious, wants promotion, sees player as potential political connection

**Major (10+ interactions):**
- Fully realized character
- Rich backstory relevant to current situation
- Complex motivations
- Can drive or participate in significant plot threads
- Example: Julia has history with political corruption, personal stake in player's success/failure

**On-Demand Generation Process:**

**First Mention (Background):**
```
Context: Player calls Senator Johnson
System: Senator has secretary (role exists)
Generate: Basic entity
- entity_id: npc_secretary_001
- name: [generated or "the secretary"]
- role: senator's secretary
- basic_traits: professional, gatekeeper
- engagement_level: background
```

**First Interaction (→ Acquaintance):**
```
Player: "I'd like to speak with the Senator"
System generates interaction:
- Give secretary a name: "Julia Martinez"
- Generate response based on role + context
- Record interaction in entity history
- Update engagement_level: acquaintance
- Entity now remembers player
```

**Continued Interaction (→ Recurring):**
```
Player calls again, asks for advice, meets for coffee
System deepens entity:
- Generate backstory elements relevant to interactions
- Develop personality traits beyond professional role
- Give her goals: "wants promotion, politically ambitious"
- Establish relationship dynamic: "sees player as interesting political contact"
- engagement_level: recurring
```

**Deep Relationship (→ Major):**
```
Multiple meetings, personal conversations, mutual benefit
System fully realizes entity:
- Rich backstory: "came from working-class family, fought for position, saw corruption in previous job"
- Complex motivations: "wants to change system from inside, but cautious about risks"
- Personal stake: "player's campaign reminds her why she got into politics"
- engagement_level: major
- Can now drive subplots, have autonomous goals that intersect with player
```

**Interaction Flow:**

```
PLAYER INITIATES INTERACTION with entity
    ↓
Check entity engagement_level
    ↓
If background: Generate basic interaction response, promote to acquaintance
If acquaintance: Use established traits, deepen slightly, track interaction count
If recurring: Rich interaction based on history, consider subplot hooks
If major: Full character response with potential plot implications
    ↓
CONSEQUENCE ENGINE (normal flow)
    ↓
WORLD STATE UPDATE
- Record interaction in entity history
- Update relationship strength/type
- Increment interaction_count
- Promote engagement_level if threshold crossed
```

**Emergent Opportunities from Interactions:**

**Example: Secretary Interaction**
```
Interaction 1: Player calls Senator
→ Secretary takes message
→ Opportunity created: "She might tell Senator about you"

Interaction 2: Player calls again, more polished pitch
→ Secretary impressed by persistence
→ Opportunity created: "She mentions you favorably to Senator"

Interaction 3: Player thanks secretary for help
→ Secretary appreciates courtesy
→ Opportunity created: "She offers advice on approaching Senator"

Interaction 4: Secretary mentions stress about job
→ Player offers sympathy
→ Opportunity created: "She suggests getting coffee to talk"

Interaction 5: Coffee meeting
→ Personal connection forms
→ Opportunities created: "Potential friend", "Inside source on Senator's schedule", "Romantic interest (if player pursues)"
```

**Each interaction creates potential branches. Player chooses which to pursue.**

**Detail Generation Triggers:**

**When to generate more detail:**
- Player asks about entity's background
- Entity becomes relevant to player's goals
- Interaction count crosses threshold (3, 7, 15)
- Entity takes autonomous action affecting player

**What to generate:**
- Personality traits (relevant to current interaction context)
- Background elements (only as much as needed for scene)
- Goals (what do they want that might intersect with player?)
- Relationships to other entities (emerge through conversation or events)

**Memory Management:**

**Active Entities (recurring/major engagement):**
- Full detail in memory
- Recent interaction history readily available
- Quick access for consequence generation

**Inactive Entities (acquaintance, no recent interaction):**
- Core identity preserved
- Detailed history archived
- Can be restored if player re-engages

**Background Entities:**
- Minimal footprint
- Can be regenerated consistently if needed

**Key Operations:**
- `initiate_interaction(player, entity_id, action)` → generate interaction response
- `deepen_entity(entity_id, context)` → add detail based on engagement
- `promote_engagement(entity_id)` → background → acquaintance → recurring → major
- `generate_interaction_opportunities(entity_id, interaction_history)` → potential hooks

**Example: Phone Call to Senator**

```
Player: "I call Senator Johnson's office"

System:
1. Query: Does secretary entity exist?
   - No → Generate npc_secretary_001 (background)
   - Name: TBD, Role: senator's gatekeeper
   
2. Generate interaction:
   - LLM Context: Player is journalist running for office, first time calling
   - Secretary response: Professional, screening call, asks about reason for calling
   - Give secretary name during interaction: "This is Julia Martinez, Senator Johnson's assistant"
   
3. Player explains reason
   - Consequence Engine: Does she take player seriously?
   - Factors: Player's presentation, secretary's personality (generated), senator's calendar
   - Outcome: She takes message, says senator will consider meeting
   
4. Update World State:
   - npc_secretary_001 now has name: Julia Martinez
   - Relationship created: player ↔ Julia (met_once, neutral)
   - Julia's knowledge updated: knows player is running for office, spoke professionally
   - engagement_level: acquaintance
   - interaction_count: 1
   
5. NPC Agency triggers:
   - Julia will tell senator about call (high probability based on her role)
   - This affects future interaction if player gets meeting
```

**This pattern repeats: each interaction deepens the entity if player continues engaging.**

---

### 4.7 Opportunity Generator

**Purpose:** Create hooks and narrative possibilities without forcing engagement. Present player with potential avenues for action while respecting player's choice to pursue or ignore.

**Core Principle:** Opportunities are vibes-based, context-sensitive suggestions that emerge naturally from world state. They are NOT quests, NOT mandatory, and ALL expire eventually.

---

#### Responsibilities

- Scan world state for potential player interactions
- Generate based on: player goals, current location, time, active world events
- Produce both mundane and dramatic opportunities with appropriate frequency
- Weight by context and pacing needs
- Present as offers, not mandates
- Track opportunity lifecycle (available, pursuing, resolved, expired)
- **Ensure all opportunities expire** - nothing persists forever

---

#### Opportunity Types

**Conversation Snippets:**
- "You overhear two people discussing a mysterious shipment at the docks"
- Player can: approach them, eavesdrop more, ignore

**Noticed Objects:**
- "You spot a wallet dropped under a table"
- Player can: grab it, examine it, leave it, report it to staff

**Person Approaches:**
- "A nervous-looking woman approaches you"
- Player can: engage, brush off, ask what she wants

**Location Available:**
- "The usually-closed archive room door is ajar"
- Player can: investigate, ignore, report to staff

**Social Opportunities:**
- "Marcus waves you over to his table"
- Player can: join him, wave back but stay put, ignore

**Information Available:**
- "Your phone buzzes with a news alert about city hall scandal"
- Player can: read it, ignore it, save for later

---

#### Opportunity Generation Process

**Triggers:**

1. **Scene Transition** - Player changes location → Generate opportunities for new scene
2. **Time Passage** - Significant time advances → New opportunities emerge, old ones may expire
3. **World State Change** - Major event occurs → Opportunities created in response
4. **Turn Interval** - Every N turns (configurable), check for new opportunities in current scene
5. **Pacing-Driven** - Pacing Monitor requests more/fewer opportunities

**Generation Flow:**

```
TRIGGER OCCURS
    ↓
OPPORTUNITY GENERATOR queries World State:
- Player's current location
- Player's stated goals
- Active world events
- NPCs in proximity
- Time of day / day of week
- Recent player actions
- Current pacing/tension level
    ↓
LLM GENERATION: Create 5-10 potential opportunities
For each, specify:
- type: (conversation, object, person, location, social, information)
- description: What player notices
- context_relevance: How relevant to current context (0.0-1.0)
- goal_relevance: How relevant to player goals (0.0-1.0)
- urgency: How time-sensitive (none, low, medium, high)
- dramatic_weight: How dramatic vs mundane (0.0=mundane, 1.0=dramatic)
    ↓
CLASSIFICATION & FILTERING:
- Classify by dramatic weight (mundane, minor, significant, dramatic)
- Filter by context appropriateness
- Check pacing constraints
- Apply frequency distribution targets
    ↓
SELECT 1-3 opportunities to present this scene
    ↓
FORMAT for Scene Narrator
    ↓
TRACK in opportunity database with expiration conditions
```

---

#### Opportunity Classification

**Classification Framework:**

```python
def classify_opportunity(opportunity):
    """
    Classify opportunity by dramatic weight.
    """
    dramatic_weight = opportunity['dramatic_weight']
    
    if dramatic_weight < 0.3:
        return 'MUNDANE'
    elif dramatic_weight < 0.6:
        return 'MINOR'
    elif dramatic_weight < 0.85:
        return 'SIGNIFICANT'
    else:
        return 'DRAMATIC'
```

**Frequency Distribution Targets:**

```
MUNDANE:      60-70%  (Normal social interactions, routine observations)
MINOR:        20-30%  (Slightly unusual but not dramatic)
SIGNIFICANT:   8-12%  (Clear plot potential if pursued)
DRAMATIC:      2-5%   (High-stakes or urgent, rare)
```

**Examples by Classification:**

**MUNDANE (60-70%):**
- "The barista asks how your day is going"
- "Your spouse mentions needing groceries"
- "You notice the weather is nice today"
- "The TV news is on in the background"

**MINOR (20-30%):**
- "You notice the same car has been parked across the street for three days"
- "An email from a college friend you haven't spoken to in years"
- "You overhear someone mention your workplace"
- "A flyer for a community meeting on your windshield"

**SIGNIFICANT (8-12%):**
- "A former colleague contacts you with a tip about corruption in the mayor's office"
- "You spot your rival meeting with someone unexpected"
- "An opportunity to meet with a key political figure"
- "Evidence of something suspicious at your workplace"

**DRAMATIC (2-5%):**
- "You witness a hit-and-run accident"
- "A known criminal approaches you with a proposition"
- "You discover a body"
- "Someone pulls a gun in the cafe"

---

#### Filtering and Selection

**Contextual Filtering:**

```python
def filter_opportunities(opportunities, context, pacing_state):
    """
    Filter and select opportunities based on context and pacing.
    """
    # 1. Remove contextually inappropriate
    valid = [opp for opp in opportunities if is_contextually_valid(opp, context)]
    
    # 2. Apply pacing adjustments
    if pacing_state.recent_tension > 7:
        # Suppress dramatic, favor mundane
        valid = adjust_weights_toward_mundane(valid)
    elif pacing_state.recent_tension < 3 and pacing_state.stagnation_detected:
        # Slightly boost interesting opportunities
        valid = adjust_weights_toward_interesting(valid)
    
    # 3. Check frequency distribution
    recent_classifications = get_recent_opportunity_classifications(limit=20)
    if count_dramatic(recent_classifications) > 0.05 * len(recent_classifications):
        # Too many dramatic recently, suppress
        valid = suppress_dramatic(valid)
    
    # 4. Select 1-3 opportunities
    selected = weighted_random_select(valid, count=random.randint(1, 3))
    
    return selected
```

**Context Validation:**

```python
def is_contextually_valid(opportunity, context):
    """
    Check if opportunity makes sense in current context.
    """
    # Location check
    if opportunity['type'] == 'person_approaches':
        if context.location_type == 'isolated_wilderness':
            return False  # No one around to approach
    
    # Time check
    if opportunity['type'] == 'phone_call_from_colleague':
        if context.time_of_day == 'middle_of_night':
            return False  # Unrealistic timing (unless urgent)
    
    # Recent opportunity check
    if similar_opportunity_recently_presented(opportunity):
        return False  # Don't repeat same opportunity type too soon
    
    return True
```

---

#### Opportunity Expiration (CRITICAL)

**Core Principle:** ALL opportunities expire. Nothing persists indefinitely. The world moves on.

**Expiration Mechanisms:**

**1. Time-Based Expiration:**
```python
{
  "opportunity_id": "opp_secretary_cafe_001",
  "expires_at_turn": 156,  # Absolute turn number
  "expiry_reason": "Secretary leaves cafe after finishing coffee"
}
```

**2. Action-Based Expiration:**
```python
{
  "opportunity_id": "opp_eavesdrop_conversation_002",
  "expires_when": "conversation_ends",
  "expiry_condition_check": lambda: check_conversation_still_happening()
}
```

**3. Context-Based Expiration:**
```python
{
  "opportunity_id": "opp_ajar_door_003",
  "expires_when": "player_leaves_location",
  "context": "only_available_while_in_building"
}
```

**4. Evolution-Based Expiration:**
```python
# Opportunity doesn't disappear, it evolves into something else
{
  "opportunity_id": "opp_contact_colleague_004",
  "expiry_type": "EVOLUTION",
  "evolution_path": [
    {"turns": 5, "state": "Colleague reaches out again, more insistent"},
    {"turns": 10, "state": "Colleague gives up, stops trying"},
    {"turns": 20, "state": "Colleague shares tip with someone else instead"}
  ]
}
```

**Expiration Estimation:**

When Opportunity Generator creates opportunities, LLM estimates realistic expiration:

```
OPPORTUNITY EXPIRATION PROMPT:

You are estimating how long an opportunity should remain available.

OPPORTUNITY: "{opportunity_description}"
TYPE: {opportunity_type}
CONTEXT: {current_context}

Estimate:
1. How long would this realistically be available?
2. What would cause it to expire?
3. What happens if player ignores it?

OUTPUT AS JSON:
{
  "expires_in_turns": <number>,
  "expiry_reason": "brief explanation",
  "post_expiry_state": "what happens after expiry"
}

GUIDELINES:
- Urgent opportunities: 1-3 turns
- Time-sensitive: 5-10 turns
- Moderate: 10-30 turns
- Persistent but degrading: 30-100 turns
- Nothing lasts forever - even "visit mother" eventually expires (she gets sick, moves, dies, gives up on you)
```

**Example Expirations:**

```
Opportunity: "Secretary at cafe"
→ Expires in 3 turns (finishes coffee and leaves)

Opportunity: "Email from source"
→ Expires in 15 turns (source moves on if no response)

Opportunity: "Meeting at 3pm"
→ Expires at turn corresponding to 3pm

Opportunity: "Investigate suspicious activity at warehouse"
→ Expires in 20 turns (perpetrators finish and leave)

Opportunity: "Call mother back"
→ Expires in 50 turns (mother stops calling if consistently ignored)

Opportunity: "Neighbor's door is ajar"
→ Expires in 2 turns (neighbor closes it)
```

**Opportunity Lifecycle Tracking:**

```python
class OpportunityTracker:
    def __init__(self):
        self.active_opportunities = {}
        self.expired_opportunities = []
        self.resolved_opportunities = []
    
    def add_opportunity(self, opportunity):
        """Register new opportunity with expiration."""
        self.active_opportunities[opportunity.id] = {
            'opportunity': opportunity,
            'created_at_turn': current_turn,
            'expires_at_turn': current_turn + opportunity.expires_in_turns,
            'status': 'AVAILABLE'
        }
    
    def check_expirations(self, current_turn):
        """Check and process expired opportunities."""
        for opp_id, opp_data in list(self.active_opportunities.items()):
            if current_turn >= opp_data['expires_at_turn']:
                # Opportunity has expired
                self.expire_opportunity(opp_id, opp_data)
    
    def expire_opportunity(self, opp_id, opp_data):
        """Handle opportunity expiration."""
        opportunity = opp_data['opportunity']
        
        # Apply post-expiry state to world
        if opportunity.post_expiry_state:
            world_state.apply_changes(opportunity.post_expiry_state)
        
        # Move to expired list
        self.expired_opportunities.append({
            'opportunity': opportunity,
            'expired_at_turn': current_turn,
            'reason': opportunity.expiry_reason
        })
        
        # Remove from active
        del self.active_opportunities[opp_id]
        
        log_info(f"Opportunity expired: {opportunity.description}")
    
    def resolve_opportunity(self, opp_id, resolution):
        """Mark opportunity as pursued/resolved."""
        if opp_id in self.active_opportunities:
            opp_data = self.active_opportunities[opp_id]
            self.resolved_opportunities.append({
                'opportunity': opp_data['opportunity'],
                'resolved_at_turn': current_turn,
                'resolution': resolution
            })
            del self.active_opportunities[opp_id]
```

---

#### Context-Sensitive Generation

**Location-Based:**
- Busy cafe → More people-watching opportunities, overhearing conversations
- Empty street at night → Fewer social opportunities, more environmental
- Government office → Professional interactions, bureaucratic obstacles
- Home → Personal/family opportunities, domestic mundane

**Time-Based:**
- Morning: Routine opportunities, people going to work
- Afternoon: Meetings, appointments, errands
- Evening: Social opportunities, relaxation, bars/restaurants
- Night: Fewer opportunities, different character types, increased danger in some settings

**Goal-Based:**
- Player goal: "run for office" → Opportunities related to networking, fundraising, voter contact
- Player goal: "investigate corruption" → Opportunities for information gathering, meeting sources
- Player goal: "maintain family life" → Opportunities related to spouse, children, home
- No explicit goals → General environmental opportunities

**Event-Based:**
- Ongoing war → Refugees, supply shortages, political tensions
- Festival in town → Crowds, vendors, celebration
- Economic downturn → Job loss, stress, scarcity
- No major events → Normal life opportunities

---

#### LLM Prompt Template

```
You are generating opportunities for an interactive fiction scene.

CONTEXT:
Location: {location_name} ({location_type})
Time: {time_of_day}, {day_of_week}
Player Goals: {player_goals}
Recent Events: {recent_events}
NPCs Present: {npcs_in_scene}
Current Tension Level: {pacing_tension_level}

Generate 5-10 potential opportunities that emerge naturally from this context.

For each opportunity, specify:
{
  "type": "conversation|object|person|location|social|information",
  "description": "What the player notices (1-2 sentences)",
  "context_relevance": 0.0-1.0,  // How well it fits current scene
  "goal_relevance": 0.0-1.0,      // How relevant to player goals
  "urgency": "none|low|medium|high",
  "dramatic_weight": 0.0-1.0,     // 0=mundane, 1=dramatic
  "expires_in_turns": <number>,   // How long until no longer available
  "expiry_reason": "why it expires",
  "post_expiry_state": "what happens if ignored"
}

GUIDELINES:
- Most opportunities should be mundane (dramatic_weight < 0.3)
- Opportunities should feel natural, not forced
- Include mix of immediate (phone rings) and ambient (notice something)
- All opportunities must have expiration - nothing lasts forever
- Expiration should be realistic for the opportunity type
- Consider what happens if player ignores each opportunity

CURRENT TENSION: {tension_level}
- If HIGH (>7): Favor lower dramatic_weight, mundane opportunities
- If LOW (<3): Can include slightly higher dramatic_weight
- If MEDIUM: Balanced mix

OUTPUT VALID JSON ARRAY.
```

---

#### Integration with Other Systems

**From NPC Agency:**
- NPC takes autonomous action → Creates opportunity
- Example: Secretary texts player → Opportunity to respond (expires in 10 turns if ignored)

**From Ambient Events:**
- World event occurs → Creates opportunity
- Example: Power outage → Opportunity to check on elderly neighbor (expires when power restored)

**From World State Changes:**
- Major change → New opportunities emerge
- Example: Player gets promoted → Opportunities related to new responsibilities

**To Pacing Monitor:**
- Reports opportunity types and frequency
- Pacing Monitor adjusts generation parameters
- Feedback loop maintains healthy pacing

**To Scene Narrator:**
- Selected opportunities formatted for natural inclusion in narration
- Woven into scene description, not listed separately

---

#### Key Operations

```python
# Generate opportunities
opportunities = generate_opportunities(
    scene_context=current_scene,
    player_state=player,
    world_state=world_state
)

# Filter by pacing and context
filtered = filter_opportunities(
    opportunities=opportunities,
    context=current_context,
    pacing_state=pacing_monitor.get_state()
)

# Select 1-3 to present
selected = select_opportunities(filtered, count=random.randint(1, 3))

# Track with expiration
for opp in selected:
    opportunity_tracker.add_opportunity(opp)

# Check expirations each turn
opportunity_tracker.check_expirations(current_turn)

# Format for narration
formatted = format_opportunities_for_narration(selected)
```

---

#### Example Scenario

```
Player is at home, evening, goal is "investigate mayor's corruption"

Opportunity Generator queries:
- Location: home (quiet, family present)
- Time: evening (downtime)
- Goals: investigation-related hooks more weighted
- Recent activity: player has been busy all day
- Pacing: Recent tension high (player had confrontation earlier)

LLM generates 8 opportunities:
1. [MUNDANE, 0.2] "Your spouse asks about your day" (expires: 5 turns - conversation ends)
2. [MINOR, 0.4] "You receive an encrypted email from unknown sender" (expires: 15 turns - sender moves on)
3. [MUNDANE, 0.15] "The news is on in the background" (expires: 3 turns - news ends)
4. [SIGNIFICANT, 0.75] "Your phone rings - it's that source who's been avoiding you" (expires: 2 turns - voicemail if missed)
5. [MINOR, 0.35] "You notice a news article about mayoral campaign finances" (expires: 10 turns - article gets buried)
6. [MUNDANE, 0.1] "Your child wants help with homework" (expires: 8 turns - gives up and does it alone)
7. [MINOR, 0.3] "Text from colleague: 'We need to talk'" (expires: 20 turns - colleague talks to someone else)
8. [DRAMATIC, 0.85] "Car pulls up outside, engine idles" (expires: 4 turns - car leaves)

Classification:
- MUNDANE: #1, #3, #6 (3 opportunities)
- MINOR: #2, #5, #7 (3 opportunities)
- SIGNIFICANT: #4 (1 opportunity)
- DRAMATIC: #8 (1 opportunity)

Pacing Filter:
- Recent tension high (7.5/10)
- Suppress DRAMATIC and SIGNIFICANT
- Favor MUNDANE
- Result: Remove #4 and #8 from selection pool

Context Filter:
- Evening at home: All remaining opportunities contextually valid

Frequency Check:
- Recent opportunities: 65% mundane, 30% minor, 5% significant
- Within targets, no adjustment needed

Final Selection (2 opportunities):
- "Your spouse asks about your day" (mundane, family connection, decompression)
- "You receive an encrypted email" (minor, goal-relevant but not urgent, can check later)

Tracking:
- Spouse conversation expires in 5 turns (conversation ends)
- Email expires in 15 turns (sender moves on if ignored)

Suppressed opportunities:
- Phone call (#4) → Source leaves voicemail, tries again tomorrow (lower tension)
- Idling car (#8) → Car drives away after 4 turns, opportunity lost forever
```

---

#### Critical Reminders

1. **All opportunities expire** - Nothing persists indefinitely
2. **Vibes-based selection** - Use LLM for generation, not rigid rules
3. **Pacing-aware** - Adjust to current tension level
4. **Player choice respected** - Never force engagement
5. **Natural presentation** - Woven into narration, not menu options
6. **Evolution over deletion** - Some opportunities evolve rather than disappear
7. **Consequences for ignoring** - World moves on, opportunities go to others

---

---

### 4.8 Ambient Event Generator

**Purpose:** World continues independent of player action. Events happen around/to player based on location, time, world conditions, and probability.

**Responsibilities:**
- Generate events that occur without player initiation
- Operate on realistic probability distributions (most of the time, nothing remarkable happens)
- Query world state to contextualize probabilities (prior actions affect future likelihoods)
- Create both player-affecting and background events
- Maintain sense that world exists beyond player's immediate perception

**Core Principle:** Drama is the exception, not the baseline. Most events should be mundane.

---

#### Concrete Implementation: Per-Turn Ambient Events

**System Overview:**

Every turn, the system rolls for an ambient event with a simple, flat probability. If triggered, the event's severity is determined, then the LLM generates a contextually appropriate event. Events are woven naturally into narration.

**Key Design Decisions:**

1. **Flat 3% probability per turn** - Simple, predictable, no complex calculations
2. **Three severity tiers** - MINOR (70%), MODERATE (25%), MAJOR (5%)
3. **Does NOT respect player engagement** - Events can interrupt active scenes (realistic)
4. **Woven into narration** - Not separate notifications
5. **Context-aware generation** - LLM creates event appropriate to situation

---

#### Probability System

```python
def check_ambient_event():
    """
    Roll for ambient event occurrence.
    Returns True if event should happen this turn.
    """
    return random.random() < 0.03  # 3% chance per turn
```

**Expected Frequency:**
- 3% per turn = approximately 1 event every 30-35 turns
- Over 100 turns: ~3 events
- Over 1000 turns: ~30 events

**No Special Cases:**
- Same probability whether player is fighting, sleeping, talking, or idling
- Events can interrupt conversations, combat, intimate moments
- World doesn't wait for player convenience

---

#### Severity Determination

If ambient event is triggered:

```python
def determine_event_severity():
    """
    Determine severity tier for ambient event.
    """
    roll = random.random()
    
    if roll < 0.70:
        return 'MINOR'      # 70% of events
    elif roll < 0.95:
        return 'MODERATE'   # 25% of events
    else:
        return 'MAJOR'      # 5% of events
```

**Severity Definitions:**

**MINOR (70%):**
- Background details that don't demand attention
- Easily integrated into ongoing action
- Examples: Rain starts, phone buzzes, door closes, light flickers, bird chirps, distant siren

**MODERATE (25%):**
- Noticeable events that create momentary disruption
- Hard to ignore but doesn't stop current action
- Examples: Lights go out briefly, loud noise from street, someone walks by, weather turns bad, phone rings

**MAJOR (5%):**
- Demands immediate attention
- Hard to continue current action without acknowledging
- Examples: Car crash outside, person bursts in, fire alarm, gunshot nearby, sudden illness

---

#### LLM Event Generation

```python
AMBIENT_EVENT_PROMPT = """
You are generating an ambient event for an interactive fiction scene.

SEVERITY: {severity}
LOCATION: {location.name} ({location.type})
TIME: {current_time}
CURRENT SITUATION: {what_player_is_doing}
RECENT EVENTS: {recent_events_summary}
WEATHER: {current_weather}
NPCs PRESENT: {npcs_in_scene}

Generate an ambient event appropriate to this context and severity level.

SEVERITY GUIDELINES:

MINOR (background detail):
- Doesn't demand attention
- Easily woven into flow
- Examples: rain starts, distant sound, light flickers, wind picks up
- Should feel like natural background texture

MODERATE (noticeable disruption):
- Creates momentary pause or shift
- Noticeable but doesn't force reaction
- Examples: phone rings, lights go out briefly, loud noise, someone walks in
- Can be acknowledged or ignored

MAJOR (demands attention):
- Hard to ignore
- Forces awareness and possible reaction
- Examples: crash outside window, alarm sounds, person in distress, sudden emergency
- Becomes immediate focus of scene

OUTPUT AS JSON:
{
  "description": "brief description of what happens (1-2 sentences)",
  "sensory_details": "what player hears/sees/smells/feels",
  "context_appropriate": true/false
}

CRITICAL:
- Event must fit the current context (location, time, situation)
- Respect severity level - don't escalate MINOR to MODERATE
- Be specific and concrete, not vague
- Consider what's realistic for this setting and time
- Events should feel organic, not forced

OUTPUT VALID JSON ONLY.
"""
```

---

#### Implementation Code

```python
def process_ambient_events(world_state):
    """
    Check for and process ambient events on this turn.
    Called every turn, regardless of player action.
    """
    # Step 1: Check if event occurs
    if not check_ambient_event():
        return None  # No event this turn
    
    # Step 2: Determine severity
    severity = determine_event_severity()
    
    log_info(f"[AMBIENT EVENT] Triggered: {severity}")
    
    # Step 3: Generate event via LLM
    event = generate_ambient_event(world_state, severity)
    
    log_info(f"[AMBIENT EVENT] {severity}: {event['description']}")
    
    return event


def generate_ambient_event(world_state, severity):
    """
    LLM generates contextually appropriate event.
    """
    prompt = AMBIENT_EVENT_PROMPT.format(
        severity=severity,
        location=world_state.location,
        current_time=world_state.current_time,
        what_player_is_doing=get_current_situation(world_state),
        recent_events_summary=format_recent_events(world_state, limit=3),
        current_weather=world_state.weather,
        npcs_in_scene=format_npcs(world_state.npcs_in_scene)
    )
    
    response = llm_call(prompt, temperature=0.7, response_format="json")
    
    return {
        'description': response['description'],
        'sensory_details': response['sensory_details'],
        'severity': severity,
        'timestamp': world_state.current_time,
        'turn': world_state.current_turn
    }


def integrate_with_turn_flow(world_state):
    """
    Integration point in main turn sequence.
    """
    # ... action resolution, time advancement, etc.
    
    # Check for ambient event
    ambient_event = process_ambient_events(world_state)
    
    # Generate narration (includes ambient event if present)
    narration = scene_narrator.generate(
        outcome=action_outcome,
        opportunities=opportunities,
        ambient_event=ambient_event,  # Pass to narrator
        world_state=world_state
    )
    
    return narration
```

---

#### Scene Narrator Integration

Ambient events are woven into narration based on severity:

```python
SCENE_NARRATOR_PROMPT = f"""
Generate natural narrative prose for this scene.

[... existing prompt content ...]

{if ambient_event}:
AMBIENT EVENT TO WEAVE IN:
Description: {ambient_event.description}
Sensory Details: {ambient_event.sensory_details}
Severity: {ambient_event.severity}

Integration guidelines by severity:

MINOR: Brief mention, background detail, doesn't interrupt flow
  Example: "Rain starts pattering against the window as you consider your options."
  
MODERATE: Noticeable detail, creates momentary disruption but player can continue
  Example: "The lights flicker once, twice, then stabilize. Marcus glances up at the ceiling but continues talking."
  
MAJOR: Demands attention, hard to ignore, becomes focus of immediate scene
  Example: "A deafening crash outside cuts you off mid-sentence. Through the window, you see two cars have collided at the intersection."

Weave the event naturally into the prose. Match the severity level - don't downplay MAJOR or overemphasize MINOR.

[... rest of prompt ...]
"""
```

---

#### Example Scenarios

**Scenario 1: No Event (97% of turns)**
```
Turn 42: 
Roll: 0.85 (>0.03, no event)
→ Narration proceeds without ambient event
→ Just player action outcome and opportunities
```

**Scenario 2: MINOR Event**
```
Turn 43:
Roll: 0.01 (<0.03, event triggers)
Severity roll: 0.45 (MINOR, <0.70)

Generated event:
{
  "description": "Rain starts pattering against the window",
  "sensory_details": "Soft rhythm of drops on glass",
  "severity": "MINOR"
}

Narration:
"You settle into the worn barstool, considering Marcus's words. Rain starts 
pattering against the window, a soft rhythm against the glass. He's watching 
you, waiting for your response."

(Event is woven in as background detail)
```

**Scenario 3: MODERATE Event**
```
Turn 120:
Roll: 0.02 (event triggers)
Severity roll: 0.88 (MODERATE, 0.70-0.95)

Generated event:
{
  "description": "The lights flicker and go out. Emergency lighting kicks in after a moment.",
  "sensory_details": "Darkness, then dim red glow. Surprised murmurs from patrons.",
  "severity": "MODERATE"
}

Narration:
"You're about to respond when the lights flicker once, twice, then go out 
completely. There's a moment of darkness before emergency lighting kicks in, 
casting everything in dim red. Around you, patrons murmur in surprise. Marcus 
swears under his breath and heads toward the circuit breaker."

(Event is noticeable, creates context shift)
```

**Scenario 4: MAJOR Event During Active Scene**
```
Turn 205:
Player is mid-conversation with Marcus (ACTIVE engagement)
Roll: 0.01 (event triggers anyway - doesn't respect engagement)
Severity roll: 0.97 (MAJOR, >0.95)

Generated event:
{
  "description": "A deafening crash from outside. Two cars have collided violently at the intersection.",
  "sensory_details": "Metal crumpling, glass shattering, car horn stuck on. Steam rising from hoods.",
  "severity": "MAJOR"
}

Narration:
"Marcus is mid-sentence when a deafening crash from outside cuts him off. 
Through the window, you see two cars have collided violently at the intersection, 
steam rising from crumpled hoods. The blare of a stuck horn fills the air. 
People are already running toward the scene.

Marcus stares out the window. 'Jesus,' he mutters."

(Event interrupts active scene - world doesn't wait for player convenience)
```

**Scenario 5: MAJOR Event Creates Natural Opportunity**
```
Turn 206:
Player's previous action was interrupted by car crash

No new ambient event (97% no event)
But the crash from Turn 205 naturally creates player choices:
- Go outside to help
- Call 911
- Stay inside and watch
- Continue conversation with Marcus as if nothing happened

(Event happened, player decides response - system doesn't track as formal "opportunity")
```

---

#### What This Achieves

✅ **World independence** - Events happen regardless of player engagement  
✅ **Simple probability** - 3% per turn, true RNG, no complex conditions  
✅ **Realistic distribution** - Most events are minor, dramatic events are rare  
✅ **No overwhelming** - ~1 event per 30-35 turns on average  
✅ **Natural variety** - LLM generates contextually appropriate events  
✅ **Player agency preserved** - Events occur, player chooses response  
✅ **Can interrupt** - Major events can break into active scenes (realistic)  
✅ **Woven naturally** - Events integrated into prose, not separate notifications  

---

#### Probability Tiers (General Guidelines):**

**Expected/Mundane (90-95%):**
- Nothing unusual occurs
- Routine events (weather, traffic, normal sounds)
- Expected patterns hold

**Minor Disruptions (4-9%):**
- Phone call
- Weather change
- Neighbor knocking
- Power flicker
- Package delivery
- Pet needs attention

**Significant Events (0.5-1%):**
- Power outage
- Car accident nearby
- Friend visits unexpectedly
- Minor injury
- Equipment breaks
- Argument in adjacent space

**Wild Cards (<0.1%):**
- Meteor strike
- Lottery win
- Celebrity sighting
- Building fire
- Major accident
- Natural disaster (if contextually possible)

**Context Modifies Probabilities:**

**Location:**
- Busy city street → higher probability of encounters, noise, traffic
- Rural village → lower probability of events, quieter
- Government building → security events, bureaucratic interactions
- Home → domestic events, family interactions

**Time:**
- 3 AM → very few events, different types (nocturnal activity)
- 9 AM → commute-related events, business activity
- 6 PM → social events, end-of-day transitions
- Midnight → bar closing, late-night activity

**World Conditions:**
- War ongoing → refugees, supply issues, military presence
- Economic collapse → job loss, desperation, scarcity
- Festival → crowds, celebration, temporary changes
- Winter storm → travel disruption, cold-related events

**Prior Player Actions:**
- Angered gang → higher probability of retaliation attempt
- Befriended neighbor → higher probability of friendly check-in
- Unpaid debts → higher probability of debt collector visit
- Political campaign → higher probability of press contact

**Event Generation Process:**

```
TIME PASSES or SCENE TRANSITION
    ↓
AMBIENT EVENT GENERATOR
    ↓
Query World State:
- Current location
- Time of day
- Active world conditions
- Player's recent actions and relationships
- Historical event patterns for this context
    ↓
Roll for event categories:
- Environmental (weather, infrastructure)
- Social (people interactions)
- Personal (health, belongings)
- World-level (news, large-scale events)
    ↓
For each category, generate specific event or null
    ↓
Does event affect player's immediate environment?
→ Yes: Include in scene narration
→ No: Log silently (might be discovered later)
    ↓
Update World State with event
```

**Example: Player at Home, Evening**

**Context:**
- Location: suburban home
- Time: 8 PM on weeknight
- World: no major events
- Recent actions: player has been investigating politician, made some people nervous

**Event Rolls:**

**Environmental:**
- Power grid event? (1% base) → Roll 0.3 → No event

**Social:**
- Someone at door? (5% base in evening) → Roll 3.2 → Yes
- Who? Context: player being investigated means... watchers? (0.5% vs 4.5% normal visitor)
- Roll 2.1 → Normal visitor: neighbor returning borrowed item

**Personal:**
- Health event? (0.1% base) → Roll 78 → No event

**Technology:**
- Phone call/text? (15% base) → Roll 87 → No event

**World News:**
- Major development? (2% base) → Roll 44 → No event

**Result: One ambient event generated:**
"There's a knock at the door. It's your neighbor Sarah returning the ladder you lent her last week."

**Player can:**
- Answer door, chat with Sarah (new interaction opportunity)
- Ignore knock (Sarah leaves, relationship unaffected)
- Look through peephole first (cautious, given recent stress)

**Off-Screen Events:**

Not every event affects player immediately. Some happen in background:

**Example: Player's colleague gets promoted**
- Event occurs today
- Player doesn't know yet
- When player next contacts colleague → learns about promotion → can respond
- Generates opportunity: congratulate, feel envious, ask for favor

**Example: Senator player met has scandal break**
- News story published
- Player might see news alert (if reading news)
- Or player might hear from friend
- Or player might not learn for days
- But world state updated: senator's reputation damaged

**Cascading Events:**

Some ambient events trigger other events:

```
Power outage (significant event)
    ↓
Triggers:
- Traffic lights out → accidents more likely
- Security systems down → break-ins more likely
- Food spoilage → waste, expense
- Can't work (if computer-dependent)
- Family gathers → social opportunity
```

**NPC Autonomous Actions as Ambient Events:**

NPCs taking actions off-screen can manifest as ambient events:

- Secretary tells Senator about player → affects future senator interaction
- Gang member reports player's location → retaliation event more likely
- Friend worries about player → calls to check in

**Key Operations:**
- `generate_ambient_events(context, time_passed)` → list of events
- `determine_visibility(event, player_location)` → player knows now or discovers later
- `contextualize_probability(base_probability, world_state, history)` → adjusted probability
- `log_event(event, visibility)` → record in world state
- `create_opportunities_from_event(event)` → may generate opportunities

**Integration:**

```
TIME ADVANCES
    ↓
AMBIENT EVENT GENERATOR
(What's happening in the world?)
    ↓
ENTITY VALIDATOR
(Events reference valid entities?)
    ↓
CONSISTENCY ENFORCER
(Events violate world rules?)
    ↓
WORLD STATE DATABASE UPDATE
    ↓
Does event affect player immediately?
→ Yes: Include in scene narration
→ No: Log for potential discovery later
    ↓
OPPORTUNITY GENERATOR
(Does event create new hooks?)
```

**Example: Journalist Campaign Scenario**

Player is typing at computer, working on campaign strategy document.

**Ambient Event Roll:**

Time: 2:30 PM, weekday
Location: home office
Context: player is mid-campaign, made controversial statement last week

**Rolls:**
- Phone call? (10% base) → Roll 7.3 → Yes
- Who? Check player's contacts and recent activity
- Could be: supporter, critic, press, volunteer, unknown
- Context: controversial statement → press more likely
- Result: Local news reporter wants interview about statement

**Event Generated:**
"Your phone rings. The caller ID shows 'Chronicle-Tribune'. It's a reporter."

**Opportunity:**
Player can: answer, ignore, let go to voicemail, answer and decline interview, answer and schedule interview

**World State Impact:**
- If answer: interaction with reporter entity (generate on-demand)
- If ignore: reporter may try again, or may write story without player's input (affects campaign)
- Event logged: reporter contacted player at [timestamp]

**This feels organic because:**
- Event timing makes sense (weekday afternoon, working hours for press)
- Event causally connected to prior action (controversial statement)
- Probability appropriate (not guaranteed, but plausible)
- Player has agency in response
- Consequences flow naturally (ignoring has impact)

---

### 4.9 NPC Agency System

**Purpose:** NPCs exist and act when off-screen. They pursue goals, respond to events, and interact with world independent of player observation.

**Responsibilities:**
- Process NPC responses to interactions (what do they do after talking to player?)
- Queue autonomous actions based on NPC goals and world state
- Use lazy evaluation (resolve when relevant, not real-time simulation of all NPCs)
- Track pending actions with trigger conditions
- Generate retroactive causality that's consistent with world state

**Core Principle:** NPCs have lives. Most of what they do is mundane and never seen by player. Occasionally their actions intersect with player in surprising ways.

**Autonomous Action Types:**

**Information Sharing:**
- Tell someone about interaction with player
- Gossip about player's actions
- Report to authority figure
- Spread rumor

**Goal Pursuit:**
- Continue working toward their own objectives
- Make progress on projects
- Seek resources or allies
- Respond to obstacles

**Relationship Maintenance:**
- Contact friends/family
- Attend social obligations
- Repair/maintain relationships
- Form new connections

**Routine Activities:**
- Go to work
- Run errands
- Eat, sleep, travel
- Hobbies and leisure

**Reactive Behaviors:**
- Respond to world events
- Adjust plans based on new information
- Flee danger
- Celebrate good news

**When NPCs Act Autonomously:**

**Immediately After Player Interaction:**
- High priority: fresh context, clear trigger
- Example: Player tells secretary they're running for office → secretary processes this → decides whether to tell senator

**On World Event:**
- Major event triggers NPC responses
- Example: Scandal breaks → NPCs with connections react

**Pending Action Resolution:**
- When player next encounters NPC or related entity
- When time threshold reached
- When trigger condition met

**Background Activity (Low Priority):**
- NPCs with major engagement level have ongoing lives
- Occasional updates to state (job changes, relationship changes)
- Most background activity never surfaces to player

**Lazy Evaluation Strategy:**

**Don't simulate all NPCs all the time.** That's computationally insane and unnecessary.

**Instead:**

**Mark Pending Actions:**
```
npc_secretary_001 has pending action:
- action_type: tell_someone
- target: npc_senator_001
- content: player's campaign pitch
- trigger: end of workday OR senator becomes relevant to player
- probability: 0.85 (likely but not certain)
```

**Resolve When Relevant:**
```
Player gets meeting with senator three days later

System: Check pending actions related to senator
→ Secretary's pending action found
→ Roll probability: 0.85 → Roll 0.62 → ACTION OCCURRED
→ Generate retroactive: "Secretary told senator on Tuesday evening"
→ Senator's knowledge updated: knows about player's campaign
→ Senator's opinion formed (filtered through secretary's framing)

When player meets senator:
→ Senator already knows who player is
→ "I understand you're running for state legislature. Julia mentioned you called."
```

**Player experiences:** Senator already knows about them (realistic, secretary did her job)

**Behind scenes:** Generated retroactively but consistently with world state

**Engagement Level Affects Autonomy:**

**Background NPCs:**
- Minimal autonomous actions
- Only react if directly affected
- Most actions never surface

**Acquaintance NPCs:**
- Occasional autonomous actions
- Might contact player if relevant
- Basic goal pursuit

**Recurring NPCs:**
- Regular autonomous actions
- Actively pursue goals that may intersect player
- Maintain relationships with player and others

**Major NPCs:**
- Rich autonomous behavior
- Complex goal pursuit
- Interact with player and other NPCs frequently
- Can drive subplots

**Example: Secretary's Autonomous Life**

**Background → Acquaintance (after first call):**
- Autonomous actions: Tells senator about call (pending, high probability)
- Nothing else (not important enough yet)

**Acquaintance → Recurring (after several interactions):**
- Autonomous actions:
  - Tells senator about player (completed)
  - Mentions player to coworker (low priority, might not happen)
  - Thinks about player occasionally (no action, just state)

**Recurring → Major (after coffee meetup, personal connection):**
- Autonomous actions:
  - Actively helps player with senate contact (offers advice)
  - Texts player with relevant information
  - Considers player for her own goals (wants to advance career, sees player as potential connection)
  - Might pursue romantic interest (if player signaled openness)
  - Maintains relationship actively (reaches out periodically)

**Causality Chains:**

NPCs acting autonomously create cascading effects:

```
Player calls Senator's secretary
    ↓
Secretary tells Senator (pending action, resolves Tuesday evening)
    ↓
Senator mentions to colleague Wednesday morning
    ↓
Colleague knows player's opponent (relationship exists in world state)
    ↓
Colleague mentions to opponent (pending action, low probability but possible)
    ↓
Opponent learns about player's campaign before public announcement
```

**Player never sees these conversations. But result:**
- Opponent knows about player earlier than expected
- Opponent can prepare countermoves
- Player might notice opponent seems oddly prepared

**This is emergent conspiracy/telephone game effect.**

**Consistency Requirements:**

**When generating retroactive actions:**
- Must be consistent with NPC's state at the time
- Must be consistent with their relationships
- Must be consistent with their knowledge
- Must be consistent with their goals
- Must follow probability (can't retroactively say "definitely happened" if probability was 10%)

**Example:**
```
Player meets Senator Friday
System resolves: "Did secretary tell senator about player?"

Check:
- Secretary's state Tuesday: busy, but player made good impression
- Secretary's goal: please senator, do her job well
- Senator's state: open to hearing about constituents
- Probability: 85%

Roll: 0.23 → Yes, she told him

Generate when: Tuesday evening, end of workday
Generate how: Brief verbal update, framed player positively
```

**Key Operations:**
- `queue_autonomous_action(npc_id, action_type, target, trigger_condition)` → pending action created
- `resolve_pending_actions(context)` → check triggers, roll probabilities, apply or discard
- `generate_retroactive_action(npc_id, timeframe, action)` → create history-consistent action
- `update_npc_state(npc_id, state_changes)` → reflect autonomous activity

**Integration:**

```
PLAYER INTERACTION ENDS
    ↓
NPC AGENCY SYSTEM
(What does NPC do next?)
    ↓
Queue pending action(s) with triggers
    ↓
[Later: Trigger condition met]
    ↓
Resolve pending action:
- Roll probability
- If occurs: Generate specifics (when, how)
- Update world state
- May create consequences or opportunities
    ↓
WORLD STATE DATABASE updated
    ↓
May affect future player interactions
```

---

### 4.10 Pacing Monitor

**Purpose:** Prevent constant escalation while avoiding stagnation. Maintain natural peaks and valleys in tension without forcing specific events.

**Responsibilities:**
- Track tension/drama levels over time (scene-by-scene or interaction-by-interaction)
- Detect escalation patterns (too many high-stakes events in short period)
- Detect stagnation (player seems disengaged, very low activity)
- Adjust opportunity probability knobs (not force events, just tweak frequencies)
- Maintain healthy variety in tone and stakes

**Critical Constraint:** Does NOT force events. Only adjusts parameters for Opportunity Generator and Ambient Event Generator.

**Tension Tracking:**

**Factors that increase tension:**
- Violence or threat
- Time pressure (deadlines, urgency)
- High-stakes decisions
- Conflict with powerful entities
- Personal jeopardy
- Relationship strain

**Factors that decrease tension:**
- Social connection
- Success at goals
- Safety and comfort
- Routine activities
- Resolution of conflicts
- Time passing peacefully

**Tension Scale (0-10 conceptual):**
- 0-2: Very calm, mundane (player at home, routine day)
- 3-4: Mild interest (minor challenges, social interaction)
- 5-6: Moderate tension (meaningful stakes, some conflict)
- 7-8: High tension (significant threats, time pressure)
- 9-10: Peak tension (immediate danger, crisis)

**Healthy Pacing Pattern:**
- Baseline: 2-4 (mostly calm with mild interest)
- Occasional peaks: 6-8 (drama when it emerges organically)
- Rare spikes: 9-10 (crisis moments, infrequent)
- Recovery periods: back to 2-3 after high tension

**Detection Patterns:**

**Escalation (Problematic):**
```
Scene 1: Tension 4 (mild conflict)
Scene 2: Tension 6 (argument escalates)
Scene 3: Tension 8 (physical confrontation)
Scene 4: Tension 9 (life-threatening)

Pattern: Continuous rise without recovery
```

**Response:**
- Suppress dramatic opportunities for next few scenes
- Increase mundane opportunity weight
- Allow tension to naturally decrease
- Example: After violent confrontation, next scene offers quiet moments (go home, talk with friend, sleep)

**Stagnation (Also Problematic):**
```
Scene 1: Tension 2 (routine)
Scene 2: Tension 2 (routine)
Scene 3: Tension 2 (routine)
Scene 4: Tension 2 (routine)
Scene 5: Tension 2 (routine)

Pattern: No variation, player might be bored
```

**Response:**
- Slightly increase interesting opportunity weight
- Introduce mild complications
- Don't force drama, but offer more hooks
- Example: Phone call from friend with news, minor inconvenience, opportunity to engage with world

**Healthy Rhythm (Goal):**
```
Scene 1: Tension 3 (mild interest)
Scene 2: Tension 5 (meaningful interaction)
Scene 3: Tension 4 (follow-up, calm)
Scene 4: Tension 2 (mundane)
Scene 5: Tension 6 (challenge emerges)
Scene 6: Tension 3 (resolution)
Scene 7: Tension 2 (rest)

Pattern: Natural variation with recovery
```

**Parameter Adjustments:**

**During High Tension Period:**
```
Opportunity Generator adjustments:
- Mundane opportunities: 70% → 80%
- Minor interesting: 20% → 15%
- Significant: 8% → 4%
- Dramatic: 2% → 1%

Ambient Event Generator adjustments:
- Expected/mundane: 90% → 95%
- Minor disruptions: 8% → 4%
- Significant: 1.5% → 0.5%
- Wild cards: 0.5% → 0%
```

**During Stagnation:**
```
Opportunity Generator adjustments:
- Mundane opportunities: 70% → 60%
- Minor interesting: 20% → 28%
- Significant: 8% → 10%
- Dramatic: 2% → 2% (don't increase drama, increase interest)

Ambient Event Generator adjustments:
- Expected/mundane: 90% → 85%
- Minor disruptions: 8% → 13%
- Significant: 1.5% → 2%
- Wild cards: 0.5% → 0% (still no wild cards)
```

**Context-Sensitive Adjustments:**

**Player's explicit goals matter:**
- If player wants mundane life (barmaid in village), tolerate longer stagnation before adjusting
- If player pursuing active goals (political campaign), mild escalation is appropriate

**Player behavior signals:**
- Player actively engaging → system is working, no adjustment needed
- Player repeatedly ignoring opportunities → might be intentional (wanting calm) OR stagnation (need different hooks)
- Player taking high-risk actions → they're seeking tension, don't suppress too aggressively

**Key Operations:**
- `track_scene_tension(scene_events)` → calculate current tension level
- `detect_patterns(tension_history)` → identify escalation or stagnation
- `adjust_opportunity_weights(pattern_detected)` → modify generator parameters
- `reset_to_baseline(trigger_condition)` → return to normal distributions

**Integration:**

```
SCENE COMPLETES
    ↓
PACING MONITOR
- Calculate scene tension
- Add to tension history
- Analyze recent pattern (last 5-10 scenes)
    ↓
Pattern detected?
→ Escalation: adjust generators toward calm
→ Stagnation: adjust generators toward mild interest
→ Healthy rhythm: no adjustment needed
    ↓
Updated parameters sent to:
- OPPORTUNITY GENERATOR
- AMBIENT EVENT GENERATOR
    ↓
Next scene generation uses adjusted weights
```

**Example: Political Campaign Escalation**

```
Week 1: Player announces campaign (Tension 5)
Week 2: First debate, goes well (Tension 6)
Week 3: Opponent launches attack ad (Tension 7)
Week 4: Media questions player about past (Tension 8)
Week 5: Threatening letter received (Tension 9)

Pacing Monitor: ESCALATION DETECTED
Adjustment: Suppress dramatic opportunities next few days

Week 6: Quiet weekend, family time offered (Tension 3)
Week 7: Routine campaign activities (Tension 4)
Week 8: Minor positive development (Tension 5)

Pacing Monitor: Tension normalized, return to baseline parameters
```

**Player experience:** Campaign naturally has peaks and valleys, feels realistic rather than constantly escalating thriller.

---

### 4.11 Scene Narrator

**Purpose:** Present world state and events as prose. Pure presentation layer with no agency over what happens.

**Responsibilities:**
- Convert world state + consequences + opportunities into readable text
- Maintain consistent tone and style appropriate to genre/setting
- Incorporate validated entity references
- Present information from player's perspective
- Make implicit world state explicit (describe what player perceives)

**Critical Constraint:** Narrator CANNOT change world state. It only describes what other systems have determined happened.

**Input:**
- Current world state (location, entities present, player state)
- Selected consequence (what just happened)
- Available opportunities (what player can perceive/act on)
- Recent history (for context and continuity)

**Output:**
- Prose description of scene
- Includes: setting, entities, events, opportunities, player's current state

**Narration Style Considerations:**

**Genre-Appropriate Tone:**
- Mundane Earth: realistic, contemporary, grounded
- High Fantasy: mythic, descriptive, period-appropriate language
- Cyberpunk: tech-heavy, gritty, corporate dystopia
- Urban Fantasy: modern with supernatural undertones

**Perspective:**
- Second person present ("You see...", "You feel...")
- Player's sensory experience and knowledge only
- Cannot reveal information player wouldn't know

**Level of Detail:**
- New location: detailed description
- Familiar location: brief reference unless changed
- New NPC: physical description, initial impression
- Known NPC: name, current state, relationship reminder if relevant

**Efficiency:**
- Don't repeat information player already knows
- Focus on what's changed or newly relevant
- Balance atmosphere with actionable information

**Example Narration Process:**

**Input to Narrator:**
```
Location: The Dirty Ditch (bar in Seattle)
Time: 9:30 PM, Friday
Player state: Tired from campaigning, hungry, moderately stressed
Entities present:
- npc_bartender_001 (Marcus, acquaintance, neutral toward player)
- npc_patron_023 (background, drunk, not engaged)
- npc_patron_024 (background, quiet, reading)
Consequence: Player entered bar (no complications)
Opportunities available:
- Approach Marcus for conversation
- Sit at bar and order food
- Notice patron reading unusual book
Recent event: Player just finished contentious campaign event
```

**Generated Narration:**
```
You push through the door of The Dirty Ditch, the familiar smell of beer and fried food hitting you immediately. It's a typical Friday night—a few regulars scattered around the dim space. Marcus is behind the bar, wiping down glasses. He gives you a brief nod of recognition.

Your feet ache from standing at that campaign event all afternoon, and your stomach reminds you that you skipped dinner. The bar stools look inviting.

In the corner booth, someone sits alone with a book that looks oddly out of place in a dive bar like this—old, leather-bound, pages yellowed. They seem absorbed in it.
```

**Analysis:**
- Sets scene (The Dirty Ditch, physical details)
- Establishes entities (Marcus, patrons)
- Reflects player state (tired, hungry, stressed from campaign)
- Presents opportunities without forcing:
  - Can talk to Marcus
  - Can order food
  - Can investigate mysterious book
  - Can do something else entirely (leave, sit quietly, etc.)

**Entity Reference Validation:**

Before presenting narration:
- All entities mentioned must exist in world state
- Descriptions must match entity records
- No hallucinated details that contradict established facts

**If Validation Fails:**
- Regenerate narration (max 2 attempts)
- If still invalid: sanitize (remove problematic references)
- Ensure player isn't blocked from progressing

**Continuity Maintenance:**

**Narrator has access to:**
- Entity history summaries (for relationship context)
- Recent events (for causality)
- Player's knowledge (what they've learned)
- Established facts (prevent contradiction)

**Example: Returning to Previously Visited Location**
```
First visit: "You enter The Dirty Ditch for the first time. It's exactly as Alex described—a cramped space with scarred wooden tables, neon beer signs flickering on the walls, and the persistent smell of cigarette smoke despite the city-wide ban. A handful of people nurse drinks in the dim light."

Second visit: "You're back at The Dirty Ditch. Marcus is behind the bar again, and tonight the place is busier than last time—nearly every stool is taken."

(No need to redescribe everything, just what's changed and contextually relevant)
```

**Handling Ambiguity:**

If world state is unclear or consequence has multiple interpretations:
- Narrator makes reasonable inference based on context
- Avoids absolute statements when uncertain
- Example: "Marcus seems distracted tonight" (impression) vs "Marcus is thinking about his ex" (internal state narrator can't know)

**Key Operations:**
- `generate_scene_description(world_state, scene_context)` → prose text
- `incorporate_consequence(consequence, previous_narration)` → updated prose
- `present_opportunities(opportunity_list, scene_context)` → woven into description
- `validate_narration_entities(narration_text)` → ensure all references valid

**Integration:**

```
WORLD STATE UPDATED
    ↓
OPPORTUNITY GENERATOR
(what hooks are available)
    ↓
PACING MONITOR
(tension level, tone adjustment)
    ↓
SCENE NARRATOR
- Query world state for current scene
- Incorporate consequences
- Weave in opportunities
- Generate prose
    ↓
ENTITY VALIDATOR (soft validation)
    ↓
PRESENT TO PLAYER
```

---

## 5. DATA MODEL

### 5.1 Entity Structure

**Purpose:** Universal structure for all things that exist in the world (people, objects, creatures, organizations, locations).

**Design Approach: Discriminated Union by Entity Type**

Different entity types require different fields:
- **Sentient entities** (player, npc, creature) have psychology, goals, relationships, memory, interaction tracking
- **Objects** have physical properties and location
- **Locations** have atmosphere, features, and type classification

This prevents null pollution and ensures LLMs see only relevant context when generating content or making decisions. The `entity_type` field acts as a discriminator, determining which fields are applicable.

**Field Organization:**
- **Common Fields** (all entities): entity_id, entity_type, name
- **Type-Specific Fields**: See subsections below for each entity type

---

### 5.1.1 Common Fields (All Entity Types)

```
entity_id: string
    Format: [type]_[descriptor]_[number]
    Example: npc_marcus_001, obj_gun_023, loc_bar_005
    Unique identifier, never reused

entity_type: enum
    Values: player, npc, creature, object, location
    Determines which fields apply to this entity

name: string
    Proper name or descriptor
    Example: "Marcus Webb", "The Dirty Ditch", "leather wallet"

---

### 5.1.2 Sentient Entity Fields (player, npc, creature)

These fields apply to entities with agency, psychology, and the ability to act autonomously in the world.

**is_player Indicator:**

```
is_player: boolean
    True only for player character
    Triggers special handling (no autonomous actions, perspective source)
```

---

**Physical Presence:**

```
current_location: string (entity_id of location) or null
    Where entity currently exists
    Null for abstract entities that don't have physical presence

inventory: array of entity_ids or null
    What entity carries/contains
    References other entities by ID
    Null if entity cannot contain things

health_status: string or null
    Current physical and medical condition
    Examples: "healthy", "injured", "exhausted", "unconscious", "dying"
    Describes physical health and well-being
    Distinct from emotional/mental state (see 'state' field)
```

---

**Capabilities & Limitations:**

```
capabilities: object or null
    Skills and abilities in narrative terms with mechanical backing
    Key-value pairs: capability_name: proficiency_level
    
    Proficiency levels:
        "untrained" (0-1): no real ability
        "basic" (2-3): rudimentary knowledge
        "competent" (4-5): functional skill
        "proficient" (6-7): experienced
        "expert" (8-9): highly skilled
        "master" (10): world-class
    
    Sparse listing principle - only include:
        - Capabilities above baseline (expert researcher, proficient hacker)
        - Capabilities below baseline (poor driver, impaired mobility)
        - Plot-relevant capabilities (lockpicking for thief character)
    
    Default assumptions when capability not listed:
        Baseline competencies (normal adult in setting):
            Modern: driving, basic_technology, social_skills, reading_writing = "competent" or "basic"
            Fantasy: horseback_riding, basic_weapon_awareness, fire_starting = "competent" or "basic"
        
        Specialized skills (require training):
            lockpicking, firearms, advanced_medical, hacking, piloting, explosives, 
            martial_arts, occult_knowledge = "untrained"
        
        Physical capabilities:
            Assume average human for age/build unless stated otherwise
    
    Examples:
        Library assistant: {"research": "expert", "computers": "proficient"}
        Retired Marine: {"firearms": "expert", "combat": "expert", "tactics": "proficient"}
        Elderly with arthritis: {"fine_motor_control": "impaired", "historical_knowledge": "expert"}
    
    Used by:
        - Consistency Enforcer: check prerequisites for actions
        - Consequence Engine: guide probability distributions
        - LLM prompts: provide context for realistic outcomes

constraints: array of strings or null
    What entity CANNOT do or limitations on capabilities
    Examples: ["requires_ammunition", "fear_of_heights", "illegal_in_jurisdiction", 
              "needs_power", "injured_leg_limits_mobility"]
    Used by Consistency Enforcer to validate actions
```

---

**Psychology/Motivation:**

```
traits: object or null
    Personality, appearance, notable features
    Example: {
        "personality": "cautious, ambitious, loyal",
        "appearance": "short, glasses, professional dress",
        "background": "worked way up from poverty"
    }

goals: array of strings or null
    Active desires/objectives
    Examples: ["get_promotion", "protect_family", "find_truth_about_father"]
    Can be vague, specific, short-term, or long-term
    Drives NPC autonomous actions

state: string or null
    Current emotional/mental state
    Examples: "angry", "content", "distracted", "grieving", "excited"
    Affects interaction responses and decision-making
```

---

**Social/Relational:**

```
relationships: array of relationship_ids or null
    Links to Relationship entities
    References relationships with other entities

reputation: string or null
    How entity is generally perceived
    Examples: "known as reliable fixer", "respected journalist", "shady dealer"
    Can be location-specific or faction-specific

faction_memberships: array of organization entity_ids or null
    Groups/organizations entity belongs to
    Examples: [org_police_001, org_veterans_association_012]
```

---

**Knowledge & Memory:**

```
knowledge: array of strings or null
    Facts this entity knows
    Examples: ["mayor_is_corrupt", "player_is_running_for_office", "secret_tunnel_under_city_hall"]
    Represents provably true information in world state
    Used to determine what entity can act upon

beliefs: array of strings or null
    Things entity thinks are true (might be wrong)
    Examples: ["player_is_trustworthy", "government_caused_the_fire", "luck_is_real"]
    Distinguished from knowledge (which is verifiable in world state)
    Shapes entity behavior even if beliefs are false

memories: array of strings or null
    Significant past experiences from BEFORE gameplay started
    Examples: ["witnessed_father_murder", "won_state_championship", "survived_car_crash"]
    Pre-game backstory and formative experiences
    Shape personality, emotional reactions, and decision-making
    Set during character creation, rarely changes during play

event_knowledge: array of objects or string or null
    Record of all events this entity knows about (participated in, witnessed, or learned about)
    
    For NPCs/creatures/sentient entities:
    Array of event knowledge records:
    [
        {
            event_id: "event_001",
            awareness: "participated",  // How entity learned about event
            impression: "traumatized, fears player now",  // Entity's reaction/opinion
            learned_turn: 1  // When entity learned about it
        },
        {
            event_id: "event_047",
            awareness: "witnessed_firsthand",
            impression: "concerned about escalating conflict",
            learned_turn: 47
        },
        {
            event_id: "event_103",
            awareness: "heard_gossip",
            impression: "thinks player is dangerous but respects it",
            learned_turn: 162  // Learned later through gossip
        }
    ]
    
    For player character:
    String value: "ALL"
    (Player knows about every event by definition, no need to duplicate entire event log)
    
    **CRITICAL: Player entities do NOT participate in event_knowledge queries.**
    When assembling context for NPCs or querying "who knows about event X", explicitly 
    exclude the player entity. Player knowledge is implicit (all events) and tracked 
    through the UI, not through event_knowledge queries.
    
    Awareness types:
        - "participated": directly involved in the event
        - "witnessed_firsthand": observed the event in person
        - "told_by_friend": learned from trusted source
        - "heard_gossip": learned through rumor network
        - "saw_news": learned from media/official channels
        - "inferred": deduced from other information
    
    Updated automatically when events are logged (Section 7.3)
    Empty array [] for newly created entities
    
    Used for:
        - LLM context (what entity knows and how they feel about it)
        - Relationship evolution (shared history and perspectives)
        - Continuity checking (what entity can reference)
        - NPC autonomous action generation (responding to known events)
```

---

**Interaction Tracking:**

```
simulation_mode: enum
    Values: passive, active_tracking
    Default: passive
    
    passive: Standard behavior. Entity is resolved lazily/retroactively when encountered by player.
             Used for most NPCs who have their own lives but aren't currently plot-critical.
    
    active_tracking: Entity is added to the Active Simulation Loop. Evaluated every turn for 
                    movement/intent regardless of player location. Used for immediate threats, 
                    active companions, hunters, or NPCs with time-sensitive goals that may 
                    intersect with player.
    
    Determines NPC Agency System processing frequency (see Section 4.9, Section 9.6)
    Most entities remain 'passive' - only promote to 'active_tracking' when necessary

engagement_level: enum
    Values: background, acquaintance, recurring, major
    Tracks depth of player interaction
    Determines detail generation and autonomous action frequency
    Default: background for all new entities
    
    Progression:
        background (0 interactions): minimal detail, rarely acts autonomously
        acquaintance (1-3 interactions): basic personality, remembers player
        recurring (4-10 interactions): developed character, active goals
        major (10+ interactions): fully realized, can drive subplots

last_interaction_timestamp: ISO timestamp or null
    When entity last interacted with player
    Used for relationship decay and archival decisions

interaction_count: number
    Total interactions with player
    Triggers engagement level promotions at thresholds (3, 7, 15)
    Default: 0 for new entities

history_summary: string or null
    Condensed narrative of entity's significance
    Examples: 
        "Your childhood friend who became a lawyer. Haven't spoken in 3 years but recently reconnected."
        "Senator's secretary who helped you schedule meeting. Professional but warming to you."
    Used for LLM context to maintain continuity
    Becomes richer as engagement level increases
    Null for background entities with no history
```

---

**Meta/System:**

```
generated_depth: enum
    Values: minimal, basic, detailed, full
    Tracks how much detail has been generated for this entity
    Correlates with engagement_level but can be set independently
    Guides future generation (don't regenerate what's already detailed)
    
    minimal: name, role, basic descriptor only
    basic: personality sketch, appearance, current state
    detailed: background elements, motivations, relationships
    full: rich history, complex personality, detailed backstory

generation_context: string
    Why/how entity was created
    Examples: 
        "Generated when player called Senator's office"
        "Player-declared friend from character creation"
        "Created by Ambient Event Generator (random encounter)"
        "Mentioned by NPC Marcus during conversation"
    Useful for debugging, continuity checks, and understanding entity origins

autonomous_action_frequency: enum
    Values: never, low, medium, high
    How often entity takes actions independently of player
    
    never: objects, player character, inactive entities
    low: background NPCs, rarely relevant to player
    medium: recurring NPCs with own lives and goals
    high: major NPCs actively pursuing goals that may intersect with player
    
    Used by NPC Agency System to determine when to generate autonomous actions
```

---

### 5.1.3 Object Entity Fields

Objects represent inanimate items in the world. They have physical properties but no psychology, memory, or agency.

**Required Fields:**

```
entity_id: string
    Format: obj_[descriptor]_[number]
    Example: obj_wallet_001, obj_revolver_023, obj_phone_007

entity_type: "object"
    Always set to "object" for this entity type

name: string
    Descriptor of the object
    Examples: "leather wallet", "revolver", "smartphone"
```

---

**Physical Properties:**

```
current_location: string (entity_id of location)
    Where object currently exists
    Required - all objects must be somewhere
    
    **CRITICAL LOCATION RULE:**
    - If is_held_by == null: current_location is AUTHORITATIVE (object is at this location)
    - If is_held_by != null: current_location is DERIVED/IGNORED (object's true location is holder's location)
    
    This prevents synchronization nightmares when moving entities with inventory.
    When an entity moves, only the entity's current_location needs updating.
    Objects held by that entity automatically inherit the new location.
    
is_held_by: string (entity_id) or null
    The ID of the sentient entity currently holding/possessing this object
    Used to validate theft attempts, "give" actions, or possession checks
    
    **If null:** Object is free/on the ground at `current_location`
    **If set:** Object is in that entity's inventory
                Object's `current_location` field is IGNORED (can be stale)
                Object's true location is derived from holder's current_location
    
    Example: obj_wallet_001.is_held_by = "npc_marcus_001" means Marcus is holding the wallet
             The wallet's location is wherever Marcus is, regardless of wallet's current_location value
    
physical_state: enum
    Values: movable, fixed, too_heavy, hidden
    Used to validate "Pick up", "Move", or interaction actions during Pre-Action Validation
    
    - movable: Can be added to inventory normally (default for portable items)
    - fixed: Attached to the location (e.g., a bolted safe, statue, wall-mounted painting)
    - too_heavy: Requires strength check or multiple actors (e.g., furniture, heavy crates)
    - hidden: Requires "Observe" check or specific knowledge to become interactable
    
    Default: movable for objects generated as portable items
    Supports Pre-Action Validation preventing impossible actions (Section 8, STEP 3.5)
    
condition: string
    Current physical condition
    Examples: "broken", "locked", "depleted", "worn", "pristine", "wet"
    Describes state of repair, functionality, and physical integrity
    
inventory: array of entity_ids or null
    What object contains (if it's a container)
    Examples: wallet contains ["obj_cash_50_001", "obj_drivers_license_001"]
              backpack contains ["obj_notebook_001", "obj_pen_002"]
    Null if object cannot contain things
```

---

**Query Logic for Object Location:**

When querying "what objects are at location X", the system must check BOTH fields with proper precedence:

```python
def get_objects_at_location(location_id):
    """Get all objects at a location (including held objects)"""
    objects = []
    
    # Objects directly at location (not held by anyone)
    for obj in all_objects:
        if obj.is_held_by is None and obj.current_location == location_id:
            objects.append(obj)
    
    # Objects held by entities at this location
    entities_here = get_entities_at_location(location_id)
    for entity in entities_here:
        for obj in all_objects:
            if obj.is_held_by == entity.entity_id:
                objects.append(obj)
    
    return objects
```

**Implementation Notes:**
- When moving an entity with inventory, only update the entity's `current_location`
- Object's `current_location` can be lazily updated or left stale (it's ignored when `is_held_by` is set)
- Queries must always check both fields with proper precedence (is_held_by takes priority)
- This prevents synchronization nightmares and ensures atomic moves

---

**Optional Context:**

```
description: string or null
    Narrative details about the object
    Examples: "An ornate silver pocket watch with strange engravings"
              "A well-worn leather jacket with patches from various bars"
    
constraints: array of strings or null
    Limitations on object use
    Examples: ["requires_ammunition", "needs_power", "illegal_in_jurisdiction", 
              "one_time_use", "fragile"]
```

**Note:** Objects do NOT have:
- Psychology fields (traits, goals, state, beliefs, memories)
- Social fields (relationships, reputation, faction_memberships, knowledge)
- Health status (they have condition, which describes physical state of the object)
- Interaction tracking (engagement_level, interaction_count, last_interaction_timestamp, history_summary, generated_depth, generation_context)
- Autonomous action capability (autonomous_action_frequency always "never" implicitly)
- is_player field (objects are never the player)

---

### 5.1.4 Location Entity Fields

Locations represent places in the world where entities exist and events occur. They describe physical spaces and their atmosphere.

**Required Fields:**

```
entity_id: string
    Format: loc_[descriptor]_[number]
    Example: loc_bar_001, loc_senator_office_023, loc_apartment_007

entity_type: "location"
    Always set to "location" for this entity type

name: string
    Name or descriptor of the location
    Examples: "The Dirty Ditch", "Senator Johnson's Office", "Hannah's Apartment"
```

---

**Location Properties:**

```
type: string
    Category/classification of location
    Examples: "bar", "office", "street", "apartment", "warehouse", "park", 
              "restaurant", "alley", "government_building"
    Used for context and understanding appropriate behavior/atmosphere

parent_location: string (entity_id) or null
    The location that contains this location
    Examples: "loc_dirty_ditch_bathroom_001" has parent "loc_dirty_ditch_001"
              "loc_dirty_ditch_001" has parent "loc_downtown_seattle_001"
              "loc_planet_earth_001" has parent null (top of hierarchy)
    Enables location hierarchy and spatial relationships
    
contained_locations: array of entity_ids or null
    Locations that exist within this location
    Examples: bar contains ["loc_dirty_ditch_bathroom_001", "loc_dirty_ditch_back_room_001"]
              city contains ["loc_dirty_ditch_001", "loc_city_hall_001", ...]
    Empty array [] if location contains no sub-locations

exits: object or null
    Map of directions/exits to target locations and their status
    Used by Pre-Action Validation (STEP 3.5) to determine if movement is possible
    
    Format: { 
      "direction_name": { 
        "target_id": "loc_id", 
        "type": "door" | "open" | "passage" | "window" | "stairs" | "secret",
        "locked": boolean,
        "hidden": boolean (optional, for secret passages)
      } 
    }
    
    Examples:
    {
      "north": { 
        "target_id": "loc_hallway_01", 
        "type": "door", 
        "locked": false 
      },
      "window": { 
        "target_id": "loc_alley_01", 
        "type": "window", 
        "locked": true 
      },
      "trapdoor": {
        "target_id": "loc_basement_01",
        "type": "secret",
        "locked": false,
        "hidden": true
      }
    }
    
    Direction names can be:
    - Cardinal: "north", "south", "east", "west"
    - Vertical: "up", "down", "stairs"
    - Specific: "door", "window", "hallway", "alley", "street"
    - Named: "to_bar", "to_bathroom", "main_entrance"
    
    Null if location has no defined exits (abstract locations, or exits handled narratively)
    
atmosphere: string
    Current environmental condition and ambiance
    Describes what it's like to be there right now
    Examples: "crowded (~20 patrons), dim lighting, moderate noise"
              "empty, fluorescent lights flickering, smells of cleaning products"
              "sunny, light traffic, pedestrians walking dogs"
              "ransacked, broken furniture, papers scattered everywhere"
    Combines physical environment, lighting, sound, smell, crowd level, mood
```

---

**Optional Context:**

```
notable_features: string or null
    Special characteristics or important elements
    Examples: "bouncer_present", "security_cameras", "hidden_back_entrance",
              "pool_table_in_back", "jukebox_playing_80s_rock"
    
description: string or null
    Detailed narrative description
    Examples: "A dive bar with sticky floors and questionable clientele"
              "A modern office with floor-to-ceiling windows overlooking the city"
```

**Note:** Locations do NOT have:
- Direct physical presence (they ARE the place, not IN a place - though they may have parent_location)
- Health/condition in the sentient sense (they have atmosphere but it means environment, not health)
- Psychology fields (traits, goals, state, beliefs, memories)
- Social fields (relationships, reputation, faction_memberships)
- Knowledge (locations don't know things - entities IN locations do)
- Capabilities or constraints in the sentient sense
- Interaction tracking (engagement_level, interaction_count, etc.)
- is_player field (locations are never the player)

---

**Usage Notes:**

**Usage Notes:**

**Sparse Data Principle:**
- Only populate fields relevant to entity type and current engagement
- Sentient entities: Start minimal (background NPCs), add detail through interaction
  - Background NPCs: minimal fields (name, role, location, basic traits)
  - Major NPCs: rich detail across all applicable sentient fields
- Objects: Only physical properties and optional description/constraints
- Locations: Type, state, and notable features - no psychology or agency

**Progressive Detail Generation:**
- Sentient entities start minimal and gain detail through player interaction
- Engagement level increases → generated_depth increases → more fields populated
- Don't front-load unnecessary detail for entities player may never engage with
- Objects and locations are typically generated with their full (minimal) schema immediately

**Null vs. Empty:**
- null: field doesn't exist for this entity (e.g., objects don't have psychology fields at all)
- [] or "": field exists for this entity type but is currently empty (e.g., new NPC with no relationships yet)
- For type-specific fields: consult sections 5.1.2 (Sentient), 5.1.3 (Object), 5.1.4 (Location) to see which fields apply

---

### 5.1.5 Entity Examples

**Background NPC (First Mention):**
```json
{
    "entity_id": "npc_secretary_001",
    "entity_type": "npc",
    "name": "Julia Martinez",
    "is_player": false,
    "current_location": "loc_senator_office_001",
    "inventory": null,
    "health_status": "healthy",
    "capabilities": {"office_admin": "proficient"},
    "constraints": null,
    "traits": {"role": "Senator's secretary", "personality": "professional, efficient"},
    "goals": null,
    "state": "busy",
    "relationships": [],
    "reputation": null,
    "faction_memberships": null,
    "knowledge": ["senator_schedule", "office_procedures"],
    "beliefs": null,
    "memories": null,
    "event_knowledge": [],
    "engagement_level": "background",
    "last_interaction_timestamp": null,
    "interaction_count": 0,
    "history_summary": null,
    "generated_depth": "minimal",
    "generation_context": "Generated when player called Senator's office",
    "autonomous_action_frequency": "low"
}
```

**Player Character:**
```json
{
    "entity_id": "player_001",
    "entity_type": "player",
    "name": "Hannah LeClerc",
    "is_player": true,
    "current_location": "loc_interview_room_001",
    "inventory": ["obj_phone_001", "obj_resume_001"],
    "health_status": "healthy, nervous",
    "capabilities": {
        "research": "expert",
        "computers": "proficient",
        "persuasion": "competent"
    },
    "constraints": ["no_combat_training", "limited_budget"],
    "traits": {
        "personality": "intelligent, modest, self-aware",
        "appearance": "pretty in the right light, glasses, casual professional",
        "background": "library assistant, 23 years old"
    },
    "goals": ["join_monster_maidens", "prove_myself", "investigate_cryptids"],
    "state": "nervous but hopeful",
    "relationships": [],
    "reputation": null,
    "faction_memberships": [],
    "knowledge": ["monica_in_coma", "monster_maidens_investigate_cryptids"],
    "beliefs": ["cryptids_probably_not_real", "i_can_be_pretty"],
    "memories": [],
    "event_knowledge": "ALL",
    "engagement_level": "major",
    "last_interaction_timestamp": null,
    "interaction_count": 0,
    "history_summary": "Library assistant interviewing to join Monster Maidens cryptid investigation group",
    "generated_depth": "full",
    "generation_context": "Player character from initial prompt",
    "autonomous_action_frequency": "never"
}
```

**Simple Object:**
```json
{
    "entity_id": "obj_wallet_001",
    "entity_type": "object",
    "name": "leather wallet",
    "current_location": "loc_bar_floor_001",
    "is_held_by": null,
    "physical_state": "movable",
    "condition": "worn, slightly damp",
    "inventory": ["obj_cash_50_001", "obj_drivers_license_001"],
    "description": "Brown leather bifold, well-worn around the edges",
    "constraints": null
}
```

**Location Example:**
```json
{
    "entity_id": "loc_dirty_ditch_001",
    "entity_type": "location",
    "name": "The Dirty Ditch",
    "type": "bar",
    "parent_location": "loc_downtown_seattle_001",
    "contained_locations": ["loc_dirty_ditch_bathroom_001", "loc_dirty_ditch_back_room_001"],
    "exits": {
        "front_door": {
            "target_id": "loc_downtown_street_001",
            "type": "door",
            "locked": false
        },
        "bathroom": {
            "target_id": "loc_dirty_ditch_bathroom_001",
            "type": "door",
            "locked": false
        },
        "back_room": {
            "target_id": "loc_dirty_ditch_back_room_001",
            "type": "door",
            "locked": true
        }
    },
    "atmosphere": "crowded (~20 patrons), dim lighting, moderate noise level",
    "notable_features": "bouncer_present, pool_table_in_back, jukebox_playing_80s_rock",
    "description": "A dive bar with sticky floors, faded band posters, and the permanent smell of spilled beer and cigarettes"
}
```

---

### 5.1.6 TypeScript Implementation

The entity schema is implemented as a discriminated union in TypeScript, providing compile-time type safety and clear separation between entity types.

**Discriminated Union Type Definition:**

```typescript
// Event knowledge record type
type EventKnowledge = {
  event_id: string;
  awareness: 'witnessed_firsthand' | 'participated' | 'told_by_friend' | 'heard_gossip' | 'saw_news' | 'inferred';
  impression: string;
  learned_turn: number;
};

// Sentient-specific fields (player, npc, creature)
type SentientFields = {
  is_player: boolean;
  current_location: string | null;
  inventory: string[] | null;
  health_status: string | null;
  capabilities: Record<string, string> | null;
  constraints: string[] | null;
  traits: Record<string, string> | null;
  goals: string[] | null;
  state: string | null;
  relationships: string[] | null;
  reputation: string | null;
  faction_memberships: string[] | null;
  knowledge: string[] | null;
  beliefs: string[] | null;
  memories: string[] | null;
  event_knowledge: EventKnowledge[] | "ALL" | null;
  simulation_mode: 'passive' | 'active_tracking';
  engagement_level: 'background' | 'acquaintance' | 'recurring' | 'major';
  last_interaction_timestamp: string | null;
  interaction_count: number;
  history_summary: string | null;
  generated_depth: 'minimal' | 'basic' | 'detailed' | 'full';
  generation_context: string;
  autonomous_action_frequency: 'never' | 'low' | 'medium' | 'high';
};

// Object-specific fields
type ObjectFields = {
  current_location: string;
  is_held_by: string | null;
  physical_state: 'movable' | 'fixed' | 'too_heavy' | 'hidden';
  condition: string;
  inventory: string[] | null;
  description: string | null;
  constraints: string[] | null;
};

// Location-specific fields
type LocationFields = {
  type: string;
  parent_location: string | null;
  contained_locations: string[] | null;
  exits: Record<string, {
    target_id: string;
    type: 'door' | 'open' | 'passage' | 'window' | 'stairs' | 'secret';
    locked: boolean;
    hidden?: boolean;
  }> | null;
  atmosphere: string;
  notable_features: string | null;
  description: string | null;
};

// Discriminated union - single Entity type
type Entity =
  | ({ entity_id: string; entity_type: 'player' | 'npc' | 'creature'; name: string } & SentientFields)
  | ({ entity_id: string; entity_type: 'object'; name: string } & ObjectFields)
  | ({ entity_id: string; entity_type: 'location'; name: string } & LocationFields);
```

**Type Safety Example:**

```typescript
function processEntity(entity: Entity) {
  if (entity.entity_type === 'player' || entity.entity_type === 'npc' || entity.entity_type === 'creature') {
    // TypeScript knows sentient fields exist here
    console.log(entity.goals);  // ✅ OK
    console.log(entity.engagement_level);  // ✅ OK
    console.log(entity.health_status);  // ✅ OK
    // console.log(entity.type);  // ❌ Compile error
  }
  
  if (entity.entity_type === 'location') {
    // TypeScript knows location fields exist here
    console.log(entity.type);  // ✅ OK
    console.log(entity.atmosphere);  // ✅ OK
    console.log(entity.parent_location);  // ✅ OK
    // console.log(entity.goals);  // ❌ Compile error
  }
  
  if (entity.entity_type === 'object') {
    // TypeScript knows object fields exist here
    console.log(entity.condition);  // ✅ OK
    // console.log(entity.goals);  // ❌ Compile error
    // console.log(entity.type);  // ❌ Compile error
  }
}
```

**Database Schema (Hybrid Approach):**

```sql
-- Hybrid: indexed columns for common queries + JSON for type-specific flexibility
CREATE TABLE entities (
  entity_id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  name TEXT NOT NULL,
  current_location TEXT,  -- indexed for "entities at location" queries
  data TEXT NOT NULL  -- complete entity as type-specific JSON
);

-- Indices for common queries
CREATE INDEX idx_entity_type ON entities(entity_type);
CREATE INDEX idx_current_location ON entities(current_location);
```

**Database Operations:**

```typescript
import Database from 'better-sqlite3';

const db = new Database('game.db');

// Load entity from database
function loadEntity(entityId: string): Entity {
  const row = db.prepare('SELECT * FROM entities WHERE entity_id = ?').get(entityId);
  if (!row) throw new Error(`Entity ${entityId} not found`);
  
  const entity = JSON.parse(row.data);
  return entity;  // TypeScript knows this is discriminated union
}

// Save entity to database
function saveEntity(entity: Entity): void {
  db.prepare(`
    INSERT OR REPLACE INTO entities (entity_id, entity_type, name, current_location, data)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    entity.entity_id,
    entity.entity_type,
    entity.name,
    'current_location' in entity ? entity.current_location : null,
    JSON.stringify(entity)
  );
}

// Common queries
function getEntitiesAtLocation(locationId: string): Entity[] {
  const rows = db.prepare('SELECT * FROM entities WHERE current_location = ?').all(locationId);
  return rows.map(row => JSON.parse(row.data));
}

function getEntitiesByType(type: string): Entity[] {
  const rows = db.prepare('SELECT * FROM entities WHERE entity_type = ?').all(type);
  return rows.map(row => JSON.parse(row.data));
}
```

**LLM Serialization (For Prompts):**

When sending entities to LLM for context, serialize only relevant fields:

```typescript
function serializeForLLM(entity: Entity): Record<string, any> {
  // TypeScript narrows the type automatically based on entity_type
  switch (entity.entity_type) {
    case 'player':
    case 'npc':
    case 'creature':
      // Include all sentient fields (filter nulls if desired)
      return entity;
      
    case 'object':
      // Only include object fields
      return {
        entity_id: entity.entity_id,
        entity_type: entity.entity_type,
        name: entity.name,
        current_location: entity.current_location,
        condition: entity.condition,
        inventory: entity.inventory,
        description: entity.description,
        constraints: entity.constraints
      };
      
    case 'location':
      // Only include location fields
      return {
        entity_id: entity.entity_id,
        entity_type: entity.entity_type,
        name: entity.name,
        type: entity.type,
        parent_location: entity.parent_location,
        contained_locations: entity.contained_locations,
        atmosphere: entity.atmosphere,
        notable_features: entity.notable_features,
        description: entity.description
      };
  }
}
```

**Benefits of This Approach:**

1. **Type Safety:** TypeScript prevents accessing fields that don't exist on an entity type at compile-time
2. **Clean LLM Prompts:** Each entity type sees only ~5-15 relevant fields instead of 25+ fields with many nulls
3. **Token Efficiency:** Sending only relevant fields to LLM reduces token usage
4. **Maintainability:** Single source of truth for type definitions
5. **Database Efficiency:** Hybrid approach provides both fast indexed queries and flexible JSON storage
6. **No Null Pollution:** Fields either exist for a type or they don't - no confusing null values
7. **Clear Generation:** LLM entity generation prompts can be type-specific and focused

For complete implementation details, see `typescript_entity_structure.md`.

---

### 5.2 Relationship Structure

**Purpose:** Track connections between entities with history and qualitative strength.

```
relationship_id: string
    Unique identifier

entity_a_id: string (entity_id)
    First entity in relationship

entity_b_id: string (entity_id)
    Second entity in relationship
    (relationships can be asymmetric: A likes B doesn't mean B likes A)

type: string
    Nature of relationship
    Examples: "friends", "enemies", "romantic_partners", "employer_employee", "parent_child", "owes_debt_to", "blackmailing"

strength: string
    Qualitative descriptor of relationship intensity and valence
    Examples: "very_positive", "positive", "neutral", "strained", "hostile", "deeply_bonded", "casual_acquaintance"
    Should capture both intensity (how strong) and valence (positive/negative/neutral)
    LLM generates these descriptors, system stores them as-is
    No numeric conversion needed - qualitative descriptors provide sufficient context

history: array of strings
    Key events that shaped relationship
    Examples: ["met_at_college", "A_saved_B's_life", "B_betrayed_A's_trust"]
    Chronologically ordered

last_interaction: object
    {
        timestamp: ISO timestamp,
        type: "conversation", "conflict", "collaboration", etc.,
        outcome: "positive", "negative", "neutral",
        summary: "brief description"
    }

metadata: object (optional)
    Additional context-specific info
    Examples: {"years_known": 8, "mutual_friends": [entity_ids], "secret_known_by_both": "fact_id"}
```

### 5.3 Event Structure

**Purpose:** Complete timeline of everything that has happened.

```
event_id: string
    Unique identifier

timestamp: ISO timestamp
    When event occurred in world time

type: enum
    Values: player_action, npc_action, ambient_event, consequence, world_event
    Categorizes for querying

participants: array of entity_ids
    Who was involved

location: entity_id
    Where it happened

description: string
    What occurred
    Example: "Player shot at Marcus, Marcus dodged and fled the scene"

consequences: array of strings
    What changed as result
    Examples: ["marcus_state_changed_to_afraid", "marcus_location_changed", "relationship_player_marcus_became_hostile"]

visibility: object
    Who knows about this event
    {
        public: boolean (is this public knowledge?),
        known_by: array of entity_ids,
        witnessed_by: array of entity_ids,
        reported_by: array of entity_ids
    }

tags: array of strings
    For filtering/querying
    Examples: ["violence", "political", "social", "campaign_related"]
```

### 5.4 Opportunity Structure

**Purpose:** Hooks available to player.

```
opportunity_id: string
    Unique identifier

type: enum
    Values: conversation_snippet, noticed_object, person_approaches, location_available, information_available, social_invitation

description: string
    What player perceives
    Example: "You overhear two people discussing a shipment arriving tonight"

source: object
    What generated this
    {
        source_type: "npc_action", "ambient_event", "location_property", etc.,
        source_id: entity_id or event_id
    }

related_entities: array of entity_ids
    Who/what is involved

expiry_condition: object
    When opportunity is no longer available
    {
        type: "time_based", "action_based", "context_based", "persistent",
        details: "specific_time" or "entity_leaves" or "conversation_ends" or null
    }

engagement_status: enum
    Values: available, pursuing, resolved, expired
    Tracks lifecycle

created_timestamp: ISO timestamp

expires_timestamp: ISO timestamp or null
```

### 5.5 Pending Action Structure

**Purpose:** NPC autonomous actions not yet resolved.

```
action_id: string
    Unique identifier

npc_id: entity_id
    NPC taking this action

action_type: enum
    Values: tell_someone, pursue_goal, change_state, move_location, contact_player, react_to_event

target: entity_id or string
    Who/what is affected

probability_of_occurrence: number (0.0 to 1.0)
    Likelihood this action actually happens
    Rolled when trigger condition met

context: string
    Why NPC is doing this
    Example: "Player impressed secretary, she wants to help by informing senator"

trigger_condition: object
    When to resolve this action
    {
        type: "time_threshold", "entity_proximity", "explicit_query", "immediate",
        details: timestamp or entity_id or null
    }

created_timestamp: ISO timestamp

related_event_id: event_id
    What prompted this action
```

### 5.6 Player Structure

**Note:** Player is a special case of Entity, but with additional tracking:

```
All Entity fields (entity_type: player, is_player: true)

Plus:

active_goals: array of strings
    Current objectives player is pursuing
    Examples: ["win_state_legislature_seat", "investigate_mayor_corruption", "maintain_family_life"]
    Used to weight opportunity generation

known_opportunities: array of opportunity_ids
    Opportunities player is aware of

known_entities: array of entity_ids
    Entities player has met or heard about

known_locations: array of entity_ids
    Locations player knows exist

resources: object
    Money, assets, social capital
    {
        money: number,
        assets: array of entity_ids (car, house, etc.),
        social_capital: object (by faction/group)
    }
```

---

## 6. INFORMATION FLOW ARCHITECTURE

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

---

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

---

### 6.6 Time Tracking and Advancement

**Core Principle:** Every action advances the world clock. Time is the universal currency of the simulation.

**Time Properties:**
- Measured in minutes (granular enough for meaningful tracking)
- World has single authoritative timestamp
- Each action/event includes `time_elapsed` (in minutes)
- All temporal queries resolve against world clock

**World Clock Structure:**
```javascript
world_state.current_time = "2024-03-15T14:35:00"  // ISO 8601 format
```

**Action Time Assignment:**

Every player action results in time passage. There are two paths for determining duration:

**Path 1: Uncertain Actions (Consequence Engine)**
- Actions with variable outcomes that include skill checks, NPC reactions, meaningful variation
- Examples: persuading someone, combat, risky maneuvers
- LLM determines `time_elapsed` as part of consequence generation
- Duration reflects complexity and outcome quality

**Path 2: Certain Actions (Time Estimator)**
- Actions with predictable outcomes and no meaningful variation
- Examples: walking to bus stop, looking around, waiting
- Simple deterministic calculator estimates duration
- No LLM call required

**Determining Which Path:**

```python
def classify_action(action, world_state):
    # Check if action has uncertain outcomes
    has_skill_check = requires_ability_check(action)
    has_npc_agency = involves_npc_decision(action)
    has_meaningful_failure = could_go_wrong(action)
    
    if has_skill_check or has_npc_agency or has_meaningful_failure:
        return "UNCERTAIN"  # Use Consequence Engine
    else:
        return "CERTAIN"    # Use Time Estimator
```

**Examples of Classification:**

```
UNCERTAIN (Consequence Engine):
- "I try to pick the lock" (skill check, could fail)
- "I ask Marcus about the senator" (NPC might refuse, lie, or share)
- "I climb the fence" (physical challenge, could slip)
- "I negotiate with the dealer" (social outcome varies)

CERTAIN (Time Estimator):
- "I walk to the corner store" (predictable movement)
- "I look around the room" (no variation in outcome)
- "I wait for 30 minutes" (time is the action)
- "I read the posted notice" (information gathering, no check)
```

**Uncertainty Injection:**

To create occasional surprises in routine activities:
- 95% of certain actions: process as certain
- 5% of certain actions: secretly route to Consequence Engine anyway
- Creates moments like: walking to corner store → random encounter

**Time Estimator (for Certain Actions):**

```python
def estimate_time(action, world_state):
    # Simple deterministic calculation
    base_time = get_base_duration(action.type)
    
    # Modifiers
    distance_factor = calculate_distance(action.start, action.end)
    complexity_factor = count_steps(action)
    
    time_elapsed = base_time * distance_factor * complexity_factor
    return time_elapsed
```

**Example:**
```python
action = "Walk to corner store"
base_time = 2 minutes per block
distance = 3 blocks
time_elapsed = 2 * 3 = 6 minutes

world_state.current_time += 6 minutes
```

**Consequence Engine Time Assignment:**

When using Consequence Engine, `time_elapsed` is included in each outcome:

```json
{
  "outcome": "successful_persuasion",
  "type": "SUCCESS",
  "weight": 0.4,
  "description": "Marcus agrees to help after thoughtful conversation",
  "time_elapsed": 12,  // LLM estimates this took ~12 minutes
  "effects": ["marcus_relationship_improved", "information_gained"]
}
```

**LLM Prompt for Time:**
```
Include realistic time_elapsed (in minutes) for this action based on:
- Complexity of the task
- Number of exchanges or steps involved
- Whether complications arise
- Realistic human timing for this activity

Examples:
- Quick conversation: 3-5 minutes
- Detailed negotiation: 10-20 minutes
- Physical fight: 1-3 minutes
- Picking a lock: 2-15 minutes depending on difficulty
- Reading a document: 5-30 minutes depending on length
```

**Time Application:**

```python
# After selecting outcome (either path)
selected_outcome = consequence_engine.resolve(action)
# OR
time_elapsed = time_estimator.calculate(action)

# Update world clock
world_state.current_time += timedelta(minutes=time_elapsed)

# Record in event
event.timestamp = world_state.current_time
event.time_elapsed = time_elapsed
```

**Critical Properties:**
- Time only moves forward (no retcons)
- All entities experience same timeline
- NPCs off-screen remain in pending state until time catches up
- Scene transitions don't skip time unless explicitly traveling

---

### 6.7 Scene Transition Workflow

**Core Principle:** Scene transitions occur when material context changes, not purely based on distance or time.

**What Triggers Scene Transition:**
- Player changes location (enters new building, travels to new area)
- Significant NPC arrival/departure (key person enters/leaves)
- Major context shift (combat ends, time jump requested)
- Player explicitly transitions ("I go home", "I leave the bar")

**What Does NOT Trigger Scene Transition:**
- Movement within same location ("I walk to the other side of the bar")
- Time passage alone (15 minutes at same table = same scene)
- Minor NPC changes (bartender's shift change = background detail)

**Full Scene Transition Workflow:**

```
PLAYER ACTION TRIGGERS SCENE TRANSITION
(e.g., "I leave the bar and go home")
    ↓
1. RESOLVE TIME PASSAGE
   - Calculate total time since last scene
   - Update world clock
    ↓
2. CHECK NPC PENDING ACTIONS
   - Have time triggers been reached?
   - Resolve relevant pending actions
   - Update NPC states
    ↓
3. CHECK OPPORTUNITY EXPIRATIONS
   - Has expires_at timestamp passed?
   - Mark expired opportunities as unavailable
   - Remove from active opportunity list
    ↓
4. GENERATE AMBIENT EVENTS
   - Roll for events proportional to time passed
   - Apply event outcomes to world state
    ↓
5. GENERATE NEW OPPORTUNITIES
   - Based on new location
   - Based on new NPCs present
   - Based on new context
   - Filter by pacing
    ↓
6. FULL ENVIRONMENT NARRATION
   - Describe new scene
   - Introduce present NPCs
   - Highlight available opportunities
    ↓
NEW SCENE BEGINS
```

**Scene Transition Example:**

```
Turn 47: Player at bar with Marcus
action: "I leave and head home"
time: 11:47 PM

TRANSITION WORKFLOW:
──────────────────────────────────────
1. Time Passage:
   - Travel time: 23 minutes (bus + walking)
   - New time: 12:10 AM (next day)

2. Check NPC Pending Actions:
   - Sarah had pending action: "get_fake_passport" (deadline: Turn 50)
   - Time passed: 23 minutes (Turn 47 → 48)
   - Deadline not reached yet → remains pending
   
3. Check Opportunity Expirations:
   - "Overhear two men discussing shipment" (created Turn 42, expires Turn 47)
   - Current turn: 48 → EXPIRED
   - Remove from active opportunities
   
4. Generate Ambient Events:
   - Time passed: 23 minutes
   - Roll for minor events: None occur
   
5. Generate New Opportunities:
   - New location: player's apartment
   - Query: Who's present? What's available?
   - Generated opportunities:
     * Check voicemail (2 new messages)
     * Notice neighbor's door slightly ajar
     * Email notification on laptop (from campaign manager)
     
6. Narration:
   "You unlock your apartment door at 12:10 AM. The place is quiet, just the hum of the refrigerator. The message light on your phone blinks—two new voicemails. As you set down your keys, you notice your neighbor's door across the hall is slightly ajar, which is unusual for this hour. Your laptop on the kitchen table shows an email notification from your campaign manager."
   
NEW SCENE: Player's apartment, 12:10 AM
```

---

### 6.8 Conversation Timing

**Principle:** Multi-turn conversations accumulate time naturally. Each conversational exchange is a turn.

**Multi-Turn Conversations:**
- Each player input during conversation = separate turn
- Each turn advances time (typically 3-10 minutes)
- Time accumulates across conversation turns
- Scene remains active until conversation ends or context shifts

**Determining Timing Path:**

Most conversations use **Consequence Engine** because NPC reactions vary:
- Asking for information (might refuse, lie, or share)
- Persuading or negotiating (could succeed or fail)
- Social dynamics have uncertain outcomes
- NPC has agency in how they respond

Some conversations use **Time Estimator**:
- Pure social pleasantries (predictable, no variation)
- Player just listening to monologue (no agency required)
- Automatic/scripted exchanges

**Example: Extended Conversation**

```
Turn 50: "I ask Marcus about the senator"
→ Consequence Engine (uncertain reaction)
→ Outcome: Marcus shares some info cautiously
→ time_elapsed: 5 minutes
→ Clock: 2:00 PM → 2:05 PM

Turn 51: "I press him on what he really knows"
→ Consequence Engine (could refuse or elaborate)
→ Outcome: Marcus gets defensive, shares reluctantly
→ time_elapsed: 7 minutes
→ Clock: 2:05 PM → 2:12 PM

Turn 52: "I back off and ask about his family instead"
→ Consequence Engine (social redirect, varies)
→ Outcome: Marcus relaxes, opens up
→ time_elapsed: 8 minutes
→ Clock: 2:12 PM → 2:20 PM

Turn 53: "I thank him and leave"
→ Time Estimator (certain pleasantries)
→ time_elapsed: 2 minutes
→ Clock: 2:20 PM → 2:22 PM

Total conversation: 22 minutes
Marcus leaves → Scene transition triggered (key NPC departure)
```

**Scene Continuity During Conversations:**

```python
def check_scene_transition(last_action, current_state):
    # Same location + same key NPCs = same scene
    if location_unchanged and key_npcs_present:
        return False  # Continue scene
    
    # NPC departure or player movement = transition
    if key_npc_departed or player_moved:
        return True  # Trigger transition
```

**Conversation Example Without Transition:**

```
Turn 60-75: Player having dinner with spouse
- 15 turns of conversation
- Total time: 45 minutes (dinner duration)
- Same location (home)
- Same NPC (spouse)
- No scene transition until player/spouse leaves table
```

**Time Realism in Dialogue:**

LLM estimates `time_elapsed` based on dialogue complexity:

```
Short question + short answer: 2-4 minutes
Detailed explanation: 5-10 minutes
Heated argument: 7-15 minutes
Deep philosophical discussion: 15-30 minutes
```

---

### 6.9 Opportunity Expiration

**Core Principle:** All opportunities expire eventually. The world moves on.

**Every Opportunity Has Expiration:**

```javascript
opportunity = {
  id: "opp_shipment_discussion_001",
  description: "Two men discussing a shipment in hushed tones",
  created_at: "2024-03-15T14:20:00",
  created_turn: 42,
  expiration_minutes: 8,  // LLM determines realistic duration
  expires_at: "2024-03-15T14:28:00",
  expires_turn: 47,  // Calculated from expiration_minutes
  status: "active"
}
```

**LLM Determines Duration:**

When Opportunity Generator creates opportunities, LLM estimates realistic expiration:

```
Prompt:
For this opportunity, estimate how long it remains available (in minutes):
- Conversation between NPCs: typically 5-15 minutes
- Physical object in public: hours to days depending on location
- Time-sensitive event: minutes to hours
- Knowledge/contact information: months to years
- Location-based hook: until player leaves area

Consider:
- Nature of opportunity (conversation vs object vs information)
- Location and situation
- NPC involvement and their schedules
- World events and context

Return expiration_minutes as integer.
```

**Example Expirations:**

```javascript
// Conversation opportunity
{
  description: "Two men discussing shipment",
  expiration_minutes: 8
}

// Object opportunity
{
  description: "Wallet dropped on sidewalk",
  expiration_minutes: 180  // 3 hours (until street cleaning or someone finds it)
}

// Information opportunity
{
  description: "You remember Marcus mentioned knowing a forger",
  expiration_minutes: 259200  // 6 months (contact info might change)
}

// Event opportunity
{
  description: "Bar fight starting to escalate",
  expiration_minutes: 3  // Immediate - seconds to act
}
```

**Expiration Check Process:**

At start of each turn:

```python
def check_expiration(opportunities, current_time, current_turn):
    for opp in opportunities:
        if current_time >= opp.expires_at:
            opp.status = "expired"
            remove_from_active_list(opp)
            log_expiration(opp, current_turn)
```

**Expiration in Scene Transitions:**

Scene transitions are prime expiration moments:

```
Turn 42: Opportunity created: "Two men discussing shipment"
         expires_turn: 47 (5 turns / 8 minutes later)

Turn 43: Player talks to bartender (opportunity still active)
Turn 44: Player talks to bartender (opportunity still active)
Turn 45: Player talks to bartender (opportunity still active)
Turn 46: Player leaves bar → Scene transition

SCENE TRANSITION CHECK:
- Current turn: 47
- Opportunity expires_turn: 47
- Status: EXPIRED (men finished conversation and left)
- Remove from available opportunities

Player can no longer act on this opportunity.
```

**No Persistent Opportunities:**

Even knowledge-based opportunities have distant expirations to prevent infinite accumulation:

```javascript
// Knowledge expires eventually
{
  description: "You know where the senator's office is",
  expiration_minutes: 15552000  // 6 months (might relocate)
}

// Contact info expires
{
  description: "You have Sarah's phone number",
  expiration_minutes: 31536000  // 1 year (number might change)
}

// Physical objects expire
{
  description: "Wallet on floor of bar bathroom",
  expiration_minutes: 720  // 12 hours (cleaning crew finds it)
}
```

**Rationale:**

This prevents:
- Infinite opportunity accumulation
- Player hoarding hooks indefinitely
- Static world feel
- Metagaming (saving opportunities for "perfect moment")

**Implementation:**

```python
class Opportunity:
    def __init__(self, description, created_at, created_turn, expiration_minutes):
        self.description = description
        self.created_at = created_at  # ISO timestamp
        self.created_turn = created_turn
        self.expiration_minutes = expiration_minutes
        self.expires_at = self.calculate_expiry(created_at, expiration_minutes)
        self.expires_turn = created_turn + self.estimate_turns(expiration_minutes)
        self.status = "active"
    
    def is_expired(self, current_time):
        return current_time >= self.expires_at
    
    def calculate_expiry(self, start_time, minutes):
        return start_time + timedelta(minutes=minutes)
    
    def estimate_turns(self, minutes):
        # Rough estimate: average 3-5 minutes per turn
        return int(minutes / 4)
```

**Opportunity Lifecycle:**

```
CREATED (Turn 42)
    ↓
ACTIVE (Turns 42-46)
    ↓
CHECK (Turn 47 start)
    ↓
EXPIRED (current_time >= expires_at)
    ↓
REMOVED from active list
    ↓
LOGGED in history (for debugging/analytics)
```

**Player Experience:**

Player learns that opportunities are fleeting:
- Must act on interesting hooks or they disappear
- World feels dynamic and alive
- Creates tension and prioritization
- Rewards player attention and decisiveness

---

### 6.10 Implementation Summary: Time and Scene Management

**Time Tracking:**
- Every action advances world clock by `time_elapsed` minutes
- Uncertain actions → Consequence Engine determines duration
- Certain actions → Time Estimator calculates duration
- 5% uncertainty injection for surprises

**Scene Transitions:**
- Triggered by material context change (location, key NPCs, major events)
- Not triggered by pure time passage or minor changes
- Full workflow: time passage → NPC resolution → expiration check → ambient events → new opportunities → narration

**NPC Timing:**
- Off-screen actions remain pending with time triggers
- Resolved when NPC becomes relevant (enters scene, mentioned, time trigger reached)
- Retroactive resolution based on time passed

**Opportunity Management:**
- All opportunities have expiration timestamps
- Checked at start of each turn
- LLM determines realistic expiration duration
- No infinite persistence (even knowledge expires eventually)

**Conversation Mechanics:**
- Each exchange = separate turn with time accumulation
- Most use Consequence Engine (uncertain NPC reactions)
- Some use Time Estimator (certain pleasantries)
- Scene continues until NPC departure or player movement

**Key Data Structures:**

```python
world_state.current_time: datetime  # ISO 8601
event.time_elapsed: int  # minutes
opportunity.expires_at: datetime
opportunity.expires_turn: int
npc.pending_actions: list[PendingAction]
PendingAction.time_trigger: datetime
```

**Integration Points:**

```
Player Input → Action Classification
    ↓
Uncertain → Consequence Engine (includes time_elapsed)
Certain → Time Estimator (calculates time_elapsed)
    ↓
Update world_state.current_time
    ↓
Check for scene transition
    ↓
If transition: Run full workflow
If same scene: Continue
    ↓
Check opportunity expirations
    ↓
Present updated scene to player
```

---


---

# PART II: IMPLEMENTATION SPECIFICATIONS

---

## 7. EVENT LOGGING & NPC KNOWLEDGE SYSTEM

---

### 7.1 Event Structure

**Core Principle:** Every turn generates one event that represents what happened and who knows about it.

Every turn creates a single event record stored in the world state database:

```javascript
{
  event_id: "event_103",
  turn: 103,
  timestamp: "2024-03-15T14:35:00",  // ISO 8601 format
  description: "Player kills assassin in Dirty Ditch bathroom",
  location: "loc_dirty_ditch_bathroom_001",
  participants: ["player_001", "npc_assassin_001"],  // Direct participants
  witnesses: ["npc_marcus_001"],  // Named NPCs who observed
  mentions: ["npc_olga_001", "npc_crime_boss_001"],  // Entities discussed but not present
  outcome_type: "CRITICAL_SUCCESS",  // From Consequence Engine
  time_elapsed: 3,  // minutes
  tags: ["violence", "death", "criminal"]  // For categorization/queries
}
```

**Field Definitions:**

```
event_id: Unique identifier (never reused)
turn: Turn number when event occurred
timestamp: Exact world time when event happened
description: Human-readable summary of what happened
location: Where the event took place (entity_id)
participants: Entity IDs of direct participants (actor + target)
witnesses: Entity IDs of named NPCs who observed
mentions: Entity IDs of entities explicitly discussed or referenced but not present
          Essential for tracking gossip, reputation, and information propagation
          Populated by Consequence Engine when analyzing dialogue/thought content
          Example: Player tells Marcus "Olga hired the assassin" → mentions: ["npc_olga_001"]
outcome_type: Result category from Consequence Engine
time_elapsed: Duration of the event in minutes
tags: Categorization for querying (violence, social, discovery, etc.)
```

**Event vs Action:**
- Action = player input ("I slap Olga")
- Event = what actually happened ("Player slapped Olga, she drew weapon, Marcus intervened")
- Event captures the full resolved outcome, not just the attempt

---

### 7.2 Certain vs Uncertain Actions

**Classification Determines Processing Path:**

Actions fall into two categories that affect both consequence generation AND time calculation.

**Uncertain Actions** (require Consequence Engine):
- Involve skill checks, NPC reactions, or meaningful outcome variation
- Success is not guaranteed
- Outcome quality varies
- Examples:
  - Persuading someone (might refuse, lie, or share)
  - Combat attempts (could hit, miss, or fumble)
  - Risky maneuvers (could succeed cleanly or with complications)
  - Social navigation (NPC has agency in response)

**Certain Actions** (use Time Estimator):
- Predictable outcomes with no meaningful variation
- Success is guaranteed (barring extraordinary circumstances)
- Outcome is essentially fixed
- Examples:
  - Walking to bus stop (movement is certain)
  - Looking around room (perception is automatic)
  - Waiting for specified time (time is the action)
  - Reading a posted notice (information gathering, no check)

**Classification Logic:**

```python
def classify_action(action, world_state):
    # Criteria for uncertain actions
    has_skill_check = requires_ability_check(action)
    has_npc_agency = involves_npc_decision(action)
    has_meaningful_failure = could_go_wrong(action)
    has_variable_outcome = outcome_quality_matters(action)
    
    if any([has_skill_check, has_npc_agency, has_meaningful_failure, has_variable_outcome]):
        return "UNCERTAIN"  # Route to Consequence Engine
    else:
        return "CERTAIN"    # Route to Time Estimator
```

**Examples with Reasoning:**

```
UNCERTAIN:
"I try to pick the lock"
→ Skill check required, could fail, tools might break
→ Use Consequence Engine

"I ask Marcus about the senator"
→ NPC might refuse, lie, share partial truth, or elaborate
→ Use Consequence Engine

"I climb the fence"
→ Physical challenge, could slip, get injured, succeed cleanly
→ Use Consequence Engine

"I negotiate with the dealer"
→ Social outcome varies based on approach and NPC disposition
→ Use Consequence Engine

CERTAIN:
"I walk to the corner store"
→ Predictable movement, no variation (unless 5% uncertainty triggers)
→ Use Time Estimator

"I look around the room"
→ Automatic perception, no check needed
→ Use Time Estimator (generate room description)

"I wait for 30 minutes"
→ Time passage is the action itself
→ Use Time Estimator

"I read the posted notice"
→ Information is accessible, no skill check
→ Use Time Estimator (present information)
```

**Uncertainty Injection:**

To prevent certain actions from becoming completely predictable:

```python
def process_certain_action(action, world_state):
    # 95% of the time: process as certain
    # 5% of the time: inject uncertainty
    
    if random.random() < 0.05:
        # Surprise! Route to Consequence Engine
        return consequence_engine.resolve(action, world_state)
    else:
        # Process deterministically
        time_elapsed = time_estimator.calculate(action)
        description = generate_simple_narration(action)
        return create_certain_event(action, time_elapsed, description)
```

**Example Uncertainty Injection:**

```
Player: "I walk to the corner store"
Normal (95%): Simple movement, 6 minutes, arrive at store
Surprise (5%): Consequence Engine triggered
→ Possible outcomes:
  - Bumps into old friend → conversation opportunity
  - Sees suspicious activity → investigation hook
  - Gets caught in sudden rainstorm → environmental effect
  - Normal walk but meets interesting stranger → social opportunity
```

This creates occasional surprises during routine activities while keeping most mundane actions efficient.

---

### 7.3 NPC Event Knowledge

**Principle:** NPCs track what they know through event references, not full event duplication.

NPCs maintain knowledge of events they're aware of in their entity record:

```javascript
npc.event_knowledge = [
  {
    event_id: "event_103",
    awareness: "witnessed_firsthand",  
    // Types: "witnessed_firsthand", "told_by_friend", "heard_gossip", "saw_news", "participated"
    impression: "traumatized, fears player now",  // Their personal reaction/opinion
    learned_turn: 103  // When they learned about it
  },
  {
    event_id: "event_156",
    awareness: "heard_from_bartender",
    impression: "thinks player is dangerous but respects it",
    learned_turn: 162  // Learned later through gossip
  }
]
```

**Awareness Types:**

```
witnessed_firsthand: NPC was present during event
participated: NPC was a participant or direct target
told_by_friend: NPC learned from trusted source
heard_gossip: NPC learned through rumor network
saw_news: NPC learned from media/official channels
inferred: NPC deduced from other information
```

**When Knowledge Gets Added:**

**CRITICAL: Player Exclusion**

Player entities do NOT participate in event_knowledge queries or updates. When assembling context for NPCs or querying "who knows about event X", explicitly exclude the player entity. Player knowledge is implicit (knows ALL events) and tracked through the UI, not through event_knowledge data structures.

```python
def apply_event_knowledge(event, world_state):
    # Participants always know (EXCEPT PLAYER)
    for participant_id in event.participants:
        if participant_id == player.id:
            continue  # Skip player - knowledge is implicit
        
        participant = world_state.get_entity(participant_id)
        participant.event_knowledge.append({
            'event_id': event.event_id,
            'awareness': 'participated',
            'impression': generate_participant_impression(participant, event),
            'learned_turn': event.turn
        })
    
    # Witnesses always know (EXCEPT PLAYER)
    for witness_id in event.witnesses:
        if witness_id == player.id:
            continue  # Skip player - knowledge is implicit
            
        witness = world_state.get_entity(witness_id)
        witness.event_knowledge.append({
            'event_id': event.event_id,
            'awareness': 'witnessed_firsthand',
            'impression': generate_witness_impression(witness, event),
            'learned_turn': event.turn
        })
```

**Immediate (during event resolution):**
- Participants get event added automatically with awareness: "participated"
- Witnesses get event added automatically with awareness: "witnessed_firsthand"
- LLM generates their impression as part of consequence generation
- Added to `event_knowledge` same turn
- **Player entity is ALWAYS excluded from these updates**

**Lazy (when NPC becomes relevant):**

When an NPC enters scene or player interacts with them, system checks if they should know about recent significant events:

```python
def update_npc_knowledge_on_entry(npc, world_state):
    # Query significant recent events NPC might know about
    significant_events = query_significant_events(
        since_turn=npc.last_active_turn,
        location_relevance=npc.social_circle,
        participant_relevance=npc.relationships
    )
    
    # Batch check: does this NPC know about these events?
    for event in significant_events:
        if should_know_about(npc, event, world_state):
            awareness_type = determine_awareness(npc, event)
            impression = llm_generate_impression(npc, event)
            
            npc.event_knowledge.append({
                'event_id': event.event_id,
                'awareness': awareness_type,
                'impression': impression,
                'learned_turn': world_state.current_turn
            })
```

**Determining Awareness Type:**

```python
def determine_awareness(npc, event):
    # Check relationship to participants
    knows_participant_well = any(
        is_close_relationship(npc, p) 
        for p in event.participants
    )
    
    # Check location overlap
    frequents_location = npc.common_locations.includes(event.location)
    
    # Check social network
    in_gossip_network = has_mutual_connections(npc, event.participants)
    
    if knows_participant_well:
        return "told_by_friend"
    elif frequents_location:
        return "heard_gossip"
    elif event.tags.includes("news_worthy"):
        return "saw_news"
    else:
        return "heard_gossip"  # Default for social propagation
```

---

### 7.4 Context Window Construction

**Principle:** Use structured queries with entity IDs, not text search, to build context for LLMs.

When building context for a scene, the system queries events using structured filters:

```python
def build_scene_context(player, location, npcs, world_state):
    # Collect all entity IDs in the scene
    entity_ids_present = [player.id, location.id] + [npc.id for npc in npcs]
    
    context = {
        # Full entity records (NPCs include their event_knowledge)
        "player": get_entity(player.id),
        "npcs": [get_entity(npc.id) for npc in npcs],  # Includes event_knowledge
        "location": get_entity(location.id),
        
        # Query events using structured filters
        "relevant_events": get_relevant_events(entity_ids_present, world_state)
    }
    return context
```

**Structured Event Query:**

```python
def get_relevant_events(entity_ids_present, world_state, max_results=20):
    """
    Get events relevant to the current scene using structured filters.
    Returns events where present entities participated or were mentioned.
    """
    relevant_events = []
    
    for event in world_state.events:
        # Check if any present entity participated in the event
        if any(entity_id in event.participants for entity_id in entity_ids_present):
            relevant_events.append(event)
            continue
        
        # Check if any present entity was mentioned in the event
        if hasattr(event, 'mentions') and event.mentions:
            if any(entity_id in event.mentions for entity_id in entity_ids_present):
                relevant_events.append(event)
    
    # Sort by recency (most recent first)
    relevant_events.sort(key=lambda e: e.turn_number, reverse=True)
    
    # Return most recent N events
    return relevant_events[:max_results]
```

**What This Retrieves:**

For a scene at "The Dirty Ditch" (loc_bar_001) with NPCs Marcus (npc_marcus_001) and Sarah (npc_sarah_001):

```python
entity_ids_present = ["player_001", "loc_bar_001", "npc_marcus_001", "npc_sarah_001"]
events = get_relevant_events(entity_ids_present, world_state)

# Returns events where these entities were:
# 1. Participants (directly involved)
# 2. Mentions (discussed but not present)

# Examples:
# - event_203: participants=["player_001", "loc_bar_001", "npc_assassin_001"]
#   → "Player kills assassin at Dirty Ditch"
# - event_156: participants=["npc_marcus_001", "npc_sarah_001"], 
#              mentions=["player_001"]
#   → "Marcus tells Sarah about player's campaign"
# - event_401: participants=["npc_mob_001", "loc_bar_001"]
#   → "Fight breaks out at Dirty Ditch"
```

**Visibility Filtering for NPC Knowledge:**

When determining what events an NPC can reference in dialogue, use their `event_knowledge`:

```python
def get_npc_known_events(npc, relevant_events):
    """
    Filter relevant events to only those the NPC knows about.
    NPCs can only reference events in their event_knowledge.
    """
    npc_known_event_ids = [record.event_id for record in npc.event_knowledge]
    
    return [event for event in relevant_events if event.event_id in npc_known_event_ids]
```

**Integration with LLM Context:**

When building NPC dialogue prompts:

```python
# Marcus enters scene - what can he reference?
relevant_events = get_relevant_events(entity_ids_present, world_state)
marcus_known_events = get_npc_known_events(marcus, relevant_events)

# Prompt includes:
# - Marcus's event_knowledge (with awareness types and impressions)
# - Full event details for events Marcus knows about
# - Marcus cannot reference events not in his event_knowledge

prompt = f"""
Marcus's Knowledge:
{marcus.event_knowledge}

Events Marcus knows about:
{marcus_known_events}

Generate Marcus's dialogue based ONLY on events he knows about.
"""
```

**Why Structured Queries:**
1. **Accurate:** Uses entity IDs, not fuzzy text matching
2. **Complete:** Captures both participants and mentions
3. **Fast:** Direct ID lookups, no string searching
4. **Consistent:** No false positives/negatives from name variations
5. **Privacy-Respecting:** NPCs only reference events in their event_knowledge

---

### 7.5 Location Event Tracking

**Principle:** Locations do NOT store event lists. Events are queried dynamically using structured filters.

Locations don't maintain event arrays. Instead, events are discovered through participant/mention queries:

```python
# ❌ DON'T DO THIS:
location.events = [event_103, event_156, event_201, ...]  # Duplication!

# ✅ DO THIS:
events_at_bar = get_events_at_location("loc_bar_001", world_state)
```

**Structured Location Query:**

```python
def get_events_at_location(location_id, world_state, since_turn=None, max_results=50):
    """
    Get all events that occurred at a location.
    Uses structured participant filtering, not text search.
    """
    location_events = []
    
    for event in world_state.events:
        # Check if location was a participant (event happened there)
        if location_id in event.participants:
            # Optional: filter by recency
            if since_turn is None or event.turn_number >= since_turn:
                location_events.append(event)
    
    # Sort by recency (most recent first)
    location_events.sort(key=lambda e: e.turn_number, reverse=True)
    
    return location_events[:max_results]
```

**Why This Approach:**

1. **No Duplication:** Events stored once in event database
2. **Automatic Updates:** New events automatically discoverable via queries
3. **Accurate Filtering:** Uses entity IDs, not string matching
4. **Memory Efficient:** Don't store redundant references
5. **Fast:** Direct participant ID lookups

**Query Examples:**

```python
# Find all events at a location
events_at_bar = get_events_at_location("loc_bar_001", world_state)

# Find events involving an NPC (as participant)
def get_events_with_npc(npc_id, world_state):
    return [e for e in world_state.events if npc_id in e.participants]

events_with_marcus = get_events_with_npc("npc_marcus_001", world_state)

# Find events where NPC was mentioned but not present
def get_events_mentioning_npc(npc_id, world_state):
    return [e for e in world_state.events 
            if hasattr(e, 'mentions') and npc_id in e.mentions]

events_mentioning_marcus = get_events_mentioning_npc("npc_marcus_001", world_state)

# Find recent events at location
recent_bar_events = get_events_at_location(
    "loc_bar_001", 
    world_state, 
    since_turn=world_state.current_turn - 50
)

# Combined queries: events at location involving specific NPC
def get_location_npc_events(location_id, npc_id, world_state):
    return [e for e in world_state.events 
            if location_id in e.participants and npc_id in e.participants]

marcus_at_bar = get_location_npc_events("loc_bar_001", "npc_marcus_001", world_state)
```

**Location Context Building:**

When player enters location, system queries relevant events:

```python
def build_location_context(location, world_state, recency_window=200):
    # Find events that happened at this location (location as participant)
    location_events = get_events_at_location(
        location.id,
        world_state,
        since_turn=world_state.current_turn - recency_window
    )
    
    # Get entities currently at this location
    entities_here = get_entities_at_location(location.id, world_state)
    
    # Get events involving those entities (for richer context)
    entity_events = []
    for entity in entities_here:
        entity_events.extend(get_events_with_npc(entity.id, world_state))
    
    # Combine and deduplicate
    relevant_events = deduplicate_by_id(location_events + entity_events)
    
    # Sort by recency and significance
    return sort_by_importance(relevant_events, limit=20)
```

**Event Participants Must Be Complete:**

Event `participants` arrays must include all relevant entity IDs for queries to work:

```javascript
// ✅ GOOD - complete participant list
{
  event_id: "event_203",
  description: "Player kills assassin in Dirty Ditch bathroom, Marcus witnesses from doorway",
  participants: ["player_001", "npc_assassin_001", "loc_bar_001", "npc_marcus_001"],
  mentions: []  // Marcus is a participant (witnessed), not just mentioned
}
// Query for loc_bar_001 → finds this event
// Query for npc_marcus_001 → finds this event

// ❌ BAD - incomplete participants
{
  event_id: "event_203",
  description: "Combat occurs",
  participants: ["player_001", "npc_assassin_001"]  // Missing location!
}
// Query for loc_bar_001 → MISSES this event
```

**Critical: Participants vs Mentions:**

- **participants:** Entities directly involved or present at the event
  - Use for: "What happened at this location?" queries
  - Use for: "What events did this NPC participate in?"
  
- **mentions:** Entities discussed but not present
  - Use for: "What events reference this entity?"
  - Use for: Information propagation tracking

```javascript
// Example: Secretary tells Senator about player's campaign
{
  participants: ["npc_secretary_001", "npc_senator_001", "loc_office_001"],
  mentions: ["player_001"]  // Player discussed but not present
}
```

---

### 7.6 Event Propagation Through Social Networks

**Future Enhancement:** Events can propagate through NPC social networks over time.

While not required for MVP, this concept illustrates how knowledge spreads:

```python
def propagate_gossip(event, world_state):
    """
    Optional: Simulate event knowledge spreading through social networks.
    Run during scene transitions or time passage.
    """
    if not event.tags.includes("gossip_worthy"):
        return  # Some events don't spread
    
    # Start with direct witnesses
    knowers = set(event.witnesses)
    
    # Propagate through social connections
    for turn_passed in range(1, time_since_event):
        new_knowers = set()
        
        for knower_id in knowers:
            knower = world_state.get_entity(knower_id)
            
            # Tell close friends
            for friend_id in knower.close_relationships:
                if random.random() < 0.3:  # 30% chance to share
                    new_knowers.add(friend_id)
                    add_event_knowledge(
                        friend_id, 
                        event.event_id,
                        awareness="told_by_friend",
                        source=knower_id
                    )
        
        knowers.update(new_knowers)
```

**For MVP:** Use lazy evaluation (check when NPC becomes relevant) rather than proactive propagation.

---

### 7.7 Implementation Guidelines

**Event Creation (Every Turn):**

```python
def create_event(turn, action, outcome, world_state):
    event = {
        'event_id': f"event_{turn}",
        'turn': turn,
        'timestamp': world_state.current_time,
        'description': generate_event_description(action, outcome),
        'location': world_state.current_location,
        'participants': extract_participants(action, outcome),
        'witnesses': get_named_npcs_in_scene(world_state),
        'outcome_type': outcome.type,
        'time_elapsed': outcome.time_elapsed,
        'tags': generate_tags(action, outcome)
    }
    
    world_state.events.append(event)
    apply_event_knowledge(event, world_state)
    
    return event
```

**NPC Knowledge Query (When NPC Enters Scene):**

```python
def sync_npc_knowledge(npc, world_state):
    """
    Update NPC's knowledge of events they should know about
    but haven't been present to witness directly.
    """
    # Find events since NPC was last active
    recent_events = get_events_since(npc.last_active_turn)
    
    # Filter to events NPC would plausibly know about
    relevant_events = filter_by_social_relevance(recent_events, npc)
    
    # Add knowledge entries for events NPC doesn't already know
    for event in relevant_events:
        if not npc_knows_event(npc, event):
            awareness = determine_awareness_type(npc, event)
            impression = llm_generate_impression(npc, event)
            
            npc.event_knowledge.append({
                'event_id': event.event_id,
                'awareness': awareness,
                'impression': impression,
                'learned_turn': world_state.current_turn
            })
```

**Event Query for Context:**

```python
def get_scene_events(location, npcs, world_state):
    """
    Gather relevant events for scene context.
    """
    search_terms = [location.name] + [npc.name for npc in npcs] + ["player"]
    
    # Text search across event descriptions
    relevant_events = search_event_descriptions(search_terms)
    
    # Also include events NPCs know about
    for npc in npcs:
        for knowledge in npc.event_knowledge:
            event = world_state.get_event(knowledge.event_id)
            if event not in relevant_events:
                relevant_events.append(event)
    
    # Sort by relevance and recency
    return sort_events(relevant_events, limit=30)
```

---

### 7.8 Integration with Existing Systems

**Consequence Engine Integration:**

```python
# After consequence resolution
selected_outcome = consequence_engine.resolve(action, world_state)

# Create event record
event = create_event(
    turn=world_state.current_turn,
    action=action,
    outcome=selected_outcome,
    world_state=world_state
)

# Event automatically added to:
# - world_state.events (central database)
# - participants' event_knowledge (immediate)
# - witnesses' event_knowledge (immediate)
```

**Scene Narrator Integration:**

```python
# When generating narration
context = {
    'location': location,
    'npcs': npcs,
    'events': get_scene_events(location, npcs, world_state),  # Relevant events
    'npc_knowledge': {npc.id: npc.event_knowledge for npc in npcs}  # What NPCs know
}

narration = scene_narrator.generate(context)
```

**NPC Reaction Integration:**

```python
def generate_npc_reaction(npc, trigger_event, world_state):
    # Include NPC's knowledge of past events
    relevant_history = [
        world_state.get_event(k.event_id) 
        for k in npc.event_knowledge
        if is_relevant_to_reaction(k, trigger_event)
    ]
    
    prompt = f"""
    NPC: {npc.name}
    Current event: {trigger_event.description}
    
    NPC knows about:
    {format_known_events(npc.event_knowledge)}
    
    Generate reaction considering NPC's knowledge and past impressions...
    """
    
    return llm_generate_reaction(prompt)
```

---

### 7.9 Future Schema Alignment

**Current State:**
- Event system fully specified
- Entity schema (Section 5) predates event knowledge design
- Functional but needs refinement for full integration

**Required Schema Updates (Future):**

```javascript
// Entity schema additions needed:
npc.event_knowledge = [
  {
    event_id: string,
    awareness: enum,
    impression: string,
    learned_turn: int
  }
]

npc.last_active_turn = int  // For lazy knowledge sync

// Event database structure:
world_state.events = [
  {
    event_id: string,
    turn: int,
    timestamp: datetime,
    description: string,
    location: string,
    participants: array,
    witnesses: array,
    outcome_type: string,
    time_elapsed: int,
    tags: array
  }
]
```

**Migration Path:**
- Current MVP: Implement event logging as specified
- Future iteration: Update entity schema to match
- Database migration: Add event_knowledge field to existing NPCs
- Backward compatibility: Default empty event_knowledge for existing entities

---


---

## 8. TURN SEQUENCE (COMPLETE IMPLEMENTATION)

This section provides the complete, step-by-step implementation guide for the turn sequence. This consolidates the overview from Section 6.5 with full implementation details.

**Purpose:** This is the implementation-level specification showing exactly what happens during each turn.

**Design Priority:** Exemplary output quality is the primary goal. Take as many LLM calls as needed, send full context every time. Quality over speed in all cases.

---

### 8.1 Turn Types

1. **Action Turn** - Player takes an action that affects the world
2. **Observation Turn** - Player observes without acting
3. **Scene Transition Turn** - Player moves to new location

---

### 8.2 Main Sequence Overview


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



**DETAILED STEP SPECIFICATIONS:**

Detailed implementations of STEP 2 (Reference Resolution), STEP 2.5 (Entity Instantiation), STEP 3 (Action Classification), and STEP 3.5 (Pre-Action Validation) are in Section 9.1, 9.2, 9.9, and 9.10 respectively. The remaining steps are detailed below.

**Note:** Steps 2.5 and 3.5 are critical architecture additions in v3.5 that prevent consistency violations.

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


### 8.3 Observation Turns


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


### 8.4 Scene Transition Turns


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


### 8.5 Edge Cases & Special Handling


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

---


---

## 9. COMPONENT IMPLEMENTATIONS

This section contains detailed implementation specifications for each major component. Each subsection provides complete implementation guidance including prompts, code examples, and edge case handling.

---

### 9.1 Reference Resolution (Full Implementation)

**Extracted from Section 6.5 STEP 2**

**STEP 2: Reference Resolution**

**Component:** Action Interpreter + Reference Resolver (Section 4.3)  
**Input:** Player's natural language  
**Output:** Interpretation structure (CLEAR, AMBIGUOUS, or GIBBERISH) with resolved entity_ids

**Purpose:** Players use pronouns, ambiguous references, typos, and occasionally gibberish. The system must detect unclear references, request clarification appropriately, handle errors gracefully, and prevent LLM hallucination of non-existent entities.

**Core Principle:** Use the LLM to explicitly declare understanding level and surface ambiguities through structured output.

---

#### System Flow

```
PLAYER INPUT
    ↓
ACTION INTERPRETER (LLM Call)
├─ Analyzes input against world state
├─ Determines: CLEAR | AMBIGUOUS | GIBBERISH
└─ Outputs structured interpretation
    ↓
ROUTING DECISION
├─ CLEAR → Proceed to Action Classification (STEP 3)
├─ AMBIGUOUS → Clarification Flow
└─ GIBBERISH → Confusion Response
```

---

#### Action Interpreter Prompt Template

```
You are interpreting player input for an interactive fiction engine.

PLAYER INPUT: "{player_input}"

CURRENT SCENE:
Location: {location.name}
NPCs Present: {npc_list_with_descriptions}
Notable Objects: {object_list}

PLAYER STATE:
Inventory: {player.inventory}
Recent Actions: {last_3_actions}

CONVERSATION CONTEXT:
{last_5_turns_summary}

Your job: Parse this input and determine if you can clearly understand what the player wants to do.

OUTPUT AS JSON:
{
  "understanding": "CLEAR" | "AMBIGUOUS" | "GIBBERISH",
  
  // ALWAYS include these:
  "action_intent": "brief description of what player seems to want",
  
  // If CLEAR, include these:
  "referenced_entities": [
    {
      "mentioned_as": "Marcus",  // How player referred to it
      "entity_name": "Marcus Webb",  // Full name from world state
      "entity_id": "npc_marcus_001",  // Database ID
      "entity_type": "npc",
      "confidence": 0.95  // 0.0-1.0
    }
  ],
  
  // If AMBIGUOUS, include these:
  "ambiguity_type": "UNCLEAR_REFERENCE" | "MULTIPLE_MATCHES" | "TYPO_SUSPECTED" | "NONEXISTENT_ENTITY",
  "ambiguity_explanation": "detailed explanation",
  "clarification_question": "question to ask player",
  "possible_interpretations": [
    {
      "interpretation": "Talk to Marcus the bartender",
      "entities": [{"name": "Marcus", "entity_id": "npc_marcus_001"}],
      "confidence": 0.6
    },
    {
      "interpretation": "Talk to John the patron",
      "entities": [{"name": "John", "entity_id": "npc_john_045"}],
      "confidence": 0.4
    }
  ],
  
  // If GIBBERISH, include:
  "gibberish_reason": "why this appears nonsensical"
}

DECISION RULES:
1. Mark as CLEAR only if you're confident (>80%) you know what player means
2. If player references entity not present in scene/inventory, mark AMBIGUOUS with NONEXISTENT_ENTITY
3. If player's spelling is close to known entity (edit distance ≤2), mark AMBIGUOUS with TYPO_SUSPECTED
4. If multiple entities could match, mark AMBIGUOUS with MULTIPLE_MATCHES
5. If pronoun/reference is unclear, mark AMBIGUOUS with UNCLEAR_REFERENCE
6. Only mark GIBBERISH if truly nonsensical (random characters, no parseable intent)
7. When in doubt, prefer AMBIGUOUS over CLEAR

OUTPUT VALID JSON ONLY.
```

---

#### Implementation Code

```python
def interpret_player_action(player_input, world_state, conversation_history):
    """
    Step 1 of action processing: Understand what player wants.
    Returns structured interpretation with confidence levels.
    """
    
    # Build prompt with current context
    prompt = ACTION_INTERPRETER_PROMPT.format(
        player_input=player_input,
        location=world_state.current_location,
        npc_list_with_descriptions=format_npcs(world_state.get_npcs_in_scene()),
        object_list=format_objects(world_state.get_notable_objects()),
        player=world_state.player,
        last_3_actions=format_recent_actions(conversation_history, limit=3),
        last_5_turns_summary=format_conversation_context(conversation_history, limit=5)
    )
    
    # LLM call
    response = llm_call(
        prompt=prompt,
        temperature=0.3,  # Lower temp for more consistent parsing
        response_format="json"
    )
    
    interpretation = parse_json(response)
    
    # Validate output structure
    validate_interpretation_structure(interpretation)
    
    return interpretation


def process_action_input(player_input, world_state, conversation_history):
    """
    Main entry point for handling player input.
    Routes based on interpretation clarity.
    """
    
    interpretation = interpret_player_action(player_input, world_state, conversation_history)
    
    if interpretation['understanding'] == 'CLEAR':
        # Proceed to next step: action classification (certain vs uncertain)
        return handle_clear_action(interpretation, world_state)
    
    elif interpretation['understanding'] == 'AMBIGUOUS':
        # Need clarification from player
        return handle_ambiguous_action(interpretation, world_state)
    
    elif interpretation['understanding'] == 'GIBBERISH':
        # Gentle confusion response
        return handle_gibberish_action(interpretation)
    
    else:
        # Fallback: treat as ambiguous
        log_warning(f"Unexpected understanding type: {interpretation['understanding']}")
        return handle_ambiguous_action(interpretation, world_state)
```

---

#### Clarification Flow

```python
def handle_ambiguous_action(interpretation, world_state):
    """
    Player input was ambiguous. Ask for clarification.
    """
    
    ambiguity_type = interpretation['ambiguity_type']
    
    # Format clarification based on type
    if ambiguity_type == 'TYPO_SUSPECTED':
        # Simple confirmation
        response = format_typo_clarification(interpretation)
        # Example: "Did you mean Marcus?"
    
    elif ambiguity_type == 'MULTIPLE_MATCHES':
        # List options
        response = format_multiple_choice_clarification(interpretation)
        # Example: "Who do you mean?\n1) Marcus\n2) John"
    
    elif ambiguity_type == 'UNCLEAR_REFERENCE':
        # Open-ended clarification
        response = format_open_clarification(interpretation)
        # Example: "Who are you referring to?"
    
    elif ambiguity_type == 'NONEXISTENT_ENTITY':
        # Suggest alternatives or ask for rephrasing
        response = format_nonexistent_clarification(interpretation, world_state)
        # Example: "I don't see that here. Available objects: gun, wallet, phone."
    
    else:
        # Generic clarification
        response = interpretation['clarification_question']
    
    return {
        'type': 'CLARIFICATION_REQUEST',
        'message': response,
        'interpretation': interpretation,
        'awaiting_player_response': True
    }


def format_typo_clarification(interpretation):
    """Simple yes/no confirmation for suspected typos."""
    suggested = interpretation['possible_interpretations'][0]
    return f"Did you mean {suggested['interpretation']}?"


def format_multiple_choice_clarification(interpretation):
    """Numbered list when multiple entities match."""
    options = interpretation['possible_interpretations']
    
    response = interpretation['clarification_question'] + "\n"
    for i, option in enumerate(options, 1):
        # Extract entity name and descriptor
        entity_info = option['entities'][0]
        response += f"{i}) {entity_info['name']}\n"
    
    return response.strip()


def format_open_clarification(interpretation):
    """Open-ended question when unclear what player means."""
    return interpretation['clarification_question']


def format_nonexistent_clarification(interpretation, world_state):
    """Suggest alternatives when referenced entity doesn't exist."""
    base_question = interpretation['clarification_question']
    
    # Optionally list what IS available
    available_objects = world_state.get_notable_objects_in_scene()
    if available_objects:
        object_list = ", ".join([obj.name for obj in available_objects])
        return f"{base_question}\n\nAvailable: {object_list}"
    
    return base_question


def handle_gibberish_action(interpretation):
    """
    Input appears nonsensical. Gentle confusion response.
    """
    return {
        'type': 'CONFUSION_RESPONSE',
        'message': "I'm not sure I understand. Could you rephrase that?",
        'interpretation': interpretation
    }
```

---

#### Example: Clear Input

```
Player Input: "I slap Olga across the face"

Action Interpreter Output:
{
  "understanding": "CLEAR",
  "action_intent": "physically strike Olga on the face",
  "referenced_entities": [
    {
      "mentioned_as": "Olga",
      "entity_name": "Olga Petrov",
      "entity_id": "npc_olga_001",
      "entity_type": "npc",
      "confidence": 0.98
    }
  ]
}

→ Proceeds to STEP 3: Action Classification
```

---

#### Example: Ambiguous Input (Multiple Matches)

```
Player Input: "I talk to Marcus"

Scene Context:
- Marcus Webb (bouncer) - npc_marcus_001
- Marcus Johnson (patron) - npc_marcus_045

Action Interpreter Output:
{
  "understanding": "AMBIGUOUS",
  "action_intent": "initiate conversation with someone named Marcus",
  "ambiguity_type": "MULTIPLE_MATCHES",
  "ambiguity_explanation": "Two NPCs named Marcus are present",
  "clarification_question": "Which Marcus do you mean?",
  "possible_interpretations": [
    {
      "interpretation": "Talk to Marcus the bouncer",
      "entities": [{"name": "Marcus Webb", "entity_id": "npc_marcus_001"}],
      "confidence": 0.6
    },
    {
      "interpretation": "Talk to Marcus the patron",
      "entities": [{"name": "Marcus Johnson", "entity_id": "npc_marcus_045"}],
      "confidence": 0.4
    }
  ]
}

System Response to Player:
"Which Marcus do you mean?
1) Marcus Webb (bouncer)
2) Marcus Johnson (patron)"

Player Clarifies: "The bouncer"

→ Resolve to npc_marcus_001
→ Proceeds to STEP 3: Action Classification
```

---

#### Example: Typo

```
Player Input: "I grab the revovler"

Scene Context:
- Revolver present (obj_revolver_001)

Action Interpreter Output:
{
  "understanding": "AMBIGUOUS",
  "action_intent": "pick up the gun",
  "ambiguity_type": "TYPO_SUSPECTED",
  "ambiguity_explanation": "revovler is likely typo for revolver",
  "clarification_question": "Did you mean revolver?",
  "possible_interpretations": [
    {
      "interpretation": "Grab the revolver",
      "entities": [{"name": "revolver", "entity_id": "obj_revolver_001"}],
      "confidence": 0.95
    }
  ]
}

System Response to Player:
"Did you mean revolver?"

Player: "Yes"

→ Resolve to obj_revolver_001
→ Proceeds to STEP 3: Action Classification
```

---

#### Example: Nonexistent Entity

```
Player Input: "I use the quantum destabilizer"

Scene Context:
- No such object exists in scene or inventory

Action Interpreter Output:
{
  "understanding": "AMBIGUOUS",
  "action_intent": "use a device called quantum destabilizer",
  "ambiguity_type": "NONEXISTENT_ENTITY",
  "ambiguity_explanation": "No quantum destabilizer present in scene or inventory",
  "clarification_question": "I don't see a quantum destabilizer. What are you trying to do?",
  "possible_interpretations": []
}

System Response to Player:
"I don't see a quantum destabilizer. What are you trying to do?

Available objects: revolver, wallet, phone"

Player provides clarification or new action
```

---

#### Example: Gibberish

```
Player Input: "asdjkl qwerty zzz"

Action Interpreter Output:
{
  "understanding": "GIBBERISH",
  "action_intent": "unclear - appears to be random keystrokes",
  "gibberish_reason": "Input contains no recognizable words or intent"
}

System Response to Player:
"I'm not sure I understand. Could you rephrase that?"
```

---

#### Decision Point & Flow Control

After reference resolution completes:

- **IF understanding == 'CLEAR':**
  - Entity references resolved to entity_ids
  - Action intent understood
  - → Proceed to STEP 3: Action Classification

- **IF understanding == 'AMBIGUOUS':**
  - Present clarification request to player
  - Wait for player response
  - Re-run Reference Resolution with clarified input
  - → Loop until CLEAR or player gives up

- **IF understanding == 'GIBBERISH':**
  - Request rephrasing from player
  - Wait for new input
  - → Return to STEP 1 (new input)

- **IF new entity needed (not in world state but valid for creation):**
  - Flag for lazy generation (Section 4.4)
  - Entity will be created before consequence generation
  - → Continue to STEP 3

---

**Validation Requirements:**

1. **Never hallucinate entities** - Only reference entities that exist in world state or can validly be created
2. **Always provide structured output** - JSON format required, validate schema
3. **Prefer clarification over guessing** - When confidence < 80%, mark AMBIGUOUS
4. **Handle edge cases gracefully** - Typos, pronouns, partial names all get appropriate handling
5. **Maintain conversation context** - Use last 5 turns to resolve pronouns ("him", "it", "there")

---

**Integration with World State:**

Reference Resolution queries world state for:
- Current location entities
- Player inventory
- Recent conversation context
- NPCs present in scene
- Objects in scene
- Active opportunities (may reference entities)

All queries go through World State Database (Section 4.1) - single source of truth.

---

---


---

### 9.2 Action Classification (Full Implementation)

**Extracted from Section 6.5 STEP 3**

**STEP 3: Action Classification (Certain vs Uncertain)**

**Component:** Action Classifier  
**Input:** Resolved action from STEP 2  
**Output:** Classification flag (CERTAIN or UNCERTAIN) + routing decision

**Purpose:** Determines whether an action's outcome is predictable (CERTAIN) or requires probabilistic consequence generation (UNCERTAIN). This classification affects how the action is processed and how time is tracked.

**Core Principle:** ~95% of actions are CERTAIN (outcome is obvious and predetermined). ~5% are UNCERTAIN (outcome genuinely unclear, needs consequence generation).

---

#### Classification Framework

**CERTAIN Actions:**
- Outcome is mechanically predetermined
- No meaningful probability distribution needed
- World state changes are straightforward
- Examples: "look around", "pick up object", "walk to door", "read note", "check inventory"

**UNCERTAIN Actions:**
- Outcome depends on multiple factors with genuine uncertainty
- Requires consequence generation with probability distribution
- Examples: "persuade NPC", "fight opponent", "hack computer", "seduce target"

---

#### Classification Criteria

**An action is CERTAIN if:**

1. **Pure observation** (no world state change)
   - "Look around"
   - "Examine the painting"
   - "Read the note"
   - "Check my inventory"

2. **Trivial physical action** (no resistance, no skill check)
   - "Pick up the pen" (assuming it's accessible)
   - "Walk to the door" (no obstacles)
   - "Sit down in the chair"
   - "Open the unlocked drawer"

3. **Social action with predetermined response** (NPC has no meaningful choice)
   - "Say hello" → NPC acknowledges (outcome: greeting exchanged)
   - "Order coffee" at cafe → Barista prepares it (outcome: coffee ordered)
   - "Ask for directions" → Person gives or refuses (trivial fork)

4. **Travel between known locations** (no encounter rolls)
   - "Go to my apartment"
   - "Drive to the office"
   - "Walk to the park"

5. **Information retrieval** (no skill check required)
   - "Call my voicemail"
   - "Check my email"
   - "Look up on Google"

**An action is UNCERTAIN if:**

1. **Opposed action** (another entity actively resists)
   - "Punch Marcus" → Marcus might dodge, block, counter
   - "Persuade Sarah to help" → Sarah weighs decision
   - "Sneak past the guard" → Guard might notice

2. **Skill check with meaningful failure** (outcome varies significantly)
   - "Hack the computer" → Might succeed, fail, or trigger alarm
   - "Pick the lock" → Might open, break lock, or trip alarm
   - "Charm the bouncer" → Might work, fail, or offend

3. **Complex social interaction** (NPC has genuine choice with stakes)
   - "Ask Marcus to betray his boss" → Serious decision for Marcus
   - "Propose partnership to rival" → Complex weighing of factors
   - "Threaten the informant" → Could submit, resist, or flee

4. **Dangerous physical action** (injury possible)
   - "Jump across the gap"
   - "Climb the fire escape"
   - "Drive at high speed through traffic"

5. **Action with significant stakes** (failure has consequences)
   - "Lie to the detective"
   - "Bluff in poker game"
   - "Make the pitch to investors"

---

#### Implementation: Classification Prompt

```
You are classifying player actions for an interactive fiction engine.

PLAYER ACTION: "{resolved_action}"

CONTEXT:
Player: {player_state}
Target: {target_state if applicable}
Location: {location_state}
Action Description: {action_description}

Your task: Classify this action as CERTAIN or UNCERTAIN.

CERTAIN = Outcome is mechanically obvious, no probability distribution needed
- Pure observation
- Trivial physical action (no resistance)
- Simple social exchange (predetermined response)
- Information retrieval
- Uncontested travel

UNCERTAIN = Outcome depends on factors with genuine uncertainty
- Opposed action (entity resists)
- Skill check with meaningful failure states
- Complex social decision
- Dangerous physical action
- Significant stakes

OUTPUT AS JSON:
{
  "classification": "CERTAIN" | "UNCERTAIN",
  "reasoning": "brief explanation of why",
  "outcome_if_certain": "what happens (if CERTAIN)",
  "factors_if_uncertain": ["list", "of", "uncertain", "factors"]
}

CRITICAL: Default to CERTAIN unless there's genuine uncertainty. ~95% of actions should be CERTAIN.
```

---

#### Routing Based on Classification

```python
def classify_action(resolved_action, world_state):
    """
    Classify action as CERTAIN or UNCERTAIN.
    """
    prompt = ACTION_CLASSIFICATION_PROMPT.format(
        resolved_action=resolved_action,
        player_state=world_state.player,
        target_state=world_state.get_entity(resolved_action.target_id) if resolved_action.target_id else None,
        location_state=world_state.current_location,
        action_description=resolved_action.description
    )
    
    response = llm_call(prompt, temperature=0.2, response_format="json")
    classification = parse_json(response)
    
    return classification


def route_action(resolved_action, classification, world_state):
    """
    Route action to appropriate processing path.
    """
    if classification['classification'] == 'CERTAIN':
        # CERTAIN PATH
        return process_certain_action(resolved_action, classification, world_state)
    else:
        # UNCERTAIN PATH
        return process_uncertain_action(resolved_action, classification, world_state)
```

---

#### CERTAIN Action Processing

```python
def process_certain_action(resolved_action, classification, world_state):
    """
    Process action with predetermined outcome.
    Skips Consequence Engine entirely.
    """
    
    # 1. Extract predetermined outcome
    outcome = {
        'type': 'CERTAIN',
        'result': classification['outcome_if_certain'],
        'world_state_changes': derive_changes_from_certain_outcome(
            resolved_action, 
            classification['outcome_if_certain'],
            world_state
        )
    }
    
    # 2. Apply world state changes directly
    world_state.apply_changes(outcome['world_state_changes'])
    
    # 3. Log event
    event_logger.log_event(
        turn=world_state.current_turn,
        action=resolved_action,
        outcome=outcome,
        certainty='CERTAIN'
    )
    
    # 4. Estimate time (use Time Estimator for certain actions)
    time_elapsed = estimate_certain_action_time(resolved_action, world_state)
    world_state.advance_time(time_elapsed)
    
    # 5. Skip to narration (no consequence generation needed)
    return {
        'outcome': outcome,
        'time_elapsed': time_elapsed,
        'skip_consequence_engine': True
    }
```

---

#### UNCERTAIN Action Processing

```python
def process_uncertain_action(resolved_action, classification, world_state):
    """
    Process action that requires probabilistic consequence generation.
    Proceeds through full Consequence Engine pipeline.
    """
    
    # Flag for Consequence Engine
    return {
        'resolved_action': resolved_action,
        'classification': 'UNCERTAIN',
        'uncertain_factors': classification['factors_if_uncertain'],
        'proceed_to_consequence_engine': True
    }
    
    # → Continue to STEP 4: World State Query
    # → Then STEP 5: Consequence Engine
```

---

#### Time Handling Integration

**CERTAIN actions:** Time estimated by **Time Estimator** (Section 6.6)
```python
def estimate_certain_action_time(action, world_state):
    """
    Deterministic time estimation for certain actions.
    """
    action_type = action.type
    
    if action_type == 'OBSERVE':
        return minutes(1)  # Looking around takes ~1 minute
    
    elif action_type == 'TRAVEL':
        distance = calculate_distance(action.origin, action.destination)
        return estimate_travel_time(distance, world_state.transportation_mode)
    
    elif action_type == 'TRIVIAL_PHYSICAL':
        return seconds(30)  # Pick up object, sit down, etc.
    
    elif action_type == 'SIMPLE_SOCIAL':
        return minutes(2)  # Brief exchange
    
    elif action_type == 'INFORMATION_RETRIEVAL':
        return minutes(3)  # Check email, make call, etc.
    
    else:
        return minutes(2)  # Default: 2 minutes
```

**UNCERTAIN actions:** Time determined by **Consequence Engine** (generates it as part of outcome)
```python
# Consequence Engine includes time_elapsed in generated outcome:
{
  "outcome": "slap_connects",
  "time_elapsed_minutes": 0.5,  # Generated by LLM as part of consequence
  ...
}
```

---

#### Examples

**Example 1: CERTAIN → "Look around"**

```
Player Input: "I look around the bar"

Classification:
{
  "classification": "CERTAIN",
  "reasoning": "Pure observation, no uncertainty",
  "outcome_if_certain": "Player observes the bar environment"
}

Processing:
→ Skip Consequence Engine
→ Time Estimator: 1 minute
→ Query current location for description
→ Generate narration directly

Narration:
"The Dirty Ditch is crowded tonight. Dim lighting, moderate noise level. 
You spot Marcus at the bar, Olga in the corner booth, and Frank wiping down glasses."

Time Advanced: 1 minute
```

**Example 2: CERTAIN → "Pick up the revolver"**

```
Player Input: "I pick up the revolver from the table"

Classification:
{
  "classification": "CERTAIN",
  "reasoning": "Trivial physical action, object is accessible, no resistance",
  "outcome_if_certain": "Player takes possession of revolver"
}

Processing:
→ Skip Consequence Engine
→ World State Change: Move obj_revolver_001 from loc_table_003 to player_inventory
→ Time Estimator: 30 seconds
→ Generate narration

Narration:
"You reach out and pick up the revolver. Cold steel, heavier than you expected. 
You slide it into your jacket pocket."

Time Advanced: 0.5 minutes
World State Updated: player.inventory += obj_revolver_001
```

**Example 3: UNCERTAIN → "Slap Olga"**

```
Player Input: "I slap Olga across the face"

Classification:
{
  "classification": "UNCERTAIN",
  "reasoning": "Opposed action - Olga can dodge, block, or counter. Outcome genuinely unclear.",
  "factors_if_uncertain": [
    "Olga's reflexes and combat training",
    "Element of surprise",
    "Crowd reaction",
    "Physical positioning"
  ]
}

Processing:
→ Proceed to Consequence Engine (STEP 5)
→ Generate full spectrum of outcomes
→ Include time_elapsed in generated outcomes
→ Probabilistic selection

(Full Consequence Engine pipeline follows - see STEP 5)
```

**Example 4: UNCERTAIN → "Persuade Marcus to betray his boss"**

```
Player Input: "I try to convince Marcus to turn on Volkov"

Classification:
{
  "classification": "UNCERTAIN",
  "reasoning": "Complex social decision with high stakes. Marcus's response depends on relationship, fear of Volkov, potential gain, personal ethics. Genuine uncertainty.",
  "factors_if_uncertain": [
    "Marcus's loyalty to Volkov",
    "Player's relationship with Marcus",
    "Marcus's assessment of risks",
    "What player is offering in return",
    "Marcus's current stress/vulnerability"
  ]
}

Processing:
→ Proceed to Consequence Engine (STEP 5)
→ Generate outcomes ranging from agreement to violent rejection
→ Complex probability weighting based on all factors
→ Consequence Engine determines time based on conversation depth

(Full Consequence Engine pipeline follows)
```

**Example 5: Edge Case → "Order coffee"**

```
Player Input: "I order a coffee at the cafe"

Classification:
{
  "classification": "CERTAIN",
  "reasoning": "Predetermined commercial transaction. Barista will take order and prepare coffee. No meaningful uncertainty.",
  "outcome_if_certain": "Coffee is ordered and will be prepared"
}

Processing:
→ Skip Consequence Engine
→ World State: Add pending_event: "coffee_ready" in 5 minutes
→ Time Estimator: 1 minute (ordering)
→ Generate narration

Narration:
"You order a medium coffee. The barista nods and turns to the espresso machine. 
'Be about five minutes,' she says."

Time Advanced: 1 minute
Pending Event: coffee_ready_at_turn_X

(Next turn, coffee is ready - also CERTAIN outcome)
```

---

#### Validation & Safeguards

**Classification Validation:**
```python
def validate_classification(classification):
    """Ensure classification output is valid."""
    assert classification['classification'] in ['CERTAIN', 'UNCERTAIN']
    assert 'reasoning' in classification
    
    if classification['classification'] == 'CERTAIN':
        assert 'outcome_if_certain' in classification
    else:
        assert 'factors_if_uncertain' in classification
        assert len(classification['factors_if_uncertain']) > 0
```

**Logging for Calibration:**
```python
# Track classification decisions for later review
log_classification(
    action=resolved_action,
    classification=classification,
    timestamp=world_state.current_turn
)

# Periodically review: Are we classifying correctly? 
# Are CERTAIN actions truly certain?
# Are UNCERTAIN actions truly uncertain?
```

---

#### Integration with Section 4.5 (Consequence Engine)

The Consequence Engine (Section 4.5) is **only invoked for UNCERTAIN actions.**

When UNCERTAIN action arrives at Consequence Engine:
1. Use `factors_if_uncertain` to inform outcome generation
2. Generate full outcome spectrum
3. Include `time_elapsed` in each generated outcome
4. Validate and select outcome
5. Apply to world state

When CERTAIN action is processed:
1. Consequence Engine is bypassed entirely
2. Time is estimated deterministically
3. Outcome is applied directly
4. Narration is generated from predetermined result

This is a **major efficiency gain** - 95% of actions skip the most expensive part of the pipeline.

---

**Decision Point & Flow Control:**

- **IF classification == 'CERTAIN':**
  - Process via certain action handler
  - Skip Consequence Engine (STEP 5)
  - Jump directly to NPC Reactions (STEP 9) or Narration if no NPCs affected
  - Time estimated by Time Estimator

- **IF classification == 'UNCERTAIN':**
  - Proceed to STEP 4: World State Query
  - Then STEP 5: Consequence Engine (full pipeline)
  - Time determined by Consequence Engine as part of outcome generation

---


---

### 9.3 Consequence Engine (Full Implementation)

**Extracted from Section 4.5**

**Note:** Section 4.5 provided the conceptual overview. This section contains the complete implementation specification.

### 4.5 Consequence Engine

**Purpose:** Determine realistic outcomes for player actions and generate cascading NPC reactions. Uses structured outcome categories (TTRPG-inspired) with true probabilistic selection independent of LLM biases.

**Core Architecture: Multi-Stage Consequence Resolution**

The Consequence Engine resolves player actions through a series of LLM calls with deterministic dice rolls:

1. **Player Action Outcome** - Does the action succeed? How well?
2. **Target Reaction** - How does the directly affected NPC respond?
3. **Witness Reactions** - How do other named NPCs in scene respond?
4. **Scene Narration** - Compile all outcomes into coherent prose
5. **Ripple Effects** - Update relationships, goals, memories (deterministic)

**IMPORTANT: Routing Based on Action Classification**

The Consequence Engine is **only invoked for UNCERTAIN actions**. CERTAIN actions bypass this entire pipeline (see Section 6.5, STEP 3 for classification details).

---

#### Action Classification Routing

```python
def process_action(resolved_action, world_state):
    """
    Route action based on classification.
    """
    # Classify action (STEP 3 in Section 6.5)
    classification = classify_action(resolved_action, world_state)
    
    if classification['classification'] == 'CERTAIN':
        # CERTAIN PATH: Bypass Consequence Engine
        return process_certain_action(resolved_action, classification, world_state)
    
    else:
        # UNCERTAIN PATH: Full Consequence Engine pipeline
        return invoke_consequence_engine(resolved_action, world_state)
```

**CERTAIN Action Handling** (Skips Consequence Engine):
```python
def process_certain_action(resolved_action, classification, world_state):
    """
    Handle actions with predetermined outcomes.
    No consequence generation needed.
    """
    # Extract predetermined outcome
    outcome = {
        'type': 'CERTAIN',
        'result': classification['outcome_if_certain'],
        'world_state_changes': derive_changes(
            resolved_action, 
            classification['outcome_if_certain']
        )
    }
    
    # Apply directly to world state
    world_state.apply_changes(outcome['world_state_changes'])
    
    # Log event
    event_logger.log_event(
        turn=world_state.current_turn,
        action=resolved_action,
        outcome=outcome,
        certainty='CERTAIN'
    )
    
    # Estimate time deterministically
    time_elapsed = estimate_certain_action_time(resolved_action, world_state)
    world_state.advance_time(time_elapsed)
    
    # Skip to narration (no consequence generation)
    return {
        'outcome': outcome,
        'time_elapsed': time_elapsed,
        'skip_consequence_engine': True
    }
```

**UNCERTAIN Action Handling** (Full Consequence Engine):
```python
def invoke_consequence_engine(resolved_action, world_state):
    """
    Full consequence generation pipeline for uncertain actions.
    Proceeds through all 5 stages.
    """
    # Stage 1: Player Action Outcome (see below)
    action_outcome = generate_action_outcome(resolved_action, world_state)
    
    # Stage 2: Target Reaction (if applicable)
    if resolved_action.has_target:
        target_reaction = generate_target_reaction(
            action_outcome, 
            resolved_action.target, 
            world_state
        )
    else:
        target_reaction = None
    
    # Stage 3: Witness Reactions
    witness_reactions = generate_witness_reactions(
        action_outcome,
        target_reaction,
        world_state
    )
    
    # Stage 4: Scene Narration
    narration = generate_scene_narration(
        action_outcome,
        target_reaction,
        witness_reactions,
        world_state
    )
    
    # Stage 5: Ripple Effects
    ripple_effects = process_ripple_effects(
        action_outcome,
        target_reaction,
        witness_reactions,
        world_state
    )
    
    # Time is generated as part of action_outcome by LLM
    time_elapsed = action_outcome['time_elapsed_minutes']
    world_state.advance_time(minutes(time_elapsed))
    
    return {
        'action_outcome': action_outcome,
        'target_reaction': target_reaction,
        'witness_reactions': witness_reactions,
        'narration': narration,
        'ripple_effects': ripple_effects,
        'time_elapsed': time_elapsed
    }
```

**Distribution of Actions:**
- ~95% of player actions are CERTAIN → Bypass Consequence Engine
- ~5% of player actions are UNCERTAIN → Full Consequence Engine

**Examples:**

**CERTAIN Actions** (bypass Consequence Engine):
- "Look around"
- "Pick up the revolver"
- "Walk to the door"
- "Read the note"
- "Check inventory"
- "Say hello"
- "Order coffee"

**UNCERTAIN Actions** (invoke Consequence Engine):
- "Slap Olga"
- "Persuade Marcus to betray his boss"
- "Hack the computer"
- "Sneak past the guard"
- "Lie to the detective"

---

**Critical Design Principle: LLM Generates, System Decides**

LLMs are pattern-matching engines that unconsciously favor dramatic outcomes. To prevent this bias:
- **LLM provides weighted possibilities** based on world state and entity traits
- **System uses true random selection** (`random.choices()`) to pick outcome
- **Weights are "vibes"** - LLM doesn't need to do math or sum to 1.0
- **Validation filters impossible options** before dice roll


### **Outcome Generation Pattern**

**The Consequence Engine generates weighted outcomes per action, representing the full spectrum of realistic possibilities.**

**Required distribution:**
- Most likely: 35-45%
- Common alternative: 20-25%
- Uncommon but realistic: 10-15%
- Positive surprise: 5-10%
- Negative surprise: 5-10%
- Edge cases: 2-5% each

**This ensures:**
- Variety across multiple actions
- Unpredictability (player can't metagame)
- Both positive and negative surprises occur naturally
- Realistic weight distribution (likely outcomes happen more often)
- World feels alive and dynamic

---

### Stage 1: Player Action Outcome

**Purpose:** Determine if and how well the player's action succeeds.

**TTRPG-Style Outcome Categories:**

```
CRITICAL_SUCCESS    - Exceeds expectations, bonus effects
SUCCESS             - Clean execution, goal achieved
SUCCESS_WITH_COMP   - Goal achieved but creates new problem
PARTIAL_SUCCESS     - Partially works, incomplete result
FAILURE             - Goal not achieved, no additional consequence
FAILURE_WITH_COMP   - Goal fails AND creates new problem  
CRITICAL_FAILURE    - Spectacular disaster, major consequence
```

Each outcome type must be represented, but some may be represented more than once.
**Example**
Acceptable (all are represented, with a few repeating):
CRITICAL_SUCCESS
CRITICAL_SUCCESS
SUCCESS 
SUCCESS_WITH_COMP
PARTIAL_SUCCESS
FAILURE
FAILURE_WITH_COMP
FAILURE_WITH_COMP
CRITICAL_FAILURE

Not Acceptable (not all options are represented):
CRITICAL_SUCCESS
CRITICAL_SUCCESS
SUCCESS 
SUCCESS_WITH_COMP
FAILURE
FAILURE_WITH_COMP
FAILURE_WITH_COMP


**LLM Prompt Structure:**
```
STEP 1: REASONING TRACE (Required - Complete Before JSON Generation)

Analyze the situation thoroughly before generating outcomes. Consider:
- Physics/Feasibility: Did Pre-Action Validation fail? Is the action physically possible?
- NPC Motivations and Psychology: What would each entity realistically do given their traits, goals, and state?
- Narrative Context: What recent events are relevant? What relationships matter?
- Mentions: Are any absent entities being discussed or gossiped about? (Track in 'mentions' field)
- Genre Constraints: What is impossible in this setting?

Write a brief analytical paragraph explaining your reasoning before proceeding to outcome generation.

STEP 2: JSON GENERATION

```
Player attempts: [action description]
Player capabilities: [relevant skills, resources, current state]
Target/Environment: [what they're acting on, difficulty factors]
Context: [location, witnesses, recent events, relationships]

Generate outcome possibilities across the full spectrum from CRITICAL_SUCCESS to CRITICAL_FAILURE.
For each outcome type, specify:
- action: Brief identifier
- type: Outcome category (CRITICAL_SUCCESS, SUCCESS, etc.)
- weight: Relative probability (vibes, doesn't need to sum to 1.0)
- description: What happens
- effects: List of world state changes
- requires: Prerequisites (optional, for validation)

Account for: player capabilities, difficulty, world physics, prerequisites
Weight toward realistic/mundane outcomes unless context justifies drama
Output as JSON.
```

**Example Output (Player slaps Olga):**
```json
{
  "outcomes": [
    {
      "action": "perfect_slap",
      "type": "CRITICAL_SUCCESS",
      "weight": 0.05,
      "description": "Perfect slap, Olga completely stunned",
      "effects": ["olga_dazed_2_turns", "olga_humiliated", "crowd_shocked"],
      "requires": ["conscious", "mobile"]
    },
    {
      "action": "slap_connects",
      "type": "SUCCESS",
      "weight": 0.4,
      "description": "Slap connects cleanly across her cheek",
      "effects": ["olga_hit", "damage_minor", "crowd_attention"],
      "requires": ["conscious", "mobile"]
    },
    {
      "action": "slap_connects_hurt_hand",
      "type": "SUCCESS_WITH_COMPLICATION",
      "weight": 0.25,
      "description": "Slap connects but player hurts hand on her cheekbone",
      "effects": ["olga_hit", "player_hand_injury_minor", "crowd_attention"],
      "requires": ["conscious", "mobile"]
    },
    {
      "action": "glancing_blow",
      "type": "PARTIAL_SUCCESS",
      "weight": 0.15,
      "description": "Glancing blow, Olga saw it coming and turned",
      "effects": ["olga_barely_fazed", "olga_prepared", "crowd_attention"],
      "requires": ["conscious", "mobile"]
    },
    {
      "action": "olga_dodges",
      "type": "FAILURE",
      "weight": 0.1,
      "description": "Olga dodges smoothly, clean miss",
      "effects": ["player_off_balance", "olga_advantage", "crowd_attention"],
      "requires": ["conscious", "mobile"]
    },
	{
	  "action": "slap_connects_olga_retaliates",
	  "type": "FAILURE_WITH_COMPLICATION",
	  "weight": 0.08,
	  "description": "Slap connects but Olga immediately slaps back harder",
	  "effects": ["olga_hit", "player_hit_harder", "crowd_attention", "olga_angry"],
	  "requires": ["conscious", "mobile"]
	},
		{
      "action": "wild_miss_crash",
      "type": "CRITICAL_FAILURE",
      "weight": 0.05,
      "description": "Wild swing, lose balance, crash into nearby table",
      "effects": ["player_prone", "player_injury_minor", "crowd_laughter", "olga_advantage"],
      "requires": ["conscious", "mobile"]
    }
  ]
}
```

**Validation & Selection**

The system uses a hybrid validation approach that preserves valid outcomes while iteratively fixing invalid ones.

**Stage 1: Initial Generation & Validation**

```python
# 1. Generate full spectrum of outcomes
raw_outcomes = llm_generate_outcomes(action, context)

# 2. Validate each outcome
valid_outcomes = []
invalid_outcomes = []

for outcome in raw_outcomes:
    validation_result = consistency_enforcer.validate(outcome, world_state)
    
    if validation_result.passed:
        valid_outcomes.append(outcome)
    else:
        invalid_outcomes.append({
            'outcome': outcome,
            'type': outcome['type'],  # e.g., "FAILURE", "SUCCESS_WITH_COMPLICATION"
            'failure_reason': validation_result.reason,
            'constraints_needed': validation_result.suggested_constraints
        })

# At this point:
# - valid_outcomes: Keep these, they're good
# - invalid_outcomes: Need to regenerate these specific types
```

**Stage 2: Targeted Regeneration (Max 2 Additional Attempts)**

```python
# 3. Attempt to fix invalid outcomes
for attempt in range(1, 3):  # Attempts 2 and 3 (attempt 1 was initial generation)
    if not invalid_outcomes:
        break  # All outcomes now valid!
    
    # Build constraint list from all failure reasons
    accumulated_constraints = []
    for inv in invalid_outcomes:
        accumulated_constraints.extend(inv['constraints_needed'])
    
    # Identify which outcome types need regeneration
    missing_types = [inv['type'] for inv in invalid_outcomes]
    
    # Regenerate ONLY the problematic types
    regenerated = llm_regenerate_specific_types(
        action=action,
        context=context,
        outcome_types=missing_types,
        constraints=accumulated_constraints,
        attempt_number=attempt + 1
    )
    
    # Re-validate the regenerated outcomes
    still_invalid = []
    for outcome in regenerated:
        validation_result = consistency_enforcer.validate(outcome, world_state)
        
        if validation_result.passed:
            valid_outcomes.append(outcome)
        else:
            still_invalid.append({
                'outcome': outcome,
                'type': outcome['type'],
                'failure_reason': validation_result.reason,
                'constraints_needed': validation_result.suggested_constraints
            })
    
    invalid_outcomes = still_invalid

# After all attempts:
# - valid_outcomes: All validated outcomes (from initial + all regeneration attempts)
# - invalid_outcomes: Any that still failed after 3 total attempts
```

**Stage 3: Final Selection**

```python
# 4. Handle edge case: no valid outcomes at all
if not valid_outcomes:
    log_critical_error("No valid outcomes after 3 attempts", {
        'action': action,
        'invalid_outcomes': invalid_outcomes
    })
    return create_generic_fallback(action)

# 5. Check outcome type coverage (warning only, not fatal)
represented_types = {o['type'] for o in valid_outcomes}
required_types = {
    'CRITICAL_SUCCESS', 'SUCCESS', 'SUCCESS_WITH_COMPLICATION',
    'PARTIAL_SUCCESS', 'FAILURE', 'FAILURE_WITH_COMPLICATION',
    'CRITICAL_FAILURE'
}

if not required_types.issubset(represented_types):
    missing_types = required_types - represented_types
    log_warning(f"Missing outcome types: {missing_types}", {
        'action': action,
        'valid_count': len(valid_outcomes),
        'represented_types': represented_types
    })
    # Continue anyway - partial coverage better than total failure

# 6. Probabilistic selection from valid pool
weights = [o['weight'] for o in valid_outcomes]
selected_outcome = random.choices(valid_outcomes, weights=weights, k=1)[0]

# 7. Apply effects to world state
for effect in selected_outcome['effects']:
    world_state.apply_effect(effect)

return selected_outcome
```

**Example: Validation Flow in Action**

```
ATTEMPT 1 (Initial Generation):
──────────────────────────────────────────────────────
Player action: "I slap Olga"

Generated 7 outcomes:
✅ CRITICAL_SUCCESS: "perfect_slap" 
   → Validation: PASS
   
✅ SUCCESS: "slap_connects"
   → Validation: PASS
   
❌ SUCCESS_WITH_COMPLICATION: "slap_connects_tony_intervenes"
   → Validation: FAIL
   → Reason: Entity 'tony' not found in world state
   → Constraint: "Only use entities: npc_olga_001, npc_marcus_001, npc_frank_001"
   
✅ PARTIAL_SUCCESS: "glancing_blow"
   → Validation: PASS
   
❌ FAILURE: "olga_uses_magic_shield"
   → Validation: FAIL
   → Reason: Genre violation (no magic in mundane_earth setting)
   → Constraint: "No magic/supernatural effects - realistic physics only"
   
✅ FAILURE_WITH_COMPLICATION: "miss_hurt_hand"
   → Validation: PASS
   
✅ CRITICAL_FAILURE: "slip_and_fall"
   → Validation: PASS

Valid pool: 5 outcomes
Invalid: 2 outcomes (SUCCESS_WITH_COMPLICATION, FAILURE)


ATTEMPT 2 (Targeted Regeneration):
──────────────────────────────────────────────────────
Regenerate types: [SUCCESS_WITH_COMPLICATION, FAILURE]
Applied constraints:
- "Only use entities: npc_olga_001, npc_marcus_001, npc_frank_001"
- "No magic/supernatural effects - realistic physics only"

Regenerated:
✅ SUCCESS_WITH_COMPLICATION: "slap_connects_marcus_intervenes"
   → Validation: PASS
   → Marcus is valid entity, physically present
   
❌ FAILURE: "olga_teleports_away"
   → Validation: FAIL
   → Reason: Still violating magic constraint
   → Constraint: "Outcome must use mundane dodge/block/duck - no teleportation"

Valid pool: 6 outcomes (added SUCCESS_WITH_COMPLICATION)
Invalid: 1 outcome (FAILURE)


ATTEMPT 3 (Final Regeneration):
──────────────────────────────────────────────────────
Regenerate types: [FAILURE]
Applied constraints:
- "Only use entities: npc_olga_001, npc_marcus_001, npc_frank_001"
- "No magic/supernatural effects - realistic physics only"
- "Outcome must use mundane dodge/block/duck - no teleportation"

Regenerated:
✅ FAILURE: "olga_ducks_clean_miss"
   → Validation: PASS

Valid pool: 7 outcomes (all types represented!)
Invalid: 0 outcomes


SELECTION:
──────────────────────────────────────────────────────
All 7 outcome types present in valid pool.
Weights: [0.05, 0.4, 0.25, 0.15, 0.1, 0.08, 0.05]
Random selection: SUCCESS (weight 0.4)

Outcome: "Slap connects cleanly across her cheek"
Effects applied: ["olga_hit", "damage_minor", "crowd_attention"]
```

**Critical Failure Scenario**

```
WORST CASE: After 3 attempts, still no valid FAILURE outcome

Valid pool: 6 outcomes (missing FAILURE type)

System response:
1. Log warning about missing type
2. Proceed with probabilistic selection from 6 valid outcomes
3. Game continues normally (still have variety)

Note: This is acceptable because:
- Player still gets realistic outcome
- System maintains consistency
- Better to proceed with 6 types than crash or use invalid data
```

**Why This Approach Works**

1. **Preserves Good Work**: Valid outcomes from initial generation aren't discarded
2. **Targeted Efficiency**: Only regenerates problematic types, not everything
3. **Progressive Learning**: Constraints accumulate with each attempt
4. **Graceful Degradation**: Can proceed even if some types remain invalid
5. **Maintains Quality**: Never accepts invalid data into world state
6. **Realistic Expectations**: Acknowledges LLMs will occasionally fail constraints

---

### Context-Aware Weight Assignment

**Critical Principle:** Outcome weights must reflect the COMPLETE situational context, not just generic "someone tries this action" patterns.

The LLM must perform holistic assessment by considering ALL relevant factors together when assigning outcome weights. This prevents pattern-matching that ignores whether the actor is actually equipped for success.

---

#### Required Context for Weight Assignment

The LLM must consider ALL of these factors together (not sequentially):

**1. Actor Capabilities**
- Relevant skills and experience level
- Physical and mental state
- Resources and inventory available
- Prior relevant events and history

**2. Prerequisite Analysis**
- What this action typically requires
- What the actor currently has
- What's missing (skills, resources, knowledge, connections)

**3. Situational Factors**
- Location advantages and obstacles
- Time pressure and constraints
- Witnesses and potential opposition
- Environmental conditions (weather, lighting, noise)
- Available tools and equipment

**4. Relationship Context**
- Target's disposition toward actor
- Witnesses' loyalties and relationships
- Actor's social capital in this context
- Prior interactions relevant to this attempt

**5. Recent Context**
- What just happened in the last few turns
- How recent events create momentum or obstacles
- Emerging patterns that affect this action

---

#### Comprehensive Prompting Structure

**Prompt Template for Outcome Generation:**

```python
def generate_outcome_weights_prompt(action, world_state):
    return f"""
ACTION: {action.description}

ACTOR ASSESSMENT (consider ALL of these together):
├─ Relevant Skills: {action.actor.capabilities}
├─ Experience Level: {action.actor.experience_with_similar_actions}
├─ Physical State: {action.actor.health_status}
├─ Mental State: {action.actor.emotional_state}
├─ Resources Available: {action.actor.inventory}
└─ Prior Relevant Events: {action.actor.relevant_history}

SITUATIONAL FACTORS (these modify difficulty):
├─ Location Advantages: {location.advantages_for_this_action}
├─ Location Obstacles: {location.obstacles_for_this_action}
├─ Time Pressure: {scene.time_constraints}
├─ Witnesses/Opposition: {entities_who_might_interfere}
├─ Environmental Conditions: {weather, lighting, noise, etc}
└─ Available Tools/Equipment: {tools_that_help_or_hinder}

PREREQUISITE ANALYSIS:
This action typically requires:
{list_prerequisites(action.type)}

Actor currently has:
{check_prerequisites(action.actor, action.type)}

Missing prerequisites: {missing_items}
Missing skills: {missing_capabilities}
Missing knowledge: {missing_information}

RELATIONSHIP CONTEXT (affects cooperation/opposition):
├─ Target's disposition toward actor: {relationship_state}
├─ Witnesses' loyalties: {witness_relationships}
├─ Social capital in this context: {actor.reputation_here}
└─ Prior interactions relevant to this: {relevant_relationship_history}

RECENT CONTEXT (what just happened):
{last_5_events_summary}

DIFFICULTY SYNTHESIS:
Given the COMPLETE picture above:
- How difficult is this action for THIS specific person?
- What specific factors make success more/less likely?
- What could go wrong? What could go better than expected?

WEIGHT ASSIGNMENT GUIDANCE:
Base your weights on the FULL analysis above, not just the action name.

For actions where actor is:
- Well-prepared (has prerequisites, skills, favorable conditions): 
  → Success outcomes: 60-80% combined weight
  
- Moderately prepared (has some but not all advantages):
  → Success/Partial success: 40-70% combined weight
  
- Unprepared (missing key prerequisites, unfavorable conditions):
  → Success outcomes: 10-30% combined weight
  → Failure outcomes: 60-80% combined weight
  
- Severely disadvantaged (multiple missing prerequisites, active opposition):
  → Success outcomes: 1-10% combined weight
  → Failure/Critical failure: 80-95% combined weight

CRITICAL: Your weights must reflect the SPECIFIC situation described above,
not a generic "someone tries this action" scenario.

Generate 7 outcomes (CRITICAL_SUCCESS through CRITICAL_FAILURE) with weights
that accurately reflect THIS actor's chances in THIS specific context.

Output as JSON.
"""
```

---

#### Concrete Example: Context Changes Everything

**Action:** "Get a fake passport"

**Scenario A: Unprepared Journalist**
```
ACTOR ASSESSMENT:
├─ Skills: research (expert), writing (expert), investigation (competent)
├─ Criminal skills: none
├─ Resources: $5,000 cash
└─ Connections: journalists, some political contacts

PREREQUISITE ANALYSIS:
Typically requires: criminal connections, knowledge of forgers, significant cash
Missing: criminal connections, knowledge of forgers

RELATIONSHIP CONTEXT:
└─ No connections to criminal underworld

SYNTHESIS: Extremely difficult - no pathway to access forgers

Expected weights:
- CRITICAL_SUCCESS: 0.01
- SUCCESS: 0.02-0.04
- SUCCESS_WITH_COMPLICATION: 0.05-0.08
- PARTIAL_SUCCESS: 0.08-0.12
- FAILURE: 0.50-0.60 (most likely outcome)
- FAILURE_WITH_COMPLICATION: 0.15-0.20
- CRITICAL_FAILURE: 0.03-0.05
```

**Scenario B: Same Journalist, But With Connection**
```
ACTOR ASSESSMENT:
├─ Skills: research (expert), writing (expert), investigation (competent)
├─ Criminal skills: none
├─ Resources: $5,000 cash
└─ Connections: journalists, political contacts

RECENT CONTEXT:
└─ Turn 145: Met underground journalist who mentioned "knowing people"
└─ Turn 156: Built trust with this contact over drinks
└─ Turn 163: Contact hinted they could help with "documents"

RELATIONSHIP CONTEXT:
└─ Underground journalist (trust: medium, willing to help)

SYNTHESIS: Still difficult, but now has actual pathway via trusted contact

Expected weights:
- CRITICAL_SUCCESS: 0.05-0.08
- SUCCESS: 0.12-0.18
- SUCCESS_WITH_COMPLICATION: 0.15-0.20
- PARTIAL_SUCCESS: 0.25-0.30 (contact tries but passport has flaws)
- FAILURE: 0.25-0.35 (contact can't/won't help after all)
- FAILURE_WITH_COMPLICATION: 0.08-0.12
- CRITICAL_FAILURE: 0.02-0.05
```

**Scenario C: Career Criminal**
```
ACTOR ASSESSMENT:
├─ Skills: streetwise (expert), criminal contacts (extensive)
├─ Resources: $5,000 cash
├─ Prior experience: Has obtained fake documents before
└─ Connections: multiple forgers, document specialists

RELATIONSHIP CONTEXT:
└─ Forger "Dmitri" (relationship: business associate, trust: medium)

RECENT CONTEXT:
└─ Turn 201: Dmitri owes actor a favor from previous job

SYNTHESIS: Moderate difficulty - has connections and experience, but still illegal/risky

Expected weights:
- CRITICAL_SUCCESS: 0.08-0.12
- SUCCESS: 0.40-0.50 (straightforward transaction)
- SUCCESS_WITH_COMPLICATION: 0.15-0.25 (works but costs extra/takes time)
- PARTIAL_SUCCESS: 0.08-0.12
- FAILURE: 0.08-0.12 (Dmitri unavailable or unwilling)
- FAILURE_WITH_COMPLICATION: 0.05-0.08
- CRITICAL_FAILURE: 0.01-0.03
```

---

#### Key Prompt Patterns for Holistic Thinking

**Pattern 1: "Consider ALL of these together"**
```
Don't just read the list - SYNTHESIZE the factors.
Missing prerequisites + unfavorable relationships + no relevant skills
= very low success weight
```

**Pattern 2: "For THIS specific person in THIS specific situation"**
```
Not: "Someone tries to get a fake passport" (generic)
But: "Inexperienced journalist with no criminal contacts but $5K tries to get passport"
```

**Pattern 3: "What specific factors make success more/less likely?"**
```
Forces LLM to articulate reasoning:
"Success weight low because: no connections, no experience, no knowledge of process"
```

**Pattern 4: Explicit prerequisite checking**
```
Required: criminal connections, $10K, knowledge of forgers
Has: $5K, journalism skills
Missing: connections, half the money, knowledge

→ This clearly suggests low success probability
```

**Pattern 5: Compare to reference scenarios**
```
If actor had criminal connections and $10K → success weight 0.60
Actor has neither → success weight should be <<0.60
```

---

#### Two-Step LLM Process (Optional Enhancement)

For maximum accuracy, use a two-step approach:

**Step 1: Difficulty Assessment**
```
Given the complete context, assess difficulty as:
- TRIVIAL: Actor is overqualified, has all prerequisites
- EASY: Actor has most prerequisites, favorable conditions  
- MODERATE: Mixed prerequisites and conditions
- DIFFICULT: Missing key prerequisites or unfavorable conditions
- EXTREMELY_DIFFICULT: Missing most prerequisites, active opposition
- NEARLY_IMPOSSIBLE: No realistic pathway to success

Output: difficulty_level + reasoning
```

**Step 2: Weight Generation**
```
Difficulty assessed as: EXTREMELY_DIFFICULT
Reasoning: No criminal connections, no forger knowledge, insufficient funds

Generate weights appropriate for EXTREMELY_DIFFICULT actions:
- Critical success: 0.01-0.02
- Success: 0.03-0.08
- Success with complication: 0.05-0.10
- Partial success: 0.10-0.15
- Failure: 0.60-0.70
- Failure with complication: 0.10-0.15
- Critical failure: 0.02-0.05

Generate specific outcomes matching these weight ranges...
```

This gives the LLM a **reasoning step** before assigning weights, improving accuracy.

---

#### Implementation Notes

**Context Building:**
```python
def build_consequence_context(action, world_state):
    return {
        'actor_capabilities': get_relevant_skills(action.actor, action.type),
        'actor_state': get_physical_mental_state(action.actor),
        'actor_resources': get_inventory(action.actor),
        'prerequisites': get_action_prerequisites(action.type),
        'missing_prerequisites': check_missing(action.actor, action.type),
        'situational_factors': analyze_situation(action.location, action.npcs),
        'relationships': get_relevant_relationships(action.actor, action.targets),
        'recent_events': get_recent_events(world_state, limit=5),
        'environmental': get_environment_modifiers(action.location)
    }
```

**Validation Integration:**
The comprehensive context must be provided to the LLM BEFORE validation, so that:
1. Initial generation already considers full context
2. Fewer outcomes get rejected for being contextually inappropriate
3. Regeneration can inject even more specific constraints if needed

**Critical Takeaway:**
Weight assignment is not about the action in isolation—it's about whether THIS SPECIFIC ACTOR in THIS SPECIFIC SITUATION has the means to succeed.

---

### Stage 2: Target NPC Reaction (If Applicable)

**Purpose:** Generate the immediate reaction of the NPC directly affected by player action.

**Reaction Framework:**

**Intensity Levels:**
- `SUBMIT` - Minimal response, accepts action
- `DE-ESCALATE` - Responds with less intensity than warranted  
- `PROPORTIONAL` - Matches the intensity of player action
- `ESCALATE` - Responds with greater intensity
- `REDIRECT` - Changes the nature of the conflict

**Reaction Types:**
- `PHYSICAL` - Physical action (hit back, draw weapon, flee)
- `VERBAL` - Speech (threaten, plead, insult)
- `SOCIAL` - Appeal to others (call for help, rally allies)
- `TACTICAL` - Strategic positioning (retreat, create distance)
- `EMOTIONAL` - Emotional display (cry, freeze, laugh)

**LLM Prompt Structure:**
```
NPC: [name, traits, current state]
What happened to NPC: [outcome from Stage 1]
NPC's relationship to player: [trust, anger, fear scores, history]
Context: [location, witnesses, NPC's goals, capabilities]

Generate immediate reaction possibilities across intensity spectrum.
For each reaction, specify:
- action: Brief identifier
- intensity: (SUBMIT, DE-ESCALATE, PROPORTIONAL, ESCALATE, REDIRECT)
- type: (PHYSICAL, VERBAL, SOCIAL, TACTICAL, EMOTIONAL)
- weight: Relative probability based on NPC traits and context
- description: What NPC does
- requires: What must be true for this to be possible (e.g., "has_weapon", "conscious")
- creates: New conditions this triggers (e.g., "weapon_drawn", "crowd_panic")

Weight based on: NPC personality, relationship to player, current emotional state, capabilities
Output as JSON.
```

**Example Output (Olga's reaction to being slapped):**
```json
{
  "reactions": [
    {
      "action": "slaps_back_hard",
      "intensity": "PROPORTIONAL",
      "type": "PHYSICAL",
      "weight": 0.45,
      "description": "Immediate physical retaliation, slaps player back",
      "requires": ["conscious", "mobile", "not_restrained"],
      "creates": ["mutual_combat", "crowd_reaction_intensifies"]
    },
    {
      "action": "draws_weapon_threatens",
      "intensity": "ESCALATE",
      "type": "PHYSICAL",
      "weight": 0.3,
      "description": "Pulls concealed pistol, aims at player but doesn't fire",
      "requires": ["has_weapon", "conscious"],
      "creates": ["weapon_drawn", "crowd_panic", "legal_consequences_pending"]
    },
    {
      "action": "verbal_fury",
      "intensity": "PROPORTIONAL",
      "type": "VERBAL",
      "weight": 0.25,
      "description": "Explosive verbal response, curses and threatens",
      "requires": ["conscious"],
      "creates": ["tension_high", "crowd_attention"]
    },
    {
      "action": "frozen_shock",
      "intensity": "SUBMIT",
      "type": "EMOTIONAL",
      "weight": 0.22,
      "description": "Completely unexpected, freezes in shock",
      "requires": ["conscious"],
      "creates": ["moment_of_silence", "crowd_uncertain"]
    },
    {
      "action": "cold_calculated_stare",
      "intensity": "DE-ESCALATE",
      "type": "TACTICAL",
      "weight": 0.07,
      "description": "Silent, calculating response - implied future threat",
      "requires": ["conscious"],
      "creates": ["tension_subtle", "revenge_goal_likely"]
    }
  ]
}
```

**Validation & Selection:**
```python
# 1. Validate requirements
valid_reactions = [r for r in reactions if validate_requirements(r['requires'], olga_state)]
# If Olga has no weapon, "draws_weapon" gets filtered out

# 2. True random selection
selected = random.choices(
    [r['action'] for r in valid_reactions],
    weights=[r['weight'] for r in valid_reactions],
    k=1
)[0]

# 3. Update NPC state based on creates
for condition in selected['creates']:
    world_state.add_condition(olga, condition)
```


---

### Stage 3: Witness Reactions (Named NPCs Only)

**Purpose:** Generate reactions from other named NPCs who are present in the scene.

**Key Principles:**
- **One reaction per named NPC** - Each gets a single LLM call to determine immediate response
- **Nameless NPCs handled by narrator** - Generic crowd behavior described in narration, no individual calls
- **Reactions informed by prior outcomes** - Marcus sees Olga draw weapon, reacts to THAT

**Named vs. Nameless:**
- **Named NPC:** Has entity record, personality traits, relationships → Gets individual reaction call
  - Example: Marcus (bouncer), Frank (bartender)
- **Nameless NPC:** Background scenery, no entity record → Handled collectively by narrator
  - Example: "The crowd scatters", "patrons duck for cover"

**LLM Prompt Structure (per named NPC):**
```
Witness NPC: [name, traits, role, current state]
What witness observed: [action outcome + target reaction from Stages 1-2]
Witness's relationships: [to player, to target, to location]
Context: [witness's goals, capabilities, position in scene]

Generate witness's immediate reaction to what they just saw.
For each reaction possibility, specify:
- action: Brief identifier  
- intensity/type: Same framework as Stage 2
- weight: Based on witness's personality and stake in situation
- description: What witness does
- requires: Prerequisites
- creates: New conditions

Consider: witness's relationship to involved parties, their role (bouncer vs. patron), personal stakes
Output as JSON.
```

**Example: Marcus (bouncer) witnesses weapon being drawn:**
```json
{
  "reactions": [
    {
      "action": "moves_to_intervene",
      "intensity": "PROPORTIONAL",
      "type": "TACTICAL",
      "weight": 0.6,
      "description": "Moves quickly toward conflict, hands up in placating gesture",
      "requires": ["mobile", "conscious"],
      "creates": ["intervening", "approaching_player", "de-escalation_attempt"]
    },
    {
      "action": "draws_own_weapon",
      "intensity": "ESCALATE",
      "type": "PHYSICAL",
      "weight": 0.15,
      "description": "Draws service weapon, orders everyone to freeze",
      "requires": ["armed", "mobile"],
      "creates": ["multiple_weapons_drawn", "security_escalation"]
    },
    {
      "action": "calls_police",
      "intensity": "REDIRECT",
      "type": "SOCIAL",
      "weight": 0.15,
      "description": "Immediately pulls out phone, calls 911",
      "requires": ["has_phone"],
      "creates": ["police_called", "authorities_incoming"]
    },
    {
      "action": "freezes_assessing",
      "intensity": "DE-ESCALATE",
      "type": "TACTICAL",
      "weight": 0.1,
      "description": "Freezes, assesses situation before acting",
      "requires": ["conscious"],
      "creates": ["moment_of_assessment"]
    }
  ]
}
```

**Processing Multiple Witnesses:**

Each named NPC in scene gets their own call, processed sequentially:
```python
named_npcs_in_scene = get_named_npcs(current_location)

witness_reactions = []
for npc in named_npcs_in_scene:
    if npc.id != target.id:  # Don't re-process the target
        reaction_options = llm_generate_witness_reaction(
            npc, 
            action_outcome, 
            target_reaction,
            world_state
        )
        valid_options = validate_reactions(reaction_options, npc, world_state)
        selected = random.choices(valid_options)
        witness_reactions.append((npc, selected))
        apply_reaction(npc, selected, world_state)
```

**Typical scene breakdown:**
- 2-4 named NPCs in scene → 2-4 witness reaction calls
- Dozens of nameless NPCs → handled by narrator, no individual calls

---

### Stage 4: Scene Narration

**Purpose:** Compile all outcomes into coherent, readable prose.

**LLM Prompt Structure:**
```
Compile the following outcomes into natural narrative prose:

Player action outcome: [selected outcome from Stage 1]
Target reaction: [selected reaction from Stage 2]  
Witness reactions: [list of selected witness reactions from Stage 3]
Nameless NPCs present: [count and type, e.g., "~20 bar patrons"]
Location: [current location details]

Create a 2-4 paragraph narration that:
- Flows naturally as continuous action
- Describes player action, immediate result, NPC reactions in sequence
- Includes atmospheric details from location
- Incorporates nameless NPC collective behavior naturally
- Does NOT mention dice rolls, weights, or meta-game elements
- Uses vivid sensory detail appropriate to setting

Output as prose text.
```

**Example Output:**
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

**This is pure narration:**
- No world state changes (already applied in previous stages)
- No validation needed (just describing what already happened)
- No dice roll (just prose generation)

---

### Stage 5: Ripple Effects (Deterministic)

**Purpose:** Update long-term consequences without additional LLM calls.

These are **deterministic state changes** based on what happened:

**Relationship Updates:**
```python
# Olga was slapped
relationships.update(olga, player, {
    'strength': 'hostile',  # Was neutral, now hostile due to assault
    'tags': ['physically_assaulted_me', 'dangerous', 'angry_at'],
    'history': ['Turn 42: Player slapped Olga in bar']
})

# Marcus witnessed player start violence
relationships.update(marcus, player, {
    'strength': 'negative',  # Opinion worsened
    'tags': ['troublemaker', 'witnessed_violence', 'unpredictable'],
    'history': ['Turn 42: Witnessed player slap Olga']
})

# Frank witnessed violence in his bar
relationships.update(frank, player, {
    'strength': 'strained',  # Was neutral/positive (customer), now strained
    'tags': ['caused_violence_in_my_bar', 'unwelcome'],
    'history': ['Turn 42: Started fight in my establishment']
})
```

**Goal Creation:**
```python
# Olga sets revenge goal
goals.create(olga, {
    'type': 'REVENGE',
    'target': player,
    'priority': 'HIGH',
    'created_turn': current_turn
})

# Frank sets avoidance goal
goals.create(frank, {
    'type': 'AVOIDANCE',
    'target': player,
    'action': 'discourage_return',
    'priority': 'MEDIUM'
})
```

**Memory Recording:**
```python
# All present entities remember this event
event = {
    'type': 'violence',
    'description': 'player_slapped_olga',
    'location': current_location,
    'turn': current_turn,
    'participants': [player, olga],
    'witnesses': [marcus, frank, ...nameless...]
}

for entity in present_entities:
    entity.memory.add_event(event)
```

These ripple effects **influence future interactions** but don't require resolution now:
- Olga's REVENGE goal → Opportunity Generator might create revenge scenarios
- Relationship changes → Affect reaction weights in future encounters
- Memories → Provide context for future LLM calls

---

### Complete Action Resolution Flow

**Example: Player slaps Olga in bar**

```
┌─────────────────────────────────────────────────────────────┐
│ Stage 1: Player Action Outcome                              │
├─────────────────────────────────────────────────────────────┤
│ LLM Call #1: Generate outcome possibilities                 │
│ Validation: Filter invalid outcomes                         │
│ Dice Roll: Select "SUCCESS - slap connects"                 │
│ World State: Olga takes minor damage, crowd alerted         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Stage 2: Target Reaction (Olga)                             │
├─────────────────────────────────────────────────────────────┤
│ LLM Call #2: Generate Olga's reaction possibilities         │
│ Validation: Check requirements (has weapon? conscious?)     │
│ Dice Roll: Select "draws_weapon_threatens"                  │
│ World State: Olga's state = weapon_drawn, stance_threatening│
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Stage 3: Witness Reactions (Named NPCs)                     │
├─────────────────────────────────────────────────────────────┤
│ LLM Call #3: Marcus reaction (sees weapon)                  │
│ Dice Roll: "moves_to_intervene"                             │
│ World State: Marcus approaching, intent = de-escalate       │
│                                                              │
│ LLM Call #4: Frank reaction (sees weapon in his bar)        │
│ Dice Roll: "ducks_behind_bar"                               │
│ World State: Frank position = hidden, alert = high          │
│                                                              │
│ Nameless NPCs: No individual calls, handled by narrator     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Stage 4: Scene Narration                                    │
├─────────────────────────────────────────────────────────────┤
│ LLM Call #5: Compile all outcomes into prose                │
│ Output: "You slap Olga... she draws a gun... Marcus moves..." │
│ No world state changes (pure description)                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Stage 5: Ripple Effects (Deterministic)                     │
├─────────────────────────────────────────────────────────────┤
│ Relationships: Olga ← Player (strength: hostile)         │
│ Goals: Olga sets REVENGE goal                               │
│ Memories: All present entities record event                 │
│ No LLM calls, pure state updates                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    STOP - AWAIT PLAYER INPUT
```

**Total LLM Calls: 5**
- 1 for action outcome
- 1 for target reaction  
- 2 for named witness reactions (Marcus, Frank)
- 1 for narration

---

### Special Cases

**No Direct Target (Environmental Action):**
```
Player: "I examine the bookshelf"
- Stage 1: Action outcome (find anything interesting?)
- Skip Stage 2: No target to react
- Skip Stage 3: No witnesses care about examining bookshelf
- Stage 4: Narration of what player finds
- Stage 5: Player memory updated (knows about bookshelf contents)

Total: 2 LLM calls
```

**Failed Action (Nothing Happens):**
```
Player: "I try to pick the lock" → Roll: CRITICAL_FAILURE (break lockpick)
- Stage 1: Break lockpick
- Skip Stages 2-3: No one reacts to failed lock attempt in private
- Stage 4: Narration of attempt and failure
- Stage 5: Player inventory (one less lockpick)

Total: 2 LLM calls
```

**Large Group Confrontation:**
```
Player starts fight in crowded room with 6 named NPCs
- Stage 1: Action outcome
- Stage 2: Target reaction
- Stage 3: 5 witness reactions (5 LLM calls)
- Stage 4: Narration
- Stage 5: Ripple effects

Total: 8 LLM calls (can get expensive for complex scenes)
```

---

### Key Operations

- `generate_action_outcome(player, action, context)` → weighted outcome list
- `generate_npc_reaction(npc, trigger_event, context)` → weighted reaction list
- `validate_options(option_list, entity, world_state)` → filtered valid options
- `dice_roll(valid_options)` → single selected option (using random.choices())
- `compile_narration(outcomes, location, npcs)` → prose text
- `update_ripple_effects(participants, event)` → relationship/goal/memory updates

### Integration Flow

```
PLAYER INPUT (natural language)
    ↓
REFERENCE RESOLVER (convert to entity_ids)
    ↓
┌─────────────────────────────────────────┐
│ CONSEQUENCE ENGINE - Stage 1            │
│ ├─ LLM: Generate action outcomes        │
│ ├─ Validate: Filter impossible options  │
│ └─ Dice: Select outcome                 │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ CONSEQUENCE ENGINE - Stage 2            │
│ ├─ LLM: Generate target reaction        │
│ ├─ Validate: Check requirements         │
│ └─ Dice: Select reaction                │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ CONSEQUENCE ENGINE - Stage 3            │
│ For each named witness:                 │
│ ├─ LLM: Generate witness reaction       │
│ ├─ Validate: Check requirements         │
│ └─ Dice: Select reaction                │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ CONSEQUENCE ENGINE - Stage 4            │
│ └─ LLM: Compile narration (no dice)     │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ CONSEQUENCE ENGINE - Stage 5            │
│ └─ Deterministic: Update relationships, │
│    goals, memories (no LLM)             │
└─────────────────────────────────────────┘
    ↓
WORLD STATE DATABASE UPDATED
    ↓
PRESENT NARRATION TO PLAYER
    ↓
AWAIT NEXT PLAYER INPUT
```

---
---


---

### 9.4 Opportunity Generator (Full Implementation)

**Extracted from Section 4.7**

### 4.7 Opportunity Generator

**Purpose:** Create hooks and narrative possibilities without forcing engagement. Present player with potential avenues for action while respecting player's choice to pursue or ignore.

**Core Principle:** Opportunities are vibes-based, context-sensitive suggestions that emerge naturally from world state. They are NOT quests, NOT mandatory, and ALL expire eventually.

---

#### Responsibilities

- Scan world state for potential player interactions
- Generate based on: player goals, current location, time, active world events
- Produce both mundane and dramatic opportunities with appropriate frequency
- Weight by context and pacing needs
- Present as offers, not mandates
- Track opportunity lifecycle (available, pursuing, resolved, expired)
- **Ensure all opportunities expire** - nothing persists forever

---

#### Opportunity Types

**Conversation Snippets:**
- "You overhear two people discussing a mysterious shipment at the docks"
- Player can: approach them, eavesdrop more, ignore

**Noticed Objects:**
- "You spot a wallet dropped under a table"
- Player can: grab it, examine it, leave it, report it to staff

**Person Approaches:**
- "A nervous-looking woman approaches you"
- Player can: engage, brush off, ask what she wants

**Location Available:**
- "The usually-closed archive room door is ajar"
- Player can: investigate, ignore, report to staff

**Social Opportunities:**
- "Marcus waves you over to his table"
- Player can: join him, wave back but stay put, ignore

**Information Available:**
- "Your phone buzzes with a news alert about city hall scandal"
- Player can: read it, ignore it, save for later

---

#### Opportunity Generation Process

**Triggers:**

1. **Scene Transition** - Player changes location → Generate opportunities for new scene
2. **Time Passage** - Significant time advances → New opportunities emerge, old ones may expire
3. **World State Change** - Major event occurs → Opportunities created in response
4. **Turn Interval** - Every N turns (configurable), check for new opportunities in current scene
5. **Pacing-Driven** - Pacing Monitor requests more/fewer opportunities

**Generation Flow:**

```
TRIGGER OCCURS
    ↓
OPPORTUNITY GENERATOR queries World State:
- Player's current location
- Player's stated goals
- Active world events
- NPCs in proximity
- Time of day / day of week
- Recent player actions
- Current pacing/tension level
    ↓
LLM GENERATION: Create 5-10 potential opportunities
For each, specify:
- type: (conversation, object, person, location, social, information)
- description: What player notices
- context_relevance: How relevant to current context (0.0-1.0)
- goal_relevance: How relevant to player goals (0.0-1.0)
- urgency: How time-sensitive (none, low, medium, high)
- dramatic_weight: How dramatic vs mundane (0.0=mundane, 1.0=dramatic)
    ↓
CLASSIFICATION & FILTERING:
- Classify by dramatic weight (mundane, minor, significant, dramatic)
- Filter by context appropriateness
- Check pacing constraints
- Apply frequency distribution targets
    ↓
SELECT 1-3 opportunities to present this scene
    ↓
FORMAT for Scene Narrator
    ↓
TRACK in opportunity database with expiration conditions
```

---

#### Opportunity Classification

**Classification Framework:**

```python
def classify_opportunity(opportunity):
    """
    Classify opportunity by dramatic weight.
    """
    dramatic_weight = opportunity['dramatic_weight']
    
    if dramatic_weight < 0.3:
        return 'MUNDANE'
    elif dramatic_weight < 0.6:
        return 'MINOR'
    elif dramatic_weight < 0.85:
        return 'SIGNIFICANT'
    else:
        return 'DRAMATIC'
```

**Frequency Distribution Targets:**

```
MUNDANE:      60-70%  (Normal social interactions, routine observations)
MINOR:        20-30%  (Slightly unusual but not dramatic)
SIGNIFICANT:   8-12%  (Clear plot potential if pursued)
DRAMATIC:      2-5%   (High-stakes or urgent, rare)
```

**Examples by Classification:**

**MUNDANE (60-70%):**
- "The barista asks how your day is going"
- "Your spouse mentions needing groceries"
- "You notice the weather is nice today"
- "The TV news is on in the background"

**MINOR (20-30%):**
- "You notice the same car has been parked across the street for three days"
- "An email from a college friend you haven't spoken to in years"
- "You overhear someone mention your workplace"
- "A flyer for a community meeting on your windshield"

**SIGNIFICANT (8-12%):**
- "A former colleague contacts you with a tip about corruption in the mayor's office"
- "You spot your rival meeting with someone unexpected"
- "An opportunity to meet with a key political figure"
- "Evidence of something suspicious at your workplace"

**DRAMATIC (2-5%):**
- "You witness a hit-and-run accident"
- "A known criminal approaches you with a proposition"
- "You discover a body"
- "Someone pulls a gun in the cafe"

---

#### Filtering and Selection

**Contextual Filtering:**

```python
def filter_opportunities(opportunities, context, pacing_state):
    """
    Filter and select opportunities based on context and pacing.
    """
    # 1. Remove contextually inappropriate
    valid = [opp for opp in opportunities if is_contextually_valid(opp, context)]
    
    # 2. Apply pacing adjustments
    if pacing_state.recent_tension > 7:
        # Suppress dramatic, favor mundane
        valid = adjust_weights_toward_mundane(valid)
    elif pacing_state.recent_tension < 3 and pacing_state.stagnation_detected:
        # Slightly boost interesting opportunities
        valid = adjust_weights_toward_interesting(valid)
    
    # 3. Check frequency distribution
    recent_classifications = get_recent_opportunity_classifications(limit=20)
    if count_dramatic(recent_classifications) > 0.05 * len(recent_classifications):
        # Too many dramatic recently, suppress
        valid = suppress_dramatic(valid)
    
    # 4. Select 1-3 opportunities
    selected = weighted_random_select(valid, count=random.randint(1, 3))
    
    return selected
```

**Context Validation:**

```python
def is_contextually_valid(opportunity, context):
    """
    Check if opportunity makes sense in current context.
    """
    # Location check
    if opportunity['type'] == 'person_approaches':
        if context.location_type == 'isolated_wilderness':
            return False  # No one around to approach
    
    # Time check
    if opportunity['type'] == 'phone_call_from_colleague':
        if context.time_of_day == 'middle_of_night':
            return False  # Unrealistic timing (unless urgent)
    
    # Recent opportunity check
    if similar_opportunity_recently_presented(opportunity):
        return False  # Don't repeat same opportunity type too soon
    
    return True
```

---

#### Opportunity Expiration (CRITICAL)

**Core Principle:** ALL opportunities expire. Nothing persists indefinitely. The world moves on.

**Expiration Mechanisms:**

**1. Time-Based Expiration:**
```python
{
  "opportunity_id": "opp_secretary_cafe_001",
  "expires_at_turn": 156,  # Absolute turn number
  "expiry_reason": "Secretary leaves cafe after finishing coffee"
}
```

**2. Action-Based Expiration:**
```python
{
  "opportunity_id": "opp_eavesdrop_conversation_002",
  "expires_when": "conversation_ends",
  "expiry_condition_check": lambda: check_conversation_still_happening()
}
```

**3. Context-Based Expiration:**
```python
{
  "opportunity_id": "opp_ajar_door_003",
  "expires_when": "player_leaves_location",
  "context": "only_available_while_in_building"
}
```

**4. Evolution-Based Expiration:**
```python
# Opportunity doesn't disappear, it evolves into something else
{
  "opportunity_id": "opp_contact_colleague_004",
  "expiry_type": "EVOLUTION",
  "evolution_path": [
    {"turns": 5, "state": "Colleague reaches out again, more insistent"},
    {"turns": 10, "state": "Colleague gives up, stops trying"},
    {"turns": 20, "state": "Colleague shares tip with someone else instead"}
  ]
}
```

**Expiration Estimation:**

When Opportunity Generator creates opportunities, LLM estimates realistic expiration:

```
OPPORTUNITY EXPIRATION PROMPT:

You are estimating how long an opportunity should remain available.

OPPORTUNITY: "{opportunity_description}"
TYPE: {opportunity_type}
CONTEXT: {current_context}

Estimate:
1. How long would this realistically be available?
2. What would cause it to expire?
3. What happens if player ignores it?

OUTPUT AS JSON:
{
  "expires_in_turns": <number>,
  "expiry_reason": "brief explanation",
  "post_expiry_state": "what happens after expiry"
}

GUIDELINES:
- Urgent opportunities: 1-3 turns
- Time-sensitive: 5-10 turns
- Moderate: 10-30 turns
- Persistent but degrading: 30-100 turns
- Nothing lasts forever - even "visit mother" eventually expires (she gets sick, moves, dies, gives up on you)
```

**Example Expirations:**

```
Opportunity: "Secretary at cafe"
→ Expires in 3 turns (finishes coffee and leaves)

Opportunity: "Email from source"
→ Expires in 15 turns (source moves on if no response)

Opportunity: "Meeting at 3pm"
→ Expires at turn corresponding to 3pm

Opportunity: "Investigate suspicious activity at warehouse"
→ Expires in 20 turns (perpetrators finish and leave)

Opportunity: "Call mother back"
→ Expires in 50 turns (mother stops calling if consistently ignored)

Opportunity: "Neighbor's door is ajar"
→ Expires in 2 turns (neighbor closes it)
```

**Opportunity Lifecycle Tracking:**

```python
class OpportunityTracker:
    def __init__(self):
        self.active_opportunities = {}
        self.expired_opportunities = []
        self.resolved_opportunities = []
    
    def add_opportunity(self, opportunity):
        """Register new opportunity with expiration."""
        self.active_opportunities[opportunity.id] = {
            'opportunity': opportunity,
            'created_at_turn': current_turn,
            'expires_at_turn': current_turn + opportunity.expires_in_turns,
            'status': 'AVAILABLE'
        }
    
    def check_expirations(self, current_turn):
        """Check and process expired opportunities."""
        for opp_id, opp_data in list(self.active_opportunities.items()):
            if current_turn >= opp_data['expires_at_turn']:
                # Opportunity has expired
                self.expire_opportunity(opp_id, opp_data)
    
    def expire_opportunity(self, opp_id, opp_data):
        """Handle opportunity expiration."""
        opportunity = opp_data['opportunity']
        
        # Apply post-expiry state to world
        if opportunity.post_expiry_state:
            world_state.apply_changes(opportunity.post_expiry_state)
        
        # Move to expired list
        self.expired_opportunities.append({
            'opportunity': opportunity,
            'expired_at_turn': current_turn,
            'reason': opportunity.expiry_reason
        })
        
        # Remove from active
        del self.active_opportunities[opp_id]
        
        log_info(f"Opportunity expired: {opportunity.description}")
    
    def resolve_opportunity(self, opp_id, resolution):
        """Mark opportunity as pursued/resolved."""
        if opp_id in self.active_opportunities:
            opp_data = self.active_opportunities[opp_id]
            self.resolved_opportunities.append({
                'opportunity': opp_data['opportunity'],
                'resolved_at_turn': current_turn,
                'resolution': resolution
            })
            del self.active_opportunities[opp_id]
```

---

#### Context-Sensitive Generation

**Location-Based:**
- Busy cafe → More people-watching opportunities, overhearing conversations
- Empty street at night → Fewer social opportunities, more environmental
- Government office → Professional interactions, bureaucratic obstacles
- Home → Personal/family opportunities, domestic mundane

**Time-Based:**
- Morning: Routine opportunities, people going to work
- Afternoon: Meetings, appointments, errands
- Evening: Social opportunities, relaxation, bars/restaurants
- Night: Fewer opportunities, different character types, increased danger in some settings

**Goal-Based:**
- Player goal: "run for office" → Opportunities related to networking, fundraising, voter contact
- Player goal: "investigate corruption" → Opportunities for information gathering, meeting sources
- Player goal: "maintain family life" → Opportunities related to spouse, children, home
- No explicit goals → General environmental opportunities

**Event-Based:**
- Ongoing war → Refugees, supply shortages, political tensions
- Festival in town → Crowds, vendors, celebration
- Economic downturn → Job loss, stress, scarcity
- No major events → Normal life opportunities

---

#### LLM Prompt Template

```
You are generating opportunities for an interactive fiction scene.

CONTEXT:
Location: {location_name} ({location_type})
Time: {time_of_day}, {day_of_week}
Player Goals: {player_goals}
Recent Events: {recent_events}
NPCs Present: {npcs_in_scene}
Current Tension Level: {pacing_tension_level}

Generate 5-10 potential opportunities that emerge naturally from this context.

For each opportunity, specify:
{
  "type": "conversation|object|person|location|social|information",
  "description": "What the player notices (1-2 sentences)",
  "context_relevance": 0.0-1.0,  // How well it fits current scene
  "goal_relevance": 0.0-1.0,      // How relevant to player goals
  "urgency": "none|low|medium|high",
  "dramatic_weight": 0.0-1.0,     // 0=mundane, 1=dramatic
  "expires_in_turns": <number>,   // How long until no longer available
  "expiry_reason": "why it expires",
  "post_expiry_state": "what happens if ignored"
}

GUIDELINES:
- Most opportunities should be mundane (dramatic_weight < 0.3)
- Opportunities should feel natural, not forced
- Include mix of immediate (phone rings) and ambient (notice something)
- All opportunities must have expiration - nothing lasts forever
- Expiration should be realistic for the opportunity type
- Consider what happens if player ignores each opportunity

CURRENT TENSION: {tension_level}
- If HIGH (>7): Favor lower dramatic_weight, mundane opportunities
- If LOW (<3): Can include slightly higher dramatic_weight
- If MEDIUM: Balanced mix

OUTPUT VALID JSON ARRAY.
```

---

#### Integration with Other Systems

**From NPC Agency:**
- NPC takes autonomous action → Creates opportunity
- Example: Secretary texts player → Opportunity to respond (expires in 10 turns if ignored)

**From Ambient Events:**
- World event occurs → Creates opportunity
- Example: Power outage → Opportunity to check on elderly neighbor (expires when power restored)

**From World State Changes:**
- Major change → New opportunities emerge
- Example: Player gets promoted → Opportunities related to new responsibilities

**To Pacing Monitor:**
- Reports opportunity types and frequency
- Pacing Monitor adjusts generation parameters
- Feedback loop maintains healthy pacing

**To Scene Narrator:**
- Selected opportunities formatted for natural inclusion in narration
- Woven into scene description, not listed separately

---

#### Key Operations

```python
# Generate opportunities
opportunities = generate_opportunities(
    scene_context=current_scene,
    player_state=player,
    world_state=world_state
)

# Filter by pacing and context
filtered = filter_opportunities(
    opportunities=opportunities,
    context=current_context,
    pacing_state=pacing_monitor.get_state()
)

# Select 1-3 to present
selected = select_opportunities(filtered, count=random.randint(1, 3))

# Track with expiration
for opp in selected:
    opportunity_tracker.add_opportunity(opp)

# Check expirations each turn
opportunity_tracker.check_expirations(current_turn)

# Format for narration
formatted = format_opportunities_for_narration(selected)
```

---

#### Example Scenario

```
Player is at home, evening, goal is "investigate mayor's corruption"

Opportunity Generator queries:
- Location: home (quiet, family present)
- Time: evening (downtime)
- Goals: investigation-related hooks more weighted
- Recent activity: player has been busy all day
- Pacing: Recent tension high (player had confrontation earlier)

LLM generates 8 opportunities:
1. [MUNDANE, 0.2] "Your spouse asks about your day" (expires: 5 turns - conversation ends)
2. [MINOR, 0.4] "You receive an encrypted email from unknown sender" (expires: 15 turns - sender moves on)
3. [MUNDANE, 0.15] "The news is on in the background" (expires: 3 turns - news ends)
4. [SIGNIFICANT, 0.75] "Your phone rings - it's that source who's been avoiding you" (expires: 2 turns - voicemail if missed)
5. [MINOR, 0.35] "You notice a news article about mayoral campaign finances" (expires: 10 turns - article gets buried)
6. [MUNDANE, 0.1] "Your child wants help with homework" (expires: 8 turns - gives up and does it alone)
7. [MINOR, 0.3] "Text from colleague: 'We need to talk'" (expires: 20 turns - colleague talks to someone else)
8. [DRAMATIC, 0.85] "Car pulls up outside, engine idles" (expires: 4 turns - car leaves)

Classification:
- MUNDANE: #1, #3, #6 (3 opportunities)
- MINOR: #2, #5, #7 (3 opportunities)
- SIGNIFICANT: #4 (1 opportunity)
- DRAMATIC: #8 (1 opportunity)

Pacing Filter:
- Recent tension high (7.5/10)
- Suppress DRAMATIC and SIGNIFICANT
- Favor MUNDANE
- Result: Remove #4 and #8 from selection pool

Context Filter:
- Evening at home: All remaining opportunities contextually valid

Frequency Check:
- Recent opportunities: 65% mundane, 30% minor, 5% significant
- Within targets, no adjustment needed

Final Selection (2 opportunities):
- "Your spouse asks about your day" (mundane, family connection, decompression)
- "You receive an encrypted email" (minor, goal-relevant but not urgent, can check later)

Tracking:
- Spouse conversation expires in 5 turns (conversation ends)
- Email expires in 15 turns (sender moves on if ignored)

Suppressed opportunities:
- Phone call (#4) → Source leaves voicemail, tries again tomorrow (lower tension)
- Idling car (#8) → Car drives away after 4 turns, opportunity lost forever
```

---

#### Critical Reminders

1. **All opportunities expire** - Nothing persists indefinitely
2. **Vibes-based selection** - Use LLM for generation, not rigid rules
3. **Pacing-aware** - Adjust to current tension level
4. **Player choice respected** - Never force engagement
5. **Natural presentation** - Woven into narration, not menu options
6. **Evolution over deletion** - Some opportunities evolve rather than disappear
7. **Consequences for ignoring** - World moves on, opportunities go to others

---

---


---

### 9.5 Ambient Event Generator (Full Implementation)

**Extracted from Section 4.8**

### 4.8 Ambient Event Generator

**Purpose:** World continues independent of player action. Events happen around/to player based on location, time, world conditions, and probability.

**Responsibilities:**
- Generate events that occur without player initiation
- Operate on realistic probability distributions (most of the time, nothing remarkable happens)
- Query world state to contextualize probabilities (prior actions affect future likelihoods)
- Create both player-affecting and background events
- Maintain sense that world exists beyond player's immediate perception

**Core Principle:** Drama is the exception, not the baseline. Most events should be mundane.

---

#### Concrete Implementation: Per-Turn Ambient Events

**System Overview:**

Every turn, the system rolls for an ambient event with a simple, flat probability. If triggered, the event's severity is determined, then the LLM generates a contextually appropriate event. Events are woven naturally into narration.

**Key Design Decisions:**

1. **Flat 3% probability per turn** - Simple, predictable, no complex calculations
2. **Three severity tiers** - MINOR (70%), MODERATE (25%), MAJOR (5%)
3. **Does NOT respect player engagement** - Events can interrupt active scenes (realistic)
4. **Woven into narration** - Not separate notifications
5. **Context-aware generation** - LLM creates event appropriate to situation

---

#### Probability System

```python
def check_ambient_event():
    """
    Roll for ambient event occurrence.
    Returns True if event should happen this turn.
    """
    return random.random() < 0.03  # 3% chance per turn
```

**Expected Frequency:**
- 3% per turn = approximately 1 event every 30-35 turns
- Over 100 turns: ~3 events
- Over 1000 turns: ~30 events

**No Special Cases:**
- Same probability whether player is fighting, sleeping, talking, or idling
- Events can interrupt conversations, combat, intimate moments
- World doesn't wait for player convenience

---

#### Severity Determination

If ambient event is triggered:

```python
def determine_event_severity():
    """
    Determine severity tier for ambient event.
    """
    roll = random.random()
    
    if roll < 0.70:
        return 'MINOR'      # 70% of events
    elif roll < 0.95:
        return 'MODERATE'   # 25% of events
    else:
        return 'MAJOR'      # 5% of events
```

**Severity Definitions:**

**MINOR (70%):**
- Background details that don't demand attention
- Easily integrated into ongoing action
- Examples: Rain starts, phone buzzes, door closes, light flickers, bird chirps, distant siren

**MODERATE (25%):**
- Noticeable events that create momentary disruption
- Hard to ignore but doesn't stop current action
- Examples: Lights go out briefly, loud noise from street, someone walks by, weather turns bad, phone rings

**MAJOR (5%):**
- Demands immediate attention
- Hard to continue current action without acknowledging
- Examples: Car crash outside, person bursts in, fire alarm, gunshot nearby, sudden illness

---

#### LLM Event Generation

```python
AMBIENT_EVENT_PROMPT = """
You are generating an ambient event for an interactive fiction scene.

SEVERITY: {severity}
LOCATION: {location.name} ({location.type})
TIME: {current_time}
CURRENT SITUATION: {what_player_is_doing}
RECENT EVENTS: {recent_events_summary}
WEATHER: {current_weather}
NPCs PRESENT: {npcs_in_scene}

Generate an ambient event appropriate to this context and severity level.

SEVERITY GUIDELINES:

MINOR (background detail):
- Doesn't demand attention
- Easily woven into flow
- Examples: rain starts, distant sound, light flickers, wind picks up
- Should feel like natural background texture

MODERATE (noticeable disruption):
- Creates momentary pause or shift
- Noticeable but doesn't force reaction
- Examples: phone rings, lights go out briefly, loud noise, someone walks in
- Can be acknowledged or ignored

MAJOR (demands attention):
- Hard to ignore
- Forces awareness and possible reaction
- Examples: crash outside window, alarm sounds, person in distress, sudden emergency
- Becomes immediate focus of scene

OUTPUT AS JSON:
{
  "description": "brief description of what happens (1-2 sentences)",
  "sensory_details": "what player hears/sees/smells/feels",
  "context_appropriate": true/false
}

CRITICAL:
- Event must fit the current context (location, time, situation)
- Respect severity level - don't escalate MINOR to MODERATE
- Be specific and concrete, not vague
- Consider what's realistic for this setting and time
- Events should feel organic, not forced

OUTPUT VALID JSON ONLY.
"""
```

---

#### Implementation Code

```python
def process_ambient_events(world_state):
    """
    Check for and process ambient events on this turn.
    Called every turn, regardless of player action.
    """
    # Step 1: Check if event occurs
    if not check_ambient_event():
        return None  # No event this turn
    
    # Step 2: Determine severity
    severity = determine_event_severity()
    
    log_info(f"[AMBIENT EVENT] Triggered: {severity}")
    
    # Step 3: Generate event via LLM
    event = generate_ambient_event(world_state, severity)
    
    log_info(f"[AMBIENT EVENT] {severity}: {event['description']}")
    
    return event


def generate_ambient_event(world_state, severity):
    """
    LLM generates contextually appropriate event.
    """
    prompt = AMBIENT_EVENT_PROMPT.format(
        severity=severity,
        location=world_state.location,
        current_time=world_state.current_time,
        what_player_is_doing=get_current_situation(world_state),
        recent_events_summary=format_recent_events(world_state, limit=3),
        current_weather=world_state.weather,
        npcs_in_scene=format_npcs(world_state.npcs_in_scene)
    )
    
    response = llm_call(prompt, temperature=0.7, response_format="json")
    
    return {
        'description': response['description'],
        'sensory_details': response['sensory_details'],
        'severity': severity,
        'timestamp': world_state.current_time,
        'turn': world_state.current_turn
    }


def integrate_with_turn_flow(world_state):
    """
    Integration point in main turn sequence.
    """
    # ... action resolution, time advancement, etc.
    
    # Check for ambient event
    ambient_event = process_ambient_events(world_state)
    
    # Generate narration (includes ambient event if present)
    narration = scene_narrator.generate(
        outcome=action_outcome,
        opportunities=opportunities,
        ambient_event=ambient_event,  # Pass to narrator
        world_state=world_state
    )
    
    return narration
```

---

#### Scene Narrator Integration

Ambient events are woven into narration based on severity:

```python
SCENE_NARRATOR_PROMPT = f"""
Generate natural narrative prose for this scene.

[... existing prompt content ...]

{if ambient_event}:
AMBIENT EVENT TO WEAVE IN:
Description: {ambient_event.description}
Sensory Details: {ambient_event.sensory_details}
Severity: {ambient_event.severity}

Integration guidelines by severity:

MINOR: Brief mention, background detail, doesn't interrupt flow
  Example: "Rain starts pattering against the window as you consider your options."
  
MODERATE: Noticeable detail, creates momentary disruption but player can continue
  Example: "The lights flicker once, twice, then stabilize. Marcus glances up at the ceiling but continues talking."
  
MAJOR: Demands attention, hard to ignore, becomes focus of immediate scene
  Example: "A deafening crash outside cuts you off mid-sentence. Through the window, you see two cars have collided at the intersection."

Weave the event naturally into the prose. Match the severity level - don't downplay MAJOR or overemphasize MINOR.

[... rest of prompt ...]
"""
```

---

#### Example Scenarios

**Scenario 1: No Event (97% of turns)**
```
Turn 42: 
Roll: 0.85 (>0.03, no event)
→ Narration proceeds without ambient event
→ Just player action outcome and opportunities
```

**Scenario 2: MINOR Event**
```
Turn 43:
Roll: 0.01 (<0.03, event triggers)
Severity roll: 0.45 (MINOR, <0.70)

Generated event:
{
  "description": "Rain starts pattering against the window",
  "sensory_details": "Soft rhythm of drops on glass",
  "severity": "MINOR"
}

Narration:
"You settle into the worn barstool, considering Marcus's words. Rain starts 
pattering against the window, a soft rhythm against the glass. He's watching 
you, waiting for your response."

(Event is woven in as background detail)
```

**Scenario 3: MODERATE Event**
```
Turn 120:
Roll: 0.02 (event triggers)
Severity roll: 0.88 (MODERATE, 0.70-0.95)

Generated event:
{
  "description": "The lights flicker and go out. Emergency lighting kicks in after a moment.",
  "sensory_details": "Darkness, then dim red glow. Surprised murmurs from patrons.",
  "severity": "MODERATE"
}

Narration:
"You're about to respond when the lights flicker once, twice, then go out 
completely. There's a moment of darkness before emergency lighting kicks in, 
casting everything in dim red. Around you, patrons murmur in surprise. Marcus 
swears under his breath and heads toward the circuit breaker."

(Event is noticeable, creates context shift)
```

**Scenario 4: MAJOR Event During Active Scene**
```
Turn 205:
Player is mid-conversation with Marcus (ACTIVE engagement)
Roll: 0.01 (event triggers anyway - doesn't respect engagement)
Severity roll: 0.97 (MAJOR, >0.95)

Generated event:
{
  "description": "A deafening crash from outside. Two cars have collided violently at the intersection.",
  "sensory_details": "Metal crumpling, glass shattering, car horn stuck on. Steam rising from hoods.",
  "severity": "MAJOR"
}

Narration:
"Marcus is mid-sentence when a deafening crash from outside cuts him off. 
Through the window, you see two cars have collided violently at the intersection, 
steam rising from crumpled hoods. The blare of a stuck horn fills the air. 
People are already running toward the scene.

Marcus stares out the window. 'Jesus,' he mutters."

(Event interrupts active scene - world doesn't wait for player convenience)
```

**Scenario 5: MAJOR Event Creates Natural Opportunity**
```
Turn 206:
Player's previous action was interrupted by car crash

No new ambient event (97% no event)
But the crash from Turn 205 naturally creates player choices:
- Go outside to help
- Call 911
- Stay inside and watch
- Continue conversation with Marcus as if nothing happened

(Event happened, player decides response - system doesn't track as formal "opportunity")
```

---

#### What This Achieves

✅ **World independence** - Events happen regardless of player engagement  
✅ **Simple probability** - 3% per turn, true RNG, no complex conditions  
✅ **Realistic distribution** - Most events are minor, dramatic events are rare  
✅ **No overwhelming** - ~1 event per 30-35 turns on average  
✅ **Natural variety** - LLM generates contextually appropriate events  
✅ **Player agency preserved** - Events occur, player chooses response  
✅ **Can interrupt** - Major events can break into active scenes (realistic)  
✅ **Woven naturally** - Events integrated into prose, not separate notifications  

---

#### Probability Tiers (General Guidelines):**

**Expected/Mundane (90-95%):**
- Nothing unusual occurs
- Routine events (weather, traffic, normal sounds)
- Expected patterns hold

**Minor Disruptions (4-9%):**
- Phone call
- Weather change
- Neighbor knocking
- Power flicker
- Package delivery
- Pet needs attention

**Significant Events (0.5-1%):**
- Power outage
- Car accident nearby
- Friend visits unexpectedly
- Minor injury
- Equipment breaks
- Argument in adjacent space

**Wild Cards (<0.1%):**
- Meteor strike
- Lottery win
- Celebrity sighting
- Building fire
- Major accident
- Natural disaster (if contextually possible)

**Context Modifies Probabilities:**

**Location:**
- Busy city street → higher probability of encounters, noise, traffic
- Rural village → lower probability of events, quieter
- Government building → security events, bureaucratic interactions
- Home → domestic events, family interactions

**Time:**
- 3 AM → very few events, different types (nocturnal activity)
- 9 AM → commute-related events, business activity
- 6 PM → social events, end-of-day transitions
- Midnight → bar closing, late-night activity

**World Conditions:**
- War ongoing → refugees, supply issues, military presence
- Economic collapse → job loss, desperation, scarcity
- Festival → crowds, celebration, temporary changes
- Winter storm → travel disruption, cold-related events

**Prior Player Actions:**
- Angered gang → higher probability of retaliation attempt
- Befriended neighbor → higher probability of friendly check-in
- Unpaid debts → higher probability of debt collector visit
- Political campaign → higher probability of press contact

**Event Generation Process:**

```
TIME PASSES or SCENE TRANSITION
    ↓
AMBIENT EVENT GENERATOR
    ↓
Query World State:
- Current location
- Time of day
- Active world conditions
- Player's recent actions and relationships
- Historical event patterns for this context
    ↓
Roll for event categories:
- Environmental (weather, infrastructure)
- Social (people interactions)
- Personal (health, belongings)
- World-level (news, large-scale events)
    ↓
For each category, generate specific event or null
    ↓
Does event affect player's immediate environment?
→ Yes: Include in scene narration
→ No: Log silently (might be discovered later)
    ↓
Update World State with event
```

**Example: Player at Home, Evening**

**Context:**
- Location: suburban home
- Time: 8 PM on weeknight
- World: no major events
- Recent actions: player has been investigating politician, made some people nervous

**Event Rolls:**

**Environmental:**
- Power grid event? (1% base) → Roll 0.3 → No event

**Social:**
- Someone at door? (5% base in evening) → Roll 3.2 → Yes
- Who? Context: player being investigated means... watchers? (0.5% vs 4.5% normal visitor)
- Roll 2.1 → Normal visitor: neighbor returning borrowed item

**Personal:**
- Health event? (0.1% base) → Roll 78 → No event

**Technology:**
- Phone call/text? (15% base) → Roll 87 → No event

**World News:**
- Major development? (2% base) → Roll 44 → No event

**Result: One ambient event generated:**
"There's a knock at the door. It's your neighbor Sarah returning the ladder you lent her last week."

**Player can:**
- Answer door, chat with Sarah (new interaction opportunity)
- Ignore knock (Sarah leaves, relationship unaffected)
- Look through peephole first (cautious, given recent stress)

**Off-Screen Events:**

Not every event affects player immediately. Some happen in background:

**Example: Player's colleague gets promoted**
- Event occurs today
- Player doesn't know yet
- When player next contacts colleague → learns about promotion → can respond
- Generates opportunity: congratulate, feel envious, ask for favor

**Example: Senator player met has scandal break**
- News story published
- Player might see news alert (if reading news)
- Or player might hear from friend
- Or player might not learn for days
- But world state updated: senator's reputation damaged

**Cascading Events:**

Some ambient events trigger other events:

```
Power outage (significant event)
    ↓
Triggers:
- Traffic lights out → accidents more likely
- Security systems down → break-ins more likely
- Food spoilage → waste, expense
- Can't work (if computer-dependent)
- Family gathers → social opportunity
```

**NPC Autonomous Actions as Ambient Events:**

NPCs taking actions off-screen can manifest as ambient events:

- Secretary tells Senator about player → affects future senator interaction
- Gang member reports player's location → retaliation event more likely
- Friend worries about player → calls to check in

**Key Operations:**
- `generate_ambient_events(context, time_passed)` → list of events
- `determine_visibility(event, player_location)` → player knows now or discovers later
- `contextualize_probability(base_probability, world_state, history)` → adjusted probability
- `log_event(event, visibility)` → record in world state
- `create_opportunities_from_event(event)` → may generate opportunities

**Integration:**

```
TIME ADVANCES
    ↓
AMBIENT EVENT GENERATOR
(What's happening in the world?)
    ↓
ENTITY VALIDATOR
(Events reference valid entities?)
    ↓
CONSISTENCY ENFORCER
(Events violate world rules?)
    ↓
WORLD STATE DATABASE UPDATE
    ↓
Does event affect player immediately?
→ Yes: Include in scene narration
→ No: Log for potential discovery later
    ↓
OPPORTUNITY GENERATOR
(Does event create new hooks?)
```

**Example: Journalist Campaign Scenario**

Player is typing at computer, working on campaign strategy document.

**Ambient Event Roll:**

Time: 2:30 PM, weekday
Location: home office
Context: player is mid-campaign, made controversial statement last week

**Rolls:**
- Phone call? (10% base) → Roll 7.3 → Yes
- Who? Check player's contacts and recent activity
- Could be: supporter, critic, press, volunteer, unknown
- Context: controversial statement → press more likely
- Result: Local news reporter wants interview about statement

**Event Generated:**
"Your phone rings. The caller ID shows 'Chronicle-Tribune'. It's a reporter."

**Opportunity:**
Player can: answer, ignore, let go to voicemail, answer and decline interview, answer and schedule interview

**World State Impact:**
- If answer: interaction with reporter entity (generate on-demand)
- If ignore: reporter may try again, or may write story without player's input (affects campaign)
- Event logged: reporter contacted player at [timestamp]

**This feels organic because:**
- Event timing makes sense (weekday afternoon, working hours for press)
- Event causally connected to prior action (controversial statement)
- Probability appropriate (not guaranteed, but plausible)
- Player has agency in response
- Consequences flow naturally (ignoring has impact)

---


---

### 9.6 NPC Agency System (Full Implementation)

**Extracted from Section 4.9**

### 4.9 NPC Agency System

**Purpose:** NPCs exist and act when off-screen. They pursue goals, respond to events, and interact with world independent of player observation.

**Responsibilities:**
- Process NPC responses to interactions (what do they do after talking to player?)
- Queue autonomous actions based on NPC goals and world state
- Use lazy evaluation (resolve when relevant, not real-time simulation of all NPCs)
- Track pending actions with trigger conditions
- Generate retroactive causality that's consistent with world state

**Core Principle:** NPCs have lives. Most of what they do is mundane and never seen by player. Occasionally their actions intersect with player in surprising ways.

**Autonomous Action Types:**

**Information Sharing:**
- Tell someone about interaction with player
- Gossip about player's actions
- Report to authority figure
- Spread rumor

**Goal Pursuit:**
- Continue working toward their own objectives
- Make progress on projects
- Seek resources or allies
- Respond to obstacles

**Relationship Maintenance:**
- Contact friends/family
- Attend social obligations
- Repair/maintain relationships
- Form new connections

**Routine Activities:**
- Go to work
- Run errands
- Eat, sleep, travel
- Hobbies and leisure

**Reactive Behaviors:**
- Respond to world events
- Adjust plans based on new information
- Flee danger
- Celebrate good news

**When NPCs Act Autonomously:**

**Immediately After Player Interaction:**
- High priority: fresh context, clear trigger
- Example: Player tells secretary they're running for office → secretary processes this → decides whether to tell senator

**On World Event:**
- Major event triggers NPC responses
- Example: Scandal breaks → NPCs with connections react

**Pending Action Resolution:**
- When player next encounters NPC or related entity
- When time threshold reached
- When trigger condition met

**Background Activity (Low Priority):**
- NPCs with major engagement level have ongoing lives
- Occasional updates to state (job changes, relationship changes)
- Most background activity never surfaces to player

**Lazy Evaluation Strategy:**

**Don't simulate all NPCs all the time.** That's computationally insane and unnecessary.

**Instead:**

**Mark Pending Actions:**
```
npc_secretary_001 has pending action:
- action_type: tell_someone
- target: npc_senator_001
- content: player's campaign pitch
- trigger: end of workday OR senator becomes relevant to player
- probability: 0.85 (likely but not certain)
```

**Resolve When Relevant:**
```
Player gets meeting with senator three days later

System: Check pending actions related to senator
→ Secretary's pending action found
→ Roll probability: 0.85 → Roll 0.62 → ACTION OCCURRED
→ Generate retroactive: "Secretary told senator on Tuesday evening"
→ Senator's knowledge updated: knows about player's campaign
→ Senator's opinion formed (filtered through secretary's framing)

When player meets senator:
→ Senator already knows who player is
→ "I understand you're running for state legislature. Julia mentioned you called."
```

**Player experiences:** Senator already knows about them (realistic, secretary did her job)

**Behind scenes:** Generated retroactively but consistently with world state

**Engagement Level Affects Autonomy:**

**Background NPCs:**
- Minimal autonomous actions
- Only react if directly affected
- Most actions never surface

**Acquaintance NPCs:**
- Occasional autonomous actions
- Might contact player if relevant
- Basic goal pursuit

**Recurring NPCs:**
- Regular autonomous actions
- Actively pursue goals that may intersect player
- Maintain relationships with player and others

**Major NPCs:**
- Rich autonomous behavior
- Complex goal pursuit
- Interact with player and other NPCs frequently
- Can drive subplots

**Example: Secretary's Autonomous Life**

**Background → Acquaintance (after first call):**
- Autonomous actions: Tells senator about call (pending, high probability)
- Nothing else (not important enough yet)

**Acquaintance → Recurring (after several interactions):**
- Autonomous actions:
  - Tells senator about player (completed)
  - Mentions player to coworker (low priority, might not happen)
  - Thinks about player occasionally (no action, just state)

**Recurring → Major (after coffee meetup, personal connection):**
- Autonomous actions:
  - Actively helps player with senate contact (offers advice)
  - Texts player with relevant information
  - Considers player for her own goals (wants to advance career, sees player as potential connection)
  - Might pursue romantic interest (if player signaled openness)
  - Maintains relationship actively (reaches out periodically)

**Causality Chains:**

NPCs acting autonomously create cascading effects:

```
Player calls Senator's secretary
    ↓
Secretary tells Senator (pending action, resolves Tuesday evening)
    ↓
Senator mentions to colleague Wednesday morning
    ↓
Colleague knows player's opponent (relationship exists in world state)
    ↓
Colleague mentions to opponent (pending action, low probability but possible)
    ↓
Opponent learns about player's campaign before public announcement
```

**Player never sees these conversations. But result:**
- Opponent knows about player earlier than expected
- Opponent can prepare countermoves
- Player might notice opponent seems oddly prepared

**This is emergent conspiracy/telephone game effect.**

**Consistency Requirements:**

**When generating retroactive actions:**
- Must be consistent with NPC's state at the time
- Must be consistent with their relationships
- Must be consistent with their knowledge
- Must be consistent with their goals
- Must follow probability (can't retroactively say "definitely happened" if probability was 10%)

**Example:**
```
Player meets Senator Friday
System resolves: "Did secretary tell senator about player?"

Check:
- Secretary's state Tuesday: busy, but player made good impression
- Secretary's goal: please senator, do her job well
- Senator's state: open to hearing about constituents
- Probability: 85%

Roll: 0.23 → Yes, she told him

Generate when: Tuesday evening, end of workday
Generate how: Brief verbal update, framed player positively
```

**Key Operations:**
- `queue_autonomous_action(npc_id, action_type, target, trigger_condition)` → pending action created
- `resolve_pending_actions(context)` → check triggers, roll probabilities, apply or discard
- `generate_retroactive_action(npc_id, timeframe, action)` → create history-consistent action
- `update_npc_state(npc_id, state_changes)` → reflect autonomous activity

**Integration:**

```
PLAYER INTERACTION ENDS
    ↓
NPC AGENCY SYSTEM
(What does NPC do next?)
    ↓
Queue pending action(s) with triggers
    ↓
[Later: Trigger condition met]
    ↓
Resolve pending action:
- Roll probability
- If occurs: Generate specifics (when, how)
- Update world state
- May create consequences or opportunities
    ↓
WORLD STATE DATABASE updated
    ↓
May affect future player interactions
```

---


---

### 9.7 Time & Scene Management (Full Implementation)

**Consolidated from Sections 6.6, 6.7, 6.8, 6.9**

This section consolidates all time tracking and scene management implementation details.

### 6.6 Time Tracking and Advancement

**Core Principle:** Every action advances the world clock. Time is the universal currency of the simulation.

**Time Properties:**
- Measured in minutes (granular enough for meaningful tracking)
- World has single authoritative timestamp
- Each action/event includes `time_elapsed` (in minutes)
- All temporal queries resolve against world clock

**World Clock Structure:**
```javascript
world_state.current_time = "2024-03-15T14:35:00"  // ISO 8601 format
```

**Action Time Assignment:**

Every player action results in time passage. There are two paths for determining duration:

**Path 1: Uncertain Actions (Consequence Engine)**
- Actions with variable outcomes that include skill checks, NPC reactions, meaningful variation
- Examples: persuading someone, combat, risky maneuvers
- LLM determines `time_elapsed` as part of consequence generation
- Duration reflects complexity and outcome quality

**Path 2: Certain Actions (Time Estimator)**
- Actions with predictable outcomes and no meaningful variation
- Examples: walking to bus stop, looking around, waiting
- Simple deterministic calculator estimates duration
- No LLM call required

**Determining Which Path:**

```python
def classify_action(action, world_state):
    # Check if action has uncertain outcomes
    has_skill_check = requires_ability_check(action)
    has_npc_agency = involves_npc_decision(action)
    has_meaningful_failure = could_go_wrong(action)
    
    if has_skill_check or has_npc_agency or has_meaningful_failure:
        return "UNCERTAIN"  # Use Consequence Engine
    else:
        return "CERTAIN"    # Use Time Estimator
```

**Examples of Classification:**

```
UNCERTAIN (Consequence Engine):
- "I try to pick the lock" (skill check, could fail)
- "I ask Marcus about the senator" (NPC might refuse, lie, or share)
- "I climb the fence" (physical challenge, could slip)
- "I negotiate with the dealer" (social outcome varies)

CERTAIN (Time Estimator):
- "I walk to the corner store" (predictable movement)
- "I look around the room" (no variation in outcome)
- "I wait for 30 minutes" (time is the action)
- "I read the posted notice" (information gathering, no check)
```

**Uncertainty Injection:**

To create occasional surprises in routine activities:
- 95% of certain actions: process as certain
- 5% of certain actions: secretly route to Consequence Engine anyway
- Creates moments like: walking to corner store → random encounter

**Time Estimator (for Certain Actions):**

```python
def estimate_time(action, world_state):
    # Simple deterministic calculation
    base_time = get_base_duration(action.type)
    
    # Modifiers
    distance_factor = calculate_distance(action.start, action.end)
    complexity_factor = count_steps(action)
    
    time_elapsed = base_time * distance_factor * complexity_factor
    return time_elapsed
```

**Example:**
```python
action = "Walk to corner store"
base_time = 2 minutes per block
distance = 3 blocks
time_elapsed = 2 * 3 = 6 minutes

world_state.current_time += 6 minutes
```

**Consequence Engine Time Assignment:**

When using Consequence Engine, `time_elapsed` is included in each outcome:

```json
{
  "outcome": "successful_persuasion",
  "type": "SUCCESS",
  "weight": 0.4,
  "description": "Marcus agrees to help after thoughtful conversation",
  "time_elapsed": 12,  // LLM estimates this took ~12 minutes
  "effects": ["marcus_relationship_improved", "information_gained"]
}
```

**LLM Prompt for Time:**
```
Include realistic time_elapsed (in minutes) for this action based on:
- Complexity of the task
- Number of exchanges or steps involved
- Whether complications arise
- Realistic human timing for this activity

Examples:
- Quick conversation: 3-5 minutes
- Detailed negotiation: 10-20 minutes
- Physical fight: 1-3 minutes
- Picking a lock: 2-15 minutes depending on difficulty
- Reading a document: 5-30 minutes depending on length
```

**Time Application:**

```python
# After selecting outcome (either path)
selected_outcome = consequence_engine.resolve(action)
# OR
time_elapsed = time_estimator.calculate(action)

# Update world clock
world_state.current_time += timedelta(minutes=time_elapsed)

# Record in event
event.timestamp = world_state.current_time
event.time_elapsed = time_elapsed
```

**Critical Properties:**
- Time only moves forward (no retcons)
- All entities experience same timeline
- NPCs off-screen remain in pending state until time catches up
- Scene transitions don't skip time unless explicitly traveling

---

### 6.7 Scene Transition Workflow

**Core Principle:** Scene transitions occur when material context changes, not purely based on distance or time.

**What Triggers Scene Transition:**
- Player changes location (enters new building, travels to new area)
- Significant NPC arrival/departure (key person enters/leaves)
- Major context shift (combat ends, time jump requested)
- Player explicitly transitions ("I go home", "I leave the bar")

**What Does NOT Trigger Scene Transition:**
- Movement within same location ("I walk to the other side of the bar")
- Time passage alone (15 minutes at same table = same scene)
- Minor NPC changes (bartender's shift change = background detail)

**Full Scene Transition Workflow:**

```
PLAYER ACTION TRIGGERS SCENE TRANSITION
(e.g., "I leave the bar and go home")
    ↓
1. RESOLVE TIME PASSAGE
   - Calculate total time since last scene
   - Update world clock
    ↓
2. CHECK NPC PENDING ACTIONS
   - Have time triggers been reached?
   - Resolve relevant pending actions
   - Update NPC states
    ↓
3. CHECK OPPORTUNITY EXPIRATIONS
   - Has expires_at timestamp passed?
   - Mark expired opportunities as unavailable
   - Remove from active opportunity list
    ↓
4. GENERATE AMBIENT EVENTS
   - Roll for events proportional to time passed
   - Apply event outcomes to world state
    ↓
5. GENERATE NEW OPPORTUNITIES
   - Based on new location
   - Based on new NPCs present
   - Based on new context
   - Filter by pacing
    ↓
6. FULL ENVIRONMENT NARRATION
   - Describe new scene
   - Introduce present NPCs
   - Highlight available opportunities
    ↓
NEW SCENE BEGINS
```

**Scene Transition Example:**

```
Turn 47: Player at bar with Marcus
action: "I leave and head home"
time: 11:47 PM

TRANSITION WORKFLOW:
──────────────────────────────────────
1. Time Passage:
   - Travel time: 23 minutes (bus + walking)
   - New time: 12:10 AM (next day)

2. Check NPC Pending Actions:
   - Sarah had pending action: "get_fake_passport" (deadline: Turn 50)
   - Time passed: 23 minutes (Turn 47 → 48)
   - Deadline not reached yet → remains pending
   
3. Check Opportunity Expirations:
   - "Overhear two men discussing shipment" (created Turn 42, expires Turn 47)
   - Current turn: 48 → EXPIRED
   - Remove from active opportunities
   
4. Generate Ambient Events:
   - Time passed: 23 minutes
   - Roll for minor events: None occur
   
5. Generate New Opportunities:
   - New location: player's apartment
   - Query: Who's present? What's available?
   - Generated opportunities:
     * Check voicemail (2 new messages)
     * Notice neighbor's door slightly ajar
     * Email notification on laptop (from campaign manager)
     
6. Narration:
   "You unlock your apartment door at 12:10 AM. The place is quiet, just the hum of the refrigerator. The message light on your phone blinks—two new voicemails. As you set down your keys, you notice your neighbor's door across the hall is slightly ajar, which is unusual for this hour. Your laptop on the kitchen table shows an email notification from your campaign manager."
   
NEW SCENE: Player's apartment, 12:10 AM
```

---

### 6.8 Conversation Timing

**Principle:** Multi-turn conversations accumulate time naturally. Each conversational exchange is a turn.

**Multi-Turn Conversations:**
- Each player input during conversation = separate turn
- Each turn advances time (typically 3-10 minutes)
- Time accumulates across conversation turns
- Scene remains active until conversation ends or context shifts

**Determining Timing Path:**

Most conversations use **Consequence Engine** because NPC reactions vary:
- Asking for information (might refuse, lie, or share)
- Persuading or negotiating (could succeed or fail)
- Social dynamics have uncertain outcomes
- NPC has agency in how they respond

Some conversations use **Time Estimator**:
- Pure social pleasantries (predictable, no variation)
- Player just listening to monologue (no agency required)
- Automatic/scripted exchanges

**Example: Extended Conversation**

```
Turn 50: "I ask Marcus about the senator"
→ Consequence Engine (uncertain reaction)
→ Outcome: Marcus shares some info cautiously
→ time_elapsed: 5 minutes
→ Clock: 2:00 PM → 2:05 PM

Turn 51: "I press him on what he really knows"
→ Consequence Engine (could refuse or elaborate)
→ Outcome: Marcus gets defensive, shares reluctantly
→ time_elapsed: 7 minutes
→ Clock: 2:05 PM → 2:12 PM

Turn 52: "I back off and ask about his family instead"
→ Consequence Engine (social redirect, varies)
→ Outcome: Marcus relaxes, opens up
→ time_elapsed: 8 minutes
→ Clock: 2:12 PM → 2:20 PM

Turn 53: "I thank him and leave"
→ Time Estimator (certain pleasantries)
→ time_elapsed: 2 minutes
→ Clock: 2:20 PM → 2:22 PM

Total conversation: 22 minutes
Marcus leaves → Scene transition triggered (key NPC departure)
```

**Scene Continuity During Conversations:**

```python
def check_scene_transition(last_action, current_state):
    # Same location + same key NPCs = same scene
    if location_unchanged and key_npcs_present:
        return False  # Continue scene
    
    # NPC departure or player movement = transition
    if key_npc_departed or player_moved:
        return True  # Trigger transition
```

**Conversation Example Without Transition:**

```
Turn 60-75: Player having dinner with spouse
- 15 turns of conversation
- Total time: 45 minutes (dinner duration)
- Same location (home)
- Same NPC (spouse)
- No scene transition until player/spouse leaves table
```

**Time Realism in Dialogue:**

LLM estimates `time_elapsed` based on dialogue complexity:

```
Short question + short answer: 2-4 minutes
Detailed explanation: 5-10 minutes
Heated argument: 7-15 minutes
Deep philosophical discussion: 15-30 minutes
```

---

### 6.9 Opportunity Expiration

**Core Principle:** All opportunities expire eventually. The world moves on.

**Every Opportunity Has Expiration:**

```javascript
opportunity = {
  id: "opp_shipment_discussion_001",
  description: "Two men discussing a shipment in hushed tones",
  created_at: "2024-03-15T14:20:00",
  created_turn: 42,
  expiration_minutes: 8,  // LLM determines realistic duration
  expires_at: "2024-03-15T14:28:00",
  expires_turn: 47,  // Calculated from expiration_minutes
  status: "active"
}
```

**LLM Determines Duration:**

When Opportunity Generator creates opportunities, LLM estimates realistic expiration:

```
Prompt:
For this opportunity, estimate how long it remains available (in minutes):
- Conversation between NPCs: typically 5-15 minutes
- Physical object in public: hours to days depending on location
- Time-sensitive event: minutes to hours
- Knowledge/contact information: months to years
- Location-based hook: until player leaves area

Consider:
- Nature of opportunity (conversation vs object vs information)
- Location and situation
- NPC involvement and their schedules
- World events and context

Return expiration_minutes as integer.
```

**Example Expirations:**

```javascript
// Conversation opportunity
{
  description: "Two men discussing shipment",
  expiration_minutes: 8
}

// Object opportunity
{
  description: "Wallet dropped on sidewalk",
  expiration_minutes: 180  // 3 hours (until street cleaning or someone finds it)
}

// Information opportunity
{
  description: "You remember Marcus mentioned knowing a forger",
  expiration_minutes: 259200  // 6 months (contact info might change)
}

// Event opportunity
{
  description: "Bar fight starting to escalate",
  expiration_minutes: 3  // Immediate - seconds to act
}
```

**Expiration Check Process:**

At start of each turn:

```python
def check_expiration(opportunities, current_time, current_turn):
    for opp in opportunities:
        if current_time >= opp.expires_at:
            opp.status = "expired"
            remove_from_active_list(opp)
            log_expiration(opp, current_turn)
```

**Expiration in Scene Transitions:**

Scene transitions are prime expiration moments:

```
Turn 42: Opportunity created: "Two men discussing shipment"
         expires_turn: 47 (5 turns / 8 minutes later)

Turn 43: Player talks to bartender (opportunity still active)
Turn 44: Player talks to bartender (opportunity still active)
Turn 45: Player talks to bartender (opportunity still active)
Turn 46: Player leaves bar → Scene transition

SCENE TRANSITION CHECK:
- Current turn: 47
- Opportunity expires_turn: 47
- Status: EXPIRED (men finished conversation and left)
- Remove from available opportunities

Player can no longer act on this opportunity.
```

**No Persistent Opportunities:**

Even knowledge-based opportunities have distant expirations to prevent infinite accumulation:

```javascript
// Knowledge expires eventually
{
  description: "You know where the senator's office is",
  expiration_minutes: 15552000  // 6 months (might relocate)
}

// Contact info expires
{
  description: "You have Sarah's phone number",
  expiration_minutes: 31536000  // 1 year (number might change)
}

// Physical objects expire
{
  description: "Wallet on floor of bar bathroom",
  expiration_minutes: 720  // 12 hours (cleaning crew finds it)
}
```

**Rationale:**

This prevents:
- Infinite opportunity accumulation
- Player hoarding hooks indefinitely
- Static world feel
- Metagaming (saving opportunities for "perfect moment")

**Implementation:**

```python
class Opportunity:
    def __init__(self, description, created_at, created_turn, expiration_minutes):
        self.description = description
        self.created_at = created_at  # ISO timestamp
        self.created_turn = created_turn
        self.expiration_minutes = expiration_minutes
        self.expires_at = self.calculate_expiry(created_at, expiration_minutes)
        self.expires_turn = created_turn + self.estimate_turns(expiration_minutes)
        self.status = "active"
    
    def is_expired(self, current_time):
        return current_time >= self.expires_at
    
    def calculate_expiry(self, start_time, minutes):
        return start_time + timedelta(minutes=minutes)
    
    def estimate_turns(self, minutes):
        # Rough estimate: average 3-5 minutes per turn
        return int(minutes / 4)
```

**Opportunity Lifecycle:**

```
CREATED (Turn 42)
    ↓
ACTIVE (Turns 42-46)
    ↓
CHECK (Turn 47 start)
    ↓
EXPIRED (current_time >= expires_at)
    ↓
REMOVED from active list
    ↓
LOGGED in history (for debugging/analytics)
```

**Player Experience:**

Player learns that opportunities are fleeting:
- Must act on interesting hooks or they disappear
- World feels dynamic and alive
- Creates tension and prioritization
- Rewards player attention and decisiveness

---


---

### 9.8 Scene Narrator (Full Implementation)

**Extracted from Section 4.11**

### 4.11 Scene Narrator

**Purpose:** Present world state and events as prose. Pure presentation layer with no agency over what happens.

**Responsibilities:**
- Convert world state + consequences + opportunities into readable text
- Maintain consistent tone and style appropriate to genre/setting
- Incorporate validated entity references
- Present information from player's perspective
- Make implicit world state explicit (describe what player perceives)

**Critical Constraint:** Narrator CANNOT change world state. It only describes what other systems have determined happened.

**Input:**
- Current world state (location, entities present, player state)
- Selected consequence (what just happened)
- Available opportunities (what player can perceive/act on)
- Recent history (for context and continuity)

**Output:**
- Prose description of scene
- Includes: setting, entities, events, opportunities, player's current state

**Narration Style Considerations:**

**Genre-Appropriate Tone:**
- Mundane Earth: realistic, contemporary, grounded
- High Fantasy: mythic, descriptive, period-appropriate language
- Cyberpunk: tech-heavy, gritty, corporate dystopia
- Urban Fantasy: modern with supernatural undertones

**Perspective:**
- Second person present ("You see...", "You feel...")
- Player's sensory experience and knowledge only
- Cannot reveal information player wouldn't know

**Level of Detail:**
- New location: detailed description
- Familiar location: brief reference unless changed
- New NPC: physical description, initial impression
- Known NPC: name, current state, relationship reminder if relevant

**Efficiency:**
- Don't repeat information player already knows
- Focus on what's changed or newly relevant
- Balance atmosphere with actionable information

**Example Narration Process:**

**Input to Narrator:**
```
Location: The Dirty Ditch (bar in Seattle)
Time: 9:30 PM, Friday
Player state: Tired from campaigning, hungry, moderately stressed
Entities present:
- npc_bartender_001 (Marcus, acquaintance, neutral toward player)
- npc_patron_023 (background, drunk, not engaged)
- npc_patron_024 (background, quiet, reading)
Consequence: Player entered bar (no complications)
Opportunities available:
- Approach Marcus for conversation
- Sit at bar and order food
- Notice patron reading unusual book
Recent event: Player just finished contentious campaign event
```

**Generated Narration:**
```
You push through the door of The Dirty Ditch, the familiar smell of beer and fried food hitting you immediately. It's a typical Friday night—a few regulars scattered around the dim space. Marcus is behind the bar, wiping down glasses. He gives you a brief nod of recognition.

Your feet ache from standing at that campaign event all afternoon, and your stomach reminds you that you skipped dinner. The bar stools look inviting.

In the corner booth, someone sits alone with a book that looks oddly out of place in a dive bar like this—old, leather-bound, pages yellowed. They seem absorbed in it.
```

**Analysis:**
- Sets scene (The Dirty Ditch, physical details)
- Establishes entities (Marcus, patrons)
- Reflects player state (tired, hungry, stressed from campaign)
- Presents opportunities without forcing:
  - Can talk to Marcus
  - Can order food
  - Can investigate mysterious book
  - Can do something else entirely (leave, sit quietly, etc.)

**Entity Reference Validation:**

Before presenting narration:
- All entities mentioned must exist in world state
- Descriptions must match entity records
- No hallucinated details that contradict established facts

**If Validation Fails:**
- Regenerate narration (max 2 attempts)
- If still invalid: sanitize (remove problematic references)
- Ensure player isn't blocked from progressing

**Continuity Maintenance:**

**Narrator has access to:**
- Entity history summaries (for relationship context)
- Recent events (for causality)
- Player's knowledge (what they've learned)
- Established facts (prevent contradiction)

**Example: Returning to Previously Visited Location**
```
First visit: "You enter The Dirty Ditch for the first time. It's exactly as Alex described—a cramped space with scarred wooden tables, neon beer signs flickering on the walls, and the persistent smell of cigarette smoke despite the city-wide ban. A handful of people nurse drinks in the dim light."

Second visit: "You're back at The Dirty Ditch. Marcus is behind the bar again, and tonight the place is busier than last time—nearly every stool is taken."

(No need to redescribe everything, just what's changed and contextually relevant)
```

**Handling Ambiguity:**

If world state is unclear or consequence has multiple interpretations:
- Narrator makes reasonable inference based on context
- Avoids absolute statements when uncertain
- Example: "Marcus seems distracted tonight" (impression) vs "Marcus is thinking about his ex" (internal state narrator can't know)

**Key Operations:**
- `generate_scene_description(world_state, scene_context)` → prose text
- `incorporate_consequence(consequence, previous_narration)` → updated prose
- `present_opportunities(opportunity_list, scene_context)` → woven into description
- `validate_narration_entities(narration_text)` → ensure all references valid

**Integration:**

```
WORLD STATE UPDATED
    ↓
OPPORTUNITY GENERATOR
(what hooks are available)
    ↓
PACING MONITOR
(tension level, tone adjustment)
    ↓
SCENE NARRATOR
- Query world state for current scene
- Incorporate consequences
- Weave in opportunities
- Generate prose
    ↓
ENTITY VALIDATOR (soft validation)
    ↓
PRESENT TO PLAYER
```

---


---

# PART III: DEVELOPMENT & REFERENCE

---

### 9.9 Entity Instantiation System (STEP 2.5 Implementation)

**Purpose:** Create minimal viable entity (MVE) records on-demand when player references entities that don't yet exist in the database.

**Location in Turn Sequence:** Between STEP 2 (Reference Resolution) and STEP 3 (Action Classification)

**Problem Solved:** Cannot process an action against a ghost. The Consequence Engine needs valid entity stats to calculate against. If player says "I attack the bodyguard" but no bodyguard entity exists, we must create a skeleton record BEFORE the Consequence Engine runs.

---

#### When Entity Instantiation Triggers

**Trigger Conditions:**

1. **Reference Resolution returns descriptor without entity_id**
   - Player: "I talk to the bartender"
   - Reference Resolution: No bartender entity exists at location
   - Output: `{ type: "descriptor", value: "bartender", needs_instantiation: true }`

2. **Player references unnamed role/position**
   - "the bouncer", "a waiter", "the manager", "someone guarding the door"

3. **LLM-generated consequence references new entity**
   - Consequence Engine generates "Marcus calls his bodyguard"
   - Bodyguard doesn't exist yet → instantiate before applying consequence

**DO NOT Trigger When:**
- Entity already exists in database
- Reference is to abstract concept not entity ("the government", "justice", "love")
- Reference is to player themselves
- Reference is ambiguous and needs clarification first

---

#### Instantiation Process

**Input:**
- Descriptor: "the bodyguard", "a waiter", "the bartender"
- Location context: current location entity + atmosphere + notable_features
- Scene context: other entities present, recent events

**Output:**
- New entity_id: `npc_bodyguard_temp_001`
- Minimal entity record inserted into database
- Updated action structure with concrete entity_id

---

#### Skeleton Generation Prompt

```
[LLM PROMPT: ENTITY SKELETON GENERATION]

Generate a minimal viable entity for this descriptor in the current context.

DESCRIPTOR: "{descriptor}"
LOCATION: {location_name} ({location_type})
ATMOSPHERE: {location_atmosphere}
PRESENT ENTITIES: {list_of_other_entities}
GENRE: {genre_setting}

Generate ONLY these fields - we'll flesh out details later through interaction:

Required fields:
- name: Full name or role-based name (e.g., "Frank the bartender", "Viktor (bodyguard)")
- traits.appearance: One sentence physical description
- traits.personality: 2-3 adjectives
- capabilities: {skill_name: proficiency_level} for role-relevant skills only
- health_status: "healthy" unless context suggests otherwise
- state: Current emotional/mental state based on context
- current_location: {current_location_id}

Return as JSON:
{
  "name": "...",
  "traits": {
    "appearance": "...",
    "personality": "..."
  },
  "capabilities": {
    "skill_name": "proficiency"
  },
  "health_status": "...",
  "state": "..."
}

IMPORTANT:
- Make details consistent with location and genre
- Don't invent plot-significant backstory (leave blank)
- Focus on immediate observable traits
- Role-appropriate capabilities only
```

---

#### Database Insertion

```python
def instantiate_entity(descriptor, location, context):
    """
    Create minimal viable entity from descriptor.
    """
    # 1. Generate skeleton via LLM
    skeleton_data = llm_generate_skeleton(
        descriptor=descriptor,
        location=location,
        context=context
    )
    
    # 2. Create entity_id
    entity_id = generate_entity_id(
        type="npc",
        descriptor=clean_descriptor(descriptor)
    )
    
    # 3. Build complete entity record with defaults
    entity = {
        # Core fields
        "entity_id": entity_id,
        "entity_type": "npc",
        "name": skeleton_data["name"],
        "is_player": False,
        
        # From skeleton
        "current_location": location.entity_id,
        "health_status": skeleton_data["health_status"],
        "capabilities": skeleton_data["capabilities"],
        "traits": skeleton_data["traits"],
        "state": skeleton_data["state"],
        
        # Default fields for new entity
        "inventory": None,
        "constraints": None,
        "goals": None,
        "relationships": [],
        "reputation": None,
        "faction_memberships": None,
        "knowledge": [],
        "beliefs": None,
        "memories": None,
        "event_knowledge": [],
        
        # Interaction tracking
        "simulation_mode": "passive",  # NEW in v3.5
        "engagement_level": "acquaintance",  # Start as acquaintance (player is interacting)
        "last_interaction_timestamp": current_timestamp(),
        "interaction_count": 1,  # This interaction counts
        "history_summary": None,
        "generated_depth": "minimal",
        "generation_context": f"Instantiated from descriptor '{descriptor}' at {location.name}",
        "autonomous_action_frequency": "low"
    }
    
    # 4. Insert into database
    world_state.entities[entity_id] = entity
    
    # 5. Log creation
    log_info(f"Instantiated new entity: {entity_id} ({skeleton_data['name']})")
    
    return entity_id
```

---

#### Integration with Turn Sequence

**Modified STEP 2 (Reference Resolution):**

```python
def resolve_references(player_input, world_state):
    """
    Resolve player references to concrete entity_ids.
    May trigger entity instantiation.
    """
    resolution = reference_resolver.resolve(player_input, world_state)
    
    # Check if any references need instantiation
    for ref in resolution.references:
        if ref.needs_instantiation:
            # STEP 2.5: Instantiate entity
            new_entity_id = instantiate_entity(
                descriptor=ref.descriptor,
                location=world_state.current_location,
                context=world_state
            )
            
            # Update resolution with concrete entity_id
            ref.entity_id = new_entity_id
            ref.needs_instantiation = False
    
    return resolution
```

**STEP 2.5 Flow:**

```
STEP 2: Reference Resolution
    ↓
Check: Does action reference non-existent entity?
    ↓
YES → STEP 2.5: Entity Instantiation
    ├─ Generate skeleton (LLM call)
    ├─ Create entity_id
    ├─ Insert into database
    └─ Update action with entity_id
    ↓
STEP 3: Action Classification
```

---

#### Example Flow

```
Turn 47:

Player input: "I ask the bartender about Olga"

STEP 2: Reference Resolution
→ "I" resolves to player_001
→ "the bartender" → Search location for entity with role="bartender"
→ NOT FOUND
→ Output: {descriptor: "bartender", needs_instantiation: true}
→ "Olga" resolves to npc_olga_001

STEP 2.5: Entity Instantiation
→ Trigger: bartender needs instantiation
→ LLM generates skeleton:
   {
     "name": "Frank Thompson",
     "traits": {
       "appearance": "Burly man in his 50s with graying beard",
       "personality": "gruff, observant, protective of his bar"
     },
     "capabilities": {"bartending": "expert", "intimidation": "competent"},
     "health_status": "healthy",
     "state": "busy but attentive"
   }
→ Create entity_id: npc_bartender_frank_001
→ Insert into database with simulation_mode="passive", engagement_level="acquaintance"
→ Update action: "bartender" → npc_bartender_frank_001

STEP 3: Action Classification
→ Proceeds with valid entity references
```

---

#### Edge Cases

**Multiple Instantiations in Single Turn:**

```
Player: "I ask the bartender if he's seen the bouncer"

STEP 2.5 instantiates:
1. Bartender (doesn't exist)
2. Bouncer (doesn't exist)

Both get skeleton records.
```

**Instantiation During Consequence Resolution:**

```
Consequence Engine generates:
"Marcus calls his bodyguard, who arrives in 2 minutes"

Check: Does bodyguard entity exist?
→ No → Instantiate now
→ Add to pending arrivals list
```

**Re-Instantiation Prevention:**

```python
def instantiate_entity(descriptor, location, context):
    # Check if similar entity already exists
    existing = search_entities_by_role(descriptor, location)
    
    if existing:
        # Don't create duplicate, use existing
        return existing.entity_id
    
    # Proceed with instantiation
    ...
```

---

#### Integration with Engagement System

Instantiated entities:
- Start with `engagement_level="acquaintance"` (not background, since player is interacting)
- Start with `interaction_count=1` (this interaction counts)
- Can progress to "recurring" and "major" through continued interaction
- Start with `generated_depth="minimal"`, increase with engagement

---

#### Validation

After instantiation, validate:
- Entity has valid entity_id
- Entity exists in database
- Entity has all required fields for entity_type="npc"
- Entity location matches current scene
- Entity name and traits are genre-appropriate

If validation fails:
- Log error
- Retry generation (max 2 attempts)
- If all attempts fail: Return generic fallback entity

---

### 9.10 Pre-Action Validation System (STEP 3.5 Implementation)

**Purpose:** Prevent physically impossible "certain" actions by checking feasibility before execution.

**Location in Turn Sequence:** Between STEP 3 (Action Classification) and STEP 4 (World State Query)

**Problem Solved:** Even if an action is theoretically certain (like "walking north"), it must be physically possible in the current world state. Without this check, players could walk through locked doors, pick up fixed objects, or steal items from NPCs without the system catching the impossibility.

---

#### When Pre-Action Validation Triggers

**Validation runs on ALL actions classified as CERTAIN:**
- Movement actions
- Object interaction actions
- Observation actions
- Simple possession actions

**Validation does NOT run on UNCERTAIN actions:**
- UNCERTAIN actions go to Consequence Engine regardless
- Consequence Engine handles feasibility through outcome generation
- Example: "I pick the lock" is UNCERTAIN, so validation is skipped (CE will determine success/failure)

---

#### Validation Checks

**1. Movement Validation**

```python
def validate_movement(action, world_state):
    """
    Check if movement action is physically possible.
    """
    direction = action.parameters.get("direction")  # "north", "door", "window", etc.
    location = world_state.get_entity(world_state.current_location)
    
    # Check if location has defined exits
    if location.exits is None:
        # No exits defined → allow narrative movement (no specific restrictions)
        return ValidationResult.PASS()
    
    # Check if direction exists
    if direction not in location.exits:
        return ValidationResult.FAIL(
            reason=f"No exit '{direction}' from this location",
            suggestion=f"Available exits: {', '.join(location.exits.keys())}"
        )
    
    exit_data = location.exits[direction]
    
    # Check if exit is locked
    if exit_data.get("locked", False):
        return ValidationResult.FAIL(
            reason=f"The {exit_data['type']} to the {direction} is locked",
            suggestion="You might need to unlock it first or find another way"
        )
    
    # Check if exit is hidden and player doesn't know about it
    if exit_data.get("hidden", False):
        player = world_state.get_entity("player_001")
        secret_knowledge_key = f"knows_secret_exit_{direction}_{location.entity_id}"
        
        if secret_knowledge_key not in player.knowledge:
            return ValidationResult.FAIL(
                reason=f"You don't see an exit in that direction",
                suggestion="Try observing the room more carefully"
            )
    
    # All checks passed
    return ValidationResult.PASS()
```

**2. Object Interaction Validation**

```python
def validate_object_interaction(action, world_state):
    """
    Check if object interaction is physically possible.
    """
    object_id = action.target
    obj = world_state.get_entity(object_id)
    
    # Validate based on action type
    if action.verb in ["pick_up", "take", "grab"]:
        return validate_pickup(obj, world_state)
    elif action.verb in ["move", "push", "pull"]:
        return validate_move_object(obj, world_state)
    elif action.verb in ["use", "activate"]:
        return validate_use_object(obj, world_state)
    
    # Default: allow
    return ValidationResult.PASS()

def validate_pickup(obj, world_state):
    """
    Check if object can be picked up.
    """
    # Check physical_state (NEW in v3.5)
    if obj.physical_state == "fixed":
        return ValidationResult.FAIL(
            reason=f"The {obj.name} is fixed in place",
            suggestion="It appears to be permanently attached or too large to move"
        )
    
    if obj.physical_state == "too_heavy":
        player = world_state.get_entity("player_001")
        strength = player.capabilities.get("strength", "average")
        
        if strength in ["weak", "average", "untrained"]:
            return ValidationResult.FAIL(
                reason=f"The {obj.name} is too heavy for you to lift alone",
                suggestion="You might need help or tools to move this"
            )
    
    if obj.physical_state == "hidden":
        player = world_state.get_entity("player_001")
        knowledge_key = f"discovered_{obj.entity_id}"
        
        if knowledge_key not in player.knowledge:
            return ValidationResult.FAIL(
                reason=f"You don't see any {obj.name} here",
                suggestion="Try searching or observing more carefully"
            )
    
    # Check is_held_by (NEW in v3.5)
    if obj.is_held_by is not None:
        holder = world_state.get_entity(obj.is_held_by)
        return ValidationResult.FAIL(
            reason=f"The {obj.name} is currently held by {holder.name}",
            suggestion="You'd need to ask for it or take it from them"
        )
    
    # All checks passed
    return ValidationResult.PASS()
```

**3. Possession Validation**

```python
def validate_possession(action, world_state):
    """
    Check if player can access/possess object.
    """
    object_id = action.target
    obj = world_state.get_entity(object_id)
    
    # Check if object is held by someone else
    if obj.is_held_by is not None and obj.is_held_by != "player_001":
        holder = world_state.get_entity(obj.is_held_by)
        return ValidationResult.FAIL(
            reason=f"{holder.name} currently has the {obj.name}",
            suggestion="You could ask them for it or attempt to take it"
        )
    
    return ValidationResult.PASS()
```

---

#### Validation Result Handling

```python
class ValidationResult:
    def __init__(self, passed, reason=None, suggestion=None, absolute_failure=False):
        self.passed = passed
        self.reason = reason
        self.suggestion = suggestion
        self.absolute_failure = absolute_failure  # NEW: P2 optimization
    
    @staticmethod
    def PASS():
        return ValidationResult(passed=True)
    
    @staticmethod
    def FAIL(reason, suggestion=None):
        """Standard failure - needs Consequence Engine for variation"""
        return ValidationResult(passed=False, reason=reason, suggestion=suggestion, absolute_failure=False)
    
    @staticmethod
    def ABSOLUTE_FAIL(reason, suggestion=None):
        """Absolute failure - deterministic outcome, no variation possible"""
        return ValidationResult(passed=False, reason=reason, suggestion=suggestion, absolute_failure=True)
```

**Absolute Failure Fast-Path (P2 Optimization):**

When a validation failure is deterministic with no meaningful variation (door locked, object doesn't exist), the system can use a fast-path to skip the Consequence Engine:

```python
def validate_movement(action, world_state):
    # ... checks ...
    
    # Check if exit is locked
    if exit_data.get("locked", False):
        return ValidationResult.ABSOLUTE_FAIL(  # Fast-path optimization
            reason=f"The {exit_data['type']} to the {direction} is locked",
            suggestion="You might need to unlock it first or find another way"
        )
```

**Fast-Path Handler:**

```python
def handle_absolute_failure(action, validation, world_state):
    """
    Skip Consequence Engine for deterministic failures.
    Generates simple failure narration directly.
    """
    # Generate simple narration without LLM
    narration = f"{validation.reason}. {validation.suggestion or ''}"
    
    return {
        'type': 'ABSOLUTE_FAILURE',
        'narration': narration,
        'time_elapsed': 0.5,  # Brief attempt
        'state_changes': {}  # No world state changes
    }
```

**When to Use Absolute Failure:**
- Door locked (no variation in outcome)
- Object doesn't exist at location
- Exit doesn't exist in that direction
- Object permanently fixed in place

**When to Use Standard Failure:**
- Object too heavy (variations: drop it, strain back, get help)
- Object held by NPC (variations: ask nicely, attempt theft, intimidate)
- Any failure with multiple plausible outcomes

**Impact:**
- Saves ~70% of tokens on deterministic failures
- Maintains quality for variable failures
- System correctness unchanged

**On Validation PASS:**
- Proceed with original classification (CERTAIN)
- Continue to STEP 4 (World State Query)

**On Validation FAIL:**
- **RECLASSIFY action as UNCERTAIN**
- Set flag: `pre_validation_failed = True`
- Pass `failure_reason` and `suggestion` to Consequence Engine
- Consequence Engine will narrate the failure dramatically

---

#### Integration with Turn Sequence

```python
def process_action_classification(action, world_state):
    """
    STEP 3: Classify action + STEP 3.5: Validate if certain
    """
    # STEP 3: Classification
    classification = action_classifier.classify(action, world_state)
    
    # STEP 3.5: Pre-Action Validation (only for CERTAIN actions)
    if classification == "CERTAIN":
        validation = pre_action_validator.validate(action, world_state)
        
        if not validation.passed:
            # Reclassify as UNCERTAIN due to failed validation
            classification = "UNCERTAIN"
            action.validation_failed = True
            action.validation_failure_reason = validation.reason
            action.validation_suggestion = validation.suggestion
            
            log_info(f"Action reclassified to UNCERTAIN due to validation failure: {validation.reason}")
    
    return classification
```

---

#### STEP 3.5 Flow Diagram

```
STEP 3: Action Classification
    ↓
Classification: CERTAIN or UNCERTAIN?
    ↓
UNCERTAIN → Skip validation, go to STEP 4
    ↓
CERTAIN → STEP 3.5: Pre-Action Validation
    ↓
Validation: PASS or FAIL?
    ↓
PASS → Proceed as CERTAIN
    |   Continue to STEP 4
    ↓
FAIL → Reclassify as UNCERTAIN
    |   Set validation_failed flag
    |   Pass failure_reason to Consequence Engine
    |   Continue to STEP 4
    ↓
STEP 4: World State Query
```

---

#### Example Flows

**Example 1: Movement Through Locked Door (FAIL)**

```
Turn 52:
Player: "I walk through the north door"

STEP 3: Classification
→ "walk through door" = simple movement = CERTAIN

STEP 3.5: Pre-Action Validation
→ Check location.exits["north"]
→ Result: {type: "door", locked: true}
→ Validation FAILS
→ Reason: "The door to the north is locked"

RECLASSIFICATION:
→ Action reclassified to UNCERTAIN
→ validation_failed = True
→ failure_reason = "The door to the north is locked"

STEP 4 & 5: Consequence Engine
→ Receives failure context
→ Generates outcome: "You try the handle, but it won't budge. The door is locked."
→ Narrates failure dramatically instead of system error
```

**Example 2: Picking Up Fixed Object (FAIL)**

```
Turn 67:
Player: "I pick up the statue"

STEP 3: Classification
→ "pick up statue" = simple action = CERTAIN

STEP 3.5: Pre-Action Validation
→ Check obj_statue_001.physical_state
→ Result: "fixed"
→ Validation FAILS
→ Reason: "The statue is fixed in place"

RECLASSIFICATION:
→ Action reclassified to UNCERTAIN
→ validation_failed = True

CONSEQUENCE ENGINE:
→ Outcome: "You try to lift the statue, but it doesn't budge. It appears to be bolted to the pedestal."
```

**Example 3: Taking Item from NPC (FAIL)**

```
Turn 103:
Player: "I take the wallet"

STEP 3: Classification
→ "take wallet" = possession action = CERTAIN

STEP 3.5: Pre-Action Validation
→ Check obj_wallet_001.is_held_by
→ Result: "npc_marcus_001"
→ Validation FAILS
→ Reason: "Marcus currently has the wallet"

RECLASSIFICATION:
→ Action reclassified to UNCERTAIN
→ validation_failed = True

CONSEQUENCE ENGINE:
→ Considers: attempt to take from Marcus
→ Generates confrontation outcomes (success, partial, failure)
→ Dramatic resolution with Marcus's reaction
```

**Example 4: Normal Movement (PASS)**

```
Turn 25:
Player: "I go outside"

STEP 3: Classification
→ "go outside" = movement = CERTAIN

STEP 3.5: Pre-Action Validation
→ Check location.exits["front_door"]
→ Result: {type: "door", locked: false}
→ Validation PASSES

PROCEED AS CERTAIN:
→ Time Estimator: 30 seconds
→ Simple narration: "You step outside into the cool evening air."
→ No Consequence Engine needed
```

---

#### Consequence Engine Integration

When Consequence Engine receives validation-failed action:

```python
def generate_outcomes_for_failed_validation(action, world_state):
    """
    Special handling when pre-validation failed.
    Generate outcomes that narrate the impossibility.
    """
    prompt = f"""
    VALIDATION FAILURE SCENARIO
    
    Player attempted: {action.description}
    Physical constraint: {action.validation_failure_reason}
    Suggestion: {action.validation_suggestion}
    
    Generate outcome possibilities for this failed attempt.
    The action is physically impossible, but narrate it dramatically.
    
    Possible outcomes:
    - Player tries and realizes it won't work
    - Player discovers the constraint
    - Player finds alternative approach
    
    Do NOT allow success - the constraint is absolute.
    """
    
    return llm_generate_constrained_outcomes(prompt)
```

---

#### Validation Priority Order

Checks run in this order (fail-fast):

1. **Movement checks** (if movement action)
   - Exit exists?
   - Exit locked?
   - Exit hidden and unknown?

2. **Object state checks** (if object interaction)
   - Object physical_state allows action?
   - Object is_held_by someone else?
   - Object constraints violated?

3. **Prerequisite checks**
   - Player has required capabilities?
   - Player has required items?

Stop at first failed check.

---

#### Configuration

```python
PRE_ACTION_VALIDATION_CONFIG = {
    "enabled": True,  # Can disable for testing
    "check_movement": True,
    "check_object_state": True,
    "check_possession": True,
    "check_prerequisites": True,
    "reclassify_on_fail": True,  # False would abort instead
    "log_failures": True
}
```


---

## 10. DEVELOPMENT STRATEGY

### 10.1 Build Order

**Phase 1: Foundation**
1. World State Database (schema, basic operations)
2. Entity structure implementation
3. Relationship structure implementation
4. Event logging structure

**Phase 2: Validation & Control**
1. Consistency Enforcer (genre rules, prerequisites, state validation)
2. Reference Resolver (entity_id matching, ambiguity handling)
3. Entity Validator (output validation, regeneration loops)

**Phase 3: Core Interactions**
1. Consequence Engine (LLM generation + probabilistic selection)
2. Interaction Resolution System (entity generation, engagement tracking)
3. Basic Scene Narrator (prose generation from world state)

**Phase 4: World Liveness**
1. Opportunity Generator (hook creation, context-sensitive)
2. Ambient Event Generator (probability-based world events)
3. NPC Agency System (autonomous actions, pending action resolution)

**Phase 5: Polish**
1. Pacing Monitor (tension tracking, parameter adjustment)
2. Scene Narrator refinement (style, continuity, efficiency)
3. Performance optimization (caching, lazy loading, archival)

### 10.2 Development Approach

**Component Independence:**
- Build each component with clear API boundaries
- Use mock data/services for dependencies during development
- Write unit tests per component before integration

**Iterative Integration:**
- Integrate components one at a time
- Test integration thoroughly before adding next
- Maintain working prototype at each stage

**Test-Driven Scenarios:**
- Define test scenarios covering edge cases:
  - Impossible actions (player tries to fly)
  - Prerequisite violations (run for president with no preparation)
  - Entity hallucination (LLM invents NPCs)
  - Relationship contradictions (enemy suddenly friendly)
- Verify each component handles these correctly

**Logging & Observability:**
- Log all validation failures with context
- Track regeneration attempts and success rates
- Monitor probability distributions (are outcomes realistic?)
- Record player engagement patterns

**Prompt Refinement:**
- Start with basic prompts
- Use logged failures to iteratively improve
- A/B test prompt variations
- Maintain prompt version history

### 10.3 Technical Stack Considerations

**Database:**
- Relational or document store depending on query patterns
- Needs: fast entity lookups, relationship traversal, event timeline queries
- Consider: indexing strategy, archival/compression for old data

**LLM Integration:**
- API calls to Gemini (or other model)
- Context window: 1M tokens available (generous, but still finite)
- Cost considerations: minimize redundant context, cache when possible
- Fallback handling: what if API unavailable?

**State Management:**
- How to persist world state between sessions?
- Save/load system: full world state snapshot vs. incremental
- Versioning: how to handle schema changes?

**Performance:**
- Lazy loading: generate detail on-demand
- Caching: frequently accessed entities kept in memory
- Archival: inactive entities compressed/stored separately
- Batch operations: resolve multiple pending actions at once when possible

### PROMPT ENGINEERING
**Core Prompting Patterns**
**Every Consequence Engine prompt must include:**

1. **Full player context** (attributes, experience, knowledge, resources, connections)
2. **Full world state** (location, NPCs present, environment, constraints)
3. **Player action** (what they're trying to do)
4. **Agency preservation** (explicit "DO NOT decide for player")
5. **Spectrum requirement** (outcomes with specified distribution)
6. **Variety requirement** (include positive/negative surprises, edge cases)

---


## 11. LLM USAGE PRINCIPLES

### 11.1 Core Philosophy

**LLMs are creative engines wrapped in deterministic scaffolding.**

Use LLMs for what they do well. Use code for everything else.

### 7.2 LLM Strengths (Use For)

- Pattern recognition and context synthesis
- Natural language generation (narration, dialogue)
- Relative comparisons and assessments
- Creative possibility generation
- Understanding social dynamics and implications
- Generating descriptive content on-demand

### 11.3 LLM Weaknesses (Use Code For)

- Precise arithmetic and calculations
- Strict consistency across time
- Deterministic logic (if/then rules)
- Memory and state tracking over long periods
- Adhering to hard constraints (will occasionally violate despite instructions)
- Entity resolution and reference tracking

### 7.4 Specific Applications

**Consequence Generation:**
- LLM: Generate outcome descriptions, relative weights, reasoning
- Code: Normalize weights, probabilistic selection, validation

**Relationship Assessment:**
- LLM: Classify as "very_positive", "strained", "deep_bond"
- Code: Map to numeric values, track over time, query for decisions

**Time Estimation:**
- LLM: Classify as "instant", "brief", "medium", "long", "extended"
- Code: Map to concrete durations, track passage of time

**Capability Assessment:**
- LLM: Classify difficulty as "impossible", "extremely_difficult", "moderate", "easy"
- Code: Convert to probability, combine with entity capabilities, determine outcome

**Entity Generation:**
- LLM: Generate traits, personality, background, motivation
- Code: Assign entity_id, set engagement_level, manage lifecycle

**Validation:**
- LLM: NOT involved
- Code: All validation is deterministic rule-checking

### 7.5 Prompt Design Principles

**Be Specific About Output Format:**
- Provide exact structure (JSON schema)
- Enumerate allowed values for categorical fields
- Specify which fields can be null

**Leverage Relative Assessment:**
- Ask for weights, not percentages
- Ask for categories, not precise numbers
- Let LLM compare and contrast, not calculate

**Provide Rich Context:**
- Include relevant world state excerpts
- Recent event history
- Entity states and relationships
- Genre rules and constraints

**Include Correction Loops:**
- When regenerating after validation failure, explain what went wrong
- "Previous output mentioned [X] which doesn't exist. Only use entities from provided context."
- Give LLM chance to learn within session

**Separate Generation and Selection:**
- LLM generates options
- Code selects from options
- Don't ask LLM to "pick the best one" or "decide what happens"

---


## 12. SUCCESS METRICS


## 12. SUCCESS METRICS

### 12.1 System-Level Metrics

**Consistency:**
- Zero world state contradictions over extended play
- Entity states remain coherent across sessions
- Relationships persist and evolve logically

**Verisimilitude:**
- High-difficulty goals fail at realistic rates
- Prerequisite chains enforced successfully
- NPCs demonstrate autonomous existence (player discovers off-screen actions)

**Pacing:**
- Tension varies naturally (peaks and valleys over time)
- Player can sustain mundane existence if desired
- Drama emerges but isn't constant

**Engagement:**
- Opportunities feel emergent, not scripted
- Player choices have observable consequences
- World responds to player but isn't centered on player

### 12.2 Player Experience Metrics

**Agency:**
- Player can pursue stated goals without railroading
- Ignored opportunities actually expire/evolve
- No forced story beats

**Immersion:**
- World feels alive (ambient events, NPC actions)
- NPCs remember interactions consistently
- Locations maintain identity over time

**Narrative Quality:**
- Emergent stories feel coherent
- Surprising outcomes that make sense in retrospect
- Relationships deepen organically through interaction

### 9.3 Technical Metrics

**Validation Effectiveness:**
- Percentage of LLM outputs passing validation first try
- Regeneration attempts needed per output
- Sanitization frequency (lower is better)

**Performance:**
- Time per player action (target: <5 seconds)
- Memory footprint (entity count in active memory)
- API costs (tokens used per session)

**Prompt Quality:**
- Reduction in validation failures over time (indicates improving prompts)
- Entity hallucination rate (should trend toward zero)
- Consequence realism (measured by playtesting feedback)

### 9.4 Failure Indicators

**System is failing if:**
- Contradictions accumulate (same NPC has conflicting states)
- Tension is constantly high (no recovery periods)
- Player feels railroaded (opportunities aren't ignorable)
- NPCs feel frozen (no autonomous life)
- Outcomes are narratively convenient rather than realistic
- World resets/forgets between sessions
- Player's actions don't ripple through social networks

---


## 13. OPEN QUESTIONS & FUTURE CONSIDERATIONS

### 13.1 Scale & Complexity

**How many entities can the system realistically track?**
- Current plan: hundreds to low thousands
- Archival strategy needed for inactive entities
- May need entity lifecycle management (death, moving away, becoming irrelevant)

**How deep can causal chains go?**
- Player → Secretary → Senator → Colleague → Opponent
- Practical limit before complexity becomes unmanageable?
- Maybe limit to 3-4 degrees of separation?

### 10.2 Player Guidance

**How does player understand world state?**
- Relationship tracking UI?
- Goal management system?
- Knowledge base (what does player know)?
- Map of locations and connections?

**How does player know what's possible?**
- Capability discovery (what can I attempt?)
- Feedback on why actions failed (prerequisites not met)
- Hints about opportunity significance (is this important or just flavor?)

### 10.3 Long-Term Coherence

**Can world state remain consistent over months/years of play?**
- Schema evolution handling
- Retroactive continuity when bugs found
- Player expectations vs. system capabilities

**How to handle plot threads left hanging?**
- Some opportunities expire organically
- Others might need gentle nudges to resolve
- Or accept that real life has unresolved threads

### 10.4 Multiplayer Considerations (Future)

**What if multiple players in same world?**
- Not in scope for initial design
- But architecture should not preclude it
- Entity actions affect all players
- Conflict resolution between player actions

### 10.5 Content Generation at Scale

**Can the system generate enough interesting content?**
- Risk: repetitive patterns emerge
- Risk: LLM "voice" becomes obvious
- Mitigation: variety in prompts, randomization, style controls

**How to keep NPCs distinct?**
- Traits system helps but might feel samey
- May need archetypes with variation
- Voice/speech patterns

---

## END OF DESIGN DOCUMENT

**Document Version:** 1.0
**Date:** December 17, 2025
**Status:** Foundation Complete - Ready for Implementation Planning

---

**Next Steps:**
1. Review and refine data model
2. Define API contracts between components
3. Set up development environment
4. Begin Phase 1: Foundation (World State Database)
---
---


---

# APPENDICES

---

## APPENDIX A: VERSION HISTORY

### VERSION 3.5.1 CHANGES (Architecture Remediation)
- **P0-1:** Clarified object location schema - `current_location` is DERIVED when `is_held_by` is set, preventing synchronization issues
- **P0-2:** Added Section 6.4.5 "One Tick Per Turn Rule" - documents critical constraint preventing infinite recursion
- **P1-3:** Rewrote Sections 7.4-7.5 - replaced text search with structured queries using `participants` and `mentions` fields
- **P1-4:** Updated Section 6.1 turn sequence - clarified minimal vs full context queries
- **P2-5:** Added player exclusion documentation - players don't participate in event_knowledge queries
- **P2-6:** Added validation fast-path optimization - `absolute_failure` flag for deterministic failures
- **P2-7:** Unified terminology - replaced "Schrödinger" with `simulation_mode: passive` throughout document

### VERSION 3.5 CHANGES
- Added critical entity fields: `simulation_mode` (sentient), `is_held_by` & `physical_state` (objects), `exits` (locations)
- Added `mentions` field to Event Structure for tracking entities discussed but not present
- Inserted STEP 2.5 (Entity Instantiation) in turn sequence for on-demand entity skeleton generation
- Inserted STEP 3.5 (Pre-Action Validation) in turn sequence to prevent physically impossible "certain" actions
- Added reasoning trace requirement to Consequence Engine prompts for improved output quality
- Updated all affected sections and cross-references for consistency

### VERSION 3.4 CHANGES
- Fixed critical schema conflict: standardized on `event_knowledge` (removed `event_participation`)
- Clarified relationship storage: qualitative strings only (removed numeric strength)
- Renamed entity fields for clarity: `health_status` (sentient), `condition` (objects), `atmosphere` (locations)
- Added location hierarchy support: locations now have `parent_location` and `contained_locations`
- Added TypeScript `EventKnowledge` type definition
- Corrected document date to 2025

### VERSION 3.3 CHANGES
Entity schema restructured for consistency and clarity. Section 5.1 now uses discriminated union approach with type-specific field definitions (Sentient/Object/Location). All entity examples updated to show only relevant fields. TypeScript implementation section added. Entity type changed from `location_embedded` to `location` throughout. No functional changes - purely organizational improvements for maintainability and LLM token efficiency.

### VERSION 3.2 CHANGES
Reorganization for better navigation and clearer separation between conceptual architecture and implementation details. All content from v3.1.1 preserved.

---

## APPENDIX B: IMPLEMENTATION DECISIONS & EDGE CASES

## B.1 ACTION RESOLUTION MECHANICS

**Question:** How does Action Executor handle prerequisite chains and partially-completed actions?

**Resolution:** Actions are atomic. No path planning. World State tracks progress through accumulated facts.

**Key Principle:** "The system doesn't plan paths, it facilitates journeys."

### B.1.1 No Prerequisite Chain Planning

The system does NOT map out multi-step paths (e.g., to become president: file paperwork → hire staff → campaign → debate → win).

Instead, at each turn, the system determines the realistic NEXT step based on current World State.


### B.1.2 No Partially-Completed Actions

Each action is atomic - fully succeeds or fully fails. There is no "50% complete" state.

Long-term pursuits tracked through World State facts:
- Events: "Filed paperwork on X date"
- Relationships: "Has 3 campaign staffers"
- Resources: "Raised $50K"
- Status flags: "declared_candidate"

Goal Tracker shows "Goal: Become President - Status: In Progress" but this is metadata, not system state.

### B.1.3 Player Goals vs World State

**Player Goals:**
- Soft state (mutable, can be abandoned anytime)
- Stored in Goal Tracker (section 5.2)
- Used for context, not enforcement

**World State:**
- Hard facts (immutable, persist regardless)
- Truth about what exists and happened
- Source of consequences

**Critical Example:**
```
Turn 100: Player pursues presidency, makes enemy of Senator Marcus
World State: Senator.relationships[player] = "hostile"
               Senator.goals = ["ruin player's career"]

Turn 150: Player abandons politics, becomes archaeologist
Player.goals: Remove "president", Add "archaeologist"

Turn 200: Senator uses political connections to block research permit
Consequence emerges from persisted World State, not current goals
```

### B.1.4 Atomic Transaction Flow

1. Action Executor receives structured action
2. Queries World State for relevant context
3. LLM generates outcome possibilities
4. Consistency Validator checks outcomes
5. If invalid → Regenerate with corrections
6. If valid → Commit ENTIRE outcome atomically
7. All state changes succeed together or all fail together

No partial application. No rollback of individual pieces.

### B.1.5 Example

**Example:**

**Player action:** "I want to run for president"

**Player context:**
- No political experience
- No knowledge of political process
- $50,000 resources
- No connections

**System does NOT:**
- Check prerequisites (citizenship, age, funds)
- Map out path (file paperwork → hire staff → campaign)
- Suggest "next step"
- Validate if goal is achievable

**System DOES:**
- Generate realistic outcomes based on player's actual capabilities

**Consequence Engine generates:**

```javascript
[
  {
    outcome: "overwhelming_complexity_revealed",
    weight: 0.4,
    description: "You spend hours researching online. FEC regulations, ballot access requirements, campaign finance laws—the sheer volume is staggering. You discover you'd need millions just to be taken seriously, and your $50K is laughably insufficient.",
    consequences: [
      { type: "knowledge_gained", value: "presidential_campaign_complexity" },
      { type: "realization", value: "vastly_underestimated_requirements" }
    ]
  },
  {
    outcome: "unexpected_mentor_contact",
    weight: 0.08,
    description: "Through research, you find a civic engagement nonprofit. A retired precinct captain listens patiently, then advises: 'Presidential run is for someone who's run dozens of local races first. Start with city council.'",
    consequences: [
      { type: "advice_received", value: "start_local_build_experience" },
      { type: "realization", value: "need_foundation_first" }
    ]
  },
  {
    outcome: "scammer_approaches",
    weight: 0.08,
    description: "Your online searches attract attention. Email arrives: 'Presidential Launch Package - $15K!' Promises media exposure, donor connections. Vague language, demands immediate payment.",
    consequences: [
      { type: "threat_revealed", value: "opportunistic_scammers_exist" },
      { type: "option_apparent", value: "can_be_exploited_or_avoid" }
    ]
  }
]
```

**Dice roll selects one.**

**Player then decides what to do:**
- Continue researching despite overwhelm?
- Take mentor's advice and pivot to local politics?
- Ignore scammer and find legitimate help?
- File anyway despite not knowing how?
- Give up on politics entirely?

**Key principle:** Consequence Engine generates world's response to action. Player decides next action. System never assumes player's decision.

---

## B.2 NPC AGENCY: TWO-TIER SYSTEM

**Question:** How often do off-screen NPCs act? How do we prevent 500 NPCs from being a computational bottleneck?

**Resolution:** Two-tier model - Passive Mode (simulation_mode: "passive") for off-screen, Active Tracking (simulation_mode: "active_tracking") for present-scene.

### B.2.1 Passive Mode (simulation_mode: "passive")

**Resolution:** Lazy, retroactive, on-demand. Zero computational cost until triggered.

**Pending Actions Storage:**
```javascript
npc_sister.pending_actions = [
  {
    action_id: "visit_janet_001",
    declared_at: turn_100,
    action_type: "hospital_visit",
    target: "npc_janet_001",
    status: "unresolved",
    affects_player: false
  }
]
```

**Triggers for Resolution:**
1. Player re-engages with NPC (calls sister back)
2. NPC action directly impacts player (Sarah's handler tracks her down)
3. Player queries about NPC/situation ("How's Janet?")

**Resolution Process:**
```
Turn 150: Player calls sister (50 turns after pending action created)

System: Resolve sister's pending action retroactively
- Time passed: 50 turns
- LLM generates outcomes: visited/didn't visit/complications
- Dice roll selects outcome
- World State updated with resolved event
- Sister responds based on what happened
```

**Computational Cost:** Zero until resolution triggered. 500 NPCs with pending actions = zero CPU cycles.

### B.2.2 Active Tracking Mode (simulation_mode: "active_tracking")

**Resolution:** Real-time tactical state for NPCs in current scene with immediate goals.

**Example:**
```javascript
current_scene = {
  location: "apartment_lobby",
  player: {position: "entering"},
  
  active_npcs: [
    {
      entity_id: "npc_sarah_spy_001",
      position: "rooftop_opposite",
      visible_to_player: false,
      
      current_goal: "eliminate_player",
      tactical_state: {
        weapon_ready: true,
        clear_shot: true,
        awaiting_confirmation: true,
        deadline: "5_minutes_or_lost"
      },
      
      decision_pending: "take_shot_or_not",
      potential_actions: [
        {action: "take_shot", weight: 0.3},
        {action: "wait_for_order", weight: 0.5},
        {action: "abort_mission", weight: 0.15}
      ]
    }
  ]
}
```

**Resolution:** Through Consequence Engine Stage 3 (Witness Reactions)
- Sarah is a "witness" (observing player)
- System generates her reaction possibilities
- Validates (has weapon? clear shot?)
- Dice roll selects action
- Becomes part of narration

### B.2.3 NPCs Have Both Modes

Same NPC can have:
- **Passive mode goals:** "assassinate Senator" (off-screen, pending)
- **Active tracking goals:** "avoid player recognition" (present-scene, immediate)

Mode transitions based on context:
- Passive → Active Tracking: Player enters scene, deadline reached, becomes immediate threat
- Active Tracking → Passive: Scene ends, NPC leaves, threat level decreases

**Performance Note:**
Active tracking is expensive. Only promote NPCs to active_tracking when:
- They're hunting the player
- They're an immediate threat in the same location
- They have time-sensitive goals that may intersect player
- They're an active companion following the player

Demote back to passive when threat/relevance ends. Limit: Maximum 3-5 NPCs in active_tracking at once.

---

## B.3 ENTITY DETAIL GENERATION

**Question:** What triggers entity detail generation? When does an NPC go from scenery to fully detailed?

**Resolution:** Three-tier lazy evaluation system.

### B.3.1 Tier 0: Narrative Scenery (No Entity)

Generic references create NO entity in World State:
- "a waiter"
- "some couples"
- "a busboy"

These are just scene dressing. Validator notes "people present" for consistency.

### B.3.2 Tier 1: Named/Specific (Minimal Entity)

Named or specific references CREATE entity immediately with minimal detail:
- "The Wasted Wench" (location)
- "Officer Martinez" (person)
- "the mayor" (specific role)

**Entity Created:**
```javascript
{
  entity_id: "loc_wasted_wench_001",
  type: "bar",
  name: "The Wasted Wench",
  location: "Seattle > Downtown",
  status: "exists"
}
```

### B.3.3 Tier 2: Player Engagement (Full Details)

When player interacts, generate relevant details on-demand:

**First Interaction:**
```
Player: "I approach the hostess and ask for a matchbook"

System: hostess mentioned but no entity exists
Create: npc_hostess_001 (minimal)
Generate: name, appearance, mood (for this interaction)
World State: Updated with detailed entity
Entity persists FOREVER
```

**Progressive Layering:**
- Acquaintance (1-3 interactions): Basic traits, remembers player
- Recurring (4-10 interactions): Personality, goals, motivations
- Major (10+ interactions): Rich backstory, complex motivations

### B.3.4 Persistence Model

**Once created, entities live forever:**
- Never deleted from database
- Details are additive (append-only)
- Archived for performance (not deleted)
- Retrieved on subsequent encounters

**Example:**
```
Turn 15: Player meets hostess → Full details generated
Turn 500: Player returns to bar → Same hostess, remembers player
```

---

## B.4 RELATIONSHIP REPRESENTATION

**Question:** Numeric scores or qualitative tags? Symmetric or asymmetric? How do relationships decay?

**Resolution:** Asymmetric qualitative descriptors with event-driven evolution.

### B.4.1 Database Structure

```sql
CREATE TABLE relationships (
    from_entity_id VARCHAR,
    to_entity_id VARCHAR,
    type VARCHAR,  -- friend, enemy, ally, rival, family
    trust_level VARCHAR,  -- none, low, medium, high, absolute
    romantic_interest VARCHAR,  -- none, slight, medium, high, conflicted
    emotional_tone VARCHAR,  -- neutral, warm, hostile, tense, affectionate
    status VARCHAR,  -- stable, growing, deteriorating, complicated
    last_interaction INTEGER,  -- turns ago
    major_events JSONB,  -- history
    PRIMARY KEY (from_entity_id, to_entity_id)
);
```

### B.4.2 Asymmetric Relationships

Player→Sarah and Sarah→Player are INDEPENDENT entries:

```javascript
// Player's perspective
player → sarah: {
  type: "ally",
  trust: "medium",
  romantic_interest: "conflicted"
}

// Sarah's perspective  
sarah → player: {
  type: "ally",
  trust: "high",  // She trusts player more
  romantic_interest: "high"  // Stronger feelings
}
```

### B.4.3 Relationship Decay

**Default:** No decay. Most relationships stable without maintenance.

**Decay Triggers:** Only for NPCs with maintenance-demanding traits:
- needy (threshold: 20 turns)
- insecure (threshold: 30 turns)
- possessive (threshold: 15 turns)
- codependent (threshold: 10 turns)
- yandere (threshold: 5 turns, catastrophic if exceeded)

**Decay Creates Opportunities:**
```
Jessica (needy trait) not contacted in 50 turns

System: Threshold exceeded
Generate outcome:
- Jessica calls upset about neglect (60%)
- Jessica becomes distant (30%)
- Jessica seeks attention elsewhere (10%)

Dice roll: Jessica calls
Event created, player encounters consequence
```

### B.4.4 Event-Driven Evolution

Relationships update via Consequence Engine Stage 5:

```
Event: Player helps Sarah escape

Update sarah → player:
- trust_level: "medium" → "high"
- emotional_tone: "cautious" → "grateful"
- major_events: append({turn: 120, event: "escape_help", impact: "positive"})
- status: "growing_trust"
```

---

## B.5 CONTEXT WINDOW MANAGEMENT

**Question:** With 1M token context, what gets included? Do we need summarization?

**Resolution:** Send full history - we have plenty of room.

### B.5.1 Token Math

**Typical 500-turn campaign:**
```
500 events × 35 tokens =           17,500 tokens
200 conversations × 45 tokens =     9,000 tokens
Recent narration (10 turns) =       2,000 tokens
Player status/goals =                 500 tokens
Current location =                    200 tokens
NPCs present (3-5) =                1,000 tokens
Current action =                      300 tokens
──────────────────────────────────────────────
TOTAL:                             ~30,500 tokens

With 1M context: Using 3% of capacity
```

**Even long campaigns manageable:**
- 1,000 turns: ~50k tokens (5%)
- 2,000 turns: ~110k tokens (11%)
- 5,000 turns: ~275k tokens (27.5%)

### B.5.2 No Optimization Needed (MVP)

Just send everything:
```python
narrator_context = {
    "player_events": player.get_all_events(),
    "player_conversations": player.get_all_conversations(),
    "recent_narration": last_10_turns,
    "player_status": current_status_and_goals,
    "location": current_location_full_details,
    "npcs_present": all_npcs_with_relationships,
    "action_to_narrate": current_action_outcome
}
```

Optimization only needed at 10,000+ turns (rare, extreme long campaigns).

---

## B.6 VALIDATION FAILURE HANDLING

**Question:** Max retries? What happens after repeated failures? Player visibility?

**Resolution:** Hybrid approach with targeted regeneration, 3 total attempts, graceful degradation.

### B.6.1 Core Principle

**Never accept invalid data into World State**, but also **never discard valid outcomes unnecessarily**.

The system validates each generated outcome individually and only regenerates the ones that fail validation.

### B.6.2 Validation Flow

```python
def generate_validated_outcomes(action, context):
    """
    Generate outcomes with validation, using targeted regeneration.
    Returns a pool of valid outcomes for probabilistic selection.
    """
    
    # ATTEMPT 1: Initial generation
    raw_outcomes = llm_generate_outcomes(action, context)
    valid_pool, invalid_outcomes = separate_valid_invalid(raw_outcomes)
    
    # ATTEMPTS 2-3: Targeted regeneration
    for attempt in range(2, 4):  # Attempts 2 and 3
        if not invalid_outcomes:
            break  # All valid now!
        
        # Build constraints from failures
        constraints = build_constraints_from_failures(invalid_outcomes)
        
        # Regenerate only the problematic types
        missing_types = [inv['type'] for inv in invalid_outcomes]
        regenerated = llm_regenerate_types(
            action=action,
            context=context,
            types_needed=missing_types,
            constraints=constraints,
            attempt=attempt
        )
        
        # Validate regenerated outcomes
        newly_valid, still_invalid = separate_valid_invalid(regenerated)
        valid_pool.extend(newly_valid)
        invalid_outcomes = still_invalid
    
    # Handle final state
    if not valid_pool:
        # CRITICAL: No valid outcomes at all
        log_critical_failure(action, invalid_outcomes)
        return [create_generic_fallback(action)]
    
    if invalid_outcomes:
        # Some types still invalid after 3 attempts
        log_partial_failure(invalid_outcomes, valid_pool)
        # Proceed with what we have
    
    return valid_pool


def separate_valid_invalid(outcomes):
    """Validate outcomes and separate into valid/invalid pools."""
    valid = []
    invalid = []
    
    for outcome in outcomes:
        result = consistency_enforcer.validate(outcome, world_state)
        
        if result.passed:
            valid.append(outcome)
        else:
            invalid.append({
                'outcome': outcome,
                'type': outcome['type'],
                'reason': result.failure_reason,
                'constraints': result.suggested_constraints
            })
    
    return valid, invalid


def build_constraints_from_failures(invalid_outcomes):
    """Extract all constraints from failed validations."""
    constraints = []
    
    for inv in invalid_outcomes:
        constraints.extend(inv['constraints'])
    
    # Deduplicate
    return list(set(constraints))
```

### B.6.3 Constraint Types

Each validation failure generates specific constraints for regeneration:

**Entity Hallucination:**
```python
Failure: Outcome mentions "Tony" who doesn't exist
Constraint: "Only use entities: npc_marcus_001, npc_olga_001, npc_frank_001"
```

**Prerequisite Violation:**
```python
Failure: Player uses gun not in inventory
Constraint: "Player inventory: [wallet, phone, keys] - NO weapons available"
```

**Genre Violation:**
```python
Failure: Magic used in mundane_earth setting
Constraint: "Setting is mundane_earth - no magic, supernatural, or fantasy elements"
```

**Physical State Violation:**
```python
Failure: Dead NPC takes action
Constraint: "NPC is dead - cannot perform voluntary actions"
```

**Relationship Contradiction:**
```python
Failure: Enemy suddenly friendly
Constraint: "Relationship is hostile (history: player_shot_npc, npc_swore_revenge)"
```

### B.6.4 Progressive Constraint Injection Example

```
ATTEMPT 1: Normal generation
──────────────────────────────────
Player: "I punch Marcus"

Generated FAILURE outcome:
"Marcus dodges and Tony tackles you from behind"

Validation: FAIL
- Entity 'Tony' doesn't exist
- Only entities present: npc_marcus_001, npc_sarah_001

Constraint added:
"Only use these entities: npc_marcus_001, npc_sarah_001"


ATTEMPT 2: Regenerate with constraint
──────────────────────────────────
Prompt includes:
"CONSTRAINT: Only use entities: npc_marcus_001, npc_sarah_001"

Generated FAILURE outcome:
"Marcus pulls his lightsaber and deflects the punch"

Validation: FAIL
- Genre violation: no sci-fi weapons in mundane_earth
- Player inventory doesn't include lightsaber anyway

Constraints added:
"Only use entities: npc_marcus_001, npc_sarah_001"
"Genre: mundane_earth - realistic weapons only (knives, guns, improvised)"
"Marcus inventory: [wallet, phone] - no weapons"


ATTEMPT 3: Regenerate with all constraints
──────────────────────────────────
Prompt includes:
"CONSTRAINT 1: Only use entities: npc_marcus_001, npc_sarah_001"
"CONSTRAINT 2: Genre: mundane_earth - realistic weapons only"
"CONSTRAINT 3: Marcus inventory: [wallet, phone] - no weapons"

Generated FAILURE outcome:
"Marcus sidesteps and you punch the wall, hurting your knuckles"

Validation: PASS
- No invalid entities
- No genre violations
- Physically realistic

Added to valid pool ✅
```

### B.6.5 LLM Prompt Structure for Regeneration

**Initial Generation Prompt:**
```
Generate outcome possibilities for action: {action}

Context:
- Player: {player_state}
- Target: {target_state}
- Location: {location}
- Genre: {genre_rules}

Required: Generate one outcome for each type:
- CRITICAL_SUCCESS
- SUCCESS
- SUCCESS_WITH_COMPLICATION
- PARTIAL_SUCCESS
- FAILURE
- FAILURE_WITH_COMPLICATION
- CRITICAL_FAILURE

Output as JSON array.
```

**Regeneration Prompt (Attempt 2+):**
```
Regenerate outcomes for these specific types: {missing_types}

Context:
- Player: {player_state}
- Target: {target_state}
- Location: {location}
- Genre: {genre_rules}

CONSTRAINTS (previous attempts had these issues):
{constraint_1}
{constraint_2}
{constraint_3}

Generate realistic outcomes that satisfy all constraints.
Output as JSON array.
```

### B.6.6 Player Visibility

**Production Mode:** Silent operation, no indication of validation issues.

```
Player sees:
"You punch Marcus. He sidesteps and you hit the wall, bruising your knuckles."

Player does NOT see:
- That this was attempt 3
- That attempts 1-2 had invalid entities/genre violations
- Any validation diagnostics
```

**Development Mode:** Mark validation issues for debugging.

```
⚠️ You punch Marcus. He sidesteps and you hit the wall, bruising your knuckles.
   [Validation: 3 attempts, constraints: entity_hallucination, genre_violation]

Developer logs show:
Attempt 1: INVALID - Entity 'Tony' doesn't exist
Attempt 2: INVALID - Genre violation (lightsaber)
Attempt 3: VALID - Accepted
```

### B.6.7 Edge Cases

**Case 1: No Valid Outcomes After 3 Attempts**

```python
if not valid_pool:
    log_critical_error({
        'action': action,
        'context': context_summary,
        'all_failures': invalid_outcomes,
        'severity': 'CRITICAL'
    })
    
    # Use generic system fallback
    return [create_generic_fallback(action)]

def create_generic_fallback(action):
    """Generic outcome when all validation fails."""
    return {
        'type': 'PARTIAL_SUCCESS',
        'description': "Your attempt produces mixed results.",
        'effects': ['action_attempted'],
        'weight': 1.0
    }
```

**Case 2: Partial Coverage (Some Types Still Invalid)**

```python
if invalid_outcomes and valid_pool:
    log_warning({
        'action': action,
        'valid_count': len(valid_pool),
        'invalid_count': len(invalid_outcomes),
        'missing_types': [inv['type'] for inv in invalid_outcomes],
        'severity': 'WARNING'
    })
    
    # Proceed with valid outcomes
    # Better to have 5-6 outcome types than fail completely
    return valid_pool
```

**Case 3: All Valid on First Attempt**

```python
if not invalid_outcomes:
    log_success({
        'action': action,
        'valid_count': len(valid_pool),
        'attempts': 1
    })
    
    # Perfect - proceed immediately
    return valid_pool
```

### B.6.8 Logging & Metrics

Track validation effectiveness to improve prompts:

```python
validation_metrics = {
    'first_attempt_success_rate': 0.73,  # 73% of outcomes valid on attempt 1
    'second_attempt_fix_rate': 0.89,     # 89% of invalids fixed on attempt 2
    'third_attempt_fix_rate': 0.95,      # 95% of remaining invalids fixed on attempt 3
    'total_failure_rate': 0.002,         # 0.2% complete failures (no valid outcomes)
    
    'common_failure_reasons': {
        'entity_hallucination': 0.45,    # 45% of failures
        'genre_violation': 0.30,         # 30% of failures
        'prerequisite_violation': 0.15,  # 15% of failures
        'other': 0.10                    # 10% of failures
    }
}

# Use metrics to improve prompts
if validation_metrics['entity_hallucination'] > 0.3:
    # Add entity list to initial prompt
    prompt_template.add_section("Available entities: {entity_list}")
```

### B.6.9 Why This Approach Works

1. **Preserves Good Work**: Valid outcomes from attempt 1 are kept, not regenerated
2. **Surgical Fixes**: Only problematic outcome types regenerated
3. **Learning Loop**: Constraints accumulate, LLM gets clearer guidance
4. **Graceful Degradation**: Can proceed with partial coverage
5. **Never Compromises Consistency**: Invalid data never enters World State
6. **Efficient**: Doesn't regenerate everything 3 times
7. **Realistic**: Acknowledges LLMs occasionally fail despite instructions

### B.6.10 Comparison to Alternatives

**Alternative A: Accept First Output**
```
❌ Problem: Invalid data corrupts World State
❌ Result: Consistency violations accumulate
```

**Alternative B: Regenerate Everything on Any Failure**
```
❌ Problem: Wastes valid outcomes from attempt 1
❌ Problem: More expensive (more LLM calls)
❌ Problem: Slower (regenerating 7 outcomes vs 1-2)
```

**Alternative C: Our Hybrid Approach**
```
✅ Keeps valid outcomes
✅ Only regenerates problematic types
✅ Progressive constraint injection
✅ Graceful degradation
✅ Maintains consistency
```

---



## B.7 PROBABILITY DISTRIBUTION

**Question:** How do we calibrate probabilities? Does Pacing Monitor modify distributions?

**Resolution:** Pure LLM vibes. System handles normalization. No calibration needed.

### B.7.1 Weights Are Vibes, Not Math

LLM provides relative weights without mathematical precision:

```javascript
// LLM outputs (don't need to sum to 1.0):
outcomes = [
  {action: "success", weight: 1.0},
  {action: "partial", weight: 0.5},
  {action: "critical", weight: 0.02}
]
// Sum = 1.52 (doesn't matter!)

// System normalizes automatically:
selected = random.choices(outcomes, weights=[1.0, 0.5, 0.02])
// Python's random.choices handles normalization
```

**Don't make LLM do math:**
```
❌ BAD: "Weight as percentages that sum to 100%"
✅ GOOD: "Weight based on how likely each feels (not percentages)"
```

### B.7.2 Pacing Monitor

**MVP: Pure Tracking Only**

Monitor observes tension levels but doesn't modify generation:

```python
class PacingMonitor:
    def analyze_tension(self):
        recent_events = get_events(last_n=20)
        
        tension = {
            "combat": count_type(recent_events, "combat"),
            "conflict": count_type(recent_events, "conflict"),
            "peaceful": count_type(recent_events, "peaceful")
        }
        
        return calculate_tension_level(tension)  # "high", "medium", "low"
```

**Future: Subtle Influence (Optional)**

Can add pacing hints to prompts without forcing outcomes:

```python
if pacing.tension == "very_high":
    hint = """
    NOTE: Recent events intense (combat, high stakes).
    Peaceful resolutions are also realistic.
    Not every moment needs escalation.
    """
else:
    hint = ""

prompt = base_prompt + hint
```


### B.7.4 Generating Outcome Variety (Tail Distributions)**

**Problem:** LLMs naturally converge toward most statistically likely outcomes (top-p sampling). This produces safe, predictable results that cluster in the middle of the distribution.

**Solution:** Explicitly instruct the Consequence Engine to generate the FULL spectrum of realistic outcomes, including tail probabilities.

**Prompt Pattern:**
```
Generate 6-8 weighted outcomes representing the FULL SPECTRUM.

MANDATORY DISTRIBUTION:
- Most likely outcome: 35-45%
- Common alternative: 20-25%
- Uncommon but realistic: 10-15%
- Positive surprise: 5-10%
- Negative surprise: 5-10%
- Edge cases: 2-5% each

Consider FULL spectrum of realistic possibilities:
- Best realistic case (not just likely)
- Worst realistic case (not just likely)
- Helpful strangers
- Problematic strangers
- Environmental factors
- Coincidences
- Rare events

DO NOT only generate safe, expected, middle-of-distribution outcomes.
Real life includes surprises, both positive and negative.
```

**Example Outcomes:**

For "Hannah (Charisma 8) tries to make friends at crowded bar":
- Most likely (40%): Polite brush-off from group
- Common (20%): Brief superficial exchange
- Uncommon (13%): Mistimed comment causes discomfort
- Positive surprise (8%): Accidentally bumps stranger, genuine connection emerges
- Negative surprise (8%): Blunt hostile rejection
- Edge case (6%): Sound system glitch creates conversational opening
- Edge case (5%): Awkwardness misinterpreted as threatening

**Rationale:**
- Variety emerges over multiple actions
- Surprises (both positive and negative) feel realistic
- World doesn't feel predictable or convergent
- Player can't metagame outcomes
- Tail events create memorable moments

**Implementation:**
- Include "full spectrum" instruction in every Consequence Engine prompt
- No hardcoded outcome types (works generically across scenarios)
- Accept that not every possible outcome appears every time
- Variety accumulates across player's journey


---

## B.8 GOAL MANAGEMENT

**Question:** How do we handle resource conflicts? Priority? Contradictory goals?

**Resolution:** Goals are descriptive context, not system constraints.

### B.8.1 Goals as Labels

```javascript
player.goals = [
  "become president",
  "maintain marriage",
  "seduce secretary"
]

// These are LABELS for what player seems to pursue
// NOT system-managed objectives
// NO enforcement, allocation, or conflict detection
```

### B.8.2 No Resource Management

System doesn't check:
- Time conflicts (campaign vs marriage)
- Money allocation (donation vs car purchase)
- Contradictions (maintain marriage vs seduce secretary)

**Conflicts emerge naturally:**
```
Player spends evening on campaign calls
→ Event: "Player worked late"
→ Wife's last_interaction increases

Later: Wife reacts to neglect
→ Natural consequence from World State
→ No "goal conflict" detection needed
```

### B.8.3 Usage

Goals inform:
1. **Opportunity Generator:** What hooks might interest player
2. **Scene Narrator:** Motivation context
3. **Player Reference:** UI display of intentions

Goals do NOT inform:
- Action validation
- Resource allocation
- Conflict prevention

### B.8.4 Priority Through Actions

No explicit ranking. Priority revealed by player choices:

```
Recent actions:
- campaign_call
- campaign_call
- meet_secretary
- campaign_call
- skip_dinner_with_wife

Pattern: Player prioritizing campaign + secretary over wife
→ Emergent from choices, not declared
```

---

## B.9 EVENT MEMORY DISTRIBUTION

**Note:** This appendix section is superseded by the comprehensive **Section 7: Event Logging & NPC Knowledge System** which provides full implementation details for event tracking, NPC knowledge, and information propagation. The principles outlined below remain valid but should be implemented according to Section 7's specifications.

**Question:** Who knows about events? How does information propagate?

**Resolution:** Tiered propagation with perspective-based fidelity.

### B.9.1 Knowledge Tiers

**Tier 1 - Direct Experience (Immediate):**
- Participants and witnesses
- Exact fidelity
- Recorded instantly

**Tier 2 - Goal-Based Discovery (Automatic When Relevant):**
- NPCs with goals involving affected entities
- Discovery method generated
- Example: Senator sent Pedro → Pedro dies → Senator discovers

**Tier 3 - Relationship-Based (On-Demand):**
- Close relationships may learn
- Resolved when player interacts
- Passive resolution until then

**Tier 4 - Public Knowledge (Broadcast):**
- Major events (police, news, social media)
- All NPCs can reference

**Tier 5 - Player Disclosure (Direct):**
- Player tells NPC
- NPC records player's perspective

### B.9.2 Perspective-Based Fidelity

Same event, different memories:

```javascript
Event: "Player shot Pedro in forest"

// Player's memory
player.events.append({
  description: "I shot Pedro in the forest. He died.",
  perspective: "first_person",
  fidelity: "exact"
})

// Pedro's memory
pedro.events.append({
  description: "Player shot me. Everything went black.",
  perspective: "victim",
  fidelity: "exact"
})

// Senator's memory (if discovers later)
senator.events.append({
  description: "Pedro found dead. Shot in forest. Suspect unknown.",
  perspective: "third_party_report",
  fidelity: "incomplete",
  source: "police_report"
})
```

### B.9.3 Example: Player Shoots Pedro

```
Immediate: Player knows, Pedro knows (dead)

Senator (if sent Pedro):
→ Goal check: Pedro hasn't reported back
→ Trigger discovery: Senator investigates
→ Generate: How did Senator find out?
→ Record: Senator learns Pedro is dead

Senator (if unrelated):
→ Passive resolution state
→ Never learns unless told

Pedro's family:
→ Discover when player encounters them
→ Police notify, or player tells them
```

---

## B.10 ACTION INTERPRETATION

**Note:** See **Section 7.2: Certain vs Uncertain Actions** for comprehensive classification system determining whether actions use Consequence Engine or Time Estimator.

**Question:** How granular? "Go talk to senator" = two actions or one? Implicit steps expanded?

**Resolution:** Minimal structuring. Single actions. Trust LLM for details.

### B.10.1 Single Actions, Not Micro-Steps

```
Player: "I go talk to the senator"

❌ DON'T: Break into [travel, enter_building, talk]
✅ DO: Single action, LLM handles complexity

action = {
  "intent": "talk_to_senator",
  "raw_input": "I go talk to the senator"
}

LLM generates outcome considering:
- Where is senator? (office, home, gala)
- Where is player? (nearby, across town)
- Travel involved? (incorporated naturally)

Outcome: "You head to senator's office. Secretary says he'll see you in 20 minutes."
```

### B.10.2 No Trivial Validation

Don't check inventory for generic items:

```
Player: "I ask hostess for matchbook"

❌ DON'T: Check hostess.inventory.has("matchbook")

✅ DO: Generate outcomes with probabilities
- Has matchbook (70%)
- Doesn't have matchbook (25%)
- Offers lighter instead (5%)

Dice roll decides
```

### B.10.3 Validate Only Hard Rules

**DO validate:**
- Named items: "I use Dr. Groff's secret plans" → CHECK existence
- Impossible actions: "I fly to moon" (mundane setting) → REJECT
- Implausible: "Hostess has assault rifle" → Very unlikely
- State violations: Dead NPC, unconscious player → REJECT
- Major prerequisites: "Hack CIA" → CHECK skills/equipment

**DON'T validate:**
- Generic items: matchbook, pen, coffee
- Common actions: walking, talking, sitting
- Reasonable improvisation: making coffee, casual travel

### B.10.4 Interpreter Job

Minimal work:
```python
def interpret_action(player_input):
    return {
        "raw_input": player_input,
        "intent": extract_basic_intent(player_input),  # "talk", "go", "take"
        "mentioned_entities": extract_references(player_input),
        "resolved_entities": resolve_references(mentions, world_state)
    }
```

Consequence Engine handles ALL complexity.

---

## B.11 OPPORTUNITY GENERATION

**Question:** Frequency? How to prevent formulaic patterns?

**Resolution:** Clear mechanical triggers with typed generation and vibes filtering.

### B.11.1 Trigger Conditions

**Trigger 1: Inactivity**
- After 5 turns of no meaningful action
- Prevents dead air

**Trigger 2: New Location**  
- After 1 turn in new location if not actively engaged
- Natural moment for world to present options

**Trigger 3: NPC Initiative**
- Named NPCs nearby (or available by phone)
- NPC has goal involving player
- Quick passive resolution check

### B.11.2 Opportunity Types

**Setting-Dependent:**
- Based on genre, world state, context
- Example: Political campaign → fundraisers, endorsements

**NPC-Dependent:**
- NPC has goal needing player
- Highest priority
- Example: Sarah needs passport → calls player

**Location-Dependent:**
- What naturally happens at location
- Example: Dive bar → gossip, strangers, trouble

**Vibes-Appropriate:**
- Filtered by pacing/tension
- Filtered by player goals
- Filtered by location context
- Example: High tension → offer low-stakes personal opportunity

### B.11.3 Quality Control

**Cooldowns:**
- NPCs: ~20 turn cooldown between opportunities
- Locations: Don't repeat same opportunity consecutively

**Variety Tracking:**
- Track last 10 opportunities
- If 3+ same type → weight toward different type

**Context Variation:**
- Same type, different presentation
- "NPC wants help" varied each time

**Vibes Filtering:**
- Generated opportunity checked against context
- Example: UFO opportunity filtered out during political campaign

### B.11.4 Example Flow

```
Turn 200: Player at home, 5 turns inactivity

Check NPCs: Sarah has goal "escape_country" + needs player
Generate (NPC-dependent):

Recent context: High tension (assassination attempt, chase)
Vibes: Sarah asking for help fits stakes level

"Your phone rings. Sarah. 'I need your help. It's urgent.'"

Player can pursue or ignore
```

---

## B.12 RELATIONSHIP GRAPH

**Question:** Symmetric or asymmetric? How to query efficiently? Indirect relationships?

**Resolution:** Asymmetric database matrix with networks generated when NPCs detailed.

### B.12.1 Database Structure

```sql
CREATE TABLE relationships (
    from_entity_id VARCHAR,
    to_entity_id VARCHAR,
    type VARCHAR,
    trust_level VARCHAR,
    romantic_interest VARCHAR,
    emotional_tone VARCHAR,
    status VARCHAR,
    last_interaction INTEGER,
    major_events JSONB,
    PRIMARY KEY (from_entity_id, to_entity_id)
);

CREATE INDEX idx_from ON relationships(from_entity_id);
CREATE INDEX idx_to ON relationships(to_entity_id);
```

### B.12.2 Network Generation

When NPC becomes detailed:

```python
def generate_npc_network(npc, engagement_level):
    if engagement_level == "acquaintance":
        num_relationships = 3
    elif engagement_level == "recurring":
        num_relationships = 6
    elif engagement_level == "major":
        num_relationships = 12
    
    # LLM generates appropriate relationships
    relationships = llm_generate_network(npc, num_relationships)
    
    for rel in relationships:
        # Create target NPC if doesn't exist (background level)
        if not exists(rel.target):
            create_background_npc(rel.target)
        
        # Store relationship in database
        insert_relationship(npc, rel.target, rel.data)
```

### B.12.3 Efficient Queries

**Who does player know that knows Marcus?**
```sql
SELECT r2.from_entity_id
FROM relationships r1
JOIN relationships r2 ON r1.to_entity_id = r2.from_entity_id
WHERE r1.from_entity_id = 'player'
AND r2.to_entity_id = 'npc_marcus';
```

**Who would care if Marcus dies?**
```sql
SELECT from_entity_id, type, emotional_tone
FROM relationships
WHERE to_entity_id = 'npc_marcus'
AND (emotional_tone IN ('positive', 'warm')
     OR type IN ('family', 'friend')
     OR trust_level IN ('high', 'absolute'));
```

No need for expensive full graph traversal. Targeted queries handle all use cases.

### B.12.4 Example: Sarah's Network

```
Turn 15: Sarah becomes acquaintance

Generate 3 relationships:
1. Senator Marcus (enemy, hostile)
2. Ivan Petrov (handler, fearful)
3. Maria Chen (old friend, warm)

Create background NPCs for each
Store relationships in database

Later uses:
- Player asks Sarah about enemies → Query returns Marcus, Ivan
- Ivan discovers Sarah → Background NPC becomes active
- Maria reaches out → Creates opportunity for player
```

---

## B.13 LOCATION HIERARCHY

**Question:** Do players need multiple actions to traverse hierarchy? How does co-location work?

**Resolution:** LLM handles travel naturally. Building-level co-location.

### B.13.1 Travel Mechanics

LLM determines appropriate granularity:

```
Player location: "Seattle > Downtown > Dirty Ditch > Bathroom"

Player: "I leave and go home"

❌ DON'T: Require four actions (exit bathroom, exit bar, exit downtown, go home)

✅ DO: Single action
LLM: "You leave the bar and drive home. Takes about 20 minutes."
Location: "Seattle > Residential > Home"
```

**LLM interprets based on context:**
- "I go to bathroom" → Quick movement, stays in building
- "I leave" → Could be: to bar, to street, or specific destination
- "I drive to senator's office" → Travel with time/distance appropriate

### B.13.2 Co-Location Resolution

**Building level = co-location:**

```javascript
player: "Seattle > Downtown > Dirty Ditch"
sarah: "Seattle > Downtown > Dirty Ditch > Bathroom"
→ CO-LOCATED (same building)

player: "Seattle > Downtown > Dirty Ditch"
marcus: "Seattle > Downtown > Coffee_Shop"
→ NOT CO-LOCATED (different buildings)
```

**Query:**
```sql
SELECT entity_id FROM entities
WHERE location_path LIKE 'Seattle > Downtown > Dirty Ditch%';
-- Returns all entities in Dirty Ditch (any room)
```

### B.13.3 Vague Locations

NPCs can have vague locations:

```javascript
marcus.location = "Seattle > Downtown"  // No specific building
// Not co-located with anyone at specific buildings

// When player seeks Marcus:
Player: "I look for Senator Marcus downtown"
System: Resolve Marcus's specific location (passive resolution)
LLM: "Marcus is at his office in government building"
marcus.location = "Seattle > Downtown > Government_Building"
// Now specific, player can go there
```

### B.13.4 Precision Levels

```
City: "Seattle" → Very vague
District: "Seattle > Downtown" → Vague
Building: "Seattle > Downtown > Dirty Ditch" → PRECISE (co-location level)
Room: "Seattle > Downtown > Dirty Ditch > Bathroom" → Extra detail (still same building)
```

---

## B.14 SAVE/LOAD SYSTEM

**Question:** Full snapshots or deltas? Can player branch timelines?

**Resolution:** Full snapshot approach with proper branching (no locked futures).

### B.14.1 Simple File-Based Saves

```
/saves/
  player_001/
    save_001.json  ("Before meeting senator")
    save_002.json  ("After Sarah defection")
    autosave.json  (Latest autosave)
```

### B.14.2 Save Data Structure

```javascript
{
  "save_metadata": {
    "save_id": "save_001",
    "player_id": "player_001",
    "save_name": "Before meeting senator",
    "timestamp": "2025-12-22T10:30:00Z",
    "turn_number": 50,
    "version": "1.0"
  },
  
  "world_state": {
    "entities": [...],      // All NPCs, locations, objects
    "relationships": [...], // Full relationship matrix
    "events": [...],       // Complete event history
    "player": {...}        // Player state
  }
}
```

### B.14.3 File Size

```
Typical 500-turn campaign:
- 50 entities × 500 bytes = 25 KB
- 200 relationships × 200 bytes = 40 KB
- 500 events × 300 bytes = 150 KB
- 20 locations × 500 bytes = 10 KB

Total: ~225 KB per save
100 saves = ~22.5 MB (negligible)
```

### B.14.4 Proper Branching

**Save ONLY current state:**
```javascript
// ✅ Save this:
npc_sarah.pending_actions = [{
  action: "get_fake_passport",
  status: "unresolved"
}]

// ❌ Don't save this:
future_events = [{
  turn: 155,
  locked: "sarah_gets_caught"
}]
```

**On reload, new choices possible:**
```
Turn 150: Save game
Sarah has pending action "get fake passport"

Branch A: Continue playing
→ Turn 151: Resolve action
→ Dice: Sarah succeeds (60% chance)

Branch B: Load save, warn Sarah
→ Turn 151: New context (player warned her)
→ Dice: Sarah aborts, stays hidden (different outcome)

Same save point, different outcomes based on choices
```

### B.14.5 Load Process

```python
def load_game(save_id):
    save_data = read_save_file(save_id)
    
    # Replace entire world state
    database.clear_all()
    database.load_from(save_data["world_state"])
    
    current_turn = save_data["turn_number"]
    return "Game loaded"
```

---

## B.15 SCHEMA EVOLUTION

**Question:** How to handle schema changes? Migration scripts?

**Resolution:** Nuclear option for MVP (delete and restart).

### B.15.1 No Migration Strategy

```python
# Schema changed?

# Option A: Complex migrations (NOT FOR MVP)
def migrate_v1_to_v2():
    # Read old saves
    # Transform data
    # Handle edge cases
    # ...100+ lines

# Option B: Nuclear (FOR MVP)
def migrate_v1_to_v2():
    print("Schema changed. Old saves incompatible.")
    print("Delete database, start fresh campaign.")
```

### B.15.2 Version Awareness

```javascript
// Include version in saves
save_metadata: {
  version: "0.1.0"
}

// On load:
if save.version != CURRENT_VERSION:
  return "Incompatible save. Start new campaign."
```

### B.15.3 Development Workflow

```
Week 1: Build core (v0.1.0)
→ Test, find bugs
→ Change schema
→ Delete database, restart

Week 2: Add features (v0.2.0)
→ Schema changed
→ Delete database, restart

Continue until stable
```

### B.15.4 Non-Breaking Changes

```python
# Adding optional field
def load_entity(data):
    if "new_field" not in data:
        data["new_field"] = default_value
    return Entity(data)

# Old saves work with defaults
```

### B.15.5 Future (If Multi-User)

Then add proper migrations. But for solo MVP: unnecessary complexity.

---

### B.16 PRESERVING PLAYER AGENCY IN GENERATED OUTCOMES**

**Question:** Should the system assume natural actions based on consequences?

**Resolution:** Actions and decisions are reserved for the player. System should inform not act.

**Critical Principle:** The Consequence Engine generates what the WORLD does, never what the PLAYER decides to do next.

**Forbidden Outcome Types:**
```javascript
❌ "player_abandons_idea"
❌ "player_pivots_to_local_politics"
❌ "player_decides_to_quit"
❌ "player_realizes_and_gives_up"
```

**Correct Outcome Types:**
```javascript
✅ "overwhelming_information_revealed"
✅ "helpful_mentor_offers_guidance"
✅ "scammer_contacts_player"
✅ "system_presents_bureaucratic_wall"
```

**The Difference:**

**Wrong (decides for player):**
```javascript
{
  outcome: "player_gives_up",
  description: "Realizing the impossibility, Alex abandons politics and accepts a job offer."
}
```

**Right (shows world, player decides):**
```javascript
{
  outcome: "job_offer_arrives",
  description: "Email arrives: Project manager position, $85K, starts in two weeks. Would consume all time, making politics impossible.",
  consequences: [
    { type: "opportunity_presented", value: "stable_career_vs_political_ambition" },
    { type: "time_constraint", value: "must_decide_soon" }
  ]
}
```

**Implementation Guidance:**

Every Consequence Engine prompt must include:

```
DO NOT decide:
- Whether player continues or quits
- What player does next
- Player's ultimate decision
- Player's emotional response beyond immediate reaction

DO show:
- What information is revealed
- How the world/NPCs respond
- What immediate consequences occur
- What options become apparent

The player will decide their next action based on these consequences.
```

**Validation:**

Post-generation check:
- Does outcome description contain player decision verbs? (decides, quits, pivots, abandons, realizes and does X)
- If yes → REJECT, regenerate
- If no → ACCEPT

**Rationale:**

The design principle states: "The player can pivot at any moment."

If Consequence Engine decides "player abandons idea," the player CAN'T pivot—the choice is taken away.

Outcomes must present situations, not resolve them.

Player retains full agency over how to respond.


---

## APPENDIX C: QUICK REFERENCE SUMMARY TABLE

Quick reference for all implementation decisions and key concepts:

| Question | Resolution | Key Takeaway |
|----------|-----------|--------------|
| Action Resolution | Atomic actions, World State persistence | "Facilitates journeys, doesn't plan paths" |
| NPC Agency | Two-tier: Passive + Active Tracking | Off-screen lazy, present-scene real-time |
| Entity Generation | Three-tier lazy evaluation | Scenery → Named → Detailed |
| Relationships | Asymmetric qualitative descriptors | No numeric scores, event-driven evolution |
| Context Window | Full history approach | 1M tokens = plenty of room |
| Validation | 3-strike with fallthrough | Progressive constraint injection |
| Probability | Pure LLM vibes | System normalizes, no calibration |
| Goals | Descriptive context only | Not system constraints |
| Event Memory | Tiered propagation | Perspective-based fidelity (see Section 7) |
| Action Interpretation | Minimal structuring | Trust LLM for details (see Section 7.2) |
| Opportunities | Clear triggers + types | Vibes-filtered, all expire eventually |
| Relationship Graph | Database matrix | Networks when detailed |
| Location Hierarchy | LLM-handled travel | Building-level co-location |
| Save/Load | Full snapshots | Proper branching |
| Schema Evolution | Nuclear option | Delete and restart |
| Preserving Player Agency | System should inform not act | All decisions are up to the player even if they are sub-optimal choices |
| Context-Aware Weighting | Holistic assessment of ALL factors | Weights reflect THIS actor in THIS situation (Section 4.5) |
| Time Tracking | Every action advances clock | Uncertain→Consequence Engine, Certain→Time Estimator (Section 6.4) |
| Scene Transitions | Material context changes | Full workflow with NPC resolution and opportunity expiration (Section 6.5) |
| Conversation Timing | Multi-turn accumulation | Each exchange is a turn, time accumulates (Section 6.6) |
| Opportunity Expiration | All opportunities expire | World moves on, prevents infinite accumulation (Section 6.7) |
| Event Logging | One event per turn | Comprehensive tracking with NPC knowledge (Section 7) |
| Certain vs Uncertain | Classification determines path | ~95% certain as-is, ~5% inject uncertainty (Section 4.5) |
| Reference Resolution | LLM-driven detection with structured output | CLEAR/AMBIGUOUS/GIBBERISH routing, comprehensive clarification flow (Section 9.1) |
| Action Classification | Certain vs Uncertain routing | ~95% CERTAIN bypass Consequence Engine, ~5% UNCERTAIN get full pipeline (Section 9.2) |
| Opportunity Generation | Comprehensive trigger-based system | Context-sensitive, classification by dramatic weight, mandatory expiration, pacing-aware (Section 4.7, 9.4) |
| Ambient Events | Simple 3% per-turn probability | Three severity tiers (MINOR 70%, MODERATE 25%, MAJOR 5%), woven into narration, can interrupt (Section 4.8, 9.5) |
| Entity Schema | Discriminated union by type | Type-specific fields (Sentient/Object/Location), no null pollution, TypeScript implementation (Section 5.1) |
| Entity Fields (v3.5) | simulation_mode, is_held_by, physical_state, exits | Critical fields added: passive/active tracking, possession tracking, object moveability, location exit mapping |
| Event Mentions (v3.5) | Track entities discussed but not present | Enables gossip/reputation propagation (Section 7.1) |
| Entity Instantiation (v3.5) | STEP 2.5 skeleton generation | On-demand MVE creation when player references non-existent entities (Section 9.9) |
| Pre-Action Validation (v3.5) | STEP 3.5 feasibility checks | Prevents physically impossible "certain" actions, reclassifies to uncertain on failure (Section 9.10) |
| Reasoning Trace (v3.5) | Required before JSON generation | LLM must analyze situation before generating outcomes (Section 9.3) |

---

## END OF DOCUMENT

