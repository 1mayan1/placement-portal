/**
 * GET  /api/student/profile  — fetch the logged-in student's profile
 * PUT  /api/student/profile  — update the logged-in student's profile
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Student from "@/models/Student";

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  await connectDB();

  const user = await User.findById(session.user.id).select("-passwordHash");
  const student = await Student.findOne({ userId: session.user.id });

  if (!user || !student) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // Merge user fields (name, email) with student fields into one response
  return NextResponse.json({
    name: user.name,
    email: user.email,
    rollNumber: student.rollNumber,
    branch: student.branch,
    semester: student.semester,
    cgpa: student.cgpa,
    backlogs: student.backlogs,
    phone: student.phone,
    skills: student.skills,
    education: student.education,
    projects: student.projects,
    certifications: student.certifications,
    resumeFileId: student.resumeFileId?.toString() ?? null,
    hasResume: !!(student.resumeText && student.resumeText.length > 50),
    atsScore: student.atsScore,
    isPlaced: student.isPlaced,
    placementInfo: student.placementInfo,
  });
}

// ── PUT ───────────────────────────────────────────────────────────────────────

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const body = await req.json();

  await connectDB();

  // Update the user's display name if it was changed
  if (body.name) {
    await User.findByIdAndUpdate(session.user.id, { name: body.name });
  }

  // Update the student profile — only allow safe fields (no userId tampering)
  await Student.findOneAndUpdate(
    { userId: session.user.id },
    {
      $set: {
        rollNumber: body.rollNumber ?? "",
        branch: body.branch ?? "",
        semester: Number(body.semester) || 0,
        cgpa: Number(body.cgpa) || 0,
        backlogs: Number(body.backlogs) || 0,
        phone: body.phone ?? "",
        skills: Array.isArray(body.skills) ? body.skills : [],
        education: Array.isArray(body.education) ? body.education : [],
        projects: Array.isArray(body.projects) ? body.projects : [],
        certifications: Array.isArray(body.certifications)
          ? body.certifications
          : [],
      },
    },
    { new: true }
  );

  return NextResponse.json({ message: "Profile saved successfully" });
}
