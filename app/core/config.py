import os
import bcrypt

class Settings:
    mongodb_uri: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    database_name: str = os.getenv("DATABASE_NAME", "chatbot")
    collection_name: str = os.getenv("COLLECTION_NAME", "conversations")
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "default_value_if_not_set")
    secret_key: str = os.getenv("SECRET_KEY", "default_secret_key")  # Ajout correct de la clé secrète
    admin_key_hash: str = bcrypt.hashpw(
        os.getenv("ADMIN_KEY", "default_admin_key").encode(), 
        bcrypt.gensalt()
    ).decode()  # Utilisation correcte pour générer un hash de la clé admin

settings = Settings()
