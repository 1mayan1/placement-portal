/**
 * GET /api/student/jobs
 *
 * Returns all open jobs, each annotated with:
 *   - isEligible: whether this student meets the criteria
 *   - ineligibleReasons: why not (empty array if eligible)
 *   - hasApplied: whether the student has already applied
 *   - applicationStatus: "applied" | "shortlisted" | etc. (null if not applied)
 *
 * Eligibility is computed server-side so the student's CGPA/backlogs never
 * need to be sent to the frontend explicitly.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Job from "@/models/Job";
import Student from "@/models/Student";
import Application from "@/models/Application";
import { checkEligibility } from "@/lib/eligibility";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  await connectDB();

  // Fetch the student's own profile to compute eligibility
  const student = await Student.findOne({ userId: session.user.id }).lean();

  const studentProfile = {
    branch: student?.branch ?? "",
    cgpa: student?.cgpa ?? 0,
    backlogs: student?.backlogs ?? 0,
  };

  // Fetch all open jobs, sorted newest first
  const jobs = await Job.find({ status: "open" })
    .sort({ createdAt: -1 })
    .lean();

  // Fetch this student's existing applications to mark already-applied jobs
  const applications = student
    ? await Application.find({ studentId: student._id }).lean()
    : [];

  const appliedMap = new Map(
    applications.map((a) => [a.jobId.toString(), a.status])
  );

  // Annotate each job with eligibility and application state
  const annotated = jobs.map((job) => {
    const { eligible, reasons } = checkEligibility(studentProfile, job);
    const jobIdStr = job._id.toString();

    return {
      ...job,
      isEligible: eligible,
      ineligibleReasons: reasons,
      hasApplied: appliedMap.has(jobIdStr),
      applicationStatus: appliedMap.get(jobIdStr) ?? null,
    };
  });

  return NextResponse.json({ jobs: annotated, studentProfile });
}
