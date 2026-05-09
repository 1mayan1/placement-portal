/**
 * POST /api/student/resume/analyze
 * Runs the ATS scorer on the student's stored resume text.
 * Saves the resulting score to the Student document and returns the full result.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Student from "@/models/Student";
import { scoreResume } from "@/lib/claude";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  await connectDB();

  const student = await Student.findOne({ userId: session.user.id });
  if (!student) {
    return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
  }

  if (!student.resumeText || student.resumeText.trim().length < 50) {
    return NextResponse.json(
      { error: "No resume found. Please upload your resume first." },
      { status: 400 }
    );
  }

  let result;
  try {
    result = await scoreResume(student.resumeText);
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  await Student.findOneAndUpdate(
    { userId: session.user.id },
    { $set: { atsScore: result.score } }
  );

  return NextResponse.json(result);
}
