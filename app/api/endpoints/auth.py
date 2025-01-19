# app/api/endpoints/auth.py
from pydantic import BaseModel  # Ajoutez cet import
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer ,OAuth2PasswordRequestForm
from models.user import UserCreate, UserResponse, User
from services.user_service import UserService
from datetime import timedelta, datetime
from jose import jwt, JWTError
from core.config import settings
import os
import bcrypt


router = APIRouter()
user_service = UserService()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
SECRET_KEY = settings.secret_key  # Utilisation de la clé secrète depuis config.py

class AdminLoginRequest(BaseModel):
    admin_key: str

def create_access_token(data: dict, expires_delta: timedelta):
    """
    Crée un token JWT contenant les données de l'utilisateur et une date d'expiration.
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return token

def verify_admin_token(token: str = Depends(oauth2_scheme)):
    """
    Vérifie si le token JWT est valide et si l'utilisateur est un administrateur.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        role: str = payload.get("role")
        if role != "admin":
            raise HTTPException(status_code=403, detail="Not authorized")
        return payload  # Retourne les données du token pour une utilisation ultérieure
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate):
    """
    Endpoint d'inscription d'un nouvel utilisateur.
    """
    # Vérifier si l'email est déjà enregistré
    existing_user = await user_service.get_user_by_email(user_data.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Définir le rôle par défaut comme "user"
    role = "user"

    # Si une clé admin est fournie, la valider
    if user_data.admin_key:
        if bcrypt.checkpw(user_data.admin_key.encode(), settings.admin_key_hash.encode()):
            role = "admin"
        else:
            raise HTTPException(status_code=403, detail="Invalid admin key")

    # Ajouter le rôle aux données de création d'utilisateur
    user_data_with_role = UserCreate(
        email=user_data.email,
        password=user_data.password,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        role=role
    )

    # Créer l'utilisateur
    user = await user_service.create_user(user_data_with_role)

    # Retourner la réponse
    return UserResponse(
        id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        role=user.role
    )

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Endpoint de connexion. Retourne un token JWT si les informations sont correctes.
    """
    # Récupérer l'utilisateur par son email (form_data.username correspond à l'email)
    user = await user_service.get_user_by_email(form_data.username)
    if not user or not user_service.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Générer un token JWT si les identifiants sont valides
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role},  # Inclure le rôle dans le token
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/admin/dashboard")
async def admin_dashboard(admin: dict = Depends(verify_admin_token)):
    """
    Endpoint protégé pour les administrateurs.
    """
    return {"message": "Bienvenue sur le tableau de bord administrateur !"}
@router.post("/admin/login")
async def admin_login(admin_key: str):
    print("Admin key received:", admin_key)  # Log pour la clé reçue
    print("Expected hashed key:", settings.admin_key_hash)  # Log pour le hash attendu

    if not bcrypt.checkpw(admin_key.encode(), settings.admin_key_hash.encode()):
        print("Admin key validation failed!")  # Log en cas d'échec
        raise HTTPException(status_code=401, detail="Invalid admin key")

    print("Admin key validation succeeded!")  # Log si la clé est valide
    access_token = create_access_token(
        data={"sub": "admin", "role": "admin"},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return {"access_token": access_token, "token_type": "bearer", "role": "admin"}

