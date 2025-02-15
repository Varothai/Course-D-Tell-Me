import mongoose from "mongoose"

const reviewSchema = new mongoose.Schema({
  courseId: { type: String, required: true },
  courseName: { type: String, required: true },
  userName: { type: String, required: true },
  rating: { type: Number, required: true },
  review: { type: String, required: true },
  faculty: { type: String, required: true },
  major: { type: String, required: true },
  studyPlan: { type: String, required: true },
  section: { type: String, required: true },
  programType: { type: String, required: true },
  electiveType: { type: String, required: true },
  readingAmount: { type: Number, required: true },
  contentDifficulty: { type: Number, required: true },
  teachingQuality: { type: Number, required: true },
  grade: { type: String },
  customMajor: { type: String },
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
  bookmarkedBy: [{
    type: String,
    ref: 'User'
  }],
}, { 
  timestamps: false,
  autoIndex: true 
})

// Add index for timestamp
reviewSchema.index({ timestamp: -1 })

// Update the toJSON transform
reviewSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
})

// Update the interface
export interface IReview {
  _id: string;
  courseId: string;
  courseName: string;
  userName: string;
  rating: number;
  review: string;
  faculty: string;
  major: string;
  studyPlan: string;
  section: string;
  programType: string;
  electiveType: string;
  readingAmount: number;
  contentDifficulty: number;
  teachingQuality: number;
  timestamp: string;
  bookmarkedBy?: string[];
}

// Export the model as a named export
export const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema) 