/**
 * Notification model — in-app alerts for students.
 * e.g., "New job posted matching your profile", "You were shortlisted"
 */

import mongoose, { Schema, Document, Types } from "mongoose";

export interface INotification extends Document {
  studentId: Types.ObjectId;
  type: "job_alert" | "shortlisted" | "rejected" | "placed" | "announcement";
  message: string;
  isRead: boolean;
}

const NotificationSchema = new Schema<INotification>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    type: {
      type: String,
      enum: ["job_alert", "shortlisted", "rejected", "placed", "announcement"],
      required: true,
    },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Notification ||
  mongoose.model<INotification>("Notification", NotificationSchema);
