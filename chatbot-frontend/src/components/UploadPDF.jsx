import React, { useState } from 'react';
import { chatApi } from '../services/api';

const UploadPDF = () => {
    const [file, setFile] = useState(null);
    const [uploadStatus, setUploadStatus] = useState('');

    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
    };

    const handleUpload = async (event) => {
        event.preventDefault();

        if (!file) {
            setUploadStatus('Veuillez sélectionner un fichier PDF.');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            setUploadStatus('Téléchargement en cours...');
            const response = await chatApi.uploadPDF(formData);
            setUploadStatus(`Succès : ${response.message}`);
        } catch (error) {
            setUploadStatus(`Erreur : ${error.response?.data?.detail || 'Échec du téléchargement.'}`);
        }
    };

    return (
        <div className="p-6 bg-gray-800 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold text-gray-100 mb-4">Uploader un fichier PDF</h2>
            <form onSubmit={handleUpload} className="space-y-4">
                <div>
                    <label className="block text-gray-300 font-medium">
                        Sélectionnez un fichier PDF :
                    </label>
                    <input
                        type="file"
                        accept="application/pdf"
                        onChange={handleFileChange}
                        className="mt-2 p-2 border border-gray-600 rounded-md w-full bg-gray-900 text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    />
                </div>
                <button
                    type="submit"
                    className="w-full bg-gray-700 text-gray-200 px-4 py-2 rounded-md hover:bg-gray-600 focus:ring-2 focus:ring-gray-500 transition duration-300"
                >
                    Uploader
                </button>
            </form>
            {uploadStatus && (
                <p className="mt-4 text-sm text-gray-400">{uploadStatus}</p>
            )}
        </div>
    );

};

export default UploadPDF;
