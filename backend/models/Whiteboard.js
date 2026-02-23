const mongoose = require('mongoose');

const strokeSchema = new mongoose.Schema({
  points: [{
    x: Number,
    y: Number
  }],
  color: {
    type: String,
    default: '#000000'
  },
  brushSize: {
    type: Number,
    default: 2
  },
  tool: {
    type: String,
    enum: ['pencil', 'eraser', 'line', 'rectangle', 'circle'],
    default: 'pencil'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const whiteboardSchema = new mongoose.Schema({
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  strokes: [strokeSchema],
  snapshots: [{
    imageData: String,
    createdAt: {
      type: Date,
      default: Date.now
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String
  }],
  canvasWidth: {
    type: Number,
    default: 1920
  },
  canvasHeight: {
    type: Number,
    default: 1080
  },
  backgroundColor: {
    type: String,
    default: '#ffffff'
  },
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

// Index for faster room lookup
whiteboardSchema.index({ room: 1 });

module.exports = mongoose.model('Whiteboard', whiteboardSchema);
