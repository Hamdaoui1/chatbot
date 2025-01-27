import React, { useEffect, useState } from 'react';
import { chatApi } from '../services/api';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchUsers = async () => {
        try {
            setIsLoading(true);
            const data = await chatApi.getAllUsers();
            setUsers(Array.isArray(data) ? data : []);
            setError(null);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError(err.message || 'Error loading users');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleDeleteUser = async (userId, userEmail) => {
        if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${userEmail} ?`)) {
            try {
                await chatApi.deleteUser(userId);
                fetchUsers();
                setError(null);
            } catch (err) {
                console.error('Error deleting user:', err);
                setError(err.message || 'Error deleting user');
            }
        }
    };

    const handleToggleBlock = async (userId, userEmail, isBlocked) => {
        if (window.confirm(`Êtes-vous sûr de vouloir ${isBlocked ? 'débloquer' : 'bloquer'} l'utilisateur ${userEmail} ?`)) {
            try {
                const response = await chatApi.toggleUserBlock(userId);
                // Si l'utilisateur est maintenant bloqué, forcer une vérification du statut
                if (response.is_blocked) {
                    await chatApi.checkUserStatus();
                }
                fetchUsers();
                setError(null);
            } catch (err) {
                console.error('Error toggling user block status:', err);
                setError(err.message || 'Error updating user status');
            }
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-red-500 text-center p-4">
                {error}
            </div>
        );
    }

    return (
        <div className="overflow-x-auto bg-gray-900 text-gray-300 shadow-lg rounded-lg">
            <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-800">
                    <tr>
                        <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                        >
                            Name
                        </th>
                        <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                        >
                            Email
                        </th>
                        <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                        >
                            Role
                        </th>
                        <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                        >
                            Status
                        </th>
                        <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                        >
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {users.length > 0 ? (
                        users.map((user) => (
                            <tr
                                key={user.id}
                                className="hover:bg-gray-700 transition duration-200"
                            >
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-100">
                                        {user.first_name} {user.last_name}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-400">{user.email}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span
                                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'admin'
                                                ? 'bg-green-600 text-white'
                                                : 'bg-blue-600 text-white'
                                            }`}
                                    >
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span
                                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_blocked
                                                ? 'bg-red-600 text-white'
                                                : 'bg-green-600 text-white'
                                            }`}
                                    >
                                        {user.is_blocked ? 'Blocked' : 'Active'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap space-x-2">
                                    <button
                                        onClick={() =>
                                            handleToggleBlock(user.id, user.email, user.is_blocked)
                                        }
                                        className={`text-sm font-medium ${user.is_blocked
                                                ? 'text-green-400 hover:text-green-200'
                                                : 'text-yellow-400 hover:text-yellow-200'
                                            }`}
                                    >
                                        {user.is_blocked ? (
                                            <span className="flex items-center">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-5 w-5 mr-1"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                                Débloquer
                                            </span>
                                        ) : (
                                            <span className="flex items-center">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-5 w-5 mr-1"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                                Bloquer
                                            </span>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => handleDeleteUser(user.id, user.email)}
                                        className="text-red-400 hover:text-red-200 ml-2"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td
                                colSpan="5"
                                className="px-6 py-4 text-center text-gray-400"
                            >
                                No users found
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );

};

export default UserManagement;