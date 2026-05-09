/**
 * PUT /api/tpo/students/[id]/place
 * Marks a student as placed — sets isPlaced=true and records company + package.
 * [id] here is the Student document _id (not the User _id).
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Student from "@/models/Student";

type Params = { params: { id: string } };

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "tpo") {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { company, packageStr } = await req.json();

  if (!company || !packageStr) {
    return NextResponse.json(
      { error: "Company name and package are required" },
      { status: 400 }
    );
  }

  await connectDB();

  const student = await Student.findByIdAndUpdate(
    params.id,
    {
      $set: {
        isPlaced: true,
        placementInfo: {
          company,
          package: packageStr,
          date: new Date(),
        },
      },
    },
    { new: true }
  );

  if (!student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  return NextResponse.json({
    message: `${company} placement recorded successfully`,
    placementInfo: student.placementInfo,
  });
}
