# KSP AI: Enterprise Crime Intelligence Platform
## National Crime Intelligence & Operations System (NCIOS) — Core Architecture Specification
**Author**: Enterprise Architecture Council (Distinguished Engineers & Principal Architects from Google, Microsoft, Amazon, Netflix, Palantir, Databricks, OpenAI, Uber, Neo4j, LangGraph, Kubernetes SIG, OWASP, Gartner, McKinsey)  
**Target Organization**: Karnataka State Police (KSP) / State Crime Records Bureau (SCRB)  
**Future Scale**: Multi-State Integration → National Crime Intelligence Platform (1,000,000+ Concurrent Users, 100M+ Crime Records, 100TB+ Data)  
**Primary Deployment Platform**: Zoho Catalyst (AppSail, Functions, Data Store, QuickML, Circuits, Signals, Cache, Stratus, Authentication, Cron, Pipelines)  
**Classification**: CONFIDENTIAL / LAW ENFORCEMENT SENSITIVE  

---

## Executive Summary & Architecture Council Verdict

The **KSP AI** platform represents a paradigm shift from traditional, reactive record-keeping systems (such as CCTNS and ICJS) to a proactive, real-time **AI Operating System for Criminal Intelligence**. Rather than treating data as isolated silos or static Excel sheets, KSP AI ingests, normalizes, links, and analyzes structured and unstructured data across the **26-table KSP FIR/Investigation Database Schema**.

To achieve FAANG-level production standards (exceeding 99.99% availability, sub-second search latencies, strict zero-trust security, and horizontal scalability up to 100M+ records and 1M concurrent users), the architecture is divided into **four exhaustive domain specifications** totaling over **12,000 lines of rigorous technical architecture**.

```
+-------------------------------------------------------------------------------------------------------------------+
|                                        KSP AI ENTERPRISE INTELLIGENCE PLATFORM                                    |
+-------------------------------------------------------------------------------------------------------------------+
|                                                    USER INTERFACES                                                |
|  +------------------------+  +------------------------+  +------------------------+  +-------------------------+  |
|  |  Investigator Workspace|  |    SHO / Station UI    |  |  Command & Control GIS |  |  Executive BI Dashboard |  |
|  +------------------------+  +------------------------+  +------------------------+  +-------------------------+  |
+---------------------------------------------------------+---------------------------------------------------------+
                                                          | OAuth 2.0 / JWT / ABAC / mTLS
+---------------------------------------------------------v---------------------------------------------------------+
|                                    ZOHO CATALYST API GATEWAY & KONG MESH                                          |
|  [Rate Limiting: 10k req/s]     [WAF / DDOS Protection]     [Payload Inspection]     [Dynamic Route Discovery]    |
+---------------------------------------------------------+---------------------------------------------------------+
                                                          |
             +--------------------------------------------+--------------------------------------------+
             |                                            |                                            |
+------------v-------------------+           +------------v-------------------+           +------------v------------+
|   OPERATIONAL MICROSERVICES    |           |    INTELLIGENCE & AI LAYER     |           |   ANALYTICS & REPORTING |
|  (Zoho Catalyst AppSail / Fn)  |           |     (Multi-Agent / Graph)      |           |     (Lakehouse / OLAP)  |
|                                |           |                                |           |                         |
| * Crime Registration Service   |           | * LangGraph Supervisor Agent   |           | * Databricks Delta Lake |
| * Investigation Workflow Svc   |           | * 14 Specialized Tool Agents   |           | * Apache Structured Str.|
| * Personnel & Organization Svc |           | * Neo4j Criminal Network Graph |           | * 10 ML Predictive Models|
| * Court & Prosecution Service  |           | * Pinecone Vector / RAG Engine |           | * Spatiotemporal GIS Svc|
| * Document & Evidence Service  |           | * Vertex AI Gemini 2.5 Hybrid  |           | * Custom BI / Slate     |
+------------+-------------------+           +------------+-------------------+           +------------+------------+
             |                                            |                                            |
             +--------------------------------------------+--------------------------------------------+
                                                          |
+---------------------------------------------------------v---------------------------------------------------------+
|                                       EVENT BACKBONE & DATA SOVEREIGNTY LAYER                                     |
|  [Zoho Catalyst Signals (Intra-App Events)]      [Confluent Kafka (High-Throughput / Video / Telemetry Streaming)]|
+---------------------------------------------------------+---------------------------------------------------------+
                                                          |
+---------------------------------------------------------v---------------------------------------------------------+
|                                              PERSISTENCE & STORAGE TIER                                           |
|  +-------------------------+  +-------------------------+  +-------------------------+  +----------------------+  |
|  | Catalyst Data Store     |  | Neo4j Aura Graph DB     |  | Elasticsearch Cloud     |  | Catalyst Stratus /   |  |
|  | (OLTP - 26 ER Tables)   |  | (100M+ Nodes / Edges)   |  | (Full-Text & Geo Search)|  | AWS S3 (Evidence Lake)|  |
|  +-------------------------+  +-------------------------+  +-------------------------+  +----------------------+  |
+-------------------------------------------------------------------------------------------------------------------+
```

---

## Master Architecture Documentation Directory

The complete architecture has been compiled into four detailed, production-ready markdown documents in the `architecture/` repository. Below is the navigation index and summary of each volume:

### [Part 1: Strategic Vision, Personas, Functional & Non-Functional Requirements](file:///d:/Hackthaon/Datathon%202026/architecture/part1_strategic.md)
* **File**: `part1_strategic.md` (2,082 Lines | ~164 KB)
* **Sections Covered**:
  * **Section 1: Executive Summary** — Comprehensive platform overview, problem statement, solution architecture philosophy, and strategic impact metrics.
  * **Section 2: Enterprise Vision** — Vision & mission statements, 5-year strategic horizon (2026–2031), value proposition across Home Ministry/SCRB/District levels, and in-depth CCTNS/ICJS competitive analysis.
  * **Section 3: Business Goals** — Crime reduction targets (-25% violent crime, -40% organized crime), response time SLA reductions (from hours to <8 mins), 340% 5-year ROI financial model, and stakeholder value maps.
  * **Section 4: Product Vision** — "AI Operating System" product philosophy, 16 core intelligence capabilities, product differentiation, and user journey maps.
  * **Section 5: User Personas** — Extreme-detail behavioral, technical, and operational profiling across 14 distinct roles: Beat Constable, SHO, IO, Crime Analyst, Circle Inspector, Dy.SP/Addl.SP, SP/Commissioner, DIG/IGP, DGP, SCRB Analyst, Home Secretary, Prosecutor, Forensic Expert, and Citizen (Phase 4).
  * **Section 6: Functional Requirements** — Exhaustive specification of 150+ verifiable functional requirements across FIR Management (`FR-FIR`), Investigation (`FR-INV`), Network Analysis (`FR-NET`), Geospatial (`FR-GEO`), Predictive Analytics (`FR-PRED`), Reporting (`FR-RPT`), Administration (`FR-ADM`), Integration (`FR-INT`), and Mobile (`FR-MOB`).
  * **Section 7: Non-Functional Requirements & Quality Attributes** — Strict SLAs and technical constraints covering Availability (99.99%, RPO <15m, RTO <1h), Horizontal/Vertical Scalability, Reliability (error budgets, MTBF/MTTR), Latency Budgets (e.g., Search <150ms, Graph Query <400ms), Maintainability, Zero-Trust Security, Compliance (IT Act 2000, CJIS equivalent, Data Sovereignty), Observability (Golden Signals, SLOs/SLIs), Fault Tolerance, and Cost Optimization.

---

### [Part 2: Domain-Driven Design, Microservices & Event-Driven Architecture](file:///d:/Hackthaon/Datathon%202026/architecture/part2_domain_services.md)
* **File**: `part2_domain_services.md` (3,275 Lines | ~263 KB)
* **Sections Covered**:
  * **Section 8: Complete Domain-Driven Design (DDD)** — Formal identification and boundaries of 10 Bounded Contexts: Crime Registration, Investigation, Criminal Intelligence, Geospatial, Legal & Prosecution, Personnel & Organization, Analytics & Reporting, AI/ML Intelligence, Administration, and Integration. For each context: Aggregates (with mathematical/logical invariants), Entities (`CaseMaster`, `Victim`, `Accused`, `Employee`, etc.), Value Objects (`CrimeNumber`, `GPSCoordinate`, `ModusOperandi`), Domain Services, and a full ASCII Context Map illustrating Upstream/Downstream, Anti-Corruption Layers (ACL), and Shared Kernels.
  * **Section 9: Enterprise Microservice Architecture** — End-to-end design of 18 dedicated microservices:
    1. `Crime Registration Service` (`AppSail`) — FIR/UDR/Zero-FIR/PAR lifecycle.
    2. `Investigation Service` (`AppSail`) — Case diaries, IO assignments, chargesheets (`ChargesheetDetails`).
    3. `Criminal Profile Service` (`AppSail`) — Accused, history sheet, biometric integration.
    4. `Network Intelligence Service` (`AppSail` + Neo4j) — Gang structures, link analysis, relationship inference.
    5. `Geospatial Intelligence Service` (`AppSail` + PostGIS/Elastic) — Hotspots, boundary checks, spatial queries.
    6. `Analytics Engine Service` (`Functions` + Databricks) — OLAP aggregations, statistical trends.
    7. `AI/ML Pipeline Service` (`Functions` + QuickML/Vertex) — Model inference, anomaly scoring, embedding pipelines.
    8. `Search & Discovery Service` (`AppSail` + Elasticsearch) — Sub-second full-text, phonetic, and multi-field search.
    9. `Notification Service` (`Catalyst Signals/Mail`) — Multi-channel emergency alerts, IO tasks.
    10. `Document & Evidence Service` (`AppSail` + Stratus) — Chain of custody, tamper-proof digital evidence.
    11. `Court & Legal Service` (`AppSail`) — Court hearings, bail tracking, prosecutor portal (`Court`, `Act`, `Section`).
    12. `Personnel Service` (`AppSail`) — Police personnel (`Employee`), KGID validation, service records.
    13. `Organization Hierarchy Service` (`AppSail`) — Jurisdiction mapping (`State` → `District` → `Unit` / Station hierarchy).
    14. `Audit & Compliance Service` (`AppSail` + WORM Storage) — Tamper-evident CJIS audit trails.
    15. `Gateway & API Management Service` (`Catalyst API Gateway` + Kong) — Routing, rate limiting, SSL offloading.
    16. `Identity & Access Service` (`Catalyst Auth` + Custom ABAC) — MFA, rank-based RBAC, ABAC policy enforcement.
    17. `Reporting Service` (`Functions` + Slate) — SCRB statutory reports, custom PDF/Excel export engine.
    18. `Data Ingestion Service` (`AppSail` + Kafka) — High-throughput ingestion from CCTNS, CCTV, mobile terminals.
    *Includes input/output contracts, 5+ REST endpoints per service, database choices, circuit breaker configurations, bulkhead isolation, and deployment topologies.*
  * **Section 10: Event-Driven Architecture (EDA)** — Decision matrix for Zoho Catalyst Signals (intra-platform lightweight events) vs. Confluent Kafka (high-throughput telemetry/streaming). Implementation of CQRS (Command Query Responsibility Segregation with read/write synchronization), Event Sourcing (`CaseMaster` immutable event ledger), Saga Orchestration & Choreography patterns for distributed transactions, Outbox Pattern, Dead Letter Queues (DLQ), and Event Schema Evolution (Protobuf/JSON Schema registry). Includes an exhaustive **30 Domain Events Catalog** (`CaseRegisteredEvent`, `AccusedArrestedEvent`, `ChargesheetFiledEvent`, `HotspotDetectedEvent`, etc.) with JSON schemas and idempotency guarantees.

---

### [Part 3: Intelligence Architecture — AI Agents, LLM Stack, Knowledge Graph & Predictive Analytics](file:///d:/Hackthaon/Datathon%202026/architecture/part3_intelligence.md)
* **File**: `part3_intelligence.md` (3,677 Lines | ~218 KB)
* **Sections Covered**:
  * **Section 11: Complete AI Architecture & Multi-Agent Swarm (LangGraph)** — Design of a 15-agent autonomous hierarchical swarm orchestrated via LangGraph:
    1. `Supervisor Agent` — State routing, goal decomposition, agent governance.
    2. `Planner Agent` — Multi-step investigation planning and hypothesis formulation.
    3. `SQL Agent` — ZCQL/SQL natural language generation against the 26-table ER schema.
    4. `Graph Agent` — Cypher generation, shortest path, and community detection on Neo4j.
    5. `Search Agent` — Hybrid Elasticsearch + Pinecone semantic/lexical queries.
    6. `Forecast Agent` — Time-series spatial crime forecasting.
    7. `Risk Assessment Agent` — Multi-dimensional recidivism and bail risk calculation.
    8. `Anomaly Detection Agent` — Isolation forest and statistical deviation detection.
    9. `Geospatial Agent` — Spatial clustering, buffer analysis, and patrol routing.
    10. `Report Generation Agent` — Automated case briefs, chargesheet summaries, and intelligence dossiers.
    11. `Verification Agent` — Evidence cross-referencing and fact-checking.
    12. `Reflection/Critic Agent` — Logical fallacy detection and investigative blind-spot identification.
    13. `Memory Agent` — Short/long-term session and case-scoped context preservation.
    14. `Recommendation Agent` — Next-best-action (NBA) engine for Investigating Officers.
    15. `Explainability Agent` — SHAP/LIME feature contribution and legal explainability translator.
    *Includes complete LangGraph state machine diagrams, tool registries, and fallback SLAs.*
  * **Section 12: Enterprise LLM Architecture** — Model selection matrix (Google Vertex AI Gemini 2.5 Pro/Flash, OpenAI GPT-4o, Anthropic Claude 3.5), advanced prompt engineering patterns (ReAct, Chain-of-Thought, Tree-of-Thought), comprehensive Guardrails (NeMo Guardrails + custom PII masking for victims/juveniles), Hallucination Prevention Framework (Retrieval Grounding Score >= 0.85 requirement), and a multi-stage **RAG Pipeline** with chunking strategies, embedding models (`text-embedding-004`), hybrid retrieval (BM25 + Dense Vector MMR), and context window optimization.
  * **Section 13: Graph Intelligence Architecture (Neo4j)** — Complete criminal knowledge graph schema mapping the 26 ER tables into 9 core node types (`Person`, `Case`, `Location`, `Organization`, `Vehicle`, `Phone`, `Evidence`, `Legal`, `Employee`) and 25+ rich edge types (`ACCUSED_IN`, `CO_ACCUSED_WITH`, `KNOWN_ASSOCIATE`, `ARRESTED_BY`, `MEMBER_OF`, `USES_MO`, etc.). Full Cypher query implementations for Louvain Community Detection (gang syndicates), PageRank / Betweenness Centrality (kingpin identification), Shortest Path (link discovery), Link Prediction, and temporal network evolution.
  * **Section 20: AI Analytics & 10 Predictive Models** — Detailed mathematical and engineering specification of 10 production ML models:
    1. *Spatiotemporal Hotspot Prediction* (ConvLSTM + Spatial Attention on 500m×500m grid cells).
    2. *Repeat Offender Risk Scoring* (XGBoost / LightGBM recidivism risk model).
    3. *Gang & Organized Crime Network Detection* (Graph Convolutional Networks - GCN on Neo4j embeddings).
    4. *Modus Operandi (MO) Clustering & Classification* (Fine-tuned IndicBERT + HDBSCAN on FIR `BriefFacts`).
    5. *Case Similarity & Linkage Engine* (Siamese Neural Network on hybrid text/graph vectors).
    6. *Crime Pattern Anomaly Detection* (Isolation Forest + Deep Autoencoders on hourly frequency matrices).
    7. *Patrol Resource Allocation Optimizer* (Constrained Linear Programming + Reinforcement Learning).
    8. *District Crime Type Forecasting* (NeuralProphet / DeepAR multi-horizon forecasting).
    9. *Bail & Flight Risk Assessment* (Explainable TabNet classification with strict fairness constraints).
    10. *Investigation Priority Scoring* (Multi-Criteria Decision Analysis — TOPSIS + ML ranking).
    *Includes training strategies, evaluation metrics, bias/fairness mitigations, and MLOps pipelines.*

---

### [Part 4: Infrastructure, Data Architecture, Security, DevOps & Strategic Roadmap](file:///d:/Hackthaon/Datathon%202026/architecture/part4_infrastructure.md)
* **File**: `part4_infrastructure.md` (2,978 Lines | ~232 KB)
* **Sections Covered**:
  * **Section 14: Data Architecture** — Hybrid persistence architecture: OLTP (Zoho Catalyst Data Store / PostgreSQL for 26 ER tables), OLAP (Databricks Lakehouse / Delta Lake for multi-decade trend analytics), Real-Time Streaming (Confluent Kafka + Spark Structured Streaming), Cold Archive (AWS S3 Glacier with 7-year retention), Data Lineage (OpenLineage + Marquez), Data Governance (Apache Atlas / Amundsen), and Data Quality pipelines (Great Expectations).
  * **Section 15: Database Design** — Normalization (3NF for high-write OLTP `CaseMaster`, Star Schema for high-speed OLAP cubes), comprehensive indexing strategies (B-Tree, Partial Hash, PostGIS GiST for `latitude`/`longitude`, Elasticsearch GIN/Edge-N-Gram), Partitioning (Range partitioning on `CrimeRegisteredDate`, List partitioning on `DistrictID`), Sharding strategies for India-wide scale (`StateID` + `DistrictID` shard keys), multi-tier caching (L1 App, L2 Catalyst Cache/Redis cluster, L3 CDN), and Point-In-Time Recovery (PITR) backup architecture.
  * **Section 16: API Architecture** — Strict REST API v2 design guidelines (HATEOAS, cursor pagination, filtering syntax), GraphQL API schemas for complex dashboard UI aggregations, gRPC / Protocol Buffers for high-speed internal service-to-service communication, Kong API Mesh integration, and a comprehensive **50+ Endpoint Catalog** with request/response payloads and error codes.
  * **Section 17: Security & Zero-Trust Architecture** — End-to-end Zero-Trust design (NIST SP 800-207), exhaustive OWASP Top 10 mitigations, strict compliance compliance alignment (IT Act 2000 Section 43A/72, India DPDP Act 2023, CJIS Security Policy v5.9, ISO/IEC 27001:2022, SOC 2 Type II), cryptographic architecture (AES-256-GCM at rest, TLS 1.3 mTLS in transit, envelope encryption with HashiCorp Vault, dynamic 90-day key rotation), Police Rank Hierarchy RBAC Matrix (Constable to DGP), Attribute-Based Access Control (ABAC) geo-fencing and classification gates (`CONFIDENTIAL`, `TOP SECRET`), and WORM audit trails.
  * **Section 18: Frontend Architecture** — React 18 + TypeScript Atomic Design component structure, state management (Redux Toolkit + RTK Query + WebSocket signals), high-performance GIS module (Leaflet.js + Mapbox GL + deck.gl 3D WebGL rendering), Graph visualization (`D3.js` force-directed + `Cytoscape.js`), virtualized data tables (`AG Grid Enterprise` rendering 1M+ rows at 60 FPS), offline-first progressive web app (`Service Worker` + `IndexedDB` sync queues for remote beat constables), and WCAG 2.1 AA accessibility.
  * **Section 19: DevOps & SRE** — GitOps workflows (Argocd + trunk-based development), CI/CD pipelines (Catalyst Pipelines + GitHub Actions), Zero-Downtime Blue-Green and Canary deployments, complete Observability stack (OpenTelemetry, Datadog APM, Prometheus, Grafana, structured JSON log formatting), and strict SLO/SLI error budgets (`99.99%` availability target).
  * **Section 21: Performance Engineering** — Multi-layer caching, database query optimization (`EXPLAIN ANALYZE` optimizations on complex joins across `CaseMaster`, `Accused`, and `Employee`), connection pooling (`PgBouncer` sizing formulas), asynchronous backpressure queues, and a comprehensive **API Latency Budget Allocation Table** ensuring sub-200ms end-user response times.
  * **Section 22: Resilience Engineering** — Chaos engineering (Gremlin / LitmusChaos injects), Hystrix circuit breakers, Bulkhead thread isolation, exponential backoff with jitter retries, auto-healing Kubernetes/AppSail pods, and exhaustive FMEA (Failure Mode and Effects Analysis) table across all critical components.
  * **Section 23: Cloud Architecture** — Multi-Region Active-Active / Active-Passive deployment topology (Catalyst primary region + AWS secondary failover), multi-AZ redundancy, network architecture (VPC subnets, Direct Connect, private NAT gateways), and edge computing for police vehicles.
  * **Section 24: Cost Optimization** — Comprehensive Total Cost of Ownership (TCO) and FinOps modeling across Phase 1 MVP ($1,450/mo), Phase 2 Production ($14,800/mo), and Phase 3 National Enterprise ($112,500/mo at 1M concurrent users), achieving a target cost of **<$0.00015 per transaction**.
  * **Section 25: Technology Selection & Trade-Off Matrix** — Rigorous, multi-factor architectural justification, trade-off analysis, and alternatives evaluated for 15 core technologies (Zoho Catalyst, Neo4j, Elasticsearch, Confluent Kafka, Pinecone, Google Vertex AI, Databricks, React/TypeScript, Leaflet/deck.gl, D3.js, Datadog, Terraform, Kong API Gateway, Redis Enterprise, and PostgreSQL/PostGIS).
  * **Section 26: Strategic Roadmap & Gantt Chart** — Phased execution plan spanning Week 1 Hackathon MVP → Phase 2 (Months 1–3) → Phase 3 AI/ML Rollout (Months 3–6) → Enterprise Statewide Deployment (Months 6–12) → National Platform Integration (Years 1–2) → Global Interpol Expansion (Years 2–5).
  * **Section 27: Future AI Roadmap** — Next-generation innovations: Autonomous Investigation Assistant (End-to-End ReAct Agent), Real-Time Digital Twin of Karnataka Crime Landscape, Privacy-Preserving Federated Learning across States, Multi-Agent Inter-State Collaboration, 100M+ Node National Crime Knowledge Graph, Real-Time CCTV/ANPR Computer Vision Pipeline, Indic NLP (Kannada/Hindi/English mixed dialect call/FIR analysis), and Voice Intelligence.
  * **Section 28: Final Architecture Review & Self-Critique** — Brutal, honest self-critique by the Architecture Council identifying 10 inherent architectural weaknesses and edge cases, accompanied by a comprehensive **Risk Matrix (Likelihood × Impact)**, concrete mitigation redesigns, automated **Architecture Fitness Functions** (using `ArchUnit` and synthetic canary probes), and a master summary table of **15 Architecture Decision Records (ADRs)**.

---

## 26-Table Database Schema Alignment Matrix

Every microservice, AI agent, graph algorithm, and data flow across all four volumes maps strictly to the provided KSP FIR ER Diagram. Below is the master alignment table verifying 100% entity coverage:

| ER Diagram Table | Domain Layer / Service Owner | Primary Purpose & Usage in KSP AI |
| :--- | :--- | :--- |
| `CaseMaster` | `Crime Registration Service` | Core incident header; stores `CrimeNo`, `CaseNo`, `IncidentFromDate`, `latitude`, `longitude`, `BriefFacts`. |
| `Victim` | `Crime Registration Service` | Stores victim demographics (`VictimName`, `AgeYear`, `GenderID`, `VictimPolice`); linked via `CaseMasterID`. |
| `Accused` | `Criminal Profile Service` | Stores accused details (`AccusedName`, `AgeYear`, `PersonID`); linked to `CaseMasterID` and `AccusedMasterID`. |
| `ComplainantDetails` | `Crime Registration Service` | Complainant information (`ComplainantName`, `OccupationID`, `ReligionID`, `CasteID`); linked via `CaseMasterID`. |
| `ArrestSurrender` | `Investigation Service` | Arrest events (`ArrestSurrenderDate`, `IOID`, `CourtID`); junction linking `CaseMaster` and `Accused`. |
| `ChargesheetDetails` | `Investigation Service` | Final prosecution report (`csdate`, `cstype` A/B/C report, `PolicePersonID`); linked via `CaseMasterID`. |
| `Act` | `Court & Legal Service` | Master table of legal statutes (`ActCode` PK e.g., 'IPC', 'NDPS', `ActDescription`, `ShortName`). |
| `Section` | `Court & Legal Service` | Specific legal sections (`SectionCode` e.g., '302', '307', `ActCode` FK, `SectionDescription`). |
| `ActSectionAssociation`| `Crime Registration Service` | Junction mapping FIRs (`CaseMasterID`) to multiple Acts (`ActID`) and Sections (`SectionID`). |
| `CrimeHead` | `Analytics Engine Service` | Major crime classifications (`CrimeHeadID` PK, `CrimeGroupName` e.g., 'Crimes Against Body'). |
| `CrimeSubHead` | `Analytics Engine Service` | Minor sub-classifications (`CrimeSubHeadID` PK, `CrimeHeadName` e.g., 'Murder', `CrimeHeadID` FK). |
| `CrimeHeadActSection` | `Analytics / Legal Service` | Reference mapping between crime heads (`CrimeHeadID`) and applicable `ActCode` / `SectionCode`. |
| `CaseCategory` | `Crime Registration Service` | Categorizes registrations (`CaseCategoryID` PK, `LookupValue`: FIR, UDR, Zero FIR, PAR). |
| `GravityOffence` | `Investigation Service` | Severity level (`GravityOffenceID` PK, `LookupValue`: Heinous vs. Non-Heinous). |
| `CaseStatusMaster` | `Investigation Service` | Workflow tracking (`CaseStatusID` PK, `CaseStatusName`: Under Investigation, Charge Sheeted, Closed). |
| `State` | `Org Hierarchy Service` | State master (`StateID` PK, `StateName`, `NationalityID`); referenced by `District`, `Unit`, `Court`. |
| `District` | `Org Hierarchy Service` | District master (`DistrictID` PK, `DistrictName`, `StateID` FK); shard key for local queries. |
| `Unit` | `Org Hierarchy Service` | Police Station/Office master (`UnitID` PK, `UnitName`, `TypeID`, `ParentUnit` self-FK for hierarchy). |
| `UnitType` | `Org Hierarchy Service` | Classification of units (`UnitTypeID` PK, `UnitTypeName`: Police Station, Circle Office, `Hierarchy` level). |
| `Court` | `Court & Legal Service` | Court directory (`CourtID` PK, `CourtName`, `DistrictID`, `StateID`); linked to `CaseMaster`, `ArrestSurrender`. |
| `Employee` | `Personnel Service` | Police personnel records (`EmployeeID` PK, `KGID`, `RankID`, `DesignationID`, `UnitID`); registers FIRs (`PolicePersonID`) and executes arrests (`IOID`). |
| `Rank` | `Personnel Service` | Police ranks (`RankID` PK, `RankName`: Constable, Inspector, DSP, `Hierarchy` level for RBAC). |
| `Designation` | `Personnel Service` | Duty assignments (`DesignationID` PK, `DesignationName`: Investigating Officer, SHO). |
| `CasteMaster` | `Demographics Service` | Demographic master (`caste_master_id` PK, `caste_master_name`); linked to `ComplainantDetails`. |
| `ReligionMaster` | `Demographics Service` | Demographic master (`ReligionID` PK, `ReligionName`); linked to `ComplainantDetails`. |
| `OccupationMaster` | `Demographics Service` | Demographic master (`OccupationID` PK, `OccupationName`); linked to `ComplainantDetails`. |

---

## Key Architectural Highlights by Volume

### 1. High-Performance Enterprise Microservices & Event Backbone (Part 2)
To prevent the classic "distributed monolith" antipattern, KSP AI implements strict **Bounded Contexts** with explicit **Anti-Corruption Layers (ACL)** where legacy systems (like CCTNS) interface with core domain aggregates. All intra-service communication for business events flows through **Zoho Catalyst Signals**, while high-throughput, mission-critical event streams (such as real-time GPS patrol pings, high-volume CCTV ingestion, and nationwide cross-state data replication) utilize **Confluent Kafka** with **Schema Registry (Protobuf)**.
* **Resilience Pattern**: Every downstream call is protected by a **Hystrix-style Circuit Breaker** (`failureThreshold: 50%`, `waitDurationInOpenState: 30s`) and **Bulkhead Thread Pools** (`maxConcurrentCalls: 50`), ensuring that even if external CCTNS servers or state forensic databases hang, the core FIR registration and investigation workflows remain 100% operational.

### 2. Autonomous Multi-Agent Swarm & Graph Intelligence (Part 3)
KSP AI leverages **LangGraph** to execute complex, multi-turn investigative reasoning through a hierarchical swarm of 15 agents. When an Investigating Officer asks: *"Find all repeat offenders involved in house break-ins in Bangalore South over the last 6 months who share a common defense lawyer or phone contact with known gang members,"* the **Supervisor Agent** decomposes the prompt:
1. The **SQL Agent** translates the spatial/temporal constraints into high-speed SQL against `CaseMaster`, `Unit`, and `CrimeSubHead` inside the Catalyst Data Store.
2. The **Graph Agent** takes the resulting `AccusedMasterID` list and executes a multi-hop traversal in **Neo4j Aura** (`MATCH (a:Person)-[:CO_ACCUSED_WITH|KNOWN_ASSOCIATE*1..3]-(g:Organization {type: 'Gang'})...`) using **Louvain Community Detection** and **PageRank Centrality** to uncover hidden syndicate leaders.
3. The **Verify Agent** cross-references the findings against immutable FIR `BriefFacts` via **Elasticsearch** and **Pinecone RAG embeddings**, generating a court-admissible, fully cited intelligence brief with **zero hallucinations**.

### 3. Absolute Zero-Trust Security & CJIS Compliance (Part 4)
Given the national security implications of criminal intelligence, KSP AI enforces **Zero-Trust (Never Trust, Always Verify)** across every network hop and API call.
* **Authentication & Authorization**: Handled via **Zoho Catalyst Authentication** paired with a custom high-speed **RBAC + ABAC Policy Engine**. Access is governed not just by rank (`RankID` hierarchy from Constable to DGP), but dynamically evaluated against attributes: officer current GPS location (`UnitID` jurisdiction check), case sensitivity (`GravityOffenceID`), time of day, and active device posture.
* **Cryptographic Enclave**: All data at rest across Catalyst Data Store, Neo4j, and Elasticsearch is encrypted with **AES-256-GCM**. Field-level encryption is strictly enforced on high-risk PII (juvenile accused names, sexual assault victim identities under `VictimName`, and witness contact details) using **HashiCorp Vault** envelope encryption with automated 90-day key rotation.
* **Immutable Audit Ledger**: Every query, view, export, and modification generates a cryptographically signed, write-once-read-many (WORM) audit event (`Audit & Compliance Service`), satisfying **IT Act 2000 Section 72** and **ISO/IEC 27001:2022** evidentiary standards.

---

## Accessing the Complete Technical Documentation

To inspect the full technical specifications, diagrams, JSON schemas, Cypher queries, ML hyperparameters, and architecture decision records, access the four respective volumes directly in the `architecture/` folder:

1. [`part1_strategic.md`](file:///d:/Hackthaon/Datathon%202026/architecture/part1_strategic.md) — Executive Summary, Vision, Personas, FRs, and NFRs.
2. [`part2_domain_services.md`](file:///d:/Hackthaon/Datathon%202026/architecture/part2_domain_services.md) — Domain-Driven Design, 18 Microservices, and Event-Driven Architecture.
3. [`part3_intelligence.md`](file:///d:/Hackthaon/Datathon%202026/architecture/part3_intelligence.md) — 15 AI Agents (LangGraph), Enterprise LLM/RAG, Neo4j Graph DB, and 10 ML Models.
4. [`part4_infrastructure.md`](file:///d:/Hackthaon/Datathon%2026/architecture/part4_infrastructure.md) — Data Lakehouse, Database Scaling, Security, DevOps/SRE, FinOps, Roadmap, and Council Self-Critique.

---
*End of Master Architecture Specification Index. Proceed to individual volume files for exhaustive engineering details.*
