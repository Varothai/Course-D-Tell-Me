import mongoose from 'mongoose';

const bookmarkSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  reviewId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Create a compound index to prevent duplicate bookmarks
bookmarkSchema.index({ userId: 1, reviewId: 1 }, { unique: true });

export const Bookmark = mongoose.models.Bookmark || mongoose.model('Bookmark', bookmarkSchema); 