# app/models/response_models.py

from typing import List
from pydantic import BaseModel
from datetime import datetime

class MessageResponse(BaseModel):
    role: str
    content: str
    timestamp: str  # Chaîne de caractères au lieu de datetime

class ConversationResponse(BaseModel):
    session_id: str
    messages: List[MessageResponse]
    created_at: str
    updated_at: str
