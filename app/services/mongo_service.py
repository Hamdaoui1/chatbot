from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
from typing import List, Dict, Optional
from models.conversation import Conversation, Message
from models.response_models import ConversationResponse, MessageResponse
from core.config import settings
from bcrypt import hashpw, gensalt, checkpw
import logging



class MongoService:

    def __init__(self):
        # Initialisation du client MongoDB et des collections
        self.client = AsyncIOMotorClient(settings.mongodb_uri)
        self.db = self.client[settings.database_name]
        self.conversations = self.db[settings.collection_name]
        self.admins = self.db["admins"]  # Nouvelle collection pour les administrateurs

    async def save_admin_key(self, admin_key: str) -> bool:
        """
        Enregistre la clé administrateur en tant que hash sécurisé dans MongoDB.
        Si un administrateur existe déjà, la fonction ne fait rien.
        """
        existing_admin = await self.admins.find_one({"username": "admin"})
        if existing_admin:
            print("Un administrateur existe déjà.")
            return False

        # Hacher la clé administrateur
        hashed_key = hashpw(admin_key.encode('utf-8'), gensalt())

        # Insérer l'administrateur dans la base de données
        admin_document = {
            "username": "admin",
            "key_hash": hashed_key.decode('utf-8'),  # Stocker le hash de la clé
            "role": "admin",
            "created_at": datetime.utcnow()
        }
        result = await self.admins.insert_one(admin_document)
        return result.inserted_id is not None

    async def verify_admin_key(self, admin_key: str) -> bool:
        """
        Vérifie si une clé administrateur est valide en comparant le hash.
        """
        admin = await self.admins.find_one({"username": "admin"})
        if admin:
            stored_hash = admin["key_hash"].encode('utf-8')
            return checkpw(admin_key.encode('utf-8'), stored_hash)
        return False

    async def save_message(self, session_id: str, role: str, content: str) -> bool:
        """
        Sauvegarde un nouveau message dans une conversation existante ou crée une nouvelle conversation si elle n'existe pas.
        """
        message = Message(role=role, content=content)

        result = await self.conversations.update_one(
            {"session_id": session_id},
            {
                "$push": {"messages": message.model_dump()},
                "$set": {"updated_at": datetime.utcnow()},
                "$setOnInsert": {"created_at": datetime.utcnow()}
            },
            upsert=True
        )

        return result.modified_count > 0 or result.upserted_id is not None

    async def get_conversation_history(self, session_id: str, user_email: str) -> List[Dict]:
        conversation = await self.conversations.find_one({"session_id": session_id, "user_email": user_email})
        if conversation:
            # Convertir les timestamps en chaînes
            for message in conversation.get("messages", []):
                message["timestamp"] = self.format_datetime(message.get("timestamp"))
            conversation["created_at"] = self.format_datetime(conversation.get("created_at"))
            conversation["updated_at"] = self.format_datetime(conversation.get("updated_at"))
            return conversation.get("messages", [])
        return []

    async def delete_conversation(self, session_id: str, user_email: str) -> bool:
        """
        Supprime une conversation appartenant à un utilisateur.
        """
        result = await self.conversations.delete_one({"session_id": session_id, "user_email": user_email})
        return result.deleted_count > 0

    async def get_all_sessions(self, user_email: str) -> List[str]:
        """
        Récupère tous les IDs de session d'un utilisateur.
        """
        cursor = self.conversations.find({"user_email": user_email}, {"session_id": 1})
        sessions = await cursor.to_list(length=None)
        return [session["session_id"] for session in sessions]

    async def get_session(self, session_id: str, user_email: str) -> Optional[Dict]:
        """
        Récupère une session spécifique si elle appartient à l'utilisateur.
        """
        return await self.conversations.find_one({"session_id": session_id, "user_email": user_email})

    async def create_new_session(self, session_id: str, user_email: str) -> bool:
        """
        Crée une nouvelle session pour l'utilisateur.
        """
        try:
            result = await self.conversations.insert_one({
                "session_id": session_id,
                "user_email": user_email,
                "messages": [],
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            })
            return result.inserted_id is not None
        except Exception as e:
            raise RuntimeError(f"Erreur lors de la création de la session : {e}")
    async def rename_session(self, session_id: str, new_name: str, user_email: str) -> bool:
        """
        Renomme une session en modifiant le champ session_id.
        """
        logging.info(f"Tentative de renommage de la session {session_id} pour {user_email} avec le nouveau nom {new_name}")

        result = await self.conversations.update_one(
            {"session_id": session_id, "user_email": user_email},  # Filtre sur session_id et email
            {"$set": {"session_id": new_name, "updated_at": datetime.utcnow()}}  # Met à jour session_id
        )

        logging.info(f"Résultat de la requête update_one : matched_count={result.matched_count}, modified_count={result.modified_count}")

        # Retourner si la mise à jour a modifié un document
        return result.modified_count > 0

    def format_datetime(self, dt: datetime) -> str:
        if dt:
            return dt.strftime('%Y-%m-%d %H:%M:%S')
        return None
