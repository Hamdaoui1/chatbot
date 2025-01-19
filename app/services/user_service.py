# app/services/user_service.py
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from models.user import User, UserCreate
from core.config import settings
from datetime import datetime
from typing import Optional

# Initialisation du contexte de hachage
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UserService:
    def __init__(self):
        self.client = AsyncIOMotorClient(settings.mongodb_uri)
        self.db = self.client[settings.database_name]
        self.users = self.db["users"]  # Collection "users" correcte

    def hash_password(self, password: str) -> str:
        """Hache le mot de passe en utilisant bcrypt."""
        return pwd_context.hash(password)

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Vérifie que le mot de passe correspond au hachage."""
        return pwd_context.verify(plain_password, hashed_password)

    async def create_user(self, user_data: UserCreate) -> User:
        """
        Crée un utilisateur avec un rôle spécifique.
        Si aucun rôle n'est fourni, il est défini comme `user` par défaut.
        """
        # Hacher le mot de passe
        hashed_password = self.hash_password(user_data.password)

        # Préparer les données utilisateur pour l'insertion
        user_dict = {
            "first_name": user_data.first_name,
            "last_name": user_data.last_name,
            "email": user_data.email,
            "hashed_password": hashed_password,
            "role": user_data.role if user_data.role else "user",
            "created_at": datetime.utcnow()
        }

        # Insérer l'utilisateur dans la base de données
        result = await self.users.insert_one(user_dict)

        # Récupérer l'ID inséré et retourner un objet User
        return User(id=str(result.inserted_id), **user_dict)



    async def get_user_by_email(self, email: str) -> Optional[User]:
        """Récupère un utilisateur par son email."""
        user = await self.users.find_one({"email": email})
        if user:
            return User(**user)
        return None
