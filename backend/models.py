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
    title: str
    description: Optional[str] = None
    status: str = "open"          # "open", "closed"
    priority: str = "medium"      # "high", "medium", "low"
    labels: list[str] = []        # ["maintenance", "legal", "mod"]
    
    # Triggers (OR logic)
    due_date: Optional[float] = None     # Timestamp
    due_mileage: Optional[int] = None    # Target Km
    
    # Closing info
    created_at: float = Field(default_factory=lambda: datetime.now().timestamp() * 1000)
    closed_at: Optional[float] = None
    closed_by_commit_id: Optional[str] = None

class Commit(BaseModel):
    id: Optional[str] = Field(alias="_id", default=None)
    repo_id: str
    title: str
    message: Optional[str] = None
    mileage: Optional[int] = None
    type: str
    cost: Optional[Cost] = None
    closes_issues: list[str] = []  # List of Issue IDs
    timestamp: float = Field(default_factory=lambda: datetime.now().timestamp() * 1000)

class Repo(BaseModel):
    id: Optional[str] = Field(alias="_id", default=None)
    name: str
    vin: Optional[str] = None
    color: str = "#2c3e50" # Default color
    current_mileage: int = 0
    initial_mileage: int = 0  # Initial mileage at vehicle registration
    purchase_cost: Optional[float] = None  # Purchase cost of the vehicle
    current_head: Optional[str] = None
    branch: str = "main"
    register_date: Optional[float] = None     # Registration timestamp
    compulsory_insurance_expiry: Optional[float] = None  # Compulsory Insurance expiry
    compulsory_start: Optional[float] = None  # Compulsory Insurance start date
    commercial_insurance_expiry: Optional[float] = None  # Commercial Insurance expiry
    commercial_start: Optional[float] = None  # Commercial Insurance start date
    inspection_expiry: Optional[float] = None # Inspection expiry timestamp
    inspection_start: Optional[float] = None  # Inspection start date
    created_at: float = Field(default_factory=lambda: datetime.now().timestamp() * 1000)
