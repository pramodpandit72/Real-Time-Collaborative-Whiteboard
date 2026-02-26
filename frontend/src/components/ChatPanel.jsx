import { useState, useRef, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { X, Send, Paperclip, Smile } from 'lucide-react';

/* ════════════════════════════════════
   EMOJI DATA
   ════════════════════════════════════ */
const EMOJI_CATEGORIES = [
  { label: '😀 Smileys', emojis: ['😀','😂','🤣','😊','😍','🤩','😎','🥳','😇','🤗','🤔','😏','😴','🤯','🥺','😭'] },
  { label: '👍 Gestures', emojis: ['👍','👎','👏','🙌','🤝','✌️','🤞','💪','🎉','🔥','❤️','💯','⭐','✅','❌','💡'] },
  { label: '🎨 Objects', emojis: ['🎨','✏️','📝','📌','📎','🗂️','💻','🖥️','📱','🎯','🚀','⚡','🌟','🎵','📸','🏆'] },
];

const REACTION_EMOJIS = ['👍','❤️','😂','🎉','👀','🔥'];

const ChatPanel = ({ roomId, messages, typingUsers, onClose }) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [reactions, setReactions] = useState({});    // { msgId: { emoji: count } }
  const [hoveredMsg, setHoveredMsg] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const emojiRef = useRef(null);
  
  const { sendChatMessage, sendTypingStart, sendTypingStop, shareFile } = useSocket();
  const { user } = useAuth();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Close emoji picker on click outside
  useEffect(() => {
    const handler = (e) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    sendChatMessage(roomId, message.trim());
    setMessage('');
    setShowEmojiPicker(false);
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
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => handleStopTyping(), 2000);
  };

  const handleStopTyping = () => {
    if (isTyping) {
      setIsTyping(false);
      sendTypingStop(roomId);
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };

  const handleFileShare = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('File size must be less than 5MB'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      shareFile(roomId, { fileName: file.name, fileType: file.type, fileSize: file.size, fileUrl: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const insertEmoji = (emoji) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const toggleReaction = (msgId, emoji) => {
    setReactions(prev => {
      const msgReactions = { ...(prev[msgId] || {}) };
      const current = msgReactions[emoji] || 0;
      if (current > 0) {
        msgReactions[emoji] = current - 1;
        if (msgReactions[emoji] <= 0) delete msgReactions[emoji];
      } else {
        msgReactions[emoji] = 1;
      }
      return { ...prev, [msgId]: msgReactions };
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filteredTypingUsers = typingUsers.filter(u => u.id !== user?.id);

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900 dark:text-white">Chat</h3>
          <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-full font-medium">
            {messages.length}
          </span>
        </div>
        <button 
          onClick={onClose}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 text-sm py-8">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Send className="w-6 h-6 text-gray-300 dark:text-gray-600" />
            </div>
            No messages yet.<br />Start the conversation!
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender?._id === user?.id;
            const msgReactions = reactions[msg._id] || {};
            const hasReactions = Object.keys(msgReactions).length > 0;

            return (
              <div
                key={msg._id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}
                onMouseEnter={() => setHoveredMsg(msg._id)}
                onMouseLeave={() => setHoveredMsg(null)}
              >
                <div className="relative max-w-[85%]">
                  {/* Message bubble */}
                  <div className={`${
                    isOwn
                      ? 'bg-gradient-to-br from-blue-600 to-violet-600 text-white rounded-2xl rounded-br-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-2xl rounded-bl-md'
                  } px-4 py-2.5 shadow-sm`}>
                    {!isOwn && (
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-[9px] font-bold">
                          {msg.sender?.username?.charAt(0).toUpperCase()}
                        </div>
                        <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                          {msg.sender?.username}
                        </p>
                      </div>
                    )}
                    
                    {msg.type === 'file' ? (
                      <div className="flex items-center gap-2">
                        <Paperclip className="w-4 h-4 flex-shrink-0" />
                        <a 
                          href={msg.fileData?.fileUrl} 
                          download={msg.fileData?.fileName}
                          className="underline text-sm hover:opacity-80 transition"
                        >
                          {msg.fileData?.fileName}
                        </a>
                      </div>
                    ) : (
                      <p className="text-sm break-words leading-relaxed">{msg.content}</p>
                    )}
                    
                    <p className={`text-[10px] mt-1 ${
                      isOwn ? 'text-blue-200' : 'text-gray-400 dark:text-gray-500'
                    }`}>
                      {formatTime(msg.createdAt)}
                    </p>
                  </div>

                  {/* Reaction buttons (on hover) */}
                  {hoveredMsg === msg._id && (
                    <div className={`absolute ${isOwn ? 'left-0 -translate-x-full pr-1' : 'right-0 translate-x-full pl-1'} top-0 z-10`}>
                      <div className="flex gap-0.5 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-0.5 animate-scale-in">
                        {REACTION_EMOJIS.map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => toggleReaction(msg._id, emoji)}
                            className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-sm transition hover:scale-125"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Displayed reactions */}
                  {hasReactions && (
                    <div className={`flex flex-wrap gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      {Object.entries(msgReactions).map(([emoji, count]) => (
                        <button
                          key={emoji}
                          onClick={() => toggleReaction(msg._id, emoji)}
                          className="reaction-badge bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 shadow-sm"
                        >
                          <span>{emoji}</span>
                          <span className="text-[10px] font-medium">{count}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      {filteredTypingUsers.length > 0 && (
        <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-xs">
            {filteredTypingUsers.map(u => u.username).join(', ')}{' '}
            {filteredTypingUsers.length === 1 ? 'is' : 'are'} typing
          </span>
        </div>
      )}

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div ref={emojiRef} className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 animate-fade-in-up">
          <div className="space-y-2 max-h-52 overflow-y-auto">
            {EMOJI_CATEGORIES.map(cat => (
              <div key={cat.label}>
                <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">{cat.label}</p>
                <div className="emoji-grid">
                  {cat.emojis.map(e => (
                    <button key={e} onClick={() => insertEmoji(e)}>{e}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-1.5">
          <label className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition">
            <Paperclip className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <input
              type="file"
              onChange={handleFileShare}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt"
            />
          </label>

          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`p-2 rounded-lg transition ${
              showEmojiPicker
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-500'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400'
            }`}
          >
            <Smile className="w-5 h-5" />
          </button>
          
          <input
            type="text"
            value={message}
            onChange={handleInputChange}
            onBlur={handleStopTyping}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm outline-none transition-all"
          />
          
          <button
            type="submit"
            disabled={!message.trim()}
            className="p-2 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 disabled:opacity-40 text-white rounded-xl transition-all hover:shadow-md disabled:hover:shadow-none active:scale-95"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatPanel;
