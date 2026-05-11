"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Download,
  FileText,
  GraduationCap,
  Loader2,
  Search,
  Trophy,
  Users,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Education {
  degree: string;
  institution: string;
  year: string;
  percentage: string;
}

interface Project {
  title: string;
  description: string;
  technologies: string[];
}

interface StudentRow {
  _id: string;
  name: string;
  email: string;
  rollNumber: string;
  branch: string;
  semester: number;
  cgpa: number;
  backlogs: number;
  skills: string[];
  education: Education[];
  projects: Project[];
  isPlaced: boolean;
  placementInfo: {
    company: string;
    package: string;
    date: string | null;
  } | null;
  applicationCount: number;
  hasResume: boolean;
}

type SortField = "name" | "cgpa";
type StatusFilter = "all" | "placed" | "unplaced";

const PAGE_SIZE = 20;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function exportCSV(rows: StudentRow[]) {
  const headers = [
    "Name",
    "Email",
    "Roll No",
    "Branch",
    "Semester",
    "CGPA",
    "Backlogs",
    "Skills",
    "Status",
    "Applications",
    "Has Resume",
    "Company",
    "Package",
    "Placement Date",
  ];
  const data = rows.map((s) => [
    s.name,
    s.email,
    s.rollNumber,
    s.branch,
    s.semester,
    s.cgpa,
    s.backlogs,
    s.skills.join("; "),
    s.isPlaced ? "Placed" : "Active",
    s.applicationCount,
    s.hasResume ? "Yes" : "No",
    s.placementInfo?.company ?? "",
    s.placementInfo?.package ?? "",
    s.placementInfo?.date
      ? new Date(s.placementInfo.date).toLocaleDateString("en-IN")
      : "",
  ]);
  const csv = [headers, ...data]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `students_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Expanded profile ─────────────────────────────────────────────────────────

function ExpandedProfile({ student }: { student: StudentRow }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-1">
      {student.skills.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            All Skills
          </p>
          <div className="flex flex-wrap gap-1">
            {student.skills.map((skill) => (
              <span
                key={skill}
                className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {student.education.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Education
          </p>
          <div className="space-y-1">
            {student.education.map((edu, i) => (
              <div key={i} className="text-sm text-gray-700">
                <span className="font-medium">{edu.degree}</span>
                {edu.institution && ` — ${edu.institution}`}
                {edu.year && ` (${edu.year})`}
                {edu.percentage && `, ${edu.percentage}`}
              </div>
            ))}
          </div>
        </div>
      )}

      {student.projects.length > 0 && (
        <div className="md:col-span-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Projects
          </p>
          <div className="space-y-2">
            {student.projects.map((proj, i) => (
              <div key={i}>
                <span className="text-sm font-medium text-gray-900">
                  {proj.title}
                </span>
                {proj.description && (
                  <span className="text-sm text-gray-500">
                    {" "}
                    — {proj.description}
                  </span>
                )}
                {proj.technologies?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {proj.technologies.map((t) => (
                      <span
                        key={t}
                        className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {student.isPlaced && student.placementInfo && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Placement
          </p>
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-green-500 flex-shrink-0" />
            <span className="text-sm font-medium text-green-700">
              {student.placementInfo.company}
            </span>
            <span className="text-sm text-gray-500">
              — {student.placementInfo.package}
            </span>
            {student.placementInfo.date && (
              <span className="text-xs text-gray-400">
                {new Date(student.placementInfo.date).toLocaleDateString(
                  "en-IN",
                  { day: "numeric", month: "short", year: "numeric" }
                )}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AllStudentsPage() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortField, setSortField] = useState<SortField>("cgpa");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetch("/api/tpo/students")
      .then((r) => r.json())
      .then((data) => setStudents(data.students ?? []))
      .finally(() => setLoading(false));
  }, []);

  const branches = useMemo(() => {
    const set = new Set(students.map((s) => s.branch).filter(Boolean));
    return Array.from(set).sort();
  }, [students]);

  const stats = useMemo(() => {
    const total = students.length;
    const placed = students.filter((s) => s.isPlaced).length;
    const avgCgpa =
      total > 0
        ? Math.round(
            (students.reduce((sum, s) => sum + (s.cgpa || 0), 0) / total) * 100
          ) / 100
        : 0;
    const withResume = students.filter((s) => s.hasResume).length;
    return { total, placed, avgCgpa, withResume };
  }, [students]);

  const filtered = useMemo(() => {
    let list = students;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.rollNumber.toLowerCase().includes(q)
      );
    }
    if (branchFilter !== "all") {
      list = list.filter((s) => s.branch === branchFilter);
    }
    if (statusFilter === "placed") {
      list = list.filter((s) => s.isPlaced);
    } else if (statusFilter === "unplaced") {
      list = list.filter((s) => !s.isPlaced);
    }

    return [...list].sort((a, b) => {
      let cmp = 0;
      if (sortField === "cgpa") cmp = (a.cgpa || 0) - (b.cgpa || 0);
      else if (sortField === "name") cmp = a.name.localeCompare(b.name);
      return sortDir === "desc" ? -cmp : cmp;
    });
  }, [students, search, branchFilter, statusFilter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "cgpa" ? "desc" : "asc");
    }
    setCurrentPage(1);
  }

  function handleFilterChange(fn: () => void) {
    fn();
    setCurrentPage(1);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400 mr-2" />
        <span className="text-gray-500">Loading students…</span>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Students</h1>
          <p className="text-gray-500 text-sm mt-1">
            {students.length} student{students.length !== 1 ? "s" : ""}{" "}
            registered
          </p>
        </div>
        <Button
          onClick={() => exportCSV(filtered)}
          variant="outline"
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          {
            label: "Total Students",
            value: stats.total,
            icon: Users,
            color: "text-blue-500",
          },
          {
            label: "Total Placed",
            value: stats.placed,
            icon: Trophy,
            color: "text-green-500",
          },
          {
            label: "Average CGPA",
            value: stats.avgCgpa,
            icon: GraduationCap,
            color: "text-indigo-500",
          },
          {
            label: "With Resume",
            value: stats.withResume,
            icon: FileText,
            color: "text-purple-500",
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
                </div>
                <stat.icon className={`w-4 h-4 mt-1 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            className="pl-9"
            placeholder="Search by name, email or roll no…"
            value={search}
            onChange={(e) =>
              handleFilterChange(() => setSearch(e.target.value))
            }
          />
        </div>

        <select
          value={branchFilter}
          onChange={(e) =>
            handleFilterChange(() => setBranchFilter(e.target.value))
          }
          className="h-9 px-3 rounded-md border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Branches</option>
          {branches.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>

        <div className="flex gap-1">
          {(["all", "placed", "unplaced"] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => handleFilterChange(() => setStatusFilter(s))}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                statusFilter === s
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
              }`}
            >
              {s === "all" ? "All" : s === "placed" ? "Placed" : "Unplaced"}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-xl">
          <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No students found</p>
          <p className="text-sm text-gray-400 mt-1">
            Try adjusting your search or filters
          </p>
        </div>
      )}

      {/* Table */}
      {filtered.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left">
                <th className="px-4 py-3 font-medium text-gray-600">
                  <button
                    className="flex items-center gap-1 hover:text-gray-900"
                    onClick={() => toggleSort("name")}
                  >
                    Student
                    {sortField === "name" ? (
                      sortDir === "asc" ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )
                    ) : null}
                  </button>
                </th>
                <th className="px-4 py-3 font-medium text-gray-600 whitespace-nowrap">
                  Roll No
                </th>
                <th className="px-4 py-3 font-medium text-gray-600">Branch</th>
                <th className="px-4 py-3 font-medium text-gray-600">
                  <button
                    className="flex items-center gap-1 hover:text-gray-900"
                    onClick={() => toggleSort("cgpa")}
                  >
                    CGPA
                    {sortField === "cgpa" ? (
                      sortDir === "asc" ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )
                    ) : null}
                  </button>
                </th>
                <th className="px-4 py-3 font-medium text-gray-600">
                  Backlogs
                </th>
                <th className="px-4 py-3 font-medium text-gray-600">Skills</th>
                <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 font-medium text-gray-600">Apps</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((student) => {
                const isExpanded = expandedId === student._id;
                return (
                  <Fragment key={student._id}>
                    <tr
                      className={`border-b border-gray-100 cursor-pointer transition-colors hover:bg-indigo-50/40 ${
                        isExpanded ? "bg-indigo-50/50" : ""
                      }`}
                      onClick={() =>
                        setExpandedId(isExpanded ? null : student._id)
                      }
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 whitespace-nowrap">
                          {student.name || "—"}
                        </div>
                        <div className="text-xs text-gray-400">
                          {student.email}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {student.rollNumber || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {student.branch || "—"}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900">
                        {student.cgpa}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {student.backlogs}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {student.skills.slice(0, 3).map((skill) => (
                            <span
                              key={skill}
                              className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded whitespace-nowrap"
                            >
                              {skill}
                            </span>
                          ))}
                          {student.skills.length > 3 && (
                            <span className="text-xs text-gray-400 whitespace-nowrap">
                              +{student.skills.length - 3} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          className={
                            student.isPlaced
                              ? "bg-green-100 text-green-700 hover:bg-green-100"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-100"
                          }
                        >
                          {student.isPlaced ? "Placed" : "Active"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {student.applicationCount}
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr
                        className="border-b border-gray-100 bg-indigo-50/30"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <td colSpan={8} className="px-6 py-4">
                          <ExpandedProfile student={student} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">
            Showing {(currentPage - 1) * PAGE_SIZE + 1}–
            {Math.min(currentPage * PAGE_SIZE, filtered.length)} of{" "}
            {filtered.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-gray-600 px-1">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
