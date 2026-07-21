def test_register_fir(client):
    payload = {
        "unit": "U-101",
        "act": "BNS 2023",
        "section": "Sec 305",
        "victim": "John Doe",
        "accused": "Jane Doe",
        "briefFacts": "Test facts for FIR registration",
        "latitude": 12.9716,
        "longitude": 77.5946
    }
    
    # We do not pass Bearer token because verify_jwt_token is mocked to succeed.
    # The rate limiter is also bypassed or applies to the test client naturally, 
    # but we should send the expected headers if necessary (or just let the test pass if X-API-Key isn't strictly enforced in the route code)
    # Looking at fir.py, the route doesn't strictly check X-API-Key, it relies on token=Depends(verify_jwt_token).
    
    response = client.post("/api/v2/fir/register", json=payload)
    
    assert response.status_code == 201
    
    data = response.json()
    assert data["status"] == "success"
    assert "FIR Registered Successfully" in data["message"]
    
    # Check if the nested data schema is correct
    nested_data = data["data"]
    assert "crimeNo" in nested_data
    # crimeNo is now UUID-based: FIR/2026/<8-char-hex> (not the old hardcoded unit string)
    assert nested_data["crimeNo"].startswith("FIR/2026/")
    assert "caseMasterId" in nested_data
    assert "oltpLatencyMs" in nested_data
    assert "neo4jProjection" in nested_data
    
    
def test_register_fir_invalid_payload(client):
    payload = {
        "unit": "U-101"
        # Missing required fields like 'act', 'accused', etc.
    }
    
    response = client.post("/api/v2/fir/register", json=payload)

    # FastAPI/Pydantic returns 422 with its native error format: {"detail": [...]}
    # NOT our StandardResponse {"status": "error"} wrapper
    assert response.status_code == 422
    data = response.json()
    assert "detail" in data  # Pydantic validation error format
