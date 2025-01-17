# app/api/router.py
from fastapi import APIRouter
from api.endpoints import chat, auth

router = APIRouter()

# Inclusion des routes d'authentification
router.include_router(auth.router, prefix="/auth", tags=["auth"])

# Inclusion des routes du chatbot
router.include_router(chat.router, prefix="/chat", tags=["chat"])
