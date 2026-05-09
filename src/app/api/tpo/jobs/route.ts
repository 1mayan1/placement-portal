/**
 * GET  /api/tpo/jobs  — list all jobs (TPO only)
 * POST /api/tpo/jobs  — create a new job (TPO only)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Job from "@/models/Job";
import Application from "@/models/Application";

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "tpo") {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  await connectDB();

  const jobs = await Job.find({ postedBy: session.user.id })
    .sort({ createdAt: -1 }) // newest first
    .lean();

  // Add the application count for each job so the TPO can see interest
  const jobsWithCount = await Promise.all(
    jobs.map(async (job) => {
      const count = await Application.countDocuments({ jobId: job._id });
      return { ...job, applicationCount: count };
    })
  );

  return NextResponse.json({ jobs: jobsWithCount });
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "tpo") {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const body = await req.json();
  const { title, company, description, packageStr, eligibility, deadline } = body;

  // Basic validation
  if (!title || !company || !description || !deadline) {
    return NextResponse.json(
      { error: "Title, company, description, and deadline are required" },
      { status: 400 }
    );
  }

  if (new Date(deadline) <= new Date()) {
    return NextResponse.json(
      { error: "Deadline must be in the future" },
      { status: 400 }
    );
  }

  await connectDB();

  const job = await Job.create({
    title,
    company,
    description,
    package: packageStr || "Not disclosed",
    eligibility: {
      branches: Array.isArray(eligibility?.branches) ? eligibility.branches : [],
      minCGPA: Number(eligibility?.minCGPA) || 0,
      maxBacklogs: Number(eligibility?.maxBacklogs) || 0,
    },
    deadline: new Date(deadline),
    postedBy: session.user.id,
    status: "open",
  });

  return NextResponse.json({ message: "Job posted successfully", job }, { status: 201 });
}
