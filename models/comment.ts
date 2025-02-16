import mongoose from "mongoose"

const commentSchema = new mongoose.Schema({
  reviewId: {
    type: String,
    required: true,
    index: true
  },
  comment: {
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
  createdAt: {
    type: Date,
    default: Date.now
  }
})

export const Comment = mongoose.models.Comment || mongoose.model('Comment', commentSchema) 