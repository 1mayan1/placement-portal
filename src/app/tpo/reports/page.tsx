"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Loader2,
  BarChart2,
  TrendingUp,
  Trophy,
  Building2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlacementByBranch {
  branch: string;
  total: number;
  placed: number;
  percentage: number;
}

interface ApplicationStatus {
  status: string;
  count: number;
}

interface TopRecruiter {
  company: string;
  count: number;
  students: string[];
  avgPackage: number | null;
  highestPackage: number | null;
}

interface PackageStats {
  highest: number | null;
  lowest: number | null;
  average: number | null;
  median: number | null;
}

interface PackageDistribution {
  range: string;
  count: number;
}

interface PlacementTimeline {
  month: string;
  placed: number;
}

interface ReportsData {
  placementByBranch: PlacementByBranch[];
  applicationStatus: ApplicationStatus[];
  topRecruiters: TopRecruiter[];
  packageStats: PackageStats;
  packageDistribution: PackageDistribution[];
  placementTimeline: PlacementTimeline[];
  totalStudents: number;
  totalPlaced: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  applied: "#6366f1",
  shortlisted: "#f59e0b",
  selected: "#10b981",
  rejected: "#ef4444",
};

const BRANCH_COLOR = "#6366f1";

// ─── Custom pie tooltip ───────────────────────────────────────────────────────

interface PiePayloadItem {
  name: string;
  value: number;
  payload: { percent: number };
}

interface PieTooltipProps {
  active?: boolean;
  payload?: PiePayloadItem[];
}

function PieTooltip({ active, payload }: PieTooltipProps) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm shadow-md">
      <p className="font-medium capitalize text-gray-900">{entry.name}</p>
      <p className="text-gray-600">{entry.value} applications</p>
      <p className="text-gray-400 text-xs">
        {(entry.payload.percent * 100).toFixed(0)}% of total
      </p>
    </div>
  );
}

// ─── CSV export ───────────────────────────────────────────────────────────────

function exportReportsCSV(data: ReportsData) {
  const lines: string[] = [];
  const date = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  lines.push(`"Placement Reports Export","Generated: ${date}"`);
  lines.push("");

  lines.push("Package Statistics");
  lines.push("Metric,Value");
  lines.push(
    `Highest Package,${data.packageStats.highest != null ? data.packageStats.highest + " LPA" : "N/A"}`
  );
  lines.push(
    `Lowest Package,${data.packageStats.lowest != null ? data.packageStats.lowest + " LPA" : "N/A"}`
  );
  lines.push(
    `Average Package,${data.packageStats.average != null ? data.packageStats.average + " LPA" : "N/A"}`
  );
  lines.push(
    `Median Package,${data.packageStats.median != null ? data.packageStats.median + " LPA" : "N/A"}`
  );
  lines.push("");

  lines.push("Placement by Branch");
  lines.push("Branch,Total Students,Placed,Placement Rate");
  data.placementByBranch.forEach((b) => {
    lines.push(`${b.branch},${b.total},${b.placed},${b.percentage}%`);
  });
  lines.push("");

  lines.push("Application Status");
  lines.push("Status,Count");
  data.applicationStatus.forEach((s) => {
    lines.push(
      `${s.status.charAt(0).toUpperCase() + s.status.slice(1)},${s.count}`
    );
  });
  lines.push("");

  lines.push("Top Recruiters");
  lines.push("Company,Students Hired,Avg Package,Highest Package");
  data.topRecruiters.forEach((r) => {
    lines.push(
      `"${r.company}",${r.count},${r.avgPackage != null ? r.avgPackage + " LPA" : "N/A"},${r.highestPackage != null ? r.highestPackage + " LPA" : "N/A"}`
    );
  });

  const csv = lines.join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `placement_report_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tpo/reports")
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400 mr-2" />
        <span className="text-gray-500">Loading reports…</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-xl">
        <BarChart2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">Could not load reports</p>
      </div>
    );
  }

  const placementPct =
    data.totalStudents > 0
      ? Math.round((data.totalPlaced / data.totalStudents) * 100)
      : 0;

  const topRecruiter = data.topRecruiters[0];

  const statCards = [
    {
      label: "Total Placed",
      value: `${data.totalPlaced}`,
      sub: `${placementPct}% of ${data.totalStudents} students`,
      icon: Trophy,
      color: "text-green-500",
      bg: "bg-green-50",
    },
    {
      label: "Highest Package",
      value:
        data.packageStats.highest != null
          ? `${data.packageStats.highest} LPA`
          : "—",
      sub: "All-time record",
      icon: TrendingUp,
      color: "text-indigo-500",
      bg: "bg-indigo-50",
    },
    {
      label: "Average Package",
      value:
        data.packageStats.average != null
          ? `${data.packageStats.average} LPA`
          : "—",
      sub: "Across placed students",
      icon: BarChart2,
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      label: "Top Recruiter",
      value: topRecruiter?.company ?? "—",
      sub: topRecruiter ? `${topRecruiter.count} students hired` : "No placements yet",
      icon: Building2,
      color: "text-orange-500",
      bg: "bg-orange-50",
    },
  ];

  const statusData = data.applicationStatus.map((s) => ({
    ...s,
    name: s.status.charAt(0).toUpperCase() + s.status.slice(1),
  }));

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Placement Reports &amp; Analytics
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            All-time placement statistics ·{" "}
            {new Date().toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <Button
          onClick={() => exportReportsCSV(data)}
          variant="outline"
          className="gap-2 flex-shrink-0"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <Card key={card.label}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                    {card.value}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">
                    {card.sub}
                  </p>
                </div>
                <div
                  className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center flex-shrink-0`}
                >
                  <card.icon className={`w-4 h-4 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts 2×2 grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

        {/* Chart 1: Placement Rate by Branch */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-gray-800">
              Placement Rate by Branch
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.placementByBranch.length === 0 ? (
              <EmptyChart />
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.placementByBranch}
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="branch"
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={(v) => `${v}%`}
                      domain={[0, 100]}
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(value) => [`${value}%`, "Placement Rate"]}
                      cursor={{ fill: "#f0f0ff" }}
                    />
                    <Bar
                      dataKey="percentage"
                      fill={BRANCH_COLOR}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={60}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chart 2: Application Status Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-gray-800">
              Application Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length === 0 ? (
              <EmptyChart />
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="45%"
                      innerRadius={50}
                      outerRadius={85}
                      dataKey="count"
                      nameKey="name"
                      paddingAngle={2}
                    >
                      {statusData.map((entry) => (
                        <Cell
                          key={entry.status}
                          fill={STATUS_COLORS[entry.status] ?? "#6366f1"}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(value) => (
                        <span className="text-xs text-gray-600 capitalize">
                          {value}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chart 3: Top Recruiters (horizontal bar) */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-gray-800">
              Top Recruiters
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.topRecruiters.length === 0 ? (
              <EmptyChart />
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={data.topRecruiters}
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="company"
                      width={110}
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(value) => [
                        `${value} student${Number(value) !== 1 ? "s" : ""}`,
                        "Hired",
                      ]}
                      cursor={{ fill: "#f0f0ff" }}
                    />
                    <Bar
                      dataKey="count"
                      fill="#6366f1"
                      radius={[0, 4, 4, 0]}
                      maxBarSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chart 4: Package Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-gray-800">
              Package Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.packageDistribution.every((d) => d.count === 0) ? (
              <EmptyChart />
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.packageDistribution}
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="range"
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(value) => [
                        `${value} student${Number(value) !== 1 ? "s" : ""}`,
                        "Count",
                      ]}
                      cursor={{ fill: "#f0f0ff" }}
                    />
                    <Bar
                      dataKey="count"
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={60}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Recruiters table */}
      {data.topRecruiters.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-800">
              Recruiter Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left">
                    <th className="px-5 py-3 font-medium text-gray-600">
                      Company
                    </th>
                    <th className="px-5 py-3 font-medium text-gray-600">
                      Students Hired
                    </th>
                    <th className="px-5 py-3 font-medium text-gray-600">
                      Avg Package
                    </th>
                    <th className="px-5 py-3 font-medium text-gray-600">
                      Highest Package
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.topRecruiters.map((recruiter, i) => (
                    <tr
                      key={recruiter.company}
                      className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-5 py-3 font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          {i === 0 && (
                            <Trophy className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                          )}
                          {recruiter.company}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-700">
                        <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50">
                          {recruiter.count} student
                          {recruiter.count !== 1 ? "s" : ""}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-gray-700">
                        {recruiter.avgPackage != null
                          ? `${recruiter.avgPackage} LPA`
                          : "—"}
                      </td>
                      <td className="px-5 py-3 font-semibold text-gray-900">
                        {recruiter.highestPackage != null
                          ? `${recruiter.highestPackage} LPA`
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state for no placements at all */}
      {data.totalPlaced === 0 && (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-xl mt-6">
          <BarChart2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No placement data yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Charts will populate as students get placed
          </p>
        </div>
      )}
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="h-64 flex items-center justify-center">
      <p className="text-sm text-gray-400">No data available</p>
    </div>
  );
}
