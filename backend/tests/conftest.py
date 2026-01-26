import pytest
import pytest_asyncio
import os
import json
from fastapi.testclient import TestClient
from httpx import AsyncClient

# Import app and dependencies
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
from database import db_manager
from mock_db import MockDatabase


@pytest_asyncio.fixture(scope="function")
async def mock_db():
    """Fixture that provides a fresh MockDatabase for each test."""
    # Create a new mock database instance
    db = MockDatabase()
    # Use a test file path to avoid polluting actual data
    db.file_path = "mock_db_test.json"
    db.collections = {}  # Start fresh
    yield db
    # Cleanup: remove test db file
    if os.path.exists("mock_db_test.json"):
        os.remove("mock_db_test.json")


@pytest_asyncio.fixture(scope="function")
async def test_client(mock_db):
    """Fixture that provides a TestClient with mocked database."""
    # Override the database manager to use mock_db
    original_db = db_manager.db
    db_manager.db = mock_db
    
    # Create test client
    client = TestClient(app)
    
    yield client
    
    # Restore original database
    db_manager.db = original_db


@pytest.fixture(scope="function")
def test_repo_data():
    """Fixture providing sample repo data for tests."""
    return {
        "name": "Tesla Model 3",
        "vin": "5YJ3E1EA4LF1234567",
        "color": "#1a73e8",
        "current_mileage": 0,
        "current_head": None,
        "branch": "main"
    }


@pytest.fixture(scope="function")
def test_commit_data(test_repo_data):
    """Fixture providing sample commit data for tests."""
    return {
        "title": "Oil and filter change",
        "message": "Regular maintenance - 5000km service",
        "mileage": 5000,
        "type": "Maintenance",
        "cost": {
            "parts": 50.0,
            "labor": 100.0,
            "currency": "CNY"
        },
        "closes_issues": []
    }
