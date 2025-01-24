import mongoose from "mongoose"

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  userName: {
    type: String,
    default: "Anonymous",
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
    }).toUpperCase()
  },
  likes: {
    type: Number,
    default: 0
  },
  dislikes: {
    type: Number,
    default: 0
  },
  isBookmarked: {
    type: Boolean,
    default: false
  },
  comments: {
    type: [String],
    default: []
  }
}, { 
  versionKey: false,
  collection: 'questions'
})

export const Question = mongoose.models.Question || mongoose.model("Question", questionSchema)