import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { chatApi } from '../services/api';
import 'chart.js/auto';

const UserStatsChart = () => {
    const [data, setData] = useState([]);
    const [days, setDays] = useState(30);

    useEffect(() => {
    const fetchData = async () => {
        try {
            console.log(`Fetching user stats for the last ${days} days...`);
            const response = await chatApi.getUserStats(days);
            
            // Log des données API
            console.log('Données reçues depuis l\'API :', response);

            setData(response);
        } catch (error) {
            // Log de l'erreur avec plus de détails
            console.error('Erreur lors de la récupération des statistiques des utilisateurs :', error.response?.data || error.message);
        }
    };

    fetchData();
}, [days]);


    const chartData = {
        labels: data.map(stat => stat.date),
        datasets: [
            {
                label: 'Number of Users',
                data: data.map(stat => stat.count),
                fill: false,
                backgroundColor: 'rgba(75,192,192,0.4)',
                borderColor: 'rgba(75,192,192,1)',
            },
        ],
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-100 mb-4">User Statistics</h2>
            <div className="mb-4">
                <label className="text-gray-300 mr-2">Days:</label>
                <select
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                    className="bg-gray-700 text-white p-2 rounded"
                >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={30}>30</option>
                </select>
            </div>
            <Line data={chartData} />
        </div>
    );
};

export default UserStatsChart;