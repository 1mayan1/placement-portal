import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Student from "@/models/Student";
import Application from "@/models/Application";

function parsePackageLPA(pkgStr: string): number | null {
  if (!pkgStr) return null;
  const match = pkgStr.match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : null;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "tpo") {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  await connectDB();

  const [branchAgg, appStatusAgg, timelineAgg, placedStudents, totalStudents] =
    await Promise.all([
      Student.aggregate([
        {
          $group: {
            _id: "$branch",
            total: { $sum: 1 },
            placed: { $sum: { $cond: ["$isPlaced", 1, 0] } },
          },
        },
        { $sort: { total: -1 } },
      ]),
      Application.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Student.aggregate([
        {
          $match: {
            isPlaced: true,
            "placementInfo.date": { $type: "date" },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m",
                date: "$placementInfo.date",
              },
            },
            placed: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Student.find(
        { isPlaced: true },
        {
          "placementInfo.company": 1,
          "placementInfo.package": 1,
          userId: 1,
        }
      )
        .populate("userId", "name")
        .lean(),
      Student.countDocuments(),
    ]);

  // ── Placement by branch ────────────────────────────────────────────────────
  const placementByBranch = branchAgg
    .filter((b) => b._id)
    .map((b) => ({
      branch: b._id as string,
      total: b.total as number,
      placed: b.placed as number,
      percentage:
        b.total > 0
          ? Math.round(((b.placed as number) / (b.total as number)) * 100)
          : 0,
    }));

  // ── Application status ─────────────────────────────────────────────────────
  const applicationStatus = appStatusAgg.map((a) => ({
    status: a._id as string,
    count: a.count as number,
  }));

  // ── Placement timeline ─────────────────────────────────────────────────────
  const placementTimeline = timelineAgg.map((t) => ({
    month: t._id as string,
    placed: t.placed as number,
  }));

  // ── Top recruiters + package stats ────────────────────────────────────────
  const companyMap = new Map<
    string,
    { count: number; packages: number[]; students: string[] }
  >();
  const allPackages: number[] = [];

  for (const s of placedStudents) {
    const company = s.placementInfo?.company;
    if (!company) continue;

    const pkg = parsePackageLPA(s.placementInfo?.package ?? "");
    if (pkg !== null) allPackages.push(pkg);

    const entry = companyMap.get(company) ?? {
      count: 0,
      packages: [],
      students: [],
    };
    entry.count++;
    if (pkg !== null) entry.packages.push(pkg);
    const user = s.userId as unknown as { name: string } | null;
    if (user?.name) entry.students.push(user.name);
    companyMap.set(company, entry);
  }

  const topRecruiters = Array.from(companyMap.entries())
    .map(([company, data]) => ({
      company,
      count: data.count,
      students: data.students,
      avgPackage:
        data.packages.length > 0
          ? Math.round(
              (data.packages.reduce((a, b) => a + b, 0) /
                data.packages.length) *
                10
            ) / 10
          : null,
      highestPackage:
        data.packages.length > 0 ? Math.max(...data.packages) : null,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  allPackages.sort((a, b) => a - b);

  const packageStats = {
    highest: allPackages.length > 0 ? Math.max(...allPackages) : null,
    lowest: allPackages.length > 0 ? Math.min(...allPackages) : null,
    average:
      allPackages.length > 0
        ? Math.round(
            (allPackages.reduce((a, b) => a + b, 0) / allPackages.length) * 10
          ) / 10
        : null,
    median:
      allPackages.length > 0
        ? allPackages.length % 2 === 0
          ? (allPackages[allPackages.length / 2 - 1] +
              allPackages[allPackages.length / 2]) /
            2
          : allPackages[Math.floor(allPackages.length / 2)]
        : null,
  };

  const packageDistribution = [
    { range: "0-5 LPA", count: allPackages.filter((p) => p < 5).length },
    {
      range: "5-10 LPA",
      count: allPackages.filter((p) => p >= 5 && p < 10).length,
    },
    {
      range: "10-15 LPA",
      count: allPackages.filter((p) => p >= 10 && p < 15).length,
    },
    { range: "15+ LPA", count: allPackages.filter((p) => p >= 15).length },
  ];

  return NextResponse.json({
    placementByBranch,
    applicationStatus,
    topRecruiters,
    packageStats,
    packageDistribution,
    placementTimeline,
    totalStudents,
    totalPlaced: placedStudents.length,
  });
}
