import asyncio
from services.mongo_service import MongoService

async def setup_admin():
    """
    Script pour configurer et enregistrer la clé administrateur dans la base de données.
    """
    # Initialisez le service MongoDB
    mongo_service = MongoService()

    # La clé administrateur à enregistrer
    admin_key = "nQ0yzhPzH8a7lirrMMx1ZQttesv_9-3vnci6AVhr2tQ"

    # Appeler la méthode save_admin_key
    success = await mongo_service.save_admin_key(admin_key)
    if success:
        print("Clé administrateur enregistrée avec succès.")
    else:
        print("Un administrateur existe déjà ou une erreur s'est produite.")

# Exécuter le script
if __name__ == "__main__":
    asyncio.run(setup_admin())
