from pymongo import MongoClient

# URI MongoDB
MONGODB_URI = "mongodb+srv://hamza:wXUIHdIY4vlS74e1@cluster0.587gs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

# Connexion à MongoDB
client = MongoClient(MONGODB_URI)
db = client["chatbot"]

# Accéder à la collection conversations
conversations = db["conversations"]

# Afficher toutes les conversations
print("Conversations disponibles :")
for conversation in conversations.find():
    print(conversation)
