import axios from 'axios';

const API_URL = 'http://localhost:8000';

export const chatApi = {
  login: async (data) => {
    const response = await axios.post(`${API_URL}/auth/login`, data);
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
    const response = await axios.put(
      `${API_URL}/chat/rename-session/${sessionId}`,
      { new_name: newName },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

};
