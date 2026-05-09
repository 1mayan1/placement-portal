/**
 * GET /api/student/applications
 * Returns all applications for the logged-in student, with full job details attached.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Application from "@/models/Application";
import Student from "@/models/Student";
import Job from "@/models/Job";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  await connectDB();

  const student = await Student.findOne({ userId: session.user.id }).lean();
  if (!student) {
    return NextResponse.json({ applications: [] });
  }

  const applications = await Application.find({ studentId: student._id })
    .sort({ appliedAt: -1 })
    .lean();

  // Fetch all the jobs in one query instead of N separate queries
  const jobIds = applications.map((a) => a.jobId);
  const jobs = await Job.find({ _id: { $in: jobIds } }).lean();
  const jobMap = new Map(jobs.map((j) => [j._id.toString(), j]));

  const result = applications.map((app) => ({
    _id: app._id,
    status: app.status,
    appliedAt: app.appliedAt,
    matchScore: app.matchScore,
    job: jobMap.get(app.jobId.toString()) ?? null,
  }));

  return NextResponse.json({ applications: result });
}
