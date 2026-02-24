import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const roomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
    default: () => uuidv4().slice(0, 8).toUpperCase()
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['host', 'participant'],
      default: 'participant'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  activeUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isPrivate: {
    type: Boolean,
    default: false
  },
  password: {
    type: String,
    select: false
  },
  maxParticipants: {
    type: Number,
    default: 10
  },
  isActive: {
    type: Boolean,
    default: true
  },
  settings: {
    allowChat: {
      type: Boolean,
      default: true
    },
    allowParticipantDraw: {
      type: Boolean,
      default: true
    },
    allowScreenShare: {
      type: Boolean,
      default: true
    },
    allowFileShare: {
      type: Boolean,
      default: true
    }
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries (roomId already indexed via unique: true)
roomSchema.index({ host: 1 });

export default mongoose.model('Room', roomSchema);
