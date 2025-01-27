import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { chatApi } from '../services/api';
import 'chart.js/auto';

const SessionsPerUserChart = () => {
    const [data, setData] = useState([]);

    useEffect(() => {
        const fetchSessionsPerUser = async () => {
            try {
                const response = await chatApi.getSessionsPerUser();
                console.log('Données des sessions par utilisateur :', response);
                setData(response);
            } catch (error) {
                console.error('Erreur lors de la récupération des sessions par utilisateur :', error);
            }
        };

        fetchSessionsPerUser();
    }, []);

    const chartData = {
        labels: data.map(item => item.user_email), // Les emails des utilisateurs (abscisses)
        datasets: [
            {
                label: 'Nombre de sessions',
                data: data.map(item => item.count), // Nombre de sessions (ordonnées)
                backgroundColor: data.map(() => `#${Math.floor(Math.random() * 16777215).toString(16)}`), // Couleurs aléatoires
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                display: false,
            },
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Utilisateurs',
                },
            },
            y: {
                title: {
                    display: true,
                    text: 'Nombre de sessions',
                },
                beginAtZero: true,
            },
        },
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-100 mb-4">Sessions par utilisateur</h2>
            <Bar data={chartData} options={options} />
        </div>
    );
};

export default SessionsPerUserChart;
