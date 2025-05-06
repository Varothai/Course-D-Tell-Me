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
  timestamp: {
    type: Date,
    default: Date.now
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
  timestamp: {
    type: Date,
    default: Date.now
  },
  isBookmarked: {
    type: Boolean,
    default: false
  },
  comments: [commentSchema]
}, {
  timestamps: false // Disable automatic timestamp updates
})

export const Question = mongoose.models.Question || mongoose.model("Question", questionSchema)