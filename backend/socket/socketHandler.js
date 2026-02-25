import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Room from '../models/Room.js';
import Message from '../models/Message.js';
import Whiteboard from '../models/Whiteboard.js';

// Store active connections
const activeConnections = new Map();

export default (io) => {
  // Middleware to authenticate socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'jwt-secret-key');
      const user = await User.findById(decoded.id);

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.username} (${socket.id})`);

    // Store connection
    activeConnections.set(socket.id, {
      user: socket.user,
      rooms: new Set(),
      lastSeen: Date.now()
    });

    // Join room
    socket.on('join-room', async (roomId) => {
      try {
        const room = await Room.findOne({ roomId });

        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        // Check if user is a participant
        const isParticipant = room.participants.some(
          p => p.user.toString() === socket.user._id.toString()
        );

        if (!isParticipant) {
          socket.emit('error', { message: 'You are not a participant of this room' });
          return;
        }

        // Join the socket room
        socket.join(roomId);
        activeConnections.get(socket.id).rooms.add(roomId);

        // Add to active users in room
        if (!room.activeUsers.includes(socket.user._id)) {
          room.activeUsers.push(socket.user._id);
          await room.save();
        }

        // Get whiteboard data
        const whiteboard = await Whiteboard.findOne({ room: room._id });

        // Get participant's role
        const participant = room.participants.find(
          p => p.user.toString() === socket.user._id.toString()
        );

        // Send current whiteboard state to the joining user
        socket.emit('room-joined', {
          roomId,
          whiteboard: whiteboard?.strokes || [],
          role: participant?.role || 'participant',
          settings: room.settings
        });

        // Notify others in the room
        socket.to(roomId).emit('user-joined', {
          user: {
            id: socket.user._id,
            username: socket.user.username,
            avatar: socket.user.avatar
          }
        });

        // Send updated active users list
        const populatedRoom = await Room.findOne({ roomId })
          .populate('activeUsers', 'username avatar');

        io.to(roomId).emit('active-users', {
          users: populatedRoom.activeUsers
        });

        console.log(`User ${socket.user.username} joined room ${roomId}`);
      } catch (error) {
        console.error('Join room error:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // Leave room
    socket.on('leave-room', async (roomId) => {
      await handleLeaveRoom(socket, roomId);
    });

    // Drawing events
    socket.on('draw', async (data) => {
      const { roomId, stroke } = data;

      // Broadcast to all other users in the room
      socket.to(roomId).emit('draw', {
        stroke,
        userId: socket.user._id,
        username: socket.user.username
      });
    });

    // Draw start event
    socket.on('draw-start', (data) => {
      const { roomId, point, color, brushSize, tool } = data;
      socket.to(roomId).emit('draw-start', {
        point,
        color,
        brushSize,
        tool,
        userId: socket.user._id
      });
    });

    // Draw move event for real-time line drawing
    socket.on('draw-move', (data) => {
      const { roomId, point } = data;
      socket.to(roomId).emit('draw-move', {
        point,
        userId: socket.user._id
      });
    });

    // Draw end event
    socket.on('draw-end', async (data) => {
      const { roomId, stroke } = data;

      socket.to(roomId).emit('draw-end', {
        stroke,
        userId: socket.user._id
      });

      // Save stroke to database
      if (stroke) {
        try {
          const room = await Room.findOne({ roomId });
          if (room) {
            await Whiteboard.findOneAndUpdate(
              { room: room._id },
              {
                $push: { strokes: { ...stroke, userId: socket.user._id } },
                $inc: { version: 1 }
              },
              { upsert: true }
            );
          }
        } catch (error) {
          console.error('Save stroke error:', error);
        }
      }
    });

    // Clear board event
    socket.on('clear-board', async (roomId) => {
      try {
        const room = await Room.findOne({ roomId });

        // Only host can clear
        if (room.host.toString() !== socket.user._id.toString()) {
          socket.emit('error', { message: 'Only the host can clear the board' });
          return;
        }

        // Clear strokes in database
        await Whiteboard.findOneAndUpdate(
          { room: room._id },
          { strokes: [], $inc: { version: 1 } }
        );

        // Broadcast clear event to all users in room
        io.to(roomId).emit('board-cleared');
      } catch (error) {
        console.error('Clear board error:', error);
        socket.emit('error', { message: 'Failed to clear board' });
      }
    });

    // Undo event
    socket.on('undo', async (roomId) => {
      try {
        const room = await Room.findOne({ roomId });
        const whiteboard = await Whiteboard.findOne({ room: room._id });

        if (whiteboard && whiteboard.strokes.length > 0) {
          // Remove the last stroke by this user
          const lastStrokeIndex = whiteboard.strokes.findLastIndex(
            s => s.userId?.toString() === socket.user._id.toString()
          );

          if (lastStrokeIndex !== -1) {
            whiteboard.strokes.splice(lastStrokeIndex, 1);
            whiteboard.version += 1;
            await whiteboard.save();

            // Broadcast updated strokes
            io.to(roomId).emit('strokes-updated', {
              strokes: whiteboard.strokes
            });
          }
        }
      } catch (error) {
        console.error('Undo error:', error);
        socket.emit('error', { message: 'Failed to undo' });
      }
    });

    // Chat message
    socket.on('chat-message', async (data) => {
      const { roomId, content, type = 'text' } = data;

      try {
        const room = await Room.findOne({ roomId });

        if (!room || !room.settings.allowChat) {
          socket.emit('error', { message: 'Chat is disabled' });
          return;
        }

        // Create and save message
        const message = await Message.create({
          room: room._id,
          sender: socket.user._id,
          content,
          type
        });

        await message.populate('sender', 'username avatar');

        // Broadcast to all users in room
        io.to(roomId).emit('chat-message', {
          message: {
            _id: message._id,
            content: message.content,
            type: message.type,
            sender: message.sender,
            createdAt: message.createdAt
          }
        });
      } catch (error) {
        console.error('Chat message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicator
    socket.on('typing-start', (roomId) => {
      socket.to(roomId).emit('user-typing', {
        user: {
          id: socket.user._id,
          username: socket.user.username
        }
      });
    });

    socket.on('typing-stop', (roomId) => {
      socket.to(roomId).emit('user-stopped-typing', {
        userId: socket.user._id
      });
    });

    // Cursor position for presence
    socket.on('cursor-move', (data) => {
      const { roomId, position } = data;
      socket.to(roomId).emit('cursor-move', {
        userId: socket.user._id,
        username: socket.user.username,
        position
      });
    });

    // Screen share signaling
    socket.on('screen-share-offer', (data) => {
      const { roomId, offer, targetUserId } = data;
      socket.to(roomId).emit('screen-share-offer', {
        offer,
        fromUserId: socket.user._id,
        fromUsername: socket.user.username
      });
    });

    socket.on('screen-share-answer', (data) => {
      const { roomId, answer, targetUserId } = data;
      io.to(roomId).emit('screen-share-answer', {
        answer,
        fromUserId: socket.user._id
      });
    });

    socket.on('ice-candidate', (data) => {
      const { roomId, candidate, targetUserId } = data;
      socket.to(roomId).emit('ice-candidate', {
        candidate,
        fromUserId: socket.user._id
      });
    });

    socket.on('screen-share-started', (roomId) => {
      socket.to(roomId).emit('screen-share-started', {
        userId: socket.user._id,
        username: socket.user.username
      });
    });

    socket.on('screen-share-stopped', (roomId) => {
      socket.to(roomId).emit('screen-share-stopped', {
        userId: socket.user._id
      });
    });

    // Screen share frame relay — broadcast captured frames to room
    socket.on('screen-share-frame', (data) => {
      const { roomId, frame } = data;
      socket.to(roomId).emit('screen-share-frame', {
        frame,
        userId: socket.user._id,
        username: socket.user.username
      });
    });

    // Heartbeat — keep user alive
    socket.on('heartbeat', () => {
      const conn = activeConnections.get(socket.id);
      if (conn) conn.lastSeen = Date.now();
    });

    // File sharing
    socket.on('file-share', async (data) => {
      const { roomId, fileData } = data;

      try {
        const room = await Room.findOne({ roomId });

        if (!room.settings.allowFileShare) {
          socket.emit('error', { message: 'File sharing is disabled' });
          return;
        }

        // Create file message
        const message = await Message.create({
          room: room._id,
          sender: socket.user._id,
          content: fileData.fileName,
          type: 'file',
          fileData
        });

        await message.populate('sender', 'username avatar');

        io.to(roomId).emit('file-shared', {
          message: {
            _id: message._id,
            content: message.content,
            type: message.type,
            sender: message.sender,
            fileData: message.fileData,
            createdAt: message.createdAt
          }
        });
      } catch (error) {
        console.error('File share error:', error);
        socket.emit('error', { message: 'Failed to share file' });
      }
    });

    // Room settings update
    socket.on('update-settings', async (data) => {
      const { roomId, settings } = data;

      try {
        const room = await Room.findOne({ roomId });

        if (room.host.toString() !== socket.user._id.toString()) {
          socket.emit('error', { message: 'Only the host can update settings' });
          return;
        }

        room.settings = { ...room.settings, ...settings };
        await room.save();

        io.to(roomId).emit('settings-updated', { settings: room.settings });
      } catch (error) {
        console.error('Update settings error:', error);
        socket.emit('error', { message: 'Failed to update settings' });
      }
    });

    // Kick user
    socket.on('kick-user', async (data) => {
      const { roomId, userId } = data;

      try {
        const room = await Room.findOne({ roomId });

        if (room.host.toString() !== socket.user._id.toString()) {
          socket.emit('error', { message: 'Only the host can kick users' });
          return;
        }

        // Prevent host from kicking themselves
        if (userId === socket.user._id.toString()) {
          socket.emit('error', { message: 'You cannot kick yourself' });
          return;
        }

        // Remove from participants
        room.participants = room.participants.filter(
          p => p.user.toString() !== userId
        );
        room.activeUsers = room.activeUsers.filter(
          u => u.toString() !== userId
        );
        await room.save();

        // Notify the kicked user
        io.to(roomId).emit('user-kicked', { userId });
      } catch (error) {
        console.error('Kick user error:', error);
        socket.emit('error', { message: 'Failed to kick user' });
      }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.user.username} (${socket.id})`);

      const connection = activeConnections.get(socket.id);

      if (connection) {
        // Leave all rooms
        for (const roomId of connection.rooms) {
          await handleLeaveRoom(socket, roomId);
        }

        activeConnections.delete(socket.id);
      }
    });
  });

  // Helper function to handle leaving a room
  async function handleLeaveRoom(socket, roomId) {
    try {
      socket.leave(roomId);

      const connection = activeConnections.get(socket.id);
      if (connection) {
        connection.rooms.delete(roomId);
      }

      const room = await Room.findOne({ roomId });

      if (room) {
        // Remove from active users
        room.activeUsers = room.activeUsers.filter(
          u => u.toString() !== socket.user._id.toString()
        );
        await room.save();

        // Notify others
        socket.to(roomId).emit('user-left', {
          user: {
            id: socket.user._id,
            username: socket.user.username
          }
        });

        // Send updated active users list
        const populatedRoom = await Room.findOne({ roomId })
          .populate('activeUsers', 'username avatar');

        io.to(roomId).emit('active-users', {
          users: populatedRoom?.activeUsers || []
        });
      }

      console.log(`User ${socket.user.username} left room ${roomId}`);
    } catch (error) {
      console.error('Leave room error:', error);
    }
  }
};
