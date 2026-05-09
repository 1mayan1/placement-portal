"use client";

/**
 * TPO — Edit Job
 * Pre-populated form showing the current job details. TPO can change any field.
 */

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

const BRANCHES = ["MCA", "BCA", "MBA", "B.Tech", "M.Tech", "BSc"];

export default function EditJobPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [form, setForm] = useState({
    title: "",
    company: "",
    description: "",
    packageStr: "",
    deadline: "",
    minCGPA: "0",
    maxBacklogs: "0",
    branches: [] as string[],
    status: "open" as "open" | "closed",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [applicationCount, setApplicationCount] = useState(0);

  useEffect(() => {
    fetch(`/api/tpo/jobs/${id}`)
      .then((r) => r.json())
      .then(({ job }) => {
        if (!job) return;
        setForm({
          title: job.title,
          company: job.company,
          description: job.description,
          packageStr: job.package,
          deadline: new Date(job.deadline).toISOString().split("T")[0],
          minCGPA: String(job.eligibility.minCGPA),
          maxBacklogs: String(job.eligibility.maxBacklogs),
          branches: job.eligibility.branches ?? [],
          status: job.status,
        });
        setApplicationCount(job.applicationCount ?? 0);
      })
      .finally(() => setLoading(false));
  }, [id]);

  function toggleBranch(branch: string) {
    setForm((prev) => ({
      ...prev,
      branches: prev.branches.includes(branch)
        ? prev.branches.filter((b) => b !== branch)
        : [...prev.branches, branch],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const res = await fetch(`/api/tpo/jobs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        company: form.company,
        description: form.description,
        packageStr: form.packageStr,
        deadline: form.deadline,
        status: form.status,
        eligibility: {
          branches: form.branches,
          minCGPA: form.minCGPA,
          maxBacklogs: form.maxBacklogs,
        },
      }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error || "Update failed.");
    } else {
      setSuccess("Job updated successfully!");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400 mr-2" />
        <span className="text-gray-500">Loading job…</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/tpo/jobs">
          <Button variant="ghost" size="sm" className="gap-1 text-gray-500">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Job</h1>
          <p className="text-gray-500 text-sm">
            {applicationCount} application{applicationCount !== 1 ? "s" : ""} received
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-5">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-5">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />{success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Status toggle */}
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Job Status</p>
                <p className="text-sm text-gray-400">
                  Closed jobs are hidden from students
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  className={
                    form.status === "open"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }
                >
                  {form.status === "open" ? "Open" : "Closed"}
                </Badge>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setForm((p) => ({
                      ...p,
                      status: p.status === "open" ? "closed" : "open",
                    }))
                  }
                >
                  {form.status === "open" ? "Close Job" : "Reopen Job"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Job Title</Label>
                <Input value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Company</Label>
                <Input value={form.company}
                  onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Package</Label>
                <Input value={form.packageStr}
                  onChange={(e) => setForm((p) => ({ ...p, packageStr: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Deadline</Label>
                <Input type="date" value={form.deadline}
                  onChange={(e) => setForm((p) => ({ ...p, deadline: e.target.value }))} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        <Card>
          <CardHeader><CardTitle className="text-base">Job Description</CardTitle></CardHeader>
          <CardContent>
            <Textarea value={form.description} rows={8}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
          </CardContent>
        </Card>

        {/* Eligibility */}
        <Card>
          <CardHeader><CardTitle className="text-base">Eligibility Criteria</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Eligible Branches</Label>
              <div className="flex flex-wrap gap-2">
                {BRANCHES.map((branch) => (
                  <button key={branch} type="button" onClick={() => toggleBranch(branch)}
                    className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                      form.branches.includes(branch)
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
                    }`}>
                    {branch}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Minimum CGPA</Label>
                <Input type="number" step="0.1" min="0" max="10" value={form.minCGPA}
                  onChange={(e) => setForm((p) => ({ ...p, minCGPA: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Max Backlogs Allowed</Label>
                <Input type="number" min="0" value={form.maxBacklogs}
                  onChange={(e) => setForm((p) => ({ ...p, maxBacklogs: e.target.value }))} />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end pb-6">
          <Button type="button" variant="outline" onClick={() => router.push("/tpo/jobs")}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
