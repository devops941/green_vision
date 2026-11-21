from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "GreenVision" in data["app"]
    assert "Madurai" in data["scope"]


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "operational"
    assert "Madurai District" in data["target_scope"]
    assert "data_directories" in data


def test_madurai_overview_endpoint():
    response = client.get("/api/madurai/overview")
    assert response.status_code == 200
    data = response.json()
    assert data["district"] == "Madurai"
    assert data["state"] == "Tamil Nadu"
    assert len(data["taluks"]) >= 7
