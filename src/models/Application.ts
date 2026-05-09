/**
 * Application model — tracks which student applied to which job.
 * Status is updated by the TPO as they review candidates.
 */

import mongoose, { Schema, Document, Types } from "mongoose";

export interface IApplication extends Document {
  studentId: Types.ObjectId; // Which student applied
  jobId: Types.ObjectId; // Which job they applied to
  matchScore: number | null; // AI-calculated resume-to-JD match % (set at apply time)
  status: "applied" | "shortlisted" | "selected" | "rejected";
  appliedAt: Date;
}

const ApplicationSchema = new Schema<IApplication>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true },
    matchScore: { type: Number, default: null },
    status: {
      type: String,
      enum: ["applied", "shortlisted", "selected", "rejected"],
      default: "applied",
    },
    appliedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Compound unique index: a student can only apply to a job once
ApplicationSchema.index({ studentId: 1, jobId: 1 }, { unique: true });

export default mongoose.models.Application ||
  mongoose.model<IApplication>("Application", ApplicationSchema);
