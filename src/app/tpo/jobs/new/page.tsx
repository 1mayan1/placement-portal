"use client";

/**
 * TPO — Post a New Job
 * Form fields: title, company, full JD, package, eligibility criteria, deadline.
 * On submit → POST /api/tpo/jobs → redirect to /tpo/jobs on success.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

// Branches available as eligibility options
const BRANCHES = ["MCA", "BCA", "MBA", "B.Tech", "M.Tech", "BSc"];

export default function PostJobPage() {
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
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
    setError("");
    setSuccess("");
    setSubmitting(true);

    const res = await fetch("/api/tpo/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        company: form.company,
        description: form.description,
        packageStr: form.packageStr,
        deadline: form.deadline,
        eligibility: {
          branches: form.branches,
          minCGPA: form.minCGPA,
          maxBacklogs: form.maxBacklogs,
        },
      }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong.");
      return;
    }

    setSuccess("Job posted! Redirecting…");
    setTimeout(() => router.push("/tpo/jobs"), 1200);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Post a New Job</h1>
        <p className="text-gray-500 text-sm mt-1">
          Fill in the placement drive details. Students will see this immediately.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-5">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-5">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Job Title *</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Software Engineer Trainee"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Company Name *</Label>
                <Input
                  value={form.company}
                  onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))}
                  placeholder="Infosys"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Package (CTC)</Label>
                <Input
                  value={form.packageStr}
                  onChange={(e) => setForm((p) => ({ ...p, packageStr: e.target.value }))}
                  placeholder="4.5 LPA"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Application Deadline *</Label>
                <Input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm((p) => ({ ...p, deadline: e.target.value }))}
                  min={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Job Description */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Job Description</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Describe the role, responsibilities, required skills, and selection process…"
              rows={8}
              required
            />
          </CardContent>
        </Card>

        {/* Eligibility Criteria */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Eligibility Criteria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Branch checkboxes */}
            <div className="space-y-2">
              <Label>
                Eligible Branches{" "}
                <span className="text-gray-400 font-normal text-xs">
                  (leave all unchecked = open to all branches)
                </span>
              </Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {BRANCHES.map((branch) => (
                  <button
                    key={branch}
                    type="button"
                    onClick={() => toggleBranch(branch)}
                    className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                      form.branches.includes(branch)
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
                    }`}
                  >
                    {branch}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Minimum CGPA Required</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={form.minCGPA}
                  onChange={(e) => setForm((p) => ({ ...p, minCGPA: e.target.value }))}
                  placeholder="6.0"
                />
                <p className="text-xs text-gray-400">Set to 0 for no CGPA requirement</p>
              </div>
              <div className="space-y-1.5">
                <Label>Maximum Backlogs Allowed</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.maxBacklogs}
                  onChange={(e) => setForm((p) => ({ ...p, maxBacklogs: e.target.value }))}
                  placeholder="0"
                />
                <p className="text-xs text-gray-400">Set to 0 for no backlogs allowed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end pb-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/tpo/jobs")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Posting…</>
            ) : (
              "Post Job"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
