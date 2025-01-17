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
    <div className="d-flex flex-column h-100 border-end bg-light p-3">
      <h2 className="text-primary text-center mb-4">Conversations</h2>
      <div className="flex-grow-1 overflow-auto mb-3">
        {sessions.length > 0 ? (
          <ul className="list-group">
            {sessions.map((session) => (
              <li
                key={session + (editingSession === session ? '-editing' : '')} // Clé unique dynamique
                className={`list-group-item d-flex justify-content-between align-items-center ${currentSession === session ? 'bg-light text-dark' : ''
                  } ${hoveredSession === session ? 'bg-secondary bg-opacity-25' : ''}`}
                onMouseEnter={() => {
                  console.log(`Souris sur la session : ${session}`);
                  setHoveredSession(session);
                }}
                onMouseLeave={() => {
                  console.log(`Souris quittée de la session : ${session}`);
                  setHoveredSession(null);
                }}
              >
                {editingSession === session ? (
                  <input
                    type="text"
                    value={newSessionName}
                    onChange={(e) => {
                      console.log(`Modification du texte : ${e.target.value}`);
                      setNewSessionName(e.target.value);
                    }}
                    onBlur={() => handleRenameSubmit(session)}
                    onKeyDown={(e) => {
                      console.log(`Touche pressée : ${e.key}`);
                      if (e.key === 'Enter') handleRenameSubmit(session);
                      if (e.key === 'Escape') setEditingSession(null);
                    }}
                    autoFocus
                    className="form-control form-control-sm"
                  />
                ) : (
                  <button
                    onClick={() => {
                      console.log(`Changement de session : ${session}`);
                      onSessionChange(session);
                    }}
                    className="btn btn-link text-decoration-none text-start flex-grow-1"
                    style={{
                      color: currentSession === session ? '#333' : '#555',
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
                  className="p-0"
                >
                  <Dropdown.Item onClick={() => handleRename(session)}>
                    <i className="bi bi-pencil me-2"></i> Renommer
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => onDeleteSession(session)} className="text-danger">
                    <i className="bi bi-trash me-2"></i> Supprimer
                  </Dropdown.Item>
                </DropdownButton>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted text-center">No sessions available</p>
        )}
      </div>
      <button
        onClick={() => {
          console.log('Création d’une nouvelle session');
          onCreateSession();
        }}
        className="btn btn-success w-100 d-flex align-items-center justify-content-center"
      >
        <i className="bi bi-plus-circle me-2"></i> Nouvelle Session
      </button>
    </div>
  );
};

export default ConversationsList;
