import axios from 'axios';

const API_URL = 'http://localhost:8000';
let usersCache = null;
let lastFetch = null;

export const chatApi = {
  login: async (data) => {
    const response = await axios.post(`${API_URL}/auth/login`, data);
    return response.data;
  },

  adminLogin: async (adminKey) => {
    // Inclure la clé admin dans l'URL comme paramètre query
    const response = await axios.post(`${API_URL}/auth/admin/login`, null, {
      params: {
        admin_key: adminKey,
      },
    });
    return response.data;
  },

  register: async (data) => {
    const response = await axios.post(`${API_URL}/auth/register`, {
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      password: data.password,
    });
    return response.data;
  },

  sendMessage: async (message, sessionId) => {
    if (!message || !sessionId) {
      console.error("Message ou sessionId manquant");
      return;
    }

    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_URL}/chat/chat`,
      { message, session_id: sessionId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  getHistory: async (sessionId) => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/chat/history/${sessionId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  getAllSessions: async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/chat/sessions`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  createSession: async () => {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_URL}/chat/create-session`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  deleteSession: async (sessionId) => {
    const token = localStorage.getItem('token');
    const response = await axios.delete(`${API_URL}/chat/delete-session/${sessionId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  renameSession: async (sessionId, newName) => {
    const token = localStorage.getItem('token');
    try {
        const response = await axios.put(
            `${API_URL}/chat/rename-session/${sessionId}`,
            { new_name: newName },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la requête de renommage de session :', error.response?.data || error.message);
        throw error;
    }
},



  getAllUsers: async () => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token || role !== 'admin') {
      throw new Error('Unauthorized access');
    }

    try {
      const response = await axios.get(`${API_URL}/auth/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      // Update cache
      usersCache = response.data;
      lastFetch = Date.now();

      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  deleteUser: async (userId) => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token || role !== 'admin') {
      throw new Error('Unauthorized access');
    }

    try {
      const response = await axios.delete(`${API_URL}/auth/admin/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Invalidate cache after successful deletion
      usersCache = null;
      lastFetch = null;

      return response.data;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error.response?.data?.detail ? new Error(error.response.data.detail) : error;
    }
  },

  toggleUserBlock: async (userId) => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token || role !== 'admin') {
      throw new Error('Unauthorized access');
    }

    try {
      const response = await axios.put(
        `${API_URL}/auth/admin/users/${userId}/toggle-block`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Invalider le cache pour forcer un rechargement
      usersCache = null;
      lastFetch = null;

      // Retourner la réponse avec le nouveau statut
      return response.data;
    } catch (error) {
      console.error('Error toggling user block status:', error);
      throw error.response?.data?.detail
        ? new Error(error.response.data.detail)
        : error;
    }
  },

  checkUserStatus: async () => {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      const response = await axios.get(`${API_URL}/auth/user/status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 403 && error.response?.data?.detail === "This account has been blocked") {
        // L'utilisateur est bloqué, déconnecter
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        window.location.href = '/'; // Rediriger vers la page de connexion
      }
      throw error;
    }
  },
  uploadPDF: async (formData) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_URL}/admin/upload-pdf`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  chatWithRAG: async (userInput, sessionId) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_URL}/chat-with-rag`,
      { message: userInput, session_id: sessionId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },
  getUserStats: async (days) => {
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('Aucun token trouvé dans le localStorage.');
        throw new Error('Utilisateur non authentifié');
    }

    try {
        console.log(`Envoi d'une requête pour les statistiques avec days=${days}`);
        const response = await axios.get(`${API_URL}/auth/admin/user-stats`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { days },
        });

        // Log des données reçues
        console.log('Réponse API pour les statistiques :', response.data);

        return response.data;
    } catch (error) {
        console.error('Erreur lors de l\'appel à /auth/admin/user-stats :', error.response?.data || error.message);
        throw error;
    }
},
getSessionsPerUser: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('Token non trouvé dans localStorage.');
        throw new Error('Utilisateur non authentifié');
    }

    try {
        const response = await axios.get(`${API_URL}/auth/admin/sessions-per-user`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Réponse API pour sessions par utilisateur :', response.data);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de l\'appel à /auth/admin/sessions-per-user :', error.response?.data || error.message);
        throw error;
    }
},



};