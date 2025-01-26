from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from services.mongo_service import MongoService
from services.vector_search_service import VectorSearchService  # Importer le service de recherche vectorielle
import os
from typing import List, Dict
from datetime import datetime
import logging

# Configuration du logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EnhancedLLMService:
    """
    Service LLM avancé avec intégration de la recherche vectorielle et persistance MongoDB.
    """
    def __init__(self, mongo_uri: str, db_name: str, collection_name: str, embedding_model_name: str):
        # Initialiser le service de recherche vectorielle
        self.vector_search_service = VectorSearchService(mongo_uri, db_name, collection_name, embedding_model_name)

        # Initialiser l'API OpenAI
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY n'est pas définie")

        self.llm = ChatOpenAI(
            temperature=0.7,
            model_name="gpt-3.5-turbo",
            api_key=api_key
        )

        # Initialiser le modèle de prompt
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", "Vous êtes un assistant utile et concis."),
            MessagesPlaceholder(variable_name="history"),
            ("human", "{question}")
        ])

        # Initialiser MongoDB
        self.mongo_service = MongoService()

    async def generate_response(self, user_query: str, session_id: str, user_email: str) -> str:
        """
        Génère une réponse en utilisant des chunks pertinents de la recherche vectorielle.
        """
        try:
            # Récupérer les chunks similaires
            logger.info(f"Génération de réponse pour la requête : {user_query}")
            similar_chunks = self.vector_search_service.search_similar_chunks(user_query)
            context = "\n".join([chunk.page_content for chunk in similar_chunks])  # Utilisation de page_content
            logger.info(f"Contexte utilisé : {context}")

            # Récupérer l'historique de la session
            session = await self.mongo_service.get_session(session_id, user_email)
            if not session:
                raise RuntimeError("Session non trouvée ou non autorisée")
            history = session.get("messages", [])

            # Préparer les messages pour LangChain
            messages = [SystemMessage(content="Vous êtes un assistant utile et concis.")]
            for msg in history:
                if msg["role"] == "user":
                    messages.append(HumanMessage(content=msg["content"]))
                elif msg["role"] == "assistant":
                    messages.append(AIMessage(content=msg["content"]))

            # Ajouter la nouvelle requête avec le contexte
            messages.append(HumanMessage(content=f"Contexte : {context}\nQuestion : {user_query}"))

            # Générer la réponse
            response = await self.llm.agenerate([messages])
            response_text = response.generations[0][0].text

            # Sauvegarder la réponse et la requête dans MongoDB
            await self.mongo_service.save_message(session_id, "user", user_query)
            await self.mongo_service.save_message(session_id, "assistant", response_text)

            logger.info(f"Réponse générée : {response_text}")
            return response_text
        except Exception as e:
            logger.error(f"Erreur lors de la génération de la réponse : {e}")
            raise RuntimeError(f"Erreur interne : {e}")

    async def get_conversation_history(self, session_id: str, user_email: str) -> List[Dict[str, str]]:
        """
        Récupère l'historique de la conversation spécifique.
        """
        try:
            session = await self.mongo_service.get_session(session_id, user_email)
            if not session:
                raise RuntimeError("Session non trouvée ou non autorisée")
            return session.get("messages", [])
        except Exception as e:
            raise RuntimeError(f"Erreur lors de la récupération de l'historique : {e}")

    async def get_all_sessions(self, user_email: str) -> List[str]:
        """
        Récupère toutes les sessions d'un utilisateur.
        """
        try:
            return await self.mongo_service.get_all_sessions(user_email)
        except Exception as e:
            raise RuntimeError(f"Erreur lors de la récupération des sessions : {e}")
