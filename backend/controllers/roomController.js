import Room from '../models/Room.js';
import Whiteboard from '../models/Whiteboard.js';
import User from '../models/User.js';

// Create a new room
export const createRoom = async (req, res) => {
  try {
    const { name, isPrivate, password, maxParticipants, settings } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Room name is required'
      });
    }

    // Create room
    const room = await Room.create({
      name,
      host: req.user.id,
      isPrivate: isPrivate || false,
      password: isPrivate ? password : undefined,
      maxParticipants: maxParticipants || 10,
      settings: settings || {},
      participants: [{
        user: req.user.id,
        role: 'host'
      }]
    });

    // Create associated whiteboard
    await Whiteboard.create({
      room: room._id
    });

    // Add room to user's created rooms
    await User.findByIdAndUpdate(req.user.id, {
      $push: { createdRooms: room._id }
    });

    // Populate host info
    await room.populate('host', 'username email avatar');

    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      data: { room }
    });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create room',
      error: error.message
    });
  }
};

// Join a room
export const joinRoom = async (req, res) => {
  try {
    const { roomId, password } = req.body;

    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: 'Room ID is required'
      });
    }

    const room = await Room.findOne({ roomId }).select('+password');

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    if (!room.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Room is no longer active'
      });
    }

    // Check if room is full
    if (room.participants.length >= room.maxParticipants) {
      return res.status(400).json({
        success: false,
        message: 'Room is full'
      });
    }

    // Check password for private rooms
    if (room.isPrivate && room.password) {
      if (!password || password !== room.password) {
        return res.status(401).json({
          success: false,
          message: 'Invalid room password'
        });
      }
    }

    // Check if user is already in the room
    const isParticipant = room.participants.some(
      p => p.user.toString() === req.user.id
    );

    if (!isParticipant) {
      room.participants.push({
        user: req.user.id,
        role: 'participant'
      });
      await room.save();

      // Add to user's joined rooms
      await User.findByIdAndUpdate(req.user.id, {
        $addToSet: { joinedRooms: room._id }
      });
    }

    // Populate and return room
    await room.populate('host', 'username email avatar');
    await room.populate('participants.user', 'username email avatar');

    res.json({
      success: true,
      message: 'Joined room successfully',
      data: { 
        room: {
          ...room.toObject(),
          password: undefined
        }
      }
    });
  } catch (error) {
    console.error('Join room error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join room',
      error: error.message
    });
  }
};

// Get room by ID
export const getRoom = async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findOne({ roomId })
      .populate('host', 'username email avatar')
      .populate('participants.user', 'username email avatar')
      .populate('activeUsers', 'username email avatar');

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Check if user is a participant
    const isParticipant = room.participants.some(
      p => p.user._id.toString() === req.user.id
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant of this room'
      });
    }

    // Get user's role
    const participant = room.participants.find(
      p => p.user._id.toString() === req.user.id
    );

    res.json({
      success: true,
      data: { 
        room,
        userRole: participant?.role || 'participant'
      }
    });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get room',
      error: error.message
    });
  }
};

// Get all rooms for current user
export const getMyRooms = async (req, res) => {
  try {
    const rooms = await Room.find({
      'participants.user': req.user.id,
      isActive: true
    })
      .populate('host', 'username email avatar')
      .sort({ lastActivity: -1 });

    res.json({
      success: true,
      data: { rooms }
    });
  } catch (error) {
    console.error('Get my rooms error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get rooms',
      error: error.message
    });
  }
};

// Update room settings
export const updateRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { name, settings, maxParticipants } = req.body;

    const room = await Room.findOne({ roomId });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Check if user is host
    if (room.host.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the host can update room settings'
      });
    }

    if (name) room.name = name;
    if (settings) room.settings = { ...room.settings, ...settings };
    if (maxParticipants) room.maxParticipants = maxParticipants;

    await room.save();

    res.json({
      success: true,
      message: 'Room updated successfully',
      data: { room }
    });
  } catch (error) {
    console.error('Update room error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update room',
      error: error.message
    });
  }
};

// Leave room
export const leaveRoom = async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findOne({ roomId });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Remove user from participants
    room.participants = room.participants.filter(
      p => p.user.toString() !== req.user.id
    );
    room.activeUsers = room.activeUsers.filter(
      u => u.toString() !== req.user.id
    );

    await room.save();

    // Remove from user's joined rooms
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { joinedRooms: room._id }
    });

    res.json({
      success: true,
      message: 'Left room successfully'
    });
  } catch (error) {
    console.error('Leave room error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to leave room',
      error: error.message
    });
  }
};

// Delete room (host only)
export const deleteRoom = async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findOne({ roomId });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Check if user is host
    if (room.host.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the host can delete the room'
      });
    }

    // Soft delete - just mark as inactive
    room.isActive = false;
    await room.save();

    res.json({
      success: true,
      message: 'Room deleted successfully'
    });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete room',
      error: error.message
    });
  }
};

// Update participant role (host only)
export const updateParticipantRole = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { participantId, role } = req.body;

    const room = await Room.findOne({ roomId });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Check if user is host
    if (room.host.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the host can update participant roles'
      });
    }

    // Find and update participant role
    const participant = room.participants.find(
      p => p.user.toString() === participantId
    );

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Participant not found'
      });
    }

    participant.role = role;
    await room.save();

    res.json({
      success: true,
      message: 'Participant role updated successfully',
      data: { room }
    });
  } catch (error) {
    console.error('Update participant role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update participant role',
      error: error.message
    });
  }
};

// Kick participant (host only)
export const kickParticipant = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { participantId } = req.body;

    const room = await Room.findOne({ roomId });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Check if user is host
    if (room.host.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the host can kick participants'
      });
    }

    // Cannot kick the host
    if (participantId === room.host.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot kick the host'
      });
    }

    // Remove participant
    room.participants = room.participants.filter(
      p => p.user.toString() !== participantId
    );
    room.activeUsers = room.activeUsers.filter(
      u => u.toString() !== participantId
    );

    await room.save();

    res.json({
      success: true,
      message: 'Participant kicked successfully',
      data: { room }
    });
  } catch (error) {
    console.error('Kick participant error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to kick participant',
      error: error.message
    });
  }
};
