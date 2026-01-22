from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class Cost(BaseModel):
    parts: float = 0
    labor: float = 0
    currency: str = "CNY"

class Commit(BaseModel):
    id: Optional[str] = Field(alias="_id", default=None)
    repo_id: str
    title: str
    message: Optional[str] = None
    mileage: int
    type: str
    cost: Optional[Cost] = None
    timestamp: float = Field(default_factory=lambda: datetime.now().timestamp() * 1000)

class Repo(BaseModel):
    id: Optional[str] = Field(alias="_id", default=None)
    name: str
    vin: Optional[str] = None
    current_mileage: int = 0
    current_head: Optional[str] = None
    branch: str = "main"
    created_at: float = Field(default_factory=lambda: datetime.now().timestamp() * 1000)
