"use client";

/**
 * Student — My Applications
 * Shows every job the student has applied to, with live status tracking.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Briefcase,
  Calendar,
  ClipboardList,
  ArrowRight,
  Loader2,
} from "lucide-react";

interface Application {
  _id: string;
  status: "applied" | "shortlisted" | "selected" | "rejected";
  appliedAt: string;
  job: {
    _id: string;
    title: string;
    company: string;
    package: string;
    deadline: string;
  } | null;
}

// Visual config for each status
const STATUS = {
  applied: {
    label: "Applied",
    classes: "bg-blue-100 text-blue-700",
    description: "Your application is under review",
  },
  shortlisted: {
    label: "Shortlisted ⭐",
    classes: "bg-yellow-100 text-yellow-700",
    description: "You've been shortlisted — await further communication",
  },
  selected: {
    label: "Selected 🎉",
    classes: "bg-green-100 text-green-700",
    description: "Congratulations! You have been selected",
  },
  rejected: {
    label: "Not Selected",
    classes: "bg-red-100 text-red-600",
    description: "Unfortunately you were not selected for this role",
  },
};

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/student/applications")
      .then((r) => r.json())
      .then((data) => setApplications(data.applications ?? []))
      .finally(() => setLoading(false));
  }, []);

  // Summary counts
  const counts = applications.reduce(
    (acc, a) => {
      acc[a.status] = (acc[a.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
        <p className="text-gray-500 text-sm mt-1">
          Track the status of every job you have applied to
        </p>
      </div>

      {/* Summary stats */}
      {applications.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {(["applied", "shortlisted", "selected", "rejected"] as const).map((s) => (
            <div
              key={s}
              className={`rounded-xl px-4 py-3 text-center border ${STATUS[s].classes} border-current/20`}
            >
              <p className="text-2xl font-bold">{counts[s] ?? 0}</p>
              <p className="text-xs font-medium mt-0.5 capitalize">{s}</p>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {applications.length === 0 && (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-xl">
          <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No applications yet</p>
          <p className="text-sm text-gray-400 mt-1 mb-4">
            Browse open jobs and click Apply to get started
          </p>
          <Link
            href="/student/jobs"
            className="inline-flex items-center gap-1 text-blue-600 text-sm font-medium hover:underline"
          >
            Browse Jobs <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Application cards */}
      <div className="space-y-3">
        {applications.map((app) => {
          if (!app.job) return null;
          const s = STATUS[app.status];

          return (
            <Card key={app._id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Job title + status badge */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900">
                        {app.job.title}
                      </h3>
                      <Badge className={`${s.classes} hover:${s.classes}`}>
                        {s.label}
                      </Badge>
                    </div>

                    <p className="text-gray-500 text-sm mt-0.5">
                      {app.job.company}
                    </p>

                    {/* Status description — helpful for students at viva */}
                    <p className="text-xs text-gray-400 mt-1">{s.description}</p>

                    {/* Meta info */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-3 h-3" />
                        {app.job.package}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Applied:{" "}
                        {new Date(app.appliedAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Deadline:{" "}
                        {new Date(app.job.deadline).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Link to job detail */}
                  <Link href={`/student/jobs/${app.job._id}`}>
                    <ArrowRight className="w-4 h-4 text-gray-300 hover:text-gray-500 mt-1" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
