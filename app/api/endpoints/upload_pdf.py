# Nouvelle route pour l'upload et traitement des PDF
from fastapi import APIRouter, HTTPException, Depends, File, UploadFile
from pymongo import MongoClient
from sentence_transformers import SentenceTransformer
import fitz  # PyMuPDF
import os
from models.user import User
from services.mongo_service import MongoService
from services.user_service import get_current_admin_user
from services.vector_search_service import VectorSearchService  # Importer VectorSearchService
router = APIRouter()
import asyncio

# Charger le modèle pour la vectorisation
model = SentenceTransformer('all-MiniLM-L6-v2')

# Définir le répertoire pour les uploads
UPLOAD_DIRECTORY = "uploads"
if not os.path.exists(UPLOAD_DIRECTORY):
    os.makedirs(UPLOAD_DIRECTORY)

# MongoService pour l'interaction avec MongoDB
mongo_service = MongoService()

# Initialiser le service de recherche vectorielle
vector_search_service = VectorSearchService(
    mongo_uri=os.getenv("MONGODB_URI"),
    db_name=os.getenv("DATABASE_NAME"),
    collection_name="pdf_chunks",
    embedding_model_name="all-MiniLM-L6-v2"
)

@router.post("/upload-pdf")
async def upload_pdf(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Endpoint pour uploader un fichier PDF, l'extraire en chunks, vectoriser les textes
    et stocker les chunks avec leurs vecteurs dans MongoDB.
    """
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Seuls les fichiers PDF sont autorisés.")

    # Sauvegarder le fichier localement
    file_location = os.path.join(UPLOAD_DIRECTORY, file.filename)
    try:
        with open(file_location, "wb") as f:
            f.write(await file.read())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors du téléchargement : {e}")

    # Extraction des chunks du PDF
    try:
        doc = fitz.open(file_location)
        chunks = []
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            text = page.get_text("text")
            if text.strip():
                chunks.append({"page_number": page_num + 1, "text": text.strip()})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'extraction des chunks : {e}")

    # Vectorisation des chunks
    try:
        texts = [chunk["text"] for chunk in chunks]
        vectors = model.encode(texts)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la vectorisation : {e}")

    # Stockage dans MongoDB
    try:
        insertion_tasks = [
            mongo_service.db["pdf_chunks"].insert_one({
                "file_name": file.filename,
                "page_number": chunk["page_number"],
                "text": chunk["text"],
                "vector": vector.tolist()
            })
            for chunk, vector in zip(chunks, vectors)
        ]
        await asyncio.gather(*insertion_tasks)  # Attendre la fin de toutes les insertions
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors du stockage dans MongoDB : {e}")

    # Recharger l'index FAISS
    try:
        vector_search_service.reload_index()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors du rechargement de l'index FAISS : {e}")
