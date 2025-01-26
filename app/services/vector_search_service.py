from langchain_community.vectorstores import FAISS
from sentence_transformers import SentenceTransformer
from langchain_community.docstore.in_memory import InMemoryDocstore
from faiss import IndexFlatL2
from pymongo import MongoClient
import uuid
import logging

logger = logging.getLogger(__name__)

class VectorSearchService:
    def __init__(self, mongo_uri: str, db_name: str, collection_name: str, embedding_model_name: str):
        """
        Initialise le service de recherche vectorielle avec FAISS et MongoDB.
        """
        self.client = MongoClient(mongo_uri)
        self.db = self.client[db_name]
        self.collection = self.db[collection_name]

        # Initialiser SentenceTransformer
        self.embeddings = SentenceTransformer(embedding_model_name)

        # Initialiser l'index FAISS avec la dimension correcte pour le modèle
        vector_dimension = 384  # all-MiniLM-L6-v2 produit des vecteurs de dimension 384
        index = IndexFlatL2(vector_dimension)  # FAISS utilise un index basé sur L2
        docstore = InMemoryDocstore({})
        self.index = FAISS(
            index=index,
            docstore=docstore,
            index_to_docstore_id={},
            embedding_function=self.embeddings.encode
        )

        # Charger les chunks dans FAISS
        self._load_chunks_into_index()

    def _load_chunks_into_index(self):
        """
        Charge les chunks MongoDB dans l'index FAISS.
        """
        logger.info("Chargement des chunks depuis MongoDB...")
        chunks = self.collection.find()
        for chunk in chunks:
            vector = chunk.get("vector")
            if vector and len(vector) == 384:  # Vérifie la dimension des vecteurs
                doc_id = str(uuid.uuid4())
                self.index.add_texts(
                    [chunk["text"]],
                    embeddings=[vector],
                    metadatas=[{"vector": vector}],  # Ajout du vecteur dans les métadonnées
                    ids=[doc_id]
                )
            else:
                logger.error(f"Dimension incorrecte pour le vecteur : {len(vector) if vector else 'Aucun vecteur'}")
        logger.info("Chunks chargés dans l'index FAISS.")

    def search_similar_chunks(self, query: str, k: int = 5):
        """
        Recherche les chunks les plus proches de la requête utilisateur.
        """
        logger.info(f"Recherche de chunks similaires pour : {query}")
        query_vector = self.embeddings.encode(query)
        results = self.index.similarity_search_by_vector(query_vector, k=k)
        return results
