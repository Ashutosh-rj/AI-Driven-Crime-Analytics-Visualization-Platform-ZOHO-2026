def test_execute_swarm_query(client, monkeypatch):
    # Mock the swarm_graph.invoke call to avoid actual LLM/Agent execution during tests
    class MockSwarmGraph:
        def invoke(self, state):
            state["trace"] = [{"agent": "SQLAgent", "action": "SELECT count(*) FROM cases"}]
            return state
            
    # Apply monkeypatch to the specific module where swarm_graph is imported/used
    monkeypatch.setattr("api.routes.swarm.swarm_graph", MockSwarmGraph())

    payload = {
        "prompt": "Find repeat house break-in offenders",
        "rbacRole": "Chief_Intel_Officer"
    }
    
    response = client.post("/api/v2/swarm/query", json=payload)
    
    assert response.status_code == 200
    
    data = response.json()
    assert data["status"] == "success"
    
    swarm_data = data["data"]
    assert swarm_data["rbacRole"] == "Chief_Intel_Officer"
    assert "reasoningTrace" in swarm_data
    assert len(swarm_data["reasoningTrace"]) > 0
    assert swarm_data["reasoningTrace"][0]["agent"] == "SQLAgent"

def test_execute_swarm_query_unauthorized(client, monkeypatch):
    from main import app
    # Temporarily override with an unauthorized role
    def override_verify_jwt_token_unauthorized():
        return {
            "sub": "testuser", 
            "realm_access": {
                "roles": ["Beat_Constable"] # Unauthorized for swarm queries
            }
        }
    
    from core.security import verify_jwt_token
    app.dependency_overrides[verify_jwt_token] = override_verify_jwt_token_unauthorized

    payload = {
        "prompt": "Find repeat house break-in offenders",
        "rbacRole": "Beat_Constable"
    }
    
    response = client.post("/api/v2/swarm/query", json=payload)
    
    # Should be rejected by RBAC RoleChecker
    assert response.status_code == 403
    assert "RBAC Deny" in response.json()["detail"]
    
    # Restore the dependency override if needed for other tests
    app.dependency_overrides.pop(verify_jwt_token)
