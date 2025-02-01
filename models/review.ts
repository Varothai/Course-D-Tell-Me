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
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true })

// Add this to ensure all fields are returned in the response
reviewSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
})

// Rename the interface to avoid naming conflict
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
  timestamp: Date;
}

// Export the model as a named export
export const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema) 