"use client";

/**
 * TPO — Applications for a Job
 *
 * Shows all students who applied to one specific job.
 * TPO can Shortlist, Reject, or Mark as Selected.
 * When a student is Selected, an inline "Mark as Placed" form appears.
 */

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Loader2,
  Users,
  CheckCircle2,
  XCircle,
  Star,
  Trophy,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StudentInfo {
  _id: string;
  name: string;
  email: string;
  rollNumber: string;
  branch: string;
  cgpa: number;
  backlogs: number;
  skills: string[];
  isPlaced: boolean;
  placementInfo: { company: string; package: string; date: string } | null;
}

interface Application {
  _id: string;
  status: "applied" | "shortlisted" | "selected" | "rejected";
  appliedAt: string;
  student: StudentInfo | null;
}

interface Job {
  _id: string;
  title: string;
  company: string;
  package: string;
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, string> = {
  applied:     "bg-blue-100 text-blue-700",
  shortlisted: "bg-yellow-100 text-yellow-700",
  selected:    "bg-green-100 text-green-700",
  rejected:    "bg-red-100 text-red-600",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function JobApplicationsPage() {
  const { id } = useParams<{ id: string }>();

  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  // Which application has the "Mark as Placed" form expanded
  const [placingAppId, setPlacingAppId] = useState<string | null>(null);
  const [placeForm, setPlaceForm] = useState({ company: "", packageStr: "" });
  const [placingLoading, setPlacingLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetch(`/api/tpo/jobs/${id}/applications`)
      .then((r) => r.json())
      .then((data) => {
        setJob(data.job ?? null);
        setApplications(data.applications ?? []);
        // Pre-fill place form with job's company and package
        if (data.job) {
          setPlaceForm({
            company: data.job.company,
            packageStr: data.job.package,
          });
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  // ── Status update ──────────────────────────────────────────────────────────

  async function updateStatus(appId: string, newStatus: string) {
    const res = await fetch(`/api/tpo/applications/${appId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    if (res.ok) {
      setApplications((prev) =>
        prev.map((a) =>
          a._id === appId ? { ...a, status: newStatus as Application["status"] } : a
        )
      );
      // Close place form if status changed away from selected
      if (newStatus !== "selected" && placingAppId === appId) {
        setPlacingAppId(null);
      }
    }
  }

  // ── Mark as placed ─────────────────────────────────────────────────────────

  async function handleMarkPlaced(app: Application) {
    if (!app.student) return;
    setPlacingLoading(true);

    const res = await fetch(`/api/tpo/students/${app.student._id}/place`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        company: placeForm.company,
        packageStr: placeForm.packageStr,
      }),
    });

    const data = await res.json();
    setPlacingLoading(false);

    if (res.ok) {
      // Update local state so UI reflects placement immediately
      setApplications((prev) =>
        prev.map((a) =>
          a._id === app._id && a.student
            ? {
                ...a,
                student: {
                  ...a.student,
                  isPlaced: true,
                  placementInfo: data.placementInfo,
                },
              }
            : a
        )
      );
      setPlacingAppId(null);
    }
  }

  // ── Summary counts ─────────────────────────────────────────────────────────

  const counts = applications.reduce(
    (acc, a) => {
      acc[a.status] = (acc[a.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const visible =
    statusFilter === "all"
      ? applications
      : applications.filter((a) => a.status === statusFilter);

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400 mr-2" />
        <span className="text-gray-500">Loading applications…</span>
      </div>
    );
  }

  return (
    <div>
      {/* Back + header */}
      <div className="flex items-start gap-3 mb-6">
        <Link href="/tpo/jobs">
          <Button variant="ghost" size="sm" className="gap-1 text-gray-500 mt-0.5">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {job?.title ?? "Job"} — Applications
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">{job?.company}</p>
        </div>
      </div>

      {/* Summary stat pills */}
      <div className="flex flex-wrap gap-2 mb-5">
        {[
          { key: "all",         label: "All",         count: applications.length },
          { key: "applied",     label: "Applied",     count: counts.applied ?? 0 },
          { key: "shortlisted", label: "Shortlisted", count: counts.shortlisted ?? 0 },
          { key: "selected",    label: "Selected",    count: counts.selected ?? 0 },
          { key: "rejected",    label: "Rejected",    count: counts.rejected ?? 0 },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              statusFilter === key
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
            }`}
          >
            {label}{" "}
            <span className="ml-1 opacity-70">({count})</span>
          </button>
        ))}
      </div>

      {/* Empty state */}
      {visible.length === 0 && (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-xl">
          <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">
            {applications.length === 0
              ? "No applications yet"
              : "No applications in this category"}
          </p>
        </div>
      )}

      {/* Application cards */}
      <div className="space-y-3">
        {visible.map((app) => {
          if (!app.student) return null;
          const s = app.student;
          const isPlacingThis = placingAppId === app._id;

          return (
            <Card key={app._id} className="overflow-hidden">
              <CardContent className="p-5">
                {/* Student info row */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Name + status */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900">{s.name}</h3>
                      <Badge className={`${STATUS_BADGE[app.status]} hover:${STATUS_BADGE[app.status]}`}>
                        {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                      </Badge>
                      {s.isPlaced && (
                        <Badge className="bg-purple-100 text-purple-700 gap-1">
                          <Trophy className="w-3 h-3" /> Placed
                        </Badge>
                      )}
                    </div>

                    {/* Academic details */}
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1.5 text-sm text-gray-500">
                      <span>{s.rollNumber || s.email}</span>
                      <span>{s.branch}</span>
                      <span>CGPA: <strong className="text-gray-700">{s.cgpa}</strong></span>
                      <span>Backlogs: <strong className="text-gray-700">{s.backlogs}</strong></span>
                    </div>

                    {/* Skills (top 5) */}
                    {s.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {s.skills.slice(0, 6).map((skill) => (
                          <span
                            key={skill}
                            className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                          >
                            {skill}
                          </span>
                        ))}
                        {s.skills.length > 6 && (
                          <span className="text-xs text-gray-400">
                            +{s.skills.length - 6} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Placed info if already marked */}
                    {s.isPlaced && s.placementInfo && (
                      <p className="text-xs text-purple-600 mt-1.5">
                        Placed at {s.placementInfo.company} — {s.placementInfo.package}
                      </p>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    {app.status === "applied" && (
                      <>
                        <Button
                          size="sm"
                          className="h-7 text-xs bg-yellow-500 hover:bg-yellow-600 text-white gap-1"
                          onClick={() => updateStatus(app._id, "shortlisted")}
                        >
                          <Star className="w-3 h-3" /> Shortlist
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs text-red-500 hover:text-red-600 gap-1"
                          onClick={() => updateStatus(app._id, "rejected")}
                        >
                          <XCircle className="w-3 h-3" /> Reject
                        </Button>
                      </>
                    )}

                    {app.status === "shortlisted" && (
                      <>
                        <Button
                          size="sm"
                          className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white gap-1"
                          onClick={() => updateStatus(app._id, "selected")}
                        >
                          <CheckCircle2 className="w-3 h-3" /> Select
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs text-red-500 hover:text-red-600 gap-1"
                          onClick={() => updateStatus(app._id, "rejected")}
                        >
                          <XCircle className="w-3 h-3" /> Reject
                        </Button>
                      </>
                    )}

                    {app.status === "selected" && !s.isPlaced && (
                      <Button
                        size="sm"
                        className="h-7 text-xs bg-purple-600 hover:bg-purple-700 text-white gap-1"
                        onClick={() =>
                          setPlacingAppId(isPlacingThis ? null : app._id)
                        }
                      >
                        <Trophy className="w-3 h-3" />
                        Mark Placed
                        {isPlacingThis ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </Button>
                    )}

                    {app.status === "rejected" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => updateStatus(app._id, "applied")}
                      >
                        Restore
                      </Button>
                    )}
                  </div>
                </div>

                {/* ── Inline "Mark as Placed" form ── */}
                {isPlacingThis && (
                  <div className="mt-4 pt-4 border-t border-gray-100 bg-purple-50 -mx-5 -mb-5 px-5 pb-5">
                    <p className="text-sm font-medium text-purple-800 mb-3">
                      Record Placement Details
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Company</Label>
                        <Input
                          value={placeForm.company}
                          onChange={(e) =>
                            setPlaceForm((p) => ({ ...p, company: e.target.value }))
                          }
                          className="h-8 text-sm"
                          placeholder="Infosys"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Package (CTC)</Label>
                        <Input
                          value={placeForm.packageStr}
                          onChange={(e) =>
                            setPlaceForm((p) => ({ ...p, packageStr: e.target.value }))
                          }
                          className="h-8 text-sm"
                          placeholder="4.5 LPA"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="h-8 bg-purple-600 hover:bg-purple-700"
                        onClick={() => handleMarkPlaced(app)}
                        disabled={placingLoading}
                      >
                        {placingLoading ? (
                          <Loader2 className="w-3 h-3 animate-spin mr-1" />
                        ) : null}
                        Confirm Placement
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8"
                        onClick={() => setPlacingAppId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
