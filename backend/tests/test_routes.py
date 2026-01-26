import pytest
from bson import ObjectId


@pytest.mark.asyncio
async def test_root_endpoint(test_client):
    """Test GET / returns welcome message."""
    response = test_client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "AutoRepo Backend is Running"}


@pytest.mark.asyncio
async def test_get_repos_empty(test_client):
    """Test GET /api/repos returns empty list initially."""
    response = test_client.get("/api/repos")
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_create_repo(test_client, test_repo_data):
    """Test POST /api/repos creates new repo."""
    response = test_client.post("/api/repos", json=test_repo_data)
    assert response.status_code == 200
    
    data = response.json()
    assert data["name"] == test_repo_data["name"]
    assert data["vin"] == test_repo_data["vin"]
    assert data["color"] == test_repo_data["color"]
    assert data["current_mileage"] == test_repo_data["current_mileage"]
    assert "_id" in data


@pytest.mark.asyncio
async def test_get_repo_detail(test_client, test_repo_data):
    """Test GET /api/repos/{id} returns repo details."""
    create_response = test_client.post("/api/repos", json=test_repo_data)
    repo_id = create_response.json()["_id"]
    
    response = test_client.get(f"/api/repos/{repo_id}")
    assert response.status_code == 200
    
    data = response.json()
    assert data["_id"] == repo_id
    assert data["name"] == test_repo_data["name"]


@pytest.mark.asyncio
async def test_create_commit(test_client, test_repo_data, test_commit_data):
    """Test POST /api/commits creates commit and updates repo HEAD."""
    # Create repo first
    repo_response = test_client.post("/api/repos", json=test_repo_data)
    repo_id = repo_response.json()["_id"]
    
    # Create commit with repo_id
    commit_payload = {**test_commit_data, "repo_id": repo_id}
    response = test_client.post("/api/commits", json=commit_payload)
    
    assert response.status_code == 200
    data = response.json()
    assert data["repo_id"] == repo_id
    assert data["title"] == test_commit_data["title"]
    assert data["mileage"] == test_commit_data["mileage"]
    assert "_id" in data


@pytest.mark.asyncio
async def test_commit_updates_head(test_client, test_repo_data, test_commit_data):
    """Test that creating commit updates repo's current_mileage."""
    # Create repo
    repo_response = test_client.post("/api/repos", json=test_repo_data)
    repo_id = repo_response.json()["_id"]
    repo_before = repo_response.json()
    
    # Create commit
    commit_payload = {**test_commit_data, "repo_id": repo_id}
    test_client.post("/api/commits", json=commit_payload)
    
    # Check repo was updated
    repo_after_response = test_client.get(f"/api/repos/{repo_id}")
    repo_after = repo_after_response.json()
    
    assert repo_after["current_mileage"] == test_commit_data["mileage"]
    assert repo_after["current_head"] == test_commit_data["title"]
