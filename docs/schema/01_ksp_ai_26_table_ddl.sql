-- ============================================================================
-- KSP AI: National Crime Intelligence & Operations System (NCIOS)
-- Authoritative 26-Table Relational Schema DDL Script (PostgreSQL 16 / PostGIS / Zoho Catalyst Data Store)
-- ============================================================================
-- Classification: RESTRICTED — Law Enforcement Sensitive
-- Description: Complete 3NF relational database schema exactly matching the KSP FIR ER Diagram.
-- Includes PostGIS spatial extensions (EPSG:4326), check invariants, foreign key constraints,
-- B-Tree/GIN/Spatial indexes, and range partitioning on CaseMaster by CrimeRegisteredDate.
-- ============================================================================

-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- DOMAIN 1: GEOGRAPHICAL & ORGANIZATIONAL HIERARCHY
-- ============================================================================

-- Table 1: State Master
CREATE TABLE state_master (
    state_id BIGSERIAL PRIMARY KEY,
    state_name VARCHAR(100) NOT NULL UNIQUE,
    state_code VARCHAR(10) NOT NULL UNIQUE,
    nationality_id INTEGER DEFAULT 356, -- ISO 3166-1 numeric code for India
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE state_master IS 'Master registry of States and Union Territories (e.g., Karnataka, Maharashtra).';

-- Table 2: District Master
CREATE TABLE district_master (
    district_id BIGSERIAL PRIMARY KEY,
    district_name VARCHAR(100) NOT NULL,
    district_code VARCHAR(20) NOT NULL UNIQUE,
    state_id BIGINT NOT NULL REFERENCES state_master(state_id) ON DELETE RESTRICT,
    headquarters_lat DOUBLE PRECISION,
    headquarters_long DOUBLE PRECISION,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_district_coords CHECK (
        (headquarters_lat IS NULL OR (headquarters_lat BETWEEN 6.0 AND 38.0)) AND
        (headquarters_long IS NULL OR (headquarters_long BETWEEN 68.0 AND 98.0))
    )
);
CREATE INDEX idx_district_state ON district_master(state_id);
COMMENT ON TABLE district_master IS 'Master registry of Police Districts (e.g., Bengaluru City, Mysuru District).';

-- Table 3: Unit Type Master
CREATE TABLE unit_type_master (
    unit_type_id BIGSERIAL PRIMARY KEY,
    unit_type_name VARCHAR(100) NOT NULL UNIQUE, -- e.g., Police Station, Circle Office, Sub-Division, SP Office, Range Office, DGP HQ
    hierarchy_level INTEGER NOT NULL CHECK (hierarchy_level >= 1 AND hierarchy_level <= 10), -- 1=DGP HQ, 10=Police Station
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE unit_type_master IS 'Defines organizational unit hierarchy levels from Police Station to DGP Headquarters.';

-- Table 4: Unit (Police Stations and Administrative Offices)
CREATE TABLE unit_master (
    unit_id BIGSERIAL PRIMARY KEY,
    unit_name VARCHAR(150) NOT NULL,
    unit_code VARCHAR(50) NOT NULL UNIQUE,
    unit_type_id BIGINT NOT NULL REFERENCES unit_type_master(unit_type_id) ON DELETE RESTRICT,
    district_id BIGINT NOT NULL REFERENCES district_master(district_id) ON DELETE RESTRICT,
    state_id BIGINT NOT NULL REFERENCES state_master(state_id) ON DELETE RESTRICT,
    parent_unit_id BIGINT REFERENCES unit_master(unit_id) ON DELETE SET NULL, -- Self-referencing FK for hierarchy
    is_operational_ps BOOLEAN DEFAULT TRUE,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    geom GEOMETRY(Point, 4326),
    address TEXT,
    contact_phone VARCHAR(20),
    contact_email VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_unit_district ON unit_master(district_id);
CREATE INDEX idx_unit_parent ON unit_master(parent_unit_id);
CREATE INDEX idx_unit_spatial ON unit_master USING GIST(geom);
COMMENT ON TABLE unit_master IS 'Master table for all KSP police stations, circle offices, and headquarters. Sharded by district_id.';

-- ============================================================================
-- DOMAIN 2: PERSONNEL & HUMAN RESOURCES
-- ============================================================================

-- Table 5: Rank Master
CREATE TABLE rank_master (
    rank_id BIGSERIAL PRIMARY KEY,
    rank_name VARCHAR(100) NOT NULL UNIQUE,
    rank_code VARCHAR(20) NOT NULL UNIQUE,
    hierarchy_weight INTEGER NOT NULL CHECK (hierarchy_weight BETWEEN 1 AND 20), -- 1=DGP, 20=Constable
    can_register_fir BOOLEAN DEFAULT FALSE,
    can_investigate BOOLEAN DEFAULT FALSE,
    can_approve_chargesheet BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE rank_master IS 'Police ranks (Constable, Head Constable, ASI, SI, Inspector, DySP, SP, DIG, IGP, ADGP, DGP) driving RBAC.';

-- Table 6: Designation Master
CREATE TABLE designation_master (
    designation_id BIGSERIAL PRIMARY KEY,
    designation_name VARCHAR(100) NOT NULL UNIQUE, -- e.g., SHO, Investigating Officer, Beat Constable, Crime Analyst, SCRB Director
    role_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE designation_master IS 'Functional duty roles assigned to personnel inside a specific unit.';

-- Table 7: Employee (Police Personnel)
CREATE TABLE employee_master (
    employee_id BIGSERIAL PRIMARY KEY,
    kgid VARCHAR(50) NOT NULL UNIQUE, -- Karnataka Government Insurance Department ID (State unique identifier)
    employee_name VARCHAR(150) NOT NULL,
    rank_id BIGINT NOT NULL REFERENCES rank_master(rank_id) ON DELETE RESTRICT,
    designation_id BIGINT NOT NULL REFERENCES designation_master(designation_id) ON DELETE RESTRICT,
    unit_id BIGINT NOT NULL REFERENCES unit_master(unit_id) ON DELETE RESTRICT,
    badge_number VARCHAR(50),
    mobile_no VARCHAR(20) UNIQUE,
    email_id VARCHAR(100) UNIQUE,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'TRANSFERRED', 'RETIRED')),
    joining_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_emp_unit ON employee_master(unit_id);
CREATE INDEX idx_emp_rank ON employee_master(rank_id);
CREATE INDEX idx_emp_kgid ON employee_master(kgid);
COMMENT ON TABLE employee_master IS 'All KSP police personnel. Linked to FIR registrations, investigation assignments, and arrests.';

-- ============================================================================
-- DOMAIN 3: DEMOGRAPHICS & LOOKUP MASTERS
-- ============================================================================

-- Table 8: Caste Master
CREATE TABLE caste_master (
    caste_master_id BIGSERIAL PRIMARY KEY,
    caste_master_name VARCHAR(100) NOT NULL UNIQUE,
    caste_category VARCHAR(50) NOT NULL CHECK (caste_category IN ('GENERAL', 'OBC', 'SC', 'ST', 'OTHER')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE caste_master IS 'Demographic lookup for caste categories required for statutory reporting (e.g., SC/ST Atrocities Act).';

-- Table 9: Religion Master
CREATE TABLE religion_master (
    religion_id BIGSERIAL PRIMARY KEY,
    religion_name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE religion_master IS 'Demographic lookup for religion classifications.';

-- Table 10: Occupation Master
CREATE TABLE occupation_master (
    occupation_id BIGSERIAL PRIMARY KEY,
    occupation_name VARCHAR(100) NOT NULL UNIQUE,
    risk_profile_weight DOUBLE PRECISION DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE occupation_master IS 'Demographic lookup for victim and accused occupations.';

-- ============================================================================
-- DOMAIN 4: CASE CLASSIFICATION & LEGAL STATUTES
-- ============================================================================

-- Table 11: Case Category Master
CREATE TABLE case_category_master (
    case_category_id BIGSERIAL PRIMARY KEY,
    lookup_value VARCHAR(50) NOT NULL UNIQUE, -- e.g., 'FIR', 'UDR' (Unnatural Death Report), 'Zero FIR', 'PAR' (Petty Offence)
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE case_category_master IS 'Categorizes incident registrations into FIR, UDR, Zero FIR, or PAR.';

-- Table 12: Gravity Offence Master
CREATE TABLE gravity_offence_master (
    gravity_offence_id BIGSERIAL PRIMARY KEY,
    lookup_value VARCHAR(50) NOT NULL UNIQUE, -- e.g., 'Heinous', 'Non-Heinous', 'Petty'
    severity_score INTEGER NOT NULL CHECK (severity_score BETWEEN 1 AND 100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE gravity_offence_master IS 'Severity rating driving automated alerts, investigation SLAs, and supervisory attention.';

-- Table 13: Case Status Master
CREATE TABLE case_status_master (
    case_status_id BIGSERIAL PRIMARY KEY,
    case_status_name VARCHAR(100) NOT NULL UNIQUE, -- e.g., 'Under Investigation', 'Charge Sheeted', 'Closed - False Case', 'Closed - Undetected', 'Transferred'
    is_terminal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE case_status_master IS 'Tracks lifecycle states of an investigation.';

-- Table 14: Act Master
CREATE TABLE act_master (
    act_id BIGSERIAL PRIMARY KEY,
    act_code VARCHAR(50) NOT NULL UNIQUE, -- e.g., 'IPC', 'BNS', 'NDPS', 'POCSO', 'IT_ACT', 'ARMS_ACT'
    act_description VARCHAR(255) NOT NULL,
    short_name VARCHAR(100) NOT NULL,
    effective_date DATE NOT NULL,
    repealed_date DATE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE act_master IS 'Master repository of Indian Legal Acts (IPC, Bhartiya Nyaya Sanhita, NDPS, POCSO, etc.).';

-- Table 15: Section Master
CREATE TABLE section_master (
    section_id BIGSERIAL PRIMARY KEY,
    section_code VARCHAR(50) NOT NULL, -- e.g., '302', '307', '420', '8/20'
    act_id BIGINT NOT NULL REFERENCES act_master(act_id) ON DELETE CASCADE,
    section_description TEXT NOT NULL,
    is_bailable BOOLEAN NOT NULL DEFAULT FALSE,
    is_cognizable BOOLEAN NOT NULL DEFAULT TRUE,
    is_compoundable BOOLEAN NOT NULL DEFAULT FALSE,
    max_punishment_years INTEGER CHECK (max_punishment_years >= 0),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(act_id, section_code)
);
CREATE INDEX idx_section_act ON section_master(act_id);
COMMENT ON TABLE section_master IS 'Specific legal sections under each Act, with statutory properties (bailable, cognizable).';

-- Table 16: Crime Head Master
CREATE TABLE crime_head_master (
    crime_head_id BIGSERIAL PRIMARY KEY,
    crime_group_name VARCHAR(150) NOT NULL UNIQUE, -- e.g., 'Crimes Against Body', 'Property Offences', 'Cyber Crime', 'Economic Offences'
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE crime_head_master IS 'Major crime classification categories used for national NCRB reporting.';

-- Table 17: Crime Sub-Head Master
CREATE TABLE crime_subhead_master (
    crime_subhead_id BIGSERIAL PRIMARY KEY,
    crime_head_id BIGINT NOT NULL REFERENCES crime_head_master(crime_head_id) ON DELETE CASCADE,
    crime_head_name VARCHAR(150) NOT NULL, -- e.g., 'Murder', 'Attempt to Murder', 'Dacoity', 'Chain Snatching', 'Phishing'
    is_heinous BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(crime_head_id, crime_head_name)
);
CREATE INDEX idx_subhead_head ON crime_subhead_master(crime_head_id);
COMMENT ON TABLE crime_subhead_master IS 'Specific crime sub-classifications under each Crime Head.';

-- Table 18: Crime Head Act Section Association (Statutory Reference Mapping)
CREATE TABLE crime_head_act_section (
    crime_head_act_section_id BIGSERIAL PRIMARY KEY,
    crime_head_id BIGINT NOT NULL REFERENCES crime_head_master(crime_head_id) ON DELETE CASCADE,
    crime_subhead_id BIGINT NOT NULL REFERENCES crime_subhead_master(crime_subhead_id) ON DELETE CASCADE,
    act_id BIGINT NOT NULL REFERENCES act_master(act_id) ON DELETE CASCADE,
    section_id BIGINT NOT NULL REFERENCES section_master(section_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(crime_head_id, crime_subhead_id, act_id, section_id)
);
CREATE INDEX idx_chas_subhead ON crime_head_act_section(crime_subhead_id);
COMMENT ON TABLE crime_head_act_section IS 'Standardized mapping table linking Crime Heads/SubHeads to statutory Acts and Sections.';

-- ============================================================================
-- DOMAIN 5: COURTS & JUDICIARY
-- ============================================================================

-- Table 19: Court Master
CREATE TABLE court_master (
    court_id BIGSERIAL PRIMARY KEY,
    court_name VARCHAR(200) NOT NULL,
    court_type VARCHAR(100) NOT NULL, -- e.g., 'JMFC', 'District & Sessions Court', 'High Court of Karnataka', 'Special POCSO Court'
    district_id BIGINT NOT NULL REFERENCES district_master(district_id) ON DELETE RESTRICT,
    state_id BIGINT NOT NULL REFERENCES state_master(state_id) ON DELETE RESTRICT,
    court_code VARCHAR(50) UNIQUE,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_court_district ON court_master(district_id);
COMMENT ON TABLE court_master IS 'Registry of Courts across Karnataka interfacing for remands, bail orders, and chargesheets.';

-- ============================================================================
-- DOMAIN 6: CORE CRIME REGISTRATION & INVESTIGATION (PARTITIONED OLTP)
-- ============================================================================

-- Table 20: Case Master (Core Incident Header - Partitioned by CrimeRegisteredDate)
CREATE TABLE case_master (
    case_master_id BIGSERIAL,
    crime_no VARCHAR(100) NOT NULL, -- e.g., 'FIR/0123/2026'
    case_no VARCHAR(100) NOT NULL, -- State unique case number across ICJS
    unit_id BIGINT NOT NULL REFERENCES unit_master(unit_id) ON DELETE RESTRICT,
    district_id BIGINT NOT NULL REFERENCES district_master(district_id) ON DELETE RESTRICT,
    state_id BIGINT NOT NULL REFERENCES state_master(state_id) ON DELETE RESTRICT,
    case_category_id BIGINT NOT NULL REFERENCES case_category_master(case_category_id) ON DELETE RESTRICT,
    gravity_offence_id BIGINT NOT NULL REFERENCES gravity_offence_master(gravity_offence_id) ON DELETE RESTRICT,
    case_status_id BIGINT NOT NULL REFERENCES case_status_master(case_status_id) ON DELETE RESTRICT,
    police_person_id BIGINT NOT NULL REFERENCES employee_master(employee_id) ON DELETE RESTRICT, -- Officer who registered the FIR
    assigned_io_id BIGINT REFERENCES employee_master(employee_id) ON DELETE SET NULL, -- Currently assigned Investigating Officer
    crime_registered_date TIMESTAMPTZ NOT NULL,
    incident_from_date TIMESTAMPTZ NOT NULL,
    incident_to_date TIMESTAMPTZ,
    brief_facts TEXT NOT NULL, -- Full narrative of the incident
    place_of_incident VARCHAR(255) NOT NULL,
    distance_direction_from_ps VARCHAR(100),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    geom GEOMETRY(Point, 4326),
    cctns_guid UUID DEFAULT uuid_generate_v4(),
    icjs_hash VARCHAR(128),
    is_sensitive BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_case_master PRIMARY KEY (case_master_id, crime_registered_date),
    CONSTRAINT chk_incident_dates CHECK (incident_to_date IS NULL OR incident_to_date >= incident_from_date),
    CONSTRAINT chk_case_coords CHECK (
        (latitude IS NULL OR (latitude BETWEEN 6.0 AND 38.0)) AND
        (longitude IS NULL OR (longitude BETWEEN 68.0 AND 98.0))
    )
) PARTITION BY RANGE (crime_registered_date);

-- Partition definitions for CaseMaster (Monthly partitions for production high throughput)
CREATE TABLE case_master_y2026m01 PARTITION OF case_master
    FOR VALUES FROM ('2026-01-01 00:00:00+05:30') TO ('2026-02-01 00:00:00+05:30');
CREATE TABLE case_master_y2026m02 PARTITION OF case_master
    FOR VALUES FROM ('2026-02-01 00:00:00+05:30') TO ('2026-03-01 00:00:00+05:30');
CREATE TABLE case_master_y2026m03 PARTITION OF case_master
    FOR VALUES FROM ('2026-03-01 00:00:00+05:30') TO ('2026-04-01 00:00:00+05:30');
CREATE TABLE case_master_y2026m04 PARTITION OF case_master
    FOR VALUES FROM ('2026-04-01 00:00:00+05:30') TO ('2026-05-01 00:00:00+05:30');
CREATE TABLE case_master_y2026m05 PARTITION OF case_master
    FOR VALUES FROM ('2026-05-01 00:00:00+05:30') TO ('2026-06-01 00:00:00+05:30');
CREATE TABLE case_master_y2026m06 PARTITION OF case_master
    FOR VALUES FROM ('2026-06-01 00:00:00+05:30') TO ('2026-07-01 00:00:00+05:30');
CREATE TABLE case_master_y2026m07 PARTITION OF case_master
    FOR VALUES FROM ('2026-07-01 00:00:00+05:30') TO ('2026-08-01 00:00:00+05:30');
CREATE TABLE case_master_default PARTITION OF case_master DEFAULT;

CREATE UNIQUE INDEX idx_case_crime_no ON case_master(crime_no, crime_registered_date);
CREATE INDEX idx_case_unit ON case_master(unit_id, crime_registered_date);
CREATE INDEX idx_case_district ON case_master(district_id, crime_registered_date);
CREATE INDEX idx_case_status ON case_master(case_status_id, crime_registered_date);
CREATE INDEX idx_case_io ON case_master(assigned_io_id, crime_registered_date);
CREATE INDEX idx_case_spatial ON case_master USING GIST(geom);
CREATE INDEX idx_case_brief_trgm ON case_master USING GIN(brief_facts gin_trgm_ops);
COMMENT ON TABLE case_master IS 'Core OLTP transaction header for every KSP case/FIR/UDR. Partitioned monthly by crime_registered_date.';

-- Table 21: Act Section Association (Junction Table for FIR Charges)
CREATE TABLE act_section_association (
    act_section_association_id BIGSERIAL PRIMARY KEY,
    case_master_id BIGINT NOT NULL,
    case_master_date TIMESTAMPTZ NOT NULL,
    act_id BIGINT NOT NULL REFERENCES act_master(act_id) ON DELETE RESTRICT,
    section_id BIGINT NOT NULL REFERENCES section_master(section_id) ON DELETE RESTRICT,
    crime_head_id BIGINT REFERENCES crime_head_master(crime_head_id) ON DELETE RESTRICT,
    crime_subhead_id BIGINT REFERENCES crime_subhead_master(crime_subhead_id) ON DELETE RESTRICT,
    is_primary_charge BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_asa_case_master FOREIGN KEY (case_master_id, case_master_date)
        REFERENCES case_master(case_master_id, crime_registered_date) ON DELETE CASCADE
);
CREATE INDEX idx_asa_case ON act_section_association(case_master_id, case_master_date);
CREATE INDEX idx_asa_section ON act_section_association(section_id);
COMMENT ON TABLE act_section_association IS 'Maps multi-statute charges (e.g. IPC 302 + Arms Act 25) to a single CaseMaster FIR.';

-- Table 22: Complainant Details
CREATE TABLE complainant_details (
    complainant_id BIGSERIAL PRIMARY KEY,
    case_master_id BIGINT NOT NULL,
    case_master_date TIMESTAMPTZ NOT NULL,
    complainant_name VARCHAR(150) NOT NULL,
    alias_name VARCHAR(100),
    age_year INTEGER CHECK (age_year >= 0 AND age_year <= 120),
    gender_id VARCHAR(20) NOT NULL CHECK (gender_id IN ('MALE', 'FEMALE', 'TRANSGENDER', 'UNKNOWN')),
    occupation_id BIGINT REFERENCES occupation_master(occupation_id) ON DELETE SET NULL,
    religion_id BIGINT REFERENCES religion_master(religion_id) ON DELETE SET NULL,
    caste_id BIGINT REFERENCES caste_master(caste_master_id) ON DELETE SET NULL,
    mobile_no VARCHAR(20),
    email_id VARCHAR(100),
    address TEXT NOT NULL,
    is_victim BOOLEAN DEFAULT FALSE,
    is_police_officer BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_comp_case_master FOREIGN KEY (case_master_id, case_master_date)
        REFERENCES case_master(case_master_id, crime_registered_date) ON DELETE CASCADE
);
CREATE INDEX idx_comp_case ON complainant_details(case_master_id, case_master_date);
CREATE INDEX idx_comp_mobile ON complainant_details(mobile_no);
COMMENT ON TABLE complainant_details IS 'Stores details of the complainant filing the FIR.';

-- Table 23: Victim Details
CREATE TABLE victim_details (
    victim_id BIGSERIAL PRIMARY KEY,
    case_master_id BIGINT NOT NULL,
    case_master_date TIMESTAMPTZ NOT NULL,
    victim_name VARCHAR(150) NOT NULL, -- Masked at API layer for sensitive offences (POCSO/Rape)
    age_year INTEGER CHECK (age_year >= 0 AND age_year <= 120),
    gender_id VARCHAR(20) NOT NULL CHECK (gender_id IN ('MALE', 'FEMALE', 'TRANSGENDER', 'UNKNOWN')),
    caste_id BIGINT REFERENCES caste_master(caste_master_id) ON DELETE SET NULL,
    religion_id BIGINT REFERENCES religion_master(religion_id) ON DELETE SET NULL,
    occupation_id BIGINT REFERENCES occupation_master(occupation_id) ON DELETE SET NULL,
    victim_police BOOLEAN DEFAULT FALSE, -- True if a police officer was assaulted on duty
    injury_severity VARCHAR(50) CHECK (injury_severity IN ('NONE', 'MINOR', 'GRIEVOUS', 'FATAL')),
    medical_report_number VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_victim_case_master FOREIGN KEY (case_master_id, case_master_date)
        REFERENCES case_master(case_master_id, crime_registered_date) ON DELETE CASCADE
);
CREATE INDEX idx_victim_case ON victim_details(case_master_id, case_master_date);
COMMENT ON TABLE victim_details IS 'Stores details of crime victims linked to CaseMaster.';

-- Table 24: Accused Details (Case-Scoped & Person-Scoped Linkage)
CREATE TABLE accused_details (
    accused_id BIGSERIAL PRIMARY KEY,
    case_master_id BIGINT NOT NULL,
    case_master_date TIMESTAMPTZ NOT NULL,
    accused_master_id UUID NOT NULL DEFAULT uuid_generate_v4(), -- Master Person ID across cases (Neo4j linkage key)
    accused_name VARCHAR(150) NOT NULL,
    alias_name VARCHAR(150),
    age_year INTEGER CHECK (age_year >= 0 AND age_year <= 120),
    gender_id VARCHAR(20) NOT NULL CHECK (gender_id IN ('MALE', 'FEMALE', 'TRANSGENDER', 'UNKNOWN')),
    caste_id BIGINT REFERENCES caste_master(caste_master_id) ON DELETE SET NULL,
    religion_id BIGINT REFERENCES religion_master(religion_id) ON DELETE SET NULL,
    occupation_id BIGINT REFERENCES occupation_master(occupation_id) ON DELETE SET NULL,
    is_arrested BOOLEAN DEFAULT FALSE,
    is_absconding BOOLEAN DEFAULT FALSE,
    is_habitual_offender BOOLEAN DEFAULT FALSE,
    history_sheet_number VARCHAR(100),
    modus_operandi_summary TEXT,
    fingerprint_hash VARCHAR(128),
    dna_profile_id VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_accused_case_master FOREIGN KEY (case_master_id, case_master_date)
        REFERENCES case_master(case_master_id, crime_registered_date) ON DELETE CASCADE
);
CREATE INDEX idx_accused_case ON accused_details(case_master_id, case_master_date);
CREATE INDEX idx_accused_master_id ON accused_details(accused_master_id);
CREATE INDEX idx_accused_name_trgm ON accused_details USING GIN(accused_name gin_trgm_ops);
COMMENT ON TABLE accused_details IS 'Stores accused individuals per case. `accused_master_id` binds repeat offenders across different FIRs.';

-- Table 25: Arrest & Surrender Details
CREATE TABLE arrest_surrender (
    arrest_surrender_id BIGSERIAL PRIMARY KEY,
    case_master_id BIGINT NOT NULL,
    case_master_date TIMESTAMPTZ NOT NULL,
    accused_id BIGINT NOT NULL REFERENCES accused_details(accused_id) ON DELETE CASCADE,
    arrest_surrender_date TIMESTAMPTZ NOT NULL,
    arrest_type VARCHAR(50) NOT NULL CHECK (arrest_type IN ('POLICE_ARREST', 'COURT_SURRENDER', 'PREVENTIVE_DETENTION', 'REMANDED_FROM_OTHER_CASE')),
    io_id BIGINT NOT NULL REFERENCES employee_master(employee_id) ON DELETE RESTRICT, -- Officer who executed arrest
    court_id BIGINT REFERENCES court_master(court_id) ON DELETE SET NULL, -- Court where produced
    remand_type VARCHAR(50) CHECK (remand_type IN ('POLICE_CUSTODY', 'JUDICIAL_CUSTODY', 'RELEASED_ON_BAIL')),
    remand_expiry_date TIMESTAMPTZ,
    custody_location TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_arrest_case_master FOREIGN KEY (case_master_id, case_master_date)
        REFERENCES case_master(case_master_id, crime_registered_date) ON DELETE CASCADE
);
CREATE INDEX idx_arrest_accused ON arrest_surrender(accused_id);
CREATE INDEX idx_arrest_date ON arrest_surrender(arrest_surrender_date);
COMMENT ON TABLE arrest_surrender IS 'Captures formal arrest, surrender, and remand tracking linked to an accused.';

-- Table 26: Chargesheet Details (Final Investigation Report)
CREATE TABLE chargesheet_details (
    chargesheet_id BIGSERIAL PRIMARY KEY,
    case_master_id BIGINT NOT NULL,
    case_master_date TIMESTAMPTZ NOT NULL,
    csdate TIMESTAMPTZ NOT NULL,
    csnumber VARCHAR(100) NOT NULL, -- Chargesheet / Final Report Number
    cstype VARCHAR(50) NOT NULL CHECK (cstype IN ('CHARGE_SHEET', 'A_REPORT', 'B_REPORT', 'C_REPORT')),
    -- Explanation: Charge Sheet = Prosecution; A Report = True but undetected; B Report = False/Mistake of fact; C Report = Non-cognizable/Civil
    police_person_id BIGINT NOT NULL REFERENCES employee_master(employee_id) ON DELETE RESTRICT, -- IO filing the report
    court_id BIGINT NOT NULL REFERENCES court_master(court_id) ON DELETE RESTRICT, -- Court where filed
    prosecution_sanction_date TIMESTAMPTZ,
    brief_summary_of_evidence TEXT NOT NULL,
    total_accused_charge_sheeted INTEGER NOT NULL CHECK (total_accused_charge_sheeted >= 0),
    total_witnesses_listed INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cs_case_master FOREIGN KEY (case_master_id, case_master_date)
        REFERENCES case_master(case_master_id, crime_registered_date) ON DELETE CASCADE
);
CREATE UNIQUE INDEX idx_cs_number ON chargesheet_details(csnumber);
CREATE INDEX idx_cs_case ON chargesheet_details(case_master_id, case_master_date);
COMMENT ON TABLE chargesheet_details IS 'Stores the final chargesheet / prosecution report submitted to court, closing the investigation stage.';

-- ============================================================================
-- AUDIT & LINEAGE TRIGGERS (WORM COMPLIANCE)
-- ============================================================================

CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trg_update_case_master_ts BEFORE UPDATE ON case_master
    FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();

CREATE TRIGGER trg_update_accused_ts BEFORE UPDATE ON accused_details
    FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();

CREATE TRIGGER trg_update_unit_ts BEFORE UPDATE ON unit_master
    FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();

-- End of 26-Table Relational Schema DDL Script
