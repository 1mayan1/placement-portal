/**
 * MockInterview model — stores AI interview sessions for students.
 * Each session has 5 questions with the student's answers and AI feedback.
 */

import mongoose, { Schema, Document, Types } from "mongoose";

const QuestionSchema = new Schema(
  {
    q: String, // The question asked by AI
    answer: String, // Student's typed answer
    feedback: String, // AI feedback on this specific answer
    score: Number, // Score out of 10 for this answer
  },
  { _id: false }
);

export interface IMockInterview extends Document {
  studentId: Types.ObjectId;
  jobRole: string; // e.g., "Full Stack Developer at TCS"
  questions: {
    q: string;
    answer: string;
    feedback: string;
    score: number;
  }[];
  overallScore: number | null; // Set after all 5 answers are submitted
  isCompleted: boolean;
}

const MockInterviewSchema = new Schema<IMockInterview>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    jobRole: { type: String, required: true },
    questions: [QuestionSchema],
    overallScore: { type: Number, default: null },
    isCompleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.MockInterview ||
  mongoose.model<IMockInterview>("MockInterview", MockInterviewSchema);
