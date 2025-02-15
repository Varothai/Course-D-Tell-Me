import { Types } from 'mongoose';

export interface Bookmark {
  _id?: string;
  userId: string;
  reviewId: string;
  createdAt: Date;
} 