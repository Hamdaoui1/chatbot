import React, { useState } from 'react';
import UserManagement from './UserManagement'; // Importation du composant UserManagement
import UploadPDF from './UploadPDF'; // Importation du composant UploadPDF
const AdminDashboard = ({ onLogout }) => {
    const [view, setView] = useState('dashboard');

    // Fonction pour gérer la déconnexion
    const handleLogout = () => {
        localStorage.removeItem('token'); // Supprimer le token du localStorage
        localStorage.removeItem('role'); // Supprimer le rôle du localStorage
        if (onLogout) {
            onLogout(); // Appeler la fonction passée en props pour gérer la redirection
        } else {
            window.location.reload(); // Actualiser la page si aucune redirection n'est spécifiée
        }
    };

    const handleNavigate = (section) => {
        setView(section);
    };

    return (
        <div className="min-h-screen flex bg-gray-900 text-gray-200">
            {/* Barre latérale */}
            <aside className="w-64 bg-gray-800 flex flex-col shadow-lg">
                <div className="p-6 text-center font-bold text-xl border-b border-gray-700">
                    Admin Panel
                </div>
                <nav className="flex-1 mt-6">
                    <ul className="space-y-2">
                        <li>
                            <button
                                onClick={() => handleNavigate('dashboard')}
                                className="w-full text-left px-6 py-3 hover:bg-gray-700 transition rounded-md"
                            >
                                Dashboard
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => handleNavigate('users')}
                                className="w-full text-left px-6 py-3 hover:bg-gray-700 transition rounded-md"
                            >
                                Gérer les utilisateurs
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => handleNavigate('logs')}
                                className="w-full text-left px-6 py-3 hover:bg-gray-700 transition rounded-md"
                            >
                                Consulter les logs
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => handleNavigate('settings')}
                                className="w-full text-left px-6 py-3 hover:bg-gray-700 transition rounded-md"
                            >
                                Paramètres
                            </button>
                        </li>
                    </ul>
                </nav>
                <div className="p-6">
                    <button
                        onClick={handleLogout} // Appel de la fonction de déconnexion
                        className="w-full bg-red-600 hover:bg-red-700 py-2 rounded-lg shadow-md transition"
                    >
                        Déconnexion
                    </button>
                </div>
            </aside>

            {/* Contenu principal */}
            <main className="flex-1 p-8">
                {view === 'dashboard' && (
                    <div className="bg-gray-800 rounded-lg shadow-md p-6">
                        <h1 className="text-2xl font-bold text-gray-100 mb-4">
                            Bienvenue, Administrateur !
                        </h1>
                        <p className="text-lg text-gray-400 mb-6">
                            Utilisez les options dans la barre latérale pour gérer les
                            fonctionnalités administratives.
                        </p>
                    </div>
                )}
                {view === 'users' && (
                    <div className="bg-gray-800 rounded-lg shadow-md p-6">
                        <h1 className="text-2xl font-bold text-gray-100 mb-4">
                            Gestion des utilisateurs
                        </h1>
                        <UserManagement /> {/* Inclusion du composant UserManagement */}
                    </div>
                )}
                {view === 'logs' && (
                    <div className="bg-gray-800 rounded-lg shadow-md p-6">
                        <h1 className="text-2xl font-bold text-gray-100 mb-4">Logs</h1>
                        <p className="text-lg text-gray-400 mb-6">
                            Consultez les journaux de l'application.
                        </p>
                    </div>
                )}
                {view === 'settings' && (
                    <div className="bg-gray-800 rounded-lg shadow-md p-6">
                        <h1 className="text-2xl font-bold text-gray-100 mb-4">Paramètres</h1>
                        <UploadPDF /> {/* Inclusion du composant pour l'upload */}
                    </div>
                )}
            </main>
        </div>
    );

};

export default AdminDashboard;
