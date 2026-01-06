# ADDENDUM B: COMPREHENSIVE IMPLEMENTATION GUIDE
**Project:** Interactive Fiction Narrative Engine  
**Version:** For Design Doc v4.0.0 + Addendum A  
**Author:** Claude (Architecture Review & Recommendations)  
**Date:** December 29, 2025

---

## EXECUTIVE SUMMARY

This document consolidates Addendum A with critical architectural additions identified during review. Given your mandate that **quality is the primary goal** and optimization is secondary, this guide prioritizes robustness, debuggability, and correctness over performance.

**Key Additions:**
1. Enhanced entity schema with metadata tracking
2. Tiered complexity system (future optimization path)
3. Testing infrastructure (Phase 0.5)
4. LLM provider abstraction layer
5. Database indexing for scalability
6. Logging and observability framework

---

## 1. ENHANCED DATA MODEL

### 1.1 Updated Sentient Entity Schema

Replace Section 5.1.2 in Design Doc v4.0.0 with:

```typescript
// ===== CORE TYPES =====

type EngagementLevel = 'background' | 'acquaintance' | 'recurring' | 'major';
type SimulationMode = 'passive' | 'active_tracking';
type Proficiency = 'untrained' | 'basic' | 'competent' | 'expert' | 'master';
type ActionComplexity = 'trivial' | 'standard' | 'critical'; // NEW: For tiering

// ===== EVENT KNOWLEDGE =====

type EventKnowledge = {
  event_id: string;
  awareness: 'witnessed' | 'heard_gossip' | 'participated';
  impression: string;
  learned_turn: number;
};

// ===== CURRENT ACTION TRACKING =====

type CurrentAction = {
  action_type: string;          // "walking", "conversation", "combat"
  description: string;          // Human-readable description
  target_id?: string;           // Entity ID if action has a target
  start_turn: number;           // When this action began
  duration_turns: number;       // How long it will take (1 = instant)
  completion_status: 'in_progress' | 'interrupted' | 'completed';
} | null;

// ===== METADATA TRACKING =====

type SimulationMetadata = {
  last_simulated_turn: number;      // When NPC logic last ran
  total_generation_tokens: number;  // Running cost tracker
  total_api_calls: number;          // How many LLM calls this entity caused
  last_modified: string;            // ISO timestamp
  creation_turn: number;            // When entity was instantiated
  total_player_interactions: number; // How many times player engaged
};

// ===== SENTIENT FIELDS =====

type SentientFields = {
  is_player: boolean;
  
  // Identity & Appearance
  name: {
    first: string;
    display: string;
    known_to_player: boolean;
  };
  
  appearance: {
    visuals: string;      // Concrete: "6'2", shaved head, leather jacket"
    impression: string;   // Abstract: "His presence sucks warmth from the room"
  };
  
  voice: {
    reference: string;    // Token-efficient: "Idris Elba" or "Nervous Accountant"
    tone_tags: string[];  // ["Rough", "Fast-paced"]
    mannerisms: string[]; // ["Rubs scar when nervous", "Chain-smokes"]
  };

  // Psychology & Behavior
  psychology: {
    motivation: string;       // Current goal: "Hiding from debt collectors"
    core_wound: string | null; // Past trauma driving irrationality
    insecurities: string[];   // Specific triggers
    social_strategy: string;  // "Charm first, intimidate second"
  };

  moral_compass: {
    virtues: string[];  // Affects positive decision weights
    vices: string[];    // Affects negative/failure decision weights
  };
  
  // Simulation Configuration
  simulation_mode: SimulationMode;
  engagement_level: EngagementLevel;
  capabilities: Record<string, Proficiency> | null;
  constraints: string[] | null;
  
  // State
  state: {
    current_location_id: string | null;
    health_status: string;
    emotional_state: string;
    current_action: CurrentAction;  // ENHANCED: Now an object
  };
  
  inventory: string[] | null;
  
  // Memory & Relationships
  relationships: Array<{
    entity_id: string;
    type: string;
    trust: string;
    impression: string;
  }> | null;
  
  knowledge: string[] | null;
  beliefs: string[] | null;
  memories: string[] | null;
  event_knowledge: EventKnowledge[] | "ALL" | null;

  // Meta (Generation Control)
  generated_depth: 'minimal' | 'basic' | 'detailed' | 'full';
  generation_context: string;
  autonomous_action_frequency: 'never' | 'low' | 'medium' | 'high';
  
  // NEW: Metadata Tracking
  meta: SimulationMetadata;
};

// ===== DISCRIMINATED UNION =====

export type Entity =
  | ({ entity_id: string; entity_type: 'player' | 'npc' | 'creature' } & SentientFields)
  | ({ entity_id: string; entity_type: 'object'; name: string } & ObjectFields)
  | ({ entity_id: string; entity_type: 'location'; name: string } & LocationFields);
```

### 1.2 Rationale for Changes

**`CurrentAction` as Object:**
- Enables multi-turn action tracking (e.g., "I sleep for 8 hours" = 96 turns at 5-min resolution)
- Fixes the Time/Tick Synchronization problem from Addendum A
- Allows interruption handling (combat interrupting sleep)

**`SimulationMetadata`:**
- **Debugging:** "Why is this NPC outdated?" → Check `last_simulated_turn`
- **Cost Analysis:** "Which NPCs are expensive?" → Sort by `total_generation_tokens`
- **Quality Assurance:** "Is this background NPC getting too much attention?" → Check `total_api_calls`

**`ActionComplexity` Type:**
- Future optimization path when you transition from prototype to production
- Enables tiered pipeline (see Section 3)

---

## 2. DATABASE ARCHITECTURE

### 2.1 SQLite Schema Enhancements

Add these indexes to your `better-sqlite3` setup:

```sql
-- Event Log Table (from v4.0.0)
CREATE TABLE IF NOT EXISTS event_log (
  event_id TEXT PRIMARY KEY,
  turn_number INTEGER NOT NULL,
  location_id TEXT,
  observer_id TEXT,
  action_type TEXT NOT NULL,
  event_data JSON NOT NULL,
  timestamp TEXT NOT NULL
);

-- CRITICAL INDEX: Enables fast "Negative Observation" checks
CREATE INDEX idx_negative_observations 
ON event_log(location_id, turn_number, observer_id);

-- CRITICAL INDEX: Enables fast NPC action history retrieval
CREATE INDEX idx_npc_actions 
ON event_log(observer_id, turn_number DESC);

-- CRITICAL INDEX: Enables fast location history queries
CREATE INDEX idx_location_timeline 
ON event_log(location_id, turn_number DESC);

-- Entity State Table (from v4.0.0)
CREATE TABLE IF NOT EXISTS entities (
  entity_id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_data JSON NOT NULL,
  last_modified TEXT NOT NULL
);

-- NEW INDEX: Fast lookups by type and location
CREATE INDEX idx_entities_by_type 
ON entities(entity_type);

CREATE INDEX idx_entities_by_location 
ON entities(json_extract(entity_data, '$.state.current_location_id'))
WHERE entity_type IN ('player', 'npc', 'creature');

-- Metadata Tracking Table (NEW)
CREATE TABLE IF NOT EXISTS simulation_metrics (
  metric_id TEXT PRIMARY KEY,
  turn_number INTEGER NOT NULL,
  total_tokens_used INTEGER NOT NULL,
  total_api_calls INTEGER NOT NULL,
  pipeline_stage_timings JSON NOT NULL, -- {consequence: 1200ms, narration: 800ms}
  active_entities INTEGER NOT NULL,
  timestamp TEXT NOT NULL
);

CREATE INDEX idx_metrics_timeline 
ON simulation_metrics(turn_number DESC);
```

### 2.2 LanceDB Configuration

```typescript
import * as lancedb from "@lancedb/lancedb";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

// Embedding Model
const embedModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

// LanceDB Setup
const db = await lancedb.connect("/path/to/lancedb");

// Event Memory Table
const eventMemoryTable = await db.createTable("event_memory", [
  {
    event_id: "string",
    turn_number: 0,
    observer_id: "string",      // "player" or NPC ID
    location_id: "string",
    event_summary: "string",    // Human-readable summary for retrieval
    event_context: "string",    // Full context for injection into prompts
    emotional_valence: 0.0,     // -1.0 (traumatic) to 1.0 (joyful)
    importance: 0,              // 0-10 scale
    vector: Array(768).fill(0), // Embedding dimension for text-embedding-004
    timestamp: "string"
  }
], { mode: "overwrite" });

// Add a composite index for filtering + vector search
await eventMemoryTable.createIndex({
  column: "vector",
  type: "IVF_PQ",
  num_partitions: 256,
  num_sub_vectors: 96
});
```

### 2.3 Retrieval Function

```typescript
async function getRelevantMemories(
  query: string,
  observerId: string,
  topK: number = 10,
  importanceThreshold: number = 3
): Promise<any[]> {
  // Generate query embedding
  const result = await embedModel.embedContent(query);
  const queryVector = result.embedding.values;

  // Vector search with filters
  const results = await eventMemoryTable
    .search(queryVector)
    .where(`observer_id = '${observerId}' AND importance >= ${importanceThreshold}`)
    .limit(topK)
    .execute();

  return results;
}
```

---

## 3. TIERED COMPLEXITY SYSTEM (Future Optimization)

**Philosophy:** In the prototype phase, run EVERYTHING through the full "Best of N" pipeline. Once you've proven quality, implement this tiering to reduce costs.

### 3.1 Action Classification

```typescript
type ActionComplexity = 'trivial' | 'standard' | 'critical';

function classifyActionComplexity(
  actionType: string,
  targetEntity: Entity | null,
  context: WorldState
): ActionComplexity {
  // TRIVIAL: No consequences, pure information retrieval
  const trivialActions = [
    'look', 'examine', 'check_inventory', 'read', 'listen'
  ];
  if (trivialActions.includes(actionType)) {
    return 'trivial';
  }

  // CRITICAL: Combat, major social moments, story-critical choices
  const criticalActions = [
    'attack', 'kill', 'betray', 'confess', 'accept_quest'
  ];
  if (criticalActions.includes(actionType)) {
    return 'critical';
  }
  
  // CRITICAL: Interactions with major NPCs
  if (targetEntity?.engagement_level === 'major') {
    return 'critical';
  }

  // Default: Standard complexity
  return 'standard';
}
```

### 3.2 Pipeline Routing

```typescript
async function processAction(
  playerInput: string,
  complexity: ActionComplexity
): Promise<NarrativeOutput> {
  switch (complexity) {
    case 'trivial':
      // 1-pass: Direct narration from world state
      return await narrateDirectly(playerInput);
    
    case 'standard':
      // 2-pass: Single consequence generation + narration
      const consequences = await generateConsequences(playerInput, {
        parallelRuns: 1,
        temperature: 0.7
      });
      return await narrateConsequences(consequences);
    
    case 'critical':
      // Full "Best of N" pipeline (from Addendum A)
      const variants = await generateConsequences(playerInput, {
        parallelRuns: 3,
        temperature: 1.0,
        variantBiases: ['physical', 'social', 'mixed']
      });
      const curated = await directorCurate(variants);
      const selected = rollDice(curated);
      return await narrateConsequences(selected);
  }
}
```

**Note:** Keep this commented out in your prototype. Implement after you've validated quality with the full pipeline.

---

## 4. LLM PROVIDER ABSTRACTION

**Rationale:** Even though you're committed to Gemini 2.5 Flash, this abstraction costs you nothing now and saves you weeks if you ever need to switch models.

### 4.1 Abstract Interface

```typescript
// src/llm/provider.interface.ts

export type LLMRole = 'logic' | 'creative' | 'embedding';

export interface LLMResponse {
  text: string;
  thinkingTokens?: number;
  outputTokens?: number;
  finishReason: string;
}

export interface ILLMProvider {
  generate(
    prompt: string,
    role: LLMRole,
    config?: {
      temperature?: number;
      responseFormat?: 'json' | 'text';
      thinkingBudget?: number;
    }
  ): Promise<LLMResponse>;

  embed(text: string): Promise<number[]>;
  
  getModelName(role: LLMRole): string;
  getCostEstimate(tokens: number, role: LLMRole): number;
}
```

### 4.2 Gemini Implementation

```typescript
// src/llm/gemini.provider.ts

import { GoogleGenerativeAI } from "@google/generative-ai";
import { ILLMProvider, LLMRole, LLMResponse } from "./provider.interface";

export class GeminiProvider implements ILLMProvider {
  private genAI: GoogleGenerativeAI;
  private logicModel;
  private creativeModel;
  private embedModel;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    
    this.logicModel = this.genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      thinkingConfig: { includeThoughts: true }
    });

    this.creativeModel = this.genAI.getGenerativeModel({
      model: "gemini-2.5-flash"
    });

    this.embedModel = this.genAI.getGenerativeModel({
      model: "text-embedding-004"
    });
  }

  async generate(
    prompt: string,
    role: LLMRole,
    config?: {
      temperature?: number;
      responseFormat?: 'json' | 'text';
      thinkingBudget?: number;
    }
  ): Promise<LLMResponse> {
    const model = role === 'logic' ? this.logicModel : this.creativeModel;
    
    const generationConfig: any = {
      temperature: config?.temperature ?? 0.7
    };

    if (config?.responseFormat === 'json') {
      generationConfig.responseMimeType = "application/json";
    }

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig
    });

    const response = result.response;
    
    return {
      text: response.text(),
      thinkingTokens: response.usageMetadata?.thinkingTokens,
      outputTokens: response.usageMetadata?.candidatesTokenCount,
      finishReason: response.candidates?.[0]?.finishReason || "STOP"
    };
  }

  async embed(text: string): Promise<number[]> {
    const result = await this.embedModel.embedContent(text);
    return result.embedding.values;
  }

  getModelName(role: LLMRole): string {
    return role === 'embedding' ? 'text-embedding-004' : 'gemini-2.5-flash';
  }

  getCostEstimate(tokens: number, role: LLMRole): number {
    // Gemini 2.5 Flash pricing (as of Dec 2024)
    // Input: $0.075 per 1M tokens
    // Output: $0.30 per 1M tokens
    // Thinking tokens: Same as input
    const inputCostPer1M = 0.075;
    const outputCostPer1M = 0.30;
    
    // Rough estimate: assume 1:2 input:output ratio
    const estimatedCost = (tokens * 1.5 * inputCostPer1M) / 1_000_000;
    return estimatedCost;
  }
}
```

### 4.3 Usage in Engine

```typescript
// src/engine/core.ts

import { ILLMProvider } from '../llm/provider.interface';
import { GeminiProvider } from '../llm/gemini.provider';

export class NarrativeEngine {
  private llm: ILLMProvider;

  constructor() {
    // Easy to swap: const provider = new ClaudeProvider(apiKey);
    this.llm = new GeminiProvider(process.env.GOOGLE_API_KEY!);
  }

  async generateConsequences(input: string) {
    const response = await this.llm.generate(
      this.buildConsequencePrompt(input),
      'logic',
      { 
        temperature: 1.0, 
        responseFormat: 'json',
        thinkingBudget: 2000 
      }
    );
    
    // Log metadata
    this.logTokenUsage(response.thinkingTokens, response.outputTokens);
    
    return JSON.parse(response.text);
  }
}
```

---

## 5. TESTING INFRASTRUCTURE (Phase 0.5)

### 5.1 Test Harness Architecture

```typescript
// tests/scenario-replay.ts

import { NarrativeEngine } from '../src/engine/core';
import { z } from 'zod';
import * as fs from 'fs';

// Test Scenario Schema
const TestScenarioSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  initialWorldState: z.any(), // Your WorldState type
  actions: z.array(z.object({
    turn: z.number(),
    input: z.string(),
    expectedConstraints: z.array(z.string()) // e.g., ["npc_frank_present", "location_unchanged"]
  })),
  adversarialGoal: z.string().optional() // What bug this tests
});

type TestScenario = z.infer<typeof TestScenarioSchema>;

class ScenarioReplayHarness {
  private engine: NarrativeEngine;
  private logDir: string;

  constructor(logDir: string = './test-logs') {
    this.engine = new NarrativeEngine();
    this.logDir = logDir;
    
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  async runScenario(scenario: TestScenario): Promise<TestResult> {
    const runId = `${scenario.id}_${Date.now()}`;
    const logPath = `${this.logDir}/${runId}.json`;
    
    // Initialize world state
    this.engine.loadWorldState(scenario.initialWorldState);
    
    const turnResults: any[] = [];
    let constraintViolations: string[] = [];

    for (const action of scenario.actions) {
      // Execute action
      const result = await this.engine.processPlayerInput(action.input);
      
      // Log everything
      turnResults.push({
        turn: action.turn,
        input: action.input,
        consequences: result.consequences,
        narrative: result.narrative,
        worldStateDelta: result.worldStateDelta,
        tokensUsed: result.tokensUsed
      });

      // Validate constraints
      const violations = this.validateConstraints(
        action.expectedConstraints,
        result.worldStateDelta
      );
      constraintViolations.push(...violations);
    }

    // Write full log
    fs.writeFileSync(logPath, JSON.stringify({
      scenario: scenario,
      results: turnResults,
      violations: constraintViolations,
      summary: {
        totalTurns: scenario.actions.length,
        totalTokens: turnResults.reduce((sum, r) => sum + r.tokensUsed, 0),
        passed: constraintViolations.length === 0
      }
    }, null, 2));

    return {
      passed: constraintViolations.length === 0,
      violations: constraintViolations,
      logPath
    };
  }

  private validateConstraints(
    constraints: string[],
    worldDelta: any
  ): string[] {
    const violations: string[] = [];
    
    for (const constraint of constraints) {
      // Parse constraint syntax: "entity.frank.location == 'bar'"
      // This is simplified; real version needs a mini-parser
      if (!this.checkConstraint(constraint, worldDelta)) {
        violations.push(`Constraint failed: ${constraint}`);
      }
    }
    
    return violations;
  }

  private checkConstraint(constraint: string, worldDelta: any): boolean {
    // Implement constraint validation logic
    // For now, placeholder
    return true;
  }
}

type TestResult = {
  passed: boolean;
  violations: string[];
  logPath: string;
};
```

### 5.2 Adversarial Test Cases

Create these tests to catch the bugs from Addendum A:

```typescript
// tests/adversarial-scenarios.ts

export const RETROACTIVE_CAUSALITY_TEST: TestScenario = {
  id: "adversarial_001",
  name: "Retroactive Causality Violation",
  description: "Tests that NPCs cannot retroactively exist in locations the player observed as empty",
  initialWorldState: {
    // Player at hospital, NPC sister at unknown location
  },
  actions: [
    {
      turn: 1,
      input: "Go to the hospital room 302",
      expectedConstraints: ["location.hospital_302.occupants.length == 0"]
    },
    {
      turn: 2,
      input: "Leave and go to the cafeteria",
      expectedConstraints: ["player.location == cafeteria"]
    },
    {
      turn: 3,
      input: "Ask the nurse where my sister was yesterday",
      expectedConstraints: [
        "!narrative.contains('sister was in room 302')", // Should NOT say this
        "narrative.acknowledges_player_observation" // Should respect that player saw empty room
      ]
    }
  ],
  adversarialGoal: "Catch lazy NPC resolution contradicting player observations"
};

export const TIME_SYNC_TEST: TestScenario = {
  id: "adversarial_002",
  name: "Time Synchronization During Long Actions",
  description: "Tests that NPCs get appropriate tick count during player's multi-turn actions",
  initialWorldState: {
    // Player and NPC "Assassin" both in city
  },
  actions: [
    {
      turn: 1,
      input: "I sleep for 8 hours",
      expectedConstraints: [
        "time_advanced == 96", // 8 hours * 12 ticks/hour
        "npc.assassin.ticks_simulated >= 90" // Assassin should get ~96 ticks too
      ]
    }
  ],
  adversarialGoal: "Ensure NPCs don't just get 1 tick when player sleeps 8 hours"
};

export const UNCERTAINTY_SCOPING_TEST: TestScenario = {
  id: "adversarial_003",
  name: "No Uncertainty on Internal Actions",
  description: "Tests that internal certainty actions never fail",
  initialWorldState: {},
  actions: [
    {
      turn: 1,
      input: "Check my inventory",
      expectedConstraints: [
        "consequence.type != 'critical_failure'",
        "consequence.type != 'partial_failure'"
      ]
    },
    {
      turn: 2,
      input: "Remember what I ate for breakfast",
      expectedConstraints: [
        "consequence.type != 'critical_failure'"
      ]
    }
  ],
  adversarialGoal: "Prevent frustrating failures on mental actions"
};
```

### 5.3 Running Tests

```bash
# Run all adversarial tests
npm run test:adversarial

# Run specific scenario
npm run test:scenario -- --id adversarial_001

# Compare two engine versions
npm run test:compare -- --baseline v1 --candidate v2
```

---

## 6. LOGGING & OBSERVABILITY

### 6.1 Structured Logging

```typescript
// src/utils/logger.ts

import * as fs from 'fs';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  component: string;
  message: string;
  metadata?: any;
}

export class EngineLogger {
  private logFile: string;
  private minLevel: LogLevel;

  constructor(logFile: string, minLevel: LogLevel = LogLevel.INFO) {
    this.logFile = logFile;
    this.minLevel = minLevel;
  }

  private write(level: LogLevel, component: string, message: string, metadata?: any) {
    if (level < this.minLevel) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      component,
      message,
      metadata
    };

    fs.appendFileSync(this.logFile, JSON.stringify(entry) + '\n');
  }

  debug(component: string, message: string, metadata?: any) {
    this.write(LogLevel.DEBUG, component, message, metadata);
  }

  info(component: string, message: string, metadata?: any) {
    this.write(LogLevel.INFO, component, message, metadata);
  }

  warn(component: string, message: string, metadata?: any) {
    this.write(LogLevel.WARN, component, message, metadata);
  }

  error(component: string, message: string, metadata?: any) {
    this.write(LogLevel.ERROR, component, message, metadata);
  }

  // Special: Log full LLM interactions
  logLLMCall(
    component: string,
    prompt: string,
    response: string,
    metadata: {
      model: string;
      thinkingTokens?: number;
      outputTokens?: number;
      temperature: number;
    }
  ) {
    this.debug(component, 'LLM_CALL', {
      prompt: prompt.substring(0, 500) + '...', // Truncate for log file
      response: response.substring(0, 500) + '...',
      ...metadata
    });
  }
}
```

### 6.2 Performance Tracking

```typescript
// src/utils/performance.ts

export class PerformanceTracker {
  private stages: Map<string, number> = new Map();
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  mark(stageName: string) {
    this.stages.set(stageName, Date.now() - this.startTime);
  }

  getReport(): Record<string, number> {
    const report: Record<string, number> = {};
    
    let lastTime = 0;
    for (const [stage, absoluteTime] of this.stages.entries()) {
      report[stage] = absoluteTime - lastTime;
      lastTime = absoluteTime;
    }
    
    return report;
  }

  getTotalTime(): number {
    return Date.now() - this.startTime;
  }
}

// Usage in engine
async function processPlayerInput(input: string): Promise<any> {
  const perf = new PerformanceTracker();
  
  const ragResults = await getRelevantMemories(input);
  perf.mark('rag_retrieval');
  
  const consequences = await generateConsequences(input, ragResults);
  perf.mark('consequence_generation');
  
  const validation = await validateConsequences(consequences);
  perf.mark('validation');
  
  const narrative = await narrateConsequences(consequences);
  perf.mark('narration');
  
  // Log performance
  logger.info('Engine', 'Turn completed', {
    performanceMs: perf.getReport(),
    totalMs: perf.getTotalTime()
  });
  
  return { narrative, consequences, performance: perf.getReport() };
}
```

---

## 7. UPDATED DEVELOPMENT ROADMAP

### Phase 0: Setup & Infrastructure (1-2 days)
**Goal:** Development environment + tooling foundation

- [ ] Initialize TypeScript project with strict mode
- [ ] Setup `better-sqlite3` + schemas + indexes
- [ ] Setup `LanceDB` with embedding pipeline
- [ ] Configure `zod` validation schemas
- [ ] Implement logging framework
- [ ] Setup test harness infrastructure
- [ ] Create 3 adversarial test scenarios

**Deliverable:** `npm test` runs and logs are written to file

---

### Phase 1: The Skeleton (Deterministic) (3-5 days)
**Goal:** Prove the data model works without LLMs

- [ ] Implement CRUD operations for entities
- [ ] Implement location graph (connections between rooms)
- [ ] Implement basic player movement (deterministic)
- [ ] Implement Scene Narrator (template-based, no LLM)
  - Input: Player at Location X
  - Output: "You are in [location.description]. You see [entities in location]."
- [ ] Write test: Player walks between 3 rooms, descriptions are consistent

**Deliverable:** You can type "go north" and the world state updates correctly

---

### Phase 2: The Memory (RAG Pipeline) (3-5 days)
**Goal:** Prove RAG retrieval works and improves continuity

- [ ] Implement event logging (store every action in SQLite + LanceDB)
- [ ] Implement `getRelevantMemories()` function
- [ ] Upgrade Scene Narrator to inject RAG context
- [ ] Test: Create event 10 turns ago, verify it's retrieved on turn 11

**Deliverable:** Narrator says "You remember Frank mentioned the heist" because RAG retrieved that conversation

---

### Phase 3: The Brain (Consequence Engine) (5-7 days)
**Goal:** Prove "Best of N" produces quality, varied outcomes

- [ ] Implement LLM provider abstraction
- [ ] Implement single-pass consequence generation
- [ ] Implement "Best of N" parallel execution (3 variants)
- [ ] Implement Director agent for filtering
- [ ] Implement dice roll logic (weighted random selection)
- [ ] Implement uncertainty injection (external actions only)
- [ ] Test: "Slap Frank" produces 7 distinct, realistic outcomes
- [ ] Run adversarial test suite

**Deliverable:** Consequence tables are curated, diverse, and logically sound

---

### Phase 4: The Validation (Consistency Enforcer) (3-5 days)
**Goal:** Prove the engine respects physics and causality

- [ ] Implement reference resolution (entity lookup)
- [ ] Implement "Negative Observation" check (retroactive causality prevention)
- [ ] Implement physics validation (can't walk through walls)
- [ ] Implement prerequisite checking (can't unlock without key)
- [ ] Test: Retroactive causality scenario passes
- [ ] Test: Player can't teleport through locked door

**Deliverable:** The engine rejects logically impossible consequences

---

### Phase 5: The Life (NPC Agency) (5-7 days)
**Goal:** Prove NPCs feel autonomous and coherent

- [ ] Implement two-tier NPC tracking (passive vs. active)
- [ ] Implement NPC action generation (motivations → actions)
- [ ] Implement multi-tick loop for long player actions
- [ ] Implement relationship updates after interactions
- [ ] Test: NPC has coherent schedule over 50 turns
- [ ] Test: Time sync scenario passes (8-hour sleep)

**Deliverable:** NPCs live their lives when you're not looking

---

### Phase 6: The Polish (Final Narration) (3-5 days)
**Goal:** Make the prose beautiful and immersive

- [ ] Implement style-aware narration (literary vs. pulpy)
- [ ] Implement show-don't-tell logic (convert states to scenes)
- [ ] Implement NPC voice consistency (Frank always sounds like Frank)
- [ ] Implement pacing control (action beats vs. contemplative moments)
- [ ] Test: Same consequence generates different prose in different styles

**Deliverable:** The output reads like a novel, not a game log

---

### Phase 7: Integration & Playtesting (Ongoing)
**Goal:** Find edge cases and tune quality

- [ ] Run 100-turn playthrough session
- [ ] Analyze logs for hallucinations
- [ ] Tune Director filtering thresholds
- [ ] Tune uncertainty injection rates
- [ ] Document known limitations

**Deliverable:** A playable, coherent narrative experience

---

## 8. CRITICAL IMPLEMENTATION NOTES

### 8.1 "Quality First" Mandate

Since you've prioritized quality over optimization:

1. **ALWAYS use the full "Best of N" pipeline** in Phases 3-7
   - Don't implement tiering yet
   - Accept the 8-12 LLM calls per turn
   - Log all LLM outputs for analysis

2. **ALWAYS enable thinking budgets** for logic steps
   - Set `thinkingBudget: 2000` tokens minimum
   - Log thinking token usage separately

3. **ALWAYS validate with `zod`** before acting on LLM outputs
   - Schema validation catches hallucinations early
   - Retry on validation failure (up to 3 attempts)

4. **NEVER skip logging**
   - Every LLM call → logged
   - Every consequence generation → logged
   - Every validation failure → logged

### 8.2 When to Optimize (Future You)

Only start optimizing when:
- [ ] You've completed a 500-turn playthrough
- [ ] The quality is proven (no major logic bugs)
- [ ] You have performance baselines from logs
- [ ] You've analyzed which LLM calls are redundant

Then, in this order:
1. Implement tiered complexity (Section 3)
2. Cache common narration templates
3. Batch NPC updates (simulate 10 NPCs in one call)
4. Implement prompt compression

### 8.3 Gemini 2.5 Flash Gotchas

Based on the current model:
- **Context window:** 1M tokens is huge, but embeddings still make RAG faster
- **Thinking tokens:** Count against your quota separately—monitor this
- **JSON mode:** Extremely reliable, but always validate with `zod` anyway
- **Rate limits:** 1500 RPM on free tier, 4000 RPM on paid—your "Best of N" uses 3 calls, so max ~500 player actions/minute

---

## 9. SAMPLE PROMPTS (Reference)

### 9.1 Consequence Engine Prompt (Logic Model)

```
You are the Consequence Engine for an interactive fiction simulation.

[WORLD STATE]
{worldStateJSON}

[RELEVANT MEMORIES]
{ragContext}

[PLAYER ACTION]
{playerInput}

[TASK]
Generate a list of 20 possible consequences for this action, ranging from critical failure to critical success. Each consequence must:
1. Respect physics and causality
2. Be internally consistent with the world state
3. Include both immediate and delayed effects
4. Consider NPC psychology and relationships

[BIAS INSTRUCTION - {variantType}]
{variantType === 'physical' ? 'Bias toward environmental/physical outcomes' : 
 variantType === 'social' ? 'Bias toward social/psychological outcomes' : 
 'Mix both physical and social outcomes'}

[OUTPUT FORMAT]
Return JSON array of consequence objects:
{
  "consequence_id": string,
  "outcome_type": "critical_failure" | "failure" | "partial_success" | "success" | "critical_success",
  "immediate_effects": string[],
  "delayed_effects": string[],
  "affected_entities": string[],
  "narrative_hooks": string[],
  "probability_weight": number // 1-100
}
```

### 9.2 Director Prompt (Filtering)
```
You are the Director. You receive 60 potential consequences (from 3 parallel generations) and must select the BEST outcomes to create a complete probability distribution.

[RAW CONSEQUENCES]
{allConsequences}

[REQUIRED OUTCOME DISTRIBUTION]
You must select consequences that cover ALL of these outcome types:
- CRITICAL_SUCCESS (exceeds expectations, bonus effects)
- SUCCESS (clean execution, goal achieved)
- SUCCESS_WITH_COMP (goal achieved but creates new problem)
- PARTIAL_SUCCESS (partially works, incomplete result)
- FAILURE (goal not achieved, no additional consequence)
- FAILURE_WITH_COMP (goal fails AND creates new problem)
- CRITICAL_FAILURE (spectacular disaster, major consequence)

Each outcome type MUST be represented at least once. Some may appear multiple times if you have >7 total slots.

[SELECTION CRITERIA]
1. ELIMINATE hallucinations (contradicts world state)
2. ELIMINATE duplicates (similar outcomes even if different category)
3. ELIMINATE boring outcomes (too generic)
4. PREFER outcomes that:
   - Create interesting narrative tension
   - Respect character psychology
   - Have cascading effects
   - Feel surprising but logical

[OUTPUT]
Return JSON array of 7-10 consequence objects (use the same schema from Stage 1).

MANDATORY: Your selection MUST include at least one of each outcome type listed above.

Example valid distribution:
- 1x CRITICAL_SUCCESS
- 1x SUCCESS
- 1x SUCCESS_WITH_COMP
- 2x PARTIAL_SUCCESS
- 1x FAILURE_WITH_COMP
- 1x CRITICAL_FAILURE

Example INVALID distribution (missing FAILURE):
- 2x CRITICAL_SUCCESS
- 2x SUCCESS
- 1x PARTIAL_SUCCESS
- 2x CRITICAL_FAILURE
```

### 9.3 Narrator Prompt (Creative Model)

```
You are a literary narrator for an interactive fiction story.

[WORLD STATE]
{relevantWorldState}

[PLAYER ACTION]
{playerInput}

[CONSEQUENCE SELECTED]
{selectedConsequence}

[STYLE GUIDE]
- Tone: {userPreferredTone} // e.g., "noir", "epic fantasy", "cosmic horror"
- POV: Second person
- Tense: Present tense
- Show, don't tell: Convert state changes into vivid scenes

[TASK]
Write 2-4 paragraphs describing this moment. Focus on:
1. Sensory details (sights, sounds, smells)
2. Character reactions (facial expressions, body language)
3. Emotional resonance
4. Narrative momentum (what happens next?)

Do NOT:
- Repeat the player's input verbatim
- Explain mechanics or probability
- Use generic descriptions

[OUTPUT]
Return plain text prose (no JSON, no markdown).
```

---

## 10. FINAL CHECKLIST

Before you start coding:

- [ ] Design Doc v4.0.0 is updated with new entity schema (Section 5.1.2)
- [ ] Addendum A is incorporated into main doc
- [ ] This guide (Addendum B) is saved and accessible
- [ ] You've created a GitHub repo with proper `.gitignore`
- [ ] You've setup environment variables (`.env` file with `GOOGLE_API_KEY`)
- [ ] You've budgeted API costs (estimate $50-100 for prototype development)
- [ ] You've read the LanceDB and better-sqlite3 docs

Before you move to the next phase:

- [ ] All tests for current phase pass
- [ ] Logs show no validation errors
- [ ] You've done a manual playthrough of the new feature
- [ ] You've committed code with descriptive commit message

---

## 11. CONCLUSION

This guide gives you a battle-tested architecture that prioritizes correctness and quality. The key principles:

1. **Log everything** (you'll thank yourself during debugging)
2. **Test adversarially** (don't wait for bugs to find you)
3. **Validate rigorously** (`zod` catches hallucinations before they corrupt state)
4. **Abstract strategically** (LLM provider abstraction is cheap insurance)
5. **Optimize later** (prove quality first, then trim costs)

The roadmap is aggressive but achievable. Each phase builds on the last, and the test harness ensures you don't introduce regressions.

**Estimated Total Development Time:** 25-35 days of focused work

**Estimated Token Budget for Prototype:** 50-100M tokens (~$5-10 USD at Gemini Flash pricing)

