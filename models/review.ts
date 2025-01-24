import mongoose from "mongoose"

const reviewSchema = new mongoose.Schema({
  courseId: { type: String, required: true },
  courseName: { type: String, required: true },
  userName: { type: String, required: true },
  rating: { type: Number, required: true },
  review: { type: String, required: true },
  faculty: String,
  major: String,
  studyPlan: String,
  section: String,
  readingAmount: Number,
  contentDifficulty: Number,
  teachingQuality: Number,
  likes: { type: Number, default: 0 },
  dislikes: { type: Number, default: 0 },
  comments: [String],
  isBookmarked: { type: Boolean, default: false },
}, { timestamps: true })

export const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema) 