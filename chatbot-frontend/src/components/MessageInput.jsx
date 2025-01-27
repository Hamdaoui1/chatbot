import { useState } from 'react';

const MessageInput = ({ onSendMessage, isLoading }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-4 border-t border-gray-700 bg-gray-900">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message..."
        className="flex-1 rounded-lg border-gray-600 bg-gray-800 text-white focus:ring-blue-500 focus:border-blue-500"
        disabled={isLoading}
      />
      <button
        type="submit"
        disabled={isLoading}
        className={`px-4 py-2 rounded-lg bg-gray-700 text-white 
    ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-600'} 
    transition duration-300`}
      >
        {isLoading ? 'Sending...' : 'Send'}
      </button>

    </form>
  );
};

export default MessageInput;