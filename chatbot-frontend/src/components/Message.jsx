import React from 'react';
import ReactMarkdown from 'react-markdown';

const Message = ({ message, isUser }) => {
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`rounded-lg px-4 py-2 max-w-[70%] ${isUser
            ? 'bg-gray-500 text-white rounded-lg p-4 shadow-md'
            : 'bg-gray-700 text-gray-200 rounded-lg p-4 shadow-md'
          }`}
      >
        {/* Utilisation de ReactMarkdown pour formater le contenu du message */}
        <ReactMarkdown>{message.content}</ReactMarkdown>
      </div>
    </div>
  );
};

export default Message;
