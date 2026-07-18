// ============================================================================
// KSP AI: National Crime Intelligence & Operations System (NCIOS)
// Authoritative Neo4j Aura Graph Schema, Constraints, & Graph Data Science (GDS) Script
// ============================================================================
// Classification: RESTRICTED — Law Enforcement Sensitive
// Description: Defines Neo4j graph uniqueness constraints, B-Tree/Vector/Fulltext indexes,
// schema properties, relationship creation pipelines from Catalyst OLTP, and Graph Data Science (GDS)
// algorithm procedures for Louvain syndicate detection and PageRank kingpin analysis.
// ============================================================================

// ============================================================================
// PART 1: NODE UNIQUENESS CONSTRAINTS & PROPERTY DEFINITIONS
// ============================================================================

// 1. Person Node (Represents Accused, Victims, Witnesses, Complainants across all FIRs)
CREATE CONSTRAINT person_master_id_unique IF NOT EXISTS
FOR (p:Person) REQUIRE p.person_id IS UNIQUE;

CREATE CONSTRAINT person_kgid_unique IF NOT EXISTS
FOR (p:Person) REQUIRE p.kgid IS UNIQUE; -- Used when Person is also an Employee/Officer

// 2. Case Node (Represents CaseMaster FIRs/UDRs)
CREATE CONSTRAINT case_master_id_unique IF NOT EXISTS
FOR (c:Case) REQUIRE c.case_master_id IS UNIQUE;

CREATE CONSTRAINT case_crime_no_unique IF NOT EXISTS
FOR (c:Case) REQUIRE c.crime_no IS UNIQUE;

// 3. Location Node (Represents Police Stations, Districts, and Crime Scene Coordinates)
CREATE CONSTRAINT location_id_unique IF NOT EXISTS
FOR (l:Location) REQUIRE l.location_id IS UNIQUE;

// 4. Organization Node (Represents Gangs, Criminal Syndicates, Shell Companies, Naxal units)
CREATE CONSTRAINT org_id_unique IF NOT EXISTS
FOR (o:Organization) REQUIRE o.org_id IS UNIQUE;

CREATE CONSTRAINT org_name_unique IF NOT EXISTS
FOR (o:Organization) REQUIRE o.name IS UNIQUE;

// 5. Vehicle Node (Represents get-away vehicles, stolen cars, transport)
CREATE CONSTRAINT vehicle_reg_unique IF NOT EXISTS
FOR (v:Vehicle) REQUIRE v.registration_no IS UNIQUE;

// 6. Phone Node (Represents mobile numbers extracted from CDR / tower dumps)
CREATE CONSTRAINT phone_number_unique IF NOT EXISTS
FOR (ph:Phone) REQUIRE ph.phone_number IS UNIQUE;

// 7. Evidence Node (Represents physical weapons, CCTV footage, forensic DNA samples)
CREATE CONSTRAINT evidence_id_unique IF NOT EXISTS
FOR (e:Evidence) REQUIRE e.evidence_id IS UNIQUE;

// 8. Legal Node (Represents statutory Acts and Sections e.g., IPC 302, MCOCA)
CREATE CONSTRAINT legal_code_unique IF NOT EXISTS
FOR (leg:Legal) REQUIRE leg.statute_code IS UNIQUE;

// 9. Employee Node (Represents Investigating Officers, SHOs, Circle Inspectors)
CREATE CONSTRAINT employee_id_unique IF NOT EXISTS
FOR (emp:Employee) REQUIRE emp.employee_id IS UNIQUE;

// ============================================================================
// PART 2: HIGH-PERFORMANCE INDEXES & VECTOR EMBEDDINGS (RAG SEARCH)
// ============================================================================

// B-Tree lookup indexes for rapid property filtering
CREATE INDEX person_name_idx IF NOT EXISTS FOR (p:Person) ON (p.name);
CREATE INDEX person_alias_idx IF NOT EXISTS FOR (p:Person) ON (p.alias);
CREATE INDEX person_caste_idx IF NOT EXISTS FOR (p:Person) ON (p.caste);
CREATE INDEX case_date_idx IF NOT EXISTS FOR (c:Case) ON (c.incident_date);
CREATE INDEX case_district_idx IF NOT EXISTS FOR (c:Case) ON (c.district_id);
CREATE INDEX location_geo_idx IF NOT EXISTS FOR (l:Location) ON (l.district_name, l.unit_name);

// Full-Text Search Indexes for Lexical Resolution (Fuzzy Name & Brief Facts Matching)
CREATE FULLTEXT INDEX personLexicalSearch IF NOT EXISTS
FOR (p:Person) ON EACH [p.name, p.alias, p.history_sheet_no, p.modus_operandi];

CREATE FULLTEXT INDEX caseNarrativeSearch IF NOT EXISTS
FOR (c:Case) ON EACH [c.brief_facts, c.place_of_incident, c.modus_operandi];

// Vector Embeddings Indexes (768-dim Google Vertex AI text-embedding-004 vectors for Semantic RAG)
CREATE VECTOR INDEX caseEmbeddingIndex IF NOT EXISTS
FOR (c:Case) ON (c.embedding)
OPTIONS {
    indexConfig: {
        `vector.dimensions`: 768,
        `vector.similarity_function`: 'cosine'
    }
};

CREATE VECTOR INDEX personEmbeddingIndex IF NOT EXISTS
FOR (p:Person) ON (p.embedding)
OPTIONS {
    indexConfig: {
        `vector.dimensions`: 768,
        `vector.similarity_function`: 'cosine'
    }
};

// ============================================================================
// PART 3: RELATIONSHIP CREATION PIPELINES (ETL FROM CATALYST OLTP TO NEO4J)
// ============================================================================

// Pipeline 1: Link Accused to Case (ACCUSED_IN) & Check for Repeat Offender Status
// Expected Input: $accused_list containing {person_id, case_master_id, arrest_status, role}
UNWIND $accused_list AS row
MERGE (p:Person {person_id: row.person_id})
ON CREATE SET p.name = row.name, p.alias = row.alias, p.created_at = timestamp()
MERGE (c:Case {case_master_id: row.case_master_id})
MERGE (p)-[r:ACCUSED_IN]->(c)
SET r.is_arrested = row.is_arrested,
    r.accused_role = row.role,
    r.timestamp = timestamp()
WITH p
OPTIONAL MATCH (p)-[existing:ACCUSED_IN]->(:Case)
WITH p, count(existing) AS total_cases
WHERE total_cases >= 3
SET p:RepeatOffender, p.recidivism_risk_tier = 'HIGH';

// Pipeline 2: Infer Criminal Syndicates via Co-Accused Links (CO_ACCUSED_WITH)
// When two persons are accused in the same FIR, create a direct weighted edge between them
MATCH (p1:Person)-[:ACCUSED_IN]->(c:Case)<-[:ACCUSED_IN]-(p2:Person)
WHERE p1.person_id < p2.person_id // Prevent duplicate mirror edges
MERGE (p1)-[co:CO_ACCUSED_WITH]-(p2)
ON CREATE SET co.shared_cases = 1, co.first_seen = c.incident_date, co.last_seen = c.incident_date
ON MATCH SET co.shared_cases = co.shared_cases + 1,
             co.last_seen = CASE WHEN c.incident_date > co.last_seen THEN c.incident_date ELSE co.last_seen END;

// Pipeline 3: Link Case to Geographical Police Station Location (OCCURRED_AT & INVESTIGATED_BY)
UNWIND $case_locations AS row
MATCH (c:Case {case_master_id: row.case_master_id})
MERGE (l:Location {location_id: row.unit_id})
ON CREATE SET l.unit_name = row.unit_name, l.district_id = row.district_id, l.type = 'POLICE_STATION'
MERGE (c)-[:OCCURRED_AT {distance_from_ps: row.distance}]->(l)
WITH c, row
WHERE row.assigned_io_id IS NOT NULL
MERGE (io:Employee {employee_id: row.assigned_io_id})
ON CREATE SET io.name = row.io_name, io.kgid = row.kgid, io.rank = row.rank
MERGE (io)-[:INVESTIGATED_BY {assigned_date: row.assigned_date}]->(c);

// Pipeline 4: Link Accused to Phone Numbers & Getaway Vehicles (USES_PHONE, OWNS_VEHICLE)
UNWIND $telemetry_data AS row
MATCH (p:Person {person_id: row.person_id})
MERGE (ph:Phone {phone_number: row.phone_number})
ON CREATE SET ph.provider = row.provider, ph.activation_date = row.activation_date
MERGE (p)-[r:USES_PHONE]->(ph)
SET r.last_tower_location = row.tower_id, r.last_active_time = row.timestamp
WITH p, row
WHERE row.vehicle_reg IS NOT NULL
MERGE (v:Vehicle {registration_no: row.vehicle_reg})
ON CREATE SET v.model = row.vehicle_model, v.color = row.color, v.is_stolen = row.is_stolen
MERGE (p)-[:OWNS_VEHICLE {relationship_type: row.ownership_type}]->(v);

// ============================================================================
// PART 4: GRAPH DATA SCIENCE (GDS) ALGORITHM PROCEDURES
// ============================================================================

// 1. In-Memory Graph Projection for Criminal Network Analysis
// Projects Person nodes and CO_ACCUSED_WITH / KNOWN_ASSOCIATE edges into GDS RAM
CALL gds.graph.project(
    'criminal_network_projection',
    ['Person'],
    {
        CO_ACCUSED_WITH: {
            type: 'CO_ACCUSED_WITH',
            orientation: 'UNDIRECTED',
            properties: 'shared_cases'
        },
        KNOWN_ASSOCIATE: {
            type: 'KNOWN_ASSOCIATE',
            orientation: 'UNDIRECTED'
        }
    }
);

// 2. Louvain Community Detection (Uncovers Organized Gang Syndicates)
// Detects tightly knit clusters of criminals operating across district boundaries
CALL gds.louvain.stream('criminal_network_projection', {
    relationshipWeightProperty: 'shared_cases',
    includeIntermediateCommunities: false
})
YIELD nodeId, communityId
WITH gds.util.asNode(nodeId) AS person, communityId
MATCH (person)-[:ACCUSED_IN]->(c:Case)
WITH communityId, collect(DISTINCT person.name) AS syndicate_members, count(DISTINCT person) AS member_count, count(DISTINCT c) AS total_gang_crimes
WHERE member_count >= 4 // Only surface gangs with 4+ members
MERGE (gang:Organization {org_id: 'GANG_SYN_' + toString(communityId)})
SET gang.name = 'Auto-Detected Syndicate #' + toString(communityId),
    gang.member_count = member_count,
    gang.total_crimes = total_gang_crimes,
    gang.threat_tier = CASE WHEN total_gang_crimes > 15 THEN 'CRITICAL' ELSE 'HIGH' END
WITH gang, communityId
MATCH (p:Person)
WHERE id(p) IN [nodeId IN gds.util.nodeIds('criminal_network_projection') WHERE gds.util.nodeProperty('criminal_network_projection', nodeId, 'communityId') = communityId | nodeId]
MERGE (p)-[:MEMBER_OF {detected_by: 'Louvain_GDS_Algorithm', confidence: 0.94}]->(gang);

// 3. PageRank Kingpin Centrality Scoring
// Identifies central figureheads/kingpins within each syndicate based on network influence
CALL gds.pageRank.stream('criminal_network_projection', {
    relationshipWeightProperty: 'shared_cases',
    dampingFactor: 0.85,
    maxIterations: 50
})
YIELD nodeId, score
WITH gds.util.asNode(nodeId) AS person, score
ORDER BY score DESC
SET person.pagerank_centrality_score = score,
    person.is_suspected_kingpin = CASE WHEN score > 2.5 THEN true ELSE false END;

// 4. Multi-Hop Investigative Query: 3-Hop Syndicate Connection Discovery
// Used by LangGraph GraphAgent to answer: "How is Suspect A connected to Gang B?"
MATCH path = shortestPath(
    (source:Person {person_id: $source_person_id})-[:CO_ACCUSED_WITH|KNOWN_ASSOCIATE|USES_PHONE*1..4]-(target:Organization {org_id: $target_gang_id})
)
RETURN path, length(path) AS hop_count,
       [node IN nodes(path) | CASE WHEN coalesce(node.name, '') <> '' THEN node.name ELSE node.phone_number END] AS traversal_chain;

// End of Neo4j Graph Schema Script
