/**
 * PUT /api/tpo/applications/[id]
 * Updates the status of one application.
 * Allowed transitions: applied → shortlisted → selected / rejected
 * TPO can also restore a rejected application back to "applied".
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Application from "@/models/Application";
import Job from "@/models/Job";

type Params = { params: { id: string } };

const VALID_STATUSES = ["applied", "shortlisted", "selected", "rejected"];

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "tpo") {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { status } = await req.json();

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
  }

  await connectDB();

  const application = await Application.findById(params.id);
  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  // Make sure this application belongs to a job posted by the logged-in TPO
  const job = await Job.findOne({ _id: application.jobId, postedBy: session.user.id });
  if (!job) {
    return NextResponse.json({ error: "Unauthorised — not your job" }, { status: 403 });
  }

  application.status = status;
  await application.save();

  return NextResponse.json({ message: "Status updated", status });
}
