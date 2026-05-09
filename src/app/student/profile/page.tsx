"use client";

/**
 * Student Profile Page
 *
 * Two sections on one page:
 * 1. Resume Upload — drag & drop PDF → AI extracts and auto-fills the form below
 * 2. Profile Form  — all editable fields, pre-filled from DB or AI extraction
 *
 * Flow: Drop PDF → loading spinner → AI fills fields → student reviews → Save
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  Sparkles,
  Plus,
  Trash2,
  Save,
  AlertCircle,
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
  technologies: string; // comma-separated string in the form
}

interface ProfileForm {
  name: string;
  phone: string;
  rollNumber: string;
  branch: string;
  semester: string;
  cgpa: string;
  backlogs: string;
  skills: string;        // comma-separated
  certifications: string; // comma-separated
  education: Education[];
  projects: Project[];
}

const emptyEducation = (): Education => ({
  degree: "",
  institution: "",
  year: "",
  percentage: "",
});

const emptyProject = (): Project => ({
  title: "",
  description: "",
  technologies: "",
});

const defaultForm = (): ProfileForm => ({
  name: "",
  phone: "",
  rollNumber: "",
  branch: "",
  semester: "",
  cgpa: "",
  backlogs: "",
  skills: "",
  certifications: "",
  education: [emptyEducation()],
  projects: [emptyProject()],
});

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const [form, setForm] = useState<ProfileForm>(defaultForm());
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [aiSuccess, setAiSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Load existing profile on mount ────────────────────────────────────────

  useEffect(() => {
    fetch("/api/student/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) return;
        setForm({
          name: data.name ?? "",
          phone: data.phone ?? "",
          rollNumber: data.rollNumber ?? "",
          branch: data.branch ?? "",
          semester: data.semester ? String(data.semester) : "",
          cgpa: data.cgpa ? String(data.cgpa) : "",
          backlogs: data.backlogs !== undefined ? String(data.backlogs) : "",
          skills: Array.isArray(data.skills) ? data.skills.join(", ") : "",
          certifications: Array.isArray(data.certifications)
            ? data.certifications.join(", ")
            : "",
          education:
            data.education?.length > 0 ? data.education : [emptyEducation()],
          projects:
            data.projects?.length > 0
              ? data.projects.map(
                  (p: { title: string; description: string; technologies: string[] }) => ({
                    ...p,
                    technologies: Array.isArray(p.technologies)
                      ? p.technologies.join(", ")
                      : (p.technologies ?? ""),
                  })
                )
              : [emptyProject()],
        });
        if (data.resumeFileId) setUploadedFileName("Resume on file");
      })
      .finally(() => setLoadingProfile(false));
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────

  function setField(key: keyof ProfileForm, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setEduField(index: number, key: keyof Education, value: string) {
    setForm((prev) => {
      const updated = [...prev.education];
      updated[index] = { ...updated[index], [key]: value };
      return { ...prev, education: updated };
    });
  }

  function setProjectField(index: number, key: keyof Project, value: string) {
    setForm((prev) => {
      const updated = [...prev.projects];
      updated[index] = { ...updated[index], [key]: value };
      return { ...prev, projects: updated };
    });
  }

  // ── Resume upload handler ──────────────────────────────────────────────────

  const handleFile = useCallback(
    async (file: File) => {
      if (file.type !== "application/pdf") {
        setErrorMsg("Please upload a PDF file.");
        return;
      }

      setExtracting(true);
      setErrorMsg("");
      setAiSuccess(false);
      setUploadedFileName(file.name);

      const fd = new FormData();
      fd.append("resume", file);

      try {
        const res = await fetch("/api/student/resume", {
          method: "POST",
          body: fd,
        });
        const data = await res.json();

        if (!res.ok) {
          setErrorMsg(data.error || "Upload failed. Please try again.");
          return;
        }

        // Auto-fill every form field with Claude's extracted data
        const e = data.extracted;
        setForm((prev) => ({
          ...prev,
          name: e.name || prev.name,
          phone: e.phone || prev.phone,
          branch: e.branch || prev.branch,
          semester: e.semester ? String(e.semester) : prev.semester,
          cgpa: e.cgpa ? String(e.cgpa) : prev.cgpa,
          backlogs:
            e.backlogs !== undefined ? String(e.backlogs) : prev.backlogs,
          skills:
            Array.isArray(e.skills) && e.skills.length > 0
              ? e.skills.join(", ")
              : prev.skills,
          certifications:
            Array.isArray(e.certifications) && e.certifications.length > 0
              ? e.certifications.join(", ")
              : prev.certifications,
          education:
            Array.isArray(e.education) && e.education.length > 0
              ? e.education
              : prev.education,
          projects:
            Array.isArray(e.projects) && e.projects.length > 0
              ? e.projects.map(
                  (p: { title: string; description: string; technologies: string[] }) => ({
                    ...p,
                    technologies: Array.isArray(p.technologies)
                      ? p.technologies.join(", ")
                      : (p.technologies ?? ""),
                  })
                )
              : prev.projects,
        }));

        setAiSuccess(true);
      } catch {
        setErrorMsg("Network error. Please check your connection.");
      } finally {
        setExtracting(false);
      }
    },
    []
  );

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  // ── Save ──────────────────────────────────────────────────────────────────

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    const payload = {
      ...form,
      // Convert comma-separated strings back to arrays for MongoDB
      skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
      certifications: form.certifications
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      projects: form.projects.map((p) => ({
        ...p,
        technologies: p.technologies
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      })),
    };

    try {
      const res = await fetch("/api/student/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Save failed.");
      } else {
        setSuccessMsg("Profile saved successfully!");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Loading profile...</span>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Upload your resume to auto-fill — or fill in manually and save.
        </p>
      </div>

      {/* Global messages */}
      {successMsg && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* AI success banner */}
      {aiSuccess && (
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg mb-6">
          <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Resume analysed by AI!</p>
            <p className="text-sm text-blue-600 mt-0.5">
              Fields below have been auto-filled. Review, edit if needed, then
              click <strong>Save Profile</strong>.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* ── Resume Upload ─────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="w-4 h-4 text-blue-500" />
              AI Resume Upload
            </CardTitle>
          </CardHeader>
          <CardContent>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => !extracting && fileInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors
                ${dragOver ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"}
                ${extracting ? "cursor-not-allowed" : ""}
              `}
            >
              {extracting ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-9 h-9 animate-spin text-blue-500" />
                  <p className="font-medium text-gray-700">Extracting with AI…</p>
                  <p className="text-sm text-gray-400">Claude is reading your resume</p>
                </div>
              ) : uploadedFileName ? (
                <div className="flex flex-col items-center gap-2">
                  <FileText className="w-9 h-9 text-green-500" />
                  <p className="font-medium text-gray-700">{uploadedFileName}</p>
                  <p className="text-sm text-gray-400">Click to replace</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-9 h-9 text-gray-300" />
                  <p className="font-medium text-gray-700">Drag & drop your resume here</p>
                  <p className="text-sm text-gray-400">or click to browse — PDF only</p>
                  <Badge variant="secondary" className="mt-1">
                    AI auto-fills your profile
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── Basic Info ────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="Priya Sharma"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phone Number</Label>
              <Input
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                placeholder="9876543210"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Roll Number</Label>
              <Input
                value={form.rollNumber}
                onChange={(e) => setField("rollNumber", e.target.value)}
                placeholder="MCA2021001"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Branch / Program</Label>
              <Input
                value={form.branch}
                onChange={(e) => setField("branch", e.target.value)}
                placeholder="MCA"
              />
            </div>
          </CardContent>
        </Card>

        {/* ── Academic Details ─────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Academic Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Current Semester</Label>
              <Input
                type="number"
                min={1}
                max={6}
                value={form.semester}
                onChange={(e) => setField("semester", e.target.value)}
                placeholder="6"
              />
            </div>
            <div className="space-y-1.5">
              <Label>CGPA (out of 10)</Label>
              <Input
                type="number"
                step="0.01"
                min={0}
                max={10}
                value={form.cgpa}
                onChange={(e) => setField("cgpa", e.target.value)}
                placeholder="8.5"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Active Backlogs</Label>
              <Input
                type="number"
                min={0}
                value={form.backlogs}
                onChange={(e) => setField("backlogs", e.target.value)}
                placeholder="0"
              />
            </div>
          </CardContent>
        </Card>

        {/* ── Skills & Certifications ───────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Skills & Certifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>
                Technical Skills{" "}
                <span className="text-gray-400 font-normal text-xs">(comma-separated)</span>
              </Label>
              <Textarea
                value={form.skills}
                onChange={(e) => setField("skills", e.target.value)}
                placeholder="Python, React, SQL, Machine Learning, Docker"
                rows={2}
              />
              {form.skills && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.skills
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>
                Certifications{" "}
                <span className="text-gray-400 font-normal text-xs">(comma-separated)</span>
              </Label>
              <Input
                value={form.certifications}
                onChange={(e) => setField("certifications", e.target.value)}
                placeholder="AWS Cloud Practitioner, Google Data Analytics"
              />
            </div>
          </CardContent>
        </Card>

        {/* ── Education ─────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Education</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={() =>
                setForm((p) => ({ ...p, education: [...p.education, emptyEducation()] }))
              } className="h-8">
                <Plus className="w-3 h-3 mr-1" /> Add
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {form.education.map((edu, i) => (
              <div key={i} className="border border-gray-100 rounded-lg p-4 space-y-3 relative">
                {form.education.length > 1 && (
                  <button type="button" onClick={() =>
                    setForm((p) => ({ ...p, education: p.education.filter((_, j) => j !== i) }))
                  } className="absolute top-3 right-3 text-gray-300 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Degree / Level</Label>
                    <Input value={edu.degree} onChange={(e) => setEduField(i, "degree", e.target.value)}
                      placeholder="MCA / B.Sc. / 12th" className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Institution</Label>
                    <Input value={edu.institution} onChange={(e) => setEduField(i, "institution", e.target.value)}
                      placeholder="XYZ College" className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Year of Passing</Label>
                    <Input value={edu.year} onChange={(e) => setEduField(i, "year", e.target.value)}
                      placeholder="2024" className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Percentage / CGPA</Label>
                    <Input value={edu.percentage} onChange={(e) => setEduField(i, "percentage", e.target.value)}
                      placeholder="78% or 8.5" className="h-8 text-sm" />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* ── Projects ─────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Projects</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={() =>
                setForm((p) => ({ ...p, projects: [...p.projects, emptyProject()] }))
              } className="h-8">
                <Plus className="w-3 h-3 mr-1" /> Add
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {form.projects.map((proj, i) => (
              <div key={i} className="border border-gray-100 rounded-lg p-4 space-y-3 relative">
                {form.projects.length > 1 && (
                  <button type="button" onClick={() =>
                    setForm((p) => ({ ...p, projects: p.projects.filter((_, j) => j !== i) }))
                  } className="absolute top-3 right-3 text-gray-300 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <div className="space-y-1.5">
                  <Label className="text-xs">Project Title</Label>
                  <Input value={proj.title} onChange={(e) => setProjectField(i, "title", e.target.value)}
                    placeholder="Placement Portal Web App" className="h-8 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Description</Label>
                  <Textarea value={proj.description} onChange={(e) => setProjectField(i, "description", e.target.value)}
                    placeholder="Brief description of what the project does" rows={2} className="text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Technologies (comma-separated)</Label>
                  <Input value={proj.technologies} onChange={(e) => setProjectField(i, "technologies", e.target.value)}
                    placeholder="Next.js, MongoDB, Claude API" className="h-8 text-sm" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* ── Save ─────────────────────────────────────────────────── */}
        <div className="flex justify-end pb-6">
          <Button type="submit" disabled={saving} className="px-8">
            {saving ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</>
            ) : (
              <><Save className="w-4 h-4 mr-2" />Save Profile</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
