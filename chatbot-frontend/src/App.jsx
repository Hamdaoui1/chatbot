import { useState, useEffect } from 'react';
import ChatWindow from './components/ChatWindow';
import MessageInput from './components/MessageInput';
import ConversationsList from './components/ConversationsList';
import Login from './components/Login';
import Register from './components/Register';
import AdminLogin from './components/AdminLogin'; // Importer AdminLogin
import AdminDashboard from './components/AdminDashboard'; // Importer AdminDashboard
import { chatApi } from './services/api';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false); // État pour distinguer un utilisateur administrateur
  const [isRegistering, setIsRegistering] = useState(false);
  const [isAdminLogin, setIsAdminLogin] = useState(false); // État pour basculer vers AdminLogin
  const [messages, setMessages] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      if (isAuthenticated && !isAdmin) {
        try {
          await chatApi.checkUserStatus();
        } catch (error) {
          if (error.response?.status === 403) {
            handleLogout();
          }
        }
      }
    };

    // Vérifier le statut toutes les 30 secondes
    const statusInterval = setInterval(checkStatus, 30000);

    return () => clearInterval(statusInterval);
  }, [isAuthenticated, isAdmin]);

  useEffect(() => {
    if (currentSession) {
      console.log('Current session:', currentSession);
      loadHistory();
    }
  }, [currentSession]);

  const loadSessions = async () => {
    try {
      const response = await chatApi.getAllSessions();
      console.log('Loaded sessions:', response);
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
      console.log('Loaded history:', history);
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

  const handleLoginSuccess = (role) => {
    console.log('Login successful, role:', role); // Log pour vérifier le rôle
    setIsAuthenticated(true);
    if (role === 'admin') {
      setIsAdmin(true); // Activer le mode administrateur
    } else {
      setIsAdmin(false); // Mode utilisateur standard
      loadSessions(); // Charger les sessions uniquement pour les utilisateurs
    }
  };


  const handleLogout = () => {
    console.log('User logged out');
    localStorage.removeItem('token');
    localStorage.removeItem('role'); // Supprimer le rôle stocké
    setIsAuthenticated(false);
    setIsAdmin(false); // Réinitialiser l'état admin
    setMessages([]);
    setSessions([]);
    setCurrentSession(null);
  };

  if (!isAuthenticated) {
    console.log('User not authenticated');
    if (isRegistering) {
      return <Register onRegisterSuccess={() => setIsRegistering(false)} />;
    } else if (isAdminLogin) {
      return (
        <AdminLogin
          onLoginSuccess={(role) => handleLoginSuccess(role)}
          onSwitchToUserLogin={() => setIsAdminLogin(false)} // Retour au login utilisateur
        />
      );
    } else {
      return (
        <Login
          onLoginSuccess={(role) => handleLoginSuccess(role)}
          onSwitchToRegister={() => setIsRegistering(true)}
          onSwitchToAdminLogin={() => setIsAdminLogin(true)} // Basculer vers AdminLogin
        />
      );
    }
  }

  // Si l'utilisateur est un administrateur, afficher le tableau de bord admin
  if (isAdmin) {
    console.log('Displaying AdminDashboard');
    return <AdminDashboard />;
  }

  console.log('Displaying Chat Interface for User');
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
