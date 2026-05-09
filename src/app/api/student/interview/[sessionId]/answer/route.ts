/**
 * POST /api/student/interview/[sessionId]/answer
 * Body: { questionIndex: number, answer: string }
 *
 * Evaluates one answer with Claude and saves it to the session.
 * On the 5th answer (questionIndex === 4), marks the session completed
 * and computes the overall score (average × 10).
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Student from "@/models/Student";
import MockInterview from "@/models/MockInterview";
import { evaluateAnswer } from "@/lib/claude";

export async function POST(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  let body: { questionIndex?: number; answer?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { questionIndex, answer } = body;
  if (questionIndex === undefined || questionIndex < 0 || questionIndex > 4) {
    return NextResponse.json({ error: "Invalid questionIndex (must be 0–4)" }, { status: 400 });
  }
  if (!answer || answer.trim().length < 3) {
    return NextResponse.json({ error: "Answer is too short" }, { status: 400 });
  }

  await connectDB();

  const student = await Student.findOne({ userId: session.user.id });
  if (!student) {
    return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
  }

  const interview = await MockInterview.findOne({
    _id: params.sessionId,
    studentId: student._id,
    isCompleted: false,
  });

  if (!interview) {
    return NextResponse.json({ error: "Session not found or already completed" }, { status: 404 });
  }

  const question = interview.questions[questionIndex]?.q;
  if (!question) {
    return NextResponse.json({ error: "Question not found in session" }, { status: 400 });
  }

  let evaluation: { score: number; feedback: string };
  try {
    evaluation = await evaluateAnswer(question, answer.trim(), interview.jobRole);
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI evaluation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  // Save the answer + evaluation to the question slot
  const updateFields: Record<string, unknown> = {
    [`questions.${questionIndex}.answer`]: answer.trim(),
    [`questions.${questionIndex}.feedback`]: evaluation.feedback,
    [`questions.${questionIndex}.score`]: evaluation.score,
  };

  const isLastQuestion = questionIndex === 4;
  let overallScore: number | null = null;

  if (isLastQuestion) {
    // Compute overall score: average of all 5 sub-scores (each 1–10) → scale to 0–100
    const prevScores = interview.questions
      .slice(0, 4)
      .map((q: { score: number }) => q.score);
    const allScores = [...prevScores, evaluation.score];
    const avg = allScores.reduce((s: number, n: number) => s + n, 0) / allScores.length;
    overallScore = Math.round(avg * 10);

    updateFields.overallScore = overallScore;
    updateFields.isCompleted = true;
  }

  await MockInterview.findByIdAndUpdate(params.sessionId, { $set: updateFields });

  return NextResponse.json({
    score: evaluation.score,
    feedback: evaluation.feedback,
    isComplete: isLastQuestion,
    overallScore,
  });
}
