# app/api/endpoints/chat.py
"""
Routes FastAPI pour le chatbot
Inclut les endpoints du TP1 et du TP2, avec authentification
"""
from fastapi import APIRouter, HTTPException, Depends
from models.chat import ChatRequestTP1, ChatRequestTP2, ChatRequestWithContext, ChatResponse
from services.EnhancedLLMService import EnhancedLLMService
from typing import Dict, List
import uuid
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
import os
import logging
from fastapi import APIRouter, HTTPException, Depends, Body
from datetime import datetime
from core.config import settings

router = APIRouter()

llm_service = EnhancedLLMService(
    mongo_uri=settings.mongodb_uri,
    db_name=settings.database_name,
    collection_name="pdf_chunks",  # Assurez-vous que cela correspond à votre collection
    embedding_model_name="all-MiniLM-L6-v2"  # Modèle utilisé pour les embeddings
)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"

logging.basicConfig(level=logging.INFO)
def get_current_user(token: str = Depends(oauth2_scheme)):
    """
    Vérifie et décode le token JWT pour obtenir l'utilisateur connecté.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid authentication")
        return email
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication")
@router.post("/chat/simple", response_model=ChatResponse)
async def chat_simple(request: ChatRequestTP1, user: str = Depends(get_current_user)) -> ChatResponse:
    """Endpoint simple du TP1 avec authentification"""
    logging.info(f"Demande reçue pour chat_simple : {request.message}")
    try:
        session_id = str(uuid.uuid4())
        response = await llm_service.generate_response(request.message, session_id=session_id, user_email=user)
        return ChatResponse(response=response)
    except Exception as e:
        logging.error(f"Erreur dans chat_simple : {e}")
        raise HTTPException(status_code=500, detail=f"Erreur interne : {e}")
@router.post("/chat/with-context", response_model=ChatResponse)
async def chat_with_context(request: ChatRequestWithContext, user: str = Depends(get_current_user)) -> ChatResponse:
    """Endpoint avec contexte du TP1 et authentification"""
    logging.info(f"Demande reçue pour chat_with_context : message={request.message}, contexte={request.context}")
    try:
        response = await llm_service.generate_response(
            message=request.message,
            context=request.context,
            user_email=user
        )
        return ChatResponse(response=response)
    except Exception as e:
        logging.error(f"Erreur dans chat_with_context : {e}")
        raise HTTPException(status_code=500, detail=f"Erreur interne : {e}")
@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequestTP2, user: str = Depends(get_current_user)) -> ChatResponse:
    logging.info(f"Demande reçue pour chat : message={request.message}, session_id={request.session_id}")
    try:
        # Vérifiez si les champs nécessaires sont présents
        if not request.message or not request.session_id:
            logging.error("Message ou session_id manquant")
            raise HTTPException(status_code=400, detail="Message ou session_id manquant")

        # Appel au service LLM
        response = await llm_service.generate_response(request.message, request.session_id, user_email=user)
        logging.info(f"Réponse générée avec succès : {response}")
        return ChatResponse(response=response)
    except Exception as e:
        logging.error(f"Erreur dans chat : {e}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de la génération de la réponse : {e}")

@router.get("/sessions")
async def get_all_sessions(user: str = Depends(get_current_user)) -> List[str]:
    """Récupération de toutes les sessions disponibles de l'utilisateur."""
    logging.info(f"Requête reçue pour récupérer toutes les sessions de l'utilisateur : {user}")
    try:
        sessions = await llm_service.get_all_sessions(user)
        logging.info(f"Sessions trouvées : {sessions}")
        return sessions
    except Exception as e:
        logging.error(f"Erreur dans get_all_sessions : {e}")
        raise HTTPException(status_code=500, detail=f"Erreur interne : {e}")
@router.get("/history/{session_id}")
async def get_history(session_id: str, user: str = Depends(get_current_user)) -> List[Dict[str, str]]:
    print(f"Requête reçue pour l'historique : session_id={session_id}, user={user}")
    try:
        # Récupérer l'historique de la conversation
        history = await llm_service.get_conversation_history(session_id, user_email=user)
        print(f"Historique brut récupéré : {history}")

        # Formater les timestamps en chaînes
        formatted_history = [
            {
                "role": message["role"],
                "content": message["content"],
                "timestamp": format_datetime(message["timestamp"])  # Conversion ici
            }
            for message in history
        ]
        print(f"Historique formaté : {formatted_history}")
        return formatted_history

    except Exception as e:
        print(f"Erreur dans get_history : {e}")
        raise HTTPException(status_code=500, detail=f"Erreur interne : {e}")
@router.post("/create-session")
async def create_session(user: str = Depends(get_current_user)) -> str:
    """Crée une nouvelle session pour l'utilisateur."""
    logging.info(f"Endpoint /create-session appelé par l'utilisateur : {user}")
    try:
        new_session_id = str(uuid.uuid4())
        await llm_service.mongo_service.create_new_session(new_session_id, user)
        return new_session_id
    except Exception as e:
        logging.error(f"Erreur dans create_session : {e}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de la création de la session : {e}")
@router.delete("/delete-session/{session_id}")
async def delete_session(session_id: str, user: str = Depends(get_current_user)):
    """
    Supprime une session spécifique de l'utilisateur.
    """
    logging.info(f"Demande de suppression de la session {session_id} par l'utilisateur {user}")
    try:
        result = await llm_service.mongo_service.delete_conversation(session_id, user)
        if not result:
            raise HTTPException(status_code=404, detail="Session non trouvée")
        return {"message": "Session supprimée avec succès"}
    except Exception as e:
        logging.error(f"Erreur dans delete_session : {e}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de la suppression de la session : {e}")
@router.put("/rename-session/{session_id}")
async def rename_session(session_id: str, new_name: str = Body(..., embed=True), user: str = Depends(get_current_user)):
    """
    Renomme une session spécifique de l'utilisateur.
    """
    logging.info(f"Demande de renommage de la session {session_id} par l'utilisateur {user} en {new_name}")
    try:
        result = await llm_service.mongo_service.rename_conversation(session_id, new_name, user)
        if not result:
            raise HTTPException(status_code=404, detail="Session non trouvée")
        return {"message": "Session renommée avec succès"}
    except Exception as e:
        logging.error(f"Erreur dans rename_session : {e}")
        raise HTTPException(status_code=500, detail=f"Erreur lors du renommage de la session : {e}")
def format_datetime(dt: datetime) -> str:
    """
    Convertit un objet datetime en chaîne.
    """
    if dt:
        return dt.strftime('%Y-%m-%d %H:%M:%S')
    return None