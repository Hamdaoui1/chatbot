# app/models/user.py
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class User(BaseModel):
    id: Optional[str] = None
    first_name: str
    last_name: str
    email: EmailStr
    hashed_password: str
    created_at: datetime = datetime.utcnow()
    role: str = "user"
    is_blocked: bool = False

class UserCreate(BaseModel):
    """
    Modèle pour la création d'un utilisateur.
    """
    first_name: str
    last_name: str
    email: EmailStr
    password: str
    admin_key: Optional[str] = None  # Champ optionnel pour la clé admin
    role: Optional[str] = None  # Nouveau champ pour le rôle (optionnel)

class UserResponse(BaseModel):
    """
    Modèle pour la réponse après la création ou la récupération d'un utilisateur.
    """
    id: str
    email: EmailStr
    first_name: str
    last_name: str
    role: str  # Retourner le rôle dans la réponse
    is_blocked: bool = False
