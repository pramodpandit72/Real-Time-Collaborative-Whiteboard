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
import VideoCall from '../components/CameraPanel';
import StickyNoteOverlay from '../components/StickyNote';
import { 
  ArrowLeft, Users, MessageCircle, Settings, Copy, Check,
  Loader2, Moon, Sun, X, Monitor, MonitorOff, Download, Pen,
  Video, VideoOff, Maximize2, Minimize2, Keyboard
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
  const [eraserSize, setEraserSize] = useState(20);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Multi-page state
  const [pages, setPages] = useState([{ strokes: [], history: [[]], historyIndex: 0, stickyNotes: [] }]);
  const [currentPage, setCurrentPage] = useState(0);
  const pageCountRef = useRef(1);
  
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
  const [sidebarWidth, setSidebarWidth] = useState(72);
  const [showCamera, setShowCamera] = useState(false);
  const [remoteCameras, setRemoteCameras] = useState({});
  const [screenShareExpanded, setScreenShareExpanded] = useState(false);
  const [stickyNotes, setStickyNotes] = useState([]);
  const [gridMode, setGridMode] = useState('none');
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [fillEnabled, setFillEnabled] = useState(false);
  const [fillColor, setFillColor] = useState('#3b82f6');

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
          const s = wbResponse.data.whiteboard.strokes;
          setStrokes(s);
          setHistory([s]);
          setHistoryIndex(0);
          setPages([{ strokes: s, history: [s], historyIndex: 0, stickyNotes: [] }]);
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

    // Screen share frame (image data from sharer)
    socket.on('screen-share-frame', (data) => {
      setRemoteScreenShare(prev => ({
        ...prev,
        userId: data.userId,
        username: data.username,
        frame: data.frame
      }));
    });

    // File sharing
    socket.on('file-shared', (data) => {
      setMessages(prev => [...prev, data.message]);
      if (!showChat) {
        setUnreadMessages(prev => prev + 1);
      }
    });

    // Heartbeat — keep online status alive
    const heartbeatInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit('heartbeat');
      }
    }, 15000);

    // Camera events
    socket.on('camera-frame', (data) => {
      setRemoteCameras(prev => ({
        ...prev,
        [data.userId]: { username: data.username, frame: data.frame }
      }));
    });

    socket.on('camera-started', (data) => {
      setRemoteCameras(prev => ({
        ...prev,
        [data.userId]: { username: data.username, frame: null }
      }));
    });

    socket.on('camera-stopped', (data) => {
      setRemoteCameras(prev => {
        const next = { ...prev };
        delete next[data.userId];
        return next;
      });
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
      socket.off('screen-share-frame');
      socket.off('file-shared');
      socket.off('camera-frame');
      socket.off('camera-started');
      socket.off('camera-stopped');
      clearInterval(heartbeatInterval);
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

  // Add sticky note
  const handleAddStickyNote = useCallback(() => {
    const offset = (stickyNotes.length % 5) * 30;
    setStickyNotes(prev => [...prev, {
      id: Date.now().toString(),
      text: '',
      x: 120 + offset,
      y: 80 + offset,
      color: { name: 'Yellow', bg: '#FEF3C7', border: '#F59E0B', text: '#92400E' },
      width: 180, height: 140, editing: true,
    }]);
  }, [stickyNotes.length]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      // Don't capture when user is typing in an input/textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const ctrl = e.ctrlKey || e.metaKey;

      if (e.key === '?') { setShowShortcuts(s => !s); return; }
      if (e.key === 'Escape') { setShowShortcuts(false); return; }

      if (ctrl && e.key === 'z') { e.preventDefault(); handleUndo(); return; }
      if (ctrl && e.key === 'y') { e.preventDefault(); handleRedo(); return; }

      const shortcuts = {
        'p': 'pencil', 'e': 'eraser', 't': 'text', 'l': 'laser',
        'm': 'marker', 'h': 'highlighter', 'r': 'rectangle',
        'c': 'circle', 'a': 'arrow',
      };
      if (shortcuts[e.key.toLowerCase()]) { setTool(shortcuts[e.key.toLowerCase()]); return; }

      if (e.key === '=' || e.key === '+') { e.preventDefault(); handleZoomIn(); }
      if (e.key === '-') { e.preventDefault(); handleZoomOut(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleUndo, handleRedo]);

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

  // ─── Page Management ───
  const saveCurrentPage = useCallback(() => {
    setPages(prev => {
      const updated = [...prev];
      updated[currentPage] = { strokes, history, historyIndex, stickyNotes };
      return updated;
    });
  }, [currentPage, strokes, history, historyIndex, stickyNotes]);

  const switchPage = useCallback((idx) => {
    if (idx === currentPage || idx < 0 || idx >= pages.length) return;
    // Save current page
    setPages(prev => {
      const updated = [...prev];
      updated[currentPage] = { strokes, history, historyIndex, stickyNotes };
      return updated;
    });
    // Load target page
    const target = pages[idx];
    setStrokes(target.strokes);
    setHistory(target.history);
    setHistoryIndex(target.historyIndex);
    setStickyNotes(target.stickyNotes);
    setCurrentPage(idx);
  }, [currentPage, pages, strokes, history, historyIndex, stickyNotes]);

  const addPage = useCallback(() => {
    // Save current page first
    setPages(prev => {
      const updated = [...prev];
      updated[currentPage] = { strokes, history, historyIndex, stickyNotes };
      updated.push({ strokes: [], history: [[]], historyIndex: 0, stickyNotes: [] });
      return updated;
    });
    // Switch to new page
    const newIdx = pages.length;
    setStrokes([]);
    setHistory([[]]);
    setHistoryIndex(0);
    setStickyNotes([]);
    setCurrentPage(newIdx);
    pageCountRef.current = newIdx + 1;
  }, [currentPage, pages, strokes, history, historyIndex, stickyNotes]);

  const deletePage = useCallback((idx) => {
    if (pages.length <= 1) return; // Don't delete last page
    if (!confirm(`Delete page ${idx + 1}?`)) return;
    setPages(prev => {
      const updated = [...prev];
      updated.splice(idx, 1);
      return updated;
    });
    const newIdx = idx >= pages.length - 1 ? idx - 1 : idx;
    const target = pages[newIdx === idx ? (idx === 0 ? 1 : idx - 1) : newIdx];
    if (target) {
      setStrokes(target.strokes);
      setHistory(target.history);
      setHistoryIndex(target.historyIndex);
      setStickyNotes(target.stickyNotes);
    }
    setCurrentPage(Math.min(newIdx, pages.length - 2));
  }, [pages, strokes, history, historyIndex, stickyNotes]);

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

            {/* Camera */}
            <button
              onClick={() => setShowCamera(!showCamera)}
              className={`p-2 rounded-xl transition ${
                showCamera 
                  ? 'bg-green-100 dark:bg-green-900/60 text-green-600 dark:text-green-400' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}
              title={showCamera ? 'Close Camera' : 'Open Camera'}
            >
              {showCamera ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>

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
          eraserSize={eraserSize}
          setEraserSize={setEraserSize}
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
          sidebarWidth={sidebarWidth}
          onSidebarResize={setSidebarWidth}
          gridMode={gridMode}
          onGridModeChange={setGridMode}
          onAddStickyNote={handleAddStickyNote}
          fillEnabled={fillEnabled}
          fillColor={fillColor}
          onToggleFill={() => setFillEnabled(f => !f)}
          onFillColorChange={setFillColor}
        />

        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden">
          <Canvas
            ref={canvasRef}
            strokes={strokes}
            setStrokes={setStrokes}
            tool={tool}
            color={color}
            brushSize={tool === 'eraser' ? eraserSize : brushSize}
            roomId={roomId}
            canDraw={userRole === 'host' || room?.settings?.allowParticipantDraw}
            remoteCursors={remoteCursors}
            addToHistory={addToHistory}
            canvasDark={canvasDark}
            zoom={zoom}
            gridMode={gridMode}
            fillEnabled={fillEnabled}
            fillColor={fillColor}
          />

          {/* Sticky Notes */}
          <StickyNoteOverlay notes={stickyNotes} setNotes={setStickyNotes} />

          {/* ── Page Bar ── */}
          {pages.length > 0 && (
            <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-center py-2 px-4">
              <div className="flex items-center gap-1 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/80 dark:border-gray-700/80 px-2 py-1.5">
                {pages.map((page, idx) => (
                  <button
                    key={idx}
                    onClick={() => switchPage(idx)}
                    className={`group relative flex items-center justify-center min-w-[36px] h-8 px-2.5 rounded-xl text-xs font-semibold transition-all ${
                      idx === currentPage
                        ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-md shadow-blue-500/30 scale-105'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
                    title={`Page ${idx + 1}${page.strokes.length > 0 ? ` · ${page.strokes.length} strokes` : ' · Empty'}`}
                  >
                    {idx + 1}
                    {/* Stroke indicator dot */}
                    {page.strokes.length > 0 && idx !== currentPage && (
                      <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-blue-500 rounded-full" />
                    )}
                    {/* Delete on hover (for non-active pages, only if > 1 page) */}
                    {pages.length > 1 && idx !== currentPage && (
                      <span
                        onClick={(e) => { e.stopPropagation(); deletePage(idx); }}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 cursor-pointer shadow"
                        title={`Delete page ${idx + 1}`}
                      >
                        ×
                      </span>
                    )}
                  </button>
                ))}

                {/* Add page button */}
                <button
                  onClick={addPage}
                  className="flex items-center justify-center w-8 h-8 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-500 dark:text-blue-400 transition-all hover:scale-110 active:scale-95 ml-0.5"
                  title="Add new page"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>

                {/* Page count */}
                <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />
                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium whitespace-nowrap">
                  {currentPage + 1}/{pages.length}
                </span>
              </div>
            </div>
          )}

          {/* Remote Screen Share Viewer */}
          {remoteScreenShare && (
            <div className={`absolute z-30 shadow-2xl rounded-xl overflow-hidden border border-blue-500/40 transition-all ${
              screenShareExpanded 
                ? 'inset-4' 
                : 'bottom-4 right-4 max-w-sm'
            }`}>
              <div className="flex items-center justify-between px-3 py-1.5 bg-blue-600 text-white">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  <span className="text-xs font-medium">{remoteScreenShare.username}'s Screen</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setScreenShareExpanded(!screenShareExpanded)}
                    className="p-0.5 hover:bg-blue-700 rounded transition" title={screenShareExpanded ? 'Minimize' : 'Expand'}>
                    {screenShareExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => { setRemoteScreenShare(null); setScreenShareExpanded(false); }}
                    className="text-white/70 hover:text-white text-xs ml-1">✕</button>
                </div>
              </div>
              {remoteScreenShare.frame ? (
                <img src={remoteScreenShare.frame} alt="Shared screen"
                  className={`w-full h-auto bg-gray-900 ${screenShareExpanded ? 'max-h-[calc(100vh-120px)] object-contain' : ''}`}
                  style={screenShareExpanded ? {} : { maxWidth: 360 }} />
              ) : (
                <div className="bg-gray-900 px-4 py-6 text-center text-white/50 text-xs">
                  Waiting for screen...
                </div>
              )}
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
            activeUsers={activeUsers}
            currentUserId={user?.id || user?._id}
            onClose={() => setShowSettings(false)}
          />
        )}
      </div>

      {/* Video Call Bar — Google Meet style */}
      {showCamera && (
        <VideoCall
          roomId={roomId}
          remoteCameras={remoteCameras}
          onClose={() => setShowCamera(false)}
        />
      )}

      {/* Screen Share — floating PiP, no longer blocks canvas */}
      {showScreenShare && (
        <ScreenShare
          roomId={roomId}
          onClose={handleStopScreenShare}
        />
      )}

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setShowShortcuts(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700 animate-modal" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Keyboard className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Keyboard Shortcuts</h2>
              </div>
              <button onClick={() => setShowShortcuts(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="p-5 space-y-1.5 max-h-[60vh] overflow-y-auto">
              {[
                ['P', 'Pencil tool'],
                ['M', 'Marker tool'],
                ['H', 'Highlighter tool'],
                ['E', 'Eraser tool'],
                ['T', 'Text tool'],
                ['L', 'Laser pointer'],
                ['R', 'Rectangle'],
                ['C', 'Circle'],
                ['A', 'Arrow'],
                ['Ctrl + Z', 'Undo'],
                ['Ctrl + Y', 'Redo'],
                ['+', 'Zoom in'],
                ['−', 'Zoom out'],
                ['?', 'Toggle shortcuts'],
                ['Esc', 'Close modals'],
              ].map(([key, desc]) => (
                <div key={key} className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-gray-600 dark:text-gray-300">{desc}</span>
                  <div className="flex gap-1">
                    {key.split(' + ').map(k => (
                      <span key={k} className="kbd">{k}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-center">
              <p className="text-xs text-gray-400">Press <span className="kbd">?</span> anytime to toggle this panel</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Settings Panel Component — with per-user permissions
const SettingsPanel = ({ room, roomId, activeUsers, currentUserId, onClose }) => {
  const { updateSettings } = useSocket();
  const [settings, setSettings] = useState(room?.settings || {});
  const [userPerms, setUserPerms] = useState({});

  const handleToggle = (key) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    updateSettings(roomId, newSettings);
  };

  const handleUserPerm = (userId, perm) => {
    setUserPerms(prev => {
      const user = prev[userId] || {};
      const updated = { ...prev, [userId]: { ...user, [perm]: !user[perm] } };
      // Send user-level permissions via settings
      const newSettings = { ...settings, userPermissions: updated };
      setSettings(newSettings);
      updateSettings(roomId, newSettings);
      return updated;
    });
  };

  // Initialize per-user perms from room settings
  useState(() => {
    if (room?.settings?.userPermissions) {
      setUserPerms(room.settings.userPermissions);
    }
  });

  const globalSettings = [
    { key: 'allowParticipantDraw', label: 'Allow Drawing (All)', desc: 'Default drawing permission for all participants' },
    { key: 'allowChat', label: 'Allow Chat', desc: 'Enable real-time messaging' },
    { key: 'allowScreenShare', label: 'Allow Screen Share (All)', desc: 'Default screen share permission for all participants' },
    { key: 'allowFileShare', label: 'Allow File Share', desc: 'Enable file sharing in chat' },
  ];

  const participants = activeUsers.filter(u => {
    const uid = u.userId || u.id || u._id;
    return String(uid) !== String(currentUserId);
  });

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col overflow-y-auto">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-white">Room Settings</h3>
        <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Global Settings */}
      <div className="p-4 space-y-3">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Global Defaults</p>
        {globalSettings.map(item => (
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
              <div className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform"
                style={{ transform: settings[item.key] ? 'translateX(22px)' : 'translateX(2px)' }} />
            </button>
          </div>
        ))}
      </div>

      {/* Per-User Permissions */}
      {participants.length > 0 && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Per-User Permissions</p>
          {participants.map(u => {
            const uid = String(u.userId || u.id || u._id);
            const perms = userPerms[uid] || {};
            const canDraw = perms.canDraw !== undefined ? perms.canDraw : settings.allowParticipantDraw;
            const canShare = perms.canShare !== undefined ? perms.canShare : settings.allowScreenShare;

            return (
              <div key={uid} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/40 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                    {(u.username || 'U')[0].toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{u.username || 'User'}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Can Draw</span>
                  <button onClick={() => handleUserPerm(uid, 'canDraw')}
                    className={`relative w-9 h-5 rounded-full transition-colors ${canDraw ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                    <div className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform"
                      style={{ transform: canDraw ? 'translateX(18px)' : 'translateX(2px)' }} />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Can Share Screen</span>
                  <button onClick={() => handleUserPerm(uid, 'canShare')}
                    className={`relative w-9 h-5 rounded-full transition-colors ${canShare ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                    <div className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform"
                      style={{ transform: canShare ? 'translateX(18px)' : 'translateX(2px)' }} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WhiteboardRoom;
