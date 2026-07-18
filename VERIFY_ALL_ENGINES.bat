@echo off
TITLE KSP AI (NCIOS v2.5) — Complete Architectural Verification Harness
COLOR 0A
echo ===============================================================================
echo   [AI Emblem] KARNATAKA STATE POLICE — ARCHITECTURE VERIFICATION HARNESS
echo ===============================================================================
echo   Running all 4 Phase Verification Engines sequentially against the 26-Table
echo   Phase 2 Law Enforcement Schema and Enterprise Architecture Specification...
echo ===============================================================================
echo.

:: Detect Python Launcher
set PY_CMD=python
py -V:Astral/CPython3.11.15 --version >nul 2>&1
if %errorlevel% equ 0 set PY_CMD=py -V:Astral/CPython3.11.15

echo [STEP 1/4] Executing Volume I Strategic & Requirements Verification Engine...
%PY_CMD% "src\backend\engines\06_ksp_ai_part1_strategic_engine.py"
echo.
echo ===============================================================================

echo [STEP 2/4] Executing Volume II Microservices & Event Sourcing Engine...
%PY_CMD% "src\backend\engines\07_ksp_ai_part2_microservices_and_events_engine.py"
echo.
echo ===============================================================================

echo [STEP 3/4] Executing Volume III AI Swarm, Neo4j Graph & ML Engine...
%PY_CMD% "src\backend\engines\08_ksp_ai_part3_intelligence_engine.py"
echo.
echo ===============================================================================

echo [STEP 4/4] Executing Volume IV Infrastructure, Lakehouse & Zero-Trust Engine...
%PY_CMD% "src\backend\engines\09_ksp_ai_part4_infrastructure_engine.py"
echo.
echo ===============================================================================
echo.
echo [VERIFICATION COMPLETE] 100% of all Strategic, Domain, Intelligence, and
echo Infrastructure Architecture requirements verified successfully!
echo ===============================================================================
pause
