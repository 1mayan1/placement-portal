/**
 * GET  /api/tpo/jobs/[id]  — fetch a single job for editing
 * PUT  /api/tpo/jobs/[id]  — update job details or toggle open/closed
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Job from "@/models/Job";
import Application from "@/models/Application";

type Params = { params: { id: string } };

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "tpo") {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  await connectDB();

  const job = await Job.findOne({
    _id: params.id,
    postedBy: session.user.id, // TPOs can only see their own jobs
  }).lean();

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const applicationCount = await Application.countDocuments({ jobId: params.id });

  return NextResponse.json({ job: { ...job, applicationCount } });
}

// ── PUT ───────────────────────────────────────────────────────────────────────

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "tpo") {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const body = await req.json();

  await connectDB();

  // Make sure this job belongs to the logged-in TPO before allowing edits
  const existing = await Job.findOne({ _id: params.id, postedBy: session.user.id });
  if (!existing) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const updated = await Job.findByIdAndUpdate(
    params.id,
    {
      $set: {
        title: body.title ?? existing.title,
        company: body.company ?? existing.company,
        description: body.description ?? existing.description,
        package: body.packageStr ?? existing.package,
        eligibility: {
          branches: Array.isArray(body.eligibility?.branches)
            ? body.eligibility.branches
            : existing.eligibility.branches,
          minCGPA:
            body.eligibility?.minCGPA !== undefined
              ? Number(body.eligibility.minCGPA)
              : existing.eligibility.minCGPA,
          maxBacklogs:
            body.eligibility?.maxBacklogs !== undefined
              ? Number(body.eligibility.maxBacklogs)
              : existing.eligibility.maxBacklogs,
        },
        deadline: body.deadline ? new Date(body.deadline) : existing.deadline,
        status: body.status ?? existing.status,
      },
    },
    { new: true }
  );

  return NextResponse.json({ message: "Job updated", job: updated });
}
