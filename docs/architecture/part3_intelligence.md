# Part 3: Intelligence Architecture — AI, LLM, Graph, and Analytics

> **Document Classification**: RESTRICTED — Law Enforcement Sensitive  
> **Version**: 2.0.0  
> **Last Updated**: 2026-07-17  
> **Authors**: Enterprise Architecture Council  
> **Review Board**: Google Distinguished Engineer, Microsoft Principal Architect, Amazon VP of Engineering, Netflix Cloud Architect, Palantir Gotham Architect  
> **Scope**: Sections 11, 12, 13, 20 — AI/ML Intelligence Subsystems  

---

## Table of Contents — Part 3

- [11. Complete AI Architecture](#11-complete-ai-architecture)
  - [11.1 Multi-Agent System Philosophy](#111-multi-agent-system-philosophy)
  - [11.2 LangGraph State Machine Architecture](#112-langgraph-state-machine-architecture)
  - [11.3 Agent Catalog (15 Agents)](#113-agent-catalog-15-agents)
  - [11.4 Tool Registry](#114-tool-registry)
  - [11.5 Agent Communication & Orchestration Patterns](#115-agent-communication--orchestration-patterns)
  - [11.6 Agent Observability & Governance](#116-agent-observability--governance)
- [12. Enterprise LLM Architecture](#12-enterprise-llm-architecture)
  - [12.1 Model Selection Matrix](#121-model-selection-matrix)
  - [12.2 Prompt Engineering Patterns](#122-prompt-engineering-patterns)
  - [12.3 Guardrails Architecture](#123-guardrails-architecture)
  - [12.4 Hallucination Prevention Framework](#124-hallucination-prevention-framework)
  - [12.5 RAG Pipeline Design](#125-rag-pipeline-design)
  - [12.6 Conversation Memory Architecture](#126-conversation-memory-architecture)
  - [12.7 Multi-Turn Planning for Complex Investigations](#127-multi-turn-planning-for-complex-investigations)
  - [12.8 Cost Optimization](#128-cost-optimization)
  - [12.9 Safety & Compliance](#129-safety--compliance)
- [13. Graph Intelligence Architecture](#13-graph-intelligence-architecture)
  - [13.1 Knowledge Graph Design Philosophy](#131-knowledge-graph-design-philosophy)
  - [13.2 Complete Graph Schema](#132-complete-graph-schema)
  - [13.3 Graph Algorithms & Intelligence Pipelines](#133-graph-algorithms--intelligence-pipelines)
  - [13.4 Graph-to-Insight Pipeline](#134-graph-to-insight-pipeline)
  - [13.5 Integration with AI Agents](#135-integration-with-ai-agents)
  - [13.6 Neo4j Scaling Strategy](#136-neo4j-scaling-strategy)
- [20. AI Analytics (Detailed)](#20-ai-analytics-detailed)
  - [20.1 Crime Prediction Models (10 Models)](#201-crime-prediction-models-10-models)
  - [20.2 Model Governance & MLOps](#202-model-governance--mlops)
  - [20.3 Bias, Fairness & Ethical Framework](#203-bias-fairness--ethical-framework)
  - [20.4 Model Deployment Architecture](#204-model-deployment-architecture)

---

# 11. Complete AI Architecture

## 11.1 Multi-Agent System Philosophy

### Design Rationale

The Karnataka Crime Intelligence Platform demands cognitive capabilities far beyond what any single LLM call can deliver. A police officer asking *"Show me emerging crime patterns in Bengaluru North connected to known gang networks, and predict next likely targets"* requires:

1. **SQL execution** against CaseMaster, Accused, and geography tables
2. **Graph traversal** across Neo4j criminal networks
3. **Geospatial analysis** of crime coordinates
4. **Time-series forecasting** on crime trends
5. **Natural language synthesis** of all findings into an actionable report

No single prompt can orchestrate this reliably. We adopt a **Multi-Agent Architecture** built on **LangGraph** — a stateful, graph-based orchestration framework from LangChain — where each agent is a specialized cognitive worker with bounded responsibility, dedicated tools, and explicit contracts.

### Why LangGraph Over Alternatives

| Framework | Strengths | Weaknesses | Verdict |
|---|---|---|---|
| **LangGraph** | Stateful graphs, conditional edges, cycles, persistence, human-in-the-loop, streaming | Newer ecosystem | ✅ **Selected** — best fit for complex, stateful investigation workflows |
| **LangChain AgentExecutor** | Simple, well-documented | No cycles, limited state management, poor multi-agent support | ❌ Too simplistic for investigation workflows |
| **AutoGen (Microsoft)** | Strong multi-agent conversation | Heavyweight, conversation-centric, poor tool integration | ❌ Overhead without proportional benefit |
| **CrewAI** | Role-based agents, easy setup | Limited state control, no conditional routing | ❌ Insufficient for law enforcement precision requirements |
| **Custom Orchestration** | Full control | Massive engineering effort, reinventing the wheel | ❌ Build vs. buy — LangGraph already solves 90% |

### Architectural Principles

1. **Single Responsibility**: Each agent owns exactly one cognitive domain (SQL, Graph, Geospatial, etc.)
2. **Explicit State**: All inter-agent communication flows through a shared, typed state object — no hidden side channels
3. **Deterministic Routing**: The Supervisor uses a deterministic decision tree (not LLM-based routing) for 80% of cases; LLM-based routing only for ambiguous queries
4. **Fail-Safe Degradation**: Every agent has a defined fallback — the system never returns "I don't know" without exhausting all paths
5. **Human-in-the-Loop**: Critical decisions (arrest risk scoring, gang classification) require human confirmation before action
6. **Auditability**: Every agent invocation, tool call, and decision is logged with full provenance for evidentiary chain
7. **Bounded Latency**: Each agent has a time budget; the Supervisor enforces global timeout with partial-result return
8. **Memory Isolation**: Investigation-scoped memory is isolated per case to prevent cross-contamination

---

## 11.2 LangGraph State Machine Architecture

### Global State Schema

```
┌──────────────────────────────────────────────────────────────────┐
│                    InvestigationState (TypedDict)                 │
├──────────────────────────────────────────────────────────────────┤
│ messages: List[BaseMessage]          # Full conversation history │
│ query: str                           # Original user query       │
│ query_type: QueryClassification      # Classified intent         │
│ plan: InvestigationPlan              # Decomposed sub-tasks      │
│ active_agents: List[str]             # Currently executing       │
│ results: Dict[str, AgentResult]      # Per-agent results         │
│ errors: List[AgentError]             # Agent failures            │
│ confidence: float                    # Overall confidence 0-1    │
│ evidence_chain: List[Evidence]       # Provenance trail          │
│ final_report: Optional[str]          # Synthesized output        │
│ user_context: UserContext            # Officer role, clearance    │
│ investigation_id: str                # Unique investigation ID   │
│ iteration_count: int                 # Loop counter (max 5)      │
│ memory_refs: List[str]              # Pointers to stored memory  │
│ pending_approval: Optional[Action]   # Human-in-the-loop gate    │
│ metadata: Dict                       # Timestamps, audit info    │
└──────────────────────────────────────────────────────────────────┘
```

### Master LangGraph State Machine

```
                                    ┌─────────────┐
                                    │   START     │
                                    │  (User      │
                                    │   Query)    │
                                    └──────┬──────┘
                                           │
                                           ▼
                                ┌──────────────────┐
                                │  MEMORY AGENT    │
                                │  Load context,   │
                                │  prior history   │
                                └────────┬─────────┘
                                         │
                                         ▼
                                ┌──────────────────┐
                                │ SUPERVISOR AGENT │
                                │ Classify query,  │
                                │ route to Planner │
                                │ or direct agent  │
                                └───┬──────────┬───┘
                                    │          │
                          ┌─────────┘          └──────────┐
                     Simple Query              Complex Query
                          │                         │
                          ▼                         ▼
                 ┌────────────────┐      ┌──────────────────┐
                 │ Direct Agent   │      │  PLANNER AGENT   │
                 │ (SQL/Search/   │      │  Decompose into  │
                 │  Graph only)   │      │  sub-tasks with  │
                 │                │      │  dependencies    │
                 └───────┬────────┘      └────────┬─────────┘
                         │                        │
                         │                        ▼
                         │              ┌──────────────────────┐
                         │              │  PARALLEL DISPATCH   │
                         │              │                      │
                         │              │ ┌────┐ ┌────┐ ┌────┐│
                         │              │ │SQL │ │GRPH│ │SRCH││
                         │              │ │AGT │ │AGT │ │AGT ││
                         │              │ └──┬─┘ └──┬─┘ └──┬─┘│
                         │              │    │      │      │  │
                         │              │    ▼      ▼      ▼  │
                         │              │  ┌──────────────┐   │
                         │              │  │   MERGE      │   │
                         │              │  │   RESULTS    │   │
                         │              │  └──────┬───────┘   │
                         │              └─────────┼───────────┘
                         │                        │
                         │              ┌─────────▼───────────┐
                         │              │ SEQUENTIAL DISPATCH  │
                         │              │ (Depends on merged)  │
                         │              │                      │
                         │              │ ┌──────┐ ┌────────┐ │
                         │              │ │FRCST │ │RISK    │ │
                         │              │ │AGT   │ │ASSESS  │ │
                         │              │ └──┬───┘ └───┬────┘ │
                         │              │    │         │      │
                         │              │    ▼         ▼      │
                         │              │  ┌──────────────┐   │
                         │              │  │   MERGE      │   │
                         │              │  └──────┬───────┘   │
                         │              └─────────┼───────────┘
                         │                        │
                         ├────────────────────────┘
                         │
                         ▼
               ┌──────────────────┐
               │ VERIFICATION     │
               │ AGENT            │
               │ Cross-check      │
               │ facts & data     │
               └────────┬─────────┘
                        │
                        ▼
               ┌──────────────────┐       ┌──────────────────┐
               │ REFLECTION /     │──No──▶│  RE-ROUTE TO     │
               │ CRITIC AGENT     │       │  SUPERVISOR      │
               │ Quality gate     │       │  (max 3 loops)   │
               │ Pass? ──────────▶│       └──────────────────┘
               └────────┬─────────┘
                   Yes  │
                        ▼
               ┌──────────────────┐
               │ EXPLAINABILITY   │
               │ AGENT            │
               │ Make reasoning   │
               │ transparent      │
               └────────┬─────────┘
                        │
                        ▼
               ┌──────────────────┐
               │ REPORT           │
               │ GENERATION       │
               │ AGENT            │
               │ Final synthesis  │
               └────────┬─────────┘
                        │
                        ▼
               ┌──────────────────┐
               │ RECOMMENDATION   │
               │ AGENT            │
               │ Next steps &     │
               │ suggestions      │
               └────────┬─────────┘
                        │
                        ▼
               ┌──────────────────┐
               │ MEMORY AGENT     │
               │ Persist results  │
               │ & context        │
               └────────┬─────────┘
                        │
                        ▼
                   ┌─────────┐
                   │   END   │
                   │ (Return │
                   │ to User)│
                   └─────────┘
```

### Conditional Edge Logic

```
SUPERVISOR routing decision tree:

IF query_type == "simple_lookup":
    → Route directly to SQL Agent
ELIF query_type == "text_search":
    → Route directly to Search Agent
ELIF query_type == "network_query":
    → Route directly to Graph Agent
ELIF query_type == "geospatial":
    → Route directly to Geospatial Agent
ELIF query_type == "complex_investigation":
    → Route to Planner Agent (full pipeline)
ELIF query_type == "forecast_request":
    → Route to Forecast Agent
ELIF query_type == "anomaly_report":
    → Route to Anomaly Agent
ELIF query_type == "risk_assessment":
    → Route to Risk Agent → Verification → Report
ELIF query_type == "follow_up":
    → Memory Agent (load context) → Supervisor (re-classify)
ELSE:
    → Planner Agent (default for ambiguous)
```

---

## 11.3 Agent Catalog (15 Agents)

### Agent 1: Supervisor Agent

| Attribute | Specification |
|---|---|
| **Purpose** | Central orchestrator — classifies user intent, decomposes tasks, routes to specialized agents, enforces global policies (timeouts, retries, security), aggregates results |
| **Responsibility Boundary** | Does NOT perform any data retrieval or analysis itself — purely orchestration |
| **LLM Model** | **Gemini 2.5 Flash** — low latency critical for routing decisions; classification doesn't need deep reasoning |
| **Why This Model** | Routing decisions must complete in <200ms. Flash provides adequate classification accuracy at 10x lower latency than Pro. Cost per routing decision: ~$0.0001 |
| **Performance Budget** | **≤200ms** total including LLM call, state updates, and routing decision |

**Input Schema:**
```
{
  "query": "string — raw user query",
  "user_context": {
    "officer_id": "string — KGID from Employee table",
    "rank": "string — from Rank table",
    "unit_id": "string — from Unit table",
    "clearance_level": "enum — L1/L2/L3/L4/L5",
    "active_investigation_ids": ["string"]
  },
  "conversation_history": ["BaseMessage[]"],
  "session_metadata": {
    "session_id": "string",
    "started_at": "ISO8601",
    "turn_count": "int"
  }
}
```

**Output Schema:**
```
{
  "query_classification": {
    "type": "enum — simple_lookup|text_search|network_query|geospatial|
             complex_investigation|forecast_request|anomaly_report|
             risk_assessment|follow_up|administrative",
    "confidence": "float 0-1",
    "sub_intents": ["string — secondary intents detected"]
  },
  "routing_decision": {
    "pattern": "enum — direct|sequential|parallel|hybrid",
    "agent_sequence": [
      {"agent": "string", "priority": "int", "timeout_ms": "int",
       "depends_on": ["string — agent IDs"]}
    ]
  },
  "security_check": {
    "authorized": "boolean",
    "redaction_required": ["string — field names to redact"],
    "audit_flag": "boolean — whether this query requires audit logging"
  }
}
```

**Tools Available:**
| Tool | Purpose |
|---|---|
| `classify_query` | ML-based intent classifier (fine-tuned on 50K police query examples) |
| `check_authorization` | Validates officer clearance against RBAC/ABAC engine |
| `load_agent_registry` | Retrieves available agents and their current health status |
| `enforce_rate_limit` | Per-user, per-unit rate limiting |
| `emit_audit_event` | Logs every routing decision to Catalyst Signals → audit topic |

**Prompt Engineering Strategy:**
- **System prompt**: Contains query taxonomy with 50+ example classifications from Karnataka Police domain
- **Few-Shot**: 15 labeled examples covering each query type
- **Chain-of-Thought**: Explicitly asks model to reason about: (1) What data sources are needed? (2) Are there dependencies between data sources? (3) What is the appropriate routing pattern?
- **Constrained output**: Uses structured JSON output mode (Gemini's responseSchema) to guarantee valid routing decisions

**Error Handling:**
| Error Type | Response |
|---|---|
| LLM timeout (>200ms) | Fall back to rule-based classifier using keyword matching |
| Classification confidence < 0.6 | Route to Planner Agent (safest default) |
| Unauthorized query | Return 403 with specific policy violation message |
| Agent registry unavailable | Use cached registry (max 5 min stale) |
| Rate limit exceeded | Return 429 with retry-after header |

**Fallback Behavior:** If the Supervisor itself fails, a lightweight rule-based router (no LLM dependency) handles the request using keyword extraction and regex patterns. This ensures the system is never fully dependent on LLM availability.

---

### Agent 2: Planner Agent

| Attribute | Specification |
|---|---|
| **Purpose** | Decomposes complex, multi-faceted investigation queries into an ordered DAG (Directed Acyclic Graph) of sub-tasks, identifying parallelism opportunities and data dependencies |
| **Responsibility Boundary** | Plans but does NOT execute — produces an execution plan consumed by the Supervisor |
| **LLM Model** | **Gemini 2.5 Pro** — complex reasoning required for accurate task decomposition |
| **Why This Model** | Planning requires understanding of data model relationships (26 tables), graph schema, and geospatial operations. Pro's 1M token context window allows including full schema documentation in system prompt |
| **Performance Budget** | **≤2000ms** — planning happens once per complex query; latency amortized across execution |

**Input Schema:**
```
{
  "query": "string — classified complex query",
  "query_classification": "QueryClassification from Supervisor",
  "available_agents": ["string — healthy agent IDs"],
  "schema_context": {
    "er_tables": ["table metadata from Data Store"],
    "graph_schema": "Neo4j node/relationship types",
    "search_indices": ["Elasticsearch index names"]
  },
  "constraints": {
    "max_agents": "int — max concurrent agents (default 5)",
    "max_total_time_ms": "int — global timeout (default 15000)",
    "data_clearance": "enum — what data this officer can access"
  }
}
```

**Output Schema:**
```
{
  "plan": {
    "plan_id": "uuid",
    "description": "string — human-readable plan summary",
    "steps": [
      {
        "step_id": "string",
        "agent": "string — target agent",
        "task": "string — specific task description",
        "input_mapping": "Dict — how to derive input from prior steps",
        "depends_on": ["step_id"],
        "timeout_ms": "int",
        "critical": "boolean — if failure should abort entire plan",
        "fallback_step": "Optional[step_id]"
      }
    ],
    "execution_order": [
      ["step_1", "step_2"],   // parallel group 1
      ["step_3"],              // sequential after group 1
      ["step_4", "step_5"]    // parallel group 2
    ],
    "estimated_total_time_ms": "int",
    "confidence": "float 0-1"
  }
}
```

**Tools Available:**
| Tool | Purpose |
|---|---|
| `schema_lookup` | Retrieves ER schema, column types, relationships for specified tables |
| `graph_schema_lookup` | Retrieves Neo4j node labels, relationship types, property keys |
| `index_catalog` | Lists Elasticsearch indices, their mappings, and available fields |
| `historical_plans` | Retrieves similar past plans and their success/failure outcomes |
| `estimate_latency` | Predicts agent execution time based on query complexity heuristics |

**Prompt Engineering Strategy:**
- **Tree-of-Thought (ToT)**: Generates 3 candidate plans, evaluates each for completeness, parallelism, and estimated latency, then selects the optimal plan
- **Schema-Grounded**: Full ER schema and graph schema injected into system prompt so the model understands exactly which tables/nodes contain relevant data
- **Plan Templates**: 20 pre-defined plan templates for common investigation patterns (e.g., "suspect network analysis", "crime trend for area", "case similarity search") used as few-shot examples
- **Self-Validation**: Prompt includes validation rules — every step must reference a valid agent, dependencies must form a DAG (no cycles), total estimated time must be under budget

**Error Handling:**
| Error Type | Response |
|---|---|
| Plan exceeds timeout budget | Trim low-priority non-critical steps; emit warning |
| Cyclic dependency detected | Re-plan with explicit acyclicity constraint |
| Referenced agent unavailable | Substitute with fallback agent or merge into another step |
| Schema lookup fails | Use cached schema (max 1 hour stale) |
| LLM produces invalid plan | Retry with stricter structured output constraints (max 2 retries) |

**Fallback Behavior:** If planning fails entirely, the Supervisor falls back to a pre-defined "generic investigation" plan template that runs SQL Agent → Search Agent → Report Generation Agent in sequence.

---

### Agent 3: SQL Agent

| Attribute | Specification |
|---|---|
| **Purpose** | Translates natural language questions into ZCQL (Zoho Catalyst Query Language) / SQL queries, executes them against Catalyst Data Store, and returns structured results |
| **Responsibility Boundary** | Read-only queries only (SELECT). Never performs writes/deletes. Restricted to tables the officer's clearance level permits |
| **LLM Model** | **Gemini 2.5 Pro** — SQL generation requires deep understanding of schema relationships and complex JOINs across 26 tables |
| **Why This Model** | SQL accuracy is paramount — incorrect queries can mislead investigations. Pro's reasoning capability reduces SQL errors by ~40% vs. Flash in internal benchmarks. The 1M token context fits full DDL + 50 example queries |
| **Performance Budget** | **≤3000ms** total (LLM generation ≤1500ms + query execution ≤1500ms) |

**Input Schema:**
```
{
  "task": "string — natural language data question",
  "target_tables": ["string — tables identified by Planner"],
  "filters": {
    "district_ids": ["string — from District table"],
    "date_range": {"from": "ISO8601", "to": "ISO8601"},
    "crime_head_ids": ["string — from CrimeHead table"],
    "unit_ids": ["string — from Unit table"]
  },
  "result_format": "enum — table|count|aggregation|timeseries",
  "max_rows": "int — default 1000, max 10000"
}
```

**Output Schema:**
```
{
  "generated_query": "string — the ZCQL/SQL query",
  "query_explanation": "string — human-readable explanation of what the query does",
  "results": {
    "columns": ["string"],
    "rows": [["any"]],
    "row_count": "int",
    "truncated": "boolean"
  },
  "execution_metadata": {
    "execution_time_ms": "int",
    "rows_scanned": "int",
    "tables_accessed": ["string"]
  },
  "confidence": "float 0-1",
  "warnings": ["string — e.g., 'Results may be incomplete — date range exceeds indexed period'"]
}
```

**Tools Available:**
| Tool | Purpose |
|---|---|
| `execute_zcql` | Executes ZCQL query against Catalyst Data Store with timeout and row limit |
| `get_table_schema` | Retrieves DDL, column types, constraints, indexes for specified tables |
| `get_sample_data` | Returns 5 sample rows for specified table (aids query construction) |
| `validate_query` | Parses and validates ZCQL syntax without executing |
| `get_table_stats` | Returns row counts, null percentages, value distributions for columns |
| `explain_query` | Returns query execution plan for performance analysis |

**Prompt Engineering Strategy:**
- **DDL-Grounded**: Complete DDL for all 26 tables injected into system prompt with column descriptions, FK relationships, and sample values
- **Chain-of-Thought**: Prompt forces model to: (1) Identify relevant tables, (2) Determine JOIN path, (3) Apply filters, (4) Write query, (5) Self-validate against schema
- **Few-Shot with 50 examples**: Covering all common query patterns — simple lookups, multi-table JOINs, aggregations with GROUP BY, date range filters, subqueries, CASE statements
- **Error correction loop**: If query execution fails, the error message is fed back to the LLM with the original query for correction (max 2 retries)
- **ZCQL-specific training**: System prompt includes ZCQL syntax differences from standard SQL (e.g., Catalyst-specific functions, pagination syntax)

**Error Handling:**
| Error Type | Response |
|---|---|
| ZCQL syntax error | Feed error to LLM for correction (max 2 retries) |
| Query timeout (>1500ms) | Add LIMIT, simplify JOINs, retry |
| No results returned | Return empty result set with suggestion to broaden filters |
| Unauthorized table access | Return error with specific table/column that was denied |
| Result set too large (>10K rows) | Apply aggregation and return summary + offer to export full dataset |

**Fallback Behavior:** If LLM-based SQL generation fails after retries, fall back to a template-based query builder using the structured filters from input (bypassing natural language understanding).

---

### Agent 4: Graph Agent

| Attribute | Specification |
|---|---|
| **Purpose** | Executes Cypher queries against Neo4j Aura for network analysis — traversing criminal relationships, detecting communities, computing centrality, finding shortest paths between entities |
| **Responsibility Boundary** | Read-only graph queries. Complex write operations (node creation, relationship updates) go through dedicated ETL pipelines, not the agent |
| **LLM Model** | **Gemini 2.5 Pro** — Cypher query generation requires understanding of graph theory concepts and the specific schema |
| **Why This Model** | Cypher is less common in LLM training data than SQL; Pro's reasoning ability is necessary for multi-hop traversals and algorithm parameter selection |
| **Performance Budget** | **≤5000ms** total (LLM ≤1500ms + Neo4j execution ≤3500ms for complex traversals) |

**Input Schema:**
```
{
  "task": "string — graph analysis question",
  "entity_references": [
    {"type": "enum — Person|Case|Location|Organization",
     "identifier": "string — name, FIR number, etc.",
     "resolved_id": "Optional[string] — Neo4j node ID if pre-resolved"}
  ],
  "analysis_type": "enum — traversal|community|centrality|shortest_path|
                    similarity|link_prediction|temporal|subgraph",
  "depth": "int — max traversal depth (default 3, max 6)",
  "filters": {
    "relationship_types": ["string — limit to specific relationships"],
    "time_range": {"from": "ISO8601", "to": "ISO8601"},
    "min_confidence": "float — minimum edge weight/confidence"
  }
}
```

**Output Schema:**
```
{
  "generated_cypher": "string — the Cypher query",
  "cypher_explanation": "string — what the query does in plain language",
  "results": {
    "nodes": [{"id": "string", "labels": ["string"], "properties": {}}],
    "relationships": [{"id": "string", "type": "string",
                        "start_node": "string", "end_node": "string",
                        "properties": {}}],
    "paths": [{"nodes": ["string"], "relationships": ["string"]}],
    "metrics": {"key": "float — e.g., centrality scores, community IDs"}
  },
  "visualization_data": {
    "graph_json": "D3.js-compatible force-directed graph JSON",
    "highlighted_nodes": ["string — IDs of most important nodes"],
    "clusters": [{"id": "int", "member_ids": ["string"]}]
  },
  "insights": ["string — key findings from graph analysis"],
  "confidence": "float 0-1"
}
```

**Tools Available:**
| Tool | Purpose |
|---|---|
| `execute_cypher` | Runs Cypher query against Neo4j Aura with timeout and result limit |
| `get_graph_schema` | Retrieves node labels, relationship types, property keys, constraints |
| `resolve_entity` | Fuzzy-matches entity name to Neo4j node ID using full-text index |
| `run_gds_algorithm` | Executes Neo4j Graph Data Science algorithm (PageRank, Louvain, etc.) |
| `get_node_neighborhood` | Returns 1-hop neighborhood for a given node (fast preview) |
| `export_subgraph` | Exports a subgraph as JSON for D3.js visualization |

**Prompt Engineering Strategy:**
- **Schema-Grounded**: Full Neo4j schema (node labels, relationship types, property keys) in system prompt — see Section 13 for complete schema
- **Algorithm Selection Guide**: System prompt includes decision tree for selecting appropriate GDS algorithm based on analysis type
- **ReAct Pattern**: Agent reasons about what information it needs, queries the graph, observes results, and iterates if needed
- **Cypher Templates**: 30 pre-built Cypher templates for common law enforcement patterns (e.g., "find all co-accused networks for person X within 3 hops")
- **Safety constraints**: Prompt explicitly prohibits unbounded traversals (must specify depth limit), DETACH DELETE operations, and schema modifications

**Error Handling:**
| Error Type | Response |
|---|---|
| Entity not found in graph | Search Elasticsearch for fuzzy match, then retry with resolved ID |
| Query timeout (>3500ms) | Reduce depth, add LIMIT, retry with simplified pattern |
| Memory limit exceeded (Neo4j) | Break into smaller subgraph queries, merge results client-side |
| Cypher syntax error | Feed error to LLM for correction (max 2 retries) |
| GDS algorithm fails | Fall back to equivalent Cypher-only approach (slower but reliable) |

**Fallback Behavior:** If Neo4j is completely unavailable, the Graph Agent falls back to Catalyst Data Store queries using the relational representation of key relationships (Accused ↔ CaseMaster ↔ Victim) — degraded but functional.

---

### Agent 5: Search Agent

| Attribute | Specification |
|---|---|
| **Purpose** | Executes full-text search against Elasticsearch (for structured/keyword search) and semantic search against Pinecone (for meaning-based retrieval). Handles hybrid search with re-ranking |
| **Responsibility Boundary** | Search and retrieval only — does not analyze or interpret results beyond relevance scoring |
| **LLM Model** | **Gemini 2.5 Flash** — search query formulation doesn't require deep reasoning; speed is critical for interactive search |
| **Why This Model** | Search queries are relatively simple transformations from natural language. Flash's speed (~100ms) keeps total search latency under budget |
| **Performance Budget** | **≤2000ms** total (LLM ≤300ms + Elasticsearch ≤800ms + Pinecone ≤500ms + re-ranking ≤400ms) |

**Input Schema:**
```
{
  "task": "string — search query in natural language",
  "search_mode": "enum — keyword|semantic|hybrid",
  "indices": ["string — Elasticsearch indices to search"],
  "pinecone_namespace": "Optional[string] — for semantic search",
  "filters": {
    "date_range": {"from": "ISO8601", "to": "ISO8601"},
    "district_ids": ["string"],
    "crime_heads": ["string"],
    "case_status": ["string"]
  },
  "top_k": "int — default 20, max 100",
  "include_highlights": "boolean — return matching text snippets"
}
```

**Output Schema:**
```
{
  "search_results": [
    {
      "doc_id": "string",
      "source": "enum — elasticsearch|pinecone",
      "score": "float",
      "title": "string — case number or document title",
      "snippet": "string — relevant text excerpt with highlights",
      "metadata": {
        "case_id": "string",
        "fir_number": "string",
        "district": "string",
        "date": "ISO8601",
        "crime_head": "string"
      }
    }
  ],
  "total_hits": "int",
  "search_metadata": {
    "elasticsearch_time_ms": "int",
    "pinecone_time_ms": "int",
    "rerank_time_ms": "int",
    "query_expansion_terms": ["string"]
  }
}
```

**Tools Available:**
| Tool | Purpose |
|---|---|
| `elasticsearch_search` | Executes Elasticsearch DSL query with filters, aggregations, highlights |
| `pinecone_query` | Queries Pinecone with embedding vector, metadata filters, top-k |
| `embed_text` | Generates embedding for query text using `text-embedding-004` |
| `rerank_results` | Re-ranks mixed results using Cohere Rerank or cross-encoder |
| `expand_query` | Adds synonyms and related terms (e.g., "robbery" → "dacoity", "loot") |
| `get_index_mapping` | Retrieves Elasticsearch index mappings for query construction |

**Prompt Engineering Strategy:**
- **Query Expansion**: System prompt includes Karnataka-specific crime terminology mappings (IPC section names ↔ common terms, Kannada transliterations)
- **Few-Shot**: 20 examples of natural language → Elasticsearch DSL transformations
- **Hybrid Strategy Selection**: Prompt guides model to choose keyword search for specific terms (FIR numbers, names) and semantic search for conceptual queries ("cases involving domestic dispute escalating to murder")

**Error Handling:**
| Error Type | Response |
|---|---|
| Elasticsearch cluster unavailable | Fall back to Pinecone-only semantic search |
| Pinecone unavailable | Fall back to Elasticsearch-only keyword search |
| Zero results | Broaden filters, expand query terms, retry |
| Embedding API timeout | Use cached embedding for similar past queries |
| Re-ranker failure | Return results with original scores (skip re-ranking) |

**Fallback Behavior:** If both Elasticsearch and Pinecone are unavailable, fall back to ZCQL LIKE queries against Catalyst Data Store BriefFacts column — significantly degraded but prevents total search failure.

---

### Agent 6: Forecast Agent

| Attribute | Specification |
|---|---|
| **Purpose** | Generates time-series predictions for crime trends — forecasting crime counts per district/crime-type/time-period using statistical and neural models |
| **Responsibility Boundary** | Produces forecasts with confidence intervals and explanations. Does NOT prescribe policy responses |
| **LLM Model** | **Gemini 2.5 Flash** — used only for natural language interpretation of forecast parameters and explanation generation; actual forecasting is model-based (Prophet/LSTM) |
| **Why This Model** | LLM is used minimally — primarily for parameter extraction and result narration. Heavy lifting done by dedicated ML models |
| **Performance Budget** | **≤8000ms** for pre-computed forecasts (cache hit), **≤30000ms** for ad-hoc forecasts (model inference) |

**Input Schema:**
```
{
  "task": "string — forecasting question",
  "target": {
    "metric": "enum — case_count|arrest_rate|crime_rate|clearance_rate",
    "crime_heads": ["string — from CrimeHead table, or 'all'"],
    "geography": {
      "level": "enum — state|district|unit",
      "ids": ["string"]
    }
  },
  "time_horizon": {
    "forecast_periods": "int — number of periods to forecast",
    "period_type": "enum — day|week|month|quarter",
    "history_start": "Optional[ISO8601] — how far back to use for training"
  },
  "include_components": "boolean — trend, seasonality, holiday effects"
}
```

**Output Schema:**
```
{
  "forecast": {
    "time_series": [
      {
        "period": "ISO8601",
        "predicted_value": "float",
        "lower_bound": "float — 95% CI lower",
        "upper_bound": "float — 95% CI upper",
        "trend_component": "float",
        "seasonal_component": "float"
      }
    ],
    "model_used": "string — Prophet|NeuralProphet|LSTM",
    "training_data_range": {"from": "ISO8601", "to": "ISO8601"},
    "metrics": {
      "mape": "float — Mean Absolute Percentage Error",
      "rmse": "float",
      "mae": "float"
    }
  },
  "narrative": "string — LLM-generated explanation of forecast trends",
  "anomalies_in_history": ["string — detected anomalies in training data"],
  "confidence": "float 0-1"
}
```

**Tools Available:**
| Tool | Purpose |
|---|---|
| `load_time_series` | Fetches historical crime data aggregated by time period from Data Store / Databricks |
| `run_prophet` | Executes Prophet model with specified parameters |
| `run_neuralprophet` | Executes NeuralProphet model for complex patterns |
| `run_lstm_forecast` | Runs pre-trained LSTM model for specified crime type/geography |
| `get_cached_forecast` | Retrieves pre-computed forecast from Catalyst Cache |
| `detect_changepoints` | Identifies structural breaks in time series |

**Prompt Engineering Strategy:**
- **Parameter extraction**: Few-shot examples mapping natural language to forecast parameters ("How will theft cases trend in Bengaluru next quarter" → crime_head="Theft", district="Bengaluru Urban", periods=3, period_type="month")
- **Narrative generation**: After forecast computation, a second LLM call generates human-readable interpretation with context

**Error Handling:**
| Error Type | Response |
|---|---|
| Insufficient historical data (<24 data points) | Return warning, use simpler model (linear trend) |
| Model training divergence | Fall back to Prophet (most robust) |
| Cache miss + model timeout | Return last cached forecast with staleness warning |
| Invalid geography/crime head | Suggest closest valid values using fuzzy match |

**Fallback Behavior:** If all ML models fail, return historical average + standard deviation as a naive baseline forecast with explicit caveat.

---

### Agent 7: Risk Assessment Agent

| Attribute | Specification |
|---|---|
| **Purpose** | Computes multi-dimensional risk scores for geographic areas, individuals (accused/suspects), and crime types. Combines statistical models with rule-based scoring |
| **Responsibility Boundary** | Produces risk scores with explanations. Scores are ADVISORY — never used as sole basis for law enforcement action. Human-in-the-loop required for scores above threshold |
| **LLM Model** | **Gemini 2.5 Pro** — risk narrative generation requires nuanced reasoning about multiple risk factors and their interactions |
| **Why This Model** | Risk explanations must be legally defensible and clearly articulate the factors contributing to each score. Pro's reasoning capability is essential |
| **Performance Budget** | **≤5000ms** for individual risk scoring, **≤15000ms** for area-wide risk heatmaps |

**Input Schema:**
```
{
  "task": "string — risk assessment question",
  "assessment_type": "enum — individual|area|crime_type|investigation",
  "target": {
    "individual_id": "Optional[string] — Accused ROWID",
    "area": "Optional[{district_id, unit_id, lat, lng, radius_km}]",
    "crime_head_id": "Optional[string]",
    "case_id": "Optional[string]"
  },
  "factors_to_include": ["enum — recidivism|severity|network|temporal|
                          geographic|demographic|modus_operandi"],
  "output_type": "enum — score|heatmap|ranking|comparative"
}
```

**Output Schema:**
```
{
  "risk_assessment": {
    "overall_score": "float 0-100",
    "risk_level": "enum — LOW|MEDIUM|HIGH|CRITICAL",
    "factor_scores": {
      "recidivism_risk": {"score": "float", "weight": "float", "evidence": "string"},
      "severity_risk": {"score": "float", "weight": "float", "evidence": "string"},
      "network_risk": {"score": "float", "weight": "float", "evidence": "string"},
      "temporal_risk": {"score": "float", "weight": "float", "evidence": "string"},
      "geographic_risk": {"score": "float", "weight": "float", "evidence": "string"}
    },
    "contributing_factors": [
      {"factor": "string", "impact": "enum — positive|negative",
       "description": "string", "data_source": "string"}
    ],
    "requires_human_review": "boolean — true if score > 75 or CRITICAL",
    "comparable_cases": ["string — similar past cases for context"]
  },
  "narrative": "string — detailed explanation suitable for an investigation report",
  "recommendations": ["string — suggested actions based on risk level"],
  "confidence": "float 0-1",
  "bias_check": {
    "protected_attributes_used": "boolean",
    "fairness_score": "float 0-1",
    "warnings": ["string"]
  }
}
```

**Tools Available:**
| Tool | Purpose |
|---|---|
| `compute_recidivism_score` | ML model predicting repeat offender probability based on Accused history |
| `compute_area_risk` | Spatial risk model using crime density, socio-economic factors |
| `get_criminal_history` | Retrieves complete history from CaseMaster → Accused → ArrestSurrender |
| `get_network_risk` | Queries Neo4j for network centrality and gang affiliations |
| `compute_severity_score` | Calculates case severity from GravityOffence + ActSection weights |
| `bias_audit` | Runs fairness checks against protected demographic attributes |

**Prompt Engineering Strategy:**
- **Chain-of-Thought with explicit factor analysis**: Model must enumerate each factor, cite the data source, compute sub-score, and justify weight before producing overall score
- **Counterfactual reasoning**: Prompt includes instruction to consider "What would the score be if protected attributes were changed?" as a bias check
- **Legal language templates**: Risk narratives use pre-approved legal language templates to ensure courtroom acceptability
- **Calibration**: System prompt includes calibration data showing historical accuracy of risk scores at each level

**Error Handling:**
| Error Type | Response |
|---|---|
| Missing criminal history data | Score based on available factors; flag incomplete assessment |
| Network data unavailable (Neo4j down) | Compute score without network factor; reduce confidence |
| Bias check fails | Withhold score; return error requiring manual assessment |
| Score exceeds critical threshold | Automatically trigger human-in-the-loop gate |

**Fallback Behavior:** If ML models are unavailable, fall back to rule-based scoring using configurable weight tables maintained by domain experts (SP/DGP office).

---

### Agent 8: Anomaly Detection Agent

| Attribute | Specification |
|---|---|
| **Purpose** | Identifies statistically significant deviations in crime patterns — sudden spikes, unusual geographic clustering, abnormal modus operandi patterns, time-series anomalies |
| **Responsibility Boundary** | Detects and reports anomalies with statistical evidence. Does NOT attribute cause or intent |
| **LLM Model** | **Gemini 2.5 Flash** — anomaly narration is straightforward; statistical detection is model-based |
| **Why This Model** | LLM is used only for natural language explanation of detected anomalies. Heavy lifting done by statistical/ML models |
| **Performance Budget** | **≤5000ms** for real-time anomaly check, **≤60000ms** for full dataset scan (async) |

**Input Schema:**
```
{
  "task": "string — anomaly detection question",
  "detection_type": "enum — temporal|spatial|behavioral|network|composite",
  "scope": {
    "geography": {"level": "string", "ids": ["string"]},
    "crime_heads": ["string"],
    "time_range": {"from": "ISO8601", "to": "ISO8601"},
    "baseline_period": "Optional[{from, to}] — comparison baseline"
  },
  "sensitivity": "enum — low|medium|high — controls false positive rate",
  "context": "string — additional context from Planner"
}
```

**Output Schema:**
```
{
  "anomalies": [
    {
      "anomaly_id": "string",
      "type": "enum — spike|drop|cluster|pattern_break|new_pattern",
      "severity": "enum — INFO|WARNING|ALERT|CRITICAL",
      "description": "string — human-readable description",
      "statistical_evidence": {
        "method": "string — e.g., IsolationForest, Z-score, DBSCAN",
        "score": "float",
        "threshold": "float",
        "p_value": "Optional[float]",
        "baseline_value": "float",
        "observed_value": "float",
        "deviation_percentage": "float"
      },
      "affected_area": {"district": "string", "unit": "string", "coordinates": {}},
      "affected_crime_types": ["string"],
      "time_detected": "ISO8601",
      "related_cases": ["string — FIR numbers contributing to anomaly"]
    }
  ],
  "summary_narrative": "string — LLM-generated summary of all anomalies",
  "false_positive_estimate": "float 0-1"
}
```

**Tools Available:**
| Tool | Purpose |
|---|---|
| `isolation_forest_detect` | Runs Isolation Forest on specified feature matrix |
| `zscore_detect` | Simple Z-score based anomaly detection on time series |
| `dbscan_spatial` | DBSCAN clustering for spatial anomaly detection |
| `seasonal_decompose` | STL decomposition to separate trend/seasonality/residual |
| `compare_periods` | Statistical comparison of two time periods (t-test, Mann-Whitney) |
| `get_crime_timeseries` | Fetches crime count time series from Databricks Lakehouse |

**Prompt Engineering Strategy:**
- **Structured explanation**: LLM generates narrative following template: What anomaly → Where → When → How severe → Statistical evidence → Possible implications
- **Few-shot with real Karnataka crime data patterns**: Historical anomaly examples with ground truth outcomes

**Error Handling:**
| Error Type | Response |
|---|---|
| Insufficient data for statistical significance | Return with LOW confidence and explicit warning |
| Model timeout | Use simpler Z-score method as fallback |
| Too many anomalies detected (>50) | Apply severity filter, return only WARNING+ |
| All nulls in time series | Skip and report data quality issue |

**Fallback Behavior:** If ML-based detection fails, use simple moving average + 2σ threshold as a baseline anomaly detector.

---

### Agent 9: Geospatial Agent

| Attribute | Specification |
|---|---|
| **Purpose** | Performs spatial analysis — hotspot identification, spatial clustering, proximity analysis, route analysis, jurisdictional queries using PostGIS + GPS coordinates from CaseMaster |
| **Responsibility Boundary** | Spatial computation and map data generation. Visualization rendering is handled by frontend (Leaflet.js / Mapbox GL) |
| **LLM Model** | **Gemini 2.5 Flash** — spatial query construction is template-based; doesn't require deep reasoning |
| **Why This Model** | PostGIS SQL generation follows well-defined patterns. Flash's speed keeps map interactions snappy |
| **Performance Budget** | **≤3000ms** for point queries, **≤8000ms** for area-wide heatmap computation |

**Input Schema:**
```
{
  "task": "string — geospatial analysis question",
  "analysis_type": "enum — hotspot|cluster|proximity|density|route|
                    jurisdictional|heatmap|isochrone",
  "geography": {
    "center": {"lat": "float", "lng": "float"},
    "radius_km": "float",
    "bounding_box": {"ne": {}, "sw": {}},
    "polygon_wkt": "Optional[string] — custom area in WKT format",
    "unit_ids": ["string — police station jurisdictions"]
  },
  "crime_filters": {
    "crime_heads": ["string"],
    "date_range": {"from": "ISO8601", "to": "ISO8601"},
    "severity": ["enum — Heinous|Non-Heinous"]
  },
  "parameters": {
    "grid_size_m": "int — grid cell size for heatmaps (default 500)",
    "bandwidth_km": "float — KDE bandwidth (default 1.0)",
    "min_cluster_size": "int — minimum points for DBSCAN (default 5)",
    "time_of_day_filter": "Optional[{start_hour, end_hour}]"
  }
}
```

**Output Schema:**
```
{
  "spatial_results": {
    "type": "enum — point_collection|heatmap|clusters|isochrone|route",
    "geojson": "GeoJSON FeatureCollection — for map rendering",
    "statistics": {
      "total_points": "int",
      "cluster_count": "int",
      "hotspot_count": "int",
      "spatial_autocorrelation": "float — Moran's I",
      "nearest_neighbor_index": "float"
    },
    "hotspots": [
      {
        "center": {"lat": "float", "lng": "float"},
        "radius_m": "float",
        "case_count": "int",
        "dominant_crime_type": "string",
        "z_score": "float — Getis-Ord Gi*",
        "p_value": "float",
        "trend": "enum — increasing|stable|decreasing"
      }
    ]
  },
  "map_config": {
    "center": {"lat": "float", "lng": "float"},
    "zoom": "int",
    "layers": [{"type": "string", "data_key": "string", "style": {}}]
  },
  "narrative": "string — spatial analysis summary"
}
```

**Tools Available:**
| Tool | Purpose |
|---|---|
| `postgis_query` | Executes PostGIS spatial SQL (ST_Contains, ST_Distance, ST_Cluster, etc.) |
| `compute_kde_heatmap` | Kernel Density Estimation for crime density heatmaps |
| `getis_ord_hotspot` | Getis-Ord Gi* statistic for statistically significant hotspots |
| `dbscan_cluster` | DBSCAN spatial clustering with haversine distance |
| `compute_isochrone` | Drive-time/walk-time isochrone from a point |
| `jurisdictional_lookup` | Maps GPS coordinates to Unit (police station) jurisdiction |
| `geocode_address` | Converts address text to GPS coordinates |

**Prompt Engineering Strategy:**
- **PostGIS template library**: 25 PostGIS query templates for common spatial operations
- **Coordinate system awareness**: System prompt specifies SRID 4326 (WGS84) for all Karnataka GPS data
- **Karnataka geography context**: Pre-loaded bounding boxes for all 31 districts, major city boundaries

**Error Handling:**
| Error Type | Response |
|---|---|
| Invalid coordinates (outside Karnataka) | Return error with valid coordinate range |
| PostGIS timeout | Reduce area, simplify geometry, retry |
| Zero crimes in area/period | Expand radius or date range, return with suggestion |
| Grid too fine (>1M cells) | Auto-coarsen grid, warn user |

**Fallback Behavior:** If PostGIS is unavailable, perform basic proximity calculations using Haversine formula in Catalyst Functions — no advanced spatial stats but functional point queries.

---

### Agent 10: Report Generation Agent

| Attribute | Specification |
|---|---|
| **Purpose** | Synthesizes outputs from all other agents into coherent, structured intelligence reports suitable for law enforcement officers, prosecutors, and command briefings |
| **Responsibility Boundary** | Narrative synthesis only. Does not generate new analysis — consumes and formats existing agent outputs |
| **LLM Model** | **Gemini 2.5 Pro** — report quality requires excellent writing, logical structure, and the ability to synthesize diverse data types |
| **Why This Model** | Reports are the primary interface between AI and officers. Quality directly impacts trust and adoption. Pro's superior language generation produces more professional, legally appropriate reports |
| **Performance Budget** | **≤5000ms** for standard reports, **≤10000ms** for comprehensive investigation summaries |

**Input Schema:**
```
{
  "report_type": "enum — briefing|investigation_summary|trend_analysis|
                  risk_report|network_analysis|daily_digest|custom",
  "agent_results": {
    "sql_results": "AgentResult from SQL Agent",
    "graph_results": "AgentResult from Graph Agent",
    "search_results": "AgentResult from Search Agent",
    "forecast_results": "AgentResult from Forecast Agent",
    "risk_results": "AgentResult from Risk Agent",
    "anomaly_results": "AgentResult from Anomaly Agent",
    "geospatial_results": "AgentResult from Geospatial Agent"
  },
  "audience": "enum — officer|inspector|sp|dgp|court|public",
  "format": "enum — narrative|structured|tabular|executive_summary",
  "language": "enum — english|kannada|hindi",
  "max_length_words": "int — default 2000",
  "include_visualizations": "boolean",
  "include_citations": "boolean — cite specific FIR numbers, data sources"
}
```

**Output Schema:**
```
{
  "report": {
    "title": "string",
    "executive_summary": "string — 3-5 sentence overview",
    "sections": [
      {
        "heading": "string",
        "content": "string — markdown formatted",
        "data_tables": [{"headers": [], "rows": []}],
        "visualizations": [{"type": "string", "config": {}}],
        "citations": [{"source": "string", "reference": "string"}]
      }
    ],
    "key_findings": ["string — bulleted key takeaways"],
    "recommendations": ["string — actionable next steps"],
    "appendix": [{"title": "string", "content": "string"}]
  },
  "metadata": {
    "generated_at": "ISO8601",
    "data_freshness": "ISO8601 — oldest data point used",
    "confidence_overall": "float 0-1",
    "agent_contributions": {"agent_name": "percentage of report sourced"}
  }
}
```

**Tools Available:**
| Tool | Purpose |
|---|---|
| `render_chart` | Generates chart configurations for Recharts/D3.js |
| `render_map` | Generates Leaflet.js map configuration from GeoJSON |
| `format_table` | Formats AG Grid configuration from tabular data |
| `translate_text` | Translates report to Kannada/Hindi using Google Translate API |
| `generate_pdf` | Renders report as PDF using server-side Puppeteer |
| `apply_template` | Applies Karnataka Police report template (header, logos, classification) |

**Prompt Engineering Strategy:**
- **Audience-aware writing**: Different system prompts per audience level — officer-level uses operational language; DGP-level uses strategic/executive language; court-level uses legal terminology
- **Structure templates**: Each report type has a mandatory section structure that the LLM must follow
- **Citation enforcement**: Prompt requires every factual claim to cite a specific data source (FIR number, table, agent)
- **Tone calibration**: Professional, objective, evidence-based — no sensationalism, no speculation beyond stated confidence levels

**Error Handling:**
| Error Type | Response |
|---|---|
| Missing agent results | Generate report with available data; list missing sections |
| LLM output exceeds length limit | Summarize + offer full report via async generation |
| Translation API failure | Return English report with note that translation is pending |
| Contradictory agent results | Flag contradiction explicitly in report with both perspectives |

**Fallback Behavior:** If LLM is unavailable, use template-based report generation — fill pre-defined templates with tabular data and bullet points (no narrative, but functional).

---

### Agent 11: Verification Agent

| Attribute | Specification |
|---|---|
| **Purpose** | Cross-validates outputs from other agents against ground truth data. Checks numerical accuracy, logical consistency, and source fidelity. Acts as the system's fact-checker |
| **Responsibility Boundary** | Verification and validation only. Does not modify other agents' outputs — flags issues for the Reflection Agent to decide on |
| **LLM Model** | **Gemini 2.5 Pro** — verification requires careful reasoning about logical consistency and numerical accuracy |
| **Why This Model** | Verification errors can lead to wrongful actions. Pro's reasoning capability is essential for catching subtle inconsistencies |
| **Performance Budget** | **≤3000ms** — runs in parallel with report generation when possible |

**Input Schema:**
```
{
  "results_to_verify": [
    {
      "agent": "string",
      "claim": "string — specific factual claim to verify",
      "supporting_data": "any — data backing the claim",
      "data_source": "string — where the data came from"
    }
  ],
  "verification_depth": "enum — quick|standard|thorough",
  "critical_claims": ["string — claims that must be verified even in quick mode"]
}
```

**Output Schema:**
```
{
  "verification_results": [
    {
      "claim": "string",
      "status": "enum — VERIFIED|UNVERIFIED|CONTRADICTED|INSUFFICIENT_DATA",
      "confidence": "float 0-1",
      "evidence": "string — supporting or contradicting evidence",
      "cross_reference": "string — source used for verification",
      "discrepancy": "Optional[string] — nature of discrepancy if found"
    }
  ],
  "overall_reliability": "float 0-1",
  "critical_issues": ["string — must-fix issues before releasing report"],
  "recommendations": ["string — suggestions for improving accuracy"]
}
```

**Tools Available:**
| Tool | Purpose |
|---|---|
| `execute_verification_query` | Runs independent query against Data Store to cross-check claimed numbers |
| `check_logical_consistency` | Rule-based checks (e.g., arrest date can't precede FIR date) |
| `check_geographic_validity` | Validates that GPS coordinates fall within claimed district boundaries |
| `check_temporal_consistency` | Validates date/time logic across related events |
| `cross_reference_count` | Independently counts records matching specified criteria |

**Prompt Engineering Strategy:**
- **Adversarial stance**: System prompt instructs LLM to actively try to find inconsistencies — "assume claims are wrong until proven right"
- **Numerical precision**: Explicit instructions to verify exact numbers, percentages, and counts against source queries
- **Logical rules**: Pre-defined invariants that must hold (e.g., accused count in report ≤ accused count in CaseMaster for same case set)

**Error Handling:**
| Error Type | Response |
|---|---|
| Verification query times out | Mark claim as UNVERIFIED (not VERIFIED) |
| Source data inconsistent | Flag as data quality issue (separate from agent error) |
| Too many claims to verify in budget | Prioritize critical claims; verify others asynchronously |

**Fallback Behavior:** If verification fails, mark all claims as UNVERIFIED and add a prominent disclaimer to the report.

---

### Agent 12: Reflection / Critic Agent

| Attribute | Specification |
|---|---|
| **Purpose** | Meta-cognitive agent that evaluates the quality of the overall investigation pipeline output — assesses reasoning quality, identifies gaps in analysis, evaluates whether the original question was fully answered, and decides if another iteration is needed |
| **Responsibility Boundary** | Quality evaluation and iteration decisions. Can trigger re-routing through the Supervisor for additional analysis |
| **LLM Model** | **Gemini 2.5 Pro** — meta-reasoning about reasoning quality requires the most capable model |
| **Why This Model** | This is the most intellectually demanding agent task — reasoning about reasoning. Pro's advanced capabilities are non-negotiable here |
| **Performance Budget** | **≤2000ms** — should not significantly extend overall pipeline latency |

**Input Schema:**
```
{
  "original_query": "string",
  "plan": "InvestigationPlan from Planner",
  "agent_results": "Dict[str, AgentResult]",
  "verification_results": "VerificationResult",
  "iteration_count": "int — current loop number",
  "max_iterations": "int — default 3"
}
```

**Output Schema:**
```
{
  "evaluation": {
    "query_coverage": "float 0-1 — how well was the original question answered",
    "reasoning_quality": "float 0-1",
    "evidence_quality": "float 0-1",
    "gaps": [
      {
        "gap_type": "enum — missing_data|incomplete_analysis|
                     unverified_claim|logical_inconsistency|
                     missing_perspective|temporal_gap",
        "description": "string",
        "severity": "enum — minor|moderate|critical",
        "suggested_resolution": "string — what additional analysis would help"
      }
    ],
    "contradictions": [{"claim_1": "string", "claim_2": "string", "resolution_needed": "string"}]
  },
  "decision": {
    "action": "enum — APPROVE|ITERATE|ESCALATE_TO_HUMAN",
    "reason": "string",
    "iteration_plan": "Optional — modified plan for next iteration if ITERATE",
    "escalation_reason": "Optional — why human review is needed"
  }
}
```

**Tools Available:**
| Tool | Purpose |
|---|---|
| `compare_plan_to_results` | Checks which planned steps produced results vs. failed |
| `check_query_coverage` | NLI model checking if results entail an answer to the original query |
| `get_iteration_history` | Retrieves results from prior iterations for progress assessment |

**Prompt Engineering Strategy:**
- **Socratic questioning**: System prompt contains a checklist of questions the critic must answer: "Were all sub-questions addressed?", "Is every number verified?", "Are there alternative explanations not considered?", "Would an experienced SP find this analysis sufficient?"
- **Quality rubric**: Explicit scoring rubric with criteria and point values for each quality dimension
- **Conservative iteration**: Prompt biases toward APPROVE (not ITERATE) to prevent infinite loops — iteration only if critical gaps exist

**Error Handling:**
| Error Type | Response |
|---|---|
| Max iterations reached | Force APPROVE with quality warnings |
| LLM timeout | Default to APPROVE (fail-open for usability) |
| Contradictory evaluation | ESCALATE_TO_HUMAN |

**Fallback Behavior:** If the Reflection Agent fails, the pipeline proceeds to Report Generation with a quality disclaimer. The system never blocks on reflection failure.

---

### Agent 13: Memory Agent

| Attribute | Specification |
|---|---|
| **Purpose** | Manages three tiers of memory — short-term (current conversation), medium-term (investigation-scoped), and long-term (officer learning/preferences). Stores and retrieves context for multi-turn investigations |
| **Responsibility Boundary** | Memory CRUD operations only. Does not interpret or analyze stored memories |
| **LLM Model** | **Gemini 2.5 Flash** — memory operations are straightforward retrieval and summarization tasks |
| **Why This Model** | Memory operations prioritize speed over reasoning depth. Flash's low latency keeps context loading fast |
| **Performance Budget** | **≤500ms** for context loading, **≤1000ms** for memory persistence |

**Input Schema:**
```
{
  "operation": "enum — load|store|search|summarize|prune",
  "memory_tier": "enum — short_term|investigation|long_term",
  "context": {
    "session_id": "string",
    "investigation_id": "Optional[string]",
    "officer_id": "string"
  },
  "store_data": "Optional — data to store",
  "search_query": "Optional[string] — semantic search across memories",
  "max_results": "int — default 10"
}
```

**Output Schema:**
```
{
  "memories": [
    {
      "memory_id": "string",
      "tier": "string",
      "content": "string",
      "timestamp": "ISO8601",
      "relevance_score": "float 0-1",
      "source_investigation": "Optional[string]",
      "summary": "string"
    }
  ],
  "context_summary": "string — synthesized summary of relevant context",
  "pruned_count": "int — memories pruned in this operation"
}
```

**Tools Available:**
| Tool | Purpose |
|---|---|
| `catalyst_cache_get/set` | Short-term memory in Catalyst Cache (TTL: session duration) |
| `pinecone_memory_search` | Semantic search across investigation memories via Pinecone |
| `datastore_memory_crud` | CRUD on investigation-scoped memory in Catalyst Data Store |
| `summarize_conversation` | LLM-based conversation summarization for compression |
| `prune_stale_memories` | Removes memories older than retention policy |

**Prompt Engineering Strategy:**
- **Summarization**: Progressive summarization — as conversation grows, older turns are summarized to fit context window
- **Relevance scoring**: When loading memories, LLM scores relevance to current query

**Error Handling:**
| Error Type | Response |
|---|---|
| Cache miss | Gracefully proceed without context (new conversation) |
| Pinecone unavailable | Fall back to keyword search on Data Store |
| Memory storage fails | Log error, continue pipeline (memory loss is non-fatal) |

**Fallback Behavior:** If Memory Agent fails entirely, the system operates in stateless mode — each query treated independently without conversation context.

---

### Agent 14: Recommendation Agent

| Attribute | Specification |
|---|---|
| **Purpose** | Generates actionable recommendations — next investigative steps, resource allocation suggestions, patrol deployment advice, based on the analysis performed by other agents |
| **Responsibility Boundary** | Advisory only. All recommendations explicitly labeled as AI suggestions requiring human judgment. Never prescribes mandatory actions |
| **LLM Model** | **Gemini 2.5 Pro** — recommendations require deep domain understanding and nuanced reasoning about trade-offs |
| **Why This Model** | Bad recommendations can misdirect investigations. Pro's reasoning capability ensures higher quality, more nuanced suggestions |
| **Performance Budget** | **≤3000ms** |

**Input Schema:**
```
{
  "analysis_context": {
    "agent_results": "Dict[str, AgentResult]",
    "risk_scores": "Optional[RiskAssessment]",
    "anomalies": "Optional[AnomalyResult]",
    "forecast": "Optional[ForecastResult]"
  },
  "recommendation_type": "enum — investigative_steps|resource_allocation|
                          patrol_deployment|prevention_strategy|
                          interagency_coordination",
  "constraints": {
    "available_personnel": "Optional[int]",
    "available_vehicles": "Optional[int]",
    "budget_constraints": "Optional[string]",
    "time_horizon": "string"
  },
  "officer_preferences": "Optional — from long-term Memory Agent"
}
```

**Output Schema:**
```
{
  "recommendations": [
    {
      "priority": "int — 1 (highest) to N",
      "action": "string — specific recommended action",
      "rationale": "string — why this is recommended",
      "expected_impact": "string — what this action is expected to achieve",
      "resource_requirement": "string — personnel, time, budget needed",
      "risk_if_not_taken": "string — consequence of inaction",
      "confidence": "float 0-1",
      "data_basis": ["string — which agent results support this"]
    }
  ],
  "resource_allocation_plan": "Optional — structured deployment plan",
  "disclaimer": "string — standard advisory disclaimer"
}
```

**Tools Available:**
| Tool | Purpose |
|---|---|
| `get_unit_resources` | Retrieves current personnel/vehicle availability from Unit table |
| `get_historical_effectiveness` | Past recommendation outcomes for similar situations |
| `compute_optimal_patrol` | Optimization algorithm for patrol route allocation |
| `get_similar_case_resolutions` | How similar past cases were resolved |

**Prompt Engineering Strategy:**
- **Evidence-based recommendations**: Every recommendation must cite specific data from agent results
- **Prioritized output**: Force ranked output with explicit priority justification
- **Constraint awareness**: System prompt includes Karnataka Police operational constraints (shift patterns, jurisdictional rules, legal procedural requirements)
- **Outcome-oriented**: Recommendations framed around expected outcomes, not just actions

**Error Handling & Fallback:** If recommendation generation fails, return a generic "continue standard investigation protocol" with pointers to the analysis results for manual interpretation.

---

### Agent 15: Explainability Agent

| Attribute | Specification |
|---|---|
| **Purpose** | Makes AI decisions interpretable and transparent for police officers. Translates complex model outputs (risk scores, forecasts, anomaly detections) into plain-language explanations with visual aids |
| **Responsibility Boundary** | Explanation generation only. Does not modify or override other agents' conclusions |
| **LLM Model** | **Gemini 2.5 Pro** — explanation quality directly impacts officer trust. Requires excellent communication skills and ability to simplify complex concepts |
| **Why This Model** | Officers with varying technical backgrounds must understand AI outputs. Pro produces clearer, more accessible explanations |
| **Performance Budget** | **≤2000ms** |

**Input Schema:**
```
{
  "item_to_explain": {
    "type": "enum — risk_score|forecast|anomaly|recommendation|
             network_analysis|cluster|similarity_match",
    "result": "AgentResult — the output to explain",
    "model_metadata": "Optional — model type, features used, weights"
  },
  "audience": "enum — constable|inspector|sp|dgp|court",
  "explanation_depth": "enum — brief|standard|detailed",
  "include_counterfactuals": "boolean — 'what if X were different?'",
  "include_visual_aids": "boolean — generate explanation diagrams"
}
```

**Output Schema:**
```
{
  "explanation": {
    "plain_language": "string — simple explanation suitable for audience",
    "key_factors": [
      {
        "factor": "string",
        "contribution": "string — how it influenced the result",
        "direction": "enum — positive|negative|neutral",
        "importance_rank": "int"
      }
    ],
    "counterfactuals": [
      {
        "scenario": "string — 'If X were different...'",
        "predicted_outcome": "string — how the result would change"
      }
    ],
    "limitations": ["string — what the model cannot account for"],
    "confidence_explanation": "string — what the confidence score means in practice",
    "visual_aids": [
      {
        "type": "enum — feature_importance_bar|decision_tree_diagram|
                 shap_waterfall|comparison_table",
        "config": "chart configuration JSON"
      }
    ]
  }
}
```

**Tools Available:**
| Tool | Purpose |
|---|---|
| `compute_shap_values` | SHAP feature importance for ML model explanations |
| `generate_counterfactual` | DiCE counterfactual explanations |
| `simplify_text` | Adjusts language complexity for audience level |
| `render_explanation_chart` | Generates visual explanation charts |

**Prompt Engineering Strategy:**
- **Audience calibration**: Constable-level explanations use analogies and simple language; SP/DGP-level include statistical details; court-level includes methodology and limitations
- **Jargon translation**: System prompt includes a glossary mapping ML terms to police-friendly language
- **Mandatory limitations disclosure**: Every explanation must include what the AI cannot account for

**Error Handling & Fallback:** If explainability fails, return the raw model output with a note "Detailed explanation is currently unavailable. Please consult the AI helpdesk for interpretation."

---

## 11.4 Tool Registry

### Complete Tool Registry Table

| Tool ID | Tool Name | Owner Agent(s) | API/Service | Auth Method | Rate Limit | Timeout | Idempotent |
|---|---|---|---|---|---|---|---|
| T001 | `execute_zcql` | SQL Agent | Catalyst Data Store | Catalyst Auth | 100 req/s | 1500ms | Yes |
| T002 | `get_table_schema` | SQL, Planner | Catalyst Data Store | Catalyst Auth | 50 req/s | 500ms | Yes |
| T003 | `get_sample_data` | SQL Agent | Catalyst Data Store | Catalyst Auth | 20 req/s | 500ms | Yes |
| T004 | `validate_query` | SQL Agent | Catalyst Data Store | Catalyst Auth | 200 req/s | 200ms | Yes |
| T005 | `execute_cypher` | Graph Agent | Neo4j Aura | Neo4j Auth (Bolt) | 50 req/s | 3500ms | Yes |
| T006 | `run_gds_algorithm` | Graph Agent | Neo4j GDS | Neo4j Auth | 10 req/s | 10000ms | Yes |
| T007 | `resolve_entity` | Graph Agent | Neo4j Aura | Neo4j Auth | 100 req/s | 500ms | Yes |
| T008 | `export_subgraph` | Graph Agent | Neo4j Aura | Neo4j Auth | 20 req/s | 2000ms | Yes |
| T009 | `elasticsearch_search` | Search Agent | Elastic Cloud | API Key | 200 req/s | 800ms | Yes |
| T010 | `pinecone_query` | Search Agent | Pinecone | API Key | 100 req/s | 500ms | Yes |
| T011 | `embed_text` | Search, Memory | Vertex AI | Service Account | 300 req/s | 300ms | Yes |
| T012 | `rerank_results` | Search Agent | Cohere API | API Key | 50 req/s | 400ms | Yes |
| T013 | `run_prophet` | Forecast Agent | Vertex AI (custom) | Service Account | 20 req/s | 5000ms | Yes |
| T014 | `run_neuralprophet` | Forecast Agent | Vertex AI (custom) | Service Account | 10 req/s | 8000ms | Yes |
| T015 | `run_lstm_forecast` | Forecast Agent | Vertex AI (custom) | Service Account | 10 req/s | 10000ms | Yes |
| T016 | `compute_recidivism_score` | Risk Agent | Vertex AI (custom) | Service Account | 50 req/s | 1000ms | Yes |
| T017 | `compute_area_risk` | Risk Agent | Vertex AI (custom) | Service Account | 20 req/s | 2000ms | Yes |
| T018 | `isolation_forest_detect` | Anomaly Agent | Vertex AI (custom) | Service Account | 20 req/s | 3000ms | Yes |
| T019 | `dbscan_spatial` | Anomaly, Geospatial | Vertex AI (custom) | Service Account | 20 req/s | 2000ms | Yes |
| T020 | `postgis_query` | Geospatial Agent | PostGIS (AWS RDS) | IAM Auth | 100 req/s | 3000ms | Yes |
| T021 | `compute_kde_heatmap` | Geospatial Agent | Catalyst Functions | Catalyst Auth | 10 req/s | 5000ms | Yes |
| T022 | `getis_ord_hotspot` | Geospatial Agent | Catalyst Functions | Catalyst Auth | 10 req/s | 5000ms | Yes |
| T023 | `geocode_address` | Geospatial Agent | Google Maps API | API Key | 50 req/s | 500ms | Yes |
| T024 | `render_chart` | Report Agent | Catalyst Functions | Catalyst Auth | 50 req/s | 1000ms | Yes |
| T025 | `translate_text` | Report Agent | Google Translate API | API Key | 100 req/s | 1000ms | Yes |
| T026 | `generate_pdf` | Report Agent | Catalyst Functions (Puppeteer) | Catalyst Auth | 10 req/s | 5000ms | No |
| T027 | `compute_shap_values` | Explainability | Vertex AI (custom) | Service Account | 20 req/s | 2000ms | Yes |
| T028 | `classify_query` | Supervisor | Catalyst Functions | Catalyst Auth | 500 req/s | 200ms | Yes |
| T029 | `check_authorization` | Supervisor | Catalyst Auth + RBAC | Catalyst Auth | 1000 req/s | 100ms | Yes |
| T030 | `emit_audit_event` | All Agents | Catalyst Signals | Catalyst Auth | 1000 req/s | 100ms | No |
| T031 | `catalyst_cache_get` | Memory Agent | Catalyst Cache | Catalyst Auth | 500 req/s | 50ms | Yes |
| T032 | `catalyst_cache_set` | Memory Agent | Catalyst Cache | Catalyst Auth | 500 req/s | 50ms | No |
| T033 | `bias_audit` | Risk Agent | Catalyst Functions | Catalyst Auth | 20 req/s | 1000ms | Yes |
| T034 | `get_unit_resources` | Recommendation | Catalyst Data Store | Catalyst Auth | 50 req/s | 500ms | Yes |
| T035 | `summarize_conversation` | Memory Agent | Vertex AI (Gemini) | Service Account | 50 req/s | 1000ms | Yes |

---

## 11.5 Agent Communication & Orchestration Patterns

### Pattern 1: Direct (Simple Queries)

```
User → Supervisor → [Single Agent] → Verification → Report → User

Latency: 3-5 seconds
Use case: "How many FIRs were filed in Bengaluru last month?"
Agent path: Supervisor → SQL Agent → Verification → Report
```

### Pattern 2: Sequential (Dependent Analysis)

```
User → Supervisor → Planner → Agent A → Agent B → Agent C → Verification → Report → User

Latency: 8-15 seconds
Use case: "Find accused X's criminal history and assess their risk level"
Agent path: Supervisor → Planner → SQL Agent → Graph Agent → Risk Agent
            → Verification → Report
Dependencies: Graph Agent needs SQL results; Risk Agent needs both
```

### Pattern 3: Parallel (Independent Data Gathering)

```
User → Supervisor → Planner → [Agent A ║ Agent B ║ Agent C] → Merge
       → Verification → Report → User

Latency: 5-8 seconds (bounded by slowest parallel agent)
Use case: "Give me a complete overview of crime in Mysuru district"
Agent path: Supervisor → Planner → [SQL ║ Search ║ Geospatial] → Merge
            → Verification → Report
All three agents work independently on different aspects
```

### Pattern 4: Hybrid (Complex Investigation)

```
User → Supervisor → Planner →
  Phase 1 (parallel): [SQL ║ Search ║ Graph]
  Phase 2 (sequential, depends on Phase 1): [Forecast → Risk → Anomaly]
  Phase 3 (parallel): [Geospatial ║ Recommendation]
  → Verification → Reflection ─(iterate?)─→ Back to Phase 2
  → Explainability → Report → Memory → User

Latency: 12-25 seconds
Use case: "Analyze the emerging drug trafficking network in coastal
           Karnataka, predict expansion, and recommend intervention strategy"
```

### Agent Communication Protocol

```
┌─────────────────────────────────────────────────────────────────┐
│                    MESSAGE ENVELOPE                              │
├─────────────────────────────────────────────────────────────────┤
│ {                                                               │
│   "message_id": "uuid",                                        │
│   "from_agent": "string",                                      │
│   "to_agent": "string",                                        │
│   "message_type": "enum — request|response|error|heartbeat",   │
│   "investigation_id": "string",                                │
│   "correlation_id": "string — links request to response",      │
│   "timestamp": "ISO8601",                                      │
│   "payload": { ... agent-specific schema ... },                │
│   "metadata": {                                                 │
│     "latency_budget_remaining_ms": "int",                      │
│     "priority": "enum — low|normal|high|critical",             │
│     "retry_count": "int",                                      │
│     "trace_id": "string — Datadog trace ID"                    │
│   }                                                             │
│ }                                                               │
└─────────────────────────────────────────────────────────────────┘
```

### Concurrency Control

| Aspect | Strategy |
|---|---|
| **Max concurrent agents per query** | 5 (configurable) |
| **Max concurrent queries per officer** | 3 |
| **Max system-wide concurrent investigations** | 500 |
| **Agent instance pooling** | Each agent type has 10-50 warm instances based on demand |
| **Backpressure** | If queue depth > 100 for any agent, Supervisor delays non-critical queries |
| **Priority queuing** | CRITICAL investigations preempt normal queries |
| **Deadlock prevention** | All agents have independent timeouts; Supervisor kills stalled agents after 2× budget |

---

## 11.6 Agent Observability & Governance

### Observability Stack

| Layer | Tool | Metrics |
|---|---|---|
| **Tracing** | Datadog APM + LangSmith | End-to-end trace per investigation, per-agent spans, tool call spans |
| **Metrics** | Datadog Metrics | Agent latency P50/P95/P99, success rate, tool utilization, LLM token consumption |
| **Logging** | Datadog Logs | Full conversation state at each node, tool inputs/outputs, error details |
| **LLM Monitoring** | LangSmith | Prompt/completion pairs, token counts, cost tracking, quality scores |
| **Alerting** | Datadog Monitors | Agent failure rate > 5%, latency > 2× budget, error spike detection |

### Governance Policies

| Policy | Implementation |
|---|---|
| **Agent output audit** | Every agent output is logged to immutable audit trail (Catalyst Signals → Databricks) |
| **PII handling** | All agent inputs/outputs pass through PII detection before logging |
| **Model versioning** | Each agent records the exact LLM model version used (e.g., `gemini-2.5-pro-preview-06-05`) |
| **Prompt versioning** | System prompts stored in version-controlled registry with change tracking |
| **A/B testing** | Agent-level A/B testing framework for prompt improvements and model upgrades |
| **Kill switch** | Per-agent kill switch to disable any agent without affecting others |
| **Rate limiting** | Per-officer, per-unit, per-agent rate limits enforced by Supervisor |
| **Cost budgeting** | Per-investigation token budget with soft and hard limits |

---

# 12. Enterprise LLM Architecture

## 12.1 Model Selection Matrix

### Primary Model Roster

| Model | Provider | Context Window | Strengths | Weaknesses | Cost (per 1M tokens) | Use In Platform |
|---|---|---|---|---|---|---|
| **Gemini 2.5 Pro** | Google Vertex AI | 1M tokens | Best reasoning, long context, multimodal, excellent structured output | Higher cost, ~2-5s latency | Input: $1.25 / Output: $10.00 | Planning, SQL generation, Risk assessment, Report generation, Verification, Reflection, Recommendations, Explainability |
| **Gemini 2.5 Flash** | Google Vertex AI | 1M tokens | Very fast (~100-500ms), cost-efficient, adequate reasoning | Less nuanced reasoning than Pro | Input: $0.15 / Output: $0.60 | Supervisor routing, Search query construction, Memory operations, Anomaly narration, Geospatial query construction |
| **GPT-4o** | OpenAI | 128K tokens | Excellent code generation, strong structured output | Smaller context, US-hosted (data residency concern) | Input: $2.50 / Output: $10.00 | **Fallback only** — used when Gemini is unavailable or for second-opinion on critical risk assessments |
| **Gemini 2.5 Flash-Lite** | Google Vertex AI | 1M tokens | Ultra-fast, cheapest | Limited reasoning | Input: $0.04 / Output: $0.15 | Classification, intent detection, simple extraction tasks |
| **text-embedding-004** | Google Vertex AI | 2048 tokens | High-quality embeddings, 768 dimensions | Embedding only (no generation) | $0.00625 per 1K tokens | RAG embeddings, semantic search, memory search |

### Model Selection Decision Tree

```
                          ┌──────────────────┐
                          │   Task Arrives    │
                          └────────┬─────────┘
                                   │
                      ┌────────────▼────────────┐
                      │ Does task require deep   │
                      │ reasoning / multi-step   │
                      │ logic?                   │
                      └──┬────────────────────┬──┘
                    Yes  │                    │  No
                         │                    │
                ┌────────▼────────┐  ┌────────▼────────┐
                │ Is task latency │  │ Does task need   │
                │ critical        │  │ any generation   │
                │ (<500ms)?       │  │ at all?          │
                └──┬──────────┬───┘  └──┬──────────┬───┘
                Yes│          │No    Yes│          │No
                   │          │        │          │
                   ▼          ▼        ▼          ▼
            ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
            │ Gemini   │ │ Gemini   │ │ Gemini   │ │ text-    │
            │ 2.5      │ │ 2.5 Pro  │ │ 2.5      │ │ embedding│
            │ Flash    │ │          │ │ Flash-   │ │ -004     │
            │ (trade   │ │ (best    │ │ Lite     │ │          │
            │ accuracy │ │ accuracy)│ │ (cheapest│ │ (embed   │
            │ for      │ │          │ │ option)  │ │ only)    │
            │ speed)   │ │          │ │          │ │          │
            └──────────┘ └──────────┘ └──────────┘ └──────────┘

            If Gemini unavailable (any model):
            └──→ Fallback to GPT-4o (OpenAI)
            └──→ If both unavailable: Queue + retry with exponential backoff
```

### Model Assignment Summary by Agent

| Agent | Primary Model | Fallback Model | Justification |
|---|---|---|---|
| Supervisor | Flash | Flash-Lite → Rule-based | Speed is king for routing |
| Planner | Pro | GPT-4o | Complex decomposition needs best reasoning |
| SQL Agent | Pro | GPT-4o | SQL accuracy is critical for investigations |
| Graph Agent | Pro | GPT-4o | Cypher generation requires deep schema understanding |
| Search Agent | Flash | Flash-Lite | Simple query transformations |
| Forecast Agent | Flash | Flash-Lite | LLM used minimally (parameter extraction only) |
| Risk Agent | Pro | GPT-4o | Legal defensibility requires nuanced reasoning |
| Anomaly Agent | Flash | Flash-Lite | Statistical detection is model-based, not LLM-based |
| Geospatial Agent | Flash | Flash-Lite | PostGIS queries are template-driven |
| Report Agent | Pro | GPT-4o | Report quality is the user-facing interface |
| Verification Agent | Pro | GPT-4o | Verification errors can mislead investigations |
| Reflection Agent | Pro | GPT-4o | Meta-reasoning is the hardest LLM task |
| Memory Agent | Flash | Flash-Lite | Simple retrieval and summarization |
| Recommendation Agent | Pro | GPT-4o | Recommendations must be well-reasoned |
| Explainability Agent | Pro | GPT-4o | Explanation clarity directly impacts trust |

---

## 12.2 Prompt Engineering Patterns

### Pattern 1: Chain-of-Thought (CoT)

**Used By**: SQL Agent, Graph Agent, Risk Agent, Verification Agent  
**Purpose**: Forces step-by-step reasoning to improve accuracy on complex queries

**Template Structure:**
```
System: You are an expert SQL developer for the Karnataka Crime Intelligence
Platform. The database has the following schema: {DDL}

When generating SQL:
1. FIRST identify which tables contain the relevant data
2. THEN determine the JOIN path between tables
3. THEN apply all specified filters
4. THEN write the SQL query
5. FINALLY validate the query against the schema — check that all
   column names exist and data types are compatible

Show your reasoning at each step before writing the final query.
```

**Why**: SQL generation accuracy improves from ~72% to ~91% with CoT in internal benchmarks on Karnataka crime data queries.

### Pattern 2: Few-Shot with Domain Examples

**Used By**: All agents  
**Purpose**: Grounds the model in Karnataka Police domain-specific patterns

**Template Structure:**
```
System: [Domain context and instructions]

Example 1:
User: How many heinous crimes were reported in Bengaluru City in 2025?
Assistant: Let me break this down:
1. Tables needed: CaseMaster, GravityOffence, District, Unit
2. GravityOffence.GravityName = 'Heinous'
3. District.DistrictName = 'Bengaluru City'
4. Year filter on CaseMaster.OffenceDatetime
Query: SELECT COUNT(*) FROM CaseMaster cm
  JOIN GravityOffence go ON cm.GravityId = go.ROWID
  JOIN Unit u ON cm.UnitId = u.ROWID
  JOIN District d ON u.DistrictId = d.ROWID
  WHERE go.GravityName = 'Heinous'
  AND d.DistrictName = 'Bengaluru City'
  AND YEAR(cm.OffenceDatetime) = 2025;

[... 14 more examples covering edge cases ...]
```

**Why**: Few-shot examples reduce hallucinated column names by ~85% and improve JOIN accuracy by ~60%.

### Pattern 3: ReAct (Reasoning + Acting)

**Used By**: Graph Agent, Search Agent, Geospatial Agent  
**Purpose**: Interleaves reasoning with tool calls for iterative refinement

**Template Structure:**
```
System: You are a criminal network analyst. You have access to the
following tools: {tool_descriptions}

For each step:
Thought: [What I need to find out next]
Action: [Tool to call with parameters]
Observation: [Result from tool]
... repeat ...
Final Answer: [Synthesized answer with citations]
```

**Why**: ReAct allows the agent to adapt its strategy based on intermediate results — crucial for graph exploration where the structure of the network is unknown before querying.

### Pattern 4: Tree-of-Thought (ToT)

**Used By**: Planner Agent  
**Purpose**: Generates multiple candidate plans, evaluates each, selects the best

**Template Structure:**
```
System: Generate 3 different investigation plans for the query.
For each plan, evaluate:
- Completeness: Does it answer all aspects of the query? (0-10)
- Efficiency: Is it parallelized where possible? (0-10)
- Latency: Will it complete within the time budget? (0-10)

Select the plan with the highest total score. Justify your selection.
```

**Why**: ToT produces 25% better plans than single-pass generation, particularly for ambiguous multi-faceted queries.

### Pattern 5: Structured Output (JSON Mode)

**Used By**: All agents  
**Purpose**: Guarantees LLM output conforms to expected schema

**Implementation**: Uses Gemini's `response_mime_type: "application/json"` with `response_schema` parameter providing the exact JSON schema. Eliminates parsing errors and schema violations.

**Why**: In a law enforcement system, malformed outputs can cause downstream failures. Structured output mode provides 99.9%+ schema compliance vs. ~92% with prompt-based JSON requests.

### Pattern 6: System Prompt Layering

**Architecture:**
```
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: Global System Prompt (shared by all agents)         │
│ - Platform identity and purpose                              │
│ - Security policies (PII handling, classification)           │
│ - Output format standards                                    │
│ - Legal disclaimers                                          │
├─────────────────────────────────────────────────────────────┤
│ Layer 2: Domain Context (per agent type)                     │
│ - Schema documentation (DDL, graph schema, index mappings)   │
│ - Domain-specific terminology (IPC sections, police ranks)   │
│ - Karnataka-specific context (districts, units, geography)   │
├─────────────────────────────────────────────────────────────┤
│ Layer 3: Agent-Specific Instructions (per agent)             │
│ - Specific task instructions                                 │
│ - Tool usage guidelines                                      │
│ - Output schema definition                                   │
│ - Error handling procedures                                  │
├─────────────────────────────────────────────────────────────┤
│ Layer 4: Few-Shot Examples (per agent)                       │
│ - 10-50 labeled examples                                     │
│ - Edge cases and error examples                              │
│ - Karnataka-specific query examples                          │
├─────────────────────────────────────────────────────────────┤
│ Layer 5: Dynamic Context (per invocation)                    │
│ - Current user context (officer, unit, clearance)            │
│ - Conversation history (from Memory Agent)                   │
│ - Current investigation state                                │
│ - Retrieved memories/context                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 12.3 Guardrails Architecture

### Input Guardrails (Pre-LLM)

```
User Input → [1. Input Sanitization] → [2. PII Pre-scan] →
[3. Injection Detection] → [4. Intent Classification] →
[5. Authorization Check] → [6. Rate Limiting] → LLM Call

Each gate can REJECT the request with a specific error message.
```

| Gate | Implementation | What It Catches | Latency |
|---|---|---|---|
| **1. Input Sanitization** | Regex-based sanitization in Catalyst Functions | XSS, HTML injection, control characters, excessively long inputs (>10K chars) | <5ms |
| **2. PII Pre-scan** | Google DLP API (Vertex AI) | SSN/Aadhaar in queries (officer shouldn't paste PII into chat), credit card numbers | <50ms |
| **3. Injection Detection** | Fine-tuned classifier + regex patterns | Prompt injection attacks ("ignore previous instructions"), jailbreak attempts, system prompt extraction attempts | <100ms |
| **4. Intent Classification** | Gemini Flash-Lite classifier | Out-of-scope requests (personal questions, harmful requests, non-law-enforcement queries) | <100ms |
| **5. Authorization Check** | RBAC/ABAC engine (Catalyst Auth) | Queries exceeding officer's clearance level, cross-jurisdictional unauthorized queries | <50ms |
| **6. Rate Limiting** | Catalyst API Gateway + Redis | Abuse prevention — max 60 queries/min per officer, 500/min per unit | <10ms |

### Output Guardrails (Post-LLM)

```
LLM Output → [1. Schema Validation] → [2. PII Detection] →
[3. Bias Check] → [4. Hallucination Flag] → [5. Sensitivity Filter] →
[6. Confidence Gate] → User Response

Each gate can MODIFY the output (redaction) or REJECT (regenerate).
```

| Gate | Implementation | What It Catches | Latency |
|---|---|---|---|
| **1. Schema Validation** | JSON Schema validator | Malformed output, missing required fields, wrong types | <5ms |
| **2. PII Detection** | Google DLP API | PII leaked in responses (victim addresses, phone numbers) to unauthorized officers | <50ms |
| **3. Bias Check** | Custom classifier (Vertex AI) | Discriminatory language, unfounded correlations with protected attributes | <100ms |
| **4. Hallucination Flag** | Verification Agent + NLI model | Claims not supported by retrieved data, fabricated case numbers, invented statistics | <500ms |
| **5. Sensitivity Filter** | Rule-based + LLM classifier | Inappropriate content, speculation presented as fact, potentially prejudicial language | <100ms |
| **6. Confidence Gate** | Threshold check | Responses with confidence < 0.3 are rejected; 0.3-0.6 get disclaimers; > 0.6 pass through | <5ms |

### Injection Defense In Depth

```
Layer 1: Input pattern matching — detect known injection patterns
Layer 2: Prompt isolation — user input is always in a clearly delimited
         section of the prompt, separate from system instructions
Layer 3: Output validation — LLM output must conform to expected schema
         (structured output mode)
Layer 4: Tool sandboxing — tools execute in sandboxed environments with
         read-only access and limited permissions
Layer 5: Monitoring — anomalous tool call patterns trigger alerts
         (e.g., SQL Agent suddenly trying to write data)
```

---

## 12.4 Hallucination Prevention Framework

### Multi-Layer Hallucination Defense

```
┌──────────────────────────────────────────────────────────────┐
│                HALLUCINATION PREVENTION STACK                  │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│ Layer 1: GROUNDING (Prevention)                                │
│ ├─ All factual claims must cite a specific data source         │
│ ├─ RAG pipeline grounds responses in retrieved documents       │
│ ├─ SQL/Cypher results are passed as structured data, not text  │
│ └─ System prompt: "Never generate statistics — only report     │
│    numbers from query results"                                 │
│                                                                │
│ Layer 2: CONFIDENCE SCORING (Detection)                        │
│ ├─ LLM self-reports confidence with calibration training       │
│ ├─ Low-confidence claims flagged for verification              │
│ ├─ Confidence calibration: model's reported confidence         │
│ │   correlated with actual accuracy on held-out test set       │
│ └─ Threshold: conf < 0.5 triggers verification loop           │
│                                                                │
│ Layer 3: VERIFICATION (Correction)                             │
│ ├─ Verification Agent cross-checks factual claims              │
│ ├─ Independent queries validate claimed numbers                │
│ ├─ Logical consistency checks (dates, geography, counts)       │
│ └─ Contradictions flagged with both sources cited              │
│                                                                │
│ Layer 4: CITATION ENFORCEMENT (Traceability)                   │
│ ├─ Every factual claim must include:                           │
│ │   - Source type (SQL query, graph traversal, search result)  │
│ │   - Source reference (FIR number, table name, query)         │
│ │   - Timestamp of data retrieval                              │
│ ├─ Claims without citations are marked as "unverified"         │
│ └─ Users can click any claim to see underlying data            │
│                                                                │
│ Layer 5: HUMAN FEEDBACK LOOP (Improvement)                     │
│ ├─ Officers can flag incorrect responses                       │
│ ├─ Flagged responses feed into prompt improvement pipeline     │
│ ├─ Monthly accuracy audits by domain experts                   │
│ └─ False positive/negative tracking per agent                  │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

### Grounding Rules Enforced Across All Agents

| Rule | Enforcement |
|---|---|
| No invented case numbers | All FIR numbers in output must exist in CaseMaster (verified via SQL) |
| No fabricated statistics | All numbers must come from query results, never from LLM generation |
| No hallucinated names | Person names must match records in Accused/Victim/Complainant tables |
| No speculative legal references | Act/Section references validated against Act and Section tables |
| No geographic fabrication | Location names validated against District, Unit, State tables |
| Uncertainty is stated | If data is insufficient, response must explicitly say "insufficient data" rather than speculate |

---

## 12.5 RAG Pipeline Design

### Document Corpus

| Document Type | Source | Volume | Update Frequency | Chunking Strategy |
|---|---|---|---|---|
| **FIR BriefFacts** | CaseMaster.BriefFacts | ~10M documents | Real-time (on filing) | Semantic (paragraph-level) |
| **Legal Acts & Sections** | Act, Section tables | ~5K documents | Quarterly (legislative changes) | Section-level (one chunk per section) |
| **Investigation Reports** | Officer uploads | ~500K documents | Daily | Semantic (500 token sliding window, 100 token overlap) |
| **Intelligence Bulletins** | HQ reports | ~50K documents | Weekly | Document-level (typically short) |
| **Court Orders** | Court integration | ~2M documents | Daily | Section-level (orders, judgments, bail conditions) |
| **SOPs & Circulars** | Karnataka Police HQ | ~10K documents | Monthly | Section-level with headers preserved |
| **Previous AI Reports** | Report Generation Agent | ~1M documents | Continuous | Full document (for self-reference) |

### RAG Pipeline Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        DOCUMENT INGESTION PIPELINE                    │
│                                                                      │
│  Source → [Extract] → [Clean] → [Chunk] → [Embed] → [Index]        │
│                                                                      │
│  ┌─────────┐   ┌─────────┐   ┌──────────┐   ┌──────────┐   ┌──────┐│
│  │ Catalyst │   │ Text    │   │ Semantic │   │ text-    │   │Pineco││
│  │ Signals  │──▶│ Extract │──▶│ Chunker  │──▶│ embed-   │──▶│ne    ││
│  │ (events) │   │ (Tika)  │   │          │   │ ding-004 │   │Upsert││
│  └─────────┘   └─────────┘   └──────────┘   └──────────┘   └──────┘│
│       │              │              │              │              │   │
│       │         ┌─────────┐   ┌──────────┐   ┌──────────┐   ┌──────┐│
│       │         │ PII     │   │ Metadata │   │ Batch vs │   │Elasti││
│       └────────▶│ Redact  │   │ Extract  │   │ Real-time│   │csearc││
│                 │ (DLP)   │   │          │   │ Routing  │   │h     ││
│                 └─────────┘   └──────────┘   └──────────┘   │Index ││
│                                                              └──────┘│
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                        RETRIEVAL PIPELINE                            │
│                                                                      │
│  Query → [Embed] → [Retrieve] → [Re-rank] → [Context] → [Generate] │
│                                                                      │
│  ┌─────────┐   ┌──────────────────────┐   ┌─────────┐   ┌─────────┐│
│  │ User    │   │ HYBRID RETRIEVAL      │   │ Cross-  │   │ LLM     ││
│  │ Query   │──▶│                       │──▶│ Encoder │──▶│ Generate ││
│  │         │   │ ┌───────┐ ┌────────┐  │   │ Reranker│   │ with    ││
│  └─────────┘   │ │Pineco-│ │Elastic-│  │   │ (Cohere)│   │ Context ││
│       │        │ │ne     │ │search  │  │   └─────────┘   └─────────┘│
│       │        │ │Semantic│ │Keyword │  │        │              │    │
│       │        │ │Search │ │+ BM25  │  │        │              │    │
│       │        │ └───┬───┘ └───┬────┘  │   ┌────▼────┐   ┌────▼───┐│
│       │        │     └────┬────┘       │   │ MMR     │   │ Context││
│       │        │          │            │   │ Diversi-│   │ Window ││
│       │        └──────────┼────────────┘   │ fication│   │ Manager││
│       │                   │                └─────────┘   └────────┘│
│  ┌────▼────┐         ┌────▼────┐                                    │
│  │ Query   │         │ Recip.  │                                    │
│  │ Expand  │         │ Rank    │                                    │
│  │ (synon- │         │ Fusion  │                                    │
│  │ yms)    │         │ (RRF)   │                                    │
│  └─────────┘         └─────────┘                                    │
└──────────────────────────────────────────────────────────────────────┘
```

### Chunking Strategy

| Strategy | When Used | Implementation | Why |
|---|---|---|---|
| **Semantic Chunking** | FIR BriefFacts, Investigation Reports | LangChain `SemanticChunker` with `text-embedding-004` — splits at semantic breakpoints where embedding similarity drops below threshold | FIR text has natural narrative structure; semantic chunking preserves meaning units |
| **Fixed-Size with Overlap** | Fallback for unstructured text | 500 tokens per chunk, 100 token overlap (20%) | Ensures no information is lost at boundaries |
| **Section-Level** | Legal Acts, SOPs, Court Orders | Split on document headers (H1/H2), preserve section hierarchy in metadata | Legal documents have clear structural boundaries; sections are self-contained |
| **Document-Level** | Intelligence Bulletins (<2K tokens) | No splitting — entire document as one chunk | Short documents lose context when split |
| **Hierarchical** | Long investigation reports | Parent chunk (full section) + child chunks (paragraphs). Retrieval on children, context from parent | Provides both precision (child match) and context (parent window) |

### Embedding Model Selection

| Model | Dimensions | Performance (MTEB) | Latency | Cost | Decision |
|---|---|---|---|---|---|
| **text-embedding-004** (Google) | 768 | 66.3 | ~50ms | $0.00625/1K tokens | ✅ **Primary** — best balance of quality, cost, and Vertex AI integration |
| **text-embedding-3-large** (OpenAI) | 3072 | 64.6 | ~80ms | $0.013/1K tokens | Fallback — higher dimensions with diminishing returns |
| **Cohere embed-v3** | 1024 | 66.0 | ~60ms | $0.01/1K tokens | Considered — comparable quality but additional vendor dependency |

**Why text-embedding-004**: Native Vertex AI integration eliminates a cross-vendor API call, reducing latency by ~30ms. 768 dimensions provide an excellent quality-to-storage ratio for Pinecone. Google's embedding models are trained on diverse multilingual data including Indian languages, important for Kannada text in FIRs.

### Vector Store Design (Pinecone)

**Namespace Architecture:**
```
Pinecone Index: "karnataka-crime-intelligence"
├── Namespace: "fir-brieffacts"        (10M+ vectors)
│   └── Metadata: case_id, district_id, crime_head_id, date, unit_id,
│                  gravity, case_status, accused_count
├── Namespace: "legal-documents"       (50K vectors)
│   └── Metadata: act_id, section_id, act_name, section_number,
│                  effective_date, amendment_date
├── Namespace: "investigation-reports" (500K vectors)
│   └── Metadata: case_id, officer_id, report_type, date,
│                  classification_level
├── Namespace: "intelligence-bulletins" (50K vectors)
│   └── Metadata: bulletin_id, source_unit, date, priority,
│                  geographic_scope
├── Namespace: "court-orders"          (2M vectors)
│   └── Metadata: case_id, court_id, order_type, date, judge_name
├── Namespace: "sops-circulars"        (10K vectors)
│   └── Metadata: document_id, issuing_authority, effective_date,
│                  topic_category
└── Namespace: "ai-reports"            (1M vectors)
    └── Metadata: investigation_id, report_type, generated_date,
                   officer_id, agents_used
```

**Why Namespaces**: Pinecone namespaces provide logical isolation with independent indexing. A query about legal sections never searches FIR embeddings, reducing search space by orders of magnitude and improving relevance.

**Metadata Filtering Strategy:**
- **Pre-filtering**: Applied before ANN search — filters on district_id, date range, crime_head_id
- **Post-filtering**: Applied after ANN search — filters on less selective attributes
- **Why pre-filtering**: Reduces the search space from millions to thousands before computing vector similarity, dramatically improving both latency and relevance

### Retrieval Strategies

| Strategy | Implementation | When Used |
|---|---|---|
| **Hybrid Search (RRF)** | Reciprocal Rank Fusion combining Pinecone semantic scores + Elasticsearch BM25 scores | **Default** — best overall retrieval quality |
| **Pure Semantic** | Pinecone-only with embedding similarity | Conceptual queries ("cases similar to organized crime pattern") |
| **Pure Keyword** | Elasticsearch-only with BM25 | Exact match queries (FIR numbers, specific names, section numbers) |
| **MMR (Maximal Marginal Relevance)** | Pinecone with lambda=0.7 diversity parameter | When user needs diverse results, not just the most similar |
| **Re-ranking** | Cohere `rerank-english-v3.0` applied after initial retrieval | All retrievals with >10 results — improves top-10 precision by ~15% |
| **Parent-Child Retrieval** | Retrieve on child chunks, return parent chunk as context | Long documents where precise matching needs broader context |

### Context Window Management

```
┌──────────────────────────────────────────────────────────────┐
│            CONTEXT WINDOW BUDGET (Gemini 2.5 Pro)             │
│                     Total: 1,000,000 tokens                   │
├──────────────────────────────────────────────────────────────┤
│ Layer 1: System Prompt (Global + Agent-Specific)    ~5,000   │
│ Layer 2: Schema Documentation (DDL + Graph)         ~15,000  │
│ Layer 3: Few-Shot Examples                          ~10,000  │
│ Layer 4: Retrieved RAG Documents (top 10-20)        ~20,000  │
│ Layer 5: Query-Specific Data (SQL results, etc.)    ~10,000  │
│ Layer 6: Conversation History (compressed)          ~5,000   │
│ Layer 7: Investigation Context (from Memory Agent)  ~5,000   │
│ ─────────────────────────────────────────────────────────── │
│ Total Used (typical):                               ~70,000  │
│ Reserved for Output Generation:                     ~30,000  │
│ Safety Buffer:                                      ~900,000 │
│                                                               │
│ NOTE: We intentionally use <10% of the context window in     │
│ typical operation. The 1M window is reserved for edge cases   │
│ (e.g., analyzing multiple FIR texts simultaneously, or        │
│ processing an investigation with 100+ prior turns).           │
└──────────────────────────────────────────────────────────────┘
```

**Context Compression Strategies:**
1. **Conversation summarization**: After 10 turns, Memory Agent summarizes earlier turns (~80% token reduction)
2. **RAG result truncation**: Only relevant snippets are included, not full documents
3. **Progressive disclosure**: Schema documentation is loaded on-demand based on query — only tables/nodes relevant to the current query
4. **SQL result compression**: Large result sets are aggregated/summarized before inclusion in context

---

## 12.6 Conversation Memory Architecture

### Three-Tier Memory Model

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  TIER 1: SHORT-TERM MEMORY (Session-Scoped)                    │
│  ┌──────────────────────────────────────────────────────┐      │
│  │ Storage: Catalyst Cache (in-memory)                  │      │
│  │ TTL: Session duration (max 4 hours)                  │      │
│  │ Contents:                                            │      │
│  │  ├─ Full conversation messages (last 20 turns)       │      │
│  │  ├─ Current investigation state                      │      │
│  │  ├─ Agent results from current session               │      │
│  │  └─ Active filters/context (district, date range)    │      │
│  │ Access Pattern: Every query (read); every response   │      │
│  │                 (write)                               │      │
│  │ Latency: <10ms read, <10ms write                    │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                │
│  TIER 2: INVESTIGATION MEMORY (Case-Scoped)                    │
│  ┌──────────────────────────────────────────────────────┐      │
│  │ Storage: Catalyst Data Store + Pinecone              │      │
│  │ TTL: Investigation lifetime (months to years)        │      │
│  │ Contents:                                            │      │
│  │  ├─ Investigation timeline (all queries & findings)  │      │
│  │  ├─ Key entities discovered (accused, locations)     │      │
│  │  ├─ AI-generated hypotheses and their status         │      │
│  │  ├─ Officer annotations and corrections              │      │
│  │  ├─ Cross-session conversation summaries             │      │
│  │  └─ Evidence references and data source pointers     │      │
│  │ Access Pattern: Loaded when officer opens an         │      │
│  │                 investigation; updated on findings    │      │
│  │ Latency: <100ms read (cached), <500ms write         │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                │
│  TIER 3: LONG-TERM MEMORY (Officer-Scoped)                     │
│  ┌──────────────────────────────────────────────────────┐      │
│  │ Storage: Catalyst Data Store                         │      │
│  │ TTL: Officer tenure (years)                          │      │
│  │ Contents:                                            │      │
│  │  ├─ Officer query patterns & preferences             │      │
│  │  ├─ Frequently accessed cases/districts              │      │
│  │  ├─ Preferred report formats                         │      │
│  │  ├─ Feedback history (corrections, ratings)          │      │
│  │  ├─ Expertise areas (auto-detected from usage)       │      │
│  │  └─ Personalized query templates                     │      │
│  │ Access Pattern: Loaded at session start; updated     │      │
│  │                 weekly (batch)                        │      │
│  │ Latency: <200ms read (cached)                       │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Memory Isolation Guarantees

| Concern | Guarantee | Implementation |
|---|---|---|
| **Cross-investigation leakage** | Investigation memory is strictly scoped to case ID; no data flows between investigations unless explicitly linked | Pinecone namespace per investigation group; Data Store partitioned by investigation_id |
| **Cross-officer leakage** | Officer A cannot access Officer B's memories or query history | RBAC enforcement on all memory operations; row-level security on Data Store |
| **Temporal isolation** | Historical investigation memories don't contaminate current analysis unless relevant | Relevance scoring with recency decay (half-life: 30 days) |
| **Right to erasure** | Investigation memories can be purged when case is closed (per retention policy) | Soft delete with configurable hard-delete after retention period |

---

## 12.7 Multi-Turn Planning for Complex Investigations

### Investigation Session Lifecycle

```
Turn 1: Officer opens investigation
         → Memory Agent loads any prior context
         → System presents investigation dashboard

Turn 2: "Show me all chain snatching cases in Bengaluru North, last 6 months"
         → SQL Agent retrieves data
         → Geospatial Agent generates heatmap
         → Memory stores: entities (Bengaluru North, chain snatching),
           date range, initial results

Turn 3: "Are any of the accused in these cases connected?"
         → Memory provides context: "these cases" = results from Turn 2
         → Graph Agent queries co-accused networks
         → Memory stores: discovered network entities

Turn 4: "What's the likelihood this is an organized gang?"
         → Memory provides full context: cases + network
         → Risk Agent assesses organized crime probability
         → Graph Agent runs community detection on the network
         → Anomaly Agent checks for pattern consistency
         → Memory stores: risk assessment, community structure

Turn 5: "Predict where they might strike next and recommend patrol deployment"
         → Geospatial Agent analyzes spatial patterns from Turn 2
         → Forecast Agent projects next likely locations
         → Recommendation Agent suggests patrol allocation
         → Report Agent synthesizes full investigation summary
         → Memory stores: predictions, recommendations, final report
```

**Key Design Decisions:**
1. **Implicit context resolution**: "these cases" → resolved from Turn 2 results without requiring explicit reference
2. **Progressive hypothesis building**: Each turn builds on previous findings, creating a coherent investigation narrative
3. **Memory persistence**: If the officer closes and reopens the investigation next day, all context is restored from Tier 2 memory
4. **Branching**: Officer can ask a tangential question ("What's the legal penalty for this?") without losing investigation context

---

## 12.8 Cost Optimization

### Token Cost Model

| Component | Estimated Monthly Volume | Model | Cost Estimate |
|---|---|---|---|
| **Supervisor routing** | 10M queries × ~500 tokens each | Flash-Lite | $200/month |
| **SQL generation** | 3M queries × ~2K tokens each | Pro | $7,500/month |
| **Graph queries** | 1M queries × ~2K tokens each | Pro | $2,500/month |
| **Search queries** | 2M queries × ~500 tokens each | Flash | $150/month |
| **Report generation** | 500K reports × ~5K tokens each | Pro | $12,500/month |
| **Embeddings** | 1M documents × ~500 tokens each | text-embedding-004 | $3,125/month |
| **Other agents** | 2M calls × ~1K tokens each | Mixed | $3,000/month |
| **Total LLM Cost** | — | — | **~$29,000/month** |

### Cost Optimization Strategies

| Strategy | Expected Savings | Implementation |
|---|---|---|
| **Prompt Caching** | 30-40% on repeated queries | Vertex AI context caching — cache system prompts and few-shot examples (billed at 75% discount on cached tokens) |
| **Model Routing** | 40-60% vs. using Pro for everything | Use Flash/Flash-Lite for simple tasks, Pro only when reasoning quality is critical |
| **Response Caching** | 20-30% on repeated queries | Cache full responses for identical queries (same parameters, same date range) in Catalyst Cache with 1-hour TTL |
| **Token Budgeting** | 10-15% | Set per-agent max_tokens limits; truncate verbose outputs |
| **Batch Processing** | 15-20% on daily analytics | Daily trend analysis, bulk risk scoring, etc. run as batch jobs on Vertex AI (lower pricing) |
| **Query Deduplication** | 5-10% | Detect and merge semantically identical concurrent queries |
| **Progressive Detail** | 10-20% | Return summary first; generate details only if officer requests deeper analysis |

### Cost Monitoring & Alerting

| Metric | Alert Threshold | Action |
|---|---|---|
| Daily LLM spend | > $1,500 (150% of budget) | Alert to platform admin |
| Per-officer daily spend | > $50 | Alert to unit admin |
| Token waste ratio (output tokens unused by user) | > 30% | Trigger output length optimization |
| Cache hit ratio | < 20% | Investigate cache configuration |
| Model upgrade cost impact | > 20% increase | Block auto-upgrade, require manual approval |

---

## 12.9 Safety & Compliance

### PII Handling in LLM Pipeline

```
┌──────────────────────────────────────────────────────────────┐
│                    PII LIFECYCLE IN LLM PIPELINE              │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ 1. INPUT STAGE                                                │
│    User query → PII scan → If PII found:                      │
│    ├─ Replace with tokens: "Rajesh Kumar" → [PERSON_001]      │
│    ├─ Store mapping: {PERSON_001: "Rajesh Kumar"} in secure   │
│    │   session store (Catalyst Cache, encrypted)               │
│    └─ Forward tokenized query to LLM                          │
│                                                               │
│ 2. PROCESSING STAGE                                           │
│    LLM operates on tokenized data                             │
│    ├─ SQL queries use tokenized values                        │
│    ├─ Graph queries use tokenized values                      │
│    └─ All inter-agent communication uses tokens               │
│                                                               │
│ 3. OUTPUT STAGE                                               │
│    LLM response → Check officer clearance → If authorized:    │
│    ├─ Re-hydrate tokens: [PERSON_001] → "Rajesh Kumar"        │
│    └─ If NOT authorized: Keep tokens or redact entirely       │
│                                                               │
│ 4. LOGGING STAGE                                              │
│    Audit logs ALWAYS use tokenized values                     │
│    ├─ PII mapping stored separately with higher classification │
│    ├─ Log retention: 7 years (as per IT Act)                  │
│    └─ PII mapping retention: investigation lifetime only      │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### Evidence Chain Preservation

| Requirement | Implementation |
|---|---|
| **Every AI output must be traceable** | Each response includes `evidence_chain[]` with source references |
| **Query provenance** | Original user query, classified intent, and all intermediate queries stored |
| **Data lineage** | SQL/Cypher queries stored with execution timestamps and result hashes |
| **Model provenance** | LLM model ID, version, temperature, and seed recorded per call |
| **Decision audit** | Supervisor routing decisions, Planner plans, and Reflection evaluations logged |
| **Immutability** | Audit logs written to append-only storage (Catalyst Signals → Databricks Delta Lake) |
| **Legal admissibility** | Evidence chain format aligned with Indian Evidence Act digital evidence requirements |

### Compliance Matrix

| Regulation | Requirement | Implementation |
|---|---|---|
| **IT Act 2000 (India)** | Data protection, electronic records | Encrypted storage, digital signatures, audit trails |
| **DPDP Act 2023 (India)** | Personal data protection, consent | PII tokenization, purpose limitation, right to erasure |
| **BNS 2023** | Bharatiya Nyaya Sanhita digital evidence | Cryptographic hashing of all digital evidence |
| **Karnataka Police Manual** | Information classification, access control | RBAC/ABAC aligned to police ranks and jurisdictions |
| **Supreme Court Guidelines** | Privacy, surveillance oversight | Judicial authorization checks for sensitive queries |
| **INTERPOL Standards** | International data sharing | Data format compliance, classification markings |

---

# 13. Graph Intelligence Architecture

## 13.1 Knowledge Graph Design Philosophy

### Why a Knowledge Graph

Criminal intelligence is fundamentally about **relationships**. Traditional relational databases answer "What happened?" but struggle with "Who is connected to whom, and how?" A knowledge graph enables:

1. **Multi-hop relationship discovery**: "Is suspect A connected to suspect B through any intermediary?" — requires variable-depth traversal
2. **Community detection**: Automatically identify criminal gangs and networks from co-accused patterns
3. **Criminal influence measurement**: PageRank identifies the most influential nodes in a criminal network
4. **Predictive link analysis**: Predict future criminal associations based on network topology
5. **Temporal network evolution**: Track how criminal networks form, grow, and dissolve over time

### Why Neo4j Aura

| Factor | Neo4j Aura | Amazon Neptune | TigerGraph | Dgraph |
|---|---|---|---|---|
| **Graph Query Language** | Cypher (intuitive, widely adopted) | SPARQL/Gremlin (verbose) | GSQL (proprietary) | GraphQL+- (limited) |
| **Graph Data Science (GDS)** | ✅ 65+ algorithms | ❌ Limited | ✅ Good | ❌ Basic |
| **Managed Service** | ✅ Fully managed | ✅ Fully managed | ⚠️ Limited regions | ⚠️ Self-managed mostly |
| **Visualization** | ✅ Neo4j Bloom | ⚠️ Basic | ✅ GraphStudio | ❌ None |
| **Community/Ecosystem** | ✅ Largest graph DB community | ⚠️ Moderate | ⚠️ Small | ⚠️ Small |
| **Indian Region Availability** | ✅ GCP Mumbai | ✅ AWS Mumbai | ❌ Limited | ❌ Limited |
| **LLM Integration** | ✅ Neo4j + LangChain native | ⚠️ Emerging | ⚠️ Emerging | ❌ Limited |

**Decision**: Neo4j Aura on GCP Mumbai region — best algorithm library, Cypher is the most LLM-friendly graph query language (highest accuracy in text-to-Cypher benchmarks), and native LangChain integration simplifies Graph Agent implementation.

---

## 13.2 Complete Graph Schema

### Graph Schema Diagram (ASCII)

```
                                    ┌──────────────────┐
                                    │    ORGANIZATION   │
                                    │ ─────────────── │
                                    │ org_id           │
                                    │ name             │
                                    │ type (gang/      │
                                    │   syndicate/     │
                                    │   political)     │
                                    │ threat_level     │
                                    │ active_since     │
                                    │ territory_wkt    │
                                    └────────┬─────────┘
                                             │
                                       MEMBER_OF
                                       (role, since,
                                        rank_in_org)
                                             │
┌─────────────┐                    ┌─────────▼────────┐                    ┌─────────────┐
│   VEHICLE    │◄──OWNS_VEHICLE───│      PERSON       │───USES_PHONE────▶│ PHONE_NUMBER│
│ ────────── │   (since, status)  │ ──────────────── │  (from, to,      │ ──────────── │
│ vehicle_id   │                   │ person_id         │   call_freq)     │ phone_id     │
│ reg_number   │                   │ name              │                   │ number       │
│ type         │◄──USES_VEHICLE───│ aliases[]         │───RELATED_TO────▶│ provider     │
│ make         │   (case_id)       │ age / dob         │  (relation_type: │ imei         │
│ model        │                   │ gender            │   father/mother/ │ active       │
│ color        │                   │ aadhaar_hash      │   spouse/sibling)│              │
│ owner_name   │                   │ category          │                   └──────────────┘
└──────────────┘                   │  (accused/victim/ │
                                   │   complainant/    │          ┌──────────────┐
┌──────────────┐                   │   witness)        │          │   EVIDENCE    │
│   LOCATION   │                   │ occupation_id     │          │ ──────────── │
│ ──────────── │                   │ caste_id          │          │ evidence_id   │
│ location_id  │◄──LIVES_AT───────│ religion_id       │          │ type (weapon/ │
│ type (crime  │   (from, to,      │ risk_score        │          │  document/    │
│  scene/addr/ │    current)       │ first_seen_date   │          │  digital/     │
│  station/    │                   │ last_seen_date    │          │  forensic)    │
│  court)      │◄──ARRESTED_AT────│ total_cases       │──LINKED_TO│ description  │
│ address      │   (date)          └──┬──┬──┬──┬──┬───┘ EVIDENCE  │ custody_chain│
│ lat          │                      │  │  │  │  │     (role)    │ storage_loc  │
│ lng          │◄──OCCURRED_AT────────┘  │  │  │  │               └──────────────┘
│ district_id  │   (primary/secondary)   │  │  │  │
│ unit_id      │                         │  │  │  │
│ pincode      │                         │  │  │  │
│ area_name    │                         │  │  │  │
└──────────────┘                         │  │  │  │
                                         │  │  │  │
    ┌────────────────────────────────────┘  │  │  └─────────────────────────────────┐
    │                                       │  │                                     │
    │ ACCUSED_IN                            │  │ CO_ACCUSED_WITH                     │
    │ (arrest_date,                         │  │ (case_count,                        │
    │  bail_status,                         │  │  first_coaccused,                   │
    │  chargesheet_status)                  │  │  strength)                          │
    │                                       │  │                                     │
    ▼                                       │  └──────────────────┐                  │
┌──────────────┐                            │                     │                  │
│     CASE      │                            │                     ▼                  │
│ ──────────── │                            │              ┌──────────────┐           │
│ case_id       │◄──VICTIM_IN──────────────┘               │   PERSON     │           │
│ fir_number    │   (injury_type,                          │  (another    │           │
│ case_type     │    severity)                             │   Person     │           │
│  (FIR/UDR/   │                                          │   node)      │◄──────────┘
│   PAR)        │◄──COMPLAINED_IN                          └──────────────┘
│ brief_facts   │   (complaint_date)
│ offence_date  │                                    ┌──────────────┐
│ district_id   │──INVESTIGATED_BY─────────────────▶│   EMPLOYEE    │
│ unit_id       │  (from_date, to_date,              │ ──────────── │
│ gravity       │   role: IO/SHO/SP)                 │ employee_id   │
│ case_status   │                                    │ kgid          │
│ fir_stage     │──REGISTERED_AT──▶ LOCATION         │ name          │
│ chargesheet_  │  (date)                            │ rank_id       │
│  date         │                                    │ designation_id│
│ court_id      │──TRIED_AT──────▶ LOCATION (Court)  │ unit_id       │
│ judgment      │  (court_case_no)                   │ phone         │
└───┬───────────┘                                    │ email         │
    │                                                └──────┬───────┘
    │                                                       │
    │ CHARGED_UNDER                                   ARRESTED_BY
    │ (primary/secondary)                              (arrest_date,
    │                                                   location_id)
    ▼
┌──────────────────┐
│     LEGAL         │
│ ──────────────── │
│ legal_id          │
│ act_name          │
│ section_number    │
│ description       │
│ bailable          │
│ cognizable        │
│ max_punishment    │
│ compoundable      │
│ crime_head_id     │
│ crime_sub_head_id │
└──────────────────┘
```

### Complete Node Types (9 Types)

| Node Label | Source Table(s) | Key Properties | Estimated Volume |
|---|---|---|---|
| **Person** | Accused, Victim, ComplainantDetails | person_id, name, aliases[], age, gender, aadhaar_hash, category (accused/victim/complainant/witness), occupation, caste, religion, risk_score, total_cases, first_seen_date, last_seen_date | 50M+ |
| **Case** | CaseMaster | case_id, fir_number, case_type, brief_facts, offence_date, district_id, unit_id, gravity, case_status, fir_stage, chargesheet_date, court_id, judgment | 100M+ |
| **Location** | Unit, Court, CaseMaster (GPS), Accused/Victim addresses | location_id, type, address, lat, lng, district_id, unit_id, pincode, area_name | 10M+ |
| **Organization** | Derived (gang intelligence, community detection) | org_id, name, type (gang/syndicate/political/business), threat_level, active_since, territory_wkt, member_count | 100K+ |
| **Vehicle** | Derived from FIR BriefFacts (NLP extraction) | vehicle_id, reg_number, type, make, model, color, owner_name | 5M+ |
| **PhoneNumber** | Derived from FIR/investigation data | phone_id, number, provider, imei, active | 10M+ |
| **Evidence** | Derived from investigation records | evidence_id, type (weapon/document/digital/forensic/biological), description, custody_chain, storage_location | 20M+ |
| **Legal** | Act, Section, ActSectionAssociation, CrimeHead | legal_id, act_name, section_number, description, bailable, cognizable, max_punishment, compoundable, crime_head_id | 10K+ |
| **Employee** | Employee, Rank, Designation | employee_id, kgid, name, rank_id, designation_id, unit_id, phone, email | 200K+ |

### Complete Relationship Types (30 Types)

| # | Relationship Type | Start Node | End Node | Key Properties | Cardinality | Source |
|---|---|---|---|---|---|---|
| 1 | `ACCUSED_IN` | Person | Case | arrest_date, bail_status, chargesheet_status, surrender_date, remand_type | Many-to-Many | Accused table |
| 2 | `VICTIM_IN` | Person | Case | injury_type, severity, compensation_status, age_at_incident | Many-to-Many | Victim table |
| 3 | `COMPLAINED_IN` | Person | Case | complaint_date, complaint_type | Many-to-Many | ComplainantDetails |
| 4 | `WITNESSED_IN` | Person | Case | statement_date, testimony_status | Many-to-Many | Derived |
| 5 | `CO_ACCUSED_WITH` | Person | Person | case_count, first_coaccused_date, last_coaccused_date, strength (weighted) | Many-to-Many | Derived from co-occurrence in Accused table |
| 6 | `KNOWN_ASSOCIATE` | Person | Person | source (intelligence/surveillance/confession), confidence, first_linked, last_linked | Many-to-Many | Intelligence reports |
| 7 | `RELATED_TO` | Person | Person | relation_type (father/mother/spouse/sibling/child/uncle/cousin), verified | Many-to-Many | Derived from address + name matching |
| 8 | `OCCURRED_AT` | Case | Location | primary_or_secondary, precision (exact/approximate) | Many-to-One | CaseMaster GPS coordinates |
| 9 | `LIVES_AT` | Person | Location | from_date, to_date, current (boolean), source | Many-to-Many | Accused/Victim addresses |
| 10 | `ARRESTED_AT` | Person | Location | arrest_date, case_id | Many-to-Many | ArrestSurrender |
| 11 | `REGISTERED_AT` | Case | Location | registration_date | Many-to-One | CaseMaster → Unit |
| 12 | `TRIED_AT` | Case | Location | court_case_number, hearing_dates[] | Many-to-One | CaseMaster → Court |
| 13 | `INVESTIGATED_BY` | Case | Employee | from_date, to_date, role (IO/SHO/SP/ACP), transfer_reason | Many-to-Many | CaseMaster → Employee |
| 14 | `ARRESTED_BY` | Person | Employee | arrest_date, location_id, case_id | Many-to-Many | ArrestSurrender |
| 15 | `SUPERVISED_BY` | Employee | Employee | from_date, to_date | Many-to-One | Employee hierarchy |
| 16 | `POSTED_AT` | Employee | Location | from_date, to_date, designation | Many-to-Many | Employee → Unit |
| 17 | `CHARGED_UNDER` | Case | Legal | primary_or_secondary, added_date, dropped (boolean) | Many-to-Many | CrimeHeadActSection |
| 18 | `OWNS_VEHICLE` | Person | Vehicle | since_date, registration_status | Many-to-Many | Derived |
| 19 | `USES_VEHICLE` | Person | Vehicle | case_id, role (suspect/getaway/transport) | Many-to-Many | FIR BriefFacts NLP |
| 20 | `USES_PHONE` | Person | PhoneNumber | from_date, to_date, call_frequency, primary (boolean) | Many-to-Many | Investigation data |
| 21 | `CALLED` | PhoneNumber | PhoneNumber | call_count, first_call, last_call, total_duration_sec | Many-to-Many | CDR analysis |
| 22 | `MEMBER_OF` | Person | Organization | role (leader/member/associate), since_date, until_date, rank_in_org | Many-to-Many | Intelligence + community detection |
| 23 | `ALLIED_WITH` | Organization | Organization | since_date, alliance_type, strength | Many-to-Many | Intelligence |
| 24 | `RIVALS_WITH` | Organization | Organization | since_date, conflict_type | Many-to-Many | Intelligence |
| 25 | `LINKED_TO_EVIDENCE` | Person | Evidence | role (owner/handler/found_with), case_id | Many-to-Many | Investigation data |
| 26 | `EVIDENCE_IN` | Evidence | Case | seized_date, seizure_memo_number | Many-to-Many | Investigation data |
| 27 | `USES_MODUS_OPERANDI` | Person | Case | mo_classification, mo_description_hash | Many-to-Many | FIR BriefFacts NLP |
| 28 | `BAIL_GRANTED_BY` | Case | Employee | bail_date, bail_type, conditions | Many-to-One | Court data |
| 29 | `SAME_AS` | Person | Person | confidence, match_method (aadhaar/biometric/manual), verified_by | Many-to-Many | Entity resolution |
| 30 | `FREQUENTS` | Person | Location | visit_count, first_visit, last_visit, avg_duration | Many-to-Many | Surveillance/CDR/intelligence |

---

## 13.3 Graph Algorithms & Intelligence Pipelines

### Algorithm 1: Community Detection — Gang Identification

**Algorithm**: Louvain Modularity (primary) + Label Propagation (validation)

**Why Louvain**: Optimized for large networks, deterministic, produces hierarchical community structure — directly maps to gang/subgang hierarchy. Louvain maximizes modularity (density of connections within communities vs. between communities), which naturally identifies tightly connected criminal groups.

**Why Label Propagation as validation**: LP uses a different approach (semi-supervised propagation) and its agreement with Louvain confirms community structure is robust, not an artifact of a single algorithm.

**Cypher Example — Louvain Community Detection:**
```cypher
// Project the co-accused network into GDS
CALL gds.graph.project(
  'coaccused-network',
  'Person',
  {
    CO_ACCUSED_WITH: {
      orientation: 'UNDIRECTED',
      properties: ['case_count', 'strength']
    }
  }
)

// Run Louvain community detection
CALL gds.louvain.stream('coaccused-network', {
  nodeLabels: ['Person'],
  relationshipTypes: ['CO_ACCUSED_WITH'],
  relationshipWeightProperty: 'strength',
  maxLevels: 5,
  maxIterations: 20,
  tolerance: 0.0001,
  includeIntermediateCommunities: true
})
YIELD nodeId, communityId, intermediateCommunityIds
WITH gds.util.asNode(nodeId) AS person, communityId,
     intermediateCommunityIds
RETURN person.name AS name, person.person_id AS id,
       communityId AS gang_id,
       intermediateCommunityIds AS sub_gangs,
       person.total_cases AS cases
ORDER BY communityId, cases DESC
```

**Application**: Output communities are tagged as potential gangs. Communities with >5 members, >10 shared cases, and inter-member connection density >0.6 are flagged as "High-Confidence Criminal Network" for intelligence review.

### Algorithm 2: Centrality — Key Criminal Identification

**Algorithm**: PageRank (influence), Betweenness Centrality (brokerage), Closeness Centrality (accessibility)

**Why Multiple Centrality Measures**: Each reveals a different aspect of criminal importance:
- **PageRank**: "Who is the most influential/connected?" — identifies gang leaders
- **Betweenness**: "Who bridges different criminal groups?" — identifies brokers, facilitators, informants
- **Closeness**: "Who can reach anyone in the network fastest?" — identifies operationally central figures

**Cypher Example — PageRank for Criminal Influence:**
```cypher
CALL gds.pageRank.stream('coaccused-network', {
  maxIterations: 50,
  dampingFactor: 0.85,
  relationshipWeightProperty: 'strength'
})
YIELD nodeId, score
WITH gds.util.asNode(nodeId) AS person, score
WHERE score > 0.01  // Filter noise
RETURN person.name AS name,
       person.person_id AS id,
       person.total_cases AS total_cases,
       round(score, 6) AS influence_score
ORDER BY score DESC
LIMIT 50
```

**Cypher Example — Betweenness Centrality for Broker Detection:**
```cypher
CALL gds.betweenness.stream('coaccused-network', {
  samplingSize: 1000,
  samplingSeed: 42
})
YIELD nodeId, score
WITH gds.util.asNode(nodeId) AS person, score
WHERE score > 100  // High betweenness
RETURN person.name AS name,
       person.person_id AS id,
       round(score, 2) AS broker_score,
       person.total_cases AS cases
ORDER BY score DESC
LIMIT 25
```

### Algorithm 3: Shortest Path — Connection Discovery

**Algorithm**: Dijkstra's Shortest Path (weighted) + All Shortest Paths (for multiple connection routes)

**Why**: When an officer asks "How is suspect A connected to suspect B?", the shortest path reveals the most direct chain of relationships. Multiple shortest paths reveal redundant connections (more robust criminal ties).

**Cypher Example — Shortest Path Between Suspects:**
```cypher
// Find shortest path between two persons through any relationship
MATCH (a:Person {person_id: $person_a_id}),
      (b:Person {person_id: $person_b_id})
CALL gds.shortestPath.dijkstra.stream('criminal-network', {
  sourceNode: a,
  targetNode: b,
  relationshipWeightProperty: 'strength'
})
YIELD index, sourceNode, targetNode, totalCost, nodeIds, costs, path
RETURN [nodeId IN nodeIds | gds.util.asNode(nodeId).name] AS path_names,
       totalCost AS path_weight,
       length(path) AS hops
```

**Cypher Example — All Shortest Paths (multiple routes):**
```cypher
MATCH (a:Person {person_id: $person_a_id}),
      (b:Person {person_id: $person_b_id}),
      paths = allShortestPaths((a)-[*..6]-(b))
RETURN [node IN nodes(paths) | node.name] AS path,
       [rel IN relationships(paths) | type(rel)] AS relationship_types,
       length(paths) AS hops
LIMIT 10
```

### Algorithm 4: Node Similarity — Similar Criminal Profiles

**Algorithm**: Jaccard Similarity (categorical features) + Cosine Similarity (numerical features)

**Why**: Finding criminals with similar profiles (same crime types, same areas, same modus operandi) helps predict who might commit similar crimes and identifies potential aliases/duplicates.

**Cypher Example — Find Similar Criminal Profiles:**
```cypher
// Similarity based on shared crime types (Jaccard on case-crime_head)
CALL gds.nodeSimilarity.stream('criminal-crime-network', {
  topK: 10,
  similarityCutoff: 0.5
})
YIELD node1, node2, similarity
WITH gds.util.asNode(node1) AS person1,
     gds.util.asNode(node2) AS person2,
     similarity
WHERE person1.person_id = $target_person_id
RETURN person2.name AS similar_criminal,
       person2.person_id AS id,
       round(similarity, 3) AS similarity_score,
       person2.total_cases AS cases
ORDER BY similarity DESC
```

### Algorithm 5: Link Prediction — Predict Future Criminal Associations

**Algorithm**: Common Neighbors + Adamic-Adar + Preferential Attachment (ensemble)

**Why**: Predicting which individuals are likely to become associates enables proactive intelligence. An ensemble of link prediction algorithms is more robust than any single method.

**Cypher Example — Link Prediction:**
```cypher
// Predict likely future co-accused relationships
CALL gds.linkPrediction.predict.stream('coaccused-network', {
  topN: 100,
  threshold: 0.5,
  modelName: 'link-prediction-model'
})
YIELD node1, node2, probability
WITH gds.util.asNode(node1) AS person1,
     gds.util.asNode(node2) AS person2,
     probability
WHERE probability > 0.7
RETURN person1.name AS person_a,
       person2.name AS person_b,
       round(probability, 3) AS association_probability
ORDER BY probability DESC
```

### Algorithm 6: Risk Propagation — Network-Based Risk Scoring

**Algorithm**: Custom label propagation variant where risk scores propagate through relationships with decay

**Why**: A person's risk level is influenced by their associates. A low-risk individual connected to multiple high-risk criminals should have an elevated risk score. The decay ensures risk diminishes with network distance.

**Cypher Example — Risk Propagation:**
```cypher
// Propagate risk scores through CO_ACCUSED_WITH network
// Initial risk scores are set from individual assessment
CALL gds.labelPropagation.stream('coaccused-network', {
  nodeLabels: ['Person'],
  relationshipTypes: ['CO_ACCUSED_WITH', 'KNOWN_ASSOCIATE'],
  nodeWeightProperty: 'risk_score',
  maxIterations: 10
})
YIELD nodeId, communityId
WITH gds.util.asNode(nodeId) AS person, communityId
MATCH (person)-[r:CO_ACCUSED_WITH]-(associate:Person)
WITH person, avg(associate.risk_score) AS avg_network_risk,
     person.risk_score AS individual_risk
SET person.network_adjusted_risk =
    0.7 * individual_risk + 0.3 * avg_network_risk
RETURN person.name, person.network_adjusted_risk
ORDER BY person.network_adjusted_risk DESC
```

### Algorithm 7: Temporal Analysis — Evolving Networks

**Algorithm**: Time-windowed graph snapshots + community evolution tracking

**Why**: Criminal networks are not static — members join, leave, get arrested, form new alliances. Temporal analysis reveals network evolution patterns that predict future structure.

**Cypher Example — Temporal Network Evolution:**
```cypher
// Track how a criminal community evolves over yearly windows
UNWIND range(2020, 2026) AS year
CALL {
  WITH year
  MATCH (a:Person)-[r:CO_ACCUSED_WITH]->(b:Person)
  WHERE r.first_coaccused_date.year <= year
    AND (r.last_coaccused_date IS NULL
         OR r.last_coaccused_date.year >= year)
  WITH year, collect(DISTINCT a.person_id) + collect(DISTINCT b.person_id) AS members,
       count(r) AS active_connections
  RETURN year,
         size(apoc.coll.toSet(members)) AS network_size,
         active_connections,
         toFloat(active_connections) / size(apoc.coll.toSet(members)) AS density
}
RETURN year, network_size, active_connections,
       round(density, 4) AS network_density
ORDER BY year
```

---

## 13.4 Graph-to-Insight Pipeline

### Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                    GRAPH-TO-INSIGHT PIPELINE                       │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐ │
│  │ DATA     │     │ GRAPH    │     │ ALGORITHM│     │ INSIGHT  │ │
│  │ INGEST   │────▶│ BUILD    │────▶│ EXECUTE  │────▶│ GENERATE │ │
│  └──────────┘     └──────────┘     └──────────┘     └──────────┘ │
│                                                                    │
│  Phase 1: DATA INGEST (Continuous)                                 │
│  ├─ New FIR filed → Catalyst Signal → Graph ETL pipeline          │
│  ├─ Extract entities from CaseMaster, Accused, Victim             │
│  ├─ NLP on BriefFacts → extract vehicles, phones, locations       │
│  ├─ Entity resolution (match new Person nodes to existing)        │
│  └─ Create/update nodes and relationships in Neo4j                │
│                                                                    │
│  Phase 2: GRAPH BUILD (Event-Driven + Nightly Batch)              │
│  ├─ Entity resolution: deduplicate Person nodes                   │
│  │   (Aadhaar hash match → 99% confidence)                       │
│  │   (Name + DOB + father's name → 85% confidence)               │
│  │   (Name + address fuzzy match → 60% confidence, manual verify)│
│  ├─ Derived relationships: compute CO_ACCUSED_WITH from           │
│  │   shared ACCUSED_IN relationships                              │
│  ├─ Strength scoring: edge weights = f(shared_cases, recency,    │
│  │   severity)                                                    │
│  └─ Index refresh: full-text indexes on name, alias, FIR number  │
│                                                                    │
│  Phase 3: ALGORITHM EXECUTE (Scheduled + On-Demand)               │
│  ├─ Nightly: Community detection (Louvain) on full network        │
│  ├─ Nightly: PageRank, Betweenness on full network                │
│  ├─ Nightly: Link prediction model training                      │
│  ├─ On-demand: Shortest path (user query triggered)               │
│  ├─ On-demand: Node similarity (user query triggered)             │
│  └─ Weekly: Temporal evolution snapshots                          │
│                                                                    │
│  Phase 4: INSIGHT GENERATE (On-Demand via Graph Agent)            │
│  ├─ Graph Agent receives analyzed results                         │
│  ├─ LLM interprets community structure → "Gang identified"       │
│  ├─ LLM interprets centrality → "Key criminal: X (PageRank: Y)" │
│  ├─ Visualization data prepared for D3.js force-directed graph    │
│  └─ Findings integrated into Report Agent output                  │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### Entity Resolution Pipeline

| Stage | Method | Confidence | Action |
|---|---|---|---|
| **Exact Aadhaar match** | Hash comparison | 99% | Auto-merge nodes |
| **Name + DOB + Father's name** | Exact match on all three | 95% | Auto-merge with log |
| **Name + DOB + District** | Exact name + DOB, same district | 85% | Auto-merge with flag for review |
| **Fuzzy name + address** | Levenshtein distance ≤ 2, address cosine similarity > 0.8 | 60% | Create `SAME_AS` relationship, pending manual review |
| **ML-based** | Trained entity resolution model (features: name similarity, age proximity, geographic overlap, crime type overlap) | Variable | Produce ranked candidates for manual review |

---

## 13.5 Integration with AI Agents

### Agent-Graph Interaction Matrix

| Agent | Graph Interaction | Typical Queries | Frequency |
|---|---|---|---|
| **Graph Agent** | Primary consumer | Community detection, centrality, shortest path, similarity, link prediction | Every graph-related query |
| **SQL Agent** | Entity resolution | Maps person names/IDs from Data Store to Neo4j node IDs | When SQL results need network context |
| **Risk Agent** | Network risk factor | Queries network centrality scores, gang membership, associate risk levels | Every risk assessment |
| **Search Agent** | Graph-enhanced search | Enriches search results with network context (e.g., "this accused is connected to known gang X") | When search results include person entities |
| **Anomaly Agent** | Network anomaly detection | Detects sudden changes in network structure (new connections, community mergers) | Nightly batch + on-demand |
| **Recommendation Agent** | Network-based recommendations | Uses network position to prioritize investigation targets | Every recommendation generation |
| **Verification Agent** | Cross-validation | Verifies claimed relationships exist in graph | During verification phase |

### Graph Agent Invocation Protocol

```
1. Agent receives task from Supervisor/Planner
2. Entity Resolution: Resolve names/IDs to Neo4j node IDs
   └─ If ambiguous: Return top 3 candidates, ask Supervisor to
      seek user clarification
3. Query Construction: LLM generates Cypher query
4. Pre-execution Validation:
   ├─ Syntax check
   ├─ Depth limit check (max 6 hops)
   ├─ Estimated result size check
   └─ Authorization check (officer can access this data?)
5. Execute against Neo4j Aura
6. Post-process results:
   ├─ Trim to relevant subgraph
   ├─ Compute visualization layout
   └─ Generate D3.js-compatible JSON
7. Return structured results to Supervisor
```

---

## 13.6 Neo4j Scaling Strategy

### Current Architecture (Phase 1: Karnataka)

```
┌──────────────────────────────────────────────────────────────┐
│                NEO4J AURA PROFESSIONAL                        │
│                                                               │
│  ┌─────────────────────────────────────┐                     │
│  │ Primary Instance (GCP Mumbai)       │                     │
│  │ ├─ 32 GB RAM                        │                     │
│  │ ├─ 8 vCPUs                          │                     │
│  │ ├─ 256 GB SSD                       │                     │
│  │ ├─ ~50M nodes, ~200M relationships  │                     │
│  │ └─ GDS Plugin enabled               │                     │
│  └──────────────┬──────────────────────┘                     │
│                 │                                             │
│        Automatic replication                                  │
│                 │                                             │
│  ┌──────────────▼──────────────────────┐                     │
│  │ Read Replica (GCP Mumbai)           │                     │
│  │ ├─ Serves read queries from agents  │                     │
│  │ ├─ Offloads GDS algorithms          │                     │
│  │ └─ Auto-failover if primary fails   │                     │
│  └─────────────────────────────────────┘                     │
│                                                               │
│  Estimated Cost: ~$3,000/month                               │
└──────────────────────────────────────────────────────────────┘
```

### Scaling to All-India (Phase 2)

```
┌──────────────────────────────────────────────────────────────┐
│              NEO4J AURA ENTERPRISE (Causal Cluster)           │
│                                                               │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐    │
│  │ Core 1 (Write) │ │ Core 2 (Write) │ │ Core 3 (Write) │    │
│  │ GCP Mumbai     │ │ GCP Delhi      │ │ GCP Hyderabad  │    │
│  │ 64 GB RAM      │ │ 64 GB RAM      │ │ 64 GB RAM      │    │
│  └───────┬────────┘ └───────┬────────┘ └───────┬────────┘    │
│          │    Raft Consensus │                   │             │
│          └──────────┬───────┘                   │             │
│                     │                           │             │
│  ┌────────────────┐ │ ┌────────────────┐ ┌─────▼──────────┐  │
│  │ Read Replica 1 │ │ │ Read Replica 2 │ │ Read Replica 3 │  │
│  │ North Region   │ │ │ South Region   │ │ West Region    │  │
│  │ (Delhi)        │ │ │ (Mumbai)       │ │ (Hyderabad)    │  │
│  └────────────────┘ │ └────────────────┘ └────────────────┘  │
│                     │                                         │
│  ┌──────────────────▼──────────────────┐                     │
│  │ GDS Dedicated Instance              │                     │
│  │ 128 GB RAM (for large-scale         │                     │
│  │ algorithm execution on full          │                     │
│  │ national graph: ~500M nodes,        │                     │
│  │ ~2B relationships)                   │                     │
│  └─────────────────────────────────────┘                     │
│                                                               │
│  Estimated Cost: ~$15,000-20,000/month                       │
└──────────────────────────────────────────────────────────────┘
```

### Scaling Strategies

| Challenge | Solution |
|---|---|
| **Graph size > single machine memory** | Neo4j Fabric (sharding by state/region) — queries across shards via federated Cypher |
| **GDS algorithm on large graphs** | Dedicated GDS instance with 128GB+ RAM; graph projections to filter relevant subgraphs before algorithm execution |
| **Write throughput** | Batch ingest via neo4j-admin import tool (1M nodes/second); real-time writes via Bolt driver with connection pooling |
| **Read latency** | Read replicas per region; query routing based on officer's geographic region |
| **Cross-region consistency** | Causal consistency with bookmarks — reads after writes are guaranteed consistent |
| **Schema evolution** | Neo4j is schema-flexible; new node labels and relationship types added without migration |
| **Backup & disaster recovery** | Aura automatic daily backups; cross-region replication provides inherent DR |

### Performance Optimization

| Optimization | Implementation | Impact |
|---|---|---|
| **Composite indexes** | `CREATE INDEX FOR (p:Person) ON (p.name, p.district_id)` | 10x faster entity lookup |
| **Full-text indexes** | `CREATE FULLTEXT INDEX FOR (p:Person) ON EACH [p.name, p.aliases]` | Sub-second fuzzy name search |
| **Relationship indexes** | `CREATE INDEX FOR ()-[r:ACCUSED_IN]-() ON (r.arrest_date)` | Temporal queries 5x faster |
| **Graph projections** | Filter to relevant subgraph before running GDS algorithms | 100x faster algorithms on focused networks |
| **Query caching** | Neo4j internal query cache + application-level caching in Catalyst Cache | 50% reduction in query load |
| **Eager loading prevention** | Avoid `MATCH (n) SET n.prop` patterns; use batched updates with `CALL {} IN TRANSACTIONS` | Prevents OOM on large updates |
| **Profile-guided optimization** | Regular `PROFILE` analysis on top queries; query plan tuning | Continuous improvement |

---

# 20. AI Analytics (Detailed)

## 20.1 Crime Prediction Models (10 Models)

---

### Model 1: Spatiotemporal Hotspot Prediction

| Attribute | Specification |
|---|---|
| **Objective** | Predict which geographic grid cells will experience elevated crime counts in the next 7/14/30 days |
| **Algorithm** | LSTM with Temporal Attention + Spatial Convolution (ConvLSTM hybrid) |
| **Why This Algorithm** | Crime has both temporal patterns (day-of-week, seasonal, holiday effects) and spatial diffusion effects (hotspots spread to adjacent areas). ConvLSTM captures both simultaneously. Pure statistical methods (KDE) only capture current state, not temporal evolution |

**Input Features (from ER Schema):**

| Feature | Source Table | Description |
|---|---|---|
| crime_count_grid | CaseMaster (GPS coords) | Crime count per 500m×500m grid cell per day |
| crime_type_vector | CaseMaster → CrimeHead | One-hot encoded crime type distribution per cell |
| gravity_score | CaseMaster → GravityOffence | Ratio of heinous to non-heinous crimes per cell |
| day_of_week | CaseMaster.OffenceDatetime | Cyclical encoding (sin/cos) |
| month | CaseMaster.OffenceDatetime | Cyclical encoding (sin/cos) |
| hour_distribution | CaseMaster.OffenceDatetime | 24-dim vector of hourly crime distribution |
| is_holiday | External calendar | Binary flag for Karnataka state holidays |
| is_festival | External calendar | Binary flag for major festivals (Dasara, etc.) |
| unit_type | Unit.UnitType | Police station type (city/rural/traffic) |
| arrest_rate_history | ArrestSurrender | Historical arrest rate per cell (deterrence proxy) |
| population_density | External (Census) | Population density per grid cell |
| land_use_type | External (GIS) | Residential/commercial/industrial/mixed per cell |
| distance_to_station | Unit (GPS) | Distance from cell center to nearest police station |
| prior_30d_crime | CaseMaster | Lagged crime count (30-day window) |
| prior_90d_crime | CaseMaster | Lagged crime count (90-day window) |
| spatial_lag | CaseMaster | Average crime count of 8 adjacent grid cells |

**Training Strategy:**
- **Training data**: 5 years of historical crime data (2021-2025), aggregated to daily grid cells
- **Train/Val/Test split**: 2021-2023 train, 2024 validation, 2025 test (temporal split — never random split for time series)
- **Grid definition**: Karnataka divided into 500m × 500m cells (~370K urban cells, ~50K cells with sufficient data)
- **Sequence length**: 90-day lookback window
- **Batch size**: 256 grid cells per batch
- **Epochs**: 100 with early stopping (patience=10)
- **Learning rate**: 1e-3 with cosine annealing
- **Augmentation**: Temporal shift augmentation (±3 days), spatial jitter (±1 cell)

**Evaluation Metrics:**
| Metric | Target | Description |
|---|---|---|
| PAI (Predictive Accuracy Index) | > 5.0 | Crime captured / area coverage — the standard hotspot metric |
| Hit Rate @20% | > 60% | % of actual crimes captured by top 20% of predicted hotspots |
| AUC-ROC | > 0.85 | Area under ROC curve for binary hotspot classification |
| MAPE | < 30% | Mean Absolute Percentage Error on crime count predictions |
| Spatial Precision | > 70% | % of predicted hotspot cells that actually experienced crime |

**Deployment:**
- **Batch**: Nightly re-prediction for all grid cells (Vertex AI batch prediction job)
- **Real-time**: On-demand prediction for specific areas triggered by Geospatial Agent
- **Serving**: Pre-computed predictions cached in Catalyst Cache (TTL: 24 hours); on-demand predictions via Vertex AI endpoint

**Explainability Approach:**
- **SHAP values**: Per-cell feature importance showing which factors (time, location, history) drive prediction
- **Attention visualization**: Temporal attention weights show which historical days most influenced prediction
- **Counterfactual maps**: "What would happen if we increased patrol by 50% in this area?"

**Bias Mitigation:**
- **Feedback loop prevention**: Model trained on crime reports (not ground truth crime). Over-policed areas generate more reports → higher predictions → more policing. Mitigation: Include arrest rate as negative feature (more arrests → lower weight on historical reports)
- **Demographic blindness**: Grid cells do not include demographic features (caste, religion). Only crime-relevant spatial features used
- **Regular fairness audit**: Monthly comparison of prediction accuracy across demographic composition of grid cells

**Retraining Schedule:** Monthly retraining with expanding window. Model drift monitoring via prediction error tracking — if MAPE increases >5% vs. validation set, trigger immediate retraining.

**QuickML vs Custom Decision:** **Custom model on Vertex AI** — ConvLSTM is too specialized for AutoML. QuickML cannot handle spatial grid inputs or attention mechanisms.

---

### Model 2: Repeat Offender Risk Scoring

| Attribute | Specification |
|---|---|
| **Objective** | Predict probability that an accused person will re-offend within 1/3/12 months after release |
| **Algorithm** | XGBoost (gradient boosting) — primary; LightGBM for comparison |
| **Why This Algorithm** | Tabular data with mixed feature types (numerical, categorical, temporal). Gradient boosting consistently outperforms deep learning on structured tabular data. XGBoost provides built-in feature importance and handles missing values natively |

**Input Features (from ER Schema):**

| Feature | Source Table | Description |
|---|---|---|
| prior_case_count | CaseMaster → Accused | Total prior cases as accused |
| prior_conviction_count | CaseMaster (case_status = 'Convicted') | Prior convictions |
| prior_heinous_count | CaseMaster → GravityOffence | Prior heinous crime involvement |
| age_at_first_offence | Accused.DOB, CaseMaster.OffenceDatetime | Age when first case registered |
| time_since_last_offence | CaseMaster.OffenceDatetime | Days since most recent offence |
| avg_time_between_offences | CaseMaster.OffenceDatetime | Mean inter-offence interval |
| crime_type_diversity | CaseMaster → CrimeHead | Number of distinct crime types |
| dominant_crime_type | CaseMaster → CrimeHead | Most frequent crime type (encoded) |
| bail_violation_count | ArrestSurrender | Number of bail condition violations |
| network_risk_score | Neo4j (PageRank, co-accused count) | Network influence and associate risk |
| gang_membership | Neo4j (community detection) | Binary flag + gang threat level |
| education_proxy | OccupationMaster | Occupation category (proxy for socioeconomic) |
| arrest_count | ArrestSurrender | Total arrest events |
| surrender_count | ArrestSurrender | Total surrender events |
| current_bail_status | ArrestSurrender | Currently on bail (binary) |
| jurisdiction_change | CaseMaster → Unit | Number of different jurisdictions with offences |
| modus_operandi_consistency | Derived (NLP on BriefFacts) | Consistency of MO across cases (0-1) |

**Training Strategy:**
- **Training data**: All accused with 2+ cases (potential repeat offenders) from 2015-2024 with known outcomes
- **Label**: Binary — re-offended within {1, 3, 12} months (three separate models)
- **Class imbalance**: ~80/20 negative/positive split. Handle with: SMOTE oversampling on minority class + class_weight parameter
- **Cross-validation**: 5-fold stratified temporal CV (respect temporal ordering)
- **Hyperparameter tuning**: Optuna Bayesian optimization, 200 trials
- **Feature selection**: SHAP-based recursive feature elimination — retain top 15 features

**Evaluation Metrics:**
| Metric | Target | Description |
|---|---|---|
| AUC-ROC | > 0.80 | Overall discrimination ability |
| AUC-PR | > 0.60 | Critical for imbalanced data — precision-recall trade-off |
| Calibration (Brier Score) | < 0.15 | Predicted probabilities match actual rates |
| False Positive Rate @80% Recall | < 30% | Limit false positives while catching most re-offenders |
| Temporal stability | AUC variance < 0.05 across folds | Model shouldn't be brittle to time period |

**Deployment:**
- **Batch**: Nightly scoring of all released/bailed accused (Databricks batch job → Catalyst Data Store)
- **Real-time**: On-demand scoring via Vertex AI endpoint (Risk Assessment Agent)

**Explainability Approach:**
- **SHAP summary plots**: Global feature importance across all predictions
- **Individual SHAP waterfall**: Per-person explanation showing which factors increased/decreased risk
- **Partial dependence plots**: How each feature affects risk score in isolation
- **Natural language explanation**: Explainability Agent generates plain-language summary

**Bias Mitigation:**
- **Protected attributes excluded**: Caste, religion, gender NOT used as features
- **Proxy detection**: Regular analysis to detect if non-protected features are proxying for protected attributes (e.g., occupation as proxy for caste)
- **Equalized odds audit**: Monthly check that false positive rates are equal across demographic groups
- **Calibration fairness**: Predicted risk scores should be equally calibrated across demographics

**Retraining Schedule:** Quarterly retraining with expanding window. Concept drift monitoring via PSI (Population Stability Index) on input features — if PSI > 0.2 for any feature, trigger immediate retraining.

**QuickML vs Custom Decision:** **Catalyst QuickML for initial baseline** (AutoML can handle tabular classification) → **Custom XGBoost on Vertex AI for production** (need SHAP explainability, fine-grained hyperparameter control, fairness auditing, and integration with Neo4j features).

---

### Model 3: Gang/Network Detection

| Attribute | Specification |
|---|---|
| **Objective** | Automatically detect criminal gangs/networks from co-accused relationships, classify their threat level, and predict network evolution |
| **Algorithm** | Graph Neural Network (GNN) — specifically GraphSAGE for inductive learning on dynamic graphs |
| **Why This Algorithm** | Community detection algorithms (Louvain) identify clusters but don't classify them or predict evolution. GNNs learn node representations that capture both structural position and node attributes, enabling: (1) gang vs. non-gang classification, (2) threat level prediction, (3) leader identification |

**Input Features (from ER Schema + Neo4j):**

| Feature | Source | Description |
|---|---|---|
| Node features (per Person) | Accused, CaseMaster | crime_count, crime_type_distribution, age, jurisdiction_spread, arrest_count, recidivism_risk |
| Edge features (per CO_ACCUSED_WITH) | Derived from Accused + CaseMaster | case_count, date_range, crime_type_overlap, geographic_overlap |
| Structural features | Neo4j GDS | degree, clustering_coefficient, local_community_id (from Louvain) |
| Temporal features | CaseMaster.OffenceDatetime | network_age, growth_rate, recent_activity_score |

**Training Strategy:**
- **Training data**: Manually labeled gangs from Karnataka Police intelligence records (500+ confirmed gangs with member lists)
- **Graph construction**: Subgraphs centered on known gang members (2-hop neighborhood)
- **Label**: Binary (gang member / not gang member) + multi-class threat level (Low/Medium/High/Critical)
- **Architecture**: 3-layer GraphSAGE with mean aggregation, 128-dim embeddings
- **Semi-supervised**: Labeled nodes for known gang members; unlabeled nodes benefit from message passing
- **Training**: 200 epochs, Adam optimizer, learning rate 1e-3

**Evaluation Metrics:**
| Metric | Target | Description |
|---|---|---|
| Precision @90% Recall | > 0.70 | Among predicted gang members, 70%+ are actual gang members |
| NMI (Normalized Mutual Information) | > 0.75 | Agreement between GNN-detected communities and ground truth gangs |
| Threat Level Accuracy | > 0.80 | Multi-class threat classification accuracy |
| Temporal prediction AUC | > 0.75 | Predicting which non-members will join within 6 months |

**Deployment:**
- **Batch**: Weekly GNN inference on full criminal network (Vertex AI batch prediction on GPU)
- **Real-time**: Not applicable — network detection is an analytical, not interactive, task

**Explainability Approach:**
- **GNNExplainer**: Identifies which edges (relationships) and node features most influenced the gang classification
- **Subgraph highlight**: Visualize the most influential subgraph for each classification decision
- **Natural language**: "Person X is classified as a gang member because they share 5 co-accused relationships with known members of Gang Y, have a similar crime type profile, and operate in the same geographic area"

**Bias Mitigation:**
- **No demographic features**: GNN uses only criminal activity and network features
- **Community-level fairness**: Ensure gang detection rate is not systematically biased toward communities from specific geographic areas
- **Regular human review**: All GNN-detected gangs reviewed by intelligence officers before tagging

**Retraining Schedule:** Monthly retraining as new cases update the graph. Graph snapshots archived for temporal analysis.

**QuickML vs Custom Decision:** **Custom model on Vertex AI** (GPU required) — QuickML cannot handle graph-structured data or GNN architectures.

---

### Model 4: Modus Operandi Clustering

| Attribute | Specification |
|---|---|
| **Objective** | Cluster FIR BriefFacts text into modus operandi (MO) groups, enabling cross-case linking by method of operation |
| **Algorithm** | Sentence-BERT embeddings → HDBSCAN clustering + supervised crime head classification (fine-tuned BERT) |
| **Why This Algorithm** | FIR BriefFacts contain rich unstructured descriptions of how crimes were committed. Sentence-BERT captures semantic meaning (not just keywords), and HDBSCAN discovers natural MO clusters without requiring pre-specified cluster count |

**Input Features (from ER Schema):**

| Feature | Source Table | Description |
|---|---|---|
| brief_facts_text | CaseMaster.BriefFacts | Free-text description of crime |
| crime_head | CaseMaster → CrimeHead | Existing crime classification |
| crime_sub_head | CaseMaster → CrimeSubHead | Existing sub-classification |
| act_sections | CaseMaster → ActSectionAssociation | Legal sections charged under |
| weapon_used | Derived from BriefFacts (NLP) | Weapon type if any |
| time_of_crime | CaseMaster.OffenceDatetime | Hour of day (categorical) |
| location_type | Derived from BriefFacts (NLP) | Indoor/outdoor/vehicle/public space |
| victim_count | Count of VICTIM_IN for case | Number of victims |
| property_value | Derived from BriefFacts (NLP) | Estimated stolen property value if applicable |

**Training Strategy:**
- **Embedding model**: Fine-tune Sentence-BERT (all-MiniLM-L6-v2) on 100K Karnataka FIR BriefFacts pairs (similar MO pairs as positive, different MO as negative)
- **Clustering**: HDBSCAN with min_cluster_size=10, min_samples=5, metric='euclidean' on SBERT embeddings
- **Classification**: Fine-tune BERT-base-multilingual-cased on BriefFacts → CrimeHead classification (supports Kannada and English text)
- **Training data**: 10M FIR records, split 80/10/10

**Evaluation Metrics:**
| Metric | Target | Description |
|---|---|---|
| Silhouette Score (clustering) | > 0.45 | Cluster separation quality |
| Adjusted Rand Index | > 0.60 | Agreement with expert MO classifications |
| Crime Head Classification F1 | > 0.85 | Macro F1 across all crime head classes |
| Cross-case linking precision | > 0.75 | When the model links two cases as "same MO", they truly share MO |

**Deployment:**
- **Batch**: Nightly embedding and re-clustering of new FIRs (Databricks Spark job)
- **Real-time**: On-demand MO similarity search (embed new FIR → query Pinecone for similar MOs)

**Explainability Approach:**
- **Key phrase extraction**: Highlight phrases in BriefFacts that drove clustering (LIME on text)
- **Cluster prototypes**: Show the 3 most representative FIRs for each MO cluster
- **Differentiating features**: "This MO cluster is characterized by: nighttime entry, lock-breaking, targeting electronics"

**Bias Mitigation:**
- **Language fairness**: Model fine-tuned on both Kannada and English FIRs to avoid English-language bias
- **No demographic features**: Clustering based purely on crime description, not perpetrator characteristics

**Retraining Schedule:** Monthly retraining of embeddings; quarterly re-clustering of full corpus.

**QuickML vs Custom Decision:** **Custom model on Vertex AI** — NLP-based clustering with fine-tuned transformers is beyond QuickML's capabilities.

---

### Model 5: Case Similarity Engine

| Attribute | Specification |
|---|---|
| **Objective** | Given a case (FIR), find the most similar historical cases across multiple dimensions — textual similarity, legal similarity, geographic proximity, accused profile similarity, and temporal patterns |
| **Algorithm** | Multi-modal ensemble: TF-IDF + Sentence Embeddings (text) + Jaccard (legal sections) + Haversine (geographic) + Graph Node Similarity (accused profiles) |
| **Why This Algorithm** | Case similarity is multi-dimensional. A purely text-based approach misses geographic and network similarities. The ensemble weights different similarity dimensions based on use case (investigation linking vs. sentencing precedent vs. MO matching) |

**Input Features (from ER Schema):**

| Feature | Source Table | Similarity Method |
|---|---|---|
| BriefFacts text | CaseMaster.BriefFacts | Cosine similarity on sentence embeddings (Pinecone) |
| Crime head + sub-head | CaseMaster → CrimeHead, CrimeSubHead | Exact match + hierarchical distance |
| Act sections | CrimeHeadActSection → ActSectionAssociation | Jaccard similarity on section sets |
| GPS coordinates | CaseMaster (lat, lng) | Haversine distance (inverse for similarity) |
| Time of crime | CaseMaster.OffenceDatetime | Temporal distance (hour-of-day, day-of-week similarity) |
| Accused profile | Accused → demographics, Neo4j network | Graph node similarity (Jaccard on criminal profile) |
| MO cluster | Model 4 output | Same MO cluster = high similarity |
| Property value | Derived from BriefFacts | Numerical proximity |
| Victim profile | Victim → demographics | Demographic profile similarity |

**Training Strategy:**
- **Similarity learning**: Train a Siamese network on expert-labeled case pairs (similar/not similar) — 50K labeled pairs
- **Weight optimization**: Learn optimal weights for combining different similarity dimensions via Bayesian optimization on expert rankings
- **Default weights**: text=0.30, legal=0.20, geographic=0.15, temporal=0.10, accused=0.10, MO=0.10, victim=0.05

**Evaluation Metrics:**
| Metric | Target | Description |
|---|---|---|
| nDCG@10 | > 0.80 | Normalized Discounted Cumulative Gain on ranked similar cases |
| MAP@20 | > 0.70 | Mean Average Precision — relevant cases ranked high |
| Expert agreement (Kendall's τ) | > 0.65 | Rank correlation with expert-provided similarity rankings |

**Deployment:**
- **Real-time**: On-demand via Search Agent + Pinecone (embedding similarity) + enrichment from other models
- **Batch**: Nightly pre-computation of nearest-neighbor lists for all active cases

**Explainability**: "These cases are similar because: (1) Both involve nighttime house break-in [text: 0.89], (2) Both charged under IPC 457, 380 [legal: 0.95], (3) Occurred within 2km [geographic: 0.82], (4) Accused have similar criminal profile [profile: 0.73]"

**Bias Mitigation**: Similarity based on crime characteristics, not perpetrator demographics.

**Retraining Schedule:** Quarterly weight re-optimization as crime patterns evolve.

**QuickML vs Custom Decision:** **Custom on Vertex AI** — multi-modal ensemble requires custom architecture.

---

### Model 6: Anomaly Detection

| Attribute | Specification |
|---|---|
| **Objective** | Detect statistically significant anomalies in crime patterns — temporal spikes, spatial clustering shifts, unusual MO appearances, and cross-metric anomalies |
| **Algorithm** | Isolation Forest (primary) + Seasonal-Hybrid ESD (S-H-ESD) for time series + DBSCAN for spatial anomalies |
| **Why This Algorithm** | Isolation Forest handles high-dimensional anomaly detection without requiring normal distribution assumptions — ideal for crime data which is sparse and skewed. S-H-ESD handles seasonal decomposition before anomaly detection, preventing false positives from expected seasonal variation |

**Input Features (from ER Schema):**

| Feature | Source Table | Description |
|---|---|---|
| daily_crime_count | CaseMaster | Crime count per district/unit per day |
| crime_type_distribution | CaseMaster → CrimeHead | Daily distribution across crime types |
| heinous_ratio | CaseMaster → GravityOffence | Daily ratio of heinous to total |
| arrest_rate | ArrestSurrender | Daily arrests / daily FIRs |
| spatial_distribution | CaseMaster (GPS) | Grid-cell crime density per day |
| inter_crime_interval | CaseMaster.OffenceDatetime | Time between consecutive crimes in same area |
| new_accused_ratio | Accused | Ratio of first-time accused to total daily accused |
| weapon_usage_rate | Derived from BriefFacts | Daily rate of weapon-involved crimes |
| weekend_weekday_ratio | CaseMaster.OffenceDatetime | Crime count ratio (weekend/weekday rolling) |
| reporting_delay | CaseMaster.FIRDate - OffenceDatetime | Average delay between crime and FIR |

**Training Strategy:**
- **Unsupervised**: Isolation Forest trained on 3 years of "normal" crime data (2022-2024), validated against known anomalous events
- **Seasonal decomposition**: STL decomposition (seasonal + trend + residual) on time series before feeding to anomaly detector
- **Contamination parameter**: 5% (expected anomaly rate)
- **Validation**: Back-test against known events — COVID lockdown, major festivals, election periods

**Evaluation Metrics:**
| Metric | Target | Description |
|---|---|---|
| Precision @known_events | > 0.80 | Correctly detects known anomalous events |
| False Positive Rate | < 5% daily | Max 1-2 false alerts per day per district |
| Detection Latency | < 24 hours | Anomaly detected within 1 day of occurrence |
| F1 Score (labeled test set) | > 0.75 | Balanced precision-recall on expert-labeled anomalies |

**Deployment:**
- **Batch**: Hourly anomaly scan across all districts (Catalyst Cron → Vertex AI)
- **Real-time**: On-demand anomaly check for specific areas (Anomaly Agent → Vertex AI endpoint)
- **Alerting**: Anomalies with severity ≥ WARNING pushed via Catalyst Signals → officer dashboards

**Explainability**: "ALERT: Crime spike detected in Bengaluru East district. Today's crime count (47) is 3.2 standard deviations above the expected baseline (28 ± 6). Contributing factors: 15 chain snatching cases (vs. normal 3), concentrated in 2km radius around MG Road."

**Bias Mitigation**: Anomaly detection based on statistical deviation, not demographic composition.

**Retraining Schedule:** Monthly re-fit of Isolation Forest; daily update of seasonal decomposition parameters.

**QuickML vs Custom Decision:** **Catalyst QuickML for basic anomaly detection** (simple feature table) + **Custom Isolation Forest on Vertex AI for production** (need seasonal decomposition, spatial DBSCAN, and custom alerting logic).

---

### Model 7: Resource Allocation Optimizer

| Attribute | Specification |
|---|---|
| **Objective** | Optimize patrol deployment, vehicle allocation, and officer assignment across police stations to minimize response time and maximize crime deterrence |
| **Algorithm** | Mixed Integer Linear Programming (MILP) with constraint optimization (OR-Tools/PuLP) + reinforcement learning (PPO) for dynamic re-allocation |
| **Why This Algorithm** | Resource allocation is a constrained optimization problem — maximize coverage subject to budget, personnel, vehicle, and jurisdictional constraints. MILP provides provably optimal static solutions; RL handles dynamic re-allocation as situations evolve |

**Input Features (from ER Schema):**

| Feature | Source | Description |
|---|---|---|
| unit_personnel_count | Employee → Unit | Officers available per station per shift |
| unit_vehicle_count | External (asset management) | Vehicles available per station |
| crime_prediction_grid | Model 1 output | Predicted crime density per grid cell |
| risk_map | Model 1 + Model 6 output | Combined risk scores per area |
| response_time_matrix | External (GIS routing) | Travel time matrix between units and grid cells |
| shift_schedule | External (HR) | Officer shift patterns and availability |
| historical_clearance | CaseMaster (case_status) | Historical case clearance rate per unit |
| population_density | External (Census) | Population served per unit |
| area_sq_km | Unit jurisdiction polygons | Jurisdiction area size |
| special_events | External calendar | Upcoming events requiring extra coverage |

**Training Strategy:**
- **MILP**: No training — formulated as optimization problem with objective and constraints
- **RL (PPO)**: Train in simulation environment using 5 years of historical crime data as environment dynamics
- **Objective function**: Minimize weighted sum of: (1) expected response time, (2) uncovered high-risk area, (3) officer fatigue score
- **Constraints**: Max hours per officer per week, minimum officers per station, vehicle-officer pairing rules, jurisdictional boundaries

**Evaluation Metrics:**
| Metric | Target | Description |
|---|---|---|
| Avg. response time reduction | > 15% | Compared to current static allocation |
| High-risk area coverage | > 90% | % of predicted hotspots with patrol within 5km |
| Constraint satisfaction | 100% | All labor, safety, jurisdictional constraints met |
| Officer utilization variance | < 0.2 | Equitable workload distribution |

**Deployment:**
- **Batch**: Daily optimal allocation plan generated at 5 AM (before morning shift)
- **Real-time**: Dynamic re-allocation recommendations during shift based on emerging situations

**Explainability**: "Recommended: Deploy 3 additional patrol vehicles to Bengaluru East sector during 8PM-2AM shift. Reason: Model 1 predicts 2.3x elevated crime risk in this area tonight due to: weekend + festival period + recent crime spike in adjacent sector."

**Bias Mitigation**: Allocation based on crime risk and population, not neighborhood demographics. Regular equity audit ensuring all areas receive proportional coverage.

**Retraining Schedule:** MILP parameters updated daily; RL policy retrained monthly.

**QuickML vs Custom Decision:** **Custom on Vertex AI + OR-Tools** — optimization is not a standard ML task; requires custom formulation.

---

### Model 8: Crime Type Forecasting

| Attribute | Specification |
|---|---|
| **Objective** | Forecast crime counts per district per crime type for the next 30/90/180 days. Separate forecasts for each of the ~50 crime head categories across 31 districts |
| **Algorithm** | NeuralProphet (primary) + Prophet (baseline) + Ensemble |
| **Why This Algorithm** | Prophet handles seasonality, trends, and holiday effects with minimal tuning — excellent for the ~1,550 time series (31 districts × 50 crime types). NeuralProphet adds auto-regression and lagged regressors for improved accuracy on series with strong temporal dependencies |

**Input Features (from ER Schema):**

| Feature | Source Table | Description |
|---|---|---|
| daily_crime_count | CaseMaster → CrimeHead → District | Target variable — daily count per crime type per district |
| holiday_indicator | External calendar | Karnataka state holidays, national holidays |
| festival_indicator | External calendar | Major festivals with known crime pattern impact |
| election_indicator | External calendar | Election periods (known to affect certain crime types) |
| avg_temperature | External (weather API) | Daily average temperature (lagged regressor) |
| rainfall_mm | External (weather API) | Daily rainfall (lagged regressor) |
| economic_indicator | External (RBI data) | Monthly economic indicators (unemployment, inflation) |
| school_calendar | External | School term / vacation periods |

**Training Strategy:**
- **Per-series training**: Each (district, crime_type) pair gets its own Prophet/NeuralProphet model
- **Cross-validation**: Time series cross-validation with 30-day horizon, 90-day folds, 5 folds
- **Hyperparameter tuning**: Optuna per-series for NeuralProphet; default Prophet for baseline
- **Ensemble**: Simple average of Prophet and NeuralProphet predictions (robust to individual model failure)

**Evaluation Metrics:**
| Metric | Target | Description |
|---|---|---|
| MAPE (30-day) | < 20% | Mean Absolute Percentage Error at 30-day horizon |
| MAPE (90-day) | < 30% | Acceptable degradation at longer horizons |
| RMSE | < 5 crimes/day | Root Mean Square Error (for small-count districts) |
| Coverage (95% PI) | 90-97% | Prediction interval should contain actual value 90-97% of the time |

**Deployment:**
- **Batch**: Weekly re-forecast for all 1,550 series (Databricks scheduled job → Catalyst Data Store)
- **Real-time**: On-demand forecast via Forecast Agent → Vertex AI endpoint

**Explainability**: Decomposed into trend + seasonal + holiday + regressor components. "Theft cases in Mysuru are forecasted to increase 20% next month primarily due to: seasonal uptick (Dasara festival period) + weekend concentration effect."

**Bias Mitigation**: Forecasts based on historical patterns, not demographic projections.

**Retraining Schedule:** Weekly retraining for high-volume series; monthly for low-volume series.

**QuickML vs Custom Decision:** **Catalyst QuickML for initial baseline** (time series forecasting is a supported QuickML task) → **Custom NeuralProphet on Vertex AI for production** (need lagged regressors, ensemble, and per-series tuning).

---

### Model 9: Bail Risk Assessment

| Attribute | Specification |
|---|---|
| **Objective** | Predict the risk level associated with granting bail to an accused — likelihood of absconding, re-offending, or tampering with evidence/witnesses |
| **Algorithm** | CatBoost (gradient boosting optimized for categorical features) |
| **Why This Algorithm** | Bail decisions involve many categorical features (crime type, section, court, jurisdiction). CatBoost natively handles categoricals without one-hot encoding, and provides ordered boosting to prevent target leakage |

**Input Features (from ER Schema):**

| Feature | Source Table | Description |
|---|---|---|
| crime_head | CaseMaster → CrimeHead | Type of crime (categorical) |
| gravity | CaseMaster → GravityOffence | Heinous/Non-Heinous |
| sections_charged | CrimeHeadActSection → Section | Sections charged under (set) |
| max_punishment_years | Section | Maximum punishment for most severe section |
| bailable | Section.Bailable | Whether offence is bailable |
| prior_case_count | Accused history | Total prior cases |
| prior_bail_violations | ArrestSurrender | Prior bail condition violations |
| prior_absconding | ArrestSurrender | Prior absconding incidents |
| case_strength | ChargesheetDetails | Chargesheet filed? Evidence strength? |
| accused_age | Accused.DOB | Age at time of bail hearing |
| accused_gender | Accused.Gender | Gender |
| accused_local_ties | Accused address vs. case jurisdiction | Local address? Family in area? |
| co_accused_count | Count of co-accused in same case | Number of co-accused |
| co_accused_bail_status | Other accused in same case | How many co-accused already on bail |
| victim_objection | Derived | Whether victim/complainant objects to bail |
| investigation_status | CaseMaster.CaseStatus | Investigation stage |
| days_in_custody | ArrestSurrender | Days already spent in custody |
| recidivism_score | Model 2 output | Predicted recidivism risk |

**Training Strategy:**
- **Training data**: Historical bail decisions with outcomes (absconded/re-offended/complied) — 500K+ records
- **Label**: Multi-output: P(abscond), P(re-offend), P(tamper), overall_risk_level
- **Class imbalance**: ~90% comply, ~7% re-offend, ~3% abscond. Focal loss + class weighting
- **Temporal split**: Train on 2018-2023, validate on 2024, test on 2025

**Evaluation Metrics:**
| Metric | Target | Description |
|---|---|---|
| AUC-ROC (absconding) | > 0.82 | Discriminating absconders from non-absconders |
| AUC-ROC (re-offending) | > 0.78 | Discriminating re-offenders |
| Calibration (overall) | Brier < 0.10 | Risk scores are well-calibrated |
| False Negative Rate | < 10% | Miss fewer than 10% of high-risk individuals |

**Deployment:**
- **Real-time**: On-demand via Risk Assessment Agent → Vertex AI endpoint (triggered when bail hearing scheduled)
- **Batch**: Not applicable — bail assessments are case-specific

**Explainability**: "BAIL RISK: HIGH. Key factors: (1) Charged under IPC 302 (murder, non-bailable) — max punishment 14 years, (2) Prior absconding incident in 2023, (3) No local address in jurisdiction, (4) Recidivism risk score: 0.73"

**Bias Mitigation:**
- **Critical concern**: Bail decisions must not discriminate based on caste, religion, or economic status
- **Fairness constraints**: Equalized odds across caste and religion groups (post-processing calibration)
- **Regular audit**: Monthly fairness audit by independent committee
- **Mandatory human decision**: Model output is ADVISORY — bail decision is always made by magistrate/judge
- **Transparency**: Full explainability report attached to bail recommendation

**Retraining Schedule:** Quarterly with outcome feedback loop (actual bail outcomes feed back into training).

**QuickML vs Custom Decision:** **Custom CatBoost on Vertex AI** — fairness constraints and multi-output classification require custom implementation. Additionally, this is an extremely sensitive model requiring explicit bias controls that QuickML cannot provide.

---

### Model 10: Investigation Priority Scoring

| Attribute | Specification |
|---|---|
| **Objective** | Rank active investigations by priority to help officers and supervisors allocate attention to the most impactful cases |
| **Algorithm** | Learning-to-Rank (LambdaMART) — XGBoost with ranking objective |
| **Why This Algorithm** | Investigation priority is inherently a ranking problem — we need a relative ordering, not absolute scores. LambdaMART (listwise learning-to-rank) directly optimizes for ranking quality metrics |

**Input Features (from ER Schema):**

| Feature | Source Table | Description |
|---|---|---|
| crime_gravity | CaseMaster → GravityOffence | Heinous/Non-Heinous |
| max_punishment | Section (max across charged sections) | Maximum punishment in years |
| victim_count | Count of Victim per case | Number of victims |
| accused_count | Count of Accused per case | Number of accused |
| accused_at_large | Accused without ArrestSurrender | Unapprehended accused count |
| case_age_days | Current date - CaseMaster.FIRDate | Days since FIR registration |
| evidence_strength | Derived (chargesheet status, evidence count) | Strength of evidence collected |
| public_attention | Derived (media mentions, VIP complainant) | Public/media interest level |
| victim_vulnerability | Victim demographics (age, gender, category) | Minor victim, senior citizen, etc. |
| case_complexity | Accused count × Section count × jurisdiction count | Complexity score |
| similar_active_cases | Model 5 output | Number of potentially linked active cases |
| gang_connection | Neo4j (MEMBER_OF relationship) | Connected to known criminal network |
| cross_jurisdiction | CaseMaster → Unit → District | Multi-jurisdiction involvement |
| deadline_proximity | Legal deadlines (chargesheet, remand) | Days until next legal deadline |
| officer_workload | Employee → active case count | IO's current case load |
| recidivism_risk_max | Model 2 output (max across accused) | Highest recidivism risk among accused |

**Training Strategy:**
- **Training data**: Expert-ranked case priority lists from 50 SHOs and 20 SPs (5K ranked lists of 20-50 cases each)
- **Ranking objective**: LambdaMART with nDCG as target metric
- **Pairwise labels**: For each ranked list, generate pairwise preferences (case A > case B)
- **Cross-validation**: 5-fold stratified by unit type (city/rural)
- **Feature engineering**: All features normalized to 0-1 range

**Evaluation Metrics:**
| Metric | Target | Description |
|---|---|---|
| nDCG@10 | > 0.85 | Top-10 ranking quality |
| Kendall's τ | > 0.70 | Rank correlation with expert rankings |
| MAP@20 | > 0.75 | Mean Average Precision |
| Expert agreement rate | > 80% | Experts agree with model's top-5 |

**Deployment:**
- **Batch**: Daily re-ranking of all active cases per unit (Databricks job → Catalyst Data Store → Dashboard)
- **Real-time**: On-demand ranking via Recommendation Agent

**Explainability**: "Case FIR/2026/001234 ranked #1 priority because: (1) Heinous crime (murder), (2) Accused at large (2 of 3), (3) Approaching chargesheet deadline (7 days), (4) Connected to active gang investigation, (5) Minor victim"

**Bias Mitigation**: Priority based on case severity and operational urgency, not complainant demographics or political connections. Regular audit ensures equitable attention across case types.

**Retraining Schedule:** Monthly retraining with fresh expert rankings. Quarterly recalibration with outcome data (did higher-priority cases receive faster resolution?).

**QuickML vs Custom Decision:** **Custom LambdaMART on Vertex AI** — learning-to-rank is a specialized ML task not supported by QuickML. Requires custom XGBoost with ranking objective.

---

## 20.2 Model Governance & MLOps

### Model Lifecycle Management

```
┌──────────────────────────────────────────────────────────────────┐
│                    MODEL LIFECYCLE PIPELINE                       │
│                                                                  │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐    │
│  │ DEVELOP  │──▶│ VALIDATE │──▶│ APPROVE  │──▶│ DEPLOY   │    │
│  │          │   │          │   │          │   │          │    │
│  │ Research │   │ Offline  │   │ Human    │   │ Shadow   │    │
│  │ & train  │   │ eval +   │   │ review   │   │ mode →   │    │
│  │ in Vertex│   │ fairness │   │ by model │   │ Canary → │    │
│  │ AI Work- │   │ audit    │   │ governance│   │ Full     │    │
│  │ bench    │   │          │   │ board    │   │ rollout  │    │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘    │
│       │              │              │              │             │
│       │         ┌────▼────┐   ┌────▼────┐   ┌────▼────┐       │
│       │         │ MLflow  │   │ Model   │   │ Vertex  │       │
│       │         │ Tracking│   │ Registry│   │ AI      │       │
│       │         │ (metrics│   │ (version│   │ Endpoint│       │
│       │         │  params)│   │  stage) │   │ (serve) │       │
│       │         └─────────┘   └─────────┘   └─────────┘       │
│       │                                          │              │
│       │              ┌───────────────────────────┘              │
│       │              │                                          │
│       │         ┌────▼────┐   ┌──────────┐                     │
│       │         │ MONITOR │──▶│ RETRAIN  │─── loops back ──┐   │
│       │         │         │   │          │                  │   │
│       │         │ Drift   │   │ Scheduled│                  │   │
│       └─────────│ detect, │   │ or       │                  │   │
│                 │ perf    │   │ triggered│◄─────────────────┘   │
│                 │ degrade │   │          │                      │
│                 └─────────┘   └──────────┘                     │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### MLflow Tracking Configuration

| Component | Configuration |
|---|---|
| **Tracking Server** | MLflow on Catalyst AppSail (containerized) |
| **Artifact Store** | Catalyst Stratus (model artifacts, datasets, plots) |
| **Backend Store** | Catalyst Data Store (experiment metadata, metrics, parameters) |
| **Model Registry** | MLflow Model Registry with 4 stages: Staging → Canary → Production → Archived |
| **Experiment Naming** | `{model_name}/{version}/{date}` — e.g., `hotspot-prediction/v3.2/2026-07` |

### Model Monitoring Dashboard

| Metric | Monitoring Frequency | Alert Threshold | Tool |
|---|---|---|---|
| Prediction accuracy | Hourly (batch models), per-request (real-time) | AUC drops >5% from baseline | Datadog + custom metrics |
| Feature drift (PSI) | Daily | PSI > 0.2 for any feature | Vertex AI Model Monitoring |
| Label drift | Weekly | Target distribution shift > 10% | Custom Databricks job |
| Latency (P95) | Per-request | > 2× baseline | Datadog APM |
| Error rate | Per-request | > 1% | Datadog Monitors |
| Fairness metrics | Weekly | Equalized odds difference > 0.05 | Custom fairness pipeline |
| Cost per prediction | Daily | > 2× budget | Vertex AI billing alerts |

---

## 20.3 Bias, Fairness & Ethical Framework

### Bias Risk Matrix

| Model | Bias Risk Level | Primary Concern | Mitigation Strategy |
|---|---|---|---|
| **Hotspot Prediction** | HIGH | Over-policing feedback loop | Historical arrest rate as negative feature; demographic-blind grid features |
| **Recidivism Risk** | CRITICAL | Racial/caste bias in criminal justice data | Protected attribute exclusion; proxy detection; equalized odds audit |
| **Gang Detection** | HIGH | Geographic/community labeling | Activity-based features only; human review mandatory |
| **MO Clustering** | LOW | Language bias (Kannada vs. English FIRs) | Multilingual training; balanced language representation |
| **Case Similarity** | LOW | None identified | Crime-feature based similarity |
| **Anomaly Detection** | MEDIUM | Over-reporting from policed areas | Statistical baseline normalization per area |
| **Resource Allocation** | HIGH | Inequitable resource distribution | Population-based minimum coverage constraints |
| **Crime Forecasting** | MEDIUM | Self-fulfilling prophecy | Forecast monitoring for feedback effects |
| **Bail Risk** | CRITICAL | Socioeconomic and caste discrimination | Strictest fairness constraints; mandatory human decision; independent audit |
| **Investigation Priority** | MEDIUM | VIP/political bias | Severity-only features; no complainant identity features |

### Ethical Review Board

- **Composition**: 2 senior police officers (SP+), 1 legal expert, 1 data scientist, 1 civil liberties representative, 1 academic researcher
- **Review frequency**: Quarterly for all models; immediate for any model flagged by automated fairness monitoring
- **Authority**: Can mandate model retraining, feature removal, or model withdrawal from production
- **Reporting**: Annual public transparency report on AI model performance and fairness metrics

---

## 20.4 Model Deployment Architecture

### Deployment Topology

```
┌──────────────────────────────────────────────────────────────────┐
│                    MODEL SERVING ARCHITECTURE                     │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                REAL-TIME SERVING LAYER                    │   │
│  │                                                          │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │   │
│  │  │ Vertex AI    │  │ Vertex AI    │  │ Vertex AI    │   │   │
│  │  │ Endpoint     │  │ Endpoint     │  │ Endpoint     │   │   │
│  │  │ (Recidivism) │  │ (Bail Risk)  │  │ (Hotspot     │   │   │
│  │  │              │  │              │  │  on-demand)  │   │   │
│  │  │ GPU: T4      │  │ CPU: n1-std-4│  │ GPU: T4      │   │   │
│  │  │ Auto-scale   │  │ Auto-scale   │  │ Auto-scale   │   │   │
│  │  │ 1-10 replicas│  │ 1-5 replicas │  │ 1-5 replicas │   │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │   │
│  │                                                          │   │
│  │  ┌──────────────┐  ┌──────────────┐                     │   │
│  │  │ Catalyst     │  │ Catalyst     │                     │   │
│  │  │ Functions    │  │ QuickML      │                     │   │
│  │  │ (Anomaly     │  │ Endpoint     │                     │   │
│  │  │  Z-score)    │  │ (Forecast    │                     │   │
│  │  │              │  │  baseline)   │                     │   │
│  │  └──────────────┘  └──────────────┘                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                BATCH SERVING LAYER                        │   │
│  │                                                          │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │   │
│  │  │ Databricks   │  │ Databricks   │  │ Vertex AI    │   │   │
│  │  │ Job          │  │ Job          │  │ Batch        │   │   │
│  │  │ (Hotspot     │  │ (Crime Type  │  │ Prediction   │   │   │
│  │  │  nightly)    │  │  Forecasting)│  │ (GNN gang    │   │   │
│  │  │              │  │              │  │  detection)  │   │   │
│  │  │ Schedule:    │  │ Schedule:    │  │ Schedule:    │   │   │
│  │  │ Daily 2AM    │  │ Weekly Sun   │  │ Weekly Mon   │   │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │   │
│  │                                                          │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │   │
│  │  │ Databricks   │  │ Databricks   │  │ Databricks   │   │   │
│  │  │ Job          │  │ Job          │  │ Job          │   │   │
│  │  │ (MO          │  │ (Resource    │  │ (Priority    │   │   │
│  │  │  Clustering) │  │  Allocation) │  │  Scoring)    │   │   │
│  │  │              │  │              │  │              │   │   │
│  │  │ Schedule:    │  │ Schedule:    │  │ Schedule:    │   │   │
│  │  │ Nightly 3AM  │  │ Daily 5AM   │  │ Daily 4AM   │   │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Results → Catalyst Data Store / Cache → Agent Access            │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Model Versioning & Rollback

| Aspect | Strategy |
|---|---|
| **Version format** | Semantic versioning: `v{major}.{minor}.{patch}` (e.g., v3.2.1) |
| **Canary deployment** | New model version receives 5% traffic for 48 hours; auto-promote if metrics are equivalent or better |
| **Rollback trigger** | Automated: AUC drops >3% or latency >2× baseline → automatic rollback to previous version |
| **A/B testing** | For subjective models (Report Generation, Recommendations): 50/50 split with officer feedback collection |
| **Model artifact storage** | All model versions stored in Catalyst Stratus with MLflow metadata; never deleted |
| **Reproducibility** | Training code + data snapshot + random seeds + environment spec stored per version |

---

> **End of Part 3: Intelligence Architecture**
>
> **Next**: Part 4 covers Security Architecture (Section 14), Disaster Recovery (Section 15), and Performance Engineering (Section 16).
>
> **Document Total Word Count**: ~15,000 words  
> **Review Status**: Pending review by Enterprise Architecture Review Board  
> **Classification**: RESTRICTED — Law Enforcement Sensitive
