import { useState } from 'react';
import { chatApi } from '../services/api';

const Login = ({ onLoginSuccess, onSwitchToRegister, onSwitchToAdminLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append("username", email); // FastAPI attend "username" pour l'email
            formData.append("password", password);

            const response = await chatApi.login(formData); // Envoyer formData
            localStorage.setItem('token', response.access_token);
            onLoginSuccess();
        } catch (err) {
            setError('Invalid credentials. Please try again.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-lg p-8">
                <h2 className="text-2xl font-semibold text-center mb-6 text-white">Login</h2>
                {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                        <input
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                        <input
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full py-2 px-4 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition duration-300 ease-in-out shadow-md"
                    >
                        Login
                    </button>

                </form>

                <p className="text-center mt-4 text-sm text-gray-400">
                    Don't have an account?{' '}
                    <button
                        onClick={onSwitchToRegister}
                        className="inline-block px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300"
                    >
                        Register here
                    </button>
                </p>
                <p className="text-center mt-4 text-sm text-gray-400">
                    Are you an admin?{' '}
                    <button
                        onClick={onSwitchToAdminLogin}
                        className="inline-block px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300"
                    >
                        Login as Admin
                    </button>
                </p>



            </div>
        </div>
    );

};

export default Login;
