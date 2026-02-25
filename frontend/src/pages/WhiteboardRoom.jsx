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
  ArrowLeft, Users, MessageCircle, Settings, Copy, Check,
  Loader2, Moon, Sun, X, Monitor, MonitorOff, Download, Pen
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
  const [copiedId, setCopiedId] = useState(false);
  const [canvasDark, setCanvasDark] = useState(false);
  const [zoom, setZoom] = useState(1);

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

  // Save snapshot — download as PNG directly
  const handleSaveSnapshot = useCallback(() => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.download = `collabboard-${roomId}-${Date.now()}.png`;
      link.href = canvasRef.current.toDataURL('image/png');
      link.click();
    }
  }, [roomId]);

  // Zoom handlers
  const handleZoomIn = () => setZoom(z => Math.min(z + 0.1, 3));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.1, 0.3));
  const handleZoomReset = () => setZoom(1);

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
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
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
      <header className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-b border-gray-200/80 dark:border-gray-700/80 px-4 py-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-gray-500 dark:text-gray-400 transition"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center">
                <Pen className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">{room?.name}</h1>
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyRoomId}
                    className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 font-mono transition"
                    title="Copy Room ID"
                  >
                    {copiedId ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{roomId}</span>
                  </button>
                  {userRole === 'host' && (
                    <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 rounded">
                      HOST
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Connection status */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 dark:bg-gray-700/50 mr-1">
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">{connected ? 'Live' : 'Offline'}</span>
            </div>
            
            {/* Screen Share */}
            {room?.settings?.allowScreenShare && (
              <button
                onClick={isScreenSharing ? handleStopScreenShare : handleStartScreenShare}
                className={`p-2 rounded-xl transition ${
                  isScreenSharing 
                    ? 'bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-400' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}
                title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
              >
                {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
              </button>
            )}

            {/* Download */}
            <button
              onClick={handleDownload}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-gray-500 dark:text-gray-400 transition"
              title="Download as PNG"
            >
              <Download className="w-5 h-5" />
            </button>

            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-0.5" />

            {/* Participants */}
            <button
              onClick={() => {
                setShowParticipants(!showParticipants);
                setShowChat(false);
                setShowSettings(false);
              }}
              className={`p-2 rounded-xl transition relative ${
                showParticipants 
                  ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-gradient-to-r from-blue-600 to-violet-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {activeUsers.length}
              </span>
            </button>

            {/* Chat */}
            {room?.settings?.allowChat && (
              <button
                onClick={toggleChat}
                className={`p-2 rounded-xl transition relative ${
                  showChat 
                    ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}
              >
                <MessageCircle className="w-5 h-5" />
                {unreadMessages > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
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
                className={`p-2 rounded-xl transition ${
                  showSettings 
                    ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}
              >
                <Settings className="w-5 h-5" />
              </button>
            )}

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-gray-500 dark:text-gray-400 transition"
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
          canvasDark={canvasDark}
          onToggleCanvasDark={() => setCanvasDark(!canvasDark)}
          zoom={zoom}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onZoomReset={handleZoomReset}
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
            canvasDark={canvasDark}
            zoom={zoom}
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
            currentUserId={user?.id || user?._id}
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

  const settingItems = [
    { key: 'allowParticipantDraw', label: 'Allow Participants to Draw', desc: 'Let everyone draw on the canvas' },
    { key: 'allowChat', label: 'Allow Chat', desc: 'Enable real-time messaging' },
    { key: 'allowScreenShare', label: 'Allow Screen Share', desc: 'Let participants share their screen' },
    { key: 'allowFileShare', label: 'Allow File Share', desc: 'Enable file sharing in chat' },
  ];

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-white">Room Settings</h3>
        <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="p-4 space-y-3">
        {settingItems.map(item => (
          <div key={item.key} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/40">
            <div className="flex-1 mr-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
            </div>
            <button
              onClick={() => handleToggle(item.key)}
              className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                settings[item.key] ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <div
                className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform"
                style={{ transform: settings[item.key] ? 'translateX(22px)' : 'translateX(2px)' }}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WhiteboardRoom;
