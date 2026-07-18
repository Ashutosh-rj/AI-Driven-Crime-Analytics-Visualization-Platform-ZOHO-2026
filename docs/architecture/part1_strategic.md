# KSP AI — Enterprise Architecture Document
## AI-Driven Crime Intelligence Platform for Karnataka State Police
### Part I: Strategic Architecture (Sections 1–7)

---

| Document Attribute    | Value                                                    |
|-----------------------|----------------------------------------------------------|
| **Document ID**       | KSP AI-ARCH-2026-001                                 |
| **Version**           | 1.0.0                                                    |
| **Classification**    | RESTRICTED — Law Enforcement Sensitive                   |
| **Authors**           | Enterprise Architecture Council                          |
| **Review Board**      | Google DE, Microsoft PA, Amazon VP Eng, Netflix CA, Palantir GA |
| **Date**              | 2026-07-17                                               |
| **Status**            | DRAFT — Pending Stakeholder Review                       |
| **Target Audience**   | CTO, SCRB Director, DGP Office, Home Ministry IT Cell    |

---

## Table of Contents — Part I

1. [Executive Summary](#1-executive-summary)
2. [Enterprise Vision](#2-enterprise-vision)
3. [Business Goals](#3-business-goals)
4. [Product Vision](#4-product-vision)
5. [User Personas](#5-user-personas)
6. [Functional Requirements](#6-functional-requirements)
7. [Non-Functional Requirements & Enterprise Quality Attributes](#7-non-functional-requirements--enterprise-quality-attributes)

---

# 1. Executive Summary

## Platform Overview

**KSP AI** is a next-generation, AI-native Crime Intelligence Platform architected to transform Karnataka State Police from reactive law enforcement into a proactive, intelligence-led policing organization. Built on a foundation of 26 normalized database entities spanning 100M+ crime records, the platform unifies FIR management, criminal network analysis, predictive policing, geospatial intelligence, and prosecutorial support into a single coherent system serving 1M concurrent users at 99.99% availability.

## The Problem

India's existing police technology ecosystem — CCTNS (Crime and Criminal Tracking Network & Systems) and ICJS (Inter-operable Criminal Justice System) — was designed as a digitization layer, not an intelligence layer. CCTNS functions primarily as a data-entry system with limited analytical capability. Officers spend 60-70% of their time on paperwork. Criminal networks spanning jurisdictions remain invisible. Predictive capabilities are non-existent. The result: a 47.2% pendency rate in case investigations, average FIR registration taking 45+ minutes, and zero automated intelligence surfacing.

## The Solution

KSP AI reimagines police technology as a **Crime Intelligence Operating System** — not a tool to be used, but a platform that actively works alongside officers. At its core:

- **Zoho Catalyst** provides the primary application platform (AppSail, Functions, Data Store, Cache, Signals, Auth, Stratus, Pipelines) ensuring data sovereignty within Indian jurisdiction
- **Neo4j Aura** powers criminal network graph intelligence, revealing hidden connections across 100M+ entities
- **Google Vertex AI (Gemini 2.5)** delivers AI-native capabilities: auto-classification of FIRs, semantic search across decades of case files, predictive hotspot modeling, and natural-language investigation assistance
- **Elasticsearch** on Elastic Cloud enables sub-200ms full-text search across all crime records with geospatial queries
- **Databricks Lakehouse** provides the analytical backbone for OLAP workloads, trend analysis, and strategic intelligence reports
- **PostGIS + Leaflet.js + Mapbox GL** deliver military-grade geospatial intelligence with real-time crime mapping

## Strategic Impact

| Metric                          | Current State      | Target (Year 1)  | Target (Year 3)  | Target (Year 5) |
|---------------------------------|--------------------|-------------------|-------------------|-----------------|
| FIR Registration Time           | 45 min             | 8 min             | 3 min             | 90 sec (voice)  |
| Case Pendency Rate              | 47.2%              | 35%               | 22%               | 15%             |
| Crime Clearance Rate            | 52%                | 65%               | 78%               | 85%             |
| Average Response Time           | 22 min             | 14 min            | 8 min             | 5 min           |
| Intelligence Reports Generated  | Manual/Ad-hoc      | 500/month auto    | 5,000/month auto  | 50K/month auto  |
| Cross-Jurisdiction Link Detection| Near zero          | 40%               | 75%               | 95%             |

## Architecture Philosophy

The architecture follows five guiding principles: **(1) Intelligence-First** — every component generates or consumes intelligence; **(2) Zero-Trust Security** — RBAC + ABAC at every boundary; **(3) Event-Driven** — Catalyst Signals + Kafka for real-time responsiveness; **(4) API-First** — every capability is an API before it is a UI; **(5) Progressive Scale** — Karnataka today, All-India tomorrow, Interpol-ready by 2031.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          KSP AI PLATFORM OVERVIEW                            │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐         │
│   │  React  │ │ Mobile   │ │ Command  │ │  Kiosk   │ │ External  │         │
│   │  SPA    │ │ (PWA)    │ │ Center   │ │ (Public) │ │ API       │         │
│   └────┬────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────┬─────┘         │
│        │           │            │             │              │               │
│   ─────┴───────────┴────────────┴─────────────┴──────────────┴──────         │
│                    Catalyst API Gateway + Kong                               │
│   ──────────────────────────────────────────────────────────────────         │
│        │                    │                    │                            │
│   ┌────┴─────┐    ┌────────┴────────┐   ┌──────┴───────┐                    │
│   │ Catalyst │    │   Catalyst      │   │  Catalyst    │                    │
│   │ AppSail  │    │   Functions     │   │  Circuits    │                    │
│   │ (Core)   │    │   (Serverless)  │   │  (Workflow)  │                    │
│   └────┬─────┘    └────────┬────────┘   └──────┬───────┘                    │
│        │                   │                    │                            │
│   ─────┴───────────────────┴────────────────────┴───────────────────         │
│                      Event Bus (Signals + Kafka)                             │
│   ──────────────────────────────────────────────────────────────────         │
│        │           │           │            │            │                   │
│   ┌────┴───┐ ┌─────┴────┐ ┌───┴─────┐ ┌───┴────┐ ┌────┴──────┐            │
│   │Catalyst│ │ Neo4j    │ │ Elastic │ │Pinecone│ │Databricks │            │
│   │DataStore│ │ Aura     │ │ Search  │ │(Vector)│ │ Lakehouse │            │
│   │(OLTP)  │ │ (Graph)  │ │ (FTS)   │ │        │ │ (OLAP)    │            │
│   └────────┘ └──────────┘ └─────────┘ └────────┘ └───────────┘            │
│        │                                                                     │
│   ┌────┴───────────────────────────────────────────────────────┐             │
│   │          AI / ML Layer (Vertex AI + QuickML + MLflow)      │             │
│   └────────────────────────────────────────────────────────────┘             │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Investment**: Estimated ₹47 Cr over 5 years. **ROI**: 340% by Year 5 through crime reduction, operational efficiency, and recovered assets. **Risk**: Mitigated through phased rollout — 5 pilot districts in Phase 1, statewide by Phase 2, national by Phase 3.

---

# 2. Enterprise Vision

## 2.1 Vision Statement

> *"To build the world's most intelligent law enforcement platform that transforms raw crime data into actionable intelligence, empowering every officer from beat constable to DGP with AI-driven insights that prevent crime before it occurs, solve cases faster when it does, and deliver justice more effectively for every citizen of Karnataka."*

## 2.2 Mission

> *"Architect and deliver a secure, scalable, AI-native crime intelligence operating system that unifies all police workflows — registration, investigation, analysis, prosecution, and prevention — into a single platform, while maintaining the highest standards of data sovereignty, constitutional compliance, and citizen privacy."*

## 2.3 Strategic Objectives (5-Year Horizon: 2026–2031)

| # | Strategic Objective | Key Results (Year 1) | Key Results (Year 3) | Key Results (Year 5) | Owner |
|---|---------------------|----------------------|-----------------------|-----------------------|-------|
| SO-1 | **Digitize & Unify** — Migrate 100% of Karnataka police operations to the platform | 5 pilot districts live, 2M records migrated | All 31 districts live, 50M records | Full integration with courts, prosecution, prisons | CTO |
| SO-2 | **Intelligence-Led Policing** — Shift from reactive to proactive policing | AI-assisted crime classification live | Predictive hotspot models operational in all districts | <15% false positive rate on crime prediction | DGP Office |
| SO-3 | **Criminal Network Disruption** — Identify and disrupt organized crime networks | Graph database with 10M entity relationships | 500+ network disruption operations/year | Inter-state network intelligence sharing | SCRB Director |
| SO-4 | **Operational Efficiency** — Reduce administrative burden by 70% | FIR registration <8 min, auto-translation live | Auto-chargesheet drafting, AI brief generation | Fully autonomous routine report generation | SP/Commissioner |
| SO-5 | **Data-Driven Governance** — Enable evidence-based policy making | Real-time dashboards for all 31 SPs | Predictive resource allocation models | National crime trend forecasting | Home Secretary |
| SO-6 | **Scale Nationally** — Extend platform to all Indian states | Architecture validated for multi-tenancy | 5 state onboarding partnerships | 15+ states live, INTERPOL integration API | CEO/Board |
| SO-7 | **Citizen Trust** — Improve public confidence in policing | Citizen portal for FIR status tracking | Public crime heatmaps (anonymized) | <5% complaint rate on police responsiveness | Home Ministry |

## 2.4 Value Proposition by Stakeholder

### Karnataka State Police (Operational)

**Value**: Transform from paper-first to intelligence-first operations. Beat constables receive AI-generated patrol routes based on predictive hotspot analysis. Investigating Officers see automatically surfaced connections between their current case and historical patterns. SHOs get real-time station performance dashboards.

**Quantified Impact**: 70% reduction in paperwork time, 40% faster case resolution, 3x more intelligence reports per officer per month.

### State Crime Records Bureau (SCRB)

**Value**: SCRB transforms from a passive record-keeper to an active intelligence hub. The platform provides automated monthly crime statistics, trend analysis across all 31 districts, criminal profiling databases, and inter-state intelligence feeds — all generated continuously rather than through quarterly manual compilation.

**Quantified Impact**: 90% reduction in manual report compilation, real-time statewide crime dashboards, automated NCRB submission.

### Home Ministry / Home Secretary

**Value**: For the first time, the Home Secretary has a single-pane-of-glass view of crime across Karnataka. Policy decisions are informed by real-time data rather than 6-month-old reports. Resource allocation (police strength, vehicle deployment, special drives) is guided by predictive models rather than political pressure.

**Quantified Impact**: Evidence-based resource allocation saving ₹200 Cr/year, 30% improvement in police-to-crime ratio optimization.

### Judiciary and Prosecution

**Value**: Prosecutors receive AI-drafted case briefs with complete evidence chains, legal precedent references, and chronological timelines — reducing case preparation time from days to hours. Judges benefit from reduced case backlog as chargesheets arrive faster and with higher quality.

**Quantified Impact**: 50% faster chargesheet preparation, 25% reduction in case bounce-back due to incomplete documentation.

## 2.5 Competitive Landscape Analysis

### Existing Systems in India

```
┌───────────────────────────────────────────────────────────────────────────┐
│                    INDIAN POLICE TECH LANDSCAPE                          │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│   Capability        │ CCTNS  │ ICJS   │ Dial 100 │ KSP AI                │
│   ──────────────────┼────────┼────────┼──────────┼──────────             │
│   FIR Registration  │ ██░░░  │ ░░░░░  │ ░░░░░    │ █████                 │
│   Investigation     │ █░░░░  │ ░░░░░  │ ░░░░░    │ █████                 │
│   Network Analysis  │ ░░░░░  │ ░░░░░  │ ░░░░░    │ █████                 │
│   Predictive AI     │ ░░░░░  │ ░░░░░  │ ░░░░░    │ ████░                 │
│   Geospatial Intel  │ █░░░░  │ ░░░░░  │ ███░░    │ █████                 │
│   Cross-System      │ ██░░░  │ ████░  │ █░░░░    │ █████                 │
│   Real-time Alerts  │ ░░░░░  │ ░░░░░  │ ████░    │ █████                 │
│   Mobile-First      │ █░░░░  │ ░░░░░  │ ██░░░    │ █████                 │
│   AI/ML Native      │ ░░░░░  │ ░░░░░  │ ░░░░░    │ █████                 │
│   Scalability       │ ██░░░  │ ██░░░  │ ███░░    │ █████                 │
│                                                                           │
│   Legend: █ = Capability Present  ░ = Capability Absent                  │
└───────────────────────────────────────────────────────────────────────────┘
```

**CCTNS (Crime and Criminal Tracking Network & Systems)**
- **Launched**: 2009, revised 2.0 in 2016
- **Architecture**: Monolithic .NET + SQL Server, state-level NIC data centers
- **Strengths**: Pan-India deployment across 16,347 police stations; standardized FIR format
- **Weaknesses**: Data-entry focused with zero analytical capability; 15+ minute average for FIR registration; batch-mode inter-state search; no graph analysis; no AI/ML; UI designed for desktop-only; frequent downtime during state-level data sync; no API for integration
- **Why KSP AI is different**: KSP AI consumes CCTNS data as an input feed but layers intelligence, graph analytics, AI, and real-time operations on top — it does not replace CCTNS, it transcends it.

**ICJS (Inter-operable Criminal Justice System)**
- **Launched**: 2019 pilot
- **Architecture**: Middleware ESB connecting CCTNS, e-Courts, e-Prosecution, e-Prisons, Forensics
- **Strengths**: Cross-pillar data exchange; unique case ID across systems
- **Weaknesses**: Read-only integration (no bidirectional workflow); high latency (minutes to hours for data propagation); limited to structured data exchange; no intelligence layer; no real-time capability
- **Why KSP AI is different**: KSP AI integrates with ICJS APIs for cross-pillar data but adds the intelligence, analytics, and real-time workflow layer that ICJS was never designed to provide.

**International Benchmarks**:

| Platform | Country | Capability | KSP AI Comparison |
|----------|---------|------------|----------------------|
| Palantir Gotham | USA (LAPD, NYPD) | Graph analytics, entity resolution | Comparable graph capability via Neo4j Aura; better AI/ML integration |
| PredPol / Geolitica | USA (multiple PDs) | Predictive hotspot mapping | Superior — adds network analysis + multi-modal prediction |
| NEC NeoFace | Japan (NPA) | Facial recognition | Not in scope (future module); focuses on data intelligence |
| Home Office LEDS | UK (all forces) | National criminal record search | Comparable search + adds AI-powered semantic search |
| Palantir Foundry | Multiple (defense) | Data fusion, ontology modeling | Comparable data fusion; purpose-built for Indian police context |

## 2.6 Why This Platform Is Different — Architectural Decision Record

**ADR-001: Intelligence Platform, Not a CRUD Application**

| Attribute | Decision |
|-----------|----------|
| **Context** | Existing police systems (CCTNS, ICJS) are CRUD-first: they store data and retrieve it on request. No system actively generates intelligence from stored data. |
| **Decision** | KSP AI is architected as an intelligence-generation engine. Every data write triggers event processing (Catalyst Signals → Kafka) that feeds ML pipelines, graph updates, and alert evaluation. The system generates intelligence continuously, not on-demand. |
| **Rationale** | Crime patterns emerge from connections, not individual records. A murder in Bengaluru and a weapons seizure in Hubli may be connected — but only a system that continuously evaluates graph relationships will surface that connection. |
| **Trade-offs** | Higher computational cost (continuous processing vs. on-demand); more complex architecture; higher operational expertise required. |
| **Alternatives Rejected** | (1) Enhance CCTNS with analytics module — rejected because CCTNS monolith cannot support event-driven processing. (2) Build analytics as a separate BI tool — rejected because intelligence must be embedded in the workflow, not a separate destination. |
| **Failure Modes** | Event processing lag could delay intelligence; mitigated by SLOs on event processing latency (<5s p99). |

**ADR-002: Zoho Catalyst as Primary Platform with Best-of-Breed Extensions**

| Attribute | Decision |
|-----------|----------|
| **Context** | Need Indian-jurisdiction data hosting, rapid development, managed infrastructure, and compliance with Indian IT regulations. |
| **Decision** | Zoho Catalyst as primary platform (Data Store, Functions, AppSail, Cache, Auth, Signals, Stratus, Pipelines, Circuits, Cron). Extend with Neo4j Aura (graph), Elasticsearch (search), Vertex AI (ML), Databricks (analytics), Pinecone (vectors). |
| **Rationale** | Catalyst provides Indian data residency, GDPR/IT Act compliance, and a cohesive development platform. Specialized workloads (graph traversal, full-text search, custom ML) require purpose-built engines that no single platform provides. |
| **Trade-offs** | Multi-vendor complexity; need for integration middleware; multiple billing relationships; team must learn multiple platforms. |
| **Alternatives Rejected** | (1) Pure AWS — data sovereignty concerns with US-headquartered provider for law enforcement data. (2) Pure Azure — same sovereignty concern. (3) Government Cloud (NIC/MeghRaj) — insufficient managed services, no ML platform, slow provisioning. (4) Pure Zoho — lacks graph DB, vector DB, and advanced ML capabilities. |
| **Scalability** | Each component scales independently; Catalyst auto-scales AppSail; Elasticsearch/Neo4j/Databricks have independent scaling controls. |

---

# 3. Business Goals

## 3.1 Measurable Business Outcomes

### Crime Reduction Targets

| Crime Category | Current Annual Count (Karnataka 2025) | Year 1 Target | Year 3 Target | Year 5 Target | Mechanism |
|----------------|---------------------------------------|----------------|----------------|----------------|-----------|
| **Total Cognizable Crimes** | ~1,95,000 | -5% (185K) | -15% (166K) | -25% (146K) | Predictive patrolling, hotspot intervention |
| **Property Crimes (Burglary, Theft)** | ~72,000 | -8% (66K) | -20% (57K) | -35% (47K) | Geo-temporal prediction, network disruption |
| **Crimes Against Women** | ~18,500 | -3% (18K) | -12% (16K) | -20% (15K) | Safe-zone monitoring, repeat offender alerts |
| **Cybercrimes** | ~12,000 | -2% (11.7K) | -10% (10.8K) | -18% (9.8K) | Digital footprint analysis, pattern recognition |
| **Organized Crime (Gang-related)** | ~3,200 | -10% (2.9K) | -30% (2.2K) | -50% (1.6K) | Network graph disruption, coordinated ops |
| **Repeat Offender Crimes** | ~15,000 (est.) | -12% (13.2K) | -35% (9.8K) | -55% (6.8K) | Predictive recidivism, monitoring triggers |

### Response Time Improvements

```
CURRENT STATE → KSP AI IMPACT (Minutes)

FIR Registration:        ████████████████████████░░░░░░░░  45 min
  Year 1:                ████████░░░░░░░░░░░░░░░░░░░░░░░░   8 min  (-82%)
  Year 3:                ███░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   3 min  (-93%)

Patrol Dispatch:         ████████████████████████████░░░░  22 min
  Year 1:                ██████████████░░░░░░░░░░░░░░░░░░  14 min  (-36%)
  Year 3:                █████████░░░░░░░░░░░░░░░░░░░░░░░   8 min  (-64%)

Criminal Record Search:  ██████████████████████░░░░░░░░░░  15 min
  Year 1:                ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   2 sec  (-99.8%)
  Year 3:                █░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  200 ms  (-99.98%)

Chargesheet Prep:        Full bar ≈ 15 days
  Year 1:                ████████████████░░░░░░░░░░░░░░░░   7 days (-53%)
  Year 3:                ██████████░░░░░░░░░░░░░░░░░░░░░░   3 days (-80%)
```

### Clearance Rate Improvements

| Metric | Baseline (2025) | Year 1 | Year 3 | Year 5 |
|--------|----------------|--------|--------|--------|
| Overall Clearance Rate | 52% | 65% | 78% | 85% |
| Heinous Crime Clearance | 62% | 75% | 85% | 92% |
| Property Crime Clearance | 35% | 50% | 65% | 78% |
| Cybercrime Clearance | 22% | 35% | 55% | 70% |
| Chargesheet Filing Rate | 68% | 78% | 88% | 94% |
| Conviction Rate (court) | 42% | 50% | 62% | 72% |

## 3.2 ROI Analysis

### 5-Year Investment & Return Model

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    5-YEAR FINANCIAL MODEL (₹ Crore)                    │
├─────────────┬─────────┬─────────┬─────────┬─────────┬─────────────────┤
│ Component   │ Year 1  │ Year 2  │ Year 3  │ Year 4  │ Year 5  │Total │
├─────────────┼─────────┼─────────┼─────────┼─────────┼─────────────────┤
│ INVESTMENT                                                             │
│ Platform    │   5.2   │   3.8   │   4.1   │   3.5   │   3.0   │ 19.6 │
│ Cloud Infra │   2.8   │   3.2   │   3.8   │   4.2   │   4.8   │ 18.8 │
│ Team        │   3.5   │   3.0   │   2.5   │   2.0   │   1.8   │ 12.8 │
│ Training    │   1.2   │   0.8   │   0.5   │   0.3   │   0.2   │  3.0 │
│ ────────────┼─────────┼─────────┼─────────┼─────────┼─────────────────│
│ Total Cost  │  12.7   │  10.8   │  10.9   │  10.0   │   9.8   │ 54.2 │
├─────────────┼─────────┼─────────┼─────────┼─────────┼─────────────────┤
│ RETURNS                                                                │
│ Op. Savings │   4.2   │   8.5   │  15.0   │  22.0   │  28.0   │ 77.7 │
│ Crime Redn  │   2.0   │   6.0   │  14.0   │  22.0   │  30.0   │ 74.0 │
│ Asset Recov │   0.5   │   2.0   │   5.0   │   8.0   │  12.0   │ 27.5 │
│ Licensing   │   0.0   │   0.0   │   2.0   │   8.0   │  15.0   │ 25.0 │
│ ────────────┼─────────┼─────────┼─────────┼─────────┼─────────────────│
│ Total Value │   6.7   │  16.5   │  36.0   │  60.0   │  85.0   │204.2 │
├─────────────┼─────────┼─────────┼─────────┼─────────┼─────────────────┤
│ NET ROI     │  (6.0)  │   5.7   │  25.1   │  50.0   │  75.2   │150.0 │
│ Cumul. ROI  │  (6.0)  │  (0.3)  │  24.8   │  74.8   │ 150.0   │      │
│ ROI %       │  -47%   │   53%   │  230%   │  500%   │  767%   │ 277% │
└─────────────┴─────────┴─────────┴─────────┴─────────┴─────────────────┘

Breakeven: Month 25 (Early Year 3)
5-Year Cumulative ROI: 277%
```

**ROI Calculation Methodology**:
- **Operational Savings**: Reduced paperwork hours × average officer cost; reduced redundant searches; automated report generation
- **Crime Reduction Value**: NCRB cost-of-crime model × percentage reduction in each category
- **Asset Recovery**: Improved property crime clearance → recovered stolen assets (conservative 15% of prevented loss)
- **Licensing Revenue**: Platform licensing to other Indian states (Year 3+)

## 3.3 Stakeholder Value Map

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        STAKEHOLDER VALUE MAP                              │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│   HIGH INFLUENCE                                                           │
│   ┌─────────────────────────────────┬───────────────────────────────────┐  │
│   │  MANAGE CLOSELY                │  KEY PLAYERS                      │  │
│   │                                │                                   │  │
│   │  • State Legislature           │  • DGP                           │  │
│   │  • Media/Press                 │  • Home Secretary                 │  │
│   │  • Civil Liberties Groups      │  • SCRB Director                 │  │
│   │                                │  • Additional DGP (CID/Tech)     │  │
│   │  Value: Transparency,          │  • IT Secretary                  │  │
│   │  Privacy Compliance,           │                                   │  │
│   │  Accountability                │  Value: Strategic Dashboard,     │  │
│   │                                │  Crime Reduction, National       │  │
│   │                                │  Recognition, Policy Evidence    │  │
│   ├─────────────────────────────────┼───────────────────────────────────┤  │
│   │  KEEP INFORMED                 │  KEEP SATISFIED                  │  │
│   │                                │                                   │  │
│   │  • NCRB                        │  • SPs / Commissioners (31)      │  │
│   │  • NIC                         │  • Investigating Officers (10K+) │  │
│   │  • Other State Police          │  • SHOs (1100+)                  │  │
│   │  • INTERPOL NCB                │  • Beat Constables (50K+)        │  │
│   │                                │  • Prosecutors (2000+)           │  │
│   │  Value: Interoperability,      │  • Court Staff                   │  │
│   │  Standards Compliance,         │                                   │  │
│   │  Data Sharing Protocols        │  Value: Ease of Use, Time        │  │
│   │                                │  Savings, Better Tools,          │  │
│   │                                │  Career Impact                   │  │
│   └─────────────────────────────────┴───────────────────────────────────┘  │
│   LOW INFLUENCE                                                            │
│                                                                            │
│           LOW INTEREST ◄──────────────────────► HIGH INTEREST              │
└────────────────────────────────────────────────────────────────────────────┘
```

## 3.4 Success Metrics & KPIs

### Tier 1: North Star Metrics (Board-Level)

| KPI | Definition | Measurement | Target | Frequency |
|-----|-----------|-------------|--------|-----------|
| **Crime Intelligence Score (CIS)** | Composite index: clearance rate × prediction accuracy × response time improvement | Weighted formula across 3 dimensions | >80/100 | Monthly |
| **Platform Adoption Rate** | % of target users actively using platform weekly | WAU / Total registered users | >85% by Year 2 | Weekly |
| **Intelligence-to-Action Ratio** | % of AI-generated alerts that lead to police action | Actions taken / Alerts generated | >35% | Monthly |
| **Citizen Safety Index** | Composite of crime rate reduction + response time + clearance | Multi-factor index normalized by population | Year-on-year improvement | Quarterly |

### Tier 2: Operational Metrics

| KPI | Target | Owner |
|-----|--------|-------|
| Mean FIR Registration Time | <8 min (Y1), <3 min (Y3) | Product Team |
| Search Latency (p95) | <500ms | Engineering |
| AI Classification Accuracy | >92% (Y1), >97% (Y3) | ML Team |
| System Uptime | 99.99% | SRE |
| Graph Query Response (p95) | <2s for 3-hop traversal | Data Engineering |
| Daily Active Users | >50K (Y1), >200K (Y3) | Product |
| Chargesheet Auto-Draft Accuracy | >85% (Y1), >95% (Y3) | AI/Legal Team |
| Predictive Hotspot Accuracy | >70% (Y1), >85% (Y3) | Data Science |
| Mobile Crash Rate | <0.5% | Mobile Team |
| API Error Rate | <0.1% | Platform Team |

### Tier 3: Technical Health Metrics

| KPI | Target | Alert Threshold |
|-----|--------|-----------------|
| Event Processing Latency (p99) | <5s | >10s |
| Database Query Latency (p95) | <200ms | >500ms |
| Cache Hit Rate | >85% | <70% |
| Error Budget Remaining | >50% per quarter | <25% |
| Deployment Frequency | Daily (non-breaking) | <3x/week |
| Mean Time to Recovery (MTTR) | <15 min | >30 min |
| Infrastructure Cost per User | <₹15/month | >₹25/month |

## 3.5 Phased Value Delivery Timeline

```
═══════════════════════════════════════════════════════════════════════════════
                    KSP AI — PHASED DELIVERY ROADMAP
═══════════════════════════════════════════════════════════════════════════════

PHASE 1: FOUNDATION (Months 1–8)
─────────────────────────────────
  ▸ Core FIR Management (CaseMaster CRUD + workflows)
  ▸ Authentication & RBAC (Catalyst Auth + custom engine)
  ▸ Full-text Search (Elasticsearch indexing of 26 tables)
  ▸ Basic Crime Analytics Dashboard (React + Recharts)
  ▸ 5 Pilot Districts: Bengaluru Urban, Mysuru, Mangaluru,
    Belagavi, Hubli-Dharwad
  ▸ CCTNS data migration pipeline (Databricks ETL)
  ▸ Mobile PWA (beat constable field use)
  ▸ DELIVERABLE: Production system for 5 districts, 10K users

PHASE 2: INTELLIGENCE (Months 6–14)
─────────────────────────────────────
  ▸ Criminal Network Graph (Neo4j Aura — entity resolution)
  ▸ AI-Powered FIR Classification (Vertex AI Gemini 2.5)
  ▸ Semantic Search (Pinecone RAG + legal corpus)
  ▸ Geospatial Intelligence (PostGIS + Leaflet crime mapping)
  ▸ Automated Daily Intelligence Briefs
  ▸ Statewide rollout begins (remaining 26 districts)
  ▸ Investigation workflow automation (Catalyst Circuits)
  ▸ DELIVERABLE: Intelligence layer, 20+ districts live

PHASE 3: PREDICTION (Months 12–20)
────────────────────────────────────
  ▸ Predictive Hotspot Modeling (Vertex AI custom models)
  ▸ Recidivism Risk Scoring
  ▸ Auto-Chargesheet Drafting (Gemini 2.5 legal generation)
  ▸ Real-time Alert Engine (Signals + Kafka streaming)
  ▸ Command Center Integration (live dashboards)
  ▸ All 31 districts + specialized units live
  ▸ DELIVERABLE: Full statewide deployment, predictive cap.

PHASE 4: ECOSYSTEM (Months 18–30)
──────────────────────────────────
  ▸ Court/Prosecution Integration (ICJS APIs)
  ▸ Citizen Portal (FIR status, anonymized heatmaps)
  ▸ Inter-state Intelligence Sharing Protocol
  ▸ Advanced ML: anomaly detection, behavioral profiling
  ▸ National scaling architecture (multi-tenant)
  ▸ DELIVERABLE: Full ecosystem, ready for national scale

PHASE 5: NATIONAL & INTERNATIONAL (Months 24–60)
──────────────────────────────────────────────────
  ▸ Multi-state deployment (5 partner states)
  ▸ INTERPOL I-24/7 integration
  ▸ Advanced AI: NLP interrogation analysis, deep fakes det.
  ▸ Autonomous investigation assistance
  ▸ DELIVERABLE: National platform, international ready

═══════════════════════════════════════════════════════════════════════════════
```

---

# 4. Product Vision

## 4.1 Product Philosophy: Intelligence Platform, Not a Tool

KSP AI is built on a fundamental philosophical distinction: **it is an Intelligence Platform, not a software tool**. This distinction drives every architectural and product decision.

| Dimension | Traditional Police Software (Tool) | KSP AI (Intelligence Platform) |
|-----------|-------------------------------------|-------------------------------------|
| **Data Flow** | User inputs data, system stores it | System ingests, processes, connects, and surfaces intelligence proactively |
| **User Interaction** | User asks questions, system answers | System anticipates questions and pushes insights to the user |
| **Intelligence** | Manual analysis by skilled analysts | Automated pattern detection with human-in-the-loop validation |
| **Architecture** | Request-response (CRUD) | Event-driven (every write triggers intelligence pipeline) |
| **Value Over Time** | Linear (more data = more storage cost) | Exponential (more data = exponentially more connections = more intelligence) |
| **Integration** | Standalone application | Platform with APIs — every capability consumable programmatically |
| **Learning** | Static rules | Continuously learning ML models that improve with usage |

### The Intelligence Loop

```
                    ┌──────────────────────────┐
                    │    DATA INGESTION        │
                    │  FIR, Arrest, Evidence,  │
                    │  Patrol, Tip-off, CCTNS  │
                    └────────────┬─────────────┘
                                 │
                                 ▼
               ┌─────────────────────────────────┐
               │     EVENT PROCESSING            │
               │  Catalyst Signals → Kafka →     │
               │  Classification, NER, Geocoding │
               └────────────┬────────────────────┘
                            │
                            ▼
         ┌──────────────────────────────────────┐
         │     INTELLIGENCE GENERATION          │
         │  Graph Update (Neo4j) → Pattern      │
         │  Match → Anomaly Detection →         │
         │  Prediction Models (Vertex AI)       │
         └────────────┬─────────────────────────┘
                      │
                      ▼
        ┌───────────────────────────────────────┐
        │     INSIGHT DELIVERY                  │
        │  Alerts → Dashboards → Briefs →       │
        │  Push Notifications → Command Center  │
        └────────────┬──────────────────────────┘
                     │
                     ▼
          ┌────────────────────────────────────┐
          │     ACTION & FEEDBACK              │
          │  Officer acts → outcome recorded → │
          │  feeds back into models → learns   │
          └────────────────────────────────────┘
                     │
                     └──────────► (loops back to Data Ingestion)
```

## 4.2 Core Product Capabilities (16 Capabilities)

### Capability Map

| # | Capability | Description | Primary Tech | Priority |
|---|-----------|-------------|--------------|----------|
| C-01 | **Intelligent FIR Management** | AI-assisted FIR registration with auto-classification, NLP extraction of entities/locations/dates, multi-language support (Kannada, Hindi, English, Urdu), voice-to-FIR | Catalyst DataStore, Vertex AI Gemini 2.5, Catalyst Functions | P0 |
| C-02 | **Criminal Network Intelligence** | Automated entity resolution, relationship mapping, community detection, influence scoring, network disruption simulation | Neo4j Aura, Vertex AI, Catalyst AppSail | P0 |
| C-03 | **Investigation Workbench** | Case timeline visualization, evidence management, witness tracking, IO task management, automated compliance checking (CrPC timelines), AI-suggested investigation leads | React, Catalyst Circuits, Catalyst DataStore | P0 |
| C-04 | **Geospatial Crime Intelligence (GeoIntel)** | Real-time crime mapping, hotspot visualization, patrol route optimization, beat boundary analysis, temporal-spatial clustering | PostGIS, Leaflet.js, Mapbox GL, Catalyst Functions | P0 |
| C-05 | **Predictive Analytics Engine** | Crime hotspot prediction (72h/7d/30d windows), recidivism risk scoring, resource demand forecasting, seasonal pattern detection | Vertex AI, Databricks, MLflow, Catalyst QuickML | P1 |
| C-06 | **Semantic Search & RAG** | Natural-language search across all case files ("find cases similar to the 2023 Whitefield kidnapping"), legal precedent search, multilingual semantic matching | Pinecone, Elasticsearch, Vertex AI Embeddings | P0 |
| C-07 | **Automated Intelligence Reporting** | Daily station briefs, weekly district summaries, monthly state reports, ad-hoc trend reports — all auto-generated by AI with human review | Gemini 2.5, Databricks, Catalyst Cron | P1 |
| C-08 | **Real-Time Alert Engine** | Configurable alert rules (repeat offender in new jurisdiction, crime spike above threshold, bail violation, wanted person sighted), multi-channel delivery (app, SMS, email) | Catalyst Signals, Kafka, Catalyst Mail | P0 |
| C-09 | **Chargesheet & Legal Document Automation** | AI-drafted chargesheets with evidence cross-referencing, legal section recommendation, precedent attachment, timeline generation | Gemini 2.5, Catalyst Functions, Catalyst Stratus | P1 |
| C-10 | **Command Center Dashboard** | Real-time operational view for SPs/Commissioners — live crime feed, resource deployment map, KPI gauges, drill-down to any station | React, D3.js, AG Grid, WebSocket via Catalyst | P1 |
| C-11 | **Mobile Field Intelligence** | PWA for field officers — FIR registration, criminal record check, photo capture, GPS-tagged incident reporting, offline-capable | React PWA, Catalyst AppSail, IndexedDB | P0 |
| C-12 | **Citizen Services Portal** | FIR status tracking, online complaint submission, anonymized crime heatmaps, safety advisories, feedback mechanism | React, Catalyst AppSail, Catalyst Auth | P2 |
| C-13 | **Inter-Agency Intelligence Sharing** | Standardized APIs for SCRB, NCRB, ICJS, Interpol I-24/7, other state police; federated query capability | Kong API Gateway, Catalyst Functions, OAuth 2.0 | P2 |
| C-14 | **Forensic Evidence Management** | Digital evidence chain-of-custody, forensic lab integration, DNA/fingerprint match tracking, evidence timeline | Catalyst Stratus, Catalyst DataStore, Catalyst Circuits | P2 |
| C-15 | **Training & Knowledge Base** | AI-powered training modules, investigation playbooks, legal reference (BNS/BNSS/BSA), searchable SOP library | Pinecone RAG, Gemini 2.5, Catalyst Slate | P2 |
| C-16 | **Audit, Compliance & Governance** | Complete audit trail, access logs, data lineage, RBAC/ABAC policy engine, compliance dashboards, right-to-information support | Catalyst DataStore, Datadog, Catalyst Functions | P0 |

## 4.3 Product Differentiation

### KSP AI vs. Every Existing Police System — The 7 Differentiators

1. **Graph-Native Criminal Intelligence**: No Indian police system uses graph databases. KSP AI's Neo4j Aura backbone reveals criminal networks invisible to relational queries. A 3-hop query from an accused person reveals their associates' associates — enabling proactive network disruption.

2. **AI-Native, Not AI-Bolted-On**: Intelligence is not a module — it is woven into every interaction. When an officer types an FIR, AI auto-classifies the crime head, extracts named entities, geocodes the location, checks for similar MOs, and alerts if a repeat offender matches the description — all before the FIR is saved.

3. **Event-Driven Architecture**: Every data change (FIR filed, accused arrested, chargesheet submitted) generates an event that flows through Catalyst Signals + Kafka. These events trigger real-time graph updates, ML pipeline retraining, alert evaluation, and dashboard refresh. No polling, no batch processing for critical intelligence.

4. **Multi-Modal Search**: Officers can search by text (Elasticsearch), by meaning (Pinecone semantic), by geography (PostGIS spatial), by network (Neo4j graph traversal), or by asking a question in natural language (Gemini RAG). No other system offers this search convergence.

5. **Built for Indian Police Hierarchy**: The 26-table ER schema (CaseMaster → Unit → District → State, with Rank/Designation-based access control) natively models Indian police organizational structure. RBAC mirrors the real-world chain of command — a constable sees their beat, an SHO sees their station, an SP sees their district.

6. **Offline-First Mobile**: Beat constables in rural Karnataka often have intermittent connectivity. The PWA architecture with IndexedDB sync ensures officers can register FIRs, check records, and capture evidence offline — with automatic sync when connectivity returns.

7. **Data Sovereignty by Design**: All primary data resides in Zoho Catalyst (Indian data centers). Specialized engines (Neo4j, Elasticsearch, Pinecone) are configured for Indian-region hosting. No law enforcement data transits outside Indian jurisdiction.

## 4.4 Product-Market Fit Analysis

### Market Definition

**Primary Market**: 29 Indian State Police departments + 8 UT police forces = 37 potential customers, each operating 300-1000+ police stations. Current TAM: ₹5,000 Cr (police modernization budgets allocated by MHA).

**Secondary Market**: Central agencies (CBI, NIA, NCB, BSF), Railway Police, Forest Department.

**Adjacent Market**: International law enforcement (ASEAN, SAARC nations with similar policing models).

### Product-Market Fit Evidence

| Signal | Evidence |
|--------|----------|
| **Problem Severity** | Officers report spending 60-70% time on paperwork; 47% case pendency; zero AI/ML adoption in Indian policing |
| **Willingness to Pay** | MHA Police Modernization budget: ₹3,000 Cr/year; Karnataka specific: ₹450 Cr allocated for tech upgrades |
| **Active Seeking** | Karnataka Police RFP for "Next-Gen Crime Analytics Platform" issued Q1 2026; multiple states benchmarking Karnataka's digital police initiative |
| **Regulatory Tailwinds** | MHA mandate for CCTNS 2.0 upgrade; BNS/BNSS/BSA reform creates need for new digital workflows |
| **Technology Readiness** | Cloud adoption in govt (MeghRaj 2.0); 4G/5G coverage enabling mobile-first; Aadhaar/DigiLocker enabling digital identity |

## 4.5 User Journey Maps

### Journey 1: Beat Constable — Morning Patrol

```
┌──────────────────────────────────────────────────────────────────────────┐
│              BEAT CONSTABLE — MORNING PATROL JOURNEY                    │
├──────┬──────────────┬──────────────────┬────────────────────────────────┤
│ Step │ Action       │ System Response   │ Intelligence Delivered         │
├──────┼──────────────┼──────────────────┼────────────────────────────────┤
│  1   │ Login (PWA)  │ Biometric auth   │ Today's patrol brief auto-    │
│      │              │ via Catalyst     │ generated: 3 alerts, 2 wanted │
│      │              │ Auth             │ persons in beat area           │
├──────┼──────────────┼──────────────────┼────────────────────────────────┤
│  2   │ View patrol  │ AI-optimized     │ Route highlights: "Area X had │
│      │ route        │ route on map     │ 4 chain snatchings this week, │
│      │              │ (Leaflet.js)     │ increase patrol time"          │
├──────┼──────────────┼──────────────────┼────────────────────────────────┤
│  3   │ Encounter    │ Offline-capable  │ Auto-fill location via GPS,   │
│      │ incident →   │ FIR form loads   │ AI suggests IPC sections      │
│      │ Register FIR │ from cache       │ based on verbal description    │
├──────┼──────────────┼──────────────────┼────────────────────────────────┤
│  4   │ Capture      │ Photo uploaded   │ System checks against wanted  │
│      │ suspect      │ to Catalyst      │ database in real-time; no     │
│      │ photo        │ Stratus          │ match found                    │
├──────┼──────────────┼──────────────────┼────────────────────────────────┤
│  5   │ Submit FIR   │ Synced when      │ SHO auto-notified; crime      │
│      │              │ online; Event    │ logged on station dashboard;  │
│      │              │ triggers graph   │ hotspot model updated          │
│      │              │ + search index   │                                │
├──────┼──────────────┼──────────────────┼────────────────────────────────┤
│  6   │ End shift    │ Auto-generated   │ Shift summary: 12 km walked,  │
│      │ report       │ from GPS trail   │ 1 FIR filed, 3 checkpoints    │
│      │              │ + activities     │ covered, patrol coverage 87%   │
└──────┴──────────────┴──────────────────┴────────────────────────────────┘
```

### Journey 2: Investigating Officer — Case Investigation

```
┌───────────────────────────────────────────────────────────────────────────┐
│          INVESTIGATING OFFICER — CASE INVESTIGATION JOURNEY              │
├──────┬────────────────┬──────────────────┬────────────────────────────────┤
│ Step │ Action         │ System Response   │ Intelligence Delivered         │
├──────┼────────────────┼──────────────────┼────────────────────────────────┤
│  1   │ Assigned case  │ Push notification│ Case brief: victim, accused,  │
│      │ by SHO         │ via Signals      │ sections, location, similar   │
│      │                │                  │ past cases auto-linked         │
├──────┼────────────────┼──────────────────┼────────────────────────────────┤
│  2   │ Review case    │ AI-generated     │ "3 similar MO cases in        │
│      │ connections    │ graph view       │ adjacent jurisdiction; accused │
│      │                │ (Neo4j visual)   │ A2 linked to 2 prior cases"   │
├──────┼────────────────┼──────────────────┼────────────────────────────────┤
│  3   │ Search for     │ Multi-modal      │ Returns 7 past cases with     │
│      │ similar cases  │ search results   │ 85%+ MO similarity; suggests  │
│      │ "knife attack  │ (semantic +      │ checking Accused X from       │
│      │ near temple"   │ keyword + geo)   │ 2024 Mysuru case              │
├──────┼────────────────┼──────────────────┼────────────────────────────────┤
│  4   │ Add evidence   │ Chain-of-custody │ Auto-tags evidence type,      │
│      │ (photos, docs) │ logged; stored   │ generates evidence index,     │
│      │                │ in Stratus       │ links to case timeline         │
├──────┼────────────────┼──────────────────┼────────────────────────────────┤
│  5   │ Request        │ Circuits workflow│ Auto-sent to FSL; tracking    │
│      │ forensic       │ triggers FSL     │ number assigned; IO notified  │
│      │ analysis       │ integration      │ when results arrive            │
├──────┼────────────────┼──────────────────┼────────────────────────────────┤
│  6   │ Prepare        │ AI drafts        │ Auto-populated: accused list, │
│      │ chargesheet    │ chargesheet      │ evidence summary, section     │
│      │                │ (Gemini 2.5)     │ mapping, witness statements,  │
│      │                │                  │ court-ready formatting         │
├──────┼────────────────┼──────────────────┼────────────────────────────────┤
│  7   │ CrPC deadline  │ System tracks    │ "60-day deadline in 5 days;   │
│      │ approaching    │ all statutory    │ chargesheet draft 80% ready;  │
│      │                │ deadlines auto.  │ 2 pending evidence items"      │
└──────┴────────────────┴──────────────────┴────────────────────────────────┘
```

### Journey 3: SP/Commissioner — Strategic Oversight

```
┌───────────────────────────────────────────────────────────────────────────┐
│          SP / COMMISSIONER — STRATEGIC OVERSIGHT JOURNEY                 │
├──────┬─────────────────┬─────────────────┬────────────────────────────────┤
│ Step │ Action          │ System Response  │ Intelligence Delivered         │
├──────┼─────────────────┼─────────────────┼────────────────────────────────┤
│  1   │ Morning login   │ Executive        │ Overnight summary: 12 FIRs,  │
│      │                 │ dashboard loads  │ 3 heinous, 2 arrests, 1 crime│
│      │                 │ (D3.js + AG Grid)│ spike alert in Zone 4         │
├──────┼─────────────────┼─────────────────┼────────────────────────────────┤
│  2   │ Drill into      │ Geo-temporal     │ "Chain snatching +40% in     │
│      │ Zone 4 alert    │ analysis auto-   │ Zone 4 this week; 3 of 5      │
│      │                 │ presented        │ incidents near Metro Stn X;   │
│      │                 │                  │ suspect profile: male, 20-25" │
├──────┼─────────────────┼─────────────────┼────────────────────────────────┤
│  3   │ Reallocate      │ Resource         │ Optimal deployment suggestion │
│      │ patrols         │ optimization     │ based on predicted risk zones │
│      │                 │ engine runs      │ for next 72 hours              │
├──────┼─────────────────┼─────────────────┼────────────────────────────────┤
│  4   │ Review pending  │ AI-prioritized   │ "47 cases >60 days; 12 have  │
│      │ cases           │ case list with   │ strong leads (graph analysis);│
│      │                 │ clearance prob.  │ 5 likely to be cleared in 7d" │
├──────┼─────────────────┼─────────────────┼────────────────────────────────┤
│  5   │ Prepare for     │ AI-generated     │ District crime brief with     │
│      │ weekly review   │ presentation     │ trends, comparisons, and      │
│      │ meeting         │ deck auto-built  │ actionable recommendations    │
└──────┴─────────────────┴─────────────────┴────────────────────────────────┘
```

---

# 5. User Personas

## 5.1 Beat Constable (PC/HC)

| Attribute | Detail |
|-----------|--------|
| **Role Title** | Police Constable (PC) / Head Constable (HC) |
| **Rank Hierarchy** | Rank 10-9 (lowest operational) |
| **Count in Karnataka** | ~52,000 |
| **Age Range** | 21–55 years |
| **Tech Proficiency** | Low to Medium; comfortable with smartphones, limited with computers |
| **Language Preference** | Kannada primary; some Hindi/English |
| **Primary Work Location** | Field (beat patrol), rural areas with intermittent connectivity |
| **Shift Pattern** | 8-12 hour shifts, rotating day/night |
| **Reporting To** | Station House Officer (SHO) |

**Goals**:
1. Complete patrol duties efficiently without excessive paperwork
2. Register FIRs quickly when incidents occur during patrol
3. Identify wanted/suspicious persons during beat rounds
4. Meet patrol coverage targets without manual log maintenance
5. Respond to citizen complaints with adequate information

**Pain Points**:
1. Must return to station to register FIR (45+ min trip wasted)
2. Paper-based patrol registers are tedious and non-verifiable
3. No access to criminal database in the field — cannot check if a person has prior history
4. Language barrier — official forms are in English but most incidents are reported in Kannada
5. No awareness of crime patterns in their beat area
6. Night patrols have zero intelligence support — walking blind
7. GPS-based attendance systems are unreliable in rural areas

**Workflows**:
- Morning: Receive patrol duty assignment → Collect patrol register → Walk beat → Log checkpoints → Return register
- Incident: Receive complaint → Note details on paper → Escort complainant to station → SHO decides on FIR → Wait 45 min for FIR typing → Get copy → Resume patrol
- Night: Patrol assigned area → Check locked shops → Monitor known trouble spots → Submit morning report manually

**Access Level**: `ROLE_CONSTABLE` — Own beat data only; read-only on station FIRs; no access to investigation details; cannot see accused personal details beyond name; no analytics access.

**Features Needed**:
- Offline-capable PWA with Kannada interface
- Voice-to-text FIR registration (Kannada → structured form)
- GPS-tracked patrol with auto-generated coverage reports
- One-tap criminal record check (photo/name-based)
- AI-optimized patrol routes based on crime prediction
- Real-time alerts for wanted persons in beat area
- Simplified daily report auto-generation from GPS trail + activities

---

## 5.2 Station House Officer (SHO)

| Attribute | Detail |
|-----------|--------|
| **Role Title** | Station House Officer / Inspector |
| **Rank Hierarchy** | Inspector (Rank 6) |
| **Count in Karnataka** | ~1,100 (one per station) |
| **Age Range** | 30–55 years |
| **Tech Proficiency** | Medium; computer literate; uses smartphone extensively |
| **Primary Work Location** | Police station; occasional field visits |
| **Reporting To** | Circle Inspector → SDPO → SP |

**Goals**:
1. Manage station operations efficiently — FIR registration, case allocation, resource deployment
2. Reduce case pendency at their station
3. Meet crime clearance rate targets set by SP
4. Ensure timely chargesheet filing (within CrPC deadlines)
5. Manage constable deployment and patrol scheduling
6. Respond to direction from SP/CI for special operations

**Pain Points**:
1. Overwhelmed with administrative tasks (leave management, registers, returns)
2. No real-time visibility into station performance — relies on monthly manual compilation
3. Case allocation is intuition-based, not workload-aware
4. Cannot track IO progress without physically asking each officer
5. Statutory deadline tracking is manual — chargesheets often miss deadlines
6. CCTNS data entry is treated as secondary to real police work — always behind
7. Crime pattern awareness is limited to personal memory and experience

**Workflows**:
- Daily: Review overnight FIRs → Allocate cases to IOs → Sign registers → Meet complainants → Attend to CI/SP calls → Review pending cases → Send daily crime report to CI
- Weekly: Compile station statistics → Review chargesheet deadlines → Patrol review meeting → Law and order assessment
- Monthly: Monthly crime review with CI/SDPO → CCTNS data reconciliation → Performance reports

**Access Level**: `ROLE_SHO` — Full access to own station's cases, FIRs, accused, victims; read access to adjacent stations' summaries; case allocation controls; constable management; station-level analytics.

**Features Needed**:
- Station command dashboard (real-time case status, pendency, clearance)
- Intelligent case allocation (AI-recommended IO assignment based on workload, expertise, case type)
- Automated statutory deadline tracker with escalation alerts
- One-click daily/weekly/monthly report generation
- Crime pattern overlay for station jurisdiction
- IO workload monitor — cases per IO, overdue tasks, progress %
- Quick FIR approval workflow (review AI-drafted FIR, approve/modify, assign)
- Constable patrol monitoring (GPS tracking, coverage %)

---

## 5.3 Investigating Officer (IO)

| Attribute | Detail |
|-----------|--------|
| **Role Title** | Investigating Officer (Sub-Inspector / Inspector) |
| **Rank Hierarchy** | Sub-Inspector (Rank 7) to Inspector (Rank 6) |
| **Count in Karnataka** | ~8,000–10,000 active IOs |
| **Tech Proficiency** | Medium; capable of using investigation tools with training |
| **Primary Work Location** | Station + Field (crime scenes, witness locations, courts) |
| **Reporting To** | SHO → CI → SDPO |

**Goals**:
1. Investigate assigned cases thoroughly and build watertight evidence chains
2. File chargesheets within statutory deadlines (60/90 days)
3. Identify and apprehend accused persons
4. Collect, preserve, and document evidence properly
5. Maintain proper case diary and investigation records
6. Find connections between current case and historical cases
7. Prepare for court testimony

**Pain Points**:
1. Managing 15-25 simultaneous cases with no prioritization tool
2. No system to discover if similar cases exist in other jurisdictions
3. Evidence management is physical — photos printed, documents in folders
4. Case diary is handwritten — no searchability, no backup
5. Chargesheet drafting takes 2-5 days of manual typing
6. Legal section identification requires consulting senior officers or law books
7. No visibility into forensic report status — have to physically call FSL
8. Court dates tracked in personal diary — missed dates are common
9. Witness tracking is entirely manual — no systematic follow-up

**Workflows**:
- Case Start: Receive case allocation from SHO → Visit crime scene → Record mahazar → Collect physical evidence → Record witness statements → Send evidence to FSL
- Investigation: Interview witnesses → Search for accused → Coordinate with other stations → Obtain CDR/phone records → Analyze CCTV → Build case timeline
- Closure: Draft chargesheet → Get SHO review → Submit to court → Follow up on court dates → Testify

**Access Level**: `ROLE_IO` — Full CRUD on assigned cases; read access to station cases for cross-reference; search access to statewide criminal database; evidence upload; case diary; limited analytics (own cases only).

**Features Needed**:
- Investigation workbench with case timeline, evidence board, task tracker
- AI-powered similar case search ("find cases with same MO within 50km in last 2 years")
- Automated chargesheet drafting from case data + evidence
- Legal section recommender (describe facts → AI suggests applicable BNS/BNSS sections)
- Digital case diary with search, photo attachment, GPS tagging
- Forensic report tracking (automated status updates from FSL integration)
- Court date management with automated reminders
- Criminal network graph for assigned case — show accused connections
- Witness management — contact tracking, statement versioning, follow-up scheduler
- Statutory deadline countdown timer with escalation
- Evidence chain-of-custody tracker (digital audit trail)

---

## 5.4 Crime Analyst

| Attribute | Detail |
|-----------|--------|
| **Role Title** | Crime Analyst (Technical/Statistical) |
| **Rank Hierarchy** | Civilian or Inspector-equivalent |
| **Count in Karnataka** | ~50–100 (SCRB + district units) |
| **Tech Proficiency** | High; data-literate; comfortable with analytics tools |
| **Primary Work Location** | SCRB office / District Crime Branch |
| **Reporting To** | SCRB Director / SP (Crime) |

**Goals**:
1. Identify crime patterns and trends across the state
2. Produce actionable intelligence reports for senior officers
3. Conduct link analysis between criminal entities
4. Support operational planning with data-driven insights
5. Maintain criminal databases and statistical records
6. Respond to ad-hoc data requests from DGP office / Home Ministry

**Pain Points**:
1. Data extraction from CCTNS is cumbersome — export to Excel, manually clean
2. No graph analysis tools — criminal network mapping done manually on whiteboards
3. Statistical analysis limited to Excel — no Python/R/ML capability in current systems
4. Report generation takes 1-2 weeks for comprehensive district analysis
5. Cannot perform geospatial analysis — no GIS tools available
6. No semantic search — finding related cases requires reading hundreds of FIR summaries
7. Data quality is poor — inconsistent names, missing fields, duplicate records

**Access Level**: `ROLE_ANALYST` — Read access to all statewide case data (anonymized personal details for non-assigned); full access to analytics tools; graph database queries; report builder; no case modification rights.

**Features Needed**:
- Advanced analytics dashboard with drill-down (D3.js + AG Grid)
- Neo4j graph exploration interface — visual criminal network analysis
- Geospatial analysis tools — crime density maps, hotspot analysis, temporal patterns
- Custom report builder with scheduling (Databricks SQL + Catalyst Cron)
- Semantic search across all FIR narratives (Pinecone + Elasticsearch)
- Statistical tools — trend analysis, regression, clustering, anomaly detection
- Data quality dashboard — missing fields, duplicates, inconsistencies
- Export capabilities — PDF, Excel, CSV, API for data consumers
- Predictive model monitoring — accuracy metrics, drift detection
- Entity resolution interface — merge/split duplicate criminal records

---

## 5.5 Circle Inspector (CI)

| Attribute | Detail |
|-----------|--------|
| **Role Title** | Circle Inspector |
| **Rank Hierarchy** | Inspector (Rank 6) — supervises 3-5 stations |
| **Count in Karnataka** | ~300 |
| **Tech Proficiency** | Medium |
| **Primary Work Location** | Circle office + station visits |
| **Reporting To** | SDPO / Dy.SP |

**Goals**:
1. Supervise and coordinate operations across 3-5 police stations
2. Ensure uniform crime response across circle jurisdiction
3. Intervene in complex or sensitive cases
4. Conduct periodic inspections of station registers and records
5. Manage law & order situations in circle area

**Pain Points**:
1. Relies on phone calls to SHOs for station status — no real-time dashboard
2. No comparative view across stations under their circle
3. Sensitive case tracking requires visiting each station physically
4. Law & order event coordination has no digital platform

**Access Level**: `ROLE_CI` — Read/approve access to all stations in circle; case reassignment between stations; circle-level analytics; investigation supervision (read-only on case details).

**Features Needed**:
- Circle dashboard — comparative view of all stations (FIR count, pendency, clearance rate)
- Sensitive case monitor — filtered view of heinous/sensitive cases across circle
- Station inspection checklist (digital, with photo evidence)
- Law & order event tracker with resource coordination
- Performance comparison — station vs station, month-over-month
- Automated daily circle brief (aggregated from station data)

---

## 5.6 Deputy SP / Additional SP (Dy.SP / Addl. SP)

| Attribute | Detail |
|-----------|--------|
| **Role Title** | Deputy Superintendent of Police / Additional SP |
| **Rank Hierarchy** | DSP (Rank 5) |
| **Count in Karnataka** | ~200 |
| **Reporting To** | SP / Commissioner |

**Goals**: Supervise sub-divisions (5-10 stations each); handle departmental inquiries; manage specialized operations (anti-narcotics, cyber crime).

**Pain Points**: No subdivision-level analytics; relies on CIs for information; cannot track special operation progress digitally.

**Access Level**: `ROLE_DSP` — Sub-division level access; case reassignment; investigation quality review; sub-division analytics; specialized operation management.

**Features Needed**:
- Sub-division command dashboard
- Specialized operation planning & tracking
- Case quality review interface (evidence completeness scoring)
- Personnel performance analytics (IO efficiency metrics)
- Inter-station case transfer management

---

## 5.7 Superintendent of Police / Commissioner (SP / CP)

| Attribute | Detail |
|-----------|--------|
| **Role Title** | SP (rural districts) / Commissioner of Police (city) |
| **Rank Hierarchy** | IPS Officer — Rank 4 |
| **Count in Karnataka** | 31 (one per district) + 3 Commissioners |
| **Tech Proficiency** | Medium-High; data-informed decision-making |
| **Reporting To** | DIG / IGP → DGP |

**Goals**:
1. Maintain law and order across district/commissionerate
2. Reduce crime rates — held personally accountable by DGP and Home Ministry
3. Optimize resource allocation across 50-100+ stations
4. Manage media and public perception during major incidents
5. Present crime statistics at monthly DGP review meetings

**Pain Points**:
1. District crime picture assembled manually from station reports — always outdated
2. Resource allocation is based on historical patterns, not predictive models
3. Preparing for DGP review meetings takes 2-3 days of data compilation
4. Cannot identify emerging crime trends until they become patterns
5. No tool to simulate impact of resource reallocation

**Access Level**: `ROLE_SP` — Full access to district data; all case details; all personnel; district analytics; resource allocation controls; can override case assignments; performance reviews.

**Features Needed**:
- Executive command center dashboard with real-time crime feed
- Predictive resource allocation tool (AI-suggested patrol deployment)
- AI-generated presentation decks for review meetings
- District-wide crime trend analysis with year-over-year comparison
- Case pendency drill-down — by station, by crime type, by IO
- Media briefing template generator
- Real-time incident management during law & order situations
- Officer performance scorecards

---

## 5.8 DIG / IGP (Deputy Inspector General / Inspector General)

| Attribute | Detail |
|-----------|--------|
| **Role Title** | DIG / IGP — Range/Zone level supervision |
| **Rank Hierarchy** | IPS Senior — Rank 3 |
| **Count in Karnataka** | ~15 |
| **Reporting To** | ADGP → DGP |

**Goals**: Oversee 4-6 districts; ensure policy implementation; coordinate inter-district operations; strategic crime analysis.

**Access Level**: `ROLE_DIG` — Range-level aggregated data; inter-district comparisons; policy compliance monitoring; can order inter-district investigations.

**Features Needed**:
- Range/Zone dashboard — aggregated KPIs across multiple districts
- Inter-district crime pattern analysis
- Cross-jurisdiction investigation coordination tools
- Policy compliance tracker
- Strategic intelligence reports (weekly automated)
- Resource optimization across districts in range

---

## 5.9 Director General of Police (DGP)

| Attribute | Detail |
|-----------|--------|
| **Role Title** | Director General of Police — State Head |
| **Rank Hierarchy** | IPS — Rank 1 |
| **Count in Karnataka** | 1 (+ 3-4 ADGPs) |
| **Reporting To** | Home Secretary / Chief Minister |

**Goals**: State-level crime reduction targets; police modernization; media management; policy direction; inter-state coordination.

**Access Level**: `ROLE_DGP` — Unrestricted access to all data statewide; strategic dashboards; policy controls; user management oversight.

**Features Needed**:
- State command center — single-pane view of all 31 districts
- Real-time crime ticker with severity-based escalation
- AI-generated state crime brief (daily, weekly, monthly)
- Crime comparison — Karnataka vs national averages
- Resource optimization — state-level personnel/vehicle deployment
- Inter-state intelligence sharing dashboard
- Media briefing auto-generator
- Policy impact simulation (what-if scenarios for resource reallocation)

---

## 5.10 SCRB Analyst

| Attribute | Detail |
|-----------|--------|
| **Role Title** | State Crime Records Bureau — Statistical/Technical Analyst |
| **Rank Hierarchy** | Civilian or Inspector-equivalent |
| **Count** | ~30–50 |
| **Reporting To** | SCRB Director → ADGP (Crime) |

**Goals**: Maintain statewide crime statistics; produce NCRB annual returns; criminal records management; fingerprint bureau operations; inter-state criminal history checks.

**Pain Points**: Manual compilation from 1100+ stations; data inconsistencies across districts; NCRB format changes require manual report restructuring; no entity resolution — same criminal may have 5 different records.

**Access Level**: `ROLE_SCRB` — Read access to all statewide data; statistical query tools; report generation; criminal record management (entity merge/split); NCRB submission tools.

**Features Needed**:
- Automated NCRB return generation (Crime in India format)
- Entity resolution tools — AI-suggested duplicate merges
- Statewide criminal database management interface
- Statistical analysis suite (trend, comparison, forecast)
- Data quality monitoring dashboard
- Fingerprint/criminal record search integration

---

## 5.11 Home Secretary

| Attribute | Detail |
|-----------|--------|
| **Role Title** | Principal Secretary / Secretary, Home Department |
| **Rank Hierarchy** | IAS Officer |
| **Count** | 1 (+ staff) |

**Goals**: Policy-level crime governance; budget allocation for police; legislative coordination; accountability to Chief Minister; media management.

**Access Level**: `ROLE_HOME_SECY` — Strategic dashboards only; aggregated statistics; no individual case details; policy simulation tools.

**Features Needed**:
- High-level state security dashboard (aggregated, anonymized)
- Crime trend comparison — district-wise, year-wise, national
- Budget vs outcome analysis
- Policy impact assessment tools
- Legislative briefing auto-generation

---

## 5.12 Prosecutor

| Attribute | Detail |
|-----------|--------|
| **Role Title** | Public Prosecutor / Additional Public Prosecutor |
| **Count** | ~2,000 across Karnataka |
| **Tech Proficiency** | Medium; legal-tech adopter |
| **Reporting To** | Director of Prosecution |

**Goals**: Effective court prosecution; high conviction rates; thorough case preparation; witness management; legal argument construction.

**Pain Points**: Receives incomplete chargesheets; no access to investigation details beyond chargesheet; cannot search legal precedents efficiently; court date management is manual.

**Access Level**: `ROLE_PROSECUTOR` — Read access to assigned cases (post-chargesheet); evidence view; witness details; no investigation notes; legal precedent search.

**Features Needed**:
- Case prosecution dashboard — upcoming hearings, case status, evidence summary
- AI-generated case briefs with legal precedent references
- Evidence viewer with chain-of-custody verification
- Legal section analysis — strength of evidence per section
- Witness management — contact, statement history, availability
- Court calendar integration
- BNS/BNSS/BSA reference search (Pinecone RAG)

---

## 5.13 Forensic Expert

| Attribute | Detail |
|-----------|--------|
| **Role Title** | Forensic Science Laboratory (FSL) Analyst |
| **Count** | ~200–300 across Karnataka |
| **Reporting To** | Director, FSL |

**Goals**: Process evidence samples; produce forensic reports; testify in court; maintain chain of custody.

**Access Level**: `ROLE_FORENSIC` — Evidence management for assigned samples; report upload; chain-of-custody read access; no case investigation details.

**Features Needed**:
- Digital evidence receipt and acknowledgment
- Sample tracking (barcode/QR integration)
- Forensic report upload with auto-notification to IO
- Chain-of-custody digital trail
- Court testimony schedule management
- DNA/fingerprint database search integration

---

## 5.14 Citizen (Future — Phase 4)

| Attribute | Detail |
|-----------|--------|
| **Role Title** | General Public / Complainant |
| **Count** | ~70 million (Karnataka population) |
| **Tech Proficiency** | Varies widely |

**Goals**: File complaints easily; track FIR status; access safety information; provide anonymous tips; verify police action on complaints.

**Access Level**: `ROLE_CITIZEN` — Own complaints/FIRs only; public crime heatmaps (anonymized); safety advisories; complaint status; feedback submission. Zero access to investigation details, accused information, or police internal data.

**Features Needed**:
- Online FIR/complaint submission (web + mobile)
- FIR status tracking (application number-based)
- Anonymized public crime heatmap
- Safety advisories by area
- Anonymous tip submission
- Feedback/rating for police service
- Multi-language support (Kannada, English, Hindi, Urdu, Tamil, Telugu)

---

# 6. Functional Requirements

## 6.1 FIR Management (FR-FIR)

| Req ID | Requirement | Priority | Linked Entity | Description |
|--------|-------------|----------|---------------|-------------|
| FR-FIR-001 | **FIR Registration** | P0 | CaseMaster | Register new FIR with mandatory fields: CrimeNo (auto-generated as 1+DistrictID+UnitID+Year+Serial), CaseCategoryID, PoliceStationID, PolicePersonID, CrimeRegisteredDate, IncidentFromDate, IncidentToDate, latitude, longitude, BriefFacts |
| FR-FIR-002 | **Crime Number Auto-Generation** | P0 | CaseMaster.CrimeNo | Auto-generate CrimeNo per format: 1-digit CaseCategory + 4-digit DistrictID + 4-digit UnitID + 4-digit Year + 5-digit Serial. Separate serial counters per station/category/year. Examples: FIR=1xxxxx, UDR=3xxxxx, Zero FIR=8xxxxx, PAR=4xxxxx |
| FR-FIR-003 | **Case Category Classification** | P0 | CaseCategory | Support FIR, UDR (Un-Detected Report), PAR (Preliminary/Action Report), Zero FIR with distinct workflows per category |
| FR-FIR-004 | **Gravity Classification** | P0 | GravityOffence | Classify offences as Heinous/Non-Heinous with auto-suggestion based on sections invoked |
| FR-FIR-005 | **Crime Head Mapping** | P0 | CrimeHead, CrimeSubHead, CrimeHeadActSection | Auto-map selected Act+Section combinations to CrimeMajorHeadID and CrimeMinorHeadID via CrimeHeadActSection lookup |
| FR-FIR-006 | **Act & Section Association** | P0 | ActSectionAssociation, Act, Section | Allow multiple Act+Section combinations per FIR with display ordering (ActOrderID, SectionOrderID). Support BNS (2023), BNSS, BSA alongside legacy IPC/CrPC |
| FR-FIR-007 | **Complainant Management** | P0 | ComplainantDetails | Capture multiple complainants per case with name, age, gender, occupation (OccupationMaster), religion (ReligionMaster), caste (CasteMaster) |
| FR-FIR-008 | **Victim Recording** | P0 | Victim | Register multiple victims per FIR with name, age, gender, VictimPolice flag (0/1 indicating if victim is police personnel) |
| FR-FIR-009 | **Accused Registration** | P0 | Accused | Register multiple accused per FIR with name, age, gender, PersonID (A1, A2, A3... sorting), with entity resolution against existing criminal database |
| FR-FIR-010 | **GPS Geotagging** | P0 | CaseMaster.latitude, .longitude | Auto-capture GPS coordinates of incident location; manual entry fallback; address-to-geocode conversion |
| FR-FIR-011 | **AI-Assisted FIR Drafting** | P1 | CaseMaster.BriefFacts | AI (Gemini 2.5) generates structured BriefFacts from officer's verbal/typed narrative; extracts entities, locations, dates, and suggests applicable sections |
| FR-FIR-012 | **Multi-Language FIR Registration** | P1 | CaseMaster | Support FIR registration in Kannada, Hindi, English, and Urdu with auto-translation to English for system processing |
| FR-FIR-013 | **Voice-to-FIR** | P2 | CaseMaster | Voice input (Kannada/Hindi/English) → transcription → NLP extraction → structured FIR form population |
| FR-FIR-014 | **Zero FIR Handling** | P0 | CaseMaster, CaseCategory | Register Zero FIR at any station; automatic transfer workflow to jurisdictional station with full data migration |
| FR-FIR-015 | **FIR Amendment/Alteration** | P0 | CaseMaster | Support amendments to registered FIR (add sections, modify BriefFacts) with complete audit trail and authorization workflow |
| FR-FIR-016 | **Case Status Tracking** | P0 | CaseStatusMaster | Track case through lifecycle: Under Investigation → Charge Sheeted → Closed (True/FR/Undetected) with status change audit |
| FR-FIR-017 | **Court Assignment** | P0 | Court | Assign case to court (CourtID) with auto-suggestion based on jurisdiction (DistrictID, StateID) and case type |
| FR-FIR-018 | **Duplicate FIR Detection** | P0 | CaseMaster | AI-powered detection of potential duplicate FIRs based on: same location ±500m, similar time window, matching crime type, semantic similarity of BriefFacts >80% |
| FR-FIR-019 | **FIR Search** | P0 | CaseMaster + all | Full-text search across all FIR fields; filter by: date range, crime type, station, status, gravity, district, accused name, victim name |
| FR-FIR-020 | **FIR Print/Export** | P0 | CaseMaster | Generate court-standard FIR document (PDF) with all mandatory fields in prescribed format |
| FR-FIR-021 | **Information Received Timestamp** | P0 | CaseMaster.InfoReceivedPSDate | Capture exact datetime when police station first received information about the incident; system enforces InfoReceivedPSDate ≤ CrimeRegisteredDate |
| FR-FIR-022 | **Case Transfer** | P0 | CaseMaster | Transfer case between police stations with full history preservation, notification to both SHOs, and audit trail |
| FR-FIR-023 | **FIR Linked Alerts** | P1 | CaseMaster | On FIR registration: auto-check if any accused matches wanted list; alert if crime location is within 500m of a school/temple/sensitive area; alert if crime type matches recent pattern |
| FR-FIR-024 | **Bulk FIR Import** | P1 | CaseMaster | Import historical FIRs from CCTNS/Excel with validation, de-duplication, and entity resolution |
| FR-FIR-025 | **FIR Analytics** | P1 | CaseMaster | Real-time metrics: FIRs registered today/week/month, by crime type, by station, by gravity; comparison with same period last year |
| FR-FIR-026 | **FIR Version History** | P0 | CaseMaster | Complete version history of all changes to FIR with who/when/what changed (immutable audit log) |
| FR-FIR-027 | **Case Category Transition** | P1 | CaseMaster, CaseCategory | Support transitions: UDR→FIR (cognizable offence detected), FIR→Zero FIR transfer, PAR→FIR upgrade |
| FR-FIR-028 | **Sensitive Case Flagging** | P0 | CaseMaster | Auto-flag cases involving: SC/ST victims (POA Act), women (POCSO, DV), communal incidents, deaths in custody, political persons — with mandatory escalation to SP |
| FR-FIR-029 | **BriefFacts NLP Processing** | P1 | CaseMaster.BriefFacts | NLP pipeline to extract: named entities (persons, places, organizations), dates/times, weapon types, vehicle details, phone numbers — indexed for search |
| FR-FIR-030 | **FIR Acknowledgment** | P0 | CaseMaster | Auto-generate FIR acknowledgment (case number, date, station details) for complainant — available as SMS/print/digital |
| FR-FIR-031 | **Multi-Act FIR Support** | P0 | ActSectionAssociation | Support FIRs invoking sections from multiple acts simultaneously (e.g., BNS + NDPS + Arms Act) with proper ordering |
| FR-FIR-032 | **FIR Dashboard** | P0 | CaseMaster | Station-level FIR dashboard: today's FIRs, pending registration, auto-classified, transferred in/out, total active |
| FR-FIR-033 | **Offline FIR Registration** | P0 | CaseMaster | Register FIR in offline mode (mobile PWA); auto-sync with conflict resolution when connectivity restored |

## 6.2 Investigation Management (FR-INV)

| Req ID | Requirement | Priority | Description |
|--------|-------------|----------|-------------|
| FR-INV-001 | **Case Allocation** | P0 | SHO assigns IO to case; AI suggests optimal IO based on workload, expertise, and case type; workload balancing |
| FR-INV-002 | **Investigation Timeline** | P0 | Visual timeline of all investigation activities: scene visits, witness statements, evidence collection, forensic requests, court dates |
| FR-INV-003 | **Digital Case Diary** | P0 | Replace paper case diary with digital version; daily entries, photo attachments, GPS tagging, search, version control |
| FR-INV-004 | **Evidence Management** | P0 | Digital evidence tracking: physical evidence (muddemal), digital evidence (photos, videos, documents); chain-of-custody audit trail |
| FR-INV-005 | **Witness Management** | P0 | Witness database per case: name, contact, statement (versioned), reliability scoring, follow-up scheduler, court appearance tracking |
| FR-INV-006 | **Arrest/Surrender Processing** | P0 | Full ArrestSurrender workflow: arrest type, date, location (State→District→Station), IO assignment, court production, accused linking (AccusedMasterID) |
| FR-INV-007 | **Chargesheet Preparation** | P0 | Comprehensive chargesheet builder: accused list, evidence summary, witness list, sections applied, investigation summary, court details (ChargesheetDetails) |
| FR-INV-008 | **AI Chargesheet Drafting** | P1 | Gemini 2.5 auto-drafts chargesheet from case data — IO reviews, modifies, and finalizes; auto-fills ChargesheetDetails (CSID, csdate, cstype: A=Chargesheet, B=False Case, C=Undetected) |
| FR-INV-009 | **Statutory Deadline Tracker** | P0 | Auto-track: 60-day chargesheet deadline (bail offences), 90-day (non-bail); Section 167 CrPC / BNSS deadlines; alert at 7-day, 3-day, 1-day marks |
| FR-INV-010 | **Forensic Lab Integration** | P1 | Digital evidence submission to FSL; sample tracking; auto-notification on report completion; report ingestion into case file |
| FR-INV-011 | **IO Task Management** | P0 | Task list per case: pending witness statements, scene revisits, court dates, evidence follow-ups; priority + deadline tracking |
| FR-INV-012 | **Case Merge/Split** | P0 | Merge related cases (same accused, connected incidents); split compound cases into separate investigations; full audit trail |
| FR-INV-013 | **Investigation Quality Score** | P1 | AI-computed quality score per case: evidence completeness %, witness coverage %, timeline gaps, section strength assessment |
| FR-INV-014 | **Modus Operandi (MO) Recording** | P0 | Structured MO capture: method, tools used, target type, time pattern, location pattern; MO similarity search across database |
| FR-INV-015 | **Accused History Check** | P0 | Auto-check accused against: wanted list, bail conditions, previous cases, court orders; aggregate criminal history view |
| FR-INV-016 | **Investigation Supervision** | P0 | SHO/CI/SP can review IO's investigation progress, add directions, approve/reject chargesheet; multi-level approval workflow |
| FR-INV-017 | **CDR/Digital Evidence Analysis** | P2 | Ingest Call Detail Records; plot call patterns on timeline; identify common contacts between accused; geospatial call mapping |
| FR-INV-018 | **AI Investigation Leads** | P1 | AI suggests investigation leads based on: similar case patterns, graph connections, unverified witnesses, geographic proximity of accused to crime scene |
| FR-INV-019 | **Case Closure Workflow** | P0 | Formal case closure with: closure type (chargesheet/FR/undetected), closure report, supervisor approval, complainant notification |
| FR-INV-020 | **Court Interaction Tracking** | P0 | Track all court interactions: hearing dates, orders, adjournments, bail decisions, conviction/acquittal; linked to ChargesheetDetails |
| FR-INV-021 | **Property/Stolen Goods Tracking** | P1 | Register stolen property with descriptions; match against recovery reports; auto-alert when matching property found in another jurisdiction |
| FR-INV-022 | **Photo Lineup Management** | P2 | Digital photo lineup builder for witness identification; compliant with legal guidelines; result recording with audit trail |
| FR-INV-023 | **Inter-Station Coordination** | P1 | Request assistance from other stations; share case details securely; coordinate arrests across jurisdictions |

## 6.3 Criminal Network Analysis (FR-NET)

| Req ID | Requirement | Priority | Description |
|--------|-------------|----------|-------------|
| FR-NET-001 | **Entity Resolution** | P0 | AI-powered de-duplication: identify same criminal across multiple FIRs despite name/age variations; fuzzy matching + demographic matching |
| FR-NET-002 | **Relationship Graph** | P0 | Auto-build criminal relationship graph from: co-accused in same case, common victims, shared locations, phone records, family connections |
| FR-NET-003 | **Criminal Profile** | P0 | Comprehensive criminal profile: all cases, arrests, convictions, associates, MO patterns, geographic activity area, risk score |
| FR-NET-004 | **Network Visualization** | P0 | Interactive graph visualization (D3.js/vis.js) with: zoom, filter by relationship type, time-range animation, cluster detection |
| FR-NET-005 | **Community Detection** | P1 | Automated gang/group identification using graph algorithms (Louvain, Label Propagation) on Neo4j Aura |
| FR-NET-006 | **Influence Scoring** | P1 | Identify key players in criminal networks using centrality algorithms: degree, betweenness, PageRank |
| FR-NET-007 | **Network Growth Alert** | P1 | Alert when a criminal network shows growth indicators: new members, new geographic spread, new crime types |
| FR-NET-008 | **Cross-Jurisdiction Links** | P0 | Detect connections between criminals in different districts/states; auto-alert relevant SPs/SHOs |
| FR-NET-009 | **Repeat Offender Tracking** | P0 | Auto-flag repeat offenders (>2 cases); track recidivism patterns; alert when repeat offender enters new jurisdiction |
| FR-NET-010 | **Network Disruption Simulation** | P2 | Model impact of arresting key network nodes — which arrests would maximally disrupt the network? |
| FR-NET-011 | **Wanted Person Graph** | P0 | Maintain wanted persons database with: photo, last known location, associate network, cases linked, bounty if applicable |
| FR-NET-012 | **Gang Database** | P1 | Structured gang records: members, hierarchy, territory, crime types, rivalries, allies |
| FR-NET-013 | **Temporal Network Analysis** | P2 | Analyze how criminal networks evolve over time; detect network reformation after arrests |
| FR-NET-014 | **Co-occurrence Analysis** | P1 | Identify persons/vehicles/phones that co-occur across multiple crime scenes — potential serial offenders |
| FR-NET-015 | **Criminal Migration Patterns** | P1 | Track criminal geographic movement: arrest locations over time, jurisdictional crossing patterns |

## 6.4 Geospatial Intelligence (FR-GEO)

| Req ID | Requirement | Priority | Description |
|--------|-------------|----------|-------------|
| FR-GEO-001 | **Crime Map** | P0 | Real-time crime map showing all registered FIRs with location (from CaseMaster.latitude, .longitude); filterable by crime type, date range, gravity |
| FR-GEO-002 | **Hotspot Analysis** | P0 | Automated crime hotspot detection using kernel density estimation; configurable by crime type and time window |
| FR-GEO-003 | **Beat Boundary Mapping** | P0 | Digital beat boundaries with crime overlay; beat-level crime statistics; patrol route display |
| FR-GEO-004 | **Patrol Route Optimization** | P1 | AI-optimized patrol routes based on: crime prediction, time of day, available officers, terrain, historical response times |
| FR-GEO-005 | **Temporal-Spatial Clustering** | P1 | Identify crime clusters that are both spatially and temporally related — potential serial crime patterns |
| FR-GEO-006 | **Station Jurisdiction Mapping** | P0 | Digital polygon boundaries for all 1100+ police station jurisdictions (Unit table); auto-determine jurisdiction from GPS coordinates |
| FR-GEO-007 | **Sensitive Location Layer** | P0 | Map layer showing schools, temples, hospitals, political offices, courts — auto-alert when crime occurs near sensitive locations |
| FR-GEO-008 | **Arrest Location Mapping** | P0 | Map all arrest/surrender events (ArrestSurrender table) with location details; compare arrest location vs. crime location patterns |
| FR-GEO-009 | **Resource Deployment View** | P1 | Real-time map showing: patrol vehicles, beat officers (GPS), police stations, checkpoints — for command center use |
| FR-GEO-010 | **Geofencing Alerts** | P1 | Set virtual boundaries around sensitive areas; alert when known offender's device enters geofence (with legal authorization) |
| FR-GEO-011 | **Crime Buffer Analysis** | P1 | Analyze crime density within configurable radius of any point (school, ATM, liquor shop) — identify high-risk locations |
| FR-GEO-012 | **Route Analysis** | P2 | Analyze crime patterns along routes (highways, metro lines); identify vulnerable stretches |
| FR-GEO-013 | **Multi-Layer Overlay** | P0 | Overlay multiple data layers: crimes, patrols, demographics, infrastructure, CCTV locations — for comprehensive analysis |
| FR-GEO-014 | **Heatmap Time-lapse** | P1 | Animated heatmap showing crime pattern evolution over time (hourly/daily/weekly/monthly) |
| FR-GEO-015 | **District Comparison Map** | P0 | Choropleth map comparing crime rates across districts; drill-down to station level |

## 6.5 Predictive Analytics (FR-PRED)

| Req ID | Requirement | Priority | Description |
|--------|-------------|----------|-------------|
| FR-PRED-001 | **Crime Hotspot Prediction** | P1 | Predict crime hotspots 72hrs/7days/30days ahead using: historical patterns, seasonal trends, events calendar, weather data |
| FR-PRED-002 | **Crime Type Prediction** | P1 | Predict which crime types are likely to spike in which areas — granular to police station jurisdiction |
| FR-PRED-003 | **Recidivism Risk Scoring** | P1 | Score released offenders for re-offence probability using: criminal history, social factors, crime type, time since release |
| FR-PRED-004 | **Resource Demand Forecasting** | P1 | Predict personnel/vehicle requirements by station for upcoming period based on crime predictions + events |
| FR-PRED-005 | **Seasonal Pattern Detection** | P1 | Identify seasonal crime trends: festival-season burglaries, summer-evening assaults, exam-season suicides |
| FR-PRED-006 | **Anomaly Detection** | P1 | Detect statistical anomalies in crime data: sudden spikes, unusual locations, unexpected crime types; auto-alert |
| FR-PRED-007 | **Case Duration Prediction** | P2 | Predict estimated investigation duration based on: crime type, evidence availability, IO workload, historical clearing times |
| FR-PRED-008 | **Crime Displacement Modeling** | P2 | Model how crime shifts when enforcement increases in one area — predict displacement patterns |
| FR-PRED-009 | **Bail Violation Prediction** | P2 | Score bail recipients for violation probability; prioritize monitoring resources |
| FR-PRED-010 | **Model Performance Monitoring** | P0 | Track prediction accuracy (precision, recall, F1) for all models; automated drift detection; retraining triggers |
| FR-PRED-011 | **Fairness & Bias Auditing** | P0 | Regular bias audits on all predictive models; ensure no discrimination by caste, religion, gender; audit reports for oversight committees |
| FR-PRED-012 | **What-If Simulation** | P2 | Simulate scenarios: "What if we add 20 constables to Division X?" — model predicted impact on crime rates |
| FR-PRED-013 | **Early Warning System** | P1 | Composite early warning index combining multiple signals: crime rate acceleration, social media sentiment, event risk, weather |
| FR-PRED-014 | **Prediction Explainability** | P0 | All predictions must include human-readable explanations: "This hotspot was predicted because: 40% historical pattern + 30% festival proximity + 30% recent spike" |
| FR-PRED-015 | **Feedback Loop** | P0 | Officers can confirm/reject predictions; feedback ingested into model retraining pipeline; accuracy improves over time |

## 6.6 Reporting & Intelligence (FR-RPT)

| Req ID | Requirement | Priority | Description |
|--------|-------------|----------|-------------|
| FR-RPT-001 | **Daily Station Brief** | P0 | Auto-generated daily report per station: FIRs registered, arrests, pending cases, alerts, predictions for next 24h |
| FR-RPT-002 | **District Crime Summary** | P0 | Weekly/monthly district-level crime summary: trends, comparisons, hotspots, top crime types, performance KPIs |
| FR-RPT-003 | **State Crime Dashboard** | P0 | Real-time statewide dashboard: total FIRs, arrests, chargesheet rate, clearance rate, district comparison |
| FR-RPT-004 | **NCRB Annual Return** | P1 | Auto-generate NCRB "Crime in India" format tables from CaseMaster + linked entities; export-ready |
| FR-RPT-005 | **Custom Report Builder** | P1 | Drag-and-drop report builder: select dimensions (time, geography, crime type), measures (count, rate, trend), filters |
| FR-RPT-006 | **Scheduled Reports** | P1 | Schedule reports at any frequency (daily/weekly/monthly); auto-email to configured recipients via Catalyst Mail |
| FR-RPT-007 | **AI Intelligence Brief** | P1 | Gemini 2.5-generated narrative intelligence brief: highlights emerging threats, unusual patterns, recommended actions |
| FR-RPT-008 | **Comparative Analysis** | P0 | Compare any two time periods, any two geographies, any two crime types — with statistical significance testing |
| FR-RPT-009 | **Case Pendency Report** | P0 | Detailed pendency analysis: by station, by IO, by crime type, by age of case; drill-down to individual cases |
| FR-RPT-010 | **Officer Performance Report** | P0 | IO/SHO performance metrics: cases handled, clearance rate, chargesheet timeliness, case quality score |
| FR-RPT-011 | **Crime Trend Forecasting** | P1 | Forward-looking trend projections with confidence intervals; based on Vertex AI time-series models |
| FR-RPT-012 | **Export & Share** | P0 | Export any report/dashboard to: PDF, Excel, CSV, PowerPoint; share via link with access controls |
| FR-RPT-013 | **Real-Time Crime Ticker** | P1 | Live feed of registered FIRs/arrests for command center display; filterable by severity/type/district |
| FR-RPT-014 | **Media Briefing Generator** | P2 | Auto-generate media-safe crime statistics report (anonymized, aggregated) for press briefings |
| FR-RPT-015 | **Inter-District Intel Sharing** | P1 | Structured intelligence sharing between districts: MO alerts, wanted person updates, trend warnings |
| FR-RPT-016 | **Audit Reports** | P0 | System usage audit: who accessed what data, when, from where; RBAC compliance reports; data access anomaly detection |

## 6.7 Administration (FR-ADM)

| Req ID | Requirement | Priority | Description |
|--------|-------------|----------|-------------|
| FR-ADM-001 | **User Management** | P0 | CRUD for system users linked to Employee table (EmployeeID, KGID); role assignment per Rank/Designation hierarchy |
| FR-ADM-002 | **Role Management** | P0 | RBAC role definitions mapping to Rank (Constable→DGP) and Designation (SHO, IO, Analyst); dynamic permission sets |
| FR-ADM-003 | **Organization Hierarchy** | P0 | Manage Unit hierarchy (Unit.ParentUnit self-reference): Beat → Station → Circle → Sub-Division → District → Range → Zone → State |
| FR-ADM-004 | **Master Data Management** | P0 | CRUD for all reference tables: Act, Section, CrimeHead, CrimeSubHead, CaseCategory, GravityOffence, CaseStatusMaster, Rank, Designation, UnitType |
| FR-ADM-005 | **Employee Transfer Management** | P1 | Handle officer transfers between units: update Unit.UnitID, District.DistrictID; reassign active cases; audit trail |
| FR-ADM-006 | **Court Master Management** | P0 | Manage court records: CourtID, CourtName, DistrictID, StateID, Active status |
| FR-ADM-007 | **Geography Management** | P0 | Manage State → District → Unit hierarchy with active/inactive controls |
| FR-ADM-008 | **System Configuration** | P0 | Configure: alert thresholds, report schedules, API rate limits, feature flags, ML model selection |
| FR-ADM-009 | **Audit Log Management** | P0 | Immutable audit log for all system actions; searchable; retention policy management |
| FR-ADM-010 | **Backup & Recovery** | P0 | Automated backup scheduling; point-in-time recovery; backup verification; disaster recovery drills |
| FR-ADM-011 | **Data Archival** | P1 | Automated archival of cases older than configurable period (e.g., 10 years) to cold storage (S3/Stratus) with retrieval capability |

## 6.8 Integration (FR-INT)

| Req ID | Requirement | Priority | Description |
|--------|-------------|----------|-------------|
| FR-INT-001 | **CCTNS Integration** | P0 | Bi-directional sync with CCTNS: ingest existing FIRs; push new FIRs back to CCTNS for national visibility |
| FR-INT-002 | **ICJS Integration** | P1 | Connect with ICJS APIs for: court case status, prosecution updates, prison information, forensic results |
| FR-INT-003 | **NCRB Data Submission** | P1 | Automated NCRB format export; API-based submission where available; Excel export as fallback |
| FR-INT-004 | **Aadhaar Verification** | P2 | Aadhaar-based identity verification for accused/complainant (with legal authorization and consent) |
| FR-INT-005 | **SMS Gateway** | P0 | Integration with NIC/CDAC SMS gateway for: FIR acknowledgment, court date reminders, alert delivery |
| FR-INT-006 | **Email Integration** | P0 | Catalyst Mail for: automated reports, alert notifications, inter-agency communications |
| FR-INT-007 | **GIS Data Sources** | P1 | Ingest: OpenStreetMap, Survey of India boundaries, census data, municipal corporation boundaries |
| FR-INT-008 | **Weather Data** | P2 | Ingest weather forecasts for crime prediction model features |
| FR-INT-009 | **Forensic Lab Integration** | P1 | Digital evidence submission/result retrieval with Karnataka FSL LIMS |
| FR-INT-010 | **Inter-State Police API** | P2 | Standardized API for sharing: wanted persons, MO alerts, criminal records with other state police platforms |
| FR-INT-011 | **DigiLocker Integration** | P2 | Verify identity documents, retrieve digitally-signed certificates for accused/complainant verification |

## 6.9 Mobile (FR-MOB)

| Req ID | Requirement | Priority | Description |
|--------|-------------|----------|-------------|
| FR-MOB-001 | **PWA Architecture** | P0 | Progressive Web App accessible via mobile browser; installable; supports push notifications |
| FR-MOB-002 | **Offline Capability** | P0 | Core functions (FIR registration, record check, evidence capture) available offline with IndexedDB storage |
| FR-MOB-003 | **Auto-Sync** | P0 | Background sync when connectivity restored; conflict resolution for concurrent edits; sync status indicator |
| FR-MOB-004 | **GPS Auto-Capture** | P0 | Automatic GPS coordinate capture for: FIR location, patrol tracking, evidence geo-tagging |
| FR-MOB-005 | **Camera Integration** | P0 | In-app photo/video capture; auto-compress; geo-tag + timestamp; upload to Catalyst Stratus |
| FR-MOB-006 | **Biometric Authentication** | P0 | Fingerprint/face unlock for mobile access; session timeout after inactivity |
| FR-MOB-007 | **Push Notifications** | P0 | Real-time alerts: wanted person in area, case assignment, chargesheet deadline, court date reminder |
| FR-MOB-008 | **Criminal Record Quick Check** | P0 | Name/photo-based criminal record search with sub-3-second response on 4G; results cached locally |
| FR-MOB-009 | **Patrol Tracking** | P0 | GPS-based patrol route recording; checkpoint logging; auto-generated patrol report |
| FR-MOB-010 | **Responsive Design** | P0 | Optimal experience on: smartphone (primary), tablet (secondary), laptop (tertiary) |
| FR-MOB-011 | **Low Bandwidth Mode** | P1 | Compressed data transfer; text-first UI; image lazy-loading; functional on 2G/3G networks |
| FR-MOB-012 | **Emergency SOS** | P1 | One-tap SOS button for officers; sends GPS location + audio recording to control room |

---

# 7. Non-Functional Requirements & Enterprise Quality Attributes

## 7.1 Availability

> **Target: 99.99% uptime (52.6 minutes max unplanned downtime per year)**

| Attribute | Specification | Rationale |
|-----------|---------------|-----------|
| **Uptime SLA** | 99.99% (Four Nines) | Law enforcement cannot tolerate extended outages — crimes don't stop during downtime |
| **RPO (Recovery Point Objective)** | 1 minute (OLTP), 15 minutes (Analytics) | Maximum acceptable data loss; OLTP requires near-zero data loss for FIR integrity |
| **RTO (Recovery Time Objective)** | 5 minutes (core services), 30 minutes (analytics) | Maximum time to restore service after failure |
| **Planned Maintenance Window** | Zero-downtime deployments required | Blue-green deployments via Catalyst Pipelines; rolling updates for AppSail |
| **Geographic Redundancy** | Primary: Zoho India DC (Chennai), Secondary: Zoho India DC (Mumbai equivalent) | Both within India for data sovereignty compliance |

### Failover Architecture

```
┌───────────────────────────────────────────────────────────────────────┐
│                    MULTI-REGION FAILOVER DESIGN                      │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│   ┌─────────────────────────┐    ┌─────────────────────────┐         │
│   │    PRIMARY REGION       │    │   SECONDARY REGION      │         │
│   │    (Zoho India DC-1)    │    │   (Zoho India DC-2)     │         │
│   │                         │    │                         │         │
│   │ ┌─────────────────────┐ │    │ ┌─────────────────────┐ │         │
│   │ │ Catalyst AppSail    │─┼──┐ │ │ Catalyst AppSail    │ │         │
│   │ │ (Active)            │ │  │ │ │ (Standby/Active)    │ │         │
│   │ └─────────────────────┘ │  │ │ └─────────────────────┘ │         │
│   │ ┌─────────────────────┐ │  │ │ ┌─────────────────────┐ │         │
│   │ │ Catalyst DataStore  │─┼──┼─┼─│ Replica DataStore   │ │         │
│   │ │ (Primary Write)     │ │  │ │ │ (Read Replica)      │ │         │
│   │ └─────────────────────┘ │  │ │ └─────────────────────┘ │         │
│   │ ┌─────────────────────┐ │  │ │ ┌─────────────────────┐ │         │
│   │ │ Catalyst Cache      │ │  │ │ │ Catalyst Cache      │ │         │
│   │ │ (Active)            │ │  │ │ │ (Warm standby)      │ │         │
│   │ └─────────────────────┘ │  │ │ └─────────────────────┘ │         │
│   └─────────────────────────┘  │ └─────────────────────────┘         │
│                                │                                      │
│   Replication: Synchronous for DataStore, Async for Analytics        │
│   Failover: Automatic (<5 min) via health check + DNS switch         │
│   Fallback: Manual failback after root cause analysis                │
│                                                                       │
│   External Services Redundancy:                                      │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│   │ Neo4j Aura   │  │ Elastic Cloud│  │ Pinecone     │              │
│   │ (Multi-AZ)   │  │ (Multi-AZ)   │  │ (Multi-AZ)   │              │
│   │ Auto-failover│  │ Auto-failover│  │ Auto-failover│              │
│   └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                       │
│   Kafka (Confluent): Multi-broker, replication factor 3              │
│   Databricks: Multi-AZ compute, S3 storage with cross-region copy   │
│   Vertex AI: Multi-region endpoints, model redundancy                │
└───────────────────────────────────────────────────────────────────────┘
```

### Availability Decision Record

| Decision | Rationale | Trade-off |
|----------|-----------|-----------|
| Active-Passive with auto-failover (not Active-Active) | Active-Active adds significant complexity for conflict resolution across regions; law enforcement data has strong consistency requirements | Higher RTO (5 min vs. ~0) but much simpler operational model |
| Synchronous replication for OLTP | FIR data cannot tolerate loss — a registered FIR is a legal document | Higher write latency (~10-20ms added) but guaranteed durability |
| Async replication for analytics | Analytics can tolerate slight staleness (15-min lag acceptable) | Small data staleness risk vs. significantly lower cost and complexity |

---

## 7.2 Scalability

> **Target: 1M concurrent users, 100M+ records, 100TB+ data, linear horizontal scaling**

| Dimension | Current Target | Year 1 | Year 3 | Year 5 |
|-----------|---------------|--------|--------|--------|
| **Concurrent Users** | — | 50,000 | 250,000 | 1,000,000 |
| **Total Crime Records** | ~15M (CCTNS) | 20M | 60M | 100M+ |
| **Daily FIR Ingestion** | ~550/day (Karnataka) | 1,000/day | 5,000/day (multi-state) | 20,000/day |
| **Total Data Volume** | ~5TB | 15TB | 50TB | 100TB+ |
| **API Requests/Second** | — | 5,000 | 20,000 | 100,000 |
| **Graph Edges** | — | 50M | 200M | 1B+ |
| **Search Index Size** | — | 10GB | 50GB | 200GB+ |
| **ML Predictions/Day** | — | 100K | 1M | 10M |

### Horizontal Scaling Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                    HORIZONTAL SCALING ARCHITECTURE                     │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  TIER 1: API & Application (Scale-Out)                                │
│  ┌────────────────────────────────────────────────────┐               │
│  │  Catalyst AppSail: Auto-scale 2–50 instances       │               │
│  │  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐     ┌──┐ ┌──┐ ┌──┐    │               │
│  │  │A1│ │A2│ │A3│ │A4│ │A5│ ... │An│ │An│ │An│    │               │
│  │  └──┘ └──┘ └──┘ └──┘ └──┘     └──┘ └──┘ └──┘    │               │
│  │  Scale trigger: CPU >70% OR Response Time >500ms   │               │
│  │  Scale factor: +2 instances per trigger             │               │
│  └────────────────────────────────────────────────────┘               │
│                                                                        │
│  TIER 2: Event Processing (Scale-Out)                                 │
│  ┌────────────────────────────────────────────────────┐               │
│  │  Kafka (Confluent): Partition-based scaling         │               │
│  │  FIR Events:    12 partitions → 48 partitions       │               │
│  │  Alert Events:  6 partitions  → 24 partitions       │               │
│  │  ML Events:     6 partitions  → 24 partitions       │               │
│  │  Scale trigger: Consumer lag >10,000 messages       │               │
│  └────────────────────────────────────────────────────┘               │
│                                                                        │
│  TIER 3: Data (Scale-Up + Scale-Out)                                  │
│  ┌────────────────────────────────────────────────────┐               │
│  │  Catalyst DataStore: Vertical scaling + read        │               │
│  │    replicas (scale-up primary, scale-out reads)     │               │
│  │  Neo4j Aura: Vertical (memory) + read replicas     │               │
│  │  Elasticsearch: Horizontal shard scaling            │               │
│  │    3 nodes → 9 nodes → 27 nodes                     │               │
│  │  Pinecone: Auto-scaling pods                        │               │
│  │  Databricks: Auto-scaling compute clusters          │               │
│  └────────────────────────────────────────────────────┘               │
│                                                                        │
│  TIER 4: Cache (Scale-Out)                                            │
│  ┌────────────────────────────────────────────────────┐               │
│  │  Catalyst Cache: Sharded across instances           │               │
│  │  Redis (ElastiCache): Cluster mode, 3→12 shards    │               │
│  │  Hit rate target: >85% (alerts if <70%)             │               │
│  └────────────────────────────────────────────────────┘               │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### Elasticity Targets

| Metric | Scale-Up Trigger | Scale-Down Trigger | Scale Increment | Cool-Down |
|--------|-----------------|-------------------|-----------------|-----------|
| AppSail CPU | >70% for 3 min | <30% for 15 min | +2 instances | 5 min |
| AppSail Memory | >80% | <40% | +2 instances | 5 min |
| Kafka Consumer Lag | >10K messages | <1K for 10 min | +1 consumer/partition | 10 min |
| Elasticsearch Query Latency | p95 >500ms | p95 <100ms for 30 min | +1 shard replica | 15 min |
| Databricks Cluster | Job queue >5 | Queue empty 20 min | +2 worker nodes | 10 min |

---

## 7.3 Reliability

| Metric | Target | Measurement |
|--------|--------|-------------|
| **MTBF (Mean Time Between Failures)** | >720 hours (30 days) | Calendar time between P1/P2 incidents |
| **MTTR (Mean Time to Recovery)** | <15 minutes | Time from detection to service restoration |
| **Error Budget** | 0.01% per month (4.32 min) | Allocated downtime budget from 99.99% SLA |
| **Error Rate (Application)** | <0.1% of requests | 5xx errors / total requests |
| **Data Durability** | 99.999999999% (11 nines) | Probability of data preservation |
| **Retry Success Rate** | >95% on first retry | Transient failures recovered by retry |
| **Circuit Breaker Recovery** | <30 seconds | Time for circuit breaker to transition from Open to Half-Open |

### Error Budget Policy

```
Error Budget Remaining (Monthly):

100% ████████████████████████████████████████  4.32 min available
 75% ██████████████████████████████░░░░░░░░░░  3.24 min remaining → normal operations
 50% ████████████████████░░░░░░░░░░░░░░░░░░░░  2.16 min remaining → slow down deployments
 25% ██████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  1.08 min remaining → freeze all changes
  0% ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  BUDGET EXHAUSTED → emergency protocol

Actions when budget is exhausted:
1. All non-critical deployments frozen
2. Engineering focus shifts 100% to reliability
3. Post-incident review for every P1/P2 incident
4. SRE team has veto power on all changes
5. Budget resets at month start
```

### Failure Mode Analysis

| Failure Mode | Probability | Impact | Detection | Mitigation | Recovery |
|-------------|-------------|--------|-----------|------------|----------|
| Catalyst DataStore outage | Low | Critical | Health check (10s) | Failover to replica | Auto (<5min) |
| Neo4j Aura unavailable | Low | High | Connection pool monitor | Degrade graph features; serve cached results | Auto (Aura HA) |
| Elasticsearch cluster failure | Low | High | Cluster health API | Serve from cache; queue new writes | Manual (30min) |
| Kafka broker failure | Medium | Medium | Broker health monitor | Replica brokers take over; producer retry | Auto (<1min) |
| Vertex AI API throttling | Medium | Medium | 429 response codes | Fallback to OpenAI GPT-4o; queue non-urgent | Auto (immediate) |
| Pinecone unavailable | Low | Medium | Health check | Fall back to Elasticsearch keyword search | Auto |
| Network partition | Low | Critical | Cross-zone ping | DNS failover to secondary region | Auto (<5min) |
| DDoS attack | Medium | High | Datadog traffic anomaly | Kong rate limiting + CDN WAF | Auto (2min) |

---

## 7.4 Performance

### Latency Budgets per Operation

| Operation | p50 Target | p95 Target | p99 Target | Max Acceptable |
|-----------|------------|------------|------------|----------------|
| **FIR Registration (Save)** | 200ms | 500ms | 1s | 3s |
| **FIR Search (Keyword)** | 100ms | 300ms | 500ms | 1s |
| **FIR Search (Semantic)** | 200ms | 500ms | 1s | 2s |
| **Criminal Record Lookup** | 150ms | 400ms | 800ms | 1.5s |
| **Graph Traversal (2-hop)** | 200ms | 500ms | 1s | 2s |
| **Graph Traversal (3-hop)** | 500ms | 1.5s | 3s | 5s |
| **Dashboard Load** | 500ms | 1.5s | 3s | 5s |
| **Crime Map Render** | 300ms | 800ms | 1.5s | 3s |
| **AI Classification** | 500ms | 1s | 2s | 5s |
| **Report Generation** | 2s | 5s | 10s | 30s |
| **Chargesheet Draft (AI)** | 5s | 15s | 30s | 60s |
| **Hotspot Prediction** | 1s | 3s | 5s | 10s |
| **Login/Auth** | 200ms | 500ms | 1s | 2s |
| **Mobile Sync** | 1s | 3s | 5s | 10s |

### Latency Budget Breakdown Example — FIR Search (500ms p95)

```
┌─────────────────────────────────────────────────────────────┐
│          FIR SEARCH LATENCY BUDGET (p95 = 500ms)           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐                                           │
│  │ API Gateway  │  20ms  ████                              │
│  │ (Kong)       │                                          │
│  └──────┬──────┘                                           │
│         │                                                   │
│  ┌──────▼──────┐                                           │
│  │ Auth Check  │  30ms  ██████                             │
│  │ (Catalyst)  │                                           │
│  └──────┬──────┘                                           │
│         │                                                   │
│  ┌──────▼──────┐                                           │
│  │ Request     │  20ms  ████                               │
│  │ Parsing     │                                           │
│  └──────┬──────┘                                           │
│         │                                                   │
│  ┌──────▼──────┐                                           │
│  │ Cache Check │  10ms  ██                                 │
│  │ (Catalyst)  │ (hit → skip ES)                           │
│  └──────┬──────┘                                           │
│         │ (miss)                                            │
│  ┌──────▼──────┐                                           │
│  │ Elastic     │  250ms █████████████████████████████████   │
│  │ Search Query│                                           │
│  └──────┬──────┘                                           │
│         │                                                   │
│  ┌──────▼──────┐                                           │
│  │ RBAC Filter │  50ms  ██████████                         │
│  │ + Transform │                                           │
│  └──────┬──────┘                                           │
│         │                                                   │
│  ┌──────▼──────┐                                           │
│  │ Serialize   │  20ms  ████                               │
│  │ + Respond   │                                           │
│  └──────┬──────┘                                           │
│         │                                                   │
│  ┌──────▼──────┐                                           │
│  │ Network     │  100ms ████████████████████               │
│  │ Transit     │                                           │
│  └─────────────┘                                           │
│                                                             │
│  TOTAL: 20+30+20+10+250+50+20+100 = 500ms                 │
│  Biggest budget: Elasticsearch (50%) → optimize queries    │
└─────────────────────────────────────────────────────────────┘
```

### Throughput Targets

| System Component | Sustained Throughput | Peak Throughput | Burst Duration |
|-----------------|---------------------|-----------------|----------------|
| API Gateway | 5,000 req/s | 20,000 req/s | 15 min |
| Catalyst AppSail | 3,000 req/s per instance | 5,000 req/s per instance | 10 min |
| Catalyst DataStore | 10,000 reads/s, 2,000 writes/s | 30,000 reads/s, 5,000 writes/s | 5 min |
| Elasticsearch | 2,000 queries/s | 8,000 queries/s | 10 min |
| Neo4j Aura | 1,000 traversals/s | 3,000 traversals/s | 5 min |
| Kafka Ingestion | 50,000 events/s | 200,000 events/s | 30 min |
| Vertex AI Inference | 100 req/s | 500 req/s | 5 min |

---

## 7.5 Maintainability

| Attribute | Target | Measurement |
|-----------|--------|-------------|
| **Code Coverage** | >80% unit, >60% integration | SonarQube / Jest coverage reports |
| **Cyclomatic Complexity** | <15 per function | ESLint + SonarQube analysis |
| **Documentation Coverage** | 100% API docs, >80% code docs | Swagger/OpenAPI completeness; JSDoc coverage |
| **Technical Debt Ratio** | <5% (SonarQube) | Debt remediation cost / development cost |
| **Mean Time to Onboard Developer** | <2 weeks | Time from joining to first production commit |
| **Deployment Frequency** | Daily (non-breaking); weekly (breaking) | CI/CD pipeline metrics |
| **Change Failure Rate** | <5% | Failed deployments / total deployments |
| **Mean Lead Time for Changes** | <4 hours (hotfix); <5 days (feature) | Time from commit to production |

### Code Quality Standards

- **Language Standards**: TypeScript strict mode (React frontend); TypeScript/Node.js (Catalyst Functions/AppSail); Python 3.11+ (ML pipelines)
- **API Standard**: OpenAPI 3.1 specification for all REST APIs; GraphQL schema for complex queries
- **Naming Conventions**: PascalCase for components/types; camelCase for variables/functions; SCREAMING_SNAKE for constants
- **Review Policy**: Minimum 2 reviewers for all PRs; 1 must be senior engineer; security-sensitive changes require security team review
- **Testing Pyramid**: 70% unit tests, 20% integration tests, 10% E2E tests
- **Dependency Management**: Automated vulnerability scanning (Snyk/Dependabot); no dependencies with known CVEs in production

---

## 7.6 Security

### Compliance Frameworks

| Framework | Applicability | Compliance Level |
|-----------|--------------|-----------------|
| **IT Act 2000 (India)** | Mandatory — Indian cyber law | Full compliance |
| **DPDP Act 2023** | Mandatory — Indian data protection | Full compliance |
| **CJIS Security Policy (India equivalent)** | Reference — criminal justice data standards | Adopted and adapted |
| **ISO 27001:2022** | Target certification (Year 2) | Implementing |
| **SOC 2 Type II** | Target for platform offering | Year 3 |
| **OWASP Top 10** | Mandatory — web application security | Continuous scanning |

### Encryption Standards

```
┌──────────────────────────────────────────────────────────────────────┐
│                    DATA ENCRYPTION FRAMEWORK                        │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  DATA AT REST                                                       │
│  ├── Catalyst DataStore: AES-256 (platform-managed keys)            │
│  ├── Catalyst Stratus: AES-256 (platform-managed keys)              │
│  ├── Neo4j Aura: AES-256 (managed encryption)                      │
│  ├── Elasticsearch: AES-256 (Elastic managed)                       │
│  ├── Pinecone: AES-256 (vendor managed)                             │
│  ├── Databricks: AES-256 (customer-managed keys via KMS)            │
│  └── Backups: AES-256 with separate key hierarchy                   │
│                                                                      │
│  DATA IN TRANSIT                                                    │
│  ├── External: TLS 1.3 (minimum TLS 1.2); HSTS enforced            │
│  ├── Internal (service-to-service): mTLS where supported            │
│  ├── Database connections: TLS 1.2+ with certificate pinning        │
│  └── Kafka: TLS + SASL authentication                               │
│                                                                      │
│  DATA IN USE                                                        │
│  ├── PII fields: Application-level encryption (AES-256-GCM)        │
│  │   Encrypted: AadhaarNumber, PhoneNumber, BiometricData           │
│  ├── Key management: Zoho Catalyst KMS (primary)                    │
│  │   Rotation: 90-day automatic rotation                            │
│  └── Access: Zero-trust — every request authenticated & authorized  │
│                                                                      │
│  SENSITIVE DATA CLASSIFICATION                                      │
│  ├── TOP SECRET: Investigation notes, witness identity,             │
│  │   informant data — encrypted + field-level access control        │
│  ├── SECRET: Accused details, FIR BriefFacts, arrest records        │
│  │   — encrypted at rest + RBAC                                     │
│  ├── CONFIDENTIAL: Crime statistics, officer assignments            │
│  │   — standard encryption + role-based access                      │
│  └── PUBLIC: Aggregated anonymized statistics, crime heatmaps       │
│      — no encryption needed; anonymization enforced                  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Authentication & Authorization

- **Authentication**: Catalyst Authentication (primary) — multi-factor for all officers above Inspector rank; biometric for mobile; session timeout 30min (configurable by role)
- **Authorization**: Custom RBAC + ABAC engine
  - **RBAC**: Role derived from Employee.RankID + Employee.DesignationID + Unit.UnitID
  - **ABAC**: Attribute-based rules — e.g., "IO can only access cases assigned to them"; "SP can access all cases in their DistrictID"; "SCRB Analyst can access statewide but only statistical views"
  - **Row-Level Security**: Catalyst DataStore queries automatically filtered by user's Unit hierarchy (Beat → Station → Circle → District → State)
- **API Security**: OAuth 2.0 + JWT tokens; API key rotation every 90 days; rate limiting per client; request signing for inter-service communication

---

## 7.7 Extensibility

### API-First Architecture

Every platform capability is exposed as an API before it becomes a UI feature. The API is the product; the UI is one of many consumers.

| API Layer | Technology | Specification |
|-----------|-----------|---------------|
| **External API** | Kong API Gateway | OpenAPI 3.1, versioned (v1, v2), rate-limited |
| **Internal API** | Catalyst API Gateway | gRPC for inter-service, REST for Functions |
| **GraphQL** | Catalyst AppSail (Apollo Server) | Schema-first, for complex queries (dashboards, reports) |
| **Webhook** | Catalyst Signals | Event-driven notifications to external systems |
| **Streaming** | Kafka (Confluent) | Topic-based event streams for real-time consumers |

### Plugin Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                      PLUGIN ARCHITECTURE                             │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  CORE PLATFORM (Immutable)                                          │
│  ├── FIR Management Engine                                          │
│  ├── Authentication & Authorization                                  │
│  ├── Event Bus (Signals + Kafka)                                    │
│  ├── Search Engine (Elasticsearch)                                   │
│  └── Data Store (Catalyst DataStore)                                │
│                                                                      │
│  PLUGIN INTERFACES                                                   │
│  ├── Crime Classification Plugin (swap ML model)                    │
│  ├── Search Provider Plugin (swap search engine)                    │
│  ├── Notification Plugin (SMS/Email/WhatsApp/push)                  │
│  ├── GIS Provider Plugin (swap map provider)                        │
│  ├── LLM Provider Plugin (swap AI model)                            │
│  ├── Export Plugin (PDF/Excel/CSV/API format)                       │
│  ├── Integration Plugin (CCTNS/ICJS/NCRB adapters)                 │
│  └── Analytics Plugin (custom visualizations)                       │
│                                                                      │
│  EXTENSION MECHANISM                                                │
│  ├── Catalyst Functions: Deploy custom serverless logic              │
│  ├── Catalyst Circuits: Custom workflow definitions                  │
│  ├── Kong Plugins: Custom API middleware                             │
│  └── Kafka Consumers: Custom event processors                       │
│                                                                      │
│  THIRD-PARTY INTEGRATION SDK                                        │
│  ├── REST API Client Libraries (Python, Java, JavaScript)           │
│  ├── Webhook Receiver Templates                                     │
│  ├── Event Schema Registry (Avro/JSON Schema)                       │
│  └── Sandbox Environment for integration testing                    │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Extensibility Decision Record

| Decision | Rationale |
|----------|-----------|
| **Plugin interface for LLM providers** | AI landscape evolves rapidly; must be able to swap Gemini 2.5 for future models without code changes |
| **Event schema versioning** | External consumers depend on event formats; schema evolution must be backward-compatible |
| **Catalyst Functions for custom logic** | State-specific customizations (e.g., UP Police has different FIR format) deployed as Functions without modifying core |

---

## 7.8 Compliance

### Regulatory Compliance Matrix

| Regulation | Requirement | Implementation | Verification |
|-----------|-------------|----------------|-------------|
| **IT Act 2000, Section 43A** | Reasonable security practices for sensitive personal data | AES-256 encryption, access controls, audit logs | Annual audit by CERT-In empaneled auditor |
| **IT Act 2000, Section 69** | Government interception capability | Authorized interception API with judicial order validation | Legal team review per request |
| **DPDP Act 2023** | Data principal rights: access, correction, erasure | Self-service data access portal; correction workflow; anonymization pipeline | Quarterly DPA compliance review |
| **DPDP Act 2023** | Data localization | All primary data in Indian data centers (Zoho India DC) | Architecture review; no international data transfer |
| **Evidence Act / BSA 2023** | Digital evidence admissibility (Section 65B certificate) | Automated Section 65B certificate generation with hash verification | Legal team validation |
| **BNS/BNSS 2023** | New criminal code requirements | Updated FIR/chargesheet formats; new section mappings; timeline adjustments | Legal compliance module |
| **RTI Act 2005** | Right to Information responses | RTI module with automated data extraction (anonymized) | RTI compliance officer review |
| **SC/ST (PoA) Act** | Mandatory registration and tracking | Auto-flagging of cases under PoA Act; escalation to SP; separate tracking register | Automated compliance report |
| **POCSO Act** | Special procedures for child victims | Age-based auto-detection; special investigation workflow; sealed records | Automatic workflow enforcement |

### Data Sovereignty Architecture

- **Rule**: Zero law enforcement data leaves Indian jurisdiction at any time
- **Implementation**: All Zoho Catalyst services configured for India DC; Neo4j Aura deployed in GCP Mumbai (asia-south1); Elasticsearch in Elastic Cloud Mumbai; Pinecone in GCP Mumbai; Databricks in Azure Central India
- **Verification**: Monthly automated check that no data flows to international endpoints; network egress monitoring via Datadog
- **Exception Process**: International data sharing (Interpol/MLAT) requires: Home Secretary approval + Judicial order + encrypted transfer via designated secure channel

---

## 7.9 Observability

### Golden Signals Monitoring

| Signal | Definition | SLI | SLO | Alert Threshold |
|--------|-----------|-----|-----|-----------------|
| **Latency** | Time to serve a request | p95 response time by endpoint | <500ms for reads, <1s for writes | p95 >1s for >5 min |
| **Traffic** | Request rate | Requests per second by service | Baseline ± 3 standard deviations | >3σ deviation for >10 min |
| **Errors** | Failed request rate | 5xx errors / total requests | <0.1% | >0.5% for >2 min |
| **Saturation** | Resource utilization | CPU, Memory, Disk, Connections | CPU <70%, Memory <80%, Disk <85% | Any resource >90% |

### Observability Stack

```
┌───────────────────────────────────────────────────────────────────────┐
│                    OBSERVABILITY ARCHITECTURE                        │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  COLLECTION LAYER                                                    │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────────┐ │
│  │ Catalyst Native  │  │ Datadog Agent    │  │ OpenTelemetry      │ │
│  │ Monitoring       │  │ (APM + Logs)     │  │ Collector          │ │
│  │ • Function logs  │  │ • Custom metrics │  │ • Distributed      │ │
│  │ • AppSail health │  │ • APM traces     │  │   tracing (all     │ │
│  │ • DataStore perf │  │ • Log aggregation│  │   services)        │ │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬───────────┘ │
│           │                     │                      │             │
│           ▼                     ▼                      ▼             │
│  ANALYSIS LAYER                                                      │
│  ┌──────────────────────────────────────────────────────────────────┐│
│  │                     DATADOG PLATFORM                             ││
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐    ││
│  │  │ Metrics  │  │ Traces   │  │ Logs     │  │ Synthetics   │    ││
│  │  │Dashboard │  │ (APM)    │  │ Explorer │  │ (Uptime)     │    ││
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────┘    ││
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐    ││
│  │  │ Anomaly  │  │ SLO      │  │ Error    │  │ Real User    │    ││
│  │  │Detection │  │ Tracking │  │ Tracking │  │ Monitoring   │    ││
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────┘    ││
│  COLLECTION LAYER                                                     │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────────┐   │
│  │ Catalyst Native  │  │ Datadog Agent    │  │ OpenTelemetry      │   │
│  │ Monitoring       │  │ (APM + Logs)     │  │ Collector          │   │
│  │ • Function logs  │  │ • Custom metrics │  │ • Distributed      │   │
│  │ • AppSail health │  │ • APM traces     │  │   tracing (all     │   │
│  │ • DataStore perf │  │ • Log aggregation│  │   services)        │   │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬───────────┘   │
│           │                     │                      │              │
│           ▼                     ▼                      ▼              │
│  ANALYSIS LAYER                                                       │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │                     DATADOG PLATFORM                             │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐    │ │
│  │  │ Metrics  │  │ Traces   │  │ Logs     │  │ Synthetics   │    │ │
│  │  │Dashboard │  │ (APM)    │  │ Explorer │  │ (Uptime)     │    │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────┘    │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐    │ │
│  │  │ Anomaly  │  │ SLO      │  │ Error    │  │ Real User    │    │ │
│  │  │Detection │  │ Tracking │  │ Tracking │  │ Monitoring   │    │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────┘    │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ALERTING & RESPONSE                                                  │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  P1 (Critical): PagerDuty → SRE On-Call → 15 min response        │ │
│  │  P2 (High):     Slack #ksp-ai-alerts ──► 1 hr response           │ │
│  │  P3 (Medium):   Jira ticket auto-created → next business day     │ │
│  │  P4 (Low):      Logged for weekly review                         │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

### SLO Definitions

| Service | SLI | SLO | Window | Error Budget |
|---------|-----|-----|--------|-------------|
| FIR Registration API | Successful registrations / Total attempts | 99.99% | 30-day rolling | 4.32 min/month |
| Search API | Queries completing <500ms / Total queries | 99.9% | 30-day rolling | 43.2 min/month |
| Dashboard API | Pages loading <3s / Total page loads | 99.5% | 30-day rolling | 3.6 hrs/month |
| Graph Query API | Queries completing <2s / Total queries | 99.9% | 30-day rolling | 43.2 min/month |
| AI Classification | Correct classifications / Total classifications | 92% (Y1) | 30-day rolling | N/A (accuracy) |
| Mobile Sync | Successful syncs / Total sync attempts | 99.5% | 7-day rolling | 50.4 min/week |
| Alert Delivery | Alerts delivered <30s / Total alerts | 99.9% | 30-day rolling | 43.2 min/month |

### Distributed Tracing

Every request receives a unique trace ID that follows the request through all services:

```
Trace ID: 7a8b9c0d-1234-5678-abcd-ef0123456789

User Request (POST /api/v1/fir)
  │
  ├── Kong API Gateway [2ms]
  │     └── Rate limit check, auth header validation
  ├── Catalyst Auth [28ms]
  │     └── JWT validation, RBAC resolution
  ├── Catalyst AppSail — FIR Service [145ms]
  │     ├── Request validation [12ms]
  │     ├── Catalyst DataStore — Write FIR [85ms]
  │     ├── Catalyst Cache — Invalidate [8ms]
  │     └── Catalyst Signals — Emit FIR_CREATED [40ms]
  │           ├── Kafka → Classification Consumer [async]
  │           ├── Kafka → Graph Update Consumer [async]
  │           ├── Kafka → Search Index Consumer [async]
  │           └── Kafka → Alert Evaluator Consumer [async]
  └── Response to client [175ms total]
```

---

## 7.10 Fault Tolerance

### Blast Radius Containment

| Failure Domain | Blast Radius | Containment Strategy |
|---------------|-------------|---------------------|
| Single Catalyst Function | 1 feature degraded | Function-level circuit breaker; sibling functions unaffected |
| Catalyst AppSail instance | 1/N capacity reduction | Load balancer removes unhealthy instance; auto-replace in 60s |
| Neo4j Aura outage | Graph features unavailable | Graceful degradation — serve cached graph data; disable network visualization; FIR/search unaffected |
| Elasticsearch cluster failure | Search degraded | Fall back to DataStore direct queries (slower); queue new indexing operations for replay |
| Vertex AI unavailable | AI features degraded | Fall back to OpenAI GPT-4o; if both fail, disable AI features; manual classification fallback |
| Kafka broker failure | Event processing delayed | Multi-broker cluster; replication factor 3; producer retry with backoff |
| Complete region outage | All services affected | Failover to secondary region (<5 min); DNS-based traffic switch |

### Graceful Degradation Hierarchy

```
LEVEL 0: FULLY OPERATIONAL
  All services healthy, all features available
  ↓ (trigger: AI service degradation)
  
LEVEL 1: AI-DEGRADED
  Core CRUD operational; AI classification → manual
  Search → keyword only (no semantic)
  Predictions → last cached predictions shown
  ↓ (trigger: Graph DB degradation)
  
LEVEL 2: INTELLIGENCE-DEGRADED
  FIR CRUD + keyword search operational
  Graph features → disabled with "temporarily unavailable" message
  Dashboards → show cached data with staleness indicator
  ↓ (trigger: Search engine degradation)
  
LEVEL 3: SEARCH-DEGRADED
  FIR CRUD operational (core DataStore only)
  Search → DataStore LIKE queries (slow but functional)
  All advanced features disabled
  ↓ (trigger: Primary DataStore degradation)
  
LEVEL 4: EMERGENCY MODE
  Read-only from cache/replica
  New FIRs queued locally (mobile offline mode)
  Emergency hotline number displayed
  Auto-escalation to SRE + management
  ↓ (trigger: Complete outage)
  
LEVEL 5: OFFLINE
  All traffic redirected to static maintenance page
  Mobile app serves cached data only
  Paper-based fallback procedures activated
  War room protocol engaged
```

### Circuit Breaker Configuration

| Service | Failure Threshold | Open Duration | Half-Open Probes | Fallback |
|---------|-------------------|---------------|------------------|----------|
| Vertex AI API | 5 failures in 30s | 60s | 3 requests | OpenAI GPT-4o |
| Neo4j Aura | 3 failures in 15s | 30s | 2 requests | Cached graph data |
| Elasticsearch | 3 failures in 15s | 30s | 2 requests | DataStore SQL queries |
| Pinecone | 5 failures in 30s | 60s | 3 requests | Elasticsearch keyword |
| External APIs (CCTNS) | 3 failures in 60s | 120s | 1 request | Queue for retry |

---

## 7.11 Cost Optimization

### Cost Per Transaction Targets

| Transaction Type | Target Cost | Current Benchmark | Optimization Lever |
|-----------------|-------------|-------------------|-------------------|
| FIR Registration | ₹0.50 | ₹2.00 (manual labor) | Automation reduces personnel cost |
| Search Query | ₹0.01 | N/A (no existing system) | Cache hit rate >85% reduces ES load |
| Graph Query | ₹0.05 | N/A | Read replicas for read-heavy workloads |
| AI Classification | ₹0.10 | N/A | Batch inference where possible; model distillation |
| Report Generation | ₹1.00 | ₹50 (manual analyst hours) | Template + caching + scheduled generation |
| Push Notification | ₹0.005 | ₹0.10 (SMS) | Push notifications 20x cheaper than SMS |

### Infrastructure Cost Model

```
┌────────────────────────────────────────────────────────────────────────┐
│              MONTHLY INFRASTRUCTURE COST MODEL (Year 1)               │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  Component               │ Monthly Cost (₹)  │ % of Total │ Notes     │
│  ────────────────────────┼───────────────────┼────────────┼────────── │
│  Catalyst Platform       │    8,00,000       │    32%     │ AppSail,  │
│  (AppSail+Functions+     │                   │            │ Functions │
│   DataStore+Cache+       │                   │            │ Signals   │
│   Signals+Auth+Stratus)  │                   │            │           │
│                          │                   │            │           │
│  Neo4j Aura              │    3,50,000       │    14%     │ Pro tier  │
│                          │                   │            │           │
│  Elasticsearch Cloud     │    3,00,000       │    12%     │ 3-node   │
│                          │                   │            │ cluster   │
│                          │                   │            │           │
│  Vertex AI (Gemini 2.5)  │    4,00,000       │    16%     │ Inference │
│                          │                   │            │ + train   │
│                          │                   │            │           │
│  Databricks Lakehouse    │    2,50,000       │    10%     │ DBUs +    │
│                          │                   │            │ storage   │
│                          │                   │            │           │
│  Confluent Kafka         │    1,00,000       │     4%     │ Basic     │
│                          │                   │            │ cluster   │
│                          │                   │            │           │
│  Pinecone                │      75,000       │     3%     │ p1 pods   │
│                          │                   │            │           │
│  Datadog Monitoring      │    1,00,000       │     4%     │ APM+Logs  │
│                          │                   │            │           │
│  Miscellaneous (DNS,     │    1,25,000       │     5%     │           │
│   CDN, SMS, Email)       │                   │            │           │
│  ────────────────────────┼───────────────────┼────────────┼────────── │
│  TOTAL                   │   25,00,000       │   100%     │ ₹25L/mo  │
│                          │                   │            │ ₹3Cr/yr  │
│                                                                        │
│  Cost per user (50K users): ₹50/user/month                            │
│  Cost per FIR (1000/day): ₹833/FIR (including all infra)             │
│  Target Year 3 (economies of scale): ₹15/user/month                  │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### Cost Optimization Strategies

| Strategy | Savings Estimate | Implementation |
|----------|-----------------|----------------|
| **Catalyst Cache aggressive caching** | 25% reduction in DataStore/ES costs | Cache frequently accessed records (hot cases, master data) with TTL-based invalidation |
| **Vertex AI batch inference** | 40% reduction in AI costs | Non-urgent classifications (bulk imports) processed in batch rather than real-time |
| **Databricks spot instances** | 60% savings on analytics compute | Non-SLA analytical jobs run on spot/preemptible instances |
| **Elasticsearch index lifecycle** | 30% storage savings | Hot-warm-cold architecture; old indices moved to cheaper storage tiers |
| **Data tiering (Stratus + S3)** | 50% storage savings | Active evidence in Catalyst Stratus; archived evidence in S3 Glacier |
| **Reserved capacity (annual commits)** | 20-30% savings across all cloud services | Annual commit for baseline capacity; on-demand for burst |
| **Model distillation** | 70% inference cost reduction | Distill Gemini 2.5 into smaller models for routine classification tasks |

### Cost Governance

- **Monthly cost review**: Engineering + Finance review actual vs. budgeted cloud spend
- **Cost anomaly alerts**: Datadog monitors for >20% cost increase vs. trailing 7-day average
- **Tagging policy**: All cloud resources tagged with: `team`, `environment`, `service`, `cost-center`
- **FinOps dashboard**: Real-time cost per service, per API, per user — visible to engineering leads
- **Quarterly optimization sprint**: Dedicated sprint for cost optimization (cache tuning, query optimization, resource right-sizing)

---

## Appendix: Cross-Reference Matrix

### Requirements to Technology Mapping

| Technology | Primary Requirements Served |
|-----------|---------------------------|
| Catalyst DataStore | FR-FIR-001 to 033, FR-INV-001 to 023, FR-ADM-001 to 011 |
| Catalyst AppSail | All API/UI requirements |
| Catalyst Functions | FR-FIR-011, FR-FIR-029, FR-PRED-001 to 015, FR-RPT-001 to 016 |
| Catalyst Signals + Kafka | FR-FIR-023, FR-NET-007 to 009, FR-PRED-006, all real-time alerts |
| Catalyst Auth | FR-ADM-001, FR-ADM-002, all security requirements |
| Catalyst Stratus | FR-INV-004, FR-INV-014, FR-MOB-005 |
| Catalyst Cache | All performance requirements (caching layer) |
| Catalyst Circuits | FR-INV-001, FR-INV-006, FR-INV-016, FR-INV-019 |
| Catalyst Cron | FR-RPT-006, FR-PRED-001, scheduled jobs |
| Catalyst Pipelines | All CI/CD, deployment requirements |
| Neo4j Aura | FR-NET-001 to 015 |
| Elasticsearch | FR-FIR-019, FR-GEO-001 to 015, FR-RPT-005 |
| Pinecone | FR-FIR-011, FR-INV-018, FR-RPT-007 (semantic search) |
| Vertex AI (Gemini 2.5) | FR-FIR-011 to 013, FR-INV-008, FR-PRED-001 to 009, FR-RPT-007 |
| Databricks Lakehouse | FR-RPT-001 to 016, FR-PRED-001 to 015 (OLAP) |
| PostGIS + Leaflet.js | FR-GEO-001 to 015 |
| Datadog | All observability, monitoring, alerting requirements |
| Kong API Gateway | FR-INT-001 to 011, API security, rate limiting |

---

*End of Part I: Strategic Architecture — Sections 1 through 7*

*Next: Part II — Technical Architecture (Sections 8–14): System Architecture, Data Architecture, Integration Architecture, Security Architecture, AI/ML Architecture, Deployment Architecture, Operations & SRE*

---

**Document Control**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-07-17 | Enterprise Architecture Council | Initial draft — Sections 1-7 |

**Review & Approval**

| Role | Name | Status | Date |
|------|------|--------|------|
| Chief Architect | — | PENDING | — |
| Security Architect | — | PENDING | — |
| DGP Office Representative | — | PENDING | — |
| SCRB Director | — | PENDING | — |
| Home Ministry IT Cell | — | PENDING | — |
