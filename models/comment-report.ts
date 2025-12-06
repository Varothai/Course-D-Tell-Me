import mongoose from 'mongoose'

const commentReportSchema = new mongoose.Schema({
  commentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  commentType: {
    type: String,
    required: true,
    enum: ['review', 'qa'],
    index: true
  },
  reporterId: {
    type: String,
    required: true
  },
  reason: {
    type: String,
    required: true,
    enum: ['inappropriate', 'spam', 'harassment', 'misinformation', 'other']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

// Create a compound index to prevent duplicate reports
commentReportSchema.index({ commentId: 1, commentType: 1, reporterId: 1 }, { unique: true })

export const CommentReport = mongoose.models.CommentReport || mongoose.model('CommentReport', commentReportSchema)

