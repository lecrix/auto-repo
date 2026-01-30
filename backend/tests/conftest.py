import pytest
import pytest_asyncio
import os
import json
from fastapi.testclient import TestClient
from httpx import AsyncClient

import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
from database import db_manager
from mock_db import MockDatabase
from auth import create_access_token


@pytest_asyncio.fixture(scope="function")
async def mock_db():
    db = MockDatabase()
    db.file_path = "mock_db_test.json"
    db.collections = {}
    yield db
    if os.path.exists("mock_db_test.json"):
        os.remove("mock_db_test.json")


@pytest_asyncio.fixture(scope="function")
async def test_client(mock_db):
    original_db = db_manager.db
    db_manager.db = mock_db
    
    client = TestClient(app)
    
    yield client
    
    db_manager.db = original_db


@pytest.fixture(scope="function")
def test_openid():
    return "test_user_openid_12345"


@pytest.fixture(scope="function")
def auth_headers(test_openid):
    token = create_access_token(test_openid)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="function")
def test_repo_data(test_openid):
    return {
        "name": "Tesla Model 3",
        "vin": "5YJ3E1EA4LF1234567",
        "color": "#1a73e8",
        "current_mileage": 0,
        "current_head": None,
        "branch": "main",
        "user_openid": test_openid
    }


@pytest.fixture(scope="function")
def test_commit_data(test_repo_data):
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
