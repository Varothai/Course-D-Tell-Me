import mongoose from 'mongoose'

const reportSchema = new mongoose.Schema({
  reviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review',
    required: true
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
reportSchema.index({ reviewId: 1, reporterId: 1 }, { unique: true })

export const Report = mongoose.models.Report || mongoose.model('Report', reportSchema) 