/**
 * POST /api/student/interview/start
 * Body: { role: string }
 *
 * 1. Generates 5 role-specific questions via Claude
 * 2. Creates a new MockInterview session in MongoDB (status: in_progress)
 * 3. Returns the sessionId + question list so the frontend can begin
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Student from "@/models/Student";
import MockInterview from "@/models/MockInterview";
import { generateInterviewQuestions } from "@/lib/claude";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  let body: { role?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const role = body.role?.trim();
  if (!role || role.length < 2) {
    return NextResponse.json(
      { error: "Please specify a valid role (at least 2 characters)." },
      { status: 400 }
    );
  }

  await connectDB();

  const student = await Student.findOne({ userId: session.user.id });
  if (!student) {
    return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
  }

  let generatedQuestions: string[];
  try {
    generatedQuestions = await generateInterviewQuestions(role);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate questions";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  // Ensure exactly 5 questions
  const questionList = generatedQuestions.slice(0, 5);

  const interview = await MockInterview.create({
    studentId: student._id,
    jobRole: role,
    questions: questionList.map((q) => ({
      q,
      answer: "",
      feedback: "",
      score: 0,
    })),
    overallScore: null,
    isCompleted: false,
  });

  return NextResponse.json({
    sessionId: interview._id.toString(),
    questions: questionList,
  });
}
