/**
 * POST /api/student/resume/match
 * Finds the top 5 open jobs that best match the student's resume.
 * Uses Claude to score relevance based on skills and experience.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Student from "@/models/Student";
import Job from "@/models/Job";
import { matchJobsToResume } from "@/lib/claude";

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

  const jobs = await Job.find({ status: "open" }).lean();

  if (jobs.length === 0) {
    return NextResponse.json({ matches: [] });
  }

  const jobInputs = jobs.map((j) => ({
    id: j._id.toString(),
    title: j.title,
    company: j.company,
    description: j.description,
  }));

  let matches;
  try {
    matches = await matchJobsToResume(student.resumeText, jobInputs);
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI matching failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  // Attach package info from DB to each match result
  const jobMap = new Map(jobs.map((j) => [j._id.toString(), j]));
  const enriched = matches.map((m) => ({
    ...m,
    package: jobMap.get(m.jobId)?.package ?? "",
  }));

  return NextResponse.json({ matches: enriched });
}
