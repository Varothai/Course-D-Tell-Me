import mongoose from "mongoose"

const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  userEmail: {
    type: String,
  },
  userProvider: {
    type: String,
    enum: ['google', 'cmu'],
  },
  timestamp: {
    type: String,
    default: () => new Date().toLocaleString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).toUpperCase(),
    immutable: true
  },
  reportCount: {
    type: Number,
    default: 0
  },
  isHidden: {
    type: Boolean,
    default: false
  }
})

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  userEmail: {
    type: String,
  },
  userProvider: {
    type: String,
    enum: ['google', 'cmu'],
  },
  timestamp: {
    type: String,
    default: () => new Date().toLocaleString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).toUpperCase(),
    immutable: true
  },
  isBookmarked: {
    type: Boolean,
    default: false
  },
  comments: [commentSchema]
}, { 
  versionKey: false,
  collection: 'questions',
  timestamps: false
})

export const Question = mongoose.models.Question || mongoose.model("Question", questionSchema)