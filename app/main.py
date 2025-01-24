from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.router import router as api_router
from services.llm_service import LLMService
import uvicorn
from contextlib import asynccontextmanager

load_dotenv()

app = FastAPI(
    title="Agent conversationnel",
    description="API ",
    version="1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Spécifie explicitement l'origine du frontend
    allow_credentials=True,
    allow_methods=["*"],  # Autorise toutes les méthodes HTTP
    allow_headers=["*"],  # Autorise tous les en-têtes
)

# Instance du service LLM
llm_service = LLMService()

# Inclure les routes
app.include_router(api_router)

for route in app.routes:
    print(f"Route disponible : {route.path}")


# Gestionnaire de lifespan avec personnalisation d'OpenAPI
@asynccontextmanager
async def lifespan(app: FastAPI):
    openapi_schema = app.openapi()
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT"  # Note : 'bearerFormat' avec un 'F' majuscule
        }
    }
    openapi_schema["security"] = [{"BearerAuth": []}]
    app.openapi_schema = openapi_schema
    yield  # Lifespan continue normalement

app.router.lifespan_context = lifespan

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
