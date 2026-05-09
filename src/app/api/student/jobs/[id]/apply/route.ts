/**
 * POST /api/student/jobs/[id]/apply
 *
 * Creates an Application record. Enforces:
 *   - Student must be eligible (branch / CGPA / backlogs)
 *   - Student cannot apply twice to the same job
 *   - Job must still be open and deadline not passed
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Job from "@/models/Job";
import Student from "@/models/Student";
import Application from "@/models/Application";
import { checkEligibility } from "@/lib/eligibility";

type Params = { params: { id: string } };

export async function POST(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  await connectDB();

  const job = await Job.findById(params.id).lean();
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  if (job.status === "closed") {
    return NextResponse.json({ error: "This job is no longer accepting applications" }, { status: 400 });
  }

  if (new Date(job.deadline) < new Date()) {
    return NextResponse.json({ error: "The application deadline has passed" }, { status: 400 });
  }

  const student = await Student.findOne({ userId: session.user.id }).lean();
  if (!student) {
    return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
  }

  // Enforce eligibility — the button should already be disabled on the frontend,
  // but we check again here so the API can never be bypassed
  const { eligible, reasons } = checkEligibility(
    { branch: student.branch, cgpa: student.cgpa, backlogs: student.backlogs },
    job
  );

  if (!eligible) {
    return NextResponse.json(
      { error: `You are not eligible: ${reasons.join("; ")}` },
      { status: 403 }
    );
  }

  // Prevent duplicate applications (the unique index on Application also catches this)
  const existing = await Application.findOne({ studentId: student._id, jobId: params.id });
  if (existing) {
    return NextResponse.json({ error: "You have already applied to this job" }, { status: 409 });
  }

  const application = await Application.create({
    studentId: student._id,
    jobId: params.id,
    status: "applied",
  });

  return NextResponse.json(
    { message: "Application submitted successfully", application },
    { status: 201 }
  );
}
