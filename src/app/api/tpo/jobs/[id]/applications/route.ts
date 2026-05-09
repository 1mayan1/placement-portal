/**
 * GET /api/tpo/jobs/[id]/applications
 * Returns all applications for one specific job, with full student details merged in.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Application from "@/models/Application";
import Student from "@/models/Student";
import User from "@/models/User";
import Job from "@/models/Job";

type Params = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "tpo") {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  await connectDB();

  // Confirm this job belongs to the logged-in TPO
  const job = await Job.findOne({ _id: params.id, postedBy: session.user.id }).lean();
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const applications = await Application.find({ jobId: params.id })
    .sort({ appliedAt: -1 })
    .lean();

  if (applications.length === 0) {
    return NextResponse.json({ job, applications: [] });
  }

  // Batch-fetch all students and their user accounts
  const studentIds = applications.map((a) => a.studentId);
  const students = await Student.find({ _id: { $in: studentIds } }).lean();

  const userIds = students.map((s) => s.userId);
  const users = await User.find({ _id: { $in: userIds } })
    .select("name email")
    .lean();

  const studentMap = new Map(students.map((s) => [s._id.toString(), s]));
  const userMap = new Map(users.map((u) => [u._id.toString(), u]));

  // Merge into a flat shape the frontend can use directly
  const enriched = applications.map((app) => {
    const student = studentMap.get(app.studentId.toString());
    const user = student ? userMap.get(student.userId.toString()) : null;

    return {
      _id: app._id,
      status: app.status,
      appliedAt: app.appliedAt,
      matchScore: app.matchScore,
      student: student
        ? {
            _id: student._id,
            name: user?.name ?? "Unknown",
            email: user?.email ?? "",
            rollNumber: student.rollNumber,
            branch: student.branch,
            cgpa: student.cgpa,
            backlogs: student.backlogs,
            skills: student.skills,
            isPlaced: student.isPlaced,
            placementInfo: student.placementInfo,
          }
        : null,
    };
  });

  return NextResponse.json({ job, applications: enriched });
}
