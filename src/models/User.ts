/**
 * User model — stores login credentials and role.
 * Every person who logs in has a User document.
 * Students also get a linked Student document (see Student.ts).
 */

import mongoose, { Schema, Document } from "mongoose";

// TypeScript interface: describes the shape of a User document
export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string; // We NEVER store plain passwords — always hashed
  role: "student" | "tpo"; // Only two roles in this system
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true, // No two users can share an email
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["student", "tpo"],
      required: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// Mongoose caches models — this pattern prevents "model already defined" errors
// when Next.js hot-reloads the file in development
export default mongoose.models.User ||
  mongoose.model<IUser>("User", UserSchema);
