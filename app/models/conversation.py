from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime

class Message(BaseModel):
    role: str
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        # Automatically serialize datetime to ISO 8601 string
        json_encoders = {datetime: lambda v: v.isoformat()}

class Conversation(BaseModel):
    session_id: str
    messages: List[Message] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        # Automatically serialize datetime to ISO 8601 string
        json_encoders = {datetime: lambda v: v.isoformat()}
