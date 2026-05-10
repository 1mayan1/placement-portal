/**
 * Public landing page — shown to all visitors at /.
 * Logged-in users are bounced to their dashboard immediately.
 */

import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  Sparkles,
  FileText,
  Briefcase,
  Mic,
  ClipboardList,
  ArrowRight,
  GraduationCap,
  CheckCircle2,
} from "lucide-react";

// ─── Feature cards ────────────────────────────────────────────────────────────

const features = [
  {
    icon: FileText,
    color: "bg-violet-100 text-violet-600",
    ring: "ring-violet-100",
    title: "AI Resume Analyzer",
    description:
      "Upload your resume and get an instant ATS compatibility score, section-by-section feedback, and a prioritised list of issues to fix — powered by Claude AI.",
  },
  {
    icon: Briefcase,
    color: "bg-blue-100 text-blue-600",
    ring: "ring-blue-100",
    title: "Smart Job Matching",
    description:
      "Claude reads your resume and ranks every open placement drive by match percentage, so you always apply to the most relevant roles first.",
  },
  {
    icon: Mic,
    color: "bg-emerald-100 text-emerald-600",
    ring: "ring-emerald-100",
    title: "Mock Interview Practice",
    description:
      "Practise with 5 AI-generated role-specific questions — a mix of technical and behavioural. Get an instant score and detailed feedback on every answer.",
  },
  {
    icon: ClipboardList,
    color: "bg-orange-100 text-orange-600",
    ring: "ring-orange-100",
    title: "Easy Application Tracking",
    description:
      "Apply to jobs in one click and track your status in real time — from Applied and Shortlisted all the way to Selected and Placed.",
  },
];

const stats = [
  { value: "5+",   label: "AI-Powered Features" },
  { value: "2",    label: "Roles — Student & TPO" },
  { value: "100%", label: "End-to-End Workflow" },
];

const pillFeatures = [
  "ATS Resume Scoring",
  "AI Job Matching",
  "JD Gap Analysis",
  "Mock Interview",
  "Application Tracking",
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function LandingPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role === "student") redirect("/student/dashboard");
  if (session?.user?.role === "tpo") redirect("/tpo/dashboard");

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* ── Fixed navbar ─────────────────────────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-500 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-sm tracking-tight hidden sm:block">
              MCA Placement Portal
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="text-sm text-white/75 hover:text-white px-4 py-2 rounded-lg hover:bg-white/10 transition-colors font-medium"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="text-sm bg-indigo-500 hover:bg-indigo-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Sign Up Free
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 pt-16 overflow-hidden">
        {/* Subtle dot-grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #fff 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Glow blobs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-6 py-28 sm:py-36 text-center">
          {/* AI badge */}
          <div className="inline-flex items-center gap-1.5 bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-8 tracking-wide">
            <Sparkles className="w-3 h-3" />
            Made by Sarvpriya Shrivastava · Powered by Claude AI
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-tight mb-6">
            AI-Powered College
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
              Placement Portal
            </span>
          </h1>

          <p className="text-base sm:text-lg text-white/55 max-w-2xl mx-auto mb-10 leading-relaxed">
            Automate resume screening, match students to the right jobs, and help every
            student walk into their placement interview fully prepared — with AI working
            alongside your placement cell.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold px-7 py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-400/30 text-sm"
            >
              Student Portal <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/[0.15] border border-white/20 text-white font-semibold px-7 py-3.5 rounded-xl transition-colors text-sm"
            >
              TPO / Admin Login
            </Link>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-2">
            {pillFeatures.map((f) => (
              <span
                key={f}
                className="inline-flex items-center gap-1.5 text-xs bg-white/5 border border-white/10 text-white/45 px-3 py-1.5 rounded-full"
              >
                <CheckCircle2 className="w-3 h-3 text-indigo-400" />
                {f}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything your placement cell needs
            </h2>
            <p className="text-gray-500 text-base max-w-xl mx-auto leading-relaxed">
              From the moment a student uploads their resume to the day they receive an
              offer letter — the entire workflow automated and AI-enhanced.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm hover:shadow-md transition-shadow group"
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${f.color} ring-4 ${f.ring}`}
                >
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────────────────────── */}
      <section className="py-16 px-6 bg-indigo-600">
        <div className="max-w-4xl mx-auto grid sm:grid-cols-3 gap-10 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-5xl font-extrabold text-white tracking-tight mb-2">
                {s.value}
              </p>
              <p className="text-indigo-200 text-sm font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works (two roles) ─────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Two roles. One seamless platform.
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-8">
            {/* Student */}
            <div className="border border-gray-200 rounded-2xl p-8">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mb-5">
                <GraduationCap className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">For Students</h3>
              <ul className="space-y-3">
                {[
                  "Upload resume — AI fills your profile instantly",
                  "Browse open jobs with real-time eligibility check",
                  "Apply in one click, track status live",
                  "Get ATS score and improvement tips",
                  "Practise mock interviews before the big day",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Create Student Account <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* TPO */}
            <div className="border border-gray-200 rounded-2xl p-8">
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center mb-5">
                <Briefcase className="w-5 h-5 text-slate-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                For Training &amp; Placement Officers
              </h3>
              <ul className="space-y-3">
                {[
                  "Post placement drives in minutes",
                  "Set eligibility — branch, CGPA, backlogs",
                  "Review all applicants with full profiles",
                  "Shortlist, select, and mark students as placed",
                  "Dashboard with live placement statistics",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/login"
                className="mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-700 hover:text-gray-900"
              >
                TPO Login <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="py-10 px-6 bg-slate-950 text-center mt-auto">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-6 h-6 bg-indigo-500 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-white/60 text-sm font-medium">MCA Placement Portal</span>
        </div>
        <p className="text-white/30 text-xs">
          Shri Ram Institute of Technology, Jabalpur · MCA Department · Major Project 2025–26 · Made by Sarvpriya Shrivastava (0205CA241037)
        </p>
      </footer>

    </div>
  );
}
