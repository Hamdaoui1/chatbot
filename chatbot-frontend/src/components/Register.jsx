import { useState } from 'react';
import { chatApi } from '../services/api';

const Register = ({ onRegisterSuccess }) => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
    });

    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await chatApi.register({
                first_name: formData.firstName,
                last_name: formData.lastName,
                email: formData.email,
                password: formData.password,
            });
            onRegisterSuccess();
        } catch (err) {
            setError('Registration failed. Please try again.');
            console.error('Error during registration:', err);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <div className="w-full max-w-md p-8 bg-gray-800 shadow-lg rounded-lg">
                <h2 className="text-2xl font-bold text-center text-white mb-6">
                    Create an Account
                </h2>
                {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400">First Name</label>
                        <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400">Last Name</label>
                        <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400">Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full py-2 px-4 bg-gray-700 text-white font-semibold rounded-lg shadow-md 
               hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 
               transition duration-300 ease-in-out"
                    >
                        Register
                    </button>

                </form>
                <p className="text-center mt-4 text-gray-400">
                    Already have an account?{' '}
                    <button
                        onClick={onRegisterSuccess}
                        className="w-full py-2 px-4 bg-gray-700 text-white font-semibold rounded-lg shadow-md 
               hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 
               transition duration-300 ease-in-out"
                    >
                        Login here
                    </button>
                </p>
            </div>
        </div>
    );

};

export default Register;
