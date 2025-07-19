import mongoose, { Schema } from 'mongoose';
import type { IUrl } from '@repo/types';

const UrlSchema: Schema = new Schema({
  originalUrl: { type: String, required: true },
  shortCode: { type: String, required: true, unique: true },
  clicks: { type: Number, default: 0 },
  userId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IUrl>('Url', UrlSchema);
