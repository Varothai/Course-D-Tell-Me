import mongoose from "mongoose"

const draftSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  courseId: { type: String, default: "" },
  courseName: { type: String, default: "" },
  rating: { type: Number, default: 0 },
  review: { type: String, default: "" },
  faculty: { type: String, default: "" },
  major: { type: String, default: "" },
  customMajor: { type: String, default: "" },
  studyPlan: { type: String, default: "" },
  section: { type: String, default: "" },
  programType: { type: String, default: "" },
  electiveType: { type: String, default: "none" },
  readingAmount: { type: Number, default: 0 },
  contentDifficulty: { type: Number, default: 0 },
  teachingQuality: { type: Number, default: 0 },
  grade: { type: String, default: "" },
  isAnonymous: { type: Boolean, default: false },
  lastSaved: { type: Date, default: Date.now }
}, {
  timestamps: true,
  autoIndex: true
})

draftSchema.index({ userId: 1, lastSaved: -1 })

draftSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
})

export interface IDraft {
  _id: string;
  userId: string;
  courseId: string;
  courseName: string;
  rating: number;
  review: string;
  faculty: string;
  major: string;
  customMajor?: string;
  studyPlan: string;
  section: string;
  programType: string;
  electiveType: string;
  readingAmount: number;
  contentDifficulty: number;
  teachingQuality: number;
  grade?: string;
  isAnonymous: boolean;
  lastSaved: Date;
}

export const Draft = mongoose.models.Draft || mongoose.model('Draft', draftSchema)

