from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from services.mongo_service import MongoService  # Importation du service MongoDB
import os
from typing import List, Dict, Optional
import uuid  # Pour générer un session_id par défaut
from datetime import datetime

class LLMService:
    """
    Service LLM unifié avec persistance MongoDB pour les historiques de conversation.
    """
    def __init__(self):
        # Configuration de l'API OpenAI
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY n'est pas définie")
        
        self.llm = ChatOpenAI(
            temperature=0.7,
            model_name="gpt-3.5-turbo",
            api_key=api_key
        )
        
        # Initialisation de MongoDB
        self.mongo_service = MongoService()

        # Configuration du modèle de prompt
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", "Vous êtes un assistant utile et concis."),
            MessagesPlaceholder(variable_name="history"),
            ("human", "{question}")
        ])
        
        self.chain = self.prompt | self.llm

    async def create_session(self, user_email: str) -> str:
        """
        Crée une nouvelle session pour un utilisateur et la sauvegarde dans MongoDB.
        Retourne l'ID de la session créée.
        """
        session_id = str(uuid.uuid4())  # Générer un identifiant unique pour la session
        session_data = {
            "session_id": session_id,
            "user_email": user_email,
            "messages": [],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        await self.mongo_service.conversations.insert_one(session_data)
        return session_id

    async def generate_response(self, message: str, session_id: str, user_email: str) -> str:
        """
        Génère une réponse et gère l'historique via MongoDB.
        """
        try:
            # Vérifier si la session appartient à l'utilisateur
            session = await self.mongo_service.get_session(session_id, user_email)
            if not session:
                raise RuntimeError("Session non trouvée ou non autorisée")

            # Récupération de l'historique depuis MongoDB
            history = session.get("messages", [])

            # Conversion de l'historique en messages LangChain
            messages = [SystemMessage(content="Vous êtes un assistant utile et concis.")]
            for msg in history:
                if msg["role"] == "user":
                    messages.append(HumanMessage(content=msg["content"]))
                elif msg["role"] == "assistant":
                    messages.append(AIMessage(content=msg["content"]))

            # Ajout du nouveau message utilisateur
            messages.append(HumanMessage(content=message))

            # Génération de la réponse
            response = await self.llm.agenerate([messages])
            response_text = response.generations[0][0].text

            # Sauvegarde des messages dans MongoDB
            await self.mongo_service.save_message(session_id, "user", message)
            await self.mongo_service.save_message(session_id, "assistant", response_text)

            return response_text
        except Exception as e:
            raise RuntimeError(f"Erreur lors de la génération de la réponse : {e}")

    async def get_conversation_history(self, session_id: str, user_email: str) -> List[Dict[str, str]]:
        """
        Récupère l'historique d'une conversation spécifique.
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
        Récupère tous les IDs de session d'un utilisateur.
        """
        try:
            return await self.mongo_service.get_all_sessions(user_email)
        except Exception as e:
            raise RuntimeError(f"Erreur lors de la récupération des sessions : {e}")
