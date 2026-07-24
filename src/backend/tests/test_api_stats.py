def test_get_stats(client):
    response = client.get("/api/v2/stats")
    
    assert response.status_code == 200
    
    data = response.json()
    assert data["status"] == "success"
    
    metrics = data["data"]["metrics"]
    assert "activeFIRs" in metrics
    
    assert "recentEvents" in data["data"]
