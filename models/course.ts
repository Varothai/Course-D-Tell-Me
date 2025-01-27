import mongoose from "mongoose"

const courseSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true }
}, {
  timestamps: true
})

export const Course = mongoose.models.Course || mongoose.model('Course', courseSchema) 