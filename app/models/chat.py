from pydantic import BaseModel
from typing import List, Optional

class ChatRequestTP1(BaseModel):
    message: str  # Message utilisateur

class ChatRequestTP2(BaseModel):
    message: str  # Message utilisateur
    session_id: str  # ID de la session (obligatoire pour TP2)

class ChatRequestWithContext(BaseModel):
    message: str
    context: Optional[List[dict]] = None

class ChatResponse(BaseModel):
    response: str
