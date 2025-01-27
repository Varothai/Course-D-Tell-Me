import mongoose, { Schema, Document } from 'mongoose';

interface CommentDocument extends Document {
  reviewId: string;
  comment: string;
  userName: string;
  createdAt: Date;
}

const CommentSchema = new Schema<CommentDocument>({
  reviewId: { type: String, required: true },
  comment: { type: String, required: true },
  userName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const Comment = mongoose.models.Comment || mongoose.model<CommentDocument>('Comment', CommentSchema); 