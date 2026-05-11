"use client";

/**
 * Student — Job Detail Page
 *
 * Shows the full job description plus an eligibility breakdown card.
 * The Apply button is only active when: eligible + not already applied + deadline not passed.
 */

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle2,
  XCircle,
  Calendar,
  Briefcase,
  ArrowLeft,
  Loader2,
  CheckCheck,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

interface JobDetail {
  _id: string;
  title: string;
  company: string;
  description: string;
  package: string;
  deadline: string;
  status: "open" | "closed";
  eligibility: { branches: string[]; minCGPA: number; maxBacklogs: number };
}

// Maps status strings to display labels and colours
const STATUS_DISPLAY: Record<string, { label: string; color: string }> = {
  applied:     { label: "Applied",     color: "bg-blue-100 text-blue-700" },
  shortlisted: { label: "Shortlisted", color: "bg-yellow-100 text-yellow-700" },
  selected:    { label: "Selected 🎉", color: "bg-green-100 text-green-700" },
  rejected:    { label: "Not selected", color: "bg-red-100 text-red-600" },
};

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [job, setJob] = useState<JobDetail | null>(null);
  const [isEligible, setIsEligible] = useState(false);
  const [ineligibleReasons, setIneligibleReasons] = useState<string[]>([]);
  const [hasApplied, setHasApplied] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState("");

  useEffect(() => {
    fetch(`/api/student/jobs/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setJob(data.job);
        setIsEligible(data.isEligible);
        setIneligibleReasons(data.ineligibleReasons ?? []);
        setHasApplied(data.hasApplied);
        setApplicationStatus(data.applicationStatus);
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleApply() {
    setApplying(true);
    setApplyError("");

    const res = await fetch(`/api/student/jobs/${id}/apply`, { method: "POST" });
    const data = await res.json();

    setApplying(false);

    if (!res.ok) {
      setApplyError(data.error || "Application failed. Please try again.");
      return;
    }

    // Update UI to show "Applied" state without a page reload
    setHasApplied(true);
    setApplicationStatus("applied");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400 mr-2" />
        <span className="text-gray-500">Loading job details…</span>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Job not found.</p>
        <Link href="/student/jobs">
          <Button variant="outline" className="mt-4">Back to Jobs</Button>
        </Link>
      </div>
    );
  }

  const isPastDeadline = new Date(job.deadline) < new Date();
  const canApply = isEligible && !hasApplied && !isPastDeadline && job.status === "open";

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back button */}
      <Link href="/student/jobs">
        <Button variant="ghost" size="sm" className="gap-1 text-gray-500 mb-5">
          <ArrowLeft className="w-4 h-4" /> Back to Jobs
        </Button>
      </Link>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
            <p className="text-lg text-gray-500 mt-0.5">{job.company}</p>
          </div>
          {hasApplied && applicationStatus && STATUS_DISPLAY[applicationStatus] && (
            <Badge className={`${STATUS_DISPLAY[applicationStatus].color} text-sm px-3 py-1`}>
              {STATUS_DISPLAY[applicationStatus].label}
            </Badge>
          )}
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500">
          <span className="flex items-center gap-1.5 font-semibold text-gray-900">
            <Briefcase className="w-4 h-4 text-gray-400" />
            {job.package}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-gray-400" />
            Deadline:{" "}
            <span className={isPastDeadline ? "text-red-500 font-medium" : ""}>
              {new Date(job.deadline).toLocaleDateString("en-IN", {
                weekday: "short", day: "numeric", month: "long", year: "numeric",
              })}
            </span>
            {isPastDeadline && " (closed)"}
          </span>
        </div>
      </div>

      {/* Eligibility card */}
      <Card className={`mb-6 border-2 ${isEligible ? "border-green-200" : "border-red-200"}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            {isEligible ? (
              <><CheckCircle2 className="w-5 h-5 text-green-500" />You are eligible to apply</>
            ) : (
              <><XCircle className="w-5 h-5 text-red-500" />You are not eligible for this role</>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Eligibility criteria breakdown */}
          <div className="space-y-2 text-sm">
            <EligibilityRow
              label="Branch"
              value={job.eligibility.branches.length > 0
                ? job.eligibility.branches.join(", ")
                : "Open to all branches"}
              pass={!ineligibleReasons.some((r) => r.includes("Branch"))}
            />
            <EligibilityRow
              label="Minimum CGPA"
              value={`≥ ${job.eligibility.minCGPA}`}
              pass={!ineligibleReasons.some((r) => r.includes("CGPA"))}
            />
            <EligibilityRow
              label="Maximum Backlogs"
              value={`≤ ${job.eligibility.maxBacklogs}`}
              pass={!ineligibleReasons.some((r) => r.includes("backlog"))}
            />
          </div>

          {/* Why not eligible details */}
          {!isEligible && (
            <div className="mt-3 pt-3 border-t border-red-100">
              {ineligibleReasons.map((reason) => (
                <p key={reason} className="text-sm text-red-600">• {reason}</p>
              ))}
              <p className="text-xs text-gray-400 mt-2">
                Update your profile if any of these details are incorrect.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Apply section */}
      <div className="mb-6">
        {applyError && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {applyError}
          </div>
        )}

        {hasApplied ? (
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
            <CheckCheck className="w-4 h-4 flex-shrink-0" />
            <span>
              You have applied for this role.
              {applicationStatus && applicationStatus !== "applied" && (
                <span className="font-semibold ml-1">
                  Status: {STATUS_DISPLAY[applicationStatus]?.label ?? applicationStatus}
                </span>
              )}
            </span>
          </div>
        ) : (
          <Button
            onClick={handleApply}
            disabled={!canApply || applying}
            size="lg"
            className="w-full sm:w-auto"
          >
            {applying ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting…</>
            ) : !isEligible ? (
              "Not Eligible"
            ) : isPastDeadline ? (
              "Deadline Passed"
            ) : job.status === "closed" ? (
              "Job Closed"
            ) : (
              "Apply Now"
            )}
          </Button>
        )}
      </div>

      {/* Full job description */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Job Description</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
            {job.description}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Helper component ────────────────────────────────────────────────────────

function EligibilityRow({
  label,
  value,
  pass,
}: {
  label: string;
  value: string;
  pass: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {pass ? (
          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
        ) : (
          <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
        )}
        <span className="text-gray-600">{label}</span>
      </div>
      <span className="text-gray-700 font-medium">{value}</span>
    </div>
  );
}
