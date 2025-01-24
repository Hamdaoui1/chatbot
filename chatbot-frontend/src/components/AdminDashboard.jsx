import React, { useState } from 'react';
import UserManagement from './UserManagement'; // Importation du composant UserManagement

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
        <div className="min-h-screen flex bg-gray-100">
            {/* Barre latérale */}
            <aside className="w-64 bg-blue-600 text-white flex flex-col shadow-lg">
                <div className="p-6 text-center font-bold text-2xl border-b border-blue-500">
                    Admin Panel
                </div>
                <nav className="flex-1 mt-6">
                    <ul className="space-y-2">
                        <li>
                            <button
                                onClick={() => handleNavigate('dashboard')}
                                className="w-full text-left px-6 py-3 hover:bg-blue-700 transition"
                            >
                                Dashboard
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => handleNavigate('users')}
                                className="w-full text-left px-6 py-3 hover:bg-blue-700 transition"
                            >
                                Gérer les utilisateurs
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => handleNavigate('logs')}
                                className="w-full text-left px-6 py-3 hover:bg-blue-700 transition"
                            >
                                Consulter les logs
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => handleNavigate('settings')}
                                className="w-full text-left px-6 py-3 hover:bg-blue-700 transition"
                            >
                                Paramètres
                            </button>
                        </li>
                    </ul>
                </nav>
                <div className="p-6">
                    <button
                        onClick={handleLogout} // Appel de la fonction de déconnexion
                        className="w-full bg-red-500 hover:bg-red-600 py-2 rounded-lg shadow-md transition"
                    >
                        Déconnexion
                    </button>
                </div>
            </aside>

            {/* Contenu principal */}
            <main className="flex-1 p-8">
                {view === 'dashboard' && (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h1 className="text-3xl font-bold text-blue-600 mb-4">Bienvenue, Administrateur !</h1>
                        <p className="text-lg text-gray-700 mb-6">
                            Utilisez les options dans la barre latérale pour gérer les fonctionnalités administratives.
                        </p>
                    </div>
                )}
                {view === 'users' && (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h1 className="text-3xl font-bold text-blue-600 mb-4">Gestion des utilisateurs</h1>
                        <UserManagement /> {/* Inclusion du composant UserManagement */}
                    </div>
                )}
                {view === 'logs' && (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h1 className="text-3xl font-bold text-blue-600 mb-4">Logs</h1>
                        <p className="text-lg text-gray-700 mb-6">
                            Consultez les journaux de l'application.
                        </p>
                    </div>
                )}
                {view === 'settings' && (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h1 className="text-3xl font-bold text-blue-600 mb-4">Paramètres</h1>
                        <p className="text-lg text-gray-700 mb-6">
                            Gérez les paramètres administratifs de l'application.
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;
