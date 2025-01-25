from fastapi import APIRouter, Depends, HTTPException
from api.endpoints import chat, auth, upload_pdf  # Ajout de l'import
from services.user_service import UserService, get_current_admin_user
from models.user import UserResponse
from typing import List

router = APIRouter()

# Inclusion des routes d'authentification
router.include_router(auth.router, prefix="/auth", tags=["auth"])

# Inclusion des routes du chatbot
router.include_router(chat.router, prefix="/chat", tags=["chat"])

# Inclusion de la route d'upload PDF
router.include_router(upload_pdf.router, prefix="/admin", tags=["upload_pdf"])
