from langchain_community.vectorstores import FAISS
from sentence_transformers import SentenceTransformer
from langchain_community.docstore.in_memory import InMemoryDocstore
from faiss import IndexFlatL2
from pymongo import MongoClient
import uuid
import logging


# Configuration des logs
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class VectorSearchService:
    def __init__(self, mongo_uri: str, db_name: str, collection_name: str, embedding_model_name: str):
        """
        Initialise le service de recherche vectorielle avec FAISS et MongoDB.
        """
        try:
            # Initialisation MongoDB
            self.client = MongoClient(mongo_uri)
            self.db = self.client[db_name]
            self.collection = self.db[collection_name]

            # Initialisation du modèle d'embedding
            self.embeddings = SentenceTransformer(embedding_model_name)
            vector_dimension = self.embeddings.get_sentence_embedding_dimension()

            # Initialisation de FAISS
            index = IndexFlatL2(vector_dimension)  # Index basé sur la distance L2
            docstore = InMemoryDocstore({})
            self.index = FAISS(
                index=index,
                docstore=docstore,
                index_to_docstore_id={},
                embedding_function=self.embeddings.encode
            )

            # Charger les chunks existants
            self._load_chunks_into_index()

        except Exception as e:
            logger.error(f"Erreur lors de l'initialisation du service de recherche vectorielle : {e}")
            raise

    def _load_chunks_into_index(self):
        """
        Charge les chunks MongoDB dans l'index FAISS.
        """
        try:
            logger.info("Chargement des chunks depuis MongoDB...")
            chunks = self.collection.find()
            count = 0

            for chunk in chunks:
                vector = chunk.get("vector")
                if vector and len(vector) == self.index.index.d:
                    doc_id = str(uuid.uuid4())
                    self.index.add_texts(
                        [chunk["text"]],
                        embeddings=[vector],
                        metadatas=[{"vector": vector}],
                        ids=[doc_id]
                    )
                    count += 1
                else:
                    logger.warning(f"Chunk ignoré : vecteur invalide ou manquant (ID : {chunk.get('_id')})")

            logger.info(f"{count} chunks chargés dans l'index FAISS.")
        except Exception as e:
            logger.error(f"Erreur lors du chargement des chunks dans FAISS : {e}")
            raise

    def reload_index(self):
        """
        Recharge l'index FAISS avec tous les chunks de la base de données.
        """
        try:
            logger.info("Rechargement de l'index FAISS...")
            total_chunks = self.collection.count_documents({})
            logger.info(f"Nombre total de chunks dans MongoDB avant rechargement : {total_chunks}")

            self.index.index.reset()  # Réinitialiser l'index FAISS

            # Recharger les chunks depuis MongoDB
            chunks = self.collection.find()
            count = 0

            for chunk in chunks:
                vector = chunk.get("vector")
                if vector and len(vector) == self.index.index.d:
                    self.index.add_texts(
                        [chunk["text"]],
                        embeddings=[vector],
                        ids=[str(chunk["_id"])]
                    )
                    count += 1
                else:
                    logger.warning(f"Chunk ignoré : vecteur invalide ou manquant (ID : {chunk.get('_id')})")

            logger.info(f"Index FAISS rechargé avec succès. {count} chunks ajoutés à l'index.")
        except Exception as e:
            logger.error(f"Erreur lors du rechargement de l'index FAISS : {e}")
            raise


    def search_similar_chunks(self, query: str, k: int = 5):
        """
        Recherche des chunks similaires à une requête donnée.
        """
        try:
            logger.info(f"Recherche de chunks similaires pour : {query}")
            query_vector = self.embeddings.encode(query)

            # Recherche par similarité
            results = self.index.similarity_search_by_vector(query_vector, k=k)
            if results:
                logger.info(f"Chunks similaires trouvés : {[result.page_content for result in results]}")
            else:
                logger.info("Aucun chunk similaire trouvé.")
            return results

        except Exception as e:
            logger.error(f"Erreur lors de la recherche de chunks similaires : {e}")
            return []

