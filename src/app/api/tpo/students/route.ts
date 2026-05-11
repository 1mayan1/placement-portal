import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Student from "@/models/Student";
import Application from "@/models/Application";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "tpo") {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  await connectDB();

  const [students, appCounts] = await Promise.all([
    Student.find({}).populate("userId", "name email").lean(),
    Application.aggregate([
      { $group: { _id: "$studentId", count: { $sum: 1 } } },
    ]),
  ]);

  const countMap = new Map<string, number>(
    appCounts.map((a) => [a._id.toString(), a.count as number])
  );

  const result = students.map((student) => {
    const user = student.userId as unknown as
      | { name: string; email: string }
      | null;
    const id = (student._id as { toString(): string }).toString();
    return {
      _id: id,
      name: user?.name ?? "",
      email: user?.email ?? "",
      rollNumber: student.rollNumber ?? "",
      branch: student.branch ?? "",
      semester: student.semester ?? 0,
      cgpa: student.cgpa ?? 0,
      backlogs: student.backlogs ?? 0,
      skills: student.skills ?? [],
      education: student.education ?? [],
      projects: student.projects ?? [],
      isPlaced: student.isPlaced ?? false,
      placementInfo: student.placementInfo
        ? {
            company: student.placementInfo.company ?? "",
            package: student.placementInfo.package ?? "",
            date: student.placementInfo.date
              ? (student.placementInfo.date as Date).toISOString()
              : null,
          }
        : null,
      applicationCount: countMap.get(id) ?? 0,
      hasResume: Boolean(student.resumeText),
    };
  });

  return NextResponse.json({ students: result });
}
