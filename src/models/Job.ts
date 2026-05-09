/**
 * Job model — represents a placement drive posted by the TPO.
 * Students see only "open" jobs and are filtered by eligibility.
 */

import mongoose, { Schema, Document, Types } from "mongoose";

export interface IJob extends Document {
  title: string; // e.g., "Software Engineer Intern"
  company: string; // e.g., "Infosys"
  description: string; // Full job description (JD)
  package: string; // e.g., "4.5 LPA" (LPA = Lakhs Per Annum)
  eligibility: {
    branches: string[]; // e.g., ["MCA", "BCA"] — who can apply
    minCGPA: number; // Minimum CGPA required
    maxBacklogs: number; // Maximum allowed backlogs (0 means no backlogs allowed)
  };
  deadline: Date; // Last date to apply
  postedBy: Types.ObjectId; // Reference to the TPO User who posted this
  status: "open" | "closed"; // TPO can close a job to stop applications
}

const JobSchema = new Schema<IJob>(
  {
    title: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    package: { type: String, required: true },
    eligibility: {
      branches: [{ type: String }],
      minCGPA: { type: Number, required: true },
      maxBacklogs: { type: Number, required: true },
    },
    deadline: { type: Date, required: true },
    postedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["open", "closed"], default: "open" },
  },
  { timestamps: true }
);

export default mongoose.models.Job || mongoose.model<IJob>("Job", JobSchema);
