from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from models.user import UserCreate, UserResponse, User
from services.user_service import UserService, get_current_user, get_current_admin_user
from datetime import timedelta, datetime
from jose import jwt, JWTError
from core.config import settings
import bcrypt
from typing import List
from typing import List, Dict  
from bson import ObjectId
import logging

router = APIRouter()

user_service = UserService()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
SECRET_KEY = settings.secret_key

# Configuration du logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Helper function to create a JWT token
def create_access_token(data: dict, expires_delta: timedelta):
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# Route to register a new user
@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate):
    existing_user = await user_service.get_user_by_email(user_data.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    role = "user"

    # If an admin key is provided, validate it
    if user_data.admin_key:
        if bcrypt.checkpw(user_data.admin_key.encode(), settings.admin_key_hash.encode()):
            role = "admin"
        else:
            raise HTTPException(status_code=403, detail="Invalid admin key")

    user_data_with_role = UserCreate(
        email=user_data.email,
        password=user_data.password,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        role=role
    )

    user = await user_service.create_user(user_data_with_role)
    return UserResponse(
        id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        role=user.role
    )

# User login endpoint
@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await user_service.get_user_by_email(form_data.username)
    
    # Vérifier si l'utilisateur existe et n'est pas bloqué
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    if user.is_blocked:
        raise HTTPException(status_code=403, detail="This account has been blocked")
        
    if not user_service.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token(
        data={"sub": user.email, "role": user.role},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer", "role": user.role}

# Admin login endpoint
@router.post("/admin/login")
async def admin_login(admin_key: str):
    if not bcrypt.checkpw(admin_key.encode(), settings.admin_key_hash.encode()):
        raise HTTPException(status_code=401, detail="Invalid admin key")

    # Create token with admin role and specific admin email
    access_token = create_access_token(
        data={
            "sub": "admin@admin.com",  # Use a specific admin email
            "role": "admin",
            "exp": datetime.utcnow() + timedelta(days=1)  # Longer expiration
        },
        expires_delta=timedelta(days=1)
    )
    
    # Also create admin user if it doesn't exist
    try:
        admin_user = await user_service.get_user_by_email("admin@admin.com")
        if not admin_user:
            await user_service.create_user(UserCreate(
                email="admin@admin.com",
                password=admin_key,
                first_name="Admin",
                last_name="User",
                role="admin"
            ))
    except Exception as e:
        print(f"Error creating admin user: {e}")

    return {"access_token": access_token, "token_type": "bearer", "role": "admin"}

# Admin dashboard endpoint
@router.get("/admin/dashboard")
async def admin_dashboard(current_admin: dict = Depends(get_current_admin_user)):
    return {"message": "Bienvenue sur le tableau de bord administrateur !"}

# Endpoint to get all non-admin users
@router.get("/admin/users", response_model=List[UserResponse])
async def get_all_users(current_user: User = Depends(get_current_admin_user)):
    try:
        await user_service.users.create_index("role")
        
        pipeline = [
            {"$match": {"role": {"$ne": "admin"}}},
            {"$project": {
                "email": 1,
                "first_name": 1,
                "last_name": 1,
                "role": 1,
                "is_blocked": 1  # Ajouter ce champ
            }}
        ]
        
        users = await user_service.users.aggregate(pipeline).to_list(length=100)
        
        return [
            UserResponse(
                id=str(user["_id"]),
                email=user["email"],
                first_name=user.get("first_name", ""),
                last_name=user.get("last_name", ""),
                role=user.get("role", "user"),
                is_blocked=user.get("is_blocked", False)  # Ajouter ce champ
            ) 
            for user in users
        ]
    except Exception as e:
        print(f"Error in get_all_users: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Helper function to validate admin token
async def get_current_admin_user(current_user: User = Depends(get_current_user)):
    print(f"Utilisateur validé : {current_user.email}, rôle : {current_user.role}")  # Log utilisateur
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have enough permissions",
        )
    return current_user

def verify_admin_token(token: str = Depends(oauth2_scheme)):
    try:
        print(f"Token reçu : {token}")  # Log du token reçu
        payload = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
        print(f"Payload décodé : {payload}")  # Log du contenu décodé
        role: str = payload.get("role")
        if role != "admin":
            raise HTTPException(status_code=403, detail="Not authorized")
        return payload
    except JWTError as e:
        print(f"Erreur JWT : {e}")  # Log en cas d'erreur
        raise HTTPException(status_code=401, detail="Invalid or expired token")

@router.delete("/admin/users/{user_id}")
async def delete_user(user_id: str, current_user: User = Depends(get_current_admin_user)):
    try:
        # Validate ObjectId format
        if not ObjectId.is_valid(user_id):
            raise HTTPException(status_code=400, detail="Invalid user ID format")

        # Create ObjectId from string
        user_object_id = ObjectId(user_id)

        # Check if user exists
        user = await user_service.users.find_one({"_id": user_object_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Prevent admin deletion
        if user.get("role") == "admin":
            raise HTTPException(status_code=403, detail="Cannot delete admin users")
        
        # Delete user
        result = await user_service.users.delete_one({"_id": user_object_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
            
        return {"message": "User successfully deleted"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid user ID: {str(e)}")
    except Exception as e:
        print(f"Error deleting user: {str(e)}")  # Add logging
        raise HTTPException(status_code=500, detail=f"Error deleting user: {str(e)}")

@router.put("/admin/users/{user_id}/toggle-block")
async def toggle_user_block(
    user_id: str, 
    current_user: User = Depends(get_current_admin_user)
):
    try:
        # Validate ObjectId format
        if not ObjectId.is_valid(user_id):
            raise HTTPException(status_code=400, detail="Invalid user ID format")

        user_object_id = ObjectId(user_id)

        # Check if user exists
        user = await user_service.users.find_one({"_id": user_object_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Prevent blocking admin users
        if user.get("role") == "admin":
            raise HTTPException(status_code=403, detail="Cannot block admin users")
        
        # Toggle the blocked status
        new_status = not user.get("is_blocked", False)
        result = await user_service.users.update_one(
            {"_id": user_object_id},
            {"$set": {"is_blocked": new_status}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
            
        return {
            "message": f"User {'blocked' if new_status else 'unblocked'} successfully",
            "is_blocked": new_status
        }
    except Exception as e:
        print(f"Error toggling user block status: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Error updating user block status: {str(e)}"
        )

@router.get("/user/status")
async def check_user_status(current_user: User = Depends(get_current_user)):
    """Vérifie si l'utilisateur est bloqué"""
    user = await user_service.get_user_by_email(current_user.email)
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.is_blocked:
        raise HTTPException(
            status_code=403, 
            detail="This account has been blocked"
        )
        
    return {"status": "active"}

class UserStatsResponse(BaseModel):
    date: str
    count: int

@router.get("/admin/user-stats", response_model=List[UserStatsResponse])
async def get_user_stats(days: int = 30, current_user: User = Depends(get_current_admin_user)):
    try:
        # Log des paramètres reçus
        logger.info(f"Requête pour les statistiques avec days={days}, utilisateur : {current_user.email}")

        stats = await user_service.get_user_stats(days)
        
        # Log des résultats
        logger.info(f"Statistiques renvoyées : {stats}")
        
        return stats
    except Exception as e:
        # Log des erreurs
        logger.error(f"Erreur dans /admin/user-stats : {e}")
        raise HTTPException(status_code=500, detail=f"Erreur : {str(e)}")
@router.get("/admin/sessions-per-user")
async def get_sessions_per_user(current_user: User = Depends(get_current_admin_user)):
    try:
        stats = await user_service.get_sessions_per_user()
        return stats
    except Exception as e:
        logger.error(f"Erreur dans /admin/sessions-per-user : {e}")
        raise HTTPException(status_code=500, detail=str(e))

