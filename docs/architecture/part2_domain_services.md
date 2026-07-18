# Enterprise Architecture Document — Part 2: Domain Services & Event Architecture

## Karnataka State Police — AI-Driven Crime Intelligence Platform (KAICIP)

| Meta | Detail |
|---|---|
| **Document ID** | KAICIP-ARCH-PART2-v2.0 |
| **Classification** | RESTRICTED — Law Enforcement Sensitive |
| **Authors** | Enterprise Architecture Council |
| **Date** | 2026-07-17 |
| **Status** | APPROVED — Architecture Review Board |
| **Scope** | Sections 8–10: DDD, Microservices, Event Architecture |

---

# 8. Domain-Driven Design (Complete)

## 8.1 Strategic Design Overview

Domain-Driven Design is the foundational organizing principle for the KAICIP platform. Given the extreme complexity of Indian criminal law (500+ Acts, 10,000+ Sections), multi-jurisdictional policing (800+ police stations across 31 districts), and the intelligence-driven operational model, DDD provides the intellectual framework to decompose this domain into manageable, autonomously deployable subsystems.

### 8.1.1 Why DDD for a Crime Intelligence Platform

| Driver | Justification |
|---|---|
| **Domain Complexity** | Indian criminal justice spans IPC/BNS, CrPC/BNSS, Evidence Act/BSA, 200+ special/local acts, and Karnataka-specific regulations. No single team can hold all context. |
| **Organizational Alignment** | Karnataka Police has distinct functional units: Law & Order, Crime, Traffic, Intelligence, Prosecution, Administration. Bounded contexts mirror these organizational boundaries (Conway's Law). |
| **Autonomous Deployment** | FIR registration must never be blocked by analytics downtime. Context boundaries enable independent deployment cadences. |
| **Data Sovereignty** | Different contexts have different classification levels (RESTRICTED vs CONFIDENTIAL vs SECRET). Bounded contexts enforce data isolation. |
| **Scale Independence** | Search workloads (read-heavy, bursty) differ fundamentally from registration workloads (write-heavy, steady). Separate contexts enable independent scaling. |
| **Regulatory Compliance** | BNSS 2023 mandates specific workflows for e-FIR, zero-FIR, and digital case diaries. Bounded contexts encapsulate these regulatory requirements. |

### 8.1.2 Ubiquitous Language Glossary (Cross-Context)

| Term | Definition | Context(s) |
|---|---|---|
| **FIR** | First Information Report — the foundational document initiating criminal proceedings under BNSS Section 173 | Crime Registration |
| **Zero FIR** | FIR registered at any police station regardless of jurisdiction, later transferred to the correct station | Crime Registration |
| **Case Diary** | Daily investigation record maintained by the Investigation Officer (BNSS Section 175) | Investigation |
| **Chargesheet** | Final report filed by police to the court upon completion of investigation (BNSS Section 193) | Legal & Prosecution |
| **Accused** | Person against whom reasonable suspicion exists | Crime Registration, Investigation, Criminal Intelligence |
| **IO** | Investigating Officer — the police officer assigned to investigate a case | Investigation |
| **Crime Head** | Hierarchical classification of crime types (e.g., Murder → Culpable Homicide → IPC 302) | Crime Registration, Analytics |
| **Beat** | Smallest geographical patrol unit within a police station jurisdiction | Geospatial Intelligence |
| **MO** | Modus Operandi — the criminal's method of operation | Criminal Intelligence |
| **KGID** | Karnataka Government ID — unique identifier for government employees | Personnel |
| **Unit** | Organizational entity in police hierarchy (HQ, Range, District, Sub-Division, Circle, Station) | Personnel & Organization |

---

## 8.2 Bounded Context Catalog

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    KAICIP BOUNDED CONTEXT MAP                              ║
║                                                                            ║
║  ┌─────────────────┐    Shared Kernel     ┌──────────────────┐             ║
║  │   CRIME         │◄═══════════════════►│  INVESTIGATION    │             ║
║  │ REGISTRATION    │    (CaseMaster ID,   │   CONTEXT         │             ║
║  │   CONTEXT       │     Accused ID)      │                   │             ║
║  │                 │                      │                   │             ║
║  │ [Core Domain]   │                      │  [Core Domain]    │             ║
║  └────────┬────────┘                      └────────┬──────────┘             ║
║           │ Published                              │ Customer-             ║
║           │ Language                               │ Supplier              ║
║           ▼                                        ▼                       ║
║  ┌─────────────────┐    Anti-Corruption    ┌──────────────────┐            ║
║  │   LEGAL &       │◄───── Layer ─────────│   CRIMINAL        │            ║
║  │ PROSECUTION     │                      │ INTELLIGENCE      │            ║
║  │   CONTEXT       │                      │   CONTEXT         │            ║
║  │                 │                      │                   │            ║
║  │ [Core Domain]   │                      │  [Core Domain]    │            ║
║  └────────┬────────┘                      └────────┬──────────┘            ║
║           │                                        │                       ║
║           │ Conformist                             │ Customer-             ║
║           │ (Court systems)                        │ Supplier              ║
║           ▼                                        ▼                       ║
║  ┌─────────────────┐                      ┌──────────────────┐             ║
║  │  GEOSPATIAL     │   Open Host Service  │   AI/ML          │             ║
║  │ INTELLIGENCE    │◄════════════════════►│ INTELLIGENCE      │             ║
║  │   CONTEXT       │                      │   CONTEXT         │             ║
║  │                 │                      │                   │             ║
║  │[Supporting Dom] │                      │ [Supporting Dom]  │            ║
║  └────────┬────────┘                      └────────┬──────────┘            ║
║           │                                        │                       ║
║           │ Open Host                              │ Published             ║
║           │ Service                                │ Language              ║
║           ▼                                        ▼                       ║
║  ┌─────────────────┐    Shared Kernel     ┌──────────────────┐             ║
║  │  ANALYTICS &    │◄═══════════════════►│  PERSONNEL &      │             ║
║  │  REPORTING      │  (Employee, Unit)    │  ORGANIZATION     │             ║
║  │   CONTEXT       │                      │   CONTEXT         │             ║
║  │                 │                      │                   │             ║
║  │[Supporting Dom] │                      │ [Generic Subdomain]│           ║
║  └────────┬────────┘                      └────────┬──────────┘            ║
║           │                                        │                       ║
║           │                                        │                       ║
║           ▼                                        ▼                       ║
║  ┌─────────────────┐  Anti-Corruption     ┌──────────────────┐             ║
║  │ ADMINISTRATION  │◄───── Layer ─────────│  INTEGRATION      │             ║
║  │   CONTEXT       │                      │   CONTEXT         │             ║
║  │                 │                      │                   │             ║
║  │[Generic Subdom] │                      │ [Generic Subdomain]│           ║
║  └─────────────────┘                      └──────────────────┘             ║
║                                                                            ║
║  Legend:  ◄══► Shared Kernel    ◄───► ACL    ◄═══► Open Host Service       ║
║          [Core] = Competitive Advantage  [Supporting] = Necessary           ║
║          [Generic] = Commodity                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## 8.3 Bounded Context #1: Crime Registration Context

### 8.3.1 Context Purpose & Justification

The Crime Registration Context is the **entry point** for all criminal proceedings in the platform. It owns the lifecycle from complaint receipt through FIR registration, classification, and initial case setup. This is separated from Investigation because:

1. **Regulatory Boundary**: BNSS 2023 mandates specific timelines and procedures for FIR registration (Section 173) that are independent of investigation procedures.
2. **Operational Cadence**: FIR registration is a high-frequency, time-critical operation (must be registered immediately upon cognizable offence report). Investigation is a long-running process spanning weeks to months.
3. **Data Ownership**: The FIR document is a legal instrument with specific evidentiary requirements distinct from investigation artifacts.
4. **Scale Profile**: Registration experiences burst traffic (e.g., during communal incidents, natural disasters) while investigation load is steady.

### 8.3.2 Aggregates

#### Aggregate 1: CaseAggregate (Aggregate Root: CaseMaster)

```
┌─────────────────────────────────────────────────────────────┐
│                    CaseAggregate                            │
│  ┌──────────────────────────────────┐                       │
│  │  CaseMaster (Aggregate Root)     │                       │
│  │  ─────────────────────────────── │                       │
│  │  CaseId: UUID (PK)              │                       │
│  │  FIRNumber: string (unique/yr)  │                       │
│  │  FIRDate: DateTime              │                       │
│  │  CaseCategory: Enum             │                       │
│  │    (FIR|UDR|PAR|NCR)            │                       │
│  │  CaseStatusId: FK               │                       │
│  │  PoliceStationId: FK (Unit)     │                       │
│  │  DistrictId: FK                 │                       │
│  │  CrimeHeadId: FK                │                       │
│  │  CrimeSubHeadId: FK             │                       │
│  │  GravityId: FK (Heinous/Non)    │                       │
│  │  OccurrenceFromDate: DateTime   │                       │
│  │  OccurrenceToDate: DateTime     │                       │
│  │  ReportedDate: DateTime         │                       │
│  │  PlaceOfOccurrence: string      │                       │
│  │  Latitude: decimal(10,8)        │                       │
│  │  Longitude: decimal(11,8)       │                       │
│  │  BriefFacts: text               │                       │
│  │  IOEmployeeId: FK               │                       │
│  │  IsTransferred: boolean         │                       │
│  │  TransferredFromUnit: FK        │                       │
│  │  Version: int (optimistic lock) │                       │
│  └────────────┬─────────────────────┘                       │
│               │ 1:N                                         │
│  ┌────────────▼─────────────────────┐                       │
│  │  CaseSection (Entity)           │                       │
│  │  ─────────────────────────────── │                       │
│  │  CaseSectionId: UUID            │                       │
│  │  CaseId: FK                     │                       │
│  │  ActId: FK                      │                       │
│  │  SectionId: FK                  │                       │
│  │  IsPrimary: boolean             │                       │
│  │  AddedDate: DateTime            │                       │
│  │  AddedBy: EmployeeId            │                       │
│  └──────────────────────────────────┘                       │
│               │ 1:N                                         │
│  ┌────────────▼─────────────────────┐                       │
│  │  CaseAccusedLink (Entity)       │                       │
│  │  ─────────────────────────────── │                       │
│  │  LinkId: UUID                   │                       │
│  │  CaseId: FK                     │                       │
│  │  AccusedId: FK                  │                       │
│  │  Role: Enum (Primary|Accomplice │                       │
│  │         |Abettor|Conspirator)    │                       │
│  │  Status: Enum                   │                       │
│  │  LinkedDate: DateTime           │                       │
│  └──────────────────────────────────┘                       │
│               │ 1:N                                         │
│  ┌────────────▼─────────────────────┐                       │
│  │  CaseVictimLink (Entity)        │                       │
│  │  ─────────────────────────────── │                       │
│  │  LinkId: UUID                   │                       │
│  │  CaseId: FK                     │                       │
│  │  VictimId: FK                   │                       │
│  │  VictimType: Enum               │                       │
│  │  LinkedDate: DateTime           │                       │
│  └──────────────────────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

**Invariants:**
1. `FIRNumber` must be unique within a `PoliceStation` per calendar year.
2. A `CaseMaster` must have at least one `CaseSection` (an FIR without a legal section is invalid).
3. `OccurrenceFromDate` must be ≤ `OccurrenceToDate` and both must be ≤ `ReportedDate`.
4. If `CaseCategory == FIR`, then `GravityId` is mandatory (must classify as Heinous or Non-Heinous).
5. `Latitude` and `Longitude` must fall within Karnataka state boundaries (11.5°N–18.5°N, 74°E–78.5°E) or be explicitly flagged as out-of-state.
6. Once a case reaches status `CHARGESHEETED` or `CLOSED`, sections cannot be removed, only added.
7. A Zero FIR must have `IsTransferred = true` and `TransferredFromUnit` set within 24 hours.

#### Aggregate 2: ComplainantAggregate (Aggregate Root: ComplainantDetails)

```
┌─────────────────────────────────────────────────────────────┐
│              ComplainantAggregate                            │
│  ┌──────────────────────────────────┐                       │
│  │  ComplainantDetails (Root)       │                       │
│  │  ─────────────────────────────── │                       │
│  │  ComplainantId: UUID             │                       │
│  │  CaseId: FK                     │                       │
│  │  Name: PersonName (VO)          │                       │
│  │  FatherHusbandName: string      │                       │
│  │  Age: int                       │                       │
│  │  Gender: Enum                   │                       │
│  │  Address: Address (VO)          │                       │
│  │  Phone: PhoneNumber (VO)        │                       │
│  │  CasteId: FK                    │                       │
│  │  ReligionId: FK                 │                       │
│  │  OccupationId: FK               │                       │
│  │  NationalityId: FK              │                       │
│  │  IdentificationType: Enum       │                       │
│  │  IdentificationNumber: string   │                       │
│  │  IsAnonymous: boolean           │                       │
│  └──────────────────────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

**Invariants:**
1. Every FIR must have exactly one `ComplainantDetails` record.
2. If `IsAnonymous == true`, the platform must still store encrypted PII for authorized access only.
3. `Phone` must be a valid Indian mobile number (10 digits, starting with 6-9) or landline with STD code.

### 8.3.3 Value Objects

| Value Object | Properties | Validation Rules |
|---|---|---|
| `PersonName` | `firstName: string`, `middleName: string?`, `lastName: string`, `aliasNames: string[]` | firstName required, max 100 chars, Unicode support for Kannada script |
| `Address` | `line1: string`, `line2: string?`, `village: string?`, `city: string`, `districtId: UUID`, `stateId: UUID`, `pinCode: string` | pinCode must be 6-digit valid Indian PIN |
| `GPSCoordinate` | `latitude: decimal(10,8)`, `longitude: decimal(11,8)`, `accuracy: float`, `source: Enum(GPS\|Manual\|Geocoded)` | Must be valid WGS84 coordinates |
| `FIRReference` | `firNumber: string`, `year: int`, `policeStationId: UUID` | Composite uniqueness, format: `NNN/YYYY` |
| `CrimeClassification` | `crimeHeadId: UUID`, `crimeSubHeadId: UUID`, `gravityId: UUID` | Must form valid hierarchy per CrimeHeadActSection mapping |
| `DateRange` | `from: DateTime`, `to: DateTime` | `from <= to`, both non-null |
| `PhoneNumber` | `countryCode: string`, `number: string`, `type: Enum(Mobile\|Landline)` | Valid format per ITU-T E.164 |

### 8.3.4 Domain Events

| Event Name | Schema | Trigger |
|---|---|---|
| `FIRRegistered` | `{caseId, firNumber, policeStationId, crimeHeadId, gravityId, gpsCoordinate, registeredBy, timestamp, complainantId, sections[]}` | New FIR successfully registered |
| `ZeroFIRRegistered` | `{caseId, firNumber, originStationId, targetJurisdiction, timestamp}` | Zero FIR registered at non-jurisdictional station |
| `CaseSectionsAmended` | `{caseId, addedSections[], removedSections[], amendedBy, reason, timestamp}` | Sections added/removed from case |
| `CaseTransferred` | `{caseId, fromStationId, toStationId, transferOrderRef, timestamp}` | Case transferred between stations |
| `CaseCategoryChanged` | `{caseId, oldCategory, newCategory, reason, changedBy, timestamp}` | e.g., UDR converted to FIR |
| `CaseStatusUpdated` | `{caseId, oldStatus, newStatus, remarks, updatedBy, timestamp}` | Status transition in case lifecycle |
| `ComplainantRecorded` | `{complainantId, caseId, isAnonymous, timestamp}` | Complainant details captured |

### 8.3.5 Repository Interface Contracts

```
Interface ICaseRepository:
  findById(caseId: UUID): CaseAggregate?
  findByFIRNumber(firNumber: string, year: int, stationId: UUID): CaseAggregate?
  findByStation(stationId: UUID, dateRange: DateRange, page: Page): Page<CaseSummary>
  findByStatus(statusId: UUID, stationId: UUID): List<CaseSummary>
  save(case: CaseAggregate): CaseAggregate
  nextFIRNumber(stationId: UUID, year: int): string
  existsByFIRNumber(firNumber: string, year: int, stationId: UUID): boolean
  countByStation(stationId: UUID, dateRange: DateRange): CaseStatistics
  
Interface IComplainantRepository:
  findById(complainantId: UUID): ComplainantAggregate?
  findByCaseId(caseId: UUID): ComplainantAggregate?
  save(complainant: ComplainantAggregate): ComplainantAggregate
  findByPhone(phone: PhoneNumber): List<ComplainantAggregate>
```

### 8.3.6 Domain Services

| Service | Responsibility |
|---|---|
| `FIRRegistrationService` | Orchestrates FIR creation: validates sections against Act/Section master, generates FIR number, assigns IO, publishes `FIRRegistered` event. Enforces BNSS Section 173 compliance. |
| `ZeroFIRService` | Handles Zero FIR workflow: registers FIR at current station, identifies correct jurisdiction via geospatial lookup, initiates transfer workflow within 24-hour mandate. |
| `CaseClassificationService` | Determines crime classification hierarchy: maps reported offence to CrimeHead → CrimeSubHead → Act/Section. Uses AI-assisted classification when description is ambiguous. |
| `CaseTransferService` | Manages inter-station and inter-district transfers. Validates transfer authority, ensures chain of custody, handles Zero FIR re-registration at destination. |
| `FIRNumberGenerationService` | Thread-safe, station-scoped sequential FIR number generation. Uses database sequence per station per year. Handles race conditions via optimistic locking. |

---

## 8.4 Bounded Context #2: Investigation Context

### 8.4.1 Context Purpose & Justification

The Investigation Context manages the long-running investigative process from IO assignment through evidence collection, witness examination, and case diary maintenance to final report preparation. Separation from Crime Registration is justified because:

1. **Temporal Scope**: Investigations span weeks to years; registration is a single transaction.
2. **Access Control**: Investigation details (case diary, witness statements) are restricted even from other police officers (BNSS Section 175).
3. **Process Complexity**: Multiple parallel investigation tracks (forensic, witness, technical surveillance) require their own lifecycle management.
4. **Data Sensitivity**: Investigation notes and strategies are classified at a higher level than FIR data.

### 8.4.2 Aggregates

#### Aggregate 1: InvestigationAggregate (Root: Investigation)

```
┌─────────────────────────────────────────────────────────────┐
│               InvestigationAggregate                        │
│  ┌──────────────────────────────────┐                       │
│  │  Investigation (Aggregate Root)  │                       │
│  │  ─────────────────────────────── │                       │
│  │  InvestigationId: UUID           │                       │
│  │  CaseId: FK (from Registration) │                       │
│  │  IOEmployeeId: FK                │                       │
│  │  SupervisingOfficerId: FK        │                       │
│  │  Status: Enum (Active|Suspended  │                       │
│  │    |TransferredToIO|Completed)   │                       │
│  │  StartDate: DateTime             │                       │
│  │  TargetCompletionDate: DateTime  │                       │
│  │  ActualCompletionDate: DateTime? │                       │
│  │  Priority: Enum (Critical|High   │                       │
│  │    |Medium|Low)                  │                       │
│  │  InvestigationPlan: text         │                       │
│  └────────────┬─────────────────────┘                       │
│               │ 1:N                                         │
│  ┌────────────▼─────────────────────┐                       │
│  │  CaseDiaryEntry (Entity)        │                       │
│  │  ─────────────────────────────── │                       │
│  │  EntryId: UUID                  │                       │
│  │  InvestigationId: FK            │                       │
│  │  EntryDate: DateTime            │                       │
│  │  EntryNumber: int (sequential)  │                       │
│  │  Content: encrypted text        │                       │
│  │  EnteredBy: EmployeeId          │                       │
│  │  IsConfidential: boolean        │                       │
│  │  SupervisorRemarks: text?       │                       │
│  │  ReviewedBy: EmployeeId?        │                       │
│  │  ReviewedDate: DateTime?        │                       │
│  └──────────────────────────────────┘                       │
│               │ 1:N                                         │
│  ┌────────────▼─────────────────────┐                       │
│  │  InvestigationTask (Entity)     │                       │
│  │  ─────────────────────────────── │                       │
│  │  TaskId: UUID                   │                       │
│  │  InvestigationId: FK            │                       │
│  │  Type: Enum (WitnessExam|Scene  │                       │
│  │    Visit|ForensicReq|Surveillance│                       │
│  │    |RecordCheck|Arrest)          │                       │
│  │  Description: text              │                       │
│  │  AssignedTo: EmployeeId         │                       │
│  │  Status: Enum                   │                       │
│  │  DueDate: DateTime              │                       │
│  │  CompletedDate: DateTime?       │                       │
│  │  Outcome: text?                 │                       │
│  └──────────────────────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

**Invariants:**
1. An `Investigation` must have exactly one active `IOEmployeeId` at any point in time.
2. `CaseDiaryEntry.EntryNumber` must be sequential within an Investigation, starting from 1.
3. A `CaseDiaryEntry` once submitted cannot be deleted, only appended (legal mandate).
4. `TargetCompletionDate` must comply with BNSS timelines: 60 days (custody cases) or 90 days (bail cases), extendable by court order.
5. If `Priority == Critical`, a `SupervisingOfficerId` of rank ≥ DySP must be assigned.

#### Aggregate 2: EvidenceAggregate (Root: EvidenceItem)

```
┌─────────────────────────────────────────────────────────────┐
│                 EvidenceAggregate                            │
│  ┌──────────────────────────────────┐                       │
│  │  EvidenceItem (Aggregate Root)   │                       │
│  │  ─────────────────────────────── │                       │
│  │  EvidenceId: UUID                │                       │
│  │  InvestigationId: FK             │                       │
│  │  Type: Enum (Physical|Digital    │                       │
│  │    |Documentary|Forensic|        │                       │
│  │    Testimonial|Electronic)       │                       │
│  │  Description: text               │                       │
│  │  CollectedBy: EmployeeId         │                       │
│  │  CollectedDate: DateTime         │                       │
│  │  CollectionLocation: GPS (VO)    │                       │
│  │  StorageLocation: string         │                       │
│  │  HashValue: string (SHA-256)     │                       │
│  │  IsSealed: boolean               │                       │
│  │  MuddamalNumber: string          │                       │
│  └────────────┬─────────────────────┘                       │
│               │ 1:N                                         │
│  ┌────────────▼─────────────────────┐                       │
│  │  ChainOfCustodyEntry (Entity)   │                       │
│  │  ─────────────────────────────── │                       │
│  │  EntryId: UUID                  │                       │
│  │  EvidenceId: FK                 │                       │
│  │  FromPerson: EmployeeId         │                       │
│  │  ToPerson: EmployeeId           │                       │
│  │  TransferDate: DateTime         │                       │
│  │  Purpose: string                │                       │
│  │  Remarks: text                  │                       │
│  │  DigitalSignature: bytes        │                       │
│  └──────────────────────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

**Invariants:**
1. `ChainOfCustodyEntry` records are append-only; once created, they cannot be modified or deleted.
2. `HashValue` must be computed at collection time and verified at every custody transfer.
3. `MuddamalNumber` is unique within a police station per year.

### 8.4.3 Value Objects

| Value Object | Properties | Validation Rules |
|---|---|---|
| `CaseDiaryReference` | `investigationId: UUID`, `entryNumber: int`, `entryDate: DateTime` | Sequential, immutable after creation |
| `EvidenceHash` | `algorithm: string`, `hashValue: string`, `computedAt: DateTime` | SHA-256 mandatory, immutable |
| `InvestigationTimeline` | `startDate: DateTime`, `targetDate: DateTime`, `extensions: ExtensionOrder[]` | Target must comply with BNSS timelines |
| `WitnessStatement` | `witnessId: UUID`, `statementText: encrypted string`, `recordedDate: DateTime`, `recordedBy: EmployeeId` | Must be encrypted at rest |

### 8.4.4 Domain Events

| Event Name | Schema | Trigger |
|---|---|---|
| `InvestigationStarted` | `{investigationId, caseId, ioId, startDate, priority, targetCompletionDate}` | IO assigned and investigation begins |
| `CaseDiaryEntryAdded` | `{investigationId, entryId, entryNumber, entryDate, ioId}` | New case diary entry recorded |
| `EvidenceCollected` | `{evidenceId, investigationId, type, collectedBy, location, hashValue, timestamp}` | New evidence item cataloged |
| `EvidenceCustodyTransferred` | `{evidenceId, fromPerson, toPerson, purpose, timestamp, digitalSignature}` | Evidence changes hands |
| `IOReassigned` | `{investigationId, previousIO, newIO, reason, orderedBy, timestamp}` | Investigating Officer changed |
| `InvestigationCompleted` | `{investigationId, caseId, outcome: Enum(Chargesheet\|Closure\|Referral), timestamp}` | Investigation reaches conclusion |
| `InvestigationDeadlineApproaching` | `{investigationId, caseId, daysRemaining, ioId}` | Auto-generated when within 7 days of deadline |

### 8.4.5 Repository Interface Contracts

```
Interface IInvestigationRepository:
  findById(investigationId: UUID): InvestigationAggregate?
  findByCaseId(caseId: UUID): InvestigationAggregate?
  findByIO(ioEmployeeId: UUID, status: InvestigationStatus?): List<InvestigationSummary>
  findApproachingDeadline(daysThreshold: int): List<InvestigationSummary>
  save(investigation: InvestigationAggregate): InvestigationAggregate

Interface IEvidenceRepository:
  findById(evidenceId: UUID): EvidenceAggregate?
  findByInvestigation(investigationId: UUID): List<EvidenceAggregate>
  findByMuddamalNumber(number: string, stationId: UUID, year: int): EvidenceAggregate?
  save(evidence: EvidenceAggregate): EvidenceAggregate
  getCustodyChain(evidenceId: UUID): List<ChainOfCustodyEntry>
```

### 8.4.6 Domain Services

| Service | Responsibility |
|---|---|
| `IOAssignmentService` | Assigns IO based on rank eligibility, current caseload, expertise matching, and jurisdiction. Enforces rank requirements for different crime gravities. |
| `CaseDiaryService` | Manages daily diary entry creation, enforces sequential numbering, encrypts sensitive content, and generates supervisor review notifications. |
| `EvidenceManagementService` | Handles evidence lifecycle: collection recording, hash computation, custody chain tracking, and tamper detection via hash verification. |
| `InvestigationTimelineService` | Monitors BNSS-mandated timelines, generates deadline warnings, processes court-granted extensions, and escalates overdue investigations. |
| `ForensicRequestService` | Creates and tracks forensic lab requests (FSL), maps evidence to appropriate lab (biology, chemistry, ballistics, cyber, DNA), tracks results. |

---

## 8.5 Bounded Context #3: Criminal Intelligence Context

### 8.5.1 Context Purpose & Justification

The Criminal Intelligence Context is the **differentiating domain** of KAICIP. It transforms raw crime data into actionable intelligence through criminal profiling, network analysis, pattern detection, and modus operandi matching. This is separated because:

1. **Data Model**: Criminal intelligence uses a graph model (relationships between criminals, gangs, locations, activities) fundamentally different from the relational model of case registration.
2. **Temporal Model**: Intelligence evolves over time with confidence scores and corroboration, unlike factual case records.
3. **Access Control**: Intelligence products have separate classification levels and need-to-know controls distinct from case data.
4. **Analytical vs. Transactional**: Intelligence workloads are read-heavy, graph-traversal-intensive, and latency-tolerant compared to registration which is write-heavy and latency-sensitive.

### 8.5.2 Aggregates

#### Aggregate 1: CriminalProfileAggregate (Root: CriminalProfile)

```
┌─────────────────────────────────────────────────────────────┐
│            CriminalProfileAggregate                         │
│  ┌──────────────────────────────────┐                       │
│  │  CriminalProfile (Root)          │                       │
│  │  ─────────────────────────────── │                       │
│  │  ProfileId: UUID                 │                       │
│  │  AccusedId: FK (from CaseMaster) │                       │
│  │  RiskScore: float (0.0-1.0)      │                       │
│  │  RiskCategory: Enum (Low|Medium  │                       │
│  │    |High|Critical)               │                       │
│  │  IsHistorySheeter: boolean       │                       │
│  │  HistorySheetNumber: string?     │                       │
│  │  TotalCases: int                 │                       │
│  │  Convictions: int                │                       │
│  │  Acquittals: int                 │                       │
│  │  PendingCases: int               │                       │
│  │  KnownAliases: string[]          │                       │
│  │  LastKnownLocation: GPS (VO)     │                       │
│  │  LastSeenDate: DateTime?         │                       │
│  │  BiometricRefId: string?         │                       │
│  │  PhotoRefIds: string[]           │                       │
│  └────────────┬─────────────────────┘                       │
│               │ 1:N                                         │
│  ┌────────────▼─────────────────────┐                       │
│  │  ModusOperandi (Entity)         │                       │
│  │  ─────────────────────────────── │                       │
│  │  MOId: UUID                     │                       │
│  │  ProfileId: FK                  │                       │
│  │  CrimeType: Enum                │                       │
│  │  Method: text                   │                       │
│  │  PreferredTime: TimeRange (VO)  │                       │
│  │  PreferredLocation: AreaType    │                       │
│  │  ToolsUsed: string[]            │                       │
│  │  TargetProfile: text            │                       │
│  │  Confidence: float (0-1)        │                       │
│  │  SourceCaseIds: UUID[]          │                       │
│  │  EmbeddingVector: float[768]    │                       │
│  └──────────────────────────────────┘                       │
│               │ 1:N                                         │
│  ┌────────────▼─────────────────────┐                       │
│  │  CriminalAssociation (Entity)   │                       │
│  │  ─────────────────────────────── │                       │
│  │  AssociationId: UUID            │                       │
│  │  ProfileId: FK                  │                       │
│  │  AssociatedProfileId: FK        │                       │
│  │  RelationshipType: Enum         │                       │
│  │    (GangMember|FamilyRelation|   │                       │
│  │     Associate|Informant|Handler) │                       │
│  │  Strength: float (0-1)          │                       │
│  │  SourceEvidence: string[]       │                       │
│  │  FirstObservedDate: DateTime    │                       │
│  │  LastCorroboratedDate: DateTime │                       │
│  │  IsActive: boolean              │                       │
│  └──────────────────────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

**Invariants:**
1. `RiskScore` must be recomputed whenever `TotalCases`, `Convictions`, or `PendingCases` change.
2. `IsHistorySheeter` automatically becomes `true` when `TotalCases >= 3` and at least one conviction exists (Karnataka Police Manual rule).
3. `CriminalAssociation` is bidirectional: if A→B exists, B→A must also exist (possibly with different relationship types).
4. `ModusOperandi.Confidence` degrades over time if not corroborated by new cases (time-decay function).
5. `EmbeddingVector` must be regenerated whenever `Method`, `ToolsUsed`, or `TargetProfile` are updated.

#### Aggregate 2: GangProfileAggregate (Root: GangProfile)

```
┌─────────────────────────────────────────────────────────────┐
│                GangProfileAggregate                         │
│  ┌──────────────────────────────────┐                       │
│  │  GangProfile (Aggregate Root)    │                       │
│  │  ─────────────────────────────── │                       │
│  │  GangId: UUID                    │                       │
│  │  GangName: string                │                       │
│  │  GangType: Enum (Organized|      │                       │
│  │    Street|Cyber|WhiteCollar|     │                       │
│  │    DrugTrafficking|Smuggling)    │                       │
│  │  ThreatLevel: Enum               │                       │
│  │  OperatingAreas: Polygon[] (VO)  │                       │
│  │  EstimatedStrength: int          │                       │
│  │  LeaderId: CriminalProfileId?    │                       │
│  │  Status: Enum (Active|Dormant    │                       │
│  │    |Disbanded|UnderSurveillance) │                       │
│  │  FirstIdentifiedDate: DateTime   │                       │
│  │  IntelligenceNotes: encrypted    │                       │
│  └────────────┬─────────────────────┘                       │
│               │ 1:N                                         │
│  ┌────────────▼─────────────────────┐                       │
│  │  GangMembership (Entity)        │                       │
│  │  ─────────────────────────────── │                       │
│  │  MembershipId: UUID             │                       │
│  │  GangId: FK                     │                       │
│  │  ProfileId: FK (CriminalProfile)│                       │
│  │  Role: Enum (Leader|Lieutenant  │                       │
│  │    |Member|Recruit|Informant)   │                       │
│  │  JoinedDate: DateTime?          │                       │
│  │  LeftDate: DateTime?            │                       │
│  │  IsActive: boolean              │                       │
│  └──────────────────────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

**Invariants:**
1. A gang must have at least one active member to be `Active`.
2. Only one member can have `Role == Leader` at any given time.
3. When `Status` transitions to `Disbanded`, all memberships must be set to `IsActive = false`.

### 8.5.3 Value Objects

| Value Object | Properties | Validation |
|---|---|---|
| `RiskAssessment` | `score: float`, `category: Enum`, `factors: RiskFactor[]`, `computedAt: DateTime`, `model: string` | Score 0.0–1.0, category derived from score thresholds |
| `TimeRange` | `fromHour: int`, `toHour: int`, `dayOfWeek: Enum[]?` | 0–23, from < to |
| `AreaType` | `type: Enum(Urban\|Rural\|Highway\|Commercial\|Residential\|Industrial)`, `specificLocations: string[]` | At least one type |
| `IntelligenceConfidence` | `level: Enum(Confirmed\|Probable\|Possible\|Doubtful)`, `sources: int`, `lastCorroborated: DateTime` | NATO confidence model |
| `CriminalNetworkEdge` | `sourceId: UUID`, `targetId: UUID`, `edgeType: string`, `weight: float`, `evidence: string[]` | Weight 0.0–1.0 |

### 8.5.4 Domain Events

| Event Name | Schema | Trigger |
|---|---|---|
| `CriminalProfileCreated` | `{profileId, accusedId, initialRiskScore, timestamp}` | First case linked to an accused |
| `RiskScoreUpdated` | `{profileId, previousScore, newScore, factors[], modelVersion, timestamp}` | Risk score recomputation |
| `HistorySheeterFlagged` | `{profileId, accusedId, historySheetNumber, totalCases, convictions, stationId}` | Accused meets history-sheeter criteria |
| `GangIdentified` | `{gangId, gangName, gangType, memberProfileIds[], operatingAreas[], timestamp}` | New gang entity identified |
| `CriminalAssociationDiscovered` | `{associationId, profileA, profileB, relationshipType, strength, evidence}` | New link between criminals |
| `MOPatternMatched` | `{matchId, crimeId, matchedProfileIds[], similarity, moDescription}` | MO in new crime matches known profile |
| `NetworkClusterDetected` | `{clusterId, centralNodes[], peripheralNodes[], clusterType, threatLevel}` | Graph algorithm detects new cluster |

### 8.5.5 Repository Interface Contracts

```
Interface ICriminalProfileRepository:
  findById(profileId: UUID): CriminalProfileAggregate?
  findByAccusedId(accusedId: UUID): CriminalProfileAggregate?
  findHistorySheeters(stationId: UUID): List<CriminalProfileSummary>
  findByRiskCategory(category: RiskCategory, area: Polygon?): List<CriminalProfileSummary>
  searchByMO(moEmbedding: float[], topK: int, threshold: float): List<MOMatch>
  save(profile: CriminalProfileAggregate): CriminalProfileAggregate

Interface IGangProfileRepository:
  findById(gangId: UUID): GangProfileAggregate?
  findByOperatingArea(polygon: Polygon): List<GangProfileSummary>
  findByMember(profileId: UUID): List<GangProfileSummary>
  findByThreatLevel(level: ThreatLevel): List<GangProfileSummary>
  save(gang: GangProfileAggregate): GangProfileAggregate

Interface ICriminalNetworkGraphRepository:
  findShortestPath(fromProfileId: UUID, toProfileId: UUID, maxDepth: int): NetworkPath?
  findCommunities(algorithm: CommunityAlgorithm, params: Map): List<Community>
  getNeighborhood(profileId: UUID, depth: int): NetworkSubgraph
  findInfluencers(centralityMetric: Enum, topK: int): List<RankedProfile>
  addEdge(edge: CriminalNetworkEdge): void
  removeEdge(sourceId: UUID, targetId: UUID, edgeType: string): void
```

### 8.5.6 Domain Services

| Service | Responsibility |
|---|---|
| `CriminalProfilingService` | Creates and maintains criminal profiles by aggregating data from multiple cases. Computes risk scores using ML model, identifies history-sheeters, manages alias resolution. |
| `NetworkAnalysisService` | Runs graph algorithms (community detection, centrality, shortest path) on the criminal network. Uses Neo4j Aura for graph operations. Identifies gang structures and criminal hierarchies. |
| `MOMatchingService` | Embeds MO descriptions using LLM, stores in Pinecone, performs semantic similarity search to match new crimes with known criminal MO profiles. |
| `IntelligenceCorrelationService` | Correlates intelligence from multiple sources (HUMINT, SIGINT, OSINT, case data) to build consolidated intelligence pictures. Applies confidence scoring. |
| `GangTrackingService` | Monitors gang activities, tracks membership changes, assesses threat levels, generates gang dossiers, alerts on territory expansion. |

---

## 8.6 Bounded Context #4: Geospatial Intelligence Context

### 8.6.1 Context Purpose & Justification

The Geospatial Intelligence Context transforms location data into spatial intelligence products: crime hotspot maps, patrol optimization, jurisdiction management, and spatial-temporal pattern analysis. Separated because:

1. **Specialized Data Model**: Geospatial data requires PostGIS geometries (Point, Polygon, MultiPolygon) and spatial indices (R-tree, GiST) unavailable in standard OLTP databases.
2. **Computational Profile**: Spatial operations (containment, intersection, buffer, clustering) are CPU-intensive and benefit from dedicated compute resources.
3. **Different Query Patterns**: Spatial queries ("all crimes within 2km of this location in last 30 days") are fundamentally different from relational queries.
4. **Visualization-Heavy**: This context feeds map-based UIs with tile servers, vector layers, and real-time position tracking.

### 8.6.2 Aggregates

#### Aggregate: JurisdictionAggregate (Root: JurisdictionBoundary)

```
┌─────────────────────────────────────────────────────────────┐
│           JurisdictionAggregate                              │
│  ┌──────────────────────────────────┐                       │
│  │  JurisdictionBoundary (Root)     │                       │
│  │  ─────────────────────────────── │                       │
│  │  JurisdictionId: UUID            │                       │
│  │  UnitId: FK (Police Station)     │                       │
│  │  BoundaryPolygon: MultiPolygon   │                       │
│  │  BoundarySource: Enum            │                       │
│  │  EffectiveFrom: DateTime         │                       │
│  │  EffectiveTo: DateTime?          │                       │
│  │  AreaSqKm: float (computed)      │                       │
│  │  CentroidLat: decimal            │                       │
│  │  CentroidLng: decimal            │                       │
│  └────────────┬─────────────────────┘                       │
│               │ 1:N                                         │
│  ┌────────────▼─────────────────────┐                       │
│  │  Beat (Entity)                  │                       │
│  │  ─────────────────────────────── │                       │
│  │  BeatId: UUID                   │                       │
│  │  JurisdictionId: FK             │                       │
│  │  BeatNumber: string             │                       │
│  │  BeatName: string               │                       │
│  │  BeatPolygon: Polygon           │                       │
│  │  PatrolRoute: LineString?       │                       │
│  │  AssignedOfficerId: FK?         │                       │
│  └──────────────────────────────────┘                       │
│               │ 1:N                                         │
│  ┌────────────▼─────────────────────┐                       │
│  │  CrimeHotspot (Entity)         │                       │
│  │  ─────────────────────────────── │                       │
│  │  HotspotId: UUID                │                       │
│  │  CentroidPoint: Point           │                       │
│  │  Radius: float (meters)         │                       │
│  │  Intensity: float (0-1)         │                       │
│  │  CrimeTypes: Enum[]             │                       │
│  │  TimePattern: CronExpression?   │                       │
│  │  ValidFrom: DateTime            │                       │
│  │  ValidTo: DateTime              │                       │
│  │  ComputedBy: string (model)     │                       │
│  └──────────────────────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

**Invariants:**
1. Beat polygons must be non-overlapping and their union must equal the `JurisdictionBoundary.BoundaryPolygon`.
2. No two active jurisdictions can have overlapping polygons (no spatial ambiguity).
3. `CrimeHotspot.Intensity` must be recomputed weekly or when crime count in area changes by >20%.

### 8.6.3 Value Objects

| Value Object | Properties | Validation |
|---|---|---|
| `SpatialPoint` | `latitude: decimal(10,8)`, `longitude: decimal(11,8)`, `srid: int = 4326` | Valid WGS84 coordinate |
| `SpatialPolygon` | `wkt: string`, `srid: int = 4326`, `areaSqKm: float` | Valid WKT, closed ring, non-self-intersecting |
| `BoundingBox` | `minLat, minLng, maxLat, maxLng: decimal` | min < max for both axes |
| `SpatioTemporalQuery` | `geometry: Polygon`, `timeRange: DateRange`, `crimeTypes: Enum[]?`, `radius: float?` | At least geometry or radius with center point |
| `HeatmapTile` | `z: int`, `x: int`, `y: int`, `values: float[][]` | Valid tile coordinates for zoom level |

### 8.6.4 Domain Events

| Event Name | Schema | Trigger |
|---|---|---|
| `CrimeGeocoded` | `{caseId, point, accuracy, source, reverseGeocodedAddress, jurisdictionId}` | GPS coordinates resolved for a crime |
| `HotspotUpdated` | `{hotspotId, jurisdictionId, newIntensity, crimeCount, timeWindow, crimeTypes}` | Hotspot intensity recomputed |
| `JurisdictionBoundaryChanged` | `{jurisdictionId, unitId, oldPolygon, newPolygon, effectiveDate, reason}` | Administrative boundary revision |
| `PatrolRouteOptimized` | `{beatId, oldRoute, newRoute, coverageImprovement, optimizationModel}` | ML-optimized patrol route generated |
| `SpatialAnomalyDetected` | `{anomalyId, location, type, description, confidence, relatedCaseIds}` | Unusual spatial crime pattern detected |

### 8.6.5 Domain Services

| Service | Responsibility |
|---|---|
| `GeocodingService` | Forward/reverse geocoding of crime locations. Uses Google Maps API primary, OpenStreetMap Nominatim fallback. Caches results in PostGIS. |
| `JurisdictionResolutionService` | Given a GPS coordinate, determines the owning police station jurisdiction via spatial containment query (ST_Contains). Critical for Zero FIR routing. |
| `HotspotAnalysisService` | Runs DBSCAN and kernel density estimation on crime points to identify and score hotspots. Updates weekly or on-demand. |
| `PatrolOptimizationService` | Uses vehicle routing algorithms (Google OR-Tools) to optimize patrol routes maximizing hotspot coverage while minimizing travel distance. |
| `SpatialQueryService` | Provides high-performance spatial queries: crimes within radius, crimes in polygon, nearest police station, spatial autocorrelation analysis (Moran's I). |

---

## 8.7 Bounded Context #5: Legal & Prosecution Context

### 8.7.1 Context Purpose & Justification

The Legal & Prosecution Context manages the legal lifecycle from chargesheet preparation through court proceedings, bail hearings, and case disposition. Separated because:

1. **External System Integration**: This context interfaces with eCourts (National Judicial Data Grid), making it conformist to external data models.
2. **Legal Domain Expertise**: Legal terminology, procedures, and timelines are distinct from policing operations.
3. **Regulatory Compliance**: BNSS 2023 mandates specific chargesheet formats, timelines, and electronic filing procedures.
4. **Different Stakeholders**: Prosecutors, court staff, and legal aid providers access this context but not investigation details.

### 8.7.2 Aggregates

#### Aggregate: ChargesheetAggregate (Root: ChargesheetDetails)

```
┌─────────────────────────────────────────────────────────────┐
│             ChargesheetAggregate                             │
│  ┌──────────────────────────────────┐                       │
│  │  ChargesheetDetails (Root)       │                       │
│  │  ─────────────────────────────── │                       │
│  │  ChargesheetId: UUID             │                       │
│  │  CaseId: FK                      │                       │
│  │  ChargesheetNumber: string       │                       │
│  │  FilingDate: DateTime            │                       │
│  │  CourtId: FK                     │                       │
│  │  ProsecutorId: FK?               │                       │
│  │  Status: Enum (Draft|Filed       │                       │
│  │    |Accepted|Returned|Supplementary) │                   │
│  │  DocumentRefId: string           │                       │
│  └────────────┬─────────────────────┘                       │
│               │ 1:N                                         │
│  ┌────────────▼─────────────────────┐                       │
│  │  ChargedSection (Entity)        │                       │
│  │  ─────────────────────────────── │                       │
│  │  Id: UUID                       │                       │
│  │  ChargesheetId: FK              │                       │
│  │  ActId: FK                      │                       │
│  │  SectionId: FK                  │                       │
│  │  IsPrimary: boolean             │                       │
│  └──────────────────────────────────┘                       │
│               │ 1:N                                         │
│  ┌────────────▼─────────────────────┐                       │
│  │  ChargedAccused (Entity)        │                       │
│  │  ─────────────────────────────── │                       │
│  │  Id: UUID                       │                       │
│  │  ChargesheetId: FK              │                       │
│  │  AccusedId: FK                  │                       │
│  │  ChargeStatus: Enum             │                       │
│  │  BailStatus: Enum               │                       │
│  │  CustodyType: Enum              │                       │
│  │  SectionsCharged: UUID[]        │                       │
│  └──────────────────────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

**Invariants:**
1. A chargesheet must reference at least one `ChargedSection` and one `ChargedAccused`.
2. `FilingDate` must be within BNSS-mandated timelines (60/90 days from arrest) unless court extension granted.
3. Once `Status == Filed`, sections and accused cannot be removed (only supplementary chargesheet can add).
4. All `SectionsCharged` for an accused must be a subset of the `ChargedSection` list.

#### Aggregate: ArrestAggregate (Root: ArrestSurrender)

```
┌─────────────────────────────────────────────────────────────┐
│                ArrestAggregate                               │
│  ┌──────────────────────────────────┐                       │
│  │  ArrestSurrender (Root)          │                       │
│  │  ─────────────────────────────── │                       │
│  │  ArrestId: UUID                  │                       │
│  │  CaseId: FK                      │                       │
│  │  AccusedId: FK                   │                       │
│  │  ArrestType: Enum (Arrest|       │                       │
│  │    Surrender|NBW_Execution)      │                       │
│  │  ArrestDate: DateTime            │                       │
│  │  ArrestingOfficerId: FK          │                       │
│  │  ArrestLocation: GPS (VO)        │                       │
│  │  RemandType: Enum (Police|       │                       │
│  │    Judicial|None)                │                       │
│  │  RemandDays: int                 │                       │
│  │  RemandCourtId: FK?              │                       │
│  │  BailGranted: boolean            │                       │
│  │  BailDate: DateTime?             │                       │
│  │  BailConditions: text?           │                       │
│  │  ProductionWarrantDate: DateTime?│                       │
│  └──────────────────────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

**Invariants:**
1. `RemandDays` for police custody cannot exceed 15 days total (BNSS mandate).
2. If `BailGranted == true`, `BailDate` and `BailConditions` are mandatory.
3. For each `ArrestType == NBW_Execution`, a corresponding warrant reference must exist.

### 8.7.3 Domain Events

| Event Name | Schema | Trigger |
|---|---|---|
| `ChargesheetFiled` | `{chargesheetId, caseId, courtId, accusedIds[], sectionIds[], filingDate}` | Chargesheet submitted to court |
| `AccusedArrested` | `{arrestId, caseId, accusedId, arrestDate, location, officerId}` | Accused taken into custody |
| `BailGranted` | `{arrestId, accusedId, caseId, courtId, bailDate, conditions}` | Court grants bail |
| `RemandExtended` | `{arrestId, accusedId, newRemandDays, courtOrderRef, remandType}` | Remand period extended by court |
| `CaseDisposed` | `{caseId, courtId, disposition: Enum(Convicted\|Acquitted\|Discharged\|Compounded), dispositionDate}` | Court reaches final verdict |
| `CourtHearingScheduled` | `{caseId, courtId, hearingDate, hearingType, previousHearingDate}` | Next hearing date set |

### 8.7.4 Domain Services

| Service | Responsibility |
|---|---|
| `ChargesheetPreparationService` | Assists IO in preparing chargesheet: validates completeness (all accused listed, all sections supported by evidence), generates standard format document. |
| `BailTrackingService` | Monitors bail applications, tracks conditions compliance, generates alerts for bail violation, and maintains bail bond register. |
| `CourtIntegrationService` | Anti-corruption layer interfacing with eCourts/NJDG API. Translates between KAICIP internal model and court system schemas. Syncs hearing dates and dispositions. |
| `RemandManagementService` | Tracks custody days, generates remand expiry alerts, calculates maximum permissible custody, and manages production warrant scheduling. |
| `LegalSectionAdvisoryService` | AI-powered service that suggests applicable legal sections based on crime description. Maps IPC to BNS, CrPC to BNSS for ongoing transition. |

---

## 8.8 Bounded Context #6: Personnel & Organization Context

### 8.8.1 Context Purpose & Justification

This context manages the organizational hierarchy of Karnataka Police (DGP → ADGP → IGP → DIG → SP → DySP → CI → PI → PSI → ASI → HC → PC) and employee records. Separated as a Generic Subdomain because:

1. **Shared Reference Data**: Every other context needs employee and unit information but must not be coupled to its internal model.
2. **Organizational Stability**: Police hierarchy changes rarely (annual transfers) vs. crime data changes constantly.
3. **Published Language**: This context exposes a stable, published API for employee lookup that all other contexts conform to.

### 8.8.2 Aggregates

#### Aggregate: EmployeeAggregate (Root: Employee)

```
┌─────────────────────────────────────────────────────────────┐
│               EmployeeAggregate                              │
│  ┌──────────────────────────────────┐                       │
│  │  Employee (Aggregate Root)       │                       │
│  │  ─────────────────────────────── │                       │
│  │  EmployeeId: UUID                │                       │
│  │  KGID: string (unique)           │                       │
│  │  Name: PersonName (VO)           │                       │
│  │  RankId: FK                      │                       │
│  │  DesignationId: FK               │                       │
│  │  CurrentUnitId: FK               │                       │
│  │  DateOfJoining: DateTime         │                       │
│  │  DateOfRetirement: DateTime      │                       │
│  │  Phone: PhoneNumber (VO)         │                       │
│  │  Email: string                   │                       │
│  │  IsActive: boolean               │                       │
│  │  PhotoRefId: string?             │                       │
│  └────────────┬─────────────────────┘                       │
│               │ 1:N                                         │
│  ┌────────────▼─────────────────────┐                       │
│  │  PostingHistory (Entity)        │                       │
│  │  ─────────────────────────────── │                       │
│  │  PostingId: UUID                │                       │
│  │  EmployeeId: FK                 │                       │
│  │  UnitId: FK                     │                       │
│  │  RankId: FK                     │                       │
│  │  FromDate: DateTime             │                       │
│  │  ToDate: DateTime?              │                       │
│  │  TransferOrderRef: string       │                       │
│  └──────────────────────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

#### Aggregate: OrganizationAggregate (Root: Unit)

```
┌─────────────────────────────────────────────────────────────┐
│              OrganizationAggregate                            │
│  ┌──────────────────────────────────┐                       │
│  │  Unit (Aggregate Root)           │                       │
│  │  ─────────────────────────────── │                       │
│  │  UnitId: UUID                    │                       │
│  │  UnitName: string                │                       │
│  │  UnitTypeId: FK                  │                       │
│  │  ParentUnitId: FK? (self-ref)    │                       │
│  │  DistrictId: FK                  │                       │
│  │  StateId: FK                     │                       │
│  │  Address: Address (VO)           │                       │
│  │  Phone: PhoneNumber (VO)         │                       │
│  │  HeadOfficerId: FK (Employee)    │                       │
│  │  Latitude: decimal               │                       │
│  │  Longitude: decimal              │                       │
│  │  IsActive: boolean               │                       │
│  └──────────────────────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

**Invariants:**
1. An Employee must have exactly one active posting (one `PostingHistory` with `ToDate == null`).
2. The organizational hierarchy must form a valid tree: State HQ → Zone/Range → District → Sub-Division → Circle → Station.
3. `HeadOfficerId` rank must be appropriate for the `UnitType` (e.g., SP for District, PI for Station).
4. `KGID` is immutable once assigned.

### 8.8.3 Domain Events

| Event Name | Schema | Trigger |
|---|---|---|
| `EmployeeTransferred` | `{employeeId, fromUnitId, toUnitId, effectiveDate, orderRef}` | Annual/mid-term transfer |
| `EmployeePromoted` | `{employeeId, fromRankId, toRankId, effectiveDate, orderRef}` | Rank promotion |
| `UnitCreated` | `{unitId, unitName, unitTypeId, parentUnitId, districtId}` | New police station/unit established |
| `UnitHeadChanged` | `{unitId, previousHeadId, newHeadId, effectiveDate}` | Station/unit head reassignment |

---

## 8.9 Bounded Context #7: Analytics & Reporting Context

### 8.9.1 Context Purpose & Justification

This context consumes events from all other contexts to build analytical views, dashboards, and statutory reports (monthly crime statistics, NCRB format reports, state legislature reports). Separated because:

1. **Read-Optimized**: Analytics uses denormalized, pre-aggregated data models optimized for OLAP queries, fundamentally different from OLTP models.
2. **Different SLAs**: Dashboard queries can tolerate seconds of staleness (eventual consistency) unlike transactional contexts.
3. **Heavy Compute**: Aggregation pipelines, trend analysis, and report generation are resource-intensive.
4. **Regulatory Reports**: NCRB Annual Crime Statistics format requires specific cross-tabulations that cut across multiple bounded contexts.

### 8.9.2 Aggregates

This context primarily uses **read models** (CQRS query side), not traditional DDD aggregates. Key read models:

| Read Model | Source Contexts | Purpose | Refresh Cadence |
|---|---|---|---|
| `CrimeStatisticsCube` | Crime Registration, Investigation, Legal | Multi-dimensional crime statistics by district/crime-type/time | Every 15 minutes |
| `OfficerPerformanceView` | Investigation, Personnel, Legal | IO performance: case clearance rate, chargesheet rate, conviction rate | Daily |
| `StationDashboardView` | All contexts | Consolidated station-level KPIs | Real-time (event-driven) |
| `NCRBReportView` | Crime Registration, Legal, Demographics | Pre-computed NCRB format statistics | Monthly batch |
| `TrendAnalysisView` | Crime Registration, Geospatial | Time-series crime trends with seasonal decomposition | Weekly |
| `JurisdictionComparison` | Crime Registration, Personnel, Geospatial | Cross-jurisdictional comparative analytics | Daily |

### 8.9.3 Domain Events (Consumed)

This context is primarily an **event consumer**. It listens to events from all other contexts and materializes read models. It produces:

| Event Name | Schema | Trigger |
|---|---|---|
| `ReportGenerated` | `{reportId, reportType, parameters, generatedBy, timestamp, storageRef}` | Statutory or ad-hoc report produced |
| `AnomalyDetected` | `{anomalyId, metric, expectedValue, actualValue, deviation, affectedUnit, timestamp}` | Statistical anomaly in crime trends |
| `DashboardAlertTriggered` | `{alertId, alertType, severity, metric, threshold, currentValue, affectedUnits}` | Dashboard KPI crosses threshold |

---

## 8.10 Bounded Context #8: AI/ML Intelligence Context

### 8.10.1 Context Purpose & Justification

This context encapsulates all AI/ML capabilities: crime prediction, MO matching, entity resolution, NLP extraction, suspect recommendation, and anomaly detection. Separated because:

1. **Computational Profile**: ML inference and training require GPUs and specialized runtimes (Python/TensorFlow/PyTorch) different from application services.
2. **Model Lifecycle**: ML models have independent deployment cadences (retraining schedules) from application code.
3. **Data Pipeline**: ML requires feature engineering pipelines that consume and transform data from multiple contexts.
4. **Isolation**: ML model failures should never impact core transactional operations (FIR registration).

### 8.10.2 Aggregates

#### Aggregate: MLModelAggregate (Root: MLModel)

```
┌─────────────────────────────────────────────────────────────┐
│                MLModelAggregate                              │
│  ┌──────────────────────────────────┐                       │
│  │  MLModel (Aggregate Root)        │                       │
│  │  ─────────────────────────────── │                       │
│  │  ModelId: UUID                   │                       │
│  │  ModelName: string               │                       │
│  │  ModelType: Enum (Classification │                       │
│  │    |Regression|Clustering|NLP    │                       │
│  │    |GraphML|TimeSeries|GenAI)    │                       │
│  │  CurrentVersion: string          │                       │
│  │  Status: Enum (Training|Staging  │                       │
│  │    |Production|Deprecated)       │                       │
│  │  Endpoint: URL                   │                       │
│  │  SLA: LatencyTarget (VO)        │                       │
│  │  LastTrainedDate: DateTime       │                       │
│  │  TrainingDataCutoff: DateTime    │                       │
│  │  Metrics: ModelMetrics (VO)      │                       │
│  └────────────┬─────────────────────┘                       │
│               │ 1:N                                         │
│  ┌────────────▼─────────────────────┐                       │
│  │  ModelVersion (Entity)          │                       │
│  │  ─────────────────────────────── │                       │
│  │  VersionId: UUID                │                       │
│  │  ModelId: FK                    │                       │
│  │  VersionTag: string (semver)    │                       │
│  │  ArtifactRef: string (S3 URI)   │                       │
│  │  TrainingDatasetRef: string     │                       │
│  │  Accuracy: float                │                       │
│  │  Precision: float               │                       │
│  │  Recall: float                  │                       │
│  │  F1Score: float                 │                       │
│  │  AUC_ROC: float                 │                       │
│  │  TrainedAt: DateTime            │                       │
│  │  PromotedToProduction: DateTime?│                       │
│  └──────────────────────────────────┘                       │
│               │ 1:N                                         │
│  ┌────────────▼─────────────────────┐                       │
│  │  PredictionLog (Entity)         │                       │
│  │  ─────────────────────────────── │                       │
│  │  LogId: UUID                    │                       │
│  │  ModelId: FK                    │                       │
│  │  VersionId: FK                  │                       │
│  │  InputHash: string              │                       │
│  │  Prediction: JSON               │                       │
│  │  Confidence: float              │                       │
│  │  LatencyMs: int                 │                       │
│  │  Timestamp: DateTime            │                       │
│  │  FeedbackLabel: string?         │                       │
│  │  FeedbackBy: EmployeeId?        │                       │
│  └──────────────────────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

**Invariants:**
1. Only one `ModelVersion` per `ModelId` can have `Status == Production` at any time.
2. A model cannot be promoted to `Production` unless `Accuracy >= 0.80` and `F1Score >= 0.75`.
3. `PredictionLog` is append-only for audit compliance.
4. Model must be retrained if `TrainingDataCutoff` is more than 90 days old.

### 8.10.3 Domain Events

| Event Name | Schema | Trigger |
|---|---|---|
| `PredictionGenerated` | `{modelId, versionId, inputRef, prediction, confidence, latencyMs, timestamp}` | ML inference completed |
| `ModelPromotedToProduction` | `{modelId, versionId, previousVersionId, metrics, promotedBy, timestamp}` | New model version goes live |
| `ModelDriftDetected` | `{modelId, versionId, driftMetric, driftValue, threshold, detectedAt}` | Performance degradation detected |
| `TrainingCompleted` | `{modelId, versionId, metrics, datasetSize, trainingDurationMin, timestamp}` | Model training pipeline finishes |
| `HumanFeedbackRecorded` | `{logId, modelId, feedbackLabel, feedbackBy, timestamp}` | Officer provides ground truth for prediction |

### 8.10.4 Domain Services

| Service | Responsibility |
|---|---|
| `CrimePredictionService` | Predicts crime probability by location and time using spatiotemporal models. Feeds hotspot analysis. Uses Vertex AI custom model with PostGIS feature inputs. |
| `EntityResolutionService` | Resolves duplicate persons across cases using fuzzy matching (name, age, address, biometric). Uses Pinecone embeddings for semantic similarity + deterministic rules. |
| `NLPExtractionService` | Extracts structured entities (persons, locations, weapons, vehicles) from FIR narratives using Gemini 2.5. Populates structured fields from unstructured text. |
| `SuspectRecommendationService` | Given a new crime's MO, location, and time, recommends potential suspects from criminal profiles. Combines MO vector similarity + geographic proximity + temporal availability. |
| `AnomalyDetectionService` | Detects statistical anomalies in crime patterns: sudden spikes, unusual geographic spread, temporal anomalies. Uses Isolation Forest and LSTM autoencoder. |
| `ModelLifecycleService` | Manages model training, evaluation, A/B testing, promotion, and retirement. Integrates with MLflow for experiment tracking and Vertex AI for training infrastructure. |

---

## 8.11 Bounded Context #9: Administration Context

### 8.11.1 Context Purpose & Justification

Generic subdomain managing master data (Acts, Sections, Crime Heads, Castes, Religions, Occupations), system configuration, and user preferences. Separated as a generic subdomain because this is commodity functionality that every government system needs.

### 8.11.2 Aggregates

#### Aggregate: LegalMasterAggregate (Root: Act)

Manages the Act → Section → CrimeHead → CrimeSubHead hierarchy.

**Entities:** Act, Section, ActSectionAssociation, CrimeHead, CrimeSubHead, CrimeHeadActSection

**Invariants:**
1. An `ActSectionAssociation` must reference valid `ActId` and `SectionId`.
2. `CrimeHeadActSection` must form valid hierarchical path: CrimeHead → CrimeSubHead → Act → Section.
3. Acts cannot be deleted if any `CaseMaster` references their sections (soft delete only).
4. Section numbering must be unique within an Act.

#### Aggregate: DemographicMasterAggregate

Manages CasteMaster, ReligionMaster, OccupationMaster.

**Invariants:**
1. Master codes must be unique per category.
2. Mappings must align with Census of India classifications.
3. No master record can be hard-deleted if referenced by any person record.

### 8.11.3 Domain Events

| Event Name | Schema | Trigger |
|---|---|---|
| `ActAdded` | `{actId, actName, actYear, isActive}` | New legislation added to system |
| `SectionAmended` | `{sectionId, actId, oldText, newText, amendmentDate, amendmentActRef}` | Legislative amendment |
| `MasterDataUpdated` | `{entityType, entityId, field, oldValue, newValue, updatedBy, timestamp}` | Any master data change |

---

## 8.12 Bounded Context #10: Integration Context

### 8.12.1 Context Purpose & Justification

This context is the **Anti-Corruption Layer** and **Gateway** to all external systems. It translates between KAICIP's internal models and external system schemas. Separated because:

1. **External System Isolation**: Changes in CCTNS, ICJS, NCRB, or eCourts schemas should not propagate into core domain models.
2. **Protocol Translation**: External systems use SOAP (legacy), REST, SFTP (batch files), and proprietary protocols.
3. **Rate Limiting & Throttling**: External API quotas must be managed centrally.
4. **Data Quality**: External data requires cleansing, validation, and enrichment before entering the platform.

### 8.12.2 Key Integration Adapters

| Adapter | External System | Protocol | Direction |
|---|---|---|---|
| `CCTNSAdapter` | Crime & Criminal Tracking Network (NCRB) | REST/SOAP | Bidirectional |
| `ICJSAdapter` | Inter-operable Criminal Justice System | REST | Bidirectional |
| `ECourtsAdapter` | National Judicial Data Grid | REST | Inbound |
| `NCRBReportAdapter` | National Crime Records Bureau | SFTP/REST | Outbound |
| `AFISAdapter` | Automated Fingerprint Identification | Proprietary | Bidirectional |
| `VahanAdapter` | Vehicle Registration Database | REST | Inbound |
| `AadhaarAdapter` | UIDAI (with legal authorization) | REST (encrypted) | Inbound |
| `PrisonAdapter` | Prison Management System (ePrisons) | REST | Bidirectional |
| `WeatherAdapter` | IMD Weather Service | REST | Inbound |
| `SocialMediaAdapter` | OSINT feeds | REST/WebSocket | Inbound |

### 8.12.3 Domain Events

| Event Name | Schema | Trigger |
|---|---|---|
| `ExternalSyncCompleted` | `{adapterId, systemName, recordsSynced, errors, duration, timestamp}` | Batch sync with external system |
| `ExternalSyncFailed` | `{adapterId, systemName, errorCode, errorMessage, retryCount, timestamp}` | Sync failure |
| `InboundDataReceived` | `{adapterId, sourceSystem, dataType, recordCount, validationStatus, timestamp}` | Data received from external system |

---

## 8.13 Complete Context Map with Relationship Types

```
╔══════════════════════════════════════════════════════════════════════════════════════╗
║                       DETAILED CONTEXT RELATIONSHIP MAP                             ║
╠══════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                     ║
║  ┌──────────────┐         Shared Kernel           ┌──────────────────┐              ║
║  │    CRIME      │ ════════════════════════════════ │  INVESTIGATION   │              ║
║  │ REGISTRATION  │  (CaseId, AccusedId, VictimId,  │                  │              ║
║  │              │   ActSection identifiers)        │                  │              ║
║  │  Upstream ●   │                                 │  ● Downstream    │              ║
║  └──────┬───────┘                                  └────────┬─────────┘              ║
║         │                                                   │                        ║
║         │ Published Language                                │ Customer-Supplier      ║
║         │ (FIR events, stable API)                          │ (needs case context)   ║
║         │                                                   │                        ║
║         ▼                                                   ▼                        ║
║  ┌──────────────┐     Anti-Corruption Layer        ┌──────────────────┐              ║
║  │   LEGAL &     │ ◄─────────────────────────────── │    CRIMINAL      │              ║
║  │ PROSECUTION   │  (Translates intelligence model  │  INTELLIGENCE    │              ║
║  │              │   to legal evidence model)        │                  │              ║
║  │  Conformist   │                                  │  ● Upstream      │              ║
║  │  (to eCourts) │                                  │                  │              ║
║  └──────┬───────┘                                   └────────┬─────────┘              ║
║         │                                                    │                        ║
║         │ Conformist                                         │ Open Host Service      ║
║         │ (adapts to court data model)                       │ (exposes profile API)  ║
║         │                                                    │                        ║
║         ▼                                                    ▼                        ║
║  ┌──────────────┐    Open Host Service             ┌──────────────────┐              ║
║  │  GEOSPATIAL   │ ════════════════════════════════ │    AI/ML         │              ║
║  │ INTELLIGENCE  │  (Spatial query API consumed     │  INTELLIGENCE    │              ║
║  │              │   by ML for feature engineering)  │                  │              ║
║  │  ● Provider   │                                  │  ● Consumer      │              ║
║  └──────┬───────┘                                   └────────┬─────────┘              ║
║         │                                                    │                        ║
║         │ Open Host Service                                  │ Published Language     ║
║         │ (tile server, spatial API)                          │ (prediction events)    ║
║         │                                                    │                        ║
║         ▼                                                    ▼                        ║
║  ┌──────────────┐      Shared Kernel               ┌──────────────────┐              ║
║  │  ANALYTICS &  │ ════════════════════════════════ │   PERSONNEL &    │              ║
║  │  REPORTING    │  (Employee, Unit as shared       │  ORGANIZATION    │              ║
║  │              │   reference data)                 │                  │              ║
║  │  Consumer ●   │                                  │  ● Publisher     │              ║
║  └──────┬───────┘                                   └────────┬─────────┘              ║
║         │                                                    │                        ║
║         │                                                    │ Published Language     ║
║         │                                                    │ (stable org API)       ║
║         ▼                                                    ▼                        ║
║  ┌──────────────┐    Anti-Corruption Layer          ┌──────────────────┐              ║
║  │ADMINISTRATION │ ◄────────────────────────────── │   INTEGRATION    │              ║
║  │              │  (External master data cleaned    │                  │              ║
║  │  ● Provider   │   before entering admin context) │  ACL Gateway ●   │              ║
║  │  (master data)│                                  │                  │              ║
║  └──────────────┘                                   └──────────────────┘              ║
║                                                                                      ║
║  RELATIONSHIP LEGEND:                                                                ║
║  ════  Shared Kernel (bidirectional shared model, joint ownership)                   ║
║  ◄────  Anti-Corruption Layer (translator protects downstream from upstream changes) ║
║  ────►  Customer-Supplier (upstream prioritizes downstream needs)                    ║
║  ════  Open Host Service (public API with published protocol)                        ║
║  ●     indicates the role (Upstream/Downstream/Provider/Consumer)                    ║
║                                                                                      ║
║  DOMAIN CLASSIFICATION:                                                              ║
║  Core Domain: Crime Registration, Investigation, Criminal Intelligence,              ║
║               Legal & Prosecution (competitive advantage)                            ║
║  Supporting Domain: Geospatial Intelligence, AI/ML Intelligence,                     ║
║                     Analytics & Reporting (necessary, differentiating)               ║
║  Generic Subdomain: Personnel & Organization, Administration,                        ║
║                     Integration (commodity, replaceable)                              ║
╚══════════════════════════════════════════════════════════════════════════════════════╝
```

---

# 9. Enterprise Microservice Architecture

## 9.1 Architecture Overview

### 9.1.1 Decomposition Strategy

Microservice boundaries are aligned with DDD bounded contexts, with additional services created where a single bounded context contains multiple independently scalable concerns. The decomposition follows these principles:

1. **Single Responsibility**: Each service owns one capability domain
2. **Data Sovereignty**: Each service owns its database(s) — no shared databases
3. **Independent Deployment**: Services can be deployed without coordinating with others
4. **Technology Heterogeneity**: Services choose the best database/runtime for their workload
5. **Failure Isolation**: Service failures are contained by bulkheads and circuit breakers

### 9.1.2 Service Dependency Overview

```
╔══════════════════════════════════════════════════════════════════════════════════════╗
║                      SERVICE DEPENDENCY GRAPH                                       ║
╠══════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                     ║
║                          ┌─────────────────┐                                        ║
║                          │   API Gateway    │                                        ║
║                          │  (Kong + Catalyst│                                        ║
║                          │   API Gateway)   │                                        ║
║                          └────────┬─────────┘                                        ║
║                                   │                                                  ║
║              ┌────────────────────┼────────────────────┐                             ║
║              │                    │                    │                              ║
║              ▼                    ▼                    ▼                              ║
║  ┌───────────────────┐ ┌──────────────────┐ ┌──────────────────┐                    ║
║  │ Identity & Access │ │ Crime            │ │ Search &         │                    ║
║  │ Service           │ │ Registration Svc │ │ Discovery Svc    │                    ║
║  └───────┬───────────┘ └──────┬───────────┘ └──────┬───────────┘                    ║
║          │                    │                     │                                 ║
║          │  ┌─────────────────┼─────────────────────┤                                ║
║          │  │                 │                     │                                 ║
║          │  ▼                 ▼                     ▼                                 ║
║          │  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐                   ║
║          │  │Investigation │ │ Criminal     │ │ Geospatial       │                   ║
║          │  │ Service      │ │ Profile Svc  │ │ Intelligence Svc │                   ║
║          │  └──────┬───────┘ └──────┬───────┘ └──────┬───────────┘                   ║
║          │         │                │                │                                ║
║          │  ┌──────┼────────────────┼────────────────┤                                ║
║          │  │      │                │                │                                ║
║          │  ▼      ▼                ▼                ▼                                ║
║          │  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐                   ║
║          │  │ Document &   │ │ Network      │ │ Analytics Engine │                   ║
║          │  │ Evidence Svc │ │ Intel Svc    │ │ Service          │                   ║
║          │  └──────────────┘ └──────┬───────┘ └──────┬───────────┘                   ║
║          │                          │                │                                ║
║          │  ┌───────────────────────┼────────────────┤                                ║
║          │  │                       │                │                                ║
║          │  ▼                       ▼                ▼                                ║
║          │  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐                   ║
║          │  │ Court &      │ │ AI/ML        │ │ Reporting        │                   ║
║          │  │ Legal Svc    │ │ Pipeline Svc │ │ Service          │                   ║
║          │  └──────────────┘ └──────────────┘ └──────────────────┘                   ║
║          │                                                                           ║
║          │  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐                   ║
║          ├─►│ Personnel    │ │ Organization │ │ Notification     │                   ║
║          │  │ Service      │ │ Hierarchy Svc│ │ Service          │                   ║
║          │  └──────────────┘ └──────────────┘ └──────────────────┘                   ║
║          │                                                                           ║
║          │  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐                   ║
║          └─►│ Audit &      │ │ Data         │ │ Gateway & API    │                   ║
║             │ Compliance   │ │ Ingestion Svc│ │ Management Svc   │                   ║
║             └──────────────┘ └──────────────┘ └──────────────────┘                   ║
║                                                                                      ║
║  Arrow (──►) indicates "depends on / calls"                                         ║
║  All services depend on Identity & Access (auth) — shown only for clarity            ║
╚══════════════════════════════════════════════════════════════════════════════════════╝
```

### 9.1.3 Deployment Topology

```
╔══════════════════════════════════════════════════════════════════════════════════════╗
║                        DEPLOYMENT TOPOLOGY                                          ║
╠══════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                     ║
║  ┌─────────────────────── ZOHO CATALYST PLATFORM ──────────────────────────────┐    ║
║  │                                                                              │    ║
║  │  ┌──── AppSail (Containerized Services) ────────────────────────────────┐   │    ║
║  │  │                                                                       │   │    ║
║  │  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────┐   │   │    ║
║  │  │  │ Crime Reg.   │ │Investigation │ │ Criminal     │ │ Court &    │   │   │    ║
║  │  │  │ Service      │ │ Service      │ │ Profile Svc  │ │ Legal Svc  │   │   │    ║
║  │  │  │ (3 replicas) │ │ (3 replicas) │ │ (2 replicas) │ │(2 replicas)│   │   │    ║
║  │  │  └──────────────┘ └──────────────┘ └──────────────┘ └────────────┘   │   │    ║
║  │  │                                                                       │   │    ║
║  │  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────┐   │   │    ║
║  │  │  │ Personnel    │ │ Org Hier.    │ │ Search &     │ │ Gateway &  │   │   │    ║
║  │  │  │ Service      │ │ Service      │ │ Discovery    │ │ API Mgmt   │   │   │    ║
║  │  │  │ (2 replicas) │ │ (2 replicas) │ │ (3 replicas) │ │(2 replicas)│   │   │    ║
║  │  │  └──────────────┘ └──────────────┘ └──────────────┘ └────────────┘   │   │    ║
║  │  │                                                                       │   │    ║
║  │  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                  │   │    ║
║  │  │  │ Identity &   │ │ Audit &      │ │ Reporting    │                  │   │    ║
║  │  │  │ Access Svc   │ │ Compliance   │ │ Service      │                  │   │    ║
║  │  │  │ (3 replicas) │ │ (2 replicas) │ │ (2 replicas) │                  │   │    ║
║  │  │  └──────────────┘ └──────────────┘ └──────────────┘                  │   │    ║
║  │  └───────────────────────────────────────────────────────────────────────┘   │    ║
║  │                                                                              │    ║
║  │  ┌──── Catalyst Functions (Serverless) ─────────────────────────────────┐   │    ║
║  │  │                                                                       │   │    ║
║  │  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────┐   │   │    ║
║  │  │  │ Notification │ │ Data         │ │ Document &   │ │ Analytics  │   │   │    ║
║  │  │  │ Functions    │ │ Ingestion    │ │ Evidence     │ │ Engine     │   │   │    ║
║  │  │  │ (auto-scale) │ │ Functions    │ │ Functions    │ │ Functions  │   │   │    ║
║  │  │  └──────────────┘ └──────────────┘ └──────────────┘ └────────────┘   │   │    ║
║  │  └───────────────────────────────────────────────────────────────────────┘   │    ║
║  │                                                                              │    ║
║  │  ┌──── Catalyst Data Store ─────────┐  ┌──── Catalyst Cache ────────────┐   │    ║
║  │  │  Primary OLTP tables             │  │  Session data, hot lookups     │   │    ║
║  │  │  (26 core tables + service-      │  │  (master data, unit hierarchy, │   │    ║
║  │  │   specific tables)               │  │   active sessions)             │   │    ║
║  │  └──────────────────────────────────┘  └────────────────────────────────┘   │    ║
║  └──────────────────────────────────────────────────────────────────────────────┘    ║
║                                                                                     ║
║  ┌─────────────────────── EXTERNAL MANAGED SERVICES ───────────────────────────┐    ║
║  │                                                                              │    ║
║  │  ┌──── AWS EKS (Specialized Workloads) ──────────────────────────────┐      │    ║
║  │  │  ┌──────────────┐ ┌──────────────┐                                │      │    ║
║  │  │  │ AI/ML        │ │ Network      │  GPU-enabled nodes             │      │    ║
║  │  │  │ Pipeline Svc │ │ Intel Svc    │  (p3.2xlarge)                  │      │    ║
║  │  │  │ (2-8 pods)   │ │ (2-4 pods)   │                                │      │    ║
║  │  │  └──────────────┘ └──────────────┘                                │      │    ║
║  │  └───────────────────────────────────────────────────────────────────┘      │    ║
║  │                                                                              │    ║
║  │  ┌──── Managed Databases ────────────────────────────────────────────┐      │    ║
║  │  │  Neo4j Aura    │  Elastic Cloud  │  PostGIS (RDS)  │  Pinecone   │      │    ║
║  │  │  (Graph DB)    │  (Search)       │  (Geospatial)   │  (Vectors)  │      │    ║
║  │  └────────────────┴─────────────────┴─────────────────┴─────────────┘      │    ║
║  │                                                                              │    ║
║  │  ┌──── Streaming & Analytics ────────────────────────────────────────┐      │    ║
║  │  │  Confluent Cloud (Kafka)  │  Databricks Lakehouse (Delta Lake)   │      │    ║
║  │  └───────────────────────────┴──────────────────────────────────────┘      │    ║
║  │                                                                              │    ║
║  │  ┌──── AI/ML Platform ──────────────────────────────────────────────┐      │    ║
║  │  │  Google Vertex AI (Gemini 2.5)  │  MLflow  │  Catalyst QuickML  │      │    ║
║  │  └─────────────────────────────────┴──────────┴─────────────────────┘      │    ║
║  └──────────────────────────────────────────────────────────────────────────────┘    ║
╚══════════════════════════════════════════════════════════════════════════════════════╝
```

---

## 9.2 Service #1: Crime Registration Service

### Responsibility
The Crime Registration Service is the authoritative system of record for all First Information Reports (FIRs), Unnumbered Daily Reports (UDRs), Preliminary Act Reports (PARs), and Non-Cognizable Reports (NCRs) in Karnataka State. It handles the complete registration lifecycle including complaint intake, FIR number generation, crime classification, section assignment, complainant recording, and Zero FIR processing. This service enforces BNSS 2023 compliance for e-FIR, ensures sub-second registration response times even during mass-incident scenarios, and publishes authoritative case creation events consumed by 12+ downstream services.

### Input/Output Contracts

| Operation | Input | Output |
|---|---|---|
| Register FIR | `RegisterFIRRequest{complainant, crimeDetails, sections[], location, briefFacts}` | `FIRResponse{caseId, firNumber, status, registeredAt}` |
| Register Zero FIR | `ZeroFIRRequest{complainant, crimeDetails, sections[], reportingStation, incidentLocation}` | `ZeroFIRResponse{caseId, firNumber, targetJurisdiction, transferDeadline}` |
| Update Case Status | `UpdateStatusRequest{caseId, newStatus, remarks}` | `StatusResponse{caseId, oldStatus, newStatus, updatedAt}` |
| Amend Sections | `AmendSectionsRequest{caseId, addSections[], removeSections[], reason}` | `AmendmentResponse{caseId, currentSections[], amendedAt}` |
| Get Case Details | `caseId: UUID` | `CaseDetailResponse{full case with sections, complainant, accused, victims, status history}` |

### REST API Endpoints

| Method | Endpoint | Description | Auth Level |
|---|---|---|---|
| `POST` | `/api/v1/cases/fir` | Register new FIR | `ROLE_SHO, ROLE_WRITER_PI` |
| `POST` | `/api/v1/cases/zero-fir` | Register Zero FIR | `ROLE_SHO, ROLE_WRITER_PI` |
| `POST` | `/api/v1/cases/udr` | Register UDR | `ROLE_WRITER_ASI+` |
| `PUT` | `/api/v1/cases/{caseId}/status` | Update case status | `ROLE_SHO, ROLE_IO` |
| `PUT` | `/api/v1/cases/{caseId}/sections` | Amend sections | `ROLE_SHO, ROLE_IO` |
| `GET` | `/api/v1/cases/{caseId}` | Get case details | `ROLE_READER+` |
| `GET` | `/api/v1/cases?stationId=&dateFrom=&dateTo=&status=` | List cases with filters | `ROLE_READER+` |
| `POST` | `/api/v1/cases/{caseId}/transfer` | Transfer case to another station | `ROLE_SP, ROLE_DySP` |
| `GET` | `/api/v1/cases/{caseId}/history` | Get case status history | `ROLE_READER+` |
| `POST` | `/api/v1/cases/{caseId}/complainant` | Add/update complainant | `ROLE_WRITER_ASI+` |
| `GET` | `/api/v1/cases/statistics?stationId=&period=` | Case registration statistics | `ROLE_READER+` |
| `POST` | `/api/v1/cases/{caseId}/accused` | Link accused to case | `ROLE_IO, ROLE_SHO` |

### Database

**Primary**: Catalyst Data Store (ZTABLE)
- **Why**: Core transactional workload with ACID requirements. Catalyst Data Store provides managed relational storage with automatic scaling, built-in backup, and tight integration with Catalyst Functions and AppSail. FIR data has a relational structure (case → sections, case → accused, case → victims) that maps naturally to relational tables.
- **Tables Owned**: `CaseMaster`, `ComplainantDetails`, `CaseCategory`, `CaseStatusMaster`, `GravityOffence`
- **Estimated Volume**: ~500K new records/year Karnataka, growing to 10M/year all-India
- **Indexing Strategy**: Composite index on `(PoliceStationId, FIRYear, FIRNumber)` for uniqueness; index on `(DistrictId, CaseStatus, FIRDate)` for dashboard queries; full-text index on `BriefFacts` via Elasticsearch sync.

**Secondary**: Elasticsearch (Elastic Cloud)
- **Why**: Full-text search on FIR narratives (BriefFacts field), typo-tolerant complainant name search, and aggregation queries for dashboards.
- **Sync Mechanism**: CDC via domain events → Kafka → Elasticsearch sink connector.

### Scaling Strategy

| Trigger | Action | Mechanism |
|---|---|---|
| Request rate > 500 req/s | Scale AppSail replicas from 3 → 6 | Catalyst auto-scaling (CPU > 70%) |
| Registration queue depth > 100 | Add consumer instances | Catalyst Signals consumer scaling |
| Mass incident (>100 FIRs/minute from single district) | Activate burst mode: pre-allocate FIR number blocks per station | Emergency scaling playbook |
| Database connection pool > 80% | Scale read replicas | Catalyst Data Store read replica |
| Response latency p99 > 500ms | Scale horizontally + enable response caching for reads | Auto-scaling + cache activation |

### Dependencies

| Direction | Service | Interaction Type | Purpose |
|---|---|---|---|
| Upstream | Identity & Access Service | Sync REST | Authenticate and authorize users |
| Upstream | Personnel Service | Sync REST | Validate IO assignment, get employee details |
| Upstream | Organization Hierarchy Service | Sync REST (cached) | Validate station, get jurisdiction hierarchy |
| Downstream | Investigation Service | Async Event | `FIRRegistered` triggers investigation setup |
| Downstream | Criminal Profile Service | Async Event | `AccusedLinked` feeds criminal profiling |
| Downstream | Geospatial Intelligence Service | Async Event | `FIRRegistered` with GPS feeds spatial analysis |
| Downstream | Notification Service | Async Event | `FIRRegistered` triggers SMS/email notifications |
| Downstream | Search & Discovery Service | Async Event | Case data indexed for search |
| Downstream | Analytics Engine Service | Async Event | Crime statistics updated |
| Downstream | Audit & Compliance Service | Async Event | All mutations logged |

### Failure Isolation

| Pattern | Configuration | Rationale |
|---|---|---|
| **Circuit Breaker** (Personnel Service) | `failureThreshold: 5, resetTimeout: 30s, halfOpenRequests: 3` | If Personnel Service is down, FIR registration caches last-known IO data and proceeds. IO validation is not blocking. |
| **Circuit Breaker** (Org Hierarchy Service) | `failureThreshold: 3, resetTimeout: 60s` | Station hierarchy is cached with 24-hour TTL. Circuit breaker prevents cascade on hierarchy service failure. |
| **Bulkhead** (Registration endpoint) | `maxConcurrent: 200, maxQueue: 500` | Isolates registration from query endpoints. Registration must never be starved by reporting queries. |
| **Retry** (Event publishing) | `maxRetries: 3, backoff: exponential(100ms, 2x), maxDelay: 5s` | Events published to Kafka/Signals with retry. If all retries fail, falls back to Outbox table for guaranteed delivery. |
| **Timeout** (all outbound calls) | `connectTimeout: 2s, readTimeout: 5s` | Prevents hanging connections from blocking registration threads. |
| **Fallback** (FIR Number Generation) | Pre-allocated number blocks (100 per station, refreshed at 80% utilization) | If DB sequence is temporarily unavailable, use pre-allocated block. |

### Deployment

- **Runtime**: Catalyst AppSail (Docker container, Node.js 20 + TypeScript)
- **Replicas**: 3 (minimum), auto-scale to 8
- **Memory**: 512MB per instance
- **Why AppSail**: Persistent connections to Catalyst Data Store, long-running request handling, connection pooling. Not suitable for Functions because FIR registration involves multiple DB writes in a transaction and requires connection pooling.

### Data Ownership

This service is the **authoritative owner** of:
- `CaseMaster` table (all columns)
- `ComplainantDetails` table
- `CaseCategory` reference data
- `CaseStatusMaster` reference data
- `GravityOffence` reference data
- FIR number sequences per station per year
- Case status transition history

No other service may write to these tables directly.

---

## 9.3 Service #2: Investigation Service

### Responsibility
The Investigation Service manages the complete investigative workflow from IO assignment through case diary management, investigation task tracking, and investigation completion (chargesheet recommendation or closure report). It enforces BNSS-mandated investigation timelines, provides daily case diary functionality with encryption, manages investigation task assignments (scene visits, witness examinations, forensic requests), and generates investigation progress reports for supervisory officers. This service is the operational backbone for every investigating officer in the state.

### REST API Endpoints

| Method | Endpoint | Description | Auth Level |
|---|---|---|---|
| `POST` | `/api/v1/investigations` | Start investigation for a case | `ROLE_SHO` |
| `GET` | `/api/v1/investigations/{investigationId}` | Get investigation details | `ROLE_IO, ROLE_SUPERVISOR` |
| `PUT` | `/api/v1/investigations/{investigationId}/io` | Reassign IO | `ROLE_SHO, ROLE_SP` |
| `POST` | `/api/v1/investigations/{investigationId}/diary` | Add case diary entry | `ROLE_IO` |
| `GET` | `/api/v1/investigations/{investigationId}/diary` | Get case diary entries | `ROLE_IO, ROLE_SUPERVISOR` |
| `POST` | `/api/v1/investigations/{investigationId}/tasks` | Create investigation task | `ROLE_IO` |
| `PUT` | `/api/v1/investigations/{investigationId}/tasks/{taskId}` | Update task status/outcome | `ROLE_IO` |
| `GET` | `/api/v1/investigations/by-io/{employeeId}` | Get IO's active investigations | `ROLE_IO, ROLE_SHO` |
| `GET` | `/api/v1/investigations/approaching-deadline?days=7` | List investigations near deadline | `ROLE_SHO, ROLE_SP` |
| `POST` | `/api/v1/investigations/{investigationId}/complete` | Mark investigation complete | `ROLE_IO, ROLE_SHO` |
| `GET` | `/api/v1/investigations/{investigationId}/timeline` | Get investigation timeline with milestones | `ROLE_IO, ROLE_SUPERVISOR` |
| `POST` | `/api/v1/investigations/{investigationId}/extension` | Request court extension for deadline | `ROLE_IO` |

### Database

**Primary**: Catalyst Data Store
- **Why**: Investigation data is relational (investigation → diary entries, investigation → tasks). Transactional consistency required for diary entries (sequential numbering invariant).
- **Tables Owned**: `Investigation`, `CaseDiaryEntry`, `InvestigationTask`, `InvestigationTimeline`, `InvestigationExtension`
- **Encryption**: Case diary content encrypted at field level using AES-256-GCM with per-investigation keys stored in Catalyst Vault.

**Secondary**: Catalyst Cache (Redis)
- **Why**: Cache IO workload summaries and approaching-deadline lists (refreshed every 5 minutes) to reduce dashboard query load.

### Scaling Strategy

| Trigger | Action |
|---|---|
| Active investigations > 50K | Scale read replicas, add AppSail instances |
| Case diary write throughput > 200 writes/min | Batch diary writes via write-behind cache |
| Deadline check queries spike (month-end) | Pre-compute deadline lists nightly, serve from cache |

### Dependencies

| Direction | Service | Type | Purpose |
|---|---|---|---|
| Upstream | Crime Registration Service | Event (consumed) | `FIRRegistered` triggers investigation creation |
| Upstream | Personnel Service | Sync REST | IO details, rank validation, workload check |
| Upstream | Identity & Access Service | Sync REST | Authentication, authorization |
| Downstream | Criminal Profile Service | Event | `InvestigationCompleted` updates criminal records |
| Downstream | Court & Legal Service | Event | `InvestigationCompleted(Chargesheet)` triggers chargesheet workflow |
| Downstream | Notification Service | Event | Deadline warnings, task assignments |
| Downstream | Document & Evidence Service | Sync REST | Attach evidence to investigation |
| Downstream | Audit & Compliance Service | Event | All diary entries and task mutations logged |

### Failure Isolation

| Pattern | Configuration |
|---|---|
| **Circuit Breaker** (Personnel Svc) | `failureThreshold: 5, resetTimeout: 30s` — IO assignment continues with cached rank data |
| **Circuit Breaker** (Document Svc) | `failureThreshold: 3, resetTimeout: 60s` — Evidence attachment queued for retry |
| **Bulkhead** (Diary write endpoint) | `maxConcurrent: 100` — Diary writes isolated from read endpoints |
| **Outbox Pattern** | All events written to local outbox table first, then published — guarantees event delivery |

### Deployment

- **Runtime**: Catalyst AppSail (Node.js 20)
- **Replicas**: 3 baseline, auto-scale to 6
- **Why AppSail**: Long-running processes, connection pooling for encrypted diary operations, stateful transaction management.

### Data Ownership

Owns: `Investigation`, `CaseDiaryEntry`, `InvestigationTask`, `InvestigationTimeline`, `InvestigationExtension` tables and all investigation-related state.

---

## 9.4 Service #3: Criminal Profile Service

### Responsibility
The Criminal Profile Service builds and maintains comprehensive criminal profiles by aggregating data from multiple FIRs, investigations, arrests, and court dispositions. It manages history sheeter records, tracks criminal aliases, computes and maintains risk scores using ML models, stores modus operandi embeddings, and provides criminal lookup and matching APIs. This is the primary read service for any query about a criminal's history, risk level, or behavioral pattern.

### REST API Endpoints

| Method | Endpoint | Description | Auth Level |
|---|---|---|---|
| `GET` | `/api/v1/profiles/{profileId}` | Get full criminal profile | `ROLE_IO, ROLE_INTEL` |
| `GET` | `/api/v1/profiles/by-accused/{accusedId}` | Get profile by accused ID | `ROLE_IO, ROLE_INTEL` |
| `POST` | `/api/v1/profiles/{profileId}/risk-assessment` | Trigger risk score recomputation | `ROLE_INTEL` |
| `GET` | `/api/v1/profiles/history-sheeters?stationId=&district=` | List history sheeters | `ROLE_SHO, ROLE_INTEL` |
| `POST` | `/api/v1/profiles/search/mo` | Semantic MO similarity search | `ROLE_IO, ROLE_INTEL` |
| `GET` | `/api/v1/profiles/{profileId}/cases` | Get all cases linked to profile | `ROLE_IO` |
| `GET` | `/api/v1/profiles/{profileId}/associations` | Get known criminal associations | `ROLE_INTEL` |
| `POST` | `/api/v1/profiles/{profileId}/alias` | Add known alias | `ROLE_IO, ROLE_INTEL` |
| `GET` | `/api/v1/profiles/{profileId}/mo` | Get all modus operandi records | `ROLE_IO, ROLE_INTEL` |
| `POST` | `/api/v1/profiles/match` | Match suspect against profile database | `ROLE_IO, ROLE_INTEL` |

### Database

**Primary**: Catalyst Data Store
- **Why**: Structured profile data (accused demographics, case linkages) is relational.
- **Tables Owned**: `CriminalProfile`, `ModusOperandi`, `CriminalAssociation`, `Accused` (enriched copy), `CriminalAlias`

**Secondary**: Pinecone
- **Why**: MO embedding storage and semantic similarity search. 768-dimensional vectors with metadata filtering (crime type, location, time pattern).
- **Index**: `mo-embeddings`, dimension=768, metric=cosine, pods=2 (p1.x1)

**Tertiary**: Catalyst Cache
- **Why**: Cache frequently accessed profiles (history sheeters, high-risk profiles) with 1-hour TTL.

### Scaling Strategy

| Trigger | Action |
|---|---|
| Profile read rate > 1000 req/s | Scale AppSail replicas + add Catalyst Cache layer |
| MO search latency > 200ms | Scale Pinecone pods, increase replicas |
| Bulk profile recomputation (weekly batch) | Spawn Catalyst Functions for parallel batch processing |

### Dependencies

| Direction | Service | Type | Purpose |
|---|---|---|---|
| Upstream | Crime Registration Service | Event | `FIRRegistered`, `AccusedLinked` → create/update profiles |
| Upstream | Investigation Service | Event | `InvestigationCompleted` → update case outcome on profile |
| Upstream | Court & Legal Service | Event | `CaseDisposed` → update conviction/acquittal counts |
| Upstream | AI/ML Pipeline Service | Sync REST | Risk score model inference, MO embedding generation |
| Downstream | Network Intelligence Service | Event | Profile updates feed network graph |
| Downstream | Search & Discovery Service | Event | Profile data indexed for search |

### Failure Isolation

| Pattern | Configuration |
|---|---|
| **Circuit Breaker** (AI/ML Pipeline) | `failureThreshold: 3, resetTimeout: 120s` — If ML service down, serve cached risk scores (max staleness: 24h) |
| **Circuit Breaker** (Pinecone) | `failureThreshold: 5, resetTimeout: 60s` — MO search degrades to keyword-based fallback in Elasticsearch |
| **Bulkhead** (MO search) | `maxConcurrent: 50` — MO searches isolated from profile CRUD |

### Deployment

- **Runtime**: Catalyst AppSail (Node.js 20)
- **Replicas**: 2 baseline, auto-scale to 5
- **Why AppSail**: Persistent connections to multiple databases (Data Store, Pinecone, Cache).

### Data Ownership

Owns: `CriminalProfile`, `ModusOperandi`, `CriminalAssociation`, `CriminalAlias`, MO embedding index in Pinecone.

---

## 9.5 Service #4: Network Intelligence Service

### Responsibility
The Network Intelligence Service manages the criminal network graph in Neo4j Aura, providing graph-based intelligence capabilities including criminal network visualization, community detection, shortest-path analysis between suspects, centrality computation for identifying gang leaders, and gang profile management. This service transforms flat criminal association data into actionable network intelligence, enabling investigators to uncover hidden connections between seemingly unrelated criminals and identify organized crime structures.

### REST API Endpoints

| Method | Endpoint | Description | Auth Level |
|---|---|---|---|
| `GET` | `/api/v1/network/{profileId}/neighborhood?depth=2` | Get N-hop neighborhood graph | `ROLE_INTEL` |
| `GET` | `/api/v1/network/path?from=&to=&maxDepth=5` | Shortest path between two criminals | `ROLE_INTEL` |
| `POST` | `/api/v1/network/communities/detect` | Run community detection algorithm | `ROLE_INTEL_ADMIN` |
| `GET` | `/api/v1/network/communities/{communityId}` | Get community members and edges | `ROLE_INTEL` |
| `GET` | `/api/v1/network/influencers?metric=betweenness&topK=20` | Get top influential nodes | `ROLE_INTEL` |
| `POST` | `/api/v1/network/gangs` | Create gang profile | `ROLE_INTEL` |
| `GET` | `/api/v1/network/gangs/{gangId}` | Get gang profile with members | `ROLE_INTEL` |
| `PUT` | `/api/v1/network/gangs/{gangId}/members` | Update gang membership | `ROLE_INTEL` |
| `GET` | `/api/v1/network/gangs?area=&threatLevel=` | List gangs by filter | `ROLE_INTEL` |
| `POST` | `/api/v1/network/expand?caseId=` | Find network connections from a case | `ROLE_IO, ROLE_INTEL` |
| `GET` | `/api/v1/network/stats` | Network graph statistics | `ROLE_READER+` |

### Database

**Primary**: Neo4j Aura (Professional tier)
- **Why**: Criminal networks are inherently graph-structured. Neo4j provides native graph storage, Cypher query language for complex traversals, and built-in graph algorithms (community detection, centrality, similarity). Relational databases cannot efficiently handle multi-hop relationship queries (6+ joins for 3-hop traversal vs. constant-time in Neo4j).
- **Schema**: Nodes: `(:Criminal)`, `(:Gang)`, `(:Location)`, `(:Case)`, `(:Phone)`. Relationships: `[:ASSOCIATED_WITH]`, `[:MEMBER_OF]`, `[:COMMITTED_CRIME_AT]`, `[:CO_ACCUSED_IN]`, `[:COMMUNICATES_WITH]`.
- **Volume**: ~5M nodes, ~50M edges projected at scale.

**Secondary**: Catalyst Cache
- **Why**: Cache frequently queried subgraphs (e.g., known gang network visualizations) with 4-hour TTL.

### Scaling Strategy

| Trigger | Action |
|---|---|
| Graph traversal latency p99 > 2s | Scale Neo4j Aura tier (Professional → Enterprise) |
| Concurrent graph queries > 50 | Add read replicas in Neo4j Aura |
| Community detection job > 30min | Schedule during off-peak, use Neo4j GDS library with parallel execution |
| Node count > 10M | Partition graph by district, use federated queries |

### Failure Isolation

| Pattern | Configuration |
|---|---|
| **Circuit Breaker** (Neo4j Aura) | `failureThreshold: 3, resetTimeout: 120s` — Returns cached last-known graph for visualization, queues mutations |
| **Timeout** (Graph queries) | `30s hard timeout` — Complex traversals bounded to prevent runaway queries |
| **Bulkhead** (Batch algorithms) | `maxConcurrent: 2` — Community detection runs isolated from real-time queries |

### Deployment

- **Runtime**: AWS EKS (Python/FastAPI, with Neo4j Python driver)
- **Pods**: 2 baseline, auto-scale to 4
- **Why EKS**: Neo4j Python driver + graph algorithm libraries (networkx, graph-tool) require Python runtime with C extensions. Not available on Catalyst. Also benefits from proximity to Neo4j Aura on AWS infrastructure.

### Data Ownership

Owns: Criminal network graph (all nodes, edges, properties), gang profiles, community detection results, centrality scores.

---

## 9.6 Service #5: Geospatial Intelligence Service

### Responsibility
The Geospatial Intelligence Service provides all location-based intelligence capabilities including jurisdiction resolution (GPS → police station), crime hotspot analysis, geocoding, spatial querying (crimes within radius/polygon), beat management, patrol route optimization, and spatial-temporal pattern detection. It manages PostGIS spatial databases, serves map tile layers, and provides geospatial APIs consumed by the map-based UI and other services.

### REST API Endpoints

| Method | Endpoint | Description | Auth Level |
|---|---|---|---|
| `GET` | `/api/v1/geo/jurisdiction?lat=&lng=` | Resolve GPS to police station jurisdiction | `ROLE_READER+` |
| `POST` | `/api/v1/geo/crimes/within-radius` | `{center:{lat,lng}, radiusKm, dateRange, crimeTypes[]}` | `ROLE_READER+` |
| `POST` | `/api/v1/geo/crimes/within-polygon` | `{polygon: GeoJSON, dateRange, crimeTypes[]}` | `ROLE_READER+` |
| `GET` | `/api/v1/geo/hotspots?districtId=&crimeType=` | Get crime hotspots | `ROLE_READER+` |
| `POST` | `/api/v1/geo/hotspots/refresh` | Trigger hotspot recomputation | `ROLE_ADMIN` |
| `GET` | `/api/v1/geo/beats/{jurisdictionId}` | Get beats for a jurisdiction | `ROLE_READER+` |
| `POST` | `/api/v1/geo/geocode` | Forward geocode address to GPS | `ROLE_READER+` |
| `POST` | `/api/v1/geo/reverse-geocode` | Reverse geocode GPS to address | `ROLE_READER+` |
| `GET` | `/api/v1/geo/tiles/{z}/{x}/{y}` | Vector tile serving for map UI | `ROLE_READER+` |
| `GET` | `/api/v1/geo/heatmap/{z}/{x}/{y}?crimeType=&period=` | Crime heatmap tiles | `ROLE_READER+` |
| `POST` | `/api/v1/geo/patrol/optimize` | Generate optimized patrol route | `ROLE_SHO` |
| `GET` | `/api/v1/geo/nearest-station?lat=&lng=&count=3` | Find nearest police stations | `PUBLIC` |

### Database

**Primary**: PostGIS (AWS RDS PostgreSQL 16 with PostGIS extension)
- **Why**: PostGIS is the gold standard for geospatial data, providing spatial indices (GiST R-tree), spatial functions (ST_Contains, ST_DWithin, ST_Intersects, ST_ClusterDBSCAN), and WGS84 coordinate support. No equivalent exists in Catalyst Data Store.
- **Tables Owned**: `JurisdictionBoundary`, `Beat`, `CrimeHotspot`, `CrimeLocation` (materialized spatial view), `PatrolRoute`
- **Spatial Index**: GiST index on all geometry columns; covering index on `(crimeType, occurrence_date)` for filtered spatial queries.
- **Volume**: ~800 jurisdiction polygons, ~5000 beat polygons, ~1M crime points (growing).

**Secondary**: Catalyst Cache
- **Why**: Cache jurisdiction resolution results (same GPS → same station for months), tile data (hot tiles for major cities).

### Scaling Strategy

| Trigger | Action |
|---|---|
| Tile request rate > 5000 req/s | CDN (CloudFront) for static tiles + Catalyst Cache for dynamic tiles |
| Spatial query latency p99 > 500ms | Add PostGIS read replicas, partition crime_location by year |
| Hotspot computation > 10min | Parallelize by district using Catalyst Functions |

### Failure Isolation

| Pattern | Configuration |
|---|---|
| **Circuit Breaker** (PostGIS) | `failureThreshold: 3, resetTimeout: 60s` — Serve cached jurisdiction data and pre-computed tiles |
| **Circuit Breaker** (Google Maps API) | `failureThreshold: 10, resetTimeout: 300s` — Fallback to Nominatim/OSM for geocoding |
| **Bulkhead** (Tile serving) | `maxConcurrent: 200` — Tile serving isolated from analytical spatial queries |
| **Rate Limiter** (Geocoding) | `100 req/s` — Prevent Google Maps API quota exhaustion |

### Deployment

- **Runtime**: Catalyst AppSail (Node.js 20 + pg/PostGIS driver + Turf.js)
- **Replicas**: 3 baseline, auto-scale to 8 (tile serving is CPU-intensive)
- **Why AppSail**: Persistent PostGIS connections via connection pool, long-running spatial queries, tile generation needs consistent memory.

### Data Ownership

Owns: All spatial data — jurisdiction boundaries, beat polygons, crime point geometries, hotspot data, patrol routes, tile cache.

---

## 9.7 Service #6: Analytics Engine Service

### Responsibility
The Analytics Engine Service processes, aggregates, and serves analytical data for dashboards, statistical reports, and trend analysis. It consumes events from all domain services, materializes pre-computed analytical views (CQRS read models), manages Databricks Lakehouse pipelines for complex OLAP queries, and exposes analytics APIs for the dashboard UI. It handles time-series analysis, comparative district statistics, officer performance metrics, crime trend decomposition, and anomaly detection in statistical patterns.

### REST API Endpoints

| Method | Endpoint | Description | Auth Level |
|---|---|---|---|
| `GET` | `/api/v1/analytics/dashboard/{unitId}` | Get unit dashboard KPIs | `ROLE_READER+` |
| `GET` | `/api/v1/analytics/trends?districtId=&crimeType=&period=` | Crime trend time-series | `ROLE_READER+` |
| `GET` | `/api/v1/analytics/comparison?units[]=&metrics[]=&period=` | Cross-unit comparison | `ROLE_SP+` |
| `GET` | `/api/v1/analytics/officer-performance/{employeeId}` | IO performance metrics | `ROLE_SHO, ROLE_SP` |
| `POST` | `/api/v1/analytics/cube/query` | Custom OLAP cube query | `ROLE_ANALYST` |
| `GET` | `/api/v1/analytics/anomalies?districtId=&severity=` | Detected anomalies | `ROLE_SP+` |
| `GET` | `/api/v1/analytics/real-time/crime-count?stationId=` | Real-time crime counter | `ROLE_READER+` |
| `POST` | `/api/v1/analytics/custom-report` | Generate custom analytical report | `ROLE_ANALYST` |

### Database

**Primary**: Databricks Lakehouse (Delta Lake)
- **Why**: OLAP queries spanning millions of records with complex aggregations (crime statistics by district × crime-type × year × gender × age-group) require a columnar storage engine with massively parallel processing. Delta Lake provides ACID transactions on data lake, time travel for historical queries, and Z-ordering for multi-dimensional range queries.
- **Tables**: Star schema with `fact_crime_registration`, `fact_investigation`, `fact_arrest`, `dim_time`, `dim_location`, `dim_crime_type`, `dim_officer`, `dim_demographics`.

**Secondary**: Catalyst Cache (Redis)
- **Why**: Cache dashboard KPIs (refreshed every 15 minutes), pre-computed aggregations (refreshed hourly).

**Tertiary**: Catalyst Data Store
- **Why**: Store analytics metadata (dashboard configurations, saved queries, alert thresholds).

### Scaling Strategy

| Trigger | Action |
|---|---|
| Dashboard query latency > 2s | Increase cache coverage, pre-compute more aggregations |
| Databricks compute cost > threshold | Optimize queries, use materialized views, reduce refresh frequency for cold metrics |
| Month-end/quarter-end reporting spike | Scale Databricks cluster (auto-scaling 2–16 workers) |

### Failure Isolation

| Pattern | Configuration |
|---|---|
| **Circuit Breaker** (Databricks) | `failureThreshold: 3, resetTimeout: 300s` — Serve cached/stale dashboard data with staleness indicator |
| **Bulkhead** (Real-time vs batch) | Real-time counters served from Catalyst Cache; batch analytics from Databricks — fully isolated |
| **Timeout** (OLAP queries) | `60s hard timeout` — Prevents runaway analytical queries |

### Deployment

- **Runtime**: Mixed — Catalyst Functions (event consumers, cache refreshers) + Catalyst AppSail (API layer)
- **Why Mixed**: Event consumption and aggregation are bursty, event-driven workloads ideal for Functions. API serving needs persistent cache connections ideal for AppSail.

### Data Ownership

Owns: All analytical views, pre-computed aggregations, dashboard KPIs, anomaly detection results, Databricks Lakehouse tables.

---

## 9.8 Service #7: AI/ML Pipeline Service

### Responsibility
The AI/ML Pipeline Service manages the complete ML lifecycle including model training pipelines, inference serving, feature engineering, model versioning, A/B testing, and monitoring. It provides inference endpoints for crime prediction, NLP extraction from FIR narratives, entity resolution, suspect recommendation, and anomaly detection. This service integrates with Vertex AI for model training, MLflow for experiment tracking, Catalyst QuickML for basic AutoML tasks, and Pinecone for embedding operations.

### REST API Endpoints

| Method | Endpoint | Description | Auth Level |
|---|---|---|---|
| `POST` | `/api/v1/ml/predict/crime-risk` | Predict crime risk for location + time | `ROLE_INTEL, ROLE_SHO` |
| `POST` | `/api/v1/ml/extract/entities` | Extract entities from FIR text (NLP) | `ROLE_WRITER_ASI+` |
| `POST` | `/api/v1/ml/classify/crime-type` | Auto-classify crime from description | `ROLE_WRITER_ASI+` |
| `POST` | `/api/v1/ml/match/suspect` | Find matching suspects for crime MO | `ROLE_IO, ROLE_INTEL` |
| `POST` | `/api/v1/ml/resolve/entity` | Deduplicate/resolve person records | `ROLE_ADMIN` |
| `POST` | `/api/v1/ml/embed/text` | Generate text embedding | `ROLE_SERVICE` |
| `GET` | `/api/v1/ml/models` | List all models with status | `ROLE_ML_ADMIN` |
| `POST` | `/api/v1/ml/models/{modelId}/train` | Trigger model retraining | `ROLE_ML_ADMIN` |
| `GET` | `/api/v1/ml/models/{modelId}/metrics` | Get model performance metrics | `ROLE_ML_ADMIN` |
| `POST` | `/api/v1/ml/models/{modelId}/promote` | Promote model version to production | `ROLE_ML_ADMIN` |
| `POST` | `/api/v1/ml/feedback` | Submit human feedback for prediction | `ROLE_IO+` |
| `GET` | `/api/v1/ml/models/{modelId}/drift` | Get model drift metrics | `ROLE_ML_ADMIN` |

### Database

**Primary**: Vertex AI Model Registry + MLflow
- **Why**: Specialized ML model versioning, experiment tracking, and artifact storage. MLflow provides experiment comparison and model lineage tracking that general-purpose databases don't support.

**Secondary**: Catalyst Data Store
- **Why**: Store prediction logs, feedback data, and model metadata for operational queries.

**Tertiary**: Pinecone
- **Why**: Store and query embeddings (MO vectors, FIR text vectors, person embeddings for entity resolution).

### Scaling Strategy

| Trigger | Action |
|---|---|
| Inference latency p99 > 500ms | Scale inference pods in EKS, add GPU nodes |
| Batch prediction queue > 10K items | Spin up additional Catalyst Functions for parallel processing |
| Training job duration > 4 hours | Scale Vertex AI training cluster |
| Embedding search latency > 100ms | Scale Pinecone replicas |

### Failure Isolation

| Pattern | Configuration |
|---|---|
| **Circuit Breaker** (Vertex AI) | `failureThreshold: 3, resetTimeout: 300s` — Fallback to OpenAI GPT-4o for NLP tasks |
| **Circuit Breaker** (Pinecone) | `failureThreshold: 5, resetTimeout: 120s` — Fallback to Elasticsearch keyword search for MO matching |
| **Bulkhead** (Inference vs Training) | Completely separate compute pools — training never impacts inference |
| **Timeout** (Inference) | `10s hard timeout` — Long-running predictions are rejected |
| **Rate Limiter** (LLM calls) | `50 req/s to Vertex AI, 20 req/s to OpenAI` — Prevent API quota exhaustion |

### Deployment

- **Runtime**: AWS EKS (Python/FastAPI, GPU-enabled nodes: p3.2xlarge for inference, p3.8xlarge for training)
- **Pods**: 2 inference pods (baseline), 0-4 training pods (on-demand)
- **Why EKS**: GPU requirements, Python ML ecosystem (PyTorch, TensorFlow, transformers, scikit-learn), large model artifacts, and direct Vertex AI SDK integration. None of these are supported on Catalyst platform.

### Data Ownership

Owns: ML models, model versions, training datasets, prediction logs, feedback data, embedding indices, feature stores.

---

## 9.9 Service #8: Search & Discovery Service

### Responsibility
The Search & Discovery Service provides unified full-text search, semantic search, and faceted discovery across all platform data. It indexes cases, persons (accused, victims, complainants), locations, and evidence items from all domain services, providing a single search API that supports typo tolerance, Kannada language search, phonetic matching for Indian names, geo-filtered search, and AI-powered semantic search using embeddings. This is the "Google for crime data" — every textual search in the platform routes through this service.

### REST API Endpoints

| Method | Endpoint | Description | Auth Level |
|---|---|---|---|
| `POST` | `/api/v1/search/cases` | Search cases (full-text + filters) | `ROLE_READER+` |
| `POST` | `/api/v1/search/persons` | Search persons across all categories | `ROLE_READER+` |
| `POST` | `/api/v1/search/unified` | Cross-entity unified search | `ROLE_READER+` |
| `POST` | `/api/v1/search/semantic` | AI-powered semantic search | `ROLE_IO, ROLE_INTEL` |
| `GET` | `/api/v1/search/suggest?q=&type=` | Autocomplete suggestions | `ROLE_READER+` |
| `POST` | `/api/v1/search/geo-filtered` | Full-text search within geographic area | `ROLE_READER+` |
| `GET` | `/api/v1/search/facets?index=&field=` | Get facet counts for filtering | `ROLE_READER+` |
| `POST` | `/api/v1/search/advanced` | Advanced search with boolean operators | `ROLE_READER+` |

### Database

**Primary**: Elasticsearch (Elastic Cloud, 3-node cluster)
- **Why**: Purpose-built for full-text search with inverted indices, BM25 relevance scoring, analyzers for Kannada text, phonetic analyzers for Indian names, and built-in geospatial queries.
- **Indices**: `cases` (5 shards, 1 replica), `persons` (3 shards, 1 replica), `evidence` (2 shards, 1 replica), `locations` (2 shards, 1 replica)
- **Custom Analyzers**: `kannada_analyzer` (Kannada tokenizer + stemmer), `indian_name_phonetic` (Double Metaphone + Soundex), `hindi_analyzer`

**Secondary**: Pinecone
- **Why**: Semantic search requires vector similarity. FIR text embedded via Gemini 2.5 text-embedding-005, stored in Pinecone for semantic retrieval.

### Scaling Strategy

| Trigger | Action |
|---|---|
| Search latency p99 > 200ms | Add Elasticsearch nodes, increase replicas |
| Index size > 500GB | Add shards, implement time-based index rollover |
| Semantic search latency > 300ms | Scale Pinecone pods |
| Indexing lag > 5 minutes | Add Kafka consumer instances for indexing pipeline |

### Failure Isolation

| Pattern | Configuration |
|---|---|
| **Circuit Breaker** (Elasticsearch) | `failureThreshold: 5, resetTimeout: 60s` — Return cached recent search results |
| **Circuit Breaker** (Pinecone) | `failureThreshold: 3, resetTimeout: 120s` — Disable semantic search, fallback to keyword search only |
| **Bulkhead** (Search vs Indexing) | Separate thread pools — indexing operations cannot starve search queries |
| **Rate Limiter** (Search API) | `500 req/s per user` — Prevent search abuse |

### Deployment

- **Runtime**: Catalyst AppSail (Node.js 20)
- **Replicas**: 3 baseline, auto-scale to 6
- **Why AppSail**: Persistent Elasticsearch client connections with connection pooling, long-lived index writer instances.

### Data Ownership

Owns: All search indices, index mappings, search analytics (query logs, click-through data), relevance tuning configuration.

---

## 9.10 Service #9: Notification Service

### Responsibility
The Notification Service handles all outbound communications from the platform including SMS notifications (FIR registration confirmation to complainants, deadline alerts to IOs), email notifications (case status updates, report generation alerts), in-app notifications (real-time dashboard alerts, task assignments), push notifications (mobile app alerts for field officers), and WhatsApp notifications (complainant updates via WhatsApp Business API). It manages notification templates, delivery tracking, rate limiting, and notification preferences per user.

### REST API Endpoints

| Method | Endpoint | Description | Auth Level |
|---|---|---|---|
| `POST` | `/api/v1/notifications/send` | Send notification (any channel) | `ROLE_SERVICE` |
| `POST` | `/api/v1/notifications/broadcast` | Broadcast to multiple recipients | `ROLE_SP+` |
| `GET` | `/api/v1/notifications/user/{userId}` | Get user's notification history | `ROLE_SELF, ROLE_ADMIN` |
| `PUT` | `/api/v1/notifications/preferences/{userId}` | Update notification preferences | `ROLE_SELF` |
| `GET` | `/api/v1/notifications/templates` | List notification templates | `ROLE_ADMIN` |
| `PUT` | `/api/v1/notifications/templates/{templateId}` | Update notification template | `ROLE_ADMIN` |
| `GET` | `/api/v1/notifications/{notificationId}/status` | Get delivery status | `ROLE_SERVICE` |
| `POST` | `/api/v1/notifications/in-app/mark-read` | Mark in-app notifications as read | `ROLE_SELF` |

### Database

**Primary**: Catalyst Data Store
- **Why**: Notification logs, templates, and preferences are small, relational datasets.
- **Tables Owned**: `NotificationLog`, `NotificationTemplate`, `NotificationPreference`, `DeliveryAttempt`

**Secondary**: Catalyst Cache
- **Why**: Cache user notification preferences and template content for fast access.

### Scaling Strategy

| Trigger | Action |
|---|---|
| Notification queue depth > 1000 | Scale Catalyst Functions consumer instances |
| SMS delivery rate > 100/s | Add SMS gateway connections, use multiple Twilio accounts |
| Mass notification (state-wide alert) | Pre-compute recipient lists, batch send via SQS |

### Failure Isolation

| Pattern | Configuration |
|---|---|
| **Circuit Breaker** (SMS Gateway/Twilio) | `failureThreshold: 10, resetTimeout: 60s` — Queue messages for retry, alert ops team |
| **Circuit Breaker** (Email/Zoho Mail) | `failureThreshold: 5, resetTimeout: 120s` — Queue for later delivery |
| **Retry** (All channels) | `maxRetries: 5, backoff: exponential(1s, 2x, max 60s)` |
| **Dead Letter Queue** | After 5 retries, move to DLQ for manual intervention |
| **Rate Limiter** | `SMS: 50/s, Email: 100/s, Push: 500/s` — Prevent gateway throttling |

### Deployment

- **Runtime**: Catalyst Functions (event-driven, auto-scaling)
- **Why Functions**: Notification sending is event-driven, bursty, and stateless — perfect for serverless. Each notification event triggers a function invocation. Auto-scales to handle bursts (mass incidents). Zero cost at idle.

### Data Ownership

Owns: Notification logs, templates, delivery tracking, user notification preferences.

---

## 9.11 Service #10: Document & Evidence Service

### Responsibility
The Document & Evidence Service manages all file storage and retrieval for the platform including FIR documents (PDF), evidence photographs, CCTV footage, forensic reports, chargesheet documents, court orders, and any other binary attachments. It handles file upload with virus scanning, generates tamper-evident hashes (SHA-256), manages chain of custody records for evidence files, provides thumbnail generation for images, and enforces storage quotas. All files are stored in Catalyst Stratus (primary) with overflow to AWS S3 (for large media files like CCTV footage exceeding Catalyst Stratus limits).

### REST API Endpoints

| Method | Endpoint | Description | Auth Level |
|---|---|---|---|
| `POST` | `/api/v1/documents/upload` | Upload document/evidence file | `ROLE_WRITER_ASI+` |
| `GET` | `/api/v1/documents/{documentId}` | Download document | `ROLE_READER+` (ABAC filtered) |
| `GET` | `/api/v1/documents/{documentId}/metadata` | Get document metadata | `ROLE_READER+` |
| `POST` | `/api/v1/documents/{documentId}/verify-hash` | Verify document integrity | `ROLE_IO, ROLE_COURT` |
| `GET` | `/api/v1/documents/by-case/{caseId}` | List all documents for a case | `ROLE_IO, ROLE_READER+` |
| `POST` | `/api/v1/documents/{documentId}/custody-transfer` | Record custody transfer | `ROLE_IO` |
| `GET` | `/api/v1/documents/{documentId}/custody-chain` | Get chain of custody | `ROLE_IO, ROLE_COURT` |
| `DELETE` | `/api/v1/documents/{documentId}` | Soft-delete document (retains for retention period) | `ROLE_ADMIN` |
| `GET` | `/api/v1/documents/{documentId}/thumbnail` | Get image/video thumbnail | `ROLE_READER+` |

### Database

**Primary**: Catalyst Stratus (Object Storage)
- **Why**: Managed object storage with built-in CDN, access control, and direct integration with Catalyst ecosystem. Suitable for documents up to 300MB.

**Secondary**: AWS S3 (for large files)
- **Why**: CCTV footage and large video evidence can exceed Catalyst Stratus limits. S3 provides multi-part upload, lifecycle policies (transition to Glacier after 1 year), and virtually unlimited storage.

**Metadata Store**: Catalyst Data Store
- **Tables Owned**: `DocumentMetadata`, `ChainOfCustody`, `EvidenceItemLink`

### Scaling Strategy

| Trigger | Action |
|---|---|
| Upload rate > 100 files/min | Scale Functions instances, add S3 multi-part upload workers |
| Storage > 10TB | Enable S3 Intelligent-Tiering for automatic cost optimization |
| Download rate > 500 req/s | Enable Catalyst Stratus CDN + CloudFront for S3 objects |

### Failure Isolation

| Pattern | Configuration |
|---|---|
| **Circuit Breaker** (Catalyst Stratus) | `failureThreshold: 3, resetTimeout: 60s` — Failover to S3 for uploads |
| **Circuit Breaker** (Virus Scanner) | `failureThreshold: 5, resetTimeout: 120s` — Queue files for deferred scanning, quarantine until scanned |
| **Retry** (Upload failures) | `maxRetries: 3, backoff: exponential(2s, 2x)` — Resumable uploads using multipart |

### Deployment

- **Runtime**: Catalyst Functions (upload processing, thumbnail generation) + Catalyst AppSail (metadata API)
- **Why Mixed**: File processing (virus scan, hash computation, thumbnail generation) is CPU-intensive and bursty → Functions. Metadata queries need persistent DB connections → AppSail.

### Data Ownership

Owns: All document and evidence files, document metadata, chain of custody records, file hashes, storage lifecycle policies.

---

## 9.12 Service #11: Court & Legal Service

### Responsibility
The Court & Legal Service manages the legal proceedings lifecycle from chargesheet preparation through court hearings, bail management, and case disposition. It provides the anti-corruption layer interfacing with India's eCourts system (NJDG), manages legal section reference data (Act, Section, CrimeHead, CrimeSubHead), tracks hearing schedules, and generates court-required reports and formats. This service translates between the KAICIP internal model and the various court system data models.

### REST API Endpoints

| Method | Endpoint | Description | Auth Level |
|---|---|---|---|
| `POST` | `/api/v1/legal/chargesheets` | Create chargesheet | `ROLE_IO, ROLE_SHO` |
| `PUT` | `/api/v1/legal/chargesheets/{chargesheetId}` | Update chargesheet (before filing) | `ROLE_IO` |
| `POST` | `/api/v1/legal/chargesheets/{chargesheetId}/file` | File chargesheet with court | `ROLE_SHO` |
| `GET` | `/api/v1/legal/chargesheets/{chargesheetId}` | Get chargesheet details | `ROLE_IO, ROLE_COURT` |
| `POST` | `/api/v1/legal/arrests` | Record arrest/surrender | `ROLE_IO` |
| `POST` | `/api/v1/legal/bail/{arrestId}` | Record bail grant/rejection | `ROLE_IO, ROLE_COURT` |
| `GET` | `/api/v1/legal/hearings?caseId=&courtId=&dateFrom=&dateTo=` | Get hearing schedule | `ROLE_IO, ROLE_COURT` |
| `POST` | `/api/v1/legal/hearings` | Record hearing outcome | `ROLE_COURT` |
| `GET` | `/api/v1/legal/acts` | List all Acts | `ROLE_READER+` |
| `GET` | `/api/v1/legal/acts/{actId}/sections` | Get sections for an Act | `ROLE_READER+` |
| `GET` | `/api/v1/legal/crime-heads` | Get crime head hierarchy | `ROLE_READER+` |
| `POST` | `/api/v1/legal/ecourts/sync/{caseId}` | Sync case status from eCourts | `ROLE_SERVICE` |

### Database

**Primary**: Catalyst Data Store
- **Tables Owned**: `ChargesheetDetails`, `ArrestSurrender`, `Act`, `Section`, `ActSectionAssociation`, `CrimeHead`, `CrimeSubHead`, `CrimeHeadActSection`, `Court`, `HearingSchedule`, `CaseDisposition`

### Scaling Strategy

| Trigger | Action |
|---|---|
| eCourts sync load > 500 sync/min | Scale Functions for parallel sync, implement batch sync |
| Chargesheet filing deadline surge (month-end) | Scale AppSail replicas to 4 |

### Failure Isolation

| Pattern | Configuration |
|---|---|
| **Circuit Breaker** (eCourts API) | `failureThreshold: 5, resetTimeout: 600s` — eCourts is notoriously unreliable; gracefully degrade to manual entry mode |
| **Anti-Corruption Layer** | Full ACL translates eCourts XML/SOAP responses to internal JSON model; eCourts schema changes don't propagate |

### Deployment

- **Runtime**: Catalyst AppSail (Node.js 20)
- **Replicas**: 2 baseline, auto-scale to 4
- **Why AppSail**: Persistent connections to Catalyst Data Store, complex transactional logic for chargesheet filing.

### Data Ownership

Owns: Chargesheets, arrests, bail records, court hearings, case dispositions, legal reference data (Acts, Sections, Crime Heads).

---

## 9.13 Service #12: Personnel Service

### Responsibility
The Personnel Service is the system of record for all Karnataka Police personnel. It manages employee profiles (KGID-based), rank assignments, posting histories, contact information, and officer workload metrics. It provides a published API consumed by virtually every other service for employee lookup, rank validation, and workload assessment. This service syncs with the Karnataka government's HRMS (Human Resource Management System) for authoritative employee data.

### REST API Endpoints

| Method | Endpoint | Description | Auth Level |
|---|---|---|---|
| `GET` | `/api/v1/personnel/{employeeId}` | Get employee details | `ROLE_READER+` |
| `GET` | `/api/v1/personnel/by-kgid/{kgid}` | Lookup by KGID | `ROLE_READER+` |
| `GET` | `/api/v1/personnel/by-unit/{unitId}?rank=` | List personnel at unit | `ROLE_SHO+` |
| `GET` | `/api/v1/personnel/{employeeId}/workload` | Get officer's current workload | `ROLE_SHO+` |
| `GET` | `/api/v1/personnel/{employeeId}/postings` | Get posting history | `ROLE_READER+` |
| `POST` | `/api/v1/personnel/{employeeId}/transfer` | Record transfer | `ROLE_HR_ADMIN` |
| `GET` | `/api/v1/personnel/ranks` | List all ranks | `ROLE_READER+` |
| `GET` | `/api/v1/personnel/designations` | List all designations | `ROLE_READER+` |

### Database

**Primary**: Catalyst Data Store
- **Tables Owned**: `Employee`, `Rank`, `Designation`, `PostingHistory`

### Scaling Strategy

Mostly read-heavy, stable load. Scale via aggressive caching (24-hour TTL for rank/designation, 1-hour for employee details).

### Deployment

- **Runtime**: Catalyst AppSail
- **Replicas**: 2 baseline, auto-scale to 4
- **Why AppSail**: Persistent service with high read volume requiring connection pooling and caching.

### Data Ownership

Owns: Employee records, rank definitions, designation definitions, posting histories.

---

## 9.14 Service #13: Organization Hierarchy Service

### Responsibility
The Organization Hierarchy Service manages the Karnataka Police organizational structure: the tree of units from State HQ down to individual police stations. It provides unit lookup, hierarchy traversal (get all stations under a district), unit type management, and jurisdictional hierarchy for authorization (an SP can access all stations in their district). This service is critical for RBAC — access control policies are defined in terms of organizational position.

### REST API Endpoints

| Method | Endpoint | Description | Auth Level |
|---|---|---|---|
| `GET` | `/api/v1/org/units/{unitId}` | Get unit details | `ROLE_READER+` |
| `GET` | `/api/v1/org/units/{unitId}/children` | Get child units | `ROLE_READER+` |
| `GET` | `/api/v1/org/units/{unitId}/ancestors` | Get parent chain to root | `ROLE_READER+` |
| `GET` | `/api/v1/org/units/tree?rootUnitId=` | Get full subtree | `ROLE_READER+` |
| `GET` | `/api/v1/org/districts` | List all districts | `ROLE_READER+` |
| `GET` | `/api/v1/org/districts/{districtId}/stations` | List stations in district | `ROLE_READER+` |
| `GET` | `/api/v1/org/unit-types` | List unit types | `ROLE_READER+` |
| `GET` | `/api/v1/org/states` | List states | `ROLE_READER+` |

### Database

**Primary**: Catalyst Data Store
- **Tables Owned**: `Unit`, `UnitType`, `District`, `State`
- **Hierarchy**: Adjacency list model (`ParentUnitId` self-referencing FK) with materialized path for efficient subtree queries.

### Scaling Strategy

Very stable, read-heavy workload. Entire hierarchy cached in Catalyst Cache with 24-hour TTL (tree changes are rare). Cache invalidated on any unit mutation event.

### Deployment

- **Runtime**: Catalyst AppSail
- **Replicas**: 2
- **Why AppSail**: Persistent cache connections, stable service with predictable load.

### Data Ownership

Owns: Organizational units, unit types, district definitions, state definitions, hierarchy relationships.

---

## 9.15 Service #14: Audit & Compliance Service

### Responsibility
The Audit & Compliance Service maintains a complete, immutable audit trail of every mutation in the platform. It records who did what, when, from where, and why. It supports compliance queries (e.g., "show all changes to case X in last 30 days"), forensic analysis of data modifications, regulatory audit reports, and data retention policy enforcement. Every service publishes audit events which this service consumes and persists in an append-only audit log. This is a legal requirement for evidence integrity.

### REST API Endpoints

| Method | Endpoint | Description | Auth Level |
|---|---|---|---|
| `GET` | `/api/v1/audit/trail?entityType=&entityId=&dateFrom=&dateTo=` | Get audit trail for entity | `ROLE_AUDITOR, ROLE_SP+` |
| `GET` | `/api/v1/audit/user/{userId}?dateFrom=&dateTo=` | Get user's activity log | `ROLE_AUDITOR` |
| `GET` | `/api/v1/audit/search?action=&dateFrom=&dateTo=` | Search audit events | `ROLE_AUDITOR` |
| `POST` | `/api/v1/audit/report` | Generate audit report | `ROLE_AUDITOR` |
| `GET` | `/api/v1/audit/compliance/data-access/{caseId}` | Who accessed case data | `ROLE_AUDITOR, ROLE_SP+` |
| `GET` | `/api/v1/audit/statistics` | Audit statistics dashboard | `ROLE_AUDITOR` |

### Database

**Primary**: Databricks Lakehouse (Delta Lake, append-only)
- **Why**: Audit logs are write-heavy, never updated, and queried for historical analysis. Delta Lake's append-only mode with time travel provides immutable audit storage. The columnar format enables efficient analytical queries across billions of audit records.
- **Table**: `audit_events` (partitioned by `event_date`, `service_name`)
- **Retention**: 10-year minimum retention (legal requirement).

**Secondary**: Elasticsearch
- **Why**: Full-text search across audit event descriptions and payloads for investigative queries.

### Scaling Strategy

| Trigger | Action |
|---|---|
| Audit event ingestion > 10K events/s | Scale Kafka consumer partitions, add Databricks workers |
| Audit query latency > 5s | Add Elasticsearch replicas for search workload |
| Storage > 50TB | Enable Delta Lake compaction, Z-ordering on (entityType, entityId, timestamp) |

### Deployment

- **Runtime**: Catalyst Functions (event consumers) + Catalyst AppSail (query API)
- **Why Mixed**: Event consumption is bursty → Functions. Query API needs persistent ES/Databricks connections → AppSail.

### Data Ownership

Owns: All audit events, audit metadata, compliance reports, data access logs.

---

## 9.16 Service #15: Gateway & API Management Service

### Responsibility
The Gateway & API Management Service provides the single entry point for all external API traffic. It handles request routing to appropriate microservices, rate limiting, request/response transformation, API versioning, API key management for external integrators, request logging, CORS policy enforcement, and SSL termination. It uses Kong API Gateway for advanced routing rules with Catalyst API Gateway for Catalyst-native service discovery.

### REST API Endpoints (Meta/Admin)

| Method | Endpoint | Description | Auth Level |
|---|---|---|---|
| `GET` | `/api/v1/gateway/health` | Gateway health check | `PUBLIC` |
| `GET` | `/api/v1/gateway/routes` | List all registered routes | `ROLE_PLATFORM_ADMIN` |
| `POST` | `/api/v1/gateway/api-keys` | Generate API key for external system | `ROLE_PLATFORM_ADMIN` |
| `GET` | `/api/v1/gateway/metrics` | Gateway metrics (throughput, latency, errors) | `ROLE_PLATFORM_ADMIN` |
| `PUT` | `/api/v1/gateway/rate-limits/{consumerId}` | Set rate limits for a consumer | `ROLE_PLATFORM_ADMIN` |
| `GET` | `/api/v1/gateway/api-docs` | OpenAPI specification | `PUBLIC` |

### Database

**Primary**: Catalyst Data Store (for API key storage, rate limit configuration)
**Secondary**: Catalyst Cache (Redis) for rate limit counters, session data

### Deployment

- **Runtime**: Catalyst AppSail (Kong container)
- **Replicas**: 2 baseline, auto-scale to 6
- **Why AppSail**: Always-on gateway requires persistent connections, health checks, and connection pooling. Cannot be serverless.

### Data Ownership

Owns: API keys, rate limit configurations, API documentation, request/response logs (short-term).

---

## 9.17 Service #16: Identity & Access Service

### Responsibility
The Identity & Access Service manages authentication (login, MFA, session management), authorization (RBAC + ABAC policy evaluation), user account lifecycle, and security audit logging. It implements a custom RBAC/ABAC engine on top of Catalyst Authentication, supporting hierarchical roles (DGP can access everything, PI can access only their station), attribute-based policies (IO can only edit their own investigation), and data classification-based access control (SECRET intelligence restricted to Intelligence wing).

### REST API Endpoints

| Method | Endpoint | Description | Auth Level |
|---|---|---|---|
| `POST` | `/api/v1/auth/login` | Authenticate user (username + password + MFA) | `PUBLIC` |
| `POST` | `/api/v1/auth/logout` | Invalidate session | `ROLE_AUTHENTICATED` |
| `POST` | `/api/v1/auth/refresh` | Refresh access token | `ROLE_AUTHENTICATED` |
| `GET` | `/api/v1/auth/me` | Get current user profile and permissions | `ROLE_AUTHENTICATED` |
| `POST` | `/api/v1/auth/authorize` | Evaluate authorization policy for action | `ROLE_SERVICE` |
| `GET` | `/api/v1/auth/users` | List users (admin) | `ROLE_USER_ADMIN` |
| `POST` | `/api/v1/auth/users` | Create user account | `ROLE_USER_ADMIN` |
| `PUT` | `/api/v1/auth/users/{userId}/roles` | Assign roles to user | `ROLE_USER_ADMIN` |
| `GET` | `/api/v1/auth/roles` | List all roles | `ROLE_USER_ADMIN` |
| `POST` | `/api/v1/auth/policies` | Create ABAC policy | `ROLE_SECURITY_ADMIN` |

### Database

**Primary**: Catalyst Data Store
- **Tables Owned**: `UserAccount`, `Role`, `Permission`, `RolePermission`, `UserRole`, `ABACPolicy`, `Session`, `LoginAudit`

**Secondary**: Catalyst Cache
- **Why**: Cache JWT token validation results, user-role mappings, and ABAC policy evaluations. 5-minute TTL.

### Deployment

- **Runtime**: Catalyst AppSail
- **Replicas**: 3 baseline (critical path — every request hits auth)
- **Why AppSail**: Persistent, high-throughput service called on every API request. Must be always-on with minimal latency.

### Data Ownership

Owns: User accounts, roles, permissions, ABAC policies, sessions, login audit logs.

---

## 9.18 Service #17: Reporting Service

### Responsibility
The Reporting Service generates structured statutory reports (NCRB Crime Statistics, Monthly Crime Review, IPC/BNS classification reports, district crime comparatives), ad-hoc reports, and exportable documents (PDF, Excel, CSV). It pulls pre-aggregated data from the Analytics Engine and formats it into the specific layouts required by NCRB, State Home Department, and district administration. Reports can be scheduled (Catalyst Cron) or generated on-demand.

### REST API Endpoints

| Method | Endpoint | Description | Auth Level |
|---|---|---|---|
| `POST` | `/api/v1/reports/generate` | Generate report (async, returns jobId) | `ROLE_ANALYST, ROLE_SP+` |
| `GET` | `/api/v1/reports/{reportId}/status` | Check report generation status | `ROLE_READER+` |
| `GET` | `/api/v1/reports/{reportId}/download` | Download generated report | `ROLE_READER+` |
| `GET` | `/api/v1/reports/templates` | List report templates | `ROLE_READER+` |
| `POST` | `/api/v1/reports/schedule` | Schedule recurring report | `ROLE_ANALYST` |
| `GET` | `/api/v1/reports/history?type=&dateFrom=&dateTo=` | Get report generation history | `ROLE_READER+` |

### Database

**Primary**: Catalyst Data Store (report metadata, schedules, templates)
**Secondary**: Catalyst Stratus (generated report files — PDF, Excel)
**Data Source**: Analytics Engine Service (pre-aggregated data)

### Deployment

- **Runtime**: Catalyst Functions (report generation is CPU-intensive, bursty) + Catalyst AppSail (API layer)
- **Why Mixed**: Report generation (PDF rendering, Excel creation) is CPU-intensive and bursty → Functions. API serving needs persistent connections → AppSail.

### Data Ownership

Owns: Report templates, report metadata, generated report files, schedule configurations.

---

## 9.19 Service #18: Data Ingestion Service

### Responsibility
The Data Ingestion Service handles all bulk data imports and external system integrations. It manages CCTNS data sync, ICJS integration, NCRB data exchange, legacy system migration, CSV/Excel bulk uploads, real-time API integrations with external services (Vahan, ePrisons, AFIS), and data quality validation. This is the Integration Context's runtime service, implementing all anti-corruption layer adapters.

### REST API Endpoints

| Method | Endpoint | Description | Auth Level |
|---|---|---|---|
| `POST` | `/api/v1/ingestion/upload/csv` | Upload CSV for bulk import | `ROLE_DATA_ADMIN` |
| `POST` | `/api/v1/ingestion/upload/excel` | Upload Excel for bulk import | `ROLE_DATA_ADMIN` |
| `GET` | `/api/v1/ingestion/jobs` | List ingestion jobs | `ROLE_DATA_ADMIN` |
| `GET` | `/api/v1/ingestion/jobs/{jobId}/status` | Get job status with error details | `ROLE_DATA_ADMIN` |
| `POST` | `/api/v1/ingestion/sync/cctns` | Trigger CCTNS sync | `ROLE_INTEGRATION_ADMIN` |
| `POST` | `/api/v1/ingestion/sync/ecourts` | Trigger eCourts sync | `ROLE_INTEGRATION_ADMIN` |
| `GET` | `/api/v1/ingestion/connectors` | List configured connectors | `ROLE_INTEGRATION_ADMIN` |
| `PUT` | `/api/v1/ingestion/connectors/{connectorId}` | Update connector config | `ROLE_INTEGRATION_ADMIN` |
| `GET` | `/api/v1/ingestion/data-quality/report` | Get data quality metrics | `ROLE_DATA_ADMIN` |

### Database

**Primary**: Catalyst Data Store (ingestion job metadata, connector configurations)
**Secondary**: AWS S3 (staging area for bulk files)
**Tertiary**: Amazon SQS (dead letter queue for failed records)

### Scaling Strategy

| Trigger | Action |
|---|---|
| Bulk upload > 100K records | Partition file, parallel processing via multiple Functions |
| CCTNS sync backlog > 1 hour | Scale Kafka consumer partitions for CCTNS topic |
| Data quality errors > 5% | Halt ingestion, alert data admin, queue for manual review |

### Deployment

- **Runtime**: Catalyst Functions (file processing, batch sync) + Catalyst AppSail (API, connector management)
- **Why Mixed**: Bulk processing is inherently bursty → Functions. Connector management and API serving → AppSail.

### Data Ownership

Owns: Ingestion job metadata, connector configurations, data quality reports, staging data, error logs.

---

# 10. Event-Driven Architecture

## 10.1 Event Backbone Architecture

### 10.1.1 Dual Event Bus Strategy

KAICIP employs a dual event bus architecture using **Catalyst Signals** for intra-platform events and **Apache Kafka (Confluent Cloud)** for high-throughput streaming pipelines. This dual approach is deliberate and optimizes for different workload characteristics.

```
╔══════════════════════════════════════════════════════════════════════════════════════╗
║                           EVENT BACKBONE ARCHITECTURE                               ║
╠══════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                     ║
║  ┌─────────────── CATALYST SIGNALS (Intra-Platform) ───────────────────────────┐   ║
║  │                                                                              │   ║
║  │  ┌─────────┐  ┌─────────────┐  ┌──────────┐  ┌───────────┐  ┌───────────┐  │   ║
║  │  │Crime Reg│  │Investigation│  │Personnel │  │   Court   │  │   Org     │  │   ║
║  │  │ Service │  │  Service    │  │ Service  │  │ & Legal   │  │ Hierarchy │  │   ║
║  │  └────┬────┘  └──────┬──────┘  └────┬─────┘  └─────┬─────┘  └─────┬─────┘  │   ║
║  │       │              │              │              │              │          │   ║
║  │       ▼              ▼              ▼              ▼              ▼          │   ║
║  │  ═══════════════ CATALYST SIGNALS BUS ═══════════════════════════════════   │   ║
║  │       │              │              │              │              │          │   ║
║  │       ▼              ▼              ▼              ▼              ▼          │   ║
║  │  ┌─────────┐  ┌─────────────┐  ┌──────────┐  ┌───────────┐  ┌───────────┐  │   ║
║  │  │Notific. │  │   Search    │  │  Audit   │  │ Document  │  │ Identity  │  │   ║
║  │  │ Service │  │ & Discovery │  │ Service  │  │ & Evidence│  │ & Access  │  │   ║
║  │  └─────────┘  └─────────────┘  └──────────┘  └───────────┘  └───────────┘  │   ║
║  │                                                                              │   ║
║  │  Characteristics: Low-latency (<50ms), At-least-once delivery,              │   ║
║  │  <1000 events/sec, Native Catalyst integration, Simple routing              │   ║
║  └──────────────────────────────────────────────────────────────────────────────┘   ║
║                                                                                     ║
║                              │ Bridge │                                              ║
║                              │(Event  │                                              ║
║                              │ Router)│                                              ║
║                              ▼        ▼                                              ║
║                                                                                     ║
║  ┌─────────────── KAFKA / CONFLUENT CLOUD (High-Throughput) ───────────────────┐   ║
║  │                                                                              │   ║
║  │  Topics:                                                                     │   ║
║  │  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────────────┐     │   ║
║  │  │ crime.events     │ │ analytics.agg    │ │ ml.features              │     │   ║
║  │  │ (32 partitions)  │ │ (16 partitions)  │ │ (8 partitions)           │     │   ║
║  │  └────────┬─────────┘ └────────┬─────────┘ └──────────┬───────────────┘     │   ║
║  │           │                    │                       │                     │   ║
║  │  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────────────┐     │   ║
║  │  │ search.indexing  │ │ audit.events     │ │ geo.events               │     │   ║
║  │  │ (16 partitions)  │ │ (32 partitions)  │ │ (8 partitions)           │     │   ║
║  │  └────────┬─────────┘ └────────┬─────────┘ └──────────┬───────────────┘     │   ║
║  │           │                    │                       │                     │   ║
║  │           ▼                    ▼                       ▼                     │   ║
║  │  ┌─────────────┐ ┌──────────────┐ ┌───────────────┐ ┌─────────────────┐    │   ║
║  │  │ Elasticsearch│ │  Databricks  │ │  AI/ML        │ │   Geospatial    │    │   ║
║  │  │ Sink        │ │  Sink        │ │  Pipeline     │ │   Service       │    │   ║
║  │  │ Connector   │ │  Connector   │ │  Consumer     │ │   Consumer      │    │   ║
║  │  └─────────────┘ └──────────────┘ └───────────────┘ └─────────────────┘    │   ║
║  │                                                                              │   ║
║  │  Characteristics: High-throughput (100K+ events/sec), Exactly-once semantics │   ║
║  │  Durable (7-day retention), Partitioned, Schema Registry (Avro/JSON Schema) │   ║
║  │  Kafka Connect for sinks, Stream processing with ksqlDB                     │   ║
║  └──────────────────────────────────────────────────────────────────────────────┘   ║
║                                                                                     ║
║                              │ Dead Letter │                                         ║
║                              │    Queue    │                                         ║
║                              ▼             ▼                                         ║
║  ┌─────────────── AMAZON SQS (Dead Letter Queue) ─────────────────────────────┐    ║
║  │                                                                              │    ║
║  │  ┌──────────────────────┐  ┌──────────────────────┐                         │    ║
║  │  │ signals-dlq          │  │ kafka-dlq            │                         │    ║
║  │  │ (failed Signals msgs)│  │ (failed Kafka msgs)  │                         │    ║
║  │  └──────────────────────┘  └──────────────────────┘                         │    ║
║  │                                                                              │    ║
║  │  14-day retention, Manual review and replay, Alert on DLQ depth > 100       │    ║
║  └──────────────────────────────────────────────────────────────────────────────┘    ║
╚══════════════════════════════════════════════════════════════════════════════════════╝
```

### 10.1.2 Event Bus Decision Matrix

| Criterion | Catalyst Signals | Kafka (Confluent Cloud) | Decision Rule |
|---|---|---|---|
| **Throughput** | <1,000 events/sec | 100K+ events/sec | Use Kafka if sustained throughput > 1000 events/sec |
| **Latency** | <50ms (p99) | <100ms (p99) | Use Signals for latency-critical notifications |
| **Ordering** | No guaranteed ordering | Per-partition ordering | Use Kafka when event ordering is required |
| **Durability** | At-least-once, ephemeral | Exactly-once, 7-day retention | Use Kafka when replay capability is needed |
| **Consumer Groups** | Single consumer per signal | Multiple consumer groups | Use Kafka when multiple services consume same event |
| **Schema Evolution** | No schema registry | Confluent Schema Registry | Use Kafka when schema evolution control is needed |
| **Integration** | Native Catalyst (Functions, AppSail) | Kafka Connect (ES, Databricks, S3 sinks) | Use Kafka when sink connectors are needed |
| **Cost** | Included in Catalyst | $0.11/GB + cluster cost | Use Signals for low-volume to minimize cost |
| **Monitoring** | Catalyst native dashboard | Confluent Cloud monitoring + Datadog | Both have adequate monitoring |

**Decision Summary:**
- **Use Catalyst Signals for**: Notifications, simple command events, intra-Catalyst service communication, low-volume domain events (<100/sec).
- **Use Kafka for**: Analytics event streaming, search indexing, ML feature pipelines, audit event streaming, high-volume domain events, any event needing replay or multi-consumer delivery.
- **Bridge**: An event router running on Catalyst Functions bridges selected Signals events to Kafka topics when events need to reach both ecosystems.

---

## 10.2 Architectural Patterns

### 10.2.1 CQRS: Command-Query Responsibility Segregation

#### Implementation for CaseMaster

```
╔══════════════════════════════════════════════════════════════════════════════════════╗
║                    CQRS IMPLEMENTATION — CASE MASTER                                ║
╠══════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                     ║
║   COMMAND SIDE (Write Model)                  QUERY SIDE (Read Model)               ║
║   ═══════════════════════════                 ════════════════════════               ║
║                                                                                     ║
║   ┌──────────────────────┐                    ┌──────────────────────────┐           ║
║   │   React UI (Forms)   │                    │   React UI (Dashboards,  │           ║
║   │   - Register FIR     │                    │    Search, Lists)         │           ║
║   │   - Update Status    │                    │   - Case List View       │           ║
║   │   - Amend Sections   │                    │   - Station Dashboard    │           ║
║   └──────────┬───────────┘                    │   - Crime Statistics     │           ║
║              │                                └──────────┬───────────────┘           ║
║              ▼                                           │                           ║
║   ┌──────────────────────┐                               ▼                           ║
║   │  Crime Registration  │                    ┌──────────────────────────┐           ║
║   │  Service (Commands)  │                    │   Search & Discovery     │           ║
║   │                      │                    │   Service (Queries)      │           ║
║   │  POST /cases/fir     │                    │                          │           ║
║   │  PUT /cases/{id}/    │                    │  POST /search/cases      │           ║
║   │      status          │                    │  GET /analytics/         │           ║
║   │  PUT /cases/{id}/    │                    │      dashboard           │           ║
║   │      sections        │                    │  GET /reports/           │           ║
║   └──────────┬───────────┘                    └──────────┬───────────────┘           ║
║              │                                           │                           ║
║              ▼                                           ▼                           ║
║   ┌──────────────────────┐                    ┌──────────────────────────┐           ║
║   │  Catalyst Data Store │                    │  Elasticsearch           │           ║
║   │  (Normalized, OLTP)  │                    │  (Denormalized, Search)  │           ║
║   │                      │                    │                          │           ║
║   │  CaseMaster          │                    │  cases index:            │           ║
║   │  ├─ ComplainantDtls  │                    │  {                       │           ║
║   │  ├─ CaseSection      │──── Events ────►  │    caseId, firNumber,    │           ║
║   │  ├─ CaseAccused      │   (via Kafka)      │    stationName,          │           ║
║   │  └─ CaseVictim       │                    │    districtName,         │           ║
║   │                      │                    │    ioName, crimeHead,    │           ║
║   │  Optimized for:      │                    │    briefFacts, status,   │           ║
║   │  - Write consistency │                    │    complainantName,      │           ║
║   │  - Referential integ.│                    │    accusedNames[],       │           ║
║   │  - ACID transactions │                    │    geoPoint, sections[], │           ║
║   │                      │                    │    registrationDate      │           ║
║   └──────────────────────┘                    │  }                       │           ║
║                                               │                          │           ║
║              │                                │  Optimized for:          │           ║
║              │                                │  - Full-text search      │           ║
║              │  Events also flow to:          │  - Faceted filtering     │           ║
║              │                                │  - Aggregations          │           ║
║              ▼                                │  - Geo queries           │           ║
║   ┌──────────────────────┐                    └──────────────────────────┘           ║
║   │  Databricks Lakehouse│                                                          ║
║   │  (Denormalized, OLAP)│                    ┌──────────────────────────┐           ║
║   │                      │                    │  Catalyst Cache (Redis)  │           ║
║   │  fact_crime:         │                    │  (Denormalized, Hot KPIs)│           ║
║   │  - 50+ columns       │                    │                          │           ║
║   │  - Partitioned by    │                    │  station:{id}:kpis:      │           ║
║   │    date, district    │                    │  {totalFIRs, pending,    │           ║
║   │  - Z-ordered by      │                    │   heinous, nonHeinous,   │           ║
║   │    crimeType         │                    │   clearanceRate, ...}    │           ║
║   │                      │                    │                          │           ║
║   │  Optimized for:      │                    │  Optimized for:          │           ║
║   │  - Complex analytics │                    │  - Sub-millisecond reads │           ║
║   │  - Trend analysis    │                    │  - Dashboard KPIs        │           ║
║   │  - Cross-dimensional │                    │  - Counter increments    │           ║
║   │    aggregations      │                    │                          │           ║
║   └──────────────────────┘                    └──────────────────────────┘           ║
║                                                                                     ║
║  CONSISTENCY MODEL:                                                                 ║
║  Write → Catalyst Data Store: STRONG CONSISTENCY (ACID)                            ║
║  Write → Elasticsearch:       EVENTUAL (lag: <5 seconds typical, <30s p99)         ║
║  Write → Databricks:          EVENTUAL (lag: <15 minutes, batch micro-batch)       ║
║  Write → Catalyst Cache:      EVENTUAL (lag: <1 second, event-driven invalidation) ║
║                                                                                     ║
║  TRADE-OFFS:                                                                        ║
║  ✓ Write and read workloads scale independently                                    ║
║  ✓ Each read model optimized for its query pattern                                 ║
║  ✓ Write model stays normalized (no update anomalies)                              ║
║  ✗ Multiple data stores to maintain (operational complexity)                       ║
║  ✗ Eventual consistency — stale reads possible (acceptable for dashboards,         ║
║    NOT acceptable for FIR uniqueness validation which uses write model)             ║
║  ✗ Event pipeline failure can cause read model staleness                           ║
╚══════════════════════════════════════════════════════════════════════════════════════╝
```

### 10.2.2 Event Sourcing: Case Lifecycle Audit Trail

Event sourcing captures every state change as an immutable event, enabling complete reconstruction of case history and providing a legally defensible audit trail.

```
╔══════════════════════════════════════════════════════════════════════════════════════╗
║                    EVENT SOURCING — CASE LIFECYCLE                                   ║
╠══════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                     ║
║  EVENT STORE SCHEMA (Catalyst Data Store):                                          ║
║  ┌────────────────────────────────────────────────────────────────────────────┐     ║
║  │  Table: CaseEventStore                                                     │     ║
║  │  ──────────────────────────────────────────────────────────────────────── │     ║
║  │  EventId:        UUID (PK)         — Globally unique event ID             │     ║
║  │  AggregateId:    UUID (FK→CaseId)  — Which case this event belongs to     │     ║
║  │  AggregateType:  string            — Always "CaseMaster"                  │     ║
║  │  EventType:      string            — Event name (e.g., "FIRRegistered")   │     ║
║  │  EventVersion:   int               — Sequential per aggregate (1,2,3...)  │     ║
║  │  EventData:      JSONB             — Event payload (encrypted PII)        │     ║
║  │  Metadata:       JSONB             — {userId, ipAddress, userAgent, etc.} │     ║
║  │  Timestamp:      DateTime(UTC)     — Event occurrence time                │     ║
║  │  SchemaVersion:  int               — Payload schema version for evolution │     ║
║  │                                                                            │     ║
║  │  INDICES:                                                                  │     ║
║  │  - UNIQUE(AggregateId, EventVersion) — Optimistic concurrency control     │     ║
║  │  - INDEX(AggregateId, Timestamp)     — Replay events for aggregate        │     ║
║  │  - INDEX(EventType, Timestamp)       — Query by event type                │     ║
║  │  - INDEX(Timestamp)                  — Time-range queries                 │     ║
║  │                                                                            │     ║
║  │  CONSTRAINTS:                                                              │     ║
║  │  - APPEND-ONLY (no UPDATE, no DELETE)                                     │     ║
║  │  - EventVersion must be previous + 1 (gap detection)                      │     ║
║  └────────────────────────────────────────────────────────────────────────────┘     ║
║                                                                                     ║
║  SNAPSHOT TABLE (for performance):                                                  ║
║  ┌────────────────────────────────────────────────────────────────────────────┐     ║
║  │  Table: CaseSnapshot                                                       │     ║
║  │  ──────────────────────────────────────────────────────────────────────── │     ║
║  │  SnapshotId:     UUID (PK)                                                │     ║
║  │  AggregateId:    UUID (FK→CaseId)                                         │     ║
║  │  EventVersion:   int               — Snapshot taken at this version       │     ║
║  │  State:          JSONB             — Full aggregate state at this point   │     ║
║  │  Timestamp:      DateTime          — When snapshot was taken              │     ║
║  │                                                                            │     ║
║  │  Strategy: Snapshot every 50 events or every 24 hours, whichever first   │     ║
║  └────────────────────────────────────────────────────────────────────────────┘     ║
║                                                                                     ║
║  EXAMPLE EVENT STREAM FOR CASE KA/BLR/2026/FIR/001:                                ║
║  ┌────────────────────────────────────────────────────────────────────────────┐     ║
║  │  v1 │ FIRRegistered          │ {firNumber, station, crimeHead, ...}       │     ║
║  │  v2 │ ComplainantRecorded    │ {complainantId, name, phone, ...}          │     ║
║  │  v3 │ SectionsAssigned       │ {sections: [IPC 302, IPC 34]}              │     ║
║  │  v4 │ AccusedLinked          │ {accusedId, name, role: Primary}           │     ║
║  │  v5 │ IOAssigned             │ {ioId, ioName, assignedBy}                 │     ║
║  │  v6 │ CaseStatusUpdated      │ {old: Registered, new: UnderInvestigation}│     ║
║  │  v7 │ SectionsAmended        │ {added: [IPC 120B], removed: []}           │     ║
║  │  v8 │ AccusedLinked          │ {accusedId, name, role: Accomplice}        │     ║
║  │  v9 │ AccusedArrested        │ {accusedId, arrestDate, location}          │     ║
║  │ v10 │ EvidenceCollected      │ {evidenceId, type: Weapon, hash: sha256}   │     ║
║  │ ... │ ...                    │ ...                                         │     ║
║  │ v47 │ ChargesheetFiled       │ {chargesheetId, courtId, filingDate}       │     ║
║  │ v48 │ CaseStatusUpdated      │ {old: UnderInvestigation, new: Chargesheeted}│   ║
║  │ v49 │ CourtHearingScheduled  │ {hearingDate, courtId, hearingType}        │     ║
║  │ v50 │ ══ SNAPSHOT TAKEN ══   │ {full aggregate state at v50}              │     ║
║  │ v51 │ BailGranted            │ {accusedId, conditions, courtOrder}        │     ║
║  │ ... │                        │                                             │     ║
║  └────────────────────────────────────────────────────────────────────────────┘     ║
║                                                                                     ║
║  RECONSTRUCTION ALGORITHM:                                                          ║
║  1. Load latest snapshot for aggregateId (if exists)                                ║
║  2. Load all events AFTER snapshot's eventVersion                                   ║
║  3. Apply events in order to rebuild current state                                  ║
║  4. Cache reconstructed aggregate (Catalyst Cache, 30-min TTL)                     ║
║                                                                                     ║
║  WHY EVENT SOURCING FOR CASES:                                                      ║
║  ✓ Complete, tamper-evident audit trail (legal requirement for criminal cases)      ║
║  ✓ Temporal queries ("What was the case status on March 15th?")                    ║
║  ✓ Debugging and forensics ("Why was this section removed?")                       ║
║  ✓ Event replay for read model rebuilding (if Elasticsearch index corrupted)       ║
║  ✓ Compliance with BNSS digital evidence requirements                              ║
║                                                                                     ║
║  TRADE-OFFS:                                                                        ║
║  ✗ Increased storage (50 events per case × 100M cases = 5B events)                 ║
║  ✗ Reconstruction latency without snapshots (mitigated by snapshot strategy)        ║
║  ✗ Schema evolution complexity (mitigated by SchemaVersion field + upcasters)      ║
║  ✗ Developer learning curve (mitigated by team training and framework)              ║
╚══════════════════════════════════════════════════════════════════════════════════════╝
```

### 10.2.3 Saga Pattern: FIR Registration Saga (Choreography-Based)

```
╔══════════════════════════════════════════════════════════════════════════════════════╗
║               SAGA: FIR REGISTRATION → FULL SETUP                                   ║
║               (Choreography-Based — No Central Orchestrator)                         ║
╠══════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                     ║
║  HAPPY PATH:                                                                        ║
║  ───────────                                                                        ║
║                                                                                     ║
║  Step 1         Step 2          Step 3          Step 4          Step 5               ║
║  ┌────────┐     ┌────────┐     ┌────────┐     ┌────────┐     ┌────────┐            ║
║  │ Crime  │     │Investi-│     │Criminal│     │Geospa- │     │Notifi- │            ║
║  │  Reg   │────►│ gation │────►│Profile │────►│ tial   │────►│cation  │            ║
║  │Service │     │Service │     │Service │     │Service │     │Service │            ║
║  └────────┘     └────────┘     └────────┘     └────────┘     └────────┘            ║
║                                                                                     ║
║  FIRRegistered  Investigation  CriminalProfile  CrimeGeocoded  Notifications        ║
║  ──────────►    Started        Updated          ──────────►    Sent                  ║
║  (Event)        ──────────►    ──────────►       (Event)        ──────────►          ║
║                 (Event)        (Event)                          (Event)              ║
║                                                                                     ║
║  DETAILED FLOW:                                                                     ║
║  ─────────────                                                                      ║
║                                                                                     ║
║  1. Crime Registration Service:                                                     ║
║     - Validates FIR data, generates FIR number                                      ║
║     - Saves to Catalyst Data Store (local transaction)                              ║
║     - Writes FIRRegistered event to Outbox table (same transaction)                 ║
║     - Outbox relay publishes to Kafka topic: crime.events                            ║
║                                                                                     ║
║  2. Investigation Service (consumes FIRRegistered):                                 ║
║     - Creates Investigation record                                                  ║
║     - Assigns IO (calls Personnel Service with circuit breaker)                     ║
║     - Saves locally, publishes InvestigationStarted event                            ║
║     - If IO assignment fails: creates investigation in PENDING_IO status            ║
║                                                                                     ║
║  3. Criminal Profile Service (consumes FIRRegistered):                              ║
║     - For each accused in FIR: create or update CriminalProfile                     ║
║     - Recompute risk scores                                                         ║
║     - Publishes CriminalProfileUpdated event                                         ║
║     - If fails: retry from Kafka (consumer offset not committed)                    ║
║                                                                                     ║
║  4. Geospatial Intelligence Service (consumes FIRRegistered):                       ║
║     - Geocodes crime location (if address-only, no GPS)                             ║
║     - Resolves jurisdiction (GPS → police station)                                  ║
║     - Updates crime point layer, recalculates hotspot if threshold met              ║
║     - Publishes CrimeGeocoded event                                                 ║
║     - If fails: logs spatial processing failure, retries                            ║
║                                                                                     ║
║  5. Notification Service (consumes FIRRegistered):                                  ║
║     - Sends SMS to complainant with FIR number                                      ║
║     - Sends in-app notification to SHO                                              ║
║     - Sends email to IO (if assigned)                                               ║
║     - Publishes NotificationsSent event                                              ║
║     - If SMS gateway fails: retries with exponential backoff, DLQ after 5 attempts ║
║                                                                                     ║
║  6. Search & Discovery Service (consumes FIRRegistered):                            ║
║     - Indexes case in Elasticsearch                                                 ║
║     - Generates text embedding via AI/ML Service                                    ║
║     - Stores embedding in Pinecone                                                   ║
║                                                                                     ║
║  7. Analytics Engine Service (consumes FIRRegistered):                              ║
║     - Updates real-time counters in Catalyst Cache                                  ║
║     - Writes to Databricks fact_crime_registration table                            ║
║                                                                                     ║
║  8. Audit & Compliance Service (consumes FIRRegistered):                            ║
║     - Logs FIR registration audit event                                              ║
║     - Records user, timestamp, IP, and full payload                                 ║
║                                                                                     ║
║                                                                                     ║
║  COMPENSATION (FAILURE HANDLING):                                                   ║
║  ────────────────────────────────                                                   ║
║                                                                                     ║
║  Saga Step Failures and Compensation Actions:                                       ║
║                                                                                     ║
║  │ Failed Step         │ Compensation                          │ Notes              ║
║  │─────────────────────│───────────────────────────────────────│────────────────────║
║  │ FIR Registration    │ N/A — local transaction, atomic       │ Fail fast, return  ║
║  │ (Step 1)            │ rollback by DB                        │ error to user      ║
║  │─────────────────────│───────────────────────────────────────│────────────────────║
║  │ Investigation Setup │ FIR remains valid. Investigation      │ Retry from Kafka.  ║
║  │ (Step 2)            │ created in PENDING state. Alert SHO.  │ Manual assignment  ║
║  │                     │ No compensation needed for FIR.       │ as fallback.       ║
║  │─────────────────────│───────────────────────────────────────│────────────────────║
║  │ Criminal Profile    │ No compensation. Profile update is    │ Eventually          ║
║  │ (Step 3)            │ idempotent. Retry from Kafka.         │ consistent.        ║
║  │─────────────────────│───────────────────────────────────────│────────────────────║
║  │ Geospatial          │ No compensation. Crime exists without │ Geocoding retried  ║
║  │ (Step 4)            │ spatial data. Batch fix nightly.      │ nightly.           ║
║  │─────────────────────│───────────────────────────────────────│────────────────────║
║  │ Notification        │ No compensation. Notification is best │ SMS re-queued.     ║
║  │ (Step 5)            │ effort. DLQ for manual retry.         │ Not critical path. ║
║  │─────────────────────│───────────────────────────────────────│────────────────────║
║                                                                                     ║
║  KEY DESIGN DECISIONS:                                                              ║
║  1. Choreography (not orchestration) because all steps are independent and          ║
║     can proceed in parallel. No step depends on the output of another step.         ║
║  2. FIR Registration is the ONLY atomic step. All downstream processing is          ║
║     eventually consistent. This means an FIR is immediately valid and visible       ║
║     even if investigation, profiling, or notification is delayed.                   ║
║  3. No compensating transactions needed because downstream steps are additive       ║
║     (creating new records) not modifying the FIR. FIR validity is independent       ║
║     of downstream processing.                                                       ║
║  4. Idempotent consumers: All consumers use event ID for deduplication.             ║
║     Re-processing the same FIRRegistered event produces the same result.            ║
╚══════════════════════════════════════════════════════════════════════════════════════╝
```

### 10.2.4 Outbox Pattern: Reliable Event Publishing

```
╔══════════════════════════════════════════════════════════════════════════════════════╗
║                    OUTBOX PATTERN IMPLEMENTATION                                     ║
╠══════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                     ║
║  PROBLEM: How to atomically update database AND publish event?                      ║
║  - Two-phase commit (2PC) is not supported across Catalyst Data Store + Kafka       ║
║  - Publishing first, then saving risks orphan events if save fails                  ║
║  - Saving first, then publishing risks lost events if publish fails                 ║
║                                                                                     ║
║  SOLUTION: Outbox table in the same database, polled by relay                       ║
║                                                                                     ║
║  ┌──────────────────────────────────────────────────────────────────────────────┐   ║
║  │  Service Code (Crime Registration Service)                                   │   ║
║  │                                                                               │   ║
║  │  BEGIN TRANSACTION                                                            │   ║
║  │    INSERT INTO CaseMaster (...) VALUES (...)                                  │   ║
║  │    INSERT INTO Outbox (                                                       │   ║
║  │      eventId,                                                                 │   ║
║  │      aggregateId,                                                             │   ║
║  │      eventType = 'FIRRegistered',                                            │   ║
║  │      payload = '{caseId, firNumber, ...}',                                   │   ║
║  │      topic = 'crime.events',                                                 │   ║
║  │      partitionKey = caseId,                                                   │   ║
║  │      status = 'PENDING',                                                      │   ║
║  │      createdAt = NOW()                                                        │   ║
║  │    )                                                                          │   ║
║  │  COMMIT TRANSACTION                                                           │   ║
║  └──────────────────────┬───────────────────────────────────────────────────────┘   ║
║                         │                                                           ║
║                         │ Same DB, same transaction = ATOMIC                       ║
║                         │                                                           ║
║                         ▼                                                           ║
║  ┌──────────────────────────────────────────────────────────────────────────────┐   ║
║  │  Outbox Table (Catalyst Data Store)                                          │   ║
║  │                                                                               │   ║
║  │  EventId    │ AggregateId │ EventType      │ Payload │ Topic    │ Status     │   ║
║  │  ───────────│─────────────│────────────────│─────────│──────────│────────────│   ║
║  │  evt-001    │ case-xyz    │ FIRRegistered  │ {json}  │ crime.*  │ PENDING    │   ║
║  │  evt-002    │ case-abc    │ StatusUpdated  │ {json}  │ crime.*  │ PUBLISHED  │   ║
║  │  evt-003    │ case-def    │ SectionsAdded  │ {json}  │ crime.*  │ PENDING    │   ║
║  └──────────────────────┬───────────────────────────────────────────────────────┘   ║
║                         │                                                           ║
║                         │ Polled every 100ms by Outbox Relay                       ║
║                         │                                                           ║
║                         ▼                                                           ║
║  ┌──────────────────────────────────────────────────────────────────────────────┐   ║
║  │  Outbox Relay (Catalyst Cron + Functions)                                    │   ║
║  │                                                                               │   ║
║  │  1. SELECT * FROM Outbox WHERE status = 'PENDING'                             │   ║
║  │     ORDER BY createdAt LIMIT 100                                              │   ║
║  │  2. For each event:                                                           │   ║
║  │     a. Publish to Kafka topic (with eventId as idempotency key)               │   ║
║  │     b. UPDATE Outbox SET status = 'PUBLISHED', publishedAt = NOW()            │   ║
║  │  3. If publish fails:                                                         │   ║
║  │     a. INCREMENT retryCount                                                    │   ║
║  │     b. SET nextRetryAt = NOW() + exponential_backoff(retryCount)              │   ║
║  │     c. If retryCount > 10: SET status = 'FAILED', alert ops team             │   ║
║  │  4. Cleanup: DELETE FROM Outbox WHERE status = 'PUBLISHED'                    │   ║
║  │     AND publishedAt < NOW() - INTERVAL 7 DAYS                                │   ║
║  └──────────────────────┬───────────────────────────────────────────────────────┘   ║
║                         │                                                           ║
║                         ▼                                                           ║
║  ┌──────────────────────────────────────────────────────────────────────────────┐   ║
║  │  Kafka (Confluent Cloud)                                                     │   ║
║  │  Topic: crime.events                                                          │   ║
║  │  Partitioned by: caseId (ensures ordering per case)                          │   ║
║  └──────────────────────────────────────────────────────────────────────────────┘   ║
║                                                                                     ║
║  GUARANTEES:                                                                        ║
║  ✓ At-least-once delivery (event will be published or retried until success)       ║
║  ✓ No lost events (event in same transaction as data change)                       ║
║  ✓ No orphan events (if transaction rolls back, outbox entry also rolls back)      ║
║  ✓ Ordering preserved per aggregate (partitioned by caseId)                        ║
║                                                                                     ║
║  CONSUMERS MUST BE IDEMPOTENT:                                                      ║
║  - Use EventId for deduplication                                                    ║
║  - Store processed EventIds in local "processed_events" table                      ║
║  - Before processing: check if EventId already processed                           ║
╚══════════════════════════════════════════════════════════════════════════════════════╝
```

### 10.2.5 Circuit Breaker Pattern

```
╔══════════════════════════════════════════════════════════════════════════════════════╗
║                    CIRCUIT BREAKER — STATE MACHINE                                   ║
╠══════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                     ║
║                    ┌─────────────────────┐                                          ║
║                    │      CLOSED         │                                          ║
║         ┌─────────│  (Normal Operation)  │◄───────────┐                             ║
║         │         │                      │            │                              ║
║         │         │  Failures: 0/5       │            │                              ║
║         │         │  Requests: pass thru │            │ Success in                   ║
║         │         └──────────┬───────────┘            │ half-open                    ║
║         │                    │                         │                              ║
║         │                    │ Failure count           │                              ║
║         │                    │ reaches threshold       │                              ║
║         │                    │ (5 failures in 60s)     │                              ║
║         │                    ▼                         │                              ║
║         │         ┌─────────────────────┐              │                              ║
║         │         │       OPEN          │              │                              ║
║         │         │  (Fail Fast)        │              │                              ║
║         │         │                      │              │                              ║
║         │         │  All requests fail   │              │                              ║
║         │         │  immediately with    │              │                              ║
║         │         │  fallback response   │              │                              ║
║         │         │                      │              │                              ║
║         │         │  Reset timeout: 30s  │              │                              ║
║         │         └──────────┬───────────┘              │                              ║
║         │                    │                          │                              ║
║         │                    │ After reset timeout      │                              ║
║         │                    ▼                          │                              ║
║         │         ┌─────────────────────┐              │                              ║
║         │         │     HALF-OPEN       │──────────────┘                              ║
║         │         │  (Testing)          │                                             ║
║   Failure in      │                      │                                             ║
║   half-open       │  Allow 3 test        │                                             ║
║         │         │  requests through    │                                             ║
║         │         │                      │                                             ║
║         └────────►│  If successful:      │                                             ║
║         (back to  │    → CLOSED          │                                             ║
║          OPEN)    │  If fails:           │                                             ║
║                   │    → OPEN (restart   │                                             ║
║                   │       timer)         │                                             ║
║                   └─────────────────────┘                                             ║
║                                                                                     ║
║  CIRCUIT BREAKER CONFIGURATIONS PER SERVICE PAIR:                                    ║
║                                                                                     ║
║  │ Caller            │ Callee          │ Threshold │ Reset  │ Half-Open │ Fallback   ║
║  │───────────────────│─────────────────│───────────│────────│───────────│────────────║
║  │ Crime Reg         │ Personnel       │ 5/60s     │ 30s    │ 3 req     │ Cached     ║
║  │ Crime Reg         │ Org Hierarchy   │ 3/60s     │ 60s    │ 2 req     │ Cached     ║
║  │ Investigation     │ Personnel       │ 5/60s     │ 30s    │ 3 req     │ Cached     ║
║  │ Investigation     │ Document Svc    │ 3/60s     │ 60s    │ 2 req     │ Queue      ║
║  │ Criminal Profile  │ AI/ML Pipeline  │ 3/120s    │ 120s   │ 2 req     │ Stale Score║
║  │ Criminal Profile  │ Pinecone        │ 5/60s     │ 60s    │ 3 req     │ ES keyword ║
║  │ Search & Discovery│ Elasticsearch   │ 5/30s     │ 60s    │ 3 req     │ Cache      ║
║  │ Search & Discovery│ Pinecone        │ 3/60s     │ 120s   │ 2 req     │ No semantic║
║  │ Court & Legal     │ eCourts API     │ 5/300s    │ 600s   │ 1 req     │ Manual mode║
║  │ Notification      │ SMS Gateway     │ 10/60s    │ 60s    │ 5 req     │ Queue+DLQ  ║
║  │ AI/ML Pipeline    │ Vertex AI       │ 3/60s     │ 300s   │ 2 req     │ OpenAI     ║
║  │ Geospatial        │ Google Maps     │ 10/60s    │ 300s   │ 5 req     │ Nominatim  ║
║  │ Geospatial        │ PostGIS         │ 3/30s     │ 60s    │ 2 req     │ Cached data║
╚══════════════════════════════════════════════════════════════════════════════════════╝
```

### 10.2.6 Retry with Exponential Backoff

| Service Context | Max Retries | Initial Delay | Multiplier | Max Delay | Jitter | DLQ After |
|---|---|---|---|---|---|---|
| Kafka event publish (Outbox relay) | 10 | 100ms | 2x | 30s | ±20% | 10 failures |
| Catalyst Signals publish | 5 | 200ms | 2x | 10s | ±15% | 5 failures |
| External API calls (eCourts, CCTNS) | 3 | 1s | 3x | 30s | ±25% | Immediate DLQ |
| SMS/Email delivery | 5 | 1s | 2x | 60s | ±20% | 5 failures |
| Elasticsearch indexing | 3 | 500ms | 2x | 5s | ±10% | 3 failures |
| ML inference calls | 2 | 500ms | 2x | 5s | ±15% | Return fallback |
| Database operations | 3 | 100ms | 2x | 2s | ±10% | Fail request |

### 10.2.7 Dead Letter Queue: Failed Event Handling

```
╔══════════════════════════════════════════════════════════════════════════════════════╗
║                    DEAD LETTER QUEUE STRATEGY                                        ║
╠══════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                     ║
║  ┌──────────┐    Retries     ┌──────────┐    Max Retries    ┌──────────────┐       ║
║  │  Source   │────────────►  │  Retry   │───────────────►   │  Dead Letter  │       ║
║  │  Topic    │   Exhausted   │  Topic   │   Exhausted       │  Queue (SQS)  │       ║
║  │          │                │          │                    │               │       ║
║  │ crime.   │                │ crime.   │                    │ crime-events  │       ║
║  │ events   │                │ events.  │                    │ -dlq          │       ║
║  │          │                │ retry    │                    │               │       ║
║  └──────────┘                └──────────┘                    └───────┬───────┘       ║
║                                                                     │               ║
║                                                                     ▼               ║
║                                                              ┌──────────────┐       ║
║                                                              │  DLQ Monitor │       ║
║                                                              │  (Datadog)   │       ║
║                                                              │              │       ║
║                                                              │  Alert when: │       ║
║                                                              │  depth > 10  │       ║
║                                                              │  age > 1 hour│       ║
║                                                              └───────┬──────┘       ║
║                                                                      │              ║
║                                                                      ▼              ║
║                                                              ┌──────────────┐       ║
║                                                              │  DLQ Admin   │       ║
║                                                              │  Dashboard   │       ║
║                                                              │              │       ║
║                                                              │  Actions:    │       ║
║                                                              │  - Inspect   │       ║
║                                                              │  - Replay    │       ║
║                                                              │  - Discard   │       ║
║                                                              │  - Route to  │       ║
║                                                              │    new topic │       ║
║                                                              └──────────────┘       ║
║                                                                                     ║
║  DLQ CONFIGURATION:                                                                 ║
║  │ DLQ Name                    │ Source                │ Retention │ Alert       │   ║
║  │─────────────────────────────│───────────────────────│───────────│─────────────│   ║
║  │ crime-events-dlq            │ crime.events          │ 14 days   │ depth > 10  │   ║
║  │ analytics-events-dlq        │ analytics.agg         │ 7 days    │ depth > 50  │   ║
║  │ search-indexing-dlq         │ search.indexing        │ 7 days    │ depth > 100 │   ║
║  │ notification-dlq            │ notification.send      │ 14 days   │ depth > 20  │   ║
║  │ audit-events-dlq            │ audit.events           │ 30 days   │ depth > 0   │   ║
║  │ ml-features-dlq             │ ml.features            │ 7 days    │ depth > 50  │   ║
║  │ geo-events-dlq              │ geo.events             │ 7 days    │ depth > 20  │   ║
║  │ signals-catch-all-dlq       │ Catalyst Signals       │ 14 days   │ depth > 5   │   ║
║                                                                                     ║
║  DLQ PROCESSING RULES:                                                              ║
║  1. audit-events-dlq: Alert on ANY message (audit events must not be lost)          ║
║  2. crime-events-dlq: Auto-replay after 1 hour (transient failures self-heal)      ║
║  3. notification-dlq: Manual review — check if notification still relevant          ║
║  4. All DLQs: Include original event, error details, retry count, timestamps       ║
╚══════════════════════════════════════════════════════════════════════════════════════╝
```

### 10.2.8 Event Schema Evolution: Forward/Backward Compatibility

| Strategy | Mechanism | Example |
|---|---|---|
| **Schema Registry** | Confluent Schema Registry with JSON Schema | All Kafka events registered with schemas |
| **SchemaVersion field** | Every event payload includes `schemaVersion: int` | Consumers check version before deserialization |
| **Backward Compatible** | New fields must have defaults; existing fields cannot be removed | Adding `urgencyLevel` to `FIRRegistered` with default `NORMAL` |
| **Forward Compatible** | Consumers must ignore unknown fields | Old consumer ignores new `urgencyLevel` field |
| **Upcasting** | Transform old events to new schema on read | When replaying v1 events, upcaster adds default `urgencyLevel` |
| **Versioned Topics** | For breaking changes, create new topic version | `crime.events.v1` → `crime.events.v2` with migration period |
| **Migration Window** | Both old and new schema consumed for 30 days | Producers switch first, consumers updated within 30 days |

**Schema Evolution Rules:**
1. **NEVER** remove a required field (breaking change).
2. **NEVER** change a field's data type (breaking change).
3. **ALWAYS** add new fields as optional with sensible defaults.
4. **ALWAYS** register schema changes in Confluent Schema Registry before deploying producers.
5. For breaking changes: version the topic, run both in parallel, migrate consumers, then sunset old topic.

---

## 10.3 Domain Events Catalog

### 10.3.1 Complete Event Registry (30+ Events)

| # | Event Name | Source Service | Kafka Topic | Partition Key | Consumers | Ordering Guarantee | Idempotency Strategy |
|---|---|---|---|---|---|---|---|
| 1 | `FIRRegistered` | Crime Registration | `crime.events` | `caseId` | Investigation, Criminal Profile, Geospatial, Notification, Search, Analytics, Audit | Per-case ordering | Dedup by `eventId` |
| 2 | `ZeroFIRRegistered` | Crime Registration | `crime.events` | `caseId` | Investigation, Geospatial, Notification, Audit | Per-case ordering | Dedup by `eventId` |
| 3 | `CaseStatusUpdated` | Crime Registration | `crime.events` | `caseId` | Investigation, Analytics, Search, Notification, Audit | Per-case ordering | Dedup by `eventId` + version check |
| 4 | `CaseSectionsAmended` | Crime Registration | `crime.events` | `caseId` | Search, Analytics, Court & Legal, Audit | Per-case ordering | Dedup by `eventId` |
| 5 | `CaseTransferred` | Crime Registration | `crime.events` | `caseId` | Investigation, Geospatial, Notification, Audit | Per-case ordering | Dedup by `eventId` |
| 6 | `AccusedLinkedToCase` | Crime Registration | `crime.events` | `caseId` | Criminal Profile, Network Intel, Search, Audit | Per-case ordering | Dedup by `eventId` |
| 7 | `VictimRecorded` | Crime Registration | `crime.events` | `caseId` | Search, Analytics, Audit | Per-case ordering | Dedup by `eventId` |
| 8 | `InvestigationStarted` | Investigation | `crime.events` | `caseId` | Analytics, Notification, Audit | Per-case ordering | Dedup by `eventId` |
| 9 | `CaseDiaryEntryAdded` | Investigation | `audit.events` | `investigationId` | Audit | Per-investigation | Dedup by `eventId` |
| 10 | `IOReassigned` | Investigation | `crime.events` | `caseId` | Notification, Analytics, Audit | Per-case ordering | Dedup by `eventId` |
| 11 | `InvestigationCompleted` | Investigation | `crime.events` | `caseId` | Court & Legal, Criminal Profile, Analytics, Notification, Audit | Per-case ordering | Dedup by `eventId` |
| 12 | `InvestigationDeadlineApproaching` | Investigation | `crime.events` | `caseId` | Notification | Per-case ordering | Dedup by `eventId` + date |
| 13 | `EvidenceCollected` | Investigation | `crime.events` | `caseId` | Document & Evidence, Audit | Per-case ordering | Dedup by `eventId` |
| 14 | `EvidenceCustodyTransferred` | Investigation | `audit.events` | `evidenceId` | Audit | Per-evidence | Dedup by `eventId` |
| 15 | `CriminalProfileCreated` | Criminal Profile | `crime.events` | `profileId` | Network Intel, Search, Analytics, Audit | Per-profile | Dedup by `eventId` |
| 16 | `RiskScoreUpdated` | Criminal Profile | `crime.events` | `profileId` | Network Intel, Notification (high-risk), Analytics | Per-profile | Dedup by `eventId` + version |
| 17 | `HistorySheeterFlagged` | Criminal Profile | `crime.events` | `profileId` | Notification, Analytics, Audit | Per-profile | Dedup by `eventId` |
| 18 | `MOPatternMatched` | Criminal Profile | `crime.events` | `caseId` | Notification (IO alert), Audit | Per-case ordering | Dedup by `eventId` |
| 19 | `GangIdentified` | Network Intelligence | `crime.events` | `gangId` | Notification, Analytics, Audit | Per-gang | Dedup by `eventId` |
| 20 | `CriminalAssociationDiscovered` | Network Intelligence | `crime.events` | `profileId` | Criminal Profile, Analytics, Audit | Per-profile | Dedup by `eventId` |
| 21 | `NetworkClusterDetected` | Network Intelligence | `crime.events` | `clusterId` | Notification, Analytics | Per-cluster | Dedup by `eventId` |
| 22 | `CrimeGeocoded` | Geospatial Intel | `geo.events` | `caseId` | Analytics, Search, Audit | Per-case ordering | Dedup by `eventId` |
| 23 | `HotspotUpdated` | Geospatial Intel | `geo.events` | `jurisdictionId` | Analytics, Notification (SHO alert) | Per-jurisdiction | Dedup by `eventId` + version |
| 24 | `SpatialAnomalyDetected` | Geospatial Intel | `geo.events` | `jurisdictionId` | Notification, Analytics, Audit | Per-jurisdiction | Dedup by `eventId` |
| 25 | `ChargesheetFiled` | Court & Legal | `crime.events` | `caseId` | Criminal Profile, Analytics, Notification, Search, Audit | Per-case ordering | Dedup by `eventId` |
| 26 | `AccusedArrested` | Court & Legal | `crime.events` | `caseId` | Criminal Profile, Geospatial, Analytics, Notification, Audit | Per-case ordering | Dedup by `eventId` |
| 27 | `BailGranted` | Court & Legal | `crime.events` | `caseId` | Criminal Profile, Notification, Analytics, Audit | Per-case ordering | Dedup by `eventId` |
| 28 | `CaseDisposed` | Court & Legal | `crime.events` | `caseId` | Criminal Profile, Analytics, Search, Notification, Audit | Per-case ordering | Dedup by `eventId` |
| 29 | `EmployeeTransferred` | Personnel | `org.events` | `employeeId` | Investigation (IO reassignment check), Analytics, Audit | Per-employee | Dedup by `eventId` |
| 30 | `PredictionGenerated` | AI/ML Pipeline | `ml.features` | `modelId` | Analytics, Audit | Per-model | Dedup by `eventId` |
| 31 | `ModelDriftDetected` | AI/ML Pipeline | `ml.features` | `modelId` | Notification (ML admin alert), Audit | Per-model | Dedup by `eventId` |
| 32 | `ReportGenerated` | Reporting | `analytics.agg` | `reportId` | Notification, Audit | Per-report | Dedup by `eventId` |
| 33 | `DataIngestionCompleted` | Data Ingestion | `analytics.agg` | `jobId` | Notification, Audit | Per-job | Dedup by `eventId` |
| 34 | `UserLoginSucceeded` | Identity & Access | `audit.events` | `userId` | Audit | Per-user | Dedup by `eventId` |
| 35 | `UserLoginFailed` | Identity & Access | `audit.events` | `userId` | Audit, Notification (lockout) | Per-user | Dedup by `eventId` |
| 36 | `UnauthorizedAccessAttempted` | Identity & Access | `audit.events` | `userId` | Audit, Notification (security alert) | Per-user | Dedup by `eventId` |
| 37 | `ExternalSyncCompleted` | Data Ingestion | `analytics.agg` | `connectorId` | Notification, Audit | Per-connector | Dedup by `eventId` |
| 38 | `ExternalSyncFailed` | Data Ingestion | `analytics.agg` | `connectorId` | Notification (alert), Audit | Per-connector | Dedup by `eventId` |

### 10.3.2 Event Payload Schema Examples

**Event: FIRRegistered (v2)**
```json
{
  "eventId": "evt-uuid-001",
  "eventType": "FIRRegistered",
  "schemaVersion": 2,
  "timestamp": "2026-07-17T10:30:00Z",
  "source": "crime-registration-service",
  "partitionKey": "case-uuid-001",
  "correlationId": "req-uuid-001",
  "causationId": null,
  "metadata": {
    "userId": "emp-uuid-001",
    "userAgent": "KAICIP-Web/2.0",
    "ipAddress": "10.0.1.50",
    "traceId": "trace-uuid-001"
  },
  "payload": {
    "caseId": "case-uuid-001",
    "firNumber": "234/2026",
    "caseCategory": "FIR",
    "policeStationId": "station-uuid-001",
    "policeStationName": "Basavanagudi PS",
    "districtId": "dist-uuid-001",
    "districtName": "Bengaluru Urban",
    "crimeHeadId": "ch-uuid-001",
    "crimeHeadName": "Murder",
    "gravityId": "grav-uuid-001",
    "gravityName": "Heinous",
    "sections": [
      {"actId": "act-uuid-001", "actName": "IPC", "sectionId": "sec-uuid-302", "sectionNumber": "302", "isPrimary": true},
      {"actId": "act-uuid-001", "actName": "IPC", "sectionId": "sec-uuid-034", "sectionNumber": "34", "isPrimary": false}
    ],
    "occurrenceFromDate": "2026-07-16T22:00:00Z",
    "occurrenceToDate": "2026-07-16T23:00:00Z",
    "reportedDate": "2026-07-17T10:15:00Z",
    "placeOfOccurrence": "Mahatma Gandhi Road, near Metro Station",
    "latitude": 12.9716,
    "longitude": 77.5946,
    "gpsAccuracy": 10.5,
    "briefFacts": "ನಿನ್ನೆ ರಾತ್ರಿ 10 ಗಂಟೆಯ ಸುಮಾರಿಗೆ...",
    "ioEmployeeId": "emp-uuid-002",
    "ioName": "PI Rajesh Kumar",
    "complainantId": "comp-uuid-001",
    "isZeroFIR": false,
    "urgencyLevel": "HIGH",
    "registeredBy": "emp-uuid-001"
  }
}
```

**Event: RiskScoreUpdated (v1)**
```json
{
  "eventId": "evt-uuid-002",
  "eventType": "RiskScoreUpdated",
  "schemaVersion": 1,
  "timestamp": "2026-07-17T11:00:00Z",
  "source": "criminal-profile-service",
  "partitionKey": "profile-uuid-001",
  "payload": {
    "profileId": "profile-uuid-001",
    "accusedId": "accused-uuid-001",
    "previousScore": 0.45,
    "newScore": 0.78,
    "previousCategory": "MEDIUM",
    "newCategory": "HIGH",
    "factors": [
      {"factor": "REPEAT_OFFENCE", "weight": 0.3, "value": 5},
      {"factor": "HEINOUS_CRIME", "weight": 0.25, "value": true},
      {"factor": "CONVICTION_HISTORY", "weight": 0.2, "value": 2},
      {"factor": "RECENT_ACTIVITY", "weight": 0.15, "value": "30_DAYS"},
      {"factor": "GANG_ASSOCIATION", "weight": 0.1, "value": true}
    ],
    "modelVersion": "risk-model-v3.2.1",
    "modelId": "model-uuid-001"
  }
}
```

### 10.3.3 Event Flow: Complete FIR-to-Conviction Lifecycle

```
╔══════════════════════════════════════════════════════════════════════════════════════╗
║              COMPLETE EVENT FLOW: FIR → CONVICTION                                   ║
╠══════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                     ║
║  PHASE 1: REGISTRATION (Day 0)                                                     ║
║  ────────────────────────────                                                       ║
║  Complainant files complaint                                                        ║
║       │                                                                             ║
║       ▼                                                                             ║
║  FIRRegistered ──┬──► InvestigationStarted ──► IOAssigned                          ║
║       │          ├──► CriminalProfileCreated (for each accused)                     ║
║       │          ├──► CrimeGeocoded                                                 ║
║       │          ├──► NotificationsSent (SMS to complainant, alert to SHO)          ║
║       │          ├──► SearchIndexUpdated (case now searchable)                      ║
║       │          ├──► AnalyticsCounterIncremented (real-time dashboard)             ║
║       │          └──► AuditEventLogged                                              ║
║       │                                                                             ║
║  PHASE 2: INVESTIGATION (Days 1-60)                                                ║
║  ──────────────────────────────────                                                 ║
║       │                                                                             ║
║       ├── CaseDiaryEntryAdded (daily) ──► AuditEventLogged                         ║
║       │                                                                             ║
║       ├── EvidenceCollected ──┬──► ChainOfCustodyRecorded                          ║
║       │                      └──► AuditEventLogged                                  ║
║       │                                                                             ║
║       ├── MOPatternMatched ──► NotificationSent (IO: "Similar MO found")           ║
║       │                                                                             ║
║       ├── AccusedLinkedToCase ──┬──► RiskScoreUpdated                              ║
║       │                        ├──► CriminalAssociationDiscovered                   ║
║       │                        └──► NetworkClusterDetected (if new connections)     ║
║       │                                                                             ║
║       ├── InvestigationDeadlineApproaching ──► NotificationSent (IO + SHO)         ║
║       │                                                                             ║
║       ▼                                                                             ║
║  PHASE 3: ARREST (Day 15-45)                                                       ║
║  ────────────────────────────                                                       ║
║       │                                                                             ║
║  AccusedArrested ──┬──► RiskScoreUpdated (arrest increases risk assessment)        ║
║       │            ├──► CrimeGeocoded (arrest location)                             ║
║       │            ├──► NotificationsSent (SHO, SP)                                ║
║       │            └──► AuditEventLogged                                            ║
║       │                                                                             ║
║  PHASE 4: CHARGESHEET (Day 60-90)                                                  ║
║  ────────────────────────────────                                                   ║
║       │                                                                             ║
║  InvestigationCompleted(Chargesheet) ──► ChargesheetFiled                          ║
║       │                                                                             ║
║  ChargesheetFiled ──┬──► CaseStatusUpdated (→ Chargesheeted)                       ║
║       │             ├──► NotificationsSent (court, accused, complainant)            ║
║       │             ├──► AnalyticsUpdated (chargesheet rate)                        ║
║       │             └──► AuditEventLogged                                           ║
║       │                                                                             ║
║  PHASE 5: TRIAL (Months to Years)                                                  ║
║  ────────────────────────────────                                                   ║
║       │                                                                             ║
║       ├── CourtHearingScheduled (recurring) ──► NotificationsSent                  ║
║       │                                                                             ║
║       ├── BailGranted ──┬──► RiskScoreUpdated                                      ║
║       │                 ├──► NotificationsSent (IO, complainant)                    ║
║       │                 └──► AuditEventLogged                                       ║
║       │                                                                             ║
║       ▼                                                                             ║
║  PHASE 6: DISPOSITION (Final)                                                       ║
║  ────────────────────────────                                                       ║
║       │                                                                             ║
║  CaseDisposed(Convicted) ──┬──► RiskScoreUpdated (conviction = high risk)          ║
║                            ├──► CriminalProfileUpdated (convictions++)             ║
║                            ├──► CaseStatusUpdated (→ Convicted)                     ║
║                            ├──► HistorySheeterFlagged (if criteria met)             ║
║                            ├──► AnalyticsUpdated (conviction rate)                  ║
║                            ├──► NotificationsSent (all stakeholders)               ║
║                            └──► AuditEventLogged                                    ║
║                                                                                     ║
║  TOTAL EVENTS PER CASE LIFECYCLE: ~50-200 events (depending on complexity)          ║
║  TOTAL STORAGE PER CASE: ~50KB-500KB of event data                                  ║
║  PROJECTED ANNUAL EVENTS: ~25M-100M events for Karnataka                           ║
╚══════════════════════════════════════════════════════════════════════════════════════╝
```

### 10.3.4 Kafka Topic Architecture

| Topic Name | Partitions | Replication | Retention | Compaction | Schema | Key |
|---|---|---|---|---|---|---|
| `crime.events` | 32 | 3 | 7 days | Delete | JSON Schema v2 | `caseId` |
| `analytics.agg` | 16 | 3 | 3 days | Delete | JSON Schema v1 | varies |
| `ml.features` | 8 | 2 | 3 days | Delete | Avro v1 | `modelId` |
| `search.indexing` | 16 | 2 | 3 days | Delete | JSON Schema v1 | `entityId` |
| `audit.events` | 32 | 3 | 30 days | Delete | JSON Schema v1 | `userId` |
| `geo.events` | 8 | 2 | 3 days | Delete | JSON Schema v1 | varies |
| `org.events` | 4 | 2 | 7 days | Compact | JSON Schema v1 | `entityId` |
| `notification.send` | 8 | 2 | 1 day | Delete | JSON Schema v1 | `recipientId` |
| `crime.events.retry` | 8 | 2 | 3 days | Delete | (same as source) | (same) |
| `analytics.agg.retry` | 4 | 2 | 3 days | Delete | (same as source) | (same) |

**Partition Strategy Rationale:**
- `crime.events` has 32 partitions because it's the highest-throughput topic and ordering is needed per `caseId`. 32 partitions allow up to 32 parallel consumers while maintaining per-case ordering.
- `audit.events` has 32 partitions because audit events from all services converge here, requiring high parallelism.
- `org.events` has only 4 partitions because organizational changes are rare (<100/day) and uses compaction (latest state per entity is sufficient).

---

## 10.4 Cross-Cutting Event Architecture Concerns

### 10.4.1 Event Observability

| Metric | Collection Point | Alert Threshold | Tool |
|---|---|---|---|
| Event publish latency | Producer side | p99 > 500ms | Datadog APM |
| Consumer lag (per group) | Kafka consumer | > 10,000 messages | Confluent Cloud monitoring |
| DLQ depth | SQS queue | > 10 messages | Datadog + PagerDuty |
| Event processing time | Consumer side | p99 > 5s | Datadog APM |
| Event throughput (events/sec) | Kafka broker | Drop > 50% from baseline | Confluent Cloud + Datadog |
| Schema validation errors | Schema Registry | Any error | Confluent Cloud + Slack alert |
| Outbox table size | Catalyst Data Store | > 10,000 pending | Custom Catalyst Cron check |
| End-to-end latency (publish → consume) | Correlation tracking | p99 > 30s | Datadog distributed tracing |

### 10.4.2 Event Security

| Concern | Implementation |
|---|---|
| **Encryption in Transit** | TLS 1.3 for all Kafka connections (Confluent Cloud enforced) |
| **Encryption at Rest** | Confluent Cloud managed encryption + customer-managed keys for RESTRICTED data |
| **PII in Events** | PII fields (names, phone numbers, addresses) encrypted at field level before publishing using AES-256-GCM. Consumers must have decryption key access. |
| **Access Control** | Kafka ACLs per service: producers can only write to their topics, consumers only read authorized topics |
| **Audit** | All event production and consumption logged. Unauthorized topic access attempts trigger security alerts. |
| **Data Classification** | Events tagged with classification level (PUBLIC, RESTRICTED, CONFIDENTIAL, SECRET). Consumer authorization checked against classification. |

### 10.4.3 Event Testing Strategy

| Test Type | Scope | Tool | Cadence |
|---|---|---|---|
| **Contract Testing** | Producer-consumer schema compatibility | Pact + Schema Registry | Every PR |
| **Integration Testing** | End-to-end event flow (publish → consume → side effect) | Testcontainers (embedded Kafka) | Every PR |
| **Chaos Testing** | Kafka broker failure, consumer crash, network partition | Litmus Chaos | Monthly |
| **Load Testing** | Event throughput under peak load (10x normal) | k6 + Kafka producer load generator | Quarterly |
| **Schema Evolution Testing** | Backward/forward compatibility verification | Confluent Schema Registry compatibility checks | Every schema change |

---

*End of Part 2: Domain Services & Event Architecture*

*Document continues in Part 3: Data Architecture & Security (Sections 11-14)*
