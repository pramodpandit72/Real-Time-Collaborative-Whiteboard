import api from './api';

export const roomService = {
  createRoom: async (data) => {
    const response = await api.post('/rooms', data);
    return response.data;
  },

  joinRoom: async (roomId, password) => {
    const response = await api.post('/rooms/join', { roomId, password });
    return response.data;
  },

  getRoom: async (roomId) => {
    const response = await api.get(`/rooms/${roomId}`);
    return response.data;
  },

  getMyRooms: async () => {
    const response = await api.get('/rooms/my-rooms');
    return response.data;
  },

  updateRoom: async (roomId, data) => {
    const response = await api.put(`/rooms/${roomId}`, data);
    return response.data;
  },

  leaveRoom: async (roomId) => {
    const response = await api.post(`/rooms/${roomId}/leave`);
    return response.data;
  },

  deleteRoom: async (roomId) => {
    const response = await api.delete(`/rooms/${roomId}`);
    return response.data;
  },

  updateParticipantRole: async (roomId, participantId, role) => {
    const response = await api.put(`/rooms/${roomId}/participant-role`, { participantId, role });
    return response.data;
  },

  kickParticipant: async (roomId, participantId) => {
    const response = await api.post(`/rooms/${roomId}/kick`, { participantId });
    return response.data;
  }
};

export const whiteboardService = {
  getWhiteboard: async (roomId) => {
    const response = await api.get(`/whiteboard/${roomId}`);
    return response.data;
  },

  saveStrokes: async (roomId, strokes) => {
    const response = await api.post(`/whiteboard/${roomId}/strokes`, { strokes });
    return response.data;
  },

  clearWhiteboard: async (roomId) => {
    const response = await api.post(`/whiteboard/${roomId}/clear`);
    return response.data;
  },

  undoStroke: async (roomId) => {
    const response = await api.post(`/whiteboard/${roomId}/undo`);
    return response.data;
  },

  saveSnapshot: async (roomId, imageData, name) => {
    const response = await api.post(`/whiteboard/${roomId}/snapshot`, { imageData, name });
    return response.data;
  },

  getSnapshots: async (roomId) => {
    const response = await api.get(`/whiteboard/${roomId}/snapshots`);
    return response.data;
  }
};

export const chatService = {
  getMessages: async (roomId, limit = 50, before) => {
    const params = new URLSearchParams({ limit });
    if (before) params.append('before', before);
    const response = await api.get(`/rooms/${roomId}/messages?${params}`);
    return response.data;
  },

  sendMessage: async (roomId, content, type = 'text', fileData) => {
    const response = await api.post(`/rooms/${roomId}/messages`, { content, type, fileData });
    return response.data;
  },

  deleteMessage: async (messageId) => {
    const response = await api.delete(`/rooms/messages/${messageId}`);
    return response.data;
  }
};
