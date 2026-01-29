from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class Cost(BaseModel):
    parts: float = 0
    labor: float = 0
    currency: str = "CNY"

class Issue(BaseModel):
    id: Optional[str] = Field(alias="_id", default=None)
    repo_id: str
    user_openid: Optional[str] = None
    title: str
    description: Optional[str] = None
    status: str = "open"
    priority: str = "medium"
    labels: list[str] = Field(default_factory=list)
    
    due_date: Optional[float] = None
    due_mileage: Optional[int] = None
    
    created_at: float = Field(default_factory=lambda: datetime.now().timestamp() * 1000)
    closed_at: Optional[float] = None
    closed_by_commit_id: Optional[str] = None

class IssuePatch(BaseModel):
    """Patch model for safe partial updates of Issue"""
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    labels: Optional[list[str]] = None
    due_date: Optional[float] = Field(default=None, ge=0)
    due_mileage: Optional[int] = Field(default=None, ge=0)

class Commit(BaseModel):
    id: Optional[str] = Field(alias="_id", default=None)
    repo_id: str
    user_openid: Optional[str] = None
    images: list[str] = Field(default_factory=list)
    title: str
    message: Optional[str] = None
    mileage: Optional[int] = None
    type: str
    cost: Optional[Cost] = None
    closes_issues: list[str] = Field(default_factory=list)
    timestamp: float = Field(default_factory=lambda: datetime.now().timestamp() * 1000)

class CommitPatch(BaseModel):
    """Patch model for safe partial updates of Commit"""
    title: Optional[str] = None
    message: Optional[str] = None
    mileage: Optional[int] = Field(default=None, ge=0)
    type: Optional[str] = None
    cost: Optional[Cost] = None
    timestamp: Optional[float] = Field(default=None, ge=0)

class Repo(BaseModel):
    id: Optional[str] = Field(alias="_id", default=None)
    user_openid: Optional[str] = None
    name: str
    vin: Optional[str] = None
    image: Optional[str] = None
    color: str = "#2c3e50"
    current_mileage: int = 0
    initial_mileage: int = 0
    purchase_cost: Optional[float] = None
    current_head: Optional[str] = None
    branch: str = "main"
    register_date: Optional[float] = None
    purchase_date: Optional[float] = None
    compulsory_insurance_expiry: Optional[float] = None
    compulsory_start: Optional[float] = None
    commercial_insurance_expiry: Optional[float] = None
    commercial_start: Optional[float] = None
    inspection_expiry: Optional[float] = None
    inspection_start: Optional[float] = None
    created_at: float = Field(default_factory=lambda: datetime.now().timestamp() * 1000)
