# app/api/endpoints/auth.py
from fastapi import APIRouter, HTTPException, Depends
from models.user import UserCreate, UserResponse
from services.user_service import UserService
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta, datetime
from jose import jwt, JWTError
from core.config import settings
import os

router = APIRouter()
user_service = UserService()

# Clé secrète utilisée pour signer les tokens JWT
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Log pour vérifier la clé secrète
print(f"Clé secrète utilisée dans auth.py : {SECRET_KEY}")

def create_access_token(data: dict, expires_delta: timedelta):
    """
    Crée un token JWT contenant les données de l'utilisateur et une date d'expiration.
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    print(f"Token généré : {token}")  # Log pour vérifier le token généré
    return token

@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate):
    """
    Endpoint d'inscription d'un nouvel utilisateur avec nom et prénom.
    """
    existing_user = await user_service.get_user_by_email(user_data.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = await user_service.create_user(user_data)
    return UserResponse(
        id=str(user.id),
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name
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
        data={"sub": user.email},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    print(f"Token retourné à l'utilisateur : {access_token}")  # Log pour vérifier le token retourné
    return {"access_token": access_token, "token_type": "bearer"}
