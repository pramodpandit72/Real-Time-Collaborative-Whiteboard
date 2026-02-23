import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3500', {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setConnected(false);
    });

    newSocket.on('error', (data) => {
      console.error('Socket error:', data.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  const joinRoom = useCallback((roomId) => {
    if (socket && connected) {
      socket.emit('join-room', roomId);
    }
  }, [socket, connected]);

  const leaveRoom = useCallback((roomId) => {
    if (socket && connected) {
      socket.emit('leave-room', roomId);
    }
  }, [socket, connected]);

  const sendDrawEvent = useCallback((roomId, stroke) => {
    if (socket && connected) {
      socket.emit('draw', { roomId, stroke });
    }
  }, [socket, connected]);

  const sendDrawStart = useCallback((roomId, point, color, brushSize, tool) => {
    if (socket && connected) {
      socket.emit('draw-start', { roomId, point, color, brushSize, tool });
    }
  }, [socket, connected]);

  const sendDrawMove = useCallback((roomId, point) => {
    if (socket && connected) {
      socket.emit('draw-move', { roomId, point });
    }
  }, [socket, connected]);

  const sendDrawEnd = useCallback((roomId, stroke) => {
    if (socket && connected) {
      socket.emit('draw-end', { roomId, stroke });
    }
  }, [socket, connected]);

  const clearBoard = useCallback((roomId) => {
    if (socket && connected) {
      socket.emit('clear-board', roomId);
    }
  }, [socket, connected]);

  const undo = useCallback((roomId) => {
    if (socket && connected) {
      socket.emit('undo', roomId);
    }
  }, [socket, connected]);

  const sendChatMessage = useCallback((roomId, content, type = 'text') => {
    if (socket && connected) {
      socket.emit('chat-message', { roomId, content, type });
    }
  }, [socket, connected]);

  const sendTypingStart = useCallback((roomId) => {
    if (socket && connected) {
      socket.emit('typing-start', roomId);
    }
  }, [socket, connected]);

  const sendTypingStop = useCallback((roomId) => {
    if (socket && connected) {
      socket.emit('typing-stop', roomId);
    }
  }, [socket, connected]);

  const sendCursorMove = useCallback((roomId, position) => {
    if (socket && connected) {
      socket.emit('cursor-move', { roomId, position });
    }
  }, [socket, connected]);

  const updateSettings = useCallback((roomId, settings) => {
    if (socket && connected) {
      socket.emit('update-settings', { roomId, settings });
    }
  }, [socket, connected]);

  const kickUser = useCallback((roomId, userId) => {
    if (socket && connected) {
      socket.emit('kick-user', { roomId, userId });
    }
  }, [socket, connected]);

  // Screen sharing
  const sendScreenShareOffer = useCallback((roomId, offer) => {
    if (socket && connected) {
      socket.emit('screen-share-offer', { roomId, offer });
    }
  }, [socket, connected]);

  const sendScreenShareAnswer = useCallback((roomId, answer) => {
    if (socket && connected) {
      socket.emit('screen-share-answer', { roomId, answer });
    }
  }, [socket, connected]);

  const sendIceCandidate = useCallback((roomId, candidate) => {
    if (socket && connected) {
      socket.emit('ice-candidate', { roomId, candidate });
    }
  }, [socket, connected]);

  const notifyScreenShareStarted = useCallback((roomId) => {
    if (socket && connected) {
      socket.emit('screen-share-started', roomId);
    }
  }, [socket, connected]);

  const notifyScreenShareStopped = useCallback((roomId) => {
    if (socket && connected) {
      socket.emit('screen-share-stopped', roomId);
    }
  }, [socket, connected]);

  // File sharing
  const shareFile = useCallback((roomId, fileData) => {
    if (socket && connected) {
      socket.emit('file-share', { roomId, fileData });
    }
  }, [socket, connected]);

  const value = {
    socket,
    connected,
    joinRoom,
    leaveRoom,
    sendDrawEvent,
    sendDrawStart,
    sendDrawMove,
    sendDrawEnd,
    clearBoard,
    undo,
    sendChatMessage,
    sendTypingStart,
    sendTypingStop,
    sendCursorMove,
    updateSettings,
    kickUser,
    sendScreenShareOffer,
    sendScreenShareAnswer,
    sendIceCandidate,
    notifyScreenShareStarted,
    notifyScreenShareStopped,
    shareFile
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
