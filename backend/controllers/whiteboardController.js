import Whiteboard from '../models/Whiteboard.js';
import Room from '../models/Room.js';

// Get whiteboard data for a room
export const getWhiteboard = async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Check if user is a participant
    const isParticipant = room.participants.some(
      p => p.user.toString() === req.user.id
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant of this room'
      });
    }

    let whiteboard = await Whiteboard.findOne({ room: room._id });

    // Create whiteboard if it doesn't exist
    if (!whiteboard) {
      whiteboard = await Whiteboard.create({ room: room._id });
    }

    res.json({
      success: true,
      data: { whiteboard }
    });
  } catch (error) {
    console.error('Get whiteboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get whiteboard',
      error: error.message
    });
  }
};

// Save whiteboard strokes
export const saveStrokes = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { strokes } = req.body;

    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Check if user is a participant with draw permission
    const participant = room.participants.find(
      p => p.user.toString() === req.user.id
    );

    if (!participant) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant of this room'
      });
    }

    // Check if participant can draw
    if (participant.role !== 'host' && !room.settings.allowParticipantDraw) {
      return res.status(403).json({
        success: false,
        message: 'Drawing is disabled for participants'
      });
    }

    const whiteboard = await Whiteboard.findOneAndUpdate(
      { room: room._id },
      { 
        $push: { strokes: { $each: strokes } },
        $inc: { version: 1 }
      },
      { new: true, upsert: true }
    );

    // Update room last activity
    room.lastActivity = new Date();
    await room.save();

    res.json({
      success: true,
      message: 'Strokes saved successfully',
      data: { version: whiteboard.version }
    });
  } catch (error) {
    console.error('Save strokes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save strokes',
      error: error.message
    });
  }
};

// Clear whiteboard
export const clearWhiteboard = async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Only host can clear whiteboard
    if (room.host.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the host can clear the whiteboard'
      });
    }

    const whiteboard = await Whiteboard.findOneAndUpdate(
      { room: room._id },
      { 
        strokes: [],
        $inc: { version: 1 }
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Whiteboard cleared successfully',
      data: { version: whiteboard.version }
    });
  } catch (error) {
    console.error('Clear whiteboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear whiteboard',
      error: error.message
    });
  }
};

// Save snapshot
export const saveSnapshot = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { imageData, name } = req.body;

    if (!imageData) {
      return res.status(400).json({
        success: false,
        message: 'Image data is required'
      });
    }

    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Check if user is a participant
    const isParticipant = room.participants.some(
      p => p.user.toString() === req.user.id
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant of this room'
      });
    }

    const whiteboard = await Whiteboard.findOneAndUpdate(
      { room: room._id },
      {
        $push: {
          snapshots: {
            imageData,
            name: name || `Snapshot ${new Date().toLocaleString()}`,
            createdBy: req.user.id
          }
        }
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Snapshot saved successfully',
      data: { 
        snapshotCount: whiteboard.snapshots.length 
      }
    });
  } catch (error) {
    console.error('Save snapshot error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save snapshot',
      error: error.message
    });
  }
};

// Get snapshots
export const getSnapshots = async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    const whiteboard = await Whiteboard.findOne({ room: room._id })
      .populate('snapshots.createdBy', 'username');

    res.json({
      success: true,
      data: { 
        snapshots: whiteboard?.snapshots || [] 
      }
    });
  } catch (error) {
    console.error('Get snapshots error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get snapshots',
      error: error.message
    });
  }
};

// Undo last stroke
export const undoStroke = async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    const whiteboard = await Whiteboard.findOne({ room: room._id });
    
    if (!whiteboard || whiteboard.strokes.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nothing to undo'
      });
    }

    // Remove the last stroke
    whiteboard.strokes.pop();
    whiteboard.version += 1;
    await whiteboard.save();

    res.json({
      success: true,
      message: 'Undo successful',
      data: { version: whiteboard.version }
    });
  } catch (error) {
    console.error('Undo stroke error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to undo',
      error: error.message
    });
  }
};
