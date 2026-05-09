/**
 * POST /api/student/resume/compare
 * Body: { jobDescription: string }
 * Compares the student's resume against a pasted job description.
 * Returns matching skills, missing skills, match score, and improvement tips.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Student from "@/models/Student";
import { compareResumeWithJD } from "@/lib/claude";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  let body: { jobDescription?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { jobDescription } = body;
  if (!jobDescription || jobDescription.trim().length < 30) {
    return NextResponse.json(
      { error: "Please provide a job description (at least 30 characters)." },
      { status: 400 }
    );
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
    result = await compareResumeWithJD(student.resumeText, jobDescription);
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI comparison failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json(result);
}
