import mongoose, { Schema, Document, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

// Updated IUser interface with proper _id type
import type { IUser } from '@repo/types';

type UserDocument = IUser &
  Document & {
    comparePassword(candidatePassword: string): Promise<boolean>;
  };

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, select: false },
  googleId: { type: String, unique: true, sparse: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

UserSchema.pre<UserDocument>('save', async function (next) {
  if (this.isModified('password') && this.password) {
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    } catch (err) {
      return next(err as Error);
    }
  }
  this.updatedAt = new Date();
  next();
});

UserSchema.methods.comparePassword = async function (
  this: UserDocument,
  candidatePassword: string,
): Promise<boolean> {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<UserDocument>('User', UserSchema);
