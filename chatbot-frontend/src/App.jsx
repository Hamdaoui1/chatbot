import { useState, useEffect } from 'react';
import ChatWindow from './components/ChatWindow';
import MessageInput from './components/MessageInput';
import ConversationsList from './components/ConversationsList';
import Login from './components/Login';
import Register from './components/Register';
import { chatApi } from './services/api';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [messages, setMessages] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [editingSession, setEditingSession] = useState(null); // État pour la session en cours d'édition
  const [newSessionName, setNewSessionName] = useState(''); // État pour le nouveau nom de la session

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      loadSessions();
    }
  }, []);

  useEffect(() => {
    if (currentSession) {
      loadHistory();
    }
  }, [currentSession]);

  const loadSessions = async () => {
    try {
      const response = await chatApi.getAllSessions();
      setSessions(response);
      if (response.length > 0) {
        setCurrentSession(response[0]);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const loadHistory = async () => {
    try {
      const history = await chatApi.getHistory(currentSession);
      setMessages(history);
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const handleSendMessage = async (content) => {
    if (!currentSession) return;

    setIsLoading(true);
    try {
      const response = await chatApi.sendMessage(content, currentSession);
      setMessages((prev) => [
        ...prev,
        { role: 'user', content },
        { role: 'assistant', content: response.response },
      ]);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSession = async () => {
    try {
      const newSessionId = await chatApi.createSession();
      setSessions([...sessions, newSessionId]);
      setCurrentSession(newSessionId);
      setMessages([]);
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    try {
      await chatApi.deleteSession(sessionId);
      setSessions((prev) => prev.filter((session) => session !== sessionId));
      if (currentSession === sessionId) {
        setCurrentSession(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    loadSessions();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setMessages([]);
    setSessions([]);
    setCurrentSession(null);
  };
  const handleRenameSession = async (sessionId, newName) => {
    console.log(`Demande de renommage pour la session ${sessionId} en ${newName}`);
    setSessions((prevSessions) =>
      prevSessions.map((session) =>
        session === sessionId ? newName : session
      )
    );
    try {
      await chatApi.renameSession(sessionId, newName);
      console.log('Renommage réussi côté backend');
    } catch (err) {
      console.error('Erreur lors de la requête de renommage :', err);
    }
  };

  const handleRenameSubmit = async (session) => {
    if (newSessionName.trim() !== '') {
      console.log(`Renommage de la session ${session} en ${newSessionName.trim()}`);
      try {
        await onRenameSession(session, newSessionName.trim());
        console.log(`Session renommée avec succès : ${newSessionName.trim()}`);
        setEditingSession(null); // Quitter le mode édition une fois le renommage réussi
      } catch (error) {
        console.error('Erreur lors du renommage :', error);
      }
    }
  };



  if (!isAuthenticated) {
    return isRegistering ? (
      <Register onRegisterSuccess={() => setIsRegistering(false)} />
    ) : (
      <Login
        onLoginSuccess={handleLoginSuccess}
        onSwitchToRegister={() => setIsRegistering(true)}
      />
    );
  }

  return (
    <div className="app-container min-h-screen bg-gray-100">
      {/* Header */}
      <header className="app-header bg-gradient-to-r from-blue-500 to-blue-700 text-white px-6 py-4 shadow-lg flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-wide">Chat Application</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 active:bg-red-700 text-white px-5 py-2 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105"
        >
          Logout
        </button>
      </header>

      {/* Main content */}
      <div className="flex h-screen">
        {/* Conversations List */}
        <ConversationsList
          sessions={sessions}
          currentSession={currentSession}
          onSessionChange={setCurrentSession}
          onCreateSession={handleCreateSession}
          onDeleteSession={handleDeleteSession}
          onRenameSession={handleRenameSession}
        />
        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-white shadow-xl rounded-tl-lg">
          <ChatWindow messages={messages} />
          <MessageInput
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );

}

export default App;
