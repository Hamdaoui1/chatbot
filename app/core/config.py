import os

class Settings:
    mongodb_uri = os.getenv("MONGODB_URI", "default_value_if_not_set")
    database_name = os.getenv("DATABASE_NAME", "chatbot")
    collection_name = os.getenv("COLLECTION_NAME", "conversations")
    openai_api_key = os.getenv("OPENAI_API_KEY", "default_value_if_not_set")

settings = Settings()
