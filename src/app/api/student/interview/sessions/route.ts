/**
 * GET /api/student/interview/sessions
 * Returns all completed mock interview sessions for the logged-in student,
 * including full Q&A so the frontend can render the history inline.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Student from "@/models/Student";
import MockInterview from "@/models/MockInterview";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  await connectDB();

  const student = await Student.findOne({ userId: session.user.id });
  if (!student) {
    return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
  }

  const sessions = await MockInterview.find({
    studentId: student._id,
    isCompleted: true,
  })
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ sessions });
}
