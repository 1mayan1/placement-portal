"use client";

/**
 * Student — Browse Jobs
 *
 * Shows all open placement drives with an eligibility badge on each card.
 * The badge is computed by the API (which reads CGPA, backlogs, branch from DB)
 * so students only see whether they qualify — not the raw criteria being applied.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Briefcase,
  Calendar,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Loader2,
  Search,
  CheckCheck,
} from "lucide-react";

interface Job {
  _id: string;
  title: string;
  company: string;
  package: string;
  deadline: string;
  eligibility: { branches: string[]; minCGPA: number; maxBacklogs: number };
  isEligible: boolean;
  ineligibleReasons: string[];
  hasApplied: boolean;
  applicationStatus: string | null;
}

export default function BrowseJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "eligible" | "applied">("all");

  useEffect(() => {
    fetch("/api/student/jobs")
      .then((r) => r.json())
      .then((data) => setJobs(data.jobs ?? []))
      .finally(() => setLoading(false));
  }, []);

  // Apply search + filter
  const visible = jobs.filter((job) => {
    const matchesSearch =
      search === "" ||
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.company.toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      filter === "all" ||
      (filter === "eligible" && job.isEligible) ||
      (filter === "applied" && job.hasApplied);

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400 mr-2" />
        <span className="text-gray-500">Loading jobs…</span>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Browse Jobs</h1>
        <p className="text-gray-500 text-sm mt-1">
          {jobs.length} open placement drive{jobs.length !== 1 ? "s" : ""} —
          your eligibility is auto-calculated from your profile
        </p>
      </div>

      {/* Search + filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by company or role…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "eligible", "applied"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors capitalize ${
                filter === f
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {visible.length === 0 && (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-xl">
          <Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No jobs found</p>
          <p className="text-sm text-gray-400 mt-1">
            {search || filter !== "all"
              ? "Try clearing your search or filter"
              : "Check back later — new drives will appear here"}
          </p>
        </div>
      )}

      {/* Job cards */}
      <div className="space-y-3">
        {visible.map((job) => {
          const isPastDeadline = new Date(job.deadline) < new Date();

          return (
            <Link key={job._id} href={`/student/jobs/${job._id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900">{job.title}</h3>

                        {/* Eligibility badge — the star of Phase 4 */}
                        {job.hasApplied ? (
                          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 gap-1">
                            <CheckCheck className="w-3 h-3" />
                            Applied
                          </Badge>
                        ) : job.isEligible ? (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Eligible
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-600 hover:bg-red-100 gap-1">
                            <XCircle className="w-3 h-3" />
                            Not Eligible
                          </Badge>
                        )}

                        {isPastDeadline && (
                          <Badge variant="secondary" className="text-xs">
                            Deadline passed
                          </Badge>
                        )}
                      </div>

                      <p className="text-gray-500 text-sm mt-0.5">{job.company}</p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-400">
                        <span className="font-medium text-gray-600">{job.package}</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(job.deadline).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </span>
                        {job.eligibility.branches.length > 0 && (
                          <span>{job.eligibility.branches.join(" · ")}</span>
                        )}
                        <span>CGPA ≥ {job.eligibility.minCGPA}</span>

                        {/* Show why not eligible inline */}
                        {!job.isEligible && !job.hasApplied && (
                          <span className="text-red-400">
                            {job.ineligibleReasons[0]}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right arrow */}
                    <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
