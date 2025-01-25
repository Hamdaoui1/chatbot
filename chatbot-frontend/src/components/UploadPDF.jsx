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
        <div className="p-6 bg-gray-100 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-blue-600 mb-4">Uploader un fichier PDF</h2>
            <form onSubmit={handleUpload} className="space-y-4">
                <div>
                    <label className="block text-gray-700 font-medium">Sélectionnez un fichier PDF :</label>
                    <input
                        type="file"
                        accept="application/pdf"
                        onChange={handleFileChange}
                        className="mt-2 p-2 border rounded-md w-full"
                    />
                </div>
                <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
                >
                    Uploader
                </button>
            </form>
            {uploadStatus && <p className="mt-4 text-sm text-gray-600">{uploadStatus}</p>}
        </div>
    );
};

export default UploadPDF;
