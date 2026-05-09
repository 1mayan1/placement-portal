/**
 * Student model — stores all academic and profile data.
 * Linked 1-to-1 with a User document via userId.
 * Most fields are auto-filled when the student uploads their resume.
 */

import mongoose, { Schema, Document, Types } from "mongoose";

// Sub-schema for education entries (e.g., B.Sc., 12th, 10th)
const EducationSchema = new Schema(
  {
    degree: String, // e.g., "BCA", "12th Standard"
    institution: String, // e.g., "XYZ College"
    year: String, // e.g., "2022"
    percentage: String, // e.g., "78.5%"
  },
  { _id: false } // Don't create a separate ID for each sub-document
);

// Sub-schema for projects listed on the resume
const ProjectSchema = new Schema(
  {
    title: String,
    description: String,
    technologies: [String], // e.g., ["React", "Node.js"]
  },
  { _id: false }
);

export interface IStudent extends Document {
  userId: Types.ObjectId; // Reference to the User who owns this profile
  rollNumber: string;
  branch: string; // e.g., "MCA", "MBA", "BCA"
  semester: number;
  cgpa: number; // 0.0 to 10.0
  backlogs: number; // Number of pending/failed subjects
  phone: string;
  skills: string[]; // e.g., ["Python", "SQL", "React"]
  education: {
    degree: string;
    institution: string;
    year: string;
    percentage: string;
  }[];
  projects: {
    title: string;
    description: string;
    technologies: string[];
  }[];
  certifications: string[]; // e.g., ["AWS Cloud Practitioner"]
  resumeFileId: Types.ObjectId | null; // GridFS file ID of uploaded resume PDF
  resumeText: string; // Plain text extracted from the PDF for AI processing
  atsScore: number | null; // AI-generated resume quality score (0–100)
  isPlaced: boolean;
  placementInfo: {
    company: string;
    package: string; // e.g., "6 LPA"
    date: Date;
  } | null;
}

const StudentSchema = new Schema<IStudent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rollNumber: { type: String, default: "" },
    branch: { type: String, default: "" },
    semester: { type: Number, default: 0 },
    cgpa: { type: Number, default: 0 },
    backlogs: { type: Number, default: 0 },
    phone: { type: String, default: "" },
    skills: [{ type: String }],
    education: [EducationSchema],
    projects: [ProjectSchema],
    certifications: [{ type: String }],
    resumeFileId: { type: Schema.Types.ObjectId, default: null },
    // Plain text extracted from the uploaded PDF — stored so AI routes can
    // read it without re-downloading and re-parsing the PDF every time.
    resumeText: { type: String, default: "" },
    atsScore: { type: Number, default: null },
    isPlaced: { type: Boolean, default: false },
    placementInfo: {
      type: {
        company: String,
        package: String,
        date: Date,
      },
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Student ||
  mongoose.model<IStudent>("Student", StudentSchema);
