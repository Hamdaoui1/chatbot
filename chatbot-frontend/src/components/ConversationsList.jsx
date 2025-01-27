import React, { useState } from 'react';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';

const ConversationsList = ({ sessions, currentSession, onSessionChange, onCreateSession, onDeleteSession, onRenameSession }) => {
  const [hoveredSession, setHoveredSession] = useState(null);
  const [editingSession, setEditingSession] = useState(null);
  const [newSessionName, setNewSessionName] = useState('');

  const handleRename = (session) => {
    console.log(`Renommer la session : ${session}`);
    setEditingSession(session);
    setNewSessionName(session);
    console.log(`État après clic sur renommer : editingSession=${session}, newSessionName=${session}`);
  };

  const handleRenameSubmit = (session) => {
    console.log(`Soumission du nouveau nom : ${newSessionName} pour la session : ${session}`);
    if (newSessionName.trim() !== '' && newSessionName !== session) {
      onRenameSession(session, newSessionName.trim());
    }
    setEditingSession(null);
  };

  return (
    <div className="d-flex flex-column h-100  bg-gray-900 text-white p-3 border-b border-gray-800">
      <h2 className="text-gray-200 text-center mb-4 font-bold tracking-wide">
        Conversations
      </h2>

      <div className="flex-grow-1 overflow-auto mb-3">
        {sessions.length > 0 ? (
          <ul className="list-group">
            {sessions.map((session) => (
              <li
                key={session + (editingSession === session ? '-editing' : '')}
                className={`d-flex justify-content-between align-items-center transition-all duration-200 
              rounded-lg shadow-sm
              ${currentSession === session
                    ? 'bg-gray-700 text-white' // Style pour l'élément sélectionné
                    : 'bg-gray-800 text-gray-300'
                  } 
              ${hoveredSession === session ? 'bg-gray-600 text-white' : ''}`}
                onMouseEnter={() => setHoveredSession(session)}
                onMouseLeave={() => setHoveredSession(null)}
              >

                {editingSession === session ? (
                  <input
                    type="text"
                    value={newSessionName}
                    onChange={(e) => setNewSessionName(e.target.value)}
                    onBlur={() => handleRenameSubmit(session)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRenameSubmit(session);
                      if (e.key === 'Escape') setEditingSession(null);
                    }}
                    autoFocus
                    className="form-control form-control-sm bg-gray-700 text-white border-gray-600"
                  />
                ) : (
                  <button
                    onClick={() => onSessionChange(session)}
                    className="btn btn-link text-decoration-none text-start flex-grow-1"
                    style={{
                      color: currentSession === session ? '#fff' : '#9CA3AF', // Gris clair
                      fontWeight: currentSession === session ? 'bold' : 'normal',
                    }}
                  >
                    <i className="bi bi-chat-dots me-2"></i>
                    {session.slice(-6)}
                  </button>
                )}

                <DropdownButton
                  id={`dropdown-${session}`}
                  title={<i className="bi bi-three-dots"></i>}
                  variant="link"
                  align="end"
                  className="p-0 text-gray-400 hover:text-gray-200 transition duration-300"
                >
                  <Dropdown.Item
                    onClick={() => handleRename(session)}
                    className="hover:bg-gray-800 text-gray-400 hover:text-white transition duration-300"
                  >
                    <i className="bi bi-pencil me-2"></i> Renommer
                  </Dropdown.Item>
                  <Dropdown.Item
                    onClick={() => onDeleteSession(session)}
                    className="text-red-500 hover:bg-red-800 hover:text-white transition duration-300"
                  >
                    <i className="bi bi-trash me-2"></i> Supprimer
                  </Dropdown.Item>
                </DropdownButton>

              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-center">No sessions available</p>
        )}
      </div>
      <button
        onClick={onCreateSession}
        className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg shadow-md transition-all duration-300 flex items-center justify-center"
      >
        <i className="bi bi-plus-circle me-2"></i> Nouvelle Session
      </button>

    </div>
  );



};

export default ConversationsList;
