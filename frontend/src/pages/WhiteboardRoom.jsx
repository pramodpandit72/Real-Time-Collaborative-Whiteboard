import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { roomService, whiteboardService, chatService } from '../services/roomService';
import Canvas from '../components/Canvas';
import Toolbar from '../components/Toolbar';
import ChatPanel from '../components/ChatPanel';
import ParticipantsPanel from '../components/ParticipantsPanel';
import ScreenShare from '../components/ScreenShare';
import { 
  ArrowLeft, Users, MessageCircle, Settings, Copy, 
  Loader2, Moon, Sun, X, Monitor, Download
} from 'lucide-react';

const WhiteboardRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { 
    socket, connected, joinRoom, leaveRoom, clearBoard, undo,
    notifyScreenShareStarted, notifyScreenShareStopped
  } = useSocket();

  const [room, setRoom] = useState(null);
  const [userRole, setUserRole] = useState('participant');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Canvas state
  const [strokes, setStrokes] = useState([]);
  const [tool, setTool] = useState('pencil');
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(3);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // UI state
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showScreenShare, setShowScreenShare] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [remoteScreenShare, setRemoteScreenShare] = useState(null);
  
  // Active users & chat
  const [activeUsers, setActiveUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [typingUsers, setTypingUsers] = useState([]);
  const [remoteCursors, setRemoteCursors] = useState({});

  const canvasRef = useRef(null);

  // Fetch room data
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const response = await roomService.getRoom(roomId);
        setRoom(response.data.room);
        setUserRole(response.data.userRole);
        
        // Fetch whiteboard data
        const wbResponse = await whiteboardService.getWhiteboard(roomId);
        if (wbResponse.data.whiteboard?.strokes) {
          setStrokes(wbResponse.data.whiteboard.strokes);
          setHistory([wbResponse.data.whiteboard.strokes]);
          setHistoryIndex(0);
        }

        // Fetch messages
        const msgResponse = await chatService.getMessages(roomId);
        setMessages(msgResponse.data.messages);
      } catch (err) {
        console.error('Failed to fetch room:', err);
        setError(err.response?.data?.message || 'Failed to load room');
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();
  }, [roomId]);

  // Join socket room
  useEffect(() => {
    if (connected && room) {
      joinRoom(roomId);
    }

    return () => {
      if (connected) {
        leaveRoom(roomId);
      }
    };
  }, [connected, room, roomId, joinRoom, leaveRoom]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Room events
    socket.on('room-joined', (data) => {
      console.log('Joined room:', data);
      if (data.whiteboard?.length > 0) {
        setStrokes(data.whiteboard);
        setHistory([data.whiteboard]);
        setHistoryIndex(0);
      }
      setUserRole(data.role);
    });

    socket.on('user-joined', (data) => {
      console.log('User joined:', data.user.username);
    });

    socket.on('user-left', (data) => {
      console.log('User left:', data.user.username);
      // Remove their cursor
      setRemoteCursors(prev => {
        const newCursors = { ...prev };
        delete newCursors[data.user.id];
        return newCursors;
      });
    });

    socket.on('active-users', (data) => {
      setActiveUsers(data.users);
    });

    socket.on('user-kicked', (data) => {
      if (data.userId === user?.id) {
        navigate('/dashboard');
      }
    });

    // Drawing events
    socket.on('draw-start', (data) => {
      // Handle remote draw start
    });

    socket.on('draw-move', (data) => {
      // Handle remote draw move
    });

    socket.on('draw-end', (data) => {
      if (data.stroke) {
        setStrokes(prev => [...prev, data.stroke]);
      }
    });

    socket.on('strokes-updated', (data) => {
      setStrokes(data.strokes);
      setHistory(prev => [...prev.slice(0, historyIndex + 1), data.strokes]);
      setHistoryIndex(prev => prev + 1);
    });

    socket.on('board-cleared', () => {
      setStrokes([]);
      setHistory([[]]);
      setHistoryIndex(0);
    });

    // Chat events
    socket.on('chat-message', (data) => {
      setMessages(prev => [...prev, data.message]);
      if (!showChat) {
        setUnreadMessages(prev => prev + 1);
      }
    });

    socket.on('user-typing', (data) => {
      setTypingUsers(prev => {
        if (!prev.find(u => u.id === data.user.id)) {
          return [...prev, data.user];
        }
        return prev;
      });
    });

    socket.on('user-stopped-typing', (data) => {
      setTypingUsers(prev => prev.filter(u => u.id !== data.userId));
    });

    // Cursor events
    socket.on('cursor-move', (data) => {
      setRemoteCursors(prev => ({
        ...prev,
        [data.userId]: {
          position: data.position,
          username: data.username
        }
      }));
    });

    // Settings events
    socket.on('settings-updated', (data) => {
      setRoom(prev => ({ ...prev, settings: data.settings }));
    });

    // Screen share events
    socket.on('screen-share-started', (data) => {
      setRemoteScreenShare({
        userId: data.userId,
        username: data.username
      });
    });

    socket.on('screen-share-stopped', () => {
      setRemoteScreenShare(null);
    });

    return () => {
      socket.off('room-joined');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('active-users');
      socket.off('user-kicked');
      socket.off('draw-start');
      socket.off('draw-move');
      socket.off('draw-end');
      socket.off('strokes-updated');
      socket.off('board-cleared');
      socket.off('chat-message');
      socket.off('user-typing');
      socket.off('user-stopped-typing');
      socket.off('cursor-move');
      socket.off('settings-updated');
      socket.off('screen-share-started');
      socket.off('screen-share-stopped');
    };
  }, [socket, historyIndex, showChat, user?.id, navigate]);

  // Undo handler
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setStrokes(history[newIndex]);
      undo(roomId);
    }
  }, [historyIndex, history, roomId, undo]);

  // Redo handler
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setStrokes(history[newIndex]);
    }
  }, [historyIndex, history]);

  // Clear board handler
  const handleClearBoard = useCallback(() => {
    if (userRole !== 'host') return;
    if (confirm('Are you sure you want to clear the board?')) {
      clearBoard(roomId);
    }
  }, [userRole, roomId, clearBoard]);

  // Save snapshot
  const handleSaveSnapshot = useCallback(async () => {
    if (canvasRef.current) {
      const imageData = canvasRef.current.toDataURL('image/png');
      try {
        await whiteboardService.saveSnapshot(roomId, imageData, `Snapshot ${new Date().toLocaleString()}`);
      } catch (err) {
        console.error('Failed to save snapshot:', err);
      }
    }
  }, [roomId]);

  // Download as image
  const handleDownload = useCallback(() => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.download = `whiteboard-${roomId}-${Date.now()}.png`;
      link.href = canvasRef.current.toDataURL('image/png');
      link.click();
    }
  }, [roomId]);

  // Copy room ID
  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
  };

  // Toggle chat with unread reset
  const toggleChat = () => {
    setShowChat(!showChat);
    if (!showChat) {
      setUnreadMessages(0);
    }
    setShowParticipants(false);
    setShowSettings(false);
  };

  // Screen share handlers
  const handleStartScreenShare = () => {
    setShowScreenShare(true);
    setIsScreenSharing(true);
    notifyScreenShareStarted(roomId);
  };

  const handleStopScreenShare = () => {
    setShowScreenShare(false);
    setIsScreenSharing(false);
    notifyScreenShareStopped(roomId);
  };

  // Add stroke to history
  const addToHistory = useCallback((newStrokes) => {
    setHistory(prev => [...prev.slice(0, historyIndex + 1), newStrokes]);
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Error</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900 overflow-hidden">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{room?.name}</h1>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="font-mono">{roomId}</span>
                <button onClick={copyRoomId} className="hover:text-gray-700 dark:hover:text-gray-200">
                  <Copy className="w-4 h-4" />
                </button>
                {userRole === 'host' && (
                  <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded">
                    Host
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Connection status */}
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
            
            {/* Screen Share */}
            {room?.settings?.allowScreenShare && (
              <button
                onClick={isScreenSharing ? handleStopScreenShare : handleStartScreenShare}
                className={`p-2 rounded-lg transition ${
                  isScreenSharing 
                    ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
                title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
              >
                <Monitor className="w-5 h-5" />
              </button>
            )}

            {/* Download */}
            <button
              onClick={handleDownload}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 transition"
              title="Download as Image"
            >
              <Download className="w-5 h-5" />
            </button>

            {/* Participants */}
            <button
              onClick={() => {
                setShowParticipants(!showParticipants);
                setShowChat(false);
                setShowSettings(false);
              }}
              className={`p-2 rounded-lg transition relative ${
                showParticipants 
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                {activeUsers.length}
              </span>
            </button>

            {/* Chat */}
            {room?.settings?.allowChat && (
              <button
                onClick={toggleChat}
                className={`p-2 rounded-lg transition relative ${
                  showChat 
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                <MessageCircle className="w-5 h-5" />
                {unreadMessages > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </button>
            )}

            {/* Settings (host only) */}
            {userRole === 'host' && (
              <button
                onClick={() => {
                  setShowSettings(!showSettings);
                  setShowChat(false);
                  setShowParticipants(false);
                }}
                className={`p-2 rounded-lg transition ${
                  showSettings 
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                <Settings className="w-5 h-5" />
              </button>
            )}

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 transition"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Toolbar */}
        <Toolbar
          tool={tool}
          setTool={setTool}
          color={color}
          setColor={setColor}
          brushSize={brushSize}
          setBrushSize={setBrushSize}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onClear={handleClearBoard}
          onSaveSnapshot={handleSaveSnapshot}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
          canClear={userRole === 'host'}
          canDraw={userRole === 'host' || room?.settings?.allowParticipantDraw}
        />

        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden">
          <Canvas
            ref={canvasRef}
            strokes={strokes}
            setStrokes={setStrokes}
            tool={tool}
            color={color}
            brushSize={brushSize}
            roomId={roomId}
            canDraw={userRole === 'host' || room?.settings?.allowParticipantDraw}
            remoteCursors={remoteCursors}
            addToHistory={addToHistory}
          />

          {/* Remote Screen Share Overlay */}
          {remoteScreenShare && (
            <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              {remoteScreenShare.username} is sharing their screen
            </div>
          )}
        </div>

        {/* Side Panels */}
        {showChat && (
          <ChatPanel
            roomId={roomId}
            messages={messages}
            typingUsers={typingUsers}
            onClose={() => setShowChat(false)}
          />
        )}

        {showParticipants && (
          <ParticipantsPanel
            room={room}
            activeUsers={activeUsers}
            userRole={userRole}
            currentUserId={user?.id}
            onClose={() => setShowParticipants(false)}
          />
        )}

        {showSettings && userRole === 'host' && (
          <SettingsPanel
            room={room}
            roomId={roomId}
            onClose={() => setShowSettings(false)}
          />
        )}
      </div>

      {/* Screen Share Modal */}
      {showScreenShare && (
        <ScreenShare
          roomId={roomId}
          onClose={handleStopScreenShare}
        />
      )}
    </div>
  );
};

// Settings Panel Component
const SettingsPanel = ({ room, roomId, onClose }) => {
  const { updateSettings } = useSocket();
  const [settings, setSettings] = useState(room?.settings || {});

  const handleToggle = (key) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    updateSettings(roomId, newSettings);
  };

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-white">Room Settings</h3>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        <SettingToggle
          label="Allow Participants to Draw"
          checked={settings.allowParticipantDraw}
          onChange={() => handleToggle('allowParticipantDraw')}
        />
        <SettingToggle
          label="Allow Chat"
          checked={settings.allowChat}
          onChange={() => handleToggle('allowChat')}
        />
        <SettingToggle
          label="Allow Screen Share"
          checked={settings.allowScreenShare}
          onChange={() => handleToggle('allowScreenShare')}
        />
        <SettingToggle
          label="Allow File Share"
          checked={settings.allowFileShare}
          onChange={() => handleToggle('allowFileShare')}
        />
      </div>
    </div>
  );
};

const SettingToggle = ({ label, checked, onChange }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
    <button
      onClick={onChange}
      className={`w-11 h-6 rounded-full transition ${
        checked ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
      }`}
    >
      <div className={`w-5 h-5 bg-white rounded-full shadow transform transition ${
        checked ? 'translate-x-5' : 'translate-x-0.5'
      }`} />
    </button>
  </div>
);

export default WhiteboardRoom;
