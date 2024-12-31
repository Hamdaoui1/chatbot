# Chatbot d'Assistance Technique

Ce projet consiste en un chatbot intelligent destiné à offrir une assistance technique aux utilisateurs novices et avancés souhaitant maîtriser de nouvelles technologies. Actuellement, l’objectif principal est de fournir un support spécifique pour l'utilisation d'Android Studio. Ce chatbot est conçu pour fonctionner dans le cadre d'un centre de support pour un incubateur de startups.

---

## Fonctionnalités Actuelles

1. **Génération de réponses** : 
   - Basé sur l'intégration de l'API OpenAI (LangChain + GPT).
   - Fournit des réponses précises et contextualisées.

2. **Gestion de session** :
   - Les conversations sont enregistrées dans MongoDB pour permettre la continuité des échanges.
   - Chaque session est identifiée par un `session_id` unique.

3. **API REST** :
   - Backend construit avec FastAPI.
   - Documentation des endpoints via Swagger (accessible à [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)).

4. **Stockage des données** :
   - Historique des conversations sauvegardé dans une base de données MongoDB.

---

## Technologies Utilisées

1. **FastAPI** : Framework Python pour construire l'API backend.
2. **LangChain** : Gestion avancée des prompts et intégration avec OpenAI (GPT).
3. **MongoDB** : Base de données NoSQL pour stocker l'historique des sessions.
4. **Swagger** : Documentation et test des endpoints de l'API.
5. **Conda** : Environnement d'exécution pour les variables d'environnement et les dépendances Python.

---

## Configuration

### Variables d'environnement
Le projet utilise directement les variables suivantes configurées dans un environnement Conda :

- **OPENAI_API_KEY** : Clé API pour interagir avec l'API OpenAI.
- **MONGODB_URI** : URI pour se connecter à la base de données MongoDB.
- **DATABASE_NAME** : Nom de la base de données (égal à `chatbot`).
- **COLLECTION_NAME** : Nom de la collection MongoDB (égal à `conversations`).

Exemple de configuration des variables dans Conda :
```bash
conda env config vars set OPENAI_API_KEY="votre_cle_openai"
conda env config vars set MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority"
conda env config vars set DATABASE_NAME="chatbot"
conda env config vars set COLLECTION_NAME="conversations"
conda activate votre_env
```

---

## Déploiement

### Prérequis
- Python 3.9 ou supérieur
- Conda installé
- Accès à une instance MongoDB et une clé API OpenAI

### Installation
1. Clonez le dépôt GitHub :
   ```bash
   git clone git@github.com:Hamdaoui1/chatbot.git
   cd chatbot
   ```

2. Créez un environnement Conda :
   ```bash
   conda create --name chatbot_env python=3.9
   conda activate chatbot_env
   ```

3. Installez les dépendances :
   ```bash
   pip install -r requirements.txt
   ```

4. Lancez le serveur FastAPI :
   ```bash
   uvicorn app.main:app --reload
   ```

---

## Fonctionnalités Futures

1. **Recommandation automatique de ressources** :
   - Suggestions de tutoriels, guides et vidéos liés à Android Studio.

2. **Amélioration de l'historique** :
   - Limitation des messages chargés dans le contexte pour optimiser les performances.

3. **Interface utilisateur** :
   - Développement d'un frontend avec React pour une expérience utilisateur intuitive.

4. **Multilinguisme** :
   - Support de plusieurs langues pour élargir la portée du chatbot.

5. **Intégration avec d'autres outils** :
   - Connexion à des systèmes de gestion de projet ou d’apprentissage pour les startups.

---

## Documentation
- **Swagger** : Accessible à [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).
- **Code Source** : [GitHub Repository](https://github.com/Hamdaoui1/chatbot)

---

## Auteur
Ce projet a été développé par [Hamdaoui1](https://github.com/Hamdaoui1) dans le cadre d'un support technique pour incubateurs de startups.
