"use client";

/**
 * TPO — Manage Jobs
 * Lists all jobs the TPO has posted, with application counts and quick actions.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Briefcase,
  Plus,
  Users,
  Calendar,
  Pencil,
  ChevronRight,
  Loader2,
} from "lucide-react";

interface Job {
  _id: string;
  title: string;
  company: string;
  package: string;
  status: "open" | "closed";
  deadline: string;
  eligibility: { branches: string[]; minCGPA: number; maxBacklogs: number };
  applicationCount: number;
  createdAt: string;
}

export default function ManageJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tpo/jobs")
      .then((r) => r.json())
      .then((data) => setJobs(data.jobs ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function toggleStatus(job: Job) {
    const newStatus = job.status === "open" ? "closed" : "open";
    const res = await fetch(`/api/tpo/jobs/${job._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setJobs((prev) =>
        prev.map((j) => (j._id === job._id ? { ...j, status: newStatus } : j))
      );
    }
  }

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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Jobs</h1>
          <p className="text-gray-500 text-sm mt-1">
            {jobs.length} job{jobs.length !== 1 ? "s" : ""} posted
          </p>
        </div>
        <Link href="/tpo/jobs/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Post New Job
          </Button>
        </Link>
      </div>

      {/* Empty state */}
      {jobs.length === 0 && (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-xl">
          <Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No jobs posted yet</p>
          <p className="text-sm text-gray-400 mt-1 mb-4">
            Post your first placement drive to get started
          </p>
          <Link href="/tpo/jobs/new">
            <Button variant="outline">Post a Job</Button>
          </Link>
        </div>
      )}

      {/* Job list */}
      <div className="space-y-3">
        {jobs.map((job) => (
          <Card key={job._id} className="hover:shadow-sm transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                {/* Left: job info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900">{job.title}</h3>
                    <Badge
                      variant={job.status === "open" ? "default" : "secondary"}
                      className={
                        job.status === "open"
                          ? "bg-green-100 text-green-700 hover:bg-green-100"
                          : ""
                      }
                    >
                      {job.status === "open" ? "Open" : "Closed"}
                    </Badge>
                  </div>
                  <p className="text-gray-500 text-sm mt-0.5">{job.company}</p>

                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-gray-400">
                    <span className="font-medium text-gray-600">{job.package}</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Deadline: {new Date(job.deadline).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {job.applicationCount} application{job.applicationCount !== 1 ? "s" : ""}
                    </span>
                    {job.eligibility.branches.length > 0 && (
                      <span>
                        Branches: {job.eligibility.branches.join(", ")}
                      </span>
                    )}
                    <span>Min CGPA: {job.eligibility.minCGPA}</span>
                    <span>Max Backlogs: {job.eligibility.maxBacklogs}</span>
                  </div>
                </div>

                {/* Right: actions */}
                <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                  <Link href={`/tpo/jobs/${job._id}/applications`}>
                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                      <Users className="w-3 h-3" />
                      Applications
                      {job.applicationCount > 0 && (
                        <span className="ml-0.5 bg-indigo-100 text-indigo-700 rounded-full px-1.5 py-0 text-[10px] font-bold">
                          {job.applicationCount}
                        </span>
                      )}
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`text-xs h-8 ${
                      job.status === "open"
                        ? "text-red-500 hover:text-red-600 hover:border-red-300"
                        : "text-green-600 hover:text-green-700 hover:border-green-300"
                    }`}
                    onClick={() => toggleStatus(job)}
                  >
                    {job.status === "open" ? "Close" : "Reopen"}
                  </Button>
                  <Link href={`/tpo/jobs/${job._id}`}>
                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                      <Pencil className="w-3 h-3" />
                      Edit
                      <ChevronRight className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
