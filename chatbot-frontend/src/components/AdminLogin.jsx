import { useState } from 'react';
import { chatApi } from '../services/api';

const AdminLogin = ({ onLoginSuccess, onSwitchToUserLogin }) => {
    const [adminKey, setAdminKey] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false); // État pour le loader

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        // Validation du champ clé admin
        if (!adminKey.trim()) {
            setError('Admin key cannot be empty.');
            return;
        }

        console.log('Admin key submitted:', adminKey); // Log pour vérifier la clé soumise

        setIsLoading(true); // Activer le loader pendant la requête
        try {
            // Envoyer la clé administrateur dans l'URL comme paramètre query
            const response = await chatApi.adminLogin(adminKey);

            // Stocker le token et le rôle dans le localStorage
            localStorage.setItem('token', response.access_token);
            localStorage.setItem('role', response.role);
            console.log('Admin login successful:', response); // Log de succès

            onLoginSuccess(response.role); // Notifier que l'admin est connecté
        } catch (err) {
            console.error('Error during admin login:', err); // Log de l'erreur
            // Manipuler l'erreur et extraire un message lisible
            if (err.response && err.response.data && err.response.data.detail) {
                const errorMessage =
                    typeof err.response.data.detail === 'string'
                        ? err.response.data.detail
                        : JSON.stringify(err.response.data.detail); // Convertir l'objet en chaîne lisible
                setError(errorMessage);
            } else {
                setError('Invalid admin key. Please try again.');
            }
        } finally {
            setIsLoading(false); // Désactiver le loader
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
                <h2 className="text-2xl font-semibold text-center mb-6">Admin Login</h2>
                {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Admin Key</label>
                        <input
                            type="password"
                            placeholder="Enter your admin key"
                            value={adminKey}
                            onChange={(e) => setAdminKey(e.target.value)}
                            required
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading} // Désactiver le bouton si le loader est actif
                        className={`w-full py-2 px-4 text-white rounded-lg transition ${isLoading
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500'
                            }`}
                    >
                        {isLoading ? 'Loading...' : 'Login as Admin'} {/* Affichage du loader */}
                    </button>
                </form>
                <p className="text-center mt-4 text-sm">
                    Not an admin?{' '}
                    <button
                        onClick={onSwitchToUserLogin} // Fonction pour basculer vers la page utilisateur
                        className="text-blue-600 hover:underline"
                    >
                        Login as User
                    </button>
                </p>
            </div>
        </div>
    );
};

export default AdminLogin;
