# app/services/user_service.py
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from models.user import User, UserCreate
from core.config import settings
from datetime import datetime
from typing import Optional
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from typing import List

# Initialisation du contexte de hachage
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Configuration de l'OAuth2
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


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


# Fonction pour récupérer l'utilisateur courant
async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    try:
        print(f"Token reçu dans get_current_user : {token}")  # Log du token brut
        payload = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
        print(f"Token décodé : {payload}")  # Log du contenu du token
        if 'exp' in payload:
            print(f"Expiration du token : {datetime.utcfromtimestamp(payload['exp'])}")
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        user_service = UserService()
        user = await user_service.get_user_by_email(email)
        if user is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        return user
    except JWTError as e:
        print(f"Erreur de JWT : {e}")  # Log de l'erreur
        raise HTTPException(status_code=401, detail="Invalid or expired token")


# Fonction pour vérifier si l'utilisateur est administrateur
async def get_current_admin_user(token: str = Depends(oauth2_scheme)) -> User:
    try:
        print(f"Token received in get_current_admin_user: {token}")  # Debug log
        payload = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
        email = payload.get("sub")
        role = payload.get("role")
        
        if not email or role != "admin":
            raise HTTPException(
                status_code=403,
                detail="Not authorized. Admin access required."
            )
            
        user_service = UserService()
        user = await user_service.get_user_by_email(email)
        
        if not user or user.role != "admin":
            raise HTTPException(
                status_code=403,
                detail="Not authorized. Admin access required."
            )
            
        return user
    except JWTError as e:
        print(f"JWT Error: {e}")  # Debug log
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication credentials"
        )

async def get_all_users(self) -> List[User]:
    users_cursor = self.users.find({"role": {"$ne": "admin"}})  # Exclure les admins
    users_list = await users_cursor.to_list(length=100)
    return [User(**user) for user in users_list]

async def check_user_blocked(self, email: str) -> bool:
    user = await self.get_user_by_email(email)
    return user and user.is_blocked