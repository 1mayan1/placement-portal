/**
 * GET /api/student/jobs/[id]
 * Returns full details of one job, plus this student's eligibility and apply status.
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

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  await connectDB();

  const job = await Job.findById(params.id).lean();
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const student = await Student.findOne({ userId: session.user.id }).lean();

  const studentProfile = {
    branch: student?.branch ?? "",
    cgpa: student?.cgpa ?? 0,
    backlogs: student?.backlogs ?? 0,
  };

  const { eligible, reasons } = checkEligibility(studentProfile, job);

  // Check if already applied
  let application = null;
  if (student) {
    application = await Application.findOne({
      studentId: student._id,
      jobId: params.id,
    }).lean();
  }

  return NextResponse.json({
    job,
    isEligible: eligible,
    ineligibleReasons: reasons,
    hasApplied: !!application,
    applicationStatus: application?.status ?? null,
    studentProfile,
  });
}
