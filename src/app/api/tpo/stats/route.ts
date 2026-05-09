/**
 * GET /api/tpo/stats
 * Returns live summary numbers for the TPO dashboard.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Student from "@/models/Student";
import Job from "@/models/Job";
import Application from "@/models/Application";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "tpo") {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  await connectDB();

  // Run all four counts in parallel for speed
  const [totalStudents, openJobs, totalApplications, studentsPlaced] =
    await Promise.all([
      Student.countDocuments(),
      Job.countDocuments({ status: "open" }),
      Application.countDocuments(),
      Student.countDocuments({ isPlaced: true }),
    ]);

  return NextResponse.json({
    totalStudents,
    openJobs,
    totalApplications,
    studentsPlaced,
  });
}
