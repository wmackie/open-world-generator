# Gap Analysis: Design vs. Implementation

> [!IMPORTANT]
> This document captures the delta between the V4.0 Design Specification and the current codebase state (as of Jan 2026).

## 1. Consequence Intelligence Check
**Status:** [CRITICAL GAP]

*   **Design Requirement:** A multi-stage "Cognitive Layer" that analyzes:
    1.  Prerequisites (Needs vs. Haves)
    2.  Difficulty Synthesis (Combined factors)
    3.  Relationship Context
*   **Current Implementation:** `LOGIC_SPECTRUM` prompt is a "Black Box" generator that asks for outcomes without requiring intermediate reasoning.
*   **Impact:** Outcomes feel random/hallucinated rather than grounded in simulation physics.

## 2. Relationship System
**Status:** [ARCHITECTURAL GAP]

*   **Design Requirement:** **Semantic** tracking.
    *   State: "Hostile", "Trusting", "Broken"
    *   History: Log of significant events ("Witnessed Player Attack")
*   **Current Implementation:** **Numeric** tracking.
    *   `trust_level` is an Integer (0-100).
    *   `RippleEffectManager.ts` uses `amount: number` (e.g., -20).
    *   `tags` and `history` arrays are missing from the SQL schema logic.
*   **Impact:** Relationships are shallow math rather than narrative drivers.

## 3. Ripple Effects (Mechanical Persistence)
**Status:** [PARTIAL IMPLEMENTATION]

*   **Design Requirement:** Deterministic updates to world state based on action tags.
*   **Current Implementation:** `RippleEffectManager.ts` exists but:
    *   Only handles `VIOLENCE` and `THEFT` tags.
    *   Updates are purely numeric (see above).
    *   Revenge goals are created, but rudimentary.
*   **Impact:** The world forgets context quickly. "semantic" fallout is lost.

## 4. Pending Action System
**Status:** [MISSING]

*   **Design Requirement:** NPCs schedule future actions (e.g., "Call Police in 3 turns").
*   **Current Implementation:** No mechanism in [ConsequenceEngine](file:///e:/CODE/interactive_fiction_engine/src/engine/consequence.ts#5-130) or [Director](file:///e:/CODE/interactive_fiction_engine/src/engine/director.ts#17-100) to schedule future events.
*   **Impact:** The narrative cannot "build"; it can only react to the immediate input.

## Recommended Action Plan
1.  **Phase 1: Relationship Reform:** Refactor `relationships` table and [RippleEffectManager](file:///e:/CODE/interactive_fiction_engine/src/engine/ripple_effect_manager.ts#5-99) to be Tag/Semantic based.
2.  **Phase 2: Brain Transplant:** Replace `LOGIC_SPECTRUM` with the "Cognitive Prompt" from the design doc.
3.  **Phase 3: Event Scheduler:** Implement `GameLoop.pendingActions` queue.
