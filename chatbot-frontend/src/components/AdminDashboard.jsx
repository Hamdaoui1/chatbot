import React from 'react';

const AdminDashboard = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
            <div className="w-full max-w-4xl bg-white rounded-lg shadow-md p-8 text-center">
                <h1 className="text-4xl font-bold text-blue-600 mb-4">Bienvenue, Administrateur !</h1>
                <p className="text-lg text-gray-700">
                    Vous êtes connecté en tant qu'administrateur. Utilisez les fonctionnalités ci-dessous pour gérer l'application.
                </p>
                <div className="mt-8">
                    {/* Ajoutez des boutons ou des liens vers les fonctionnalités admin ici */}
                    <button className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition">
                        Gérer les utilisateurs
                    </button>
                    <button className="px-6 py-2 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition ml-4">
                        Consulter les logs
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
