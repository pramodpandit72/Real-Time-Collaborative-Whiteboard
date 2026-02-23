import { useState, useRef, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { X, Send, Paperclip, Smile } from 'lucide-react';

const ChatPanel = ({ roomId, messages, typingUsers, onClose }) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
  const { sendChatMessage, sendTypingStart, sendTypingStop, shareFile } = useSocket();
  const { user } = useAuth();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    sendChatMessage(roomId, message.trim());
    setMessage('');
    handleStopTyping();
  };

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    handleStartTyping();
  };

  const handleStartTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      sendTypingStart(roomId);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping();
    }, 2000);
  };

  const handleStopTyping = () => {
    if (isTyping) {
      setIsTyping(false);
      sendTypingStop(roomId);
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleFileShare = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit file size to 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      shareFile(roomId, {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        fileUrl: reader.result
      });
    };
    reader.readAsDataURL(file);
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const filteredTypingUsers = typingUsers.filter(u => u.id !== user?.id);

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-white">Chat</h3>
        <button 
          onClick={onClose}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 text-sm py-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg._id}
              className={`flex ${msg.sender?._id === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] ${
                  msg.sender?._id === user?.id
                    ? 'bg-blue-600 text-white rounded-l-lg rounded-tr-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-r-lg rounded-tl-lg'
                } px-4 py-2`}
              >
                {msg.sender?._id !== user?.id && (
                  <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
                    {msg.sender?.username}
                  </p>
                )}
                
                {msg.type === 'file' ? (
                  <div className="flex items-center gap-2">
                    <Paperclip className="w-4 h-4" />
                    <a 
                      href={msg.fileData?.fileUrl} 
                      download={msg.fileData?.fileName}
                      className="underline text-sm"
                    >
                      {msg.fileData?.fileName}
                    </a>
                  </div>
                ) : (
                  <p className="text-sm break-words">{msg.content}</p>
                )}
                
                <p className={`text-xs mt-1 ${
                  msg.sender?._id === user?.id 
                    ? 'text-blue-200' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {formatTime(msg.createdAt)}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      {filteredTypingUsers.length > 0 && (
        <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
          {filteredTypingUsers.map(u => u.username).join(', ')}{' '}
          {filteredTypingUsers.length === 1 ? 'is' : 'are'} typing...
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <label className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer">
            <Paperclip className="w-5 h-5 text-gray-500" />
            <input
              type="file"
              onChange={handleFileShare}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt"
            />
          </label>
          
          <input
            type="text"
            value={message}
            onChange={handleInputChange}
            onBlur={handleStopTyping}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
          
          <button
            type="submit"
            disabled={!message.trim()}
            className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatPanel;
