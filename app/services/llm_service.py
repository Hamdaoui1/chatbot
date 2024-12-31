from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables.history import RunnableWithMessageHistory
from services.mongo_service import MongoService  # Importation du service MongoDB
import os
from typing import List, Dict, Optional
import uuid  # Pour générer un session_id par défaut

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

    async def generate_response(self, message: str, session_id: Optional[str] = None) -> str:
        """
        Génère une réponse et gère l'historique via MongoDB.
        """
        if not session_id:
            session_id = str(uuid.uuid4())  # Générer un session_id unique si non fourni
        
        try:
            # Récupération de l'historique depuis MongoDB
            history = await self.mongo_service.get_conversation_history(session_id)

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

    async def get_conversation_history(self, session_id: str) -> List[Dict[str, str]]:
        """
        Récupère l'historique d'une conversation spécifique.
        """
        if not session_id:
            raise ValueError("Le session_id est requis pour récupérer l'historique.")
        
        try:
            return await self.mongo_service.get_conversation_history(session_id)
        except Exception as e:
            raise RuntimeError(f"Erreur lors de la récupération de l'historique : {e}")
