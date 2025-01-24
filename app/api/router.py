# app/api/router.py
from fastapi import APIRouter, Depends, HTTPException
from api.endpoints import chat, auth
from services.user_service import UserService, get_current_admin_user
from models.user import UserResponse
from typing import List

router = APIRouter()

# Inclusion des routes d'authentification
router.include_router(auth.router, prefix="/auth", tags=["auth"])

# Inclusion des routes du chatbot
router.include_router(chat.router, prefix="/chat", tags=["chat"])

