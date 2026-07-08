import mongoose from 'mongoose';

const SessionSchema = new mongoose.Schema({
  userId: {
    type: String,
    default: 'anonymous'
  },
  duration: {
    type: Number,
    required: true
  }, // focused duration in minutes
  type: {
    type: String,
    enum: ['focus', 'short-break', 'long-break'],
    default: 'focus'
  },
  roomName: {
    type: String,
    default: 'Solo Space'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Session = mongoose.model('Session', SessionSchema);
export default Session;
