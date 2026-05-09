"use client";

/**
 * AI Resume Analyzer — the showpiece module.
 *
 * Three tabs:
 *  1. ATS Score   — circular score ring + section bars + top issues
 *  2. Job Matches — top 5 jobs ranked by AI match score
 *  3. JD Compare  — paste any JD, get skills gap + suggestions
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Briefcase,
  ChevronRight,
  FileText,
  TrendingUp,
  GitCompare,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ATSResult {
  score: number;
  summary: string;
  sections: { name: string; score: number; feedback: string }[];
  topIssues: string[];
}

interface JobMatch {
  jobId: string;
  title: string;
  company: string;
  matchScore: number;
  reason: string;
  package: string;
}

interface JDResult {
  matchScore: number;
  matchingSkills: string[];
  missingSkills: string[];
  suggestions: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type ScoreRange = "great" | "good" | "ok" | "poor";

function scoreRange(n: number): ScoreRange {
  if (n >= 80) return "great";
  if (n >= 65) return "good";
  if (n >= 45) return "ok";
  return "poor";
}

const RING_COLORS: Record<ScoreRange, string> = {
  great: "#16a34a",
  good:  "#2563eb",
  ok:    "#d97706",
  poor:  "#dc2626",
};

const TEXT_COLORS: Record<ScoreRange, string> = {
  great: "text-green-600",
  good:  "text-blue-600",
  ok:    "text-amber-600",
  poor:  "text-red-600",
};

const BAR_COLORS: Record<ScoreRange, string> = {
  great: "bg-green-500",
  good:  "bg-blue-500",
  ok:    "bg-amber-500",
  poor:  "bg-red-500",
};

const SCORE_LABELS: Record<ScoreRange, string> = {
  great: "Excellent",
  good:  "Good",
  ok:    "Needs Work",
  poor:  "Poor",
};

/** SVG circular score ring */
function ScoreRing({ score }: { score: number }) {
  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);
  const range = scoreRange(score);
  const color = RING_COLORS[range];

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="180" height="180" className="-rotate-90">
        {/* Track */}
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="12"
        />
        {/* Progress */}
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-4xl font-bold ${TEXT_COLORS[range]}`}>{score}</span>
        <span className="text-xs text-gray-400 font-medium mt-0.5">/ 100</span>
        <span className={`text-xs font-semibold mt-1 ${TEXT_COLORS[range]}`}>
          {SCORE_LABELS[range]}
        </span>
      </div>
    </div>
  );
}

/** Horizontal score bar for section breakdown */
function SectionBar({
  name,
  score,
  feedback,
}: {
  name: string;
  score: number;
  feedback: string;
}) {
  const range = scoreRange(score);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">{name}</span>
        <span className={`font-bold ${TEXT_COLORS[range]}`}>{score}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${BAR_COLORS[range]} transition-all duration-700`}
          style={{ width: `${score}%` }}
        />
      </div>
      <p className="text-xs text-gray-500">{feedback}</p>
    </div>
  );
}

// ─── Tab definitions ──────────────────────────────────────────────────────────

const TABS = [
  { id: "ats",     label: "ATS Score",    icon: TrendingUp   },
  { id: "match",   label: "Job Matches",  icon: Briefcase    },
  { id: "compare", label: "JD Compare",   icon: GitCompare   },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ResumeAnalyzerPage() {
  const [hasResume, setHasResume] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("ats");

  // ATS state
  const [atsLoading, setAtsLoading] = useState(false);
  const [atsResult, setAtsResult] = useState<ATSResult | null>(null);
  const [atsError, setAtsError] = useState("");

  // Job Match state
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchResult, setMatchResult] = useState<JobMatch[] | null>(null);
  const [matchError, setMatchError] = useState("");

  // JD Compare state
  const [jd, setJd] = useState("");
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareResult, setCompareResult] = useState<JDResult | null>(null);
  const [compareError, setCompareError] = useState("");

  // Check if student has a resume on mount
  useEffect(() => {
    fetch("/api/student/profile")
      .then((r) => r.json())
      .then((data) => setHasResume(!!data.hasResume))
      .catch(() => setHasResume(false));
  }, []);

  // ── ATS Analyze ─────────────────────────────────────────────────────────────

  async function runATSAnalysis() {
    setAtsLoading(true);
    setAtsError("");
    setAtsResult(null);
    try {
      const res = await fetch("/api/student/resume/analyze", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setAtsError(data.error ?? "Analysis failed");
      } else {
        setAtsResult(data);
      }
    } catch {
      setAtsError("Network error. Please try again.");
    } finally {
      setAtsLoading(false);
    }
  }

  // ── Job Match ───────────────────────────────────────────────────────────────

  async function runJobMatch() {
    setMatchLoading(true);
    setMatchError("");
    setMatchResult(null);
    try {
      const res = await fetch("/api/student/resume/match", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setMatchError(data.error ?? "Matching failed");
      } else {
        setMatchResult(data.matches ?? []);
      }
    } catch {
      setMatchError("Network error. Please try again.");
    } finally {
      setMatchLoading(false);
    }
  }

  // ── JD Compare ──────────────────────────────────────────────────────────────

  async function runJDCompare() {
    if (!jd.trim()) {
      setCompareError("Please paste a job description first.");
      return;
    }
    setCompareLoading(true);
    setCompareError("");
    setCompareResult(null);
    try {
      const res = await fetch("/api/student/resume/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription: jd }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCompareError(data.error ?? "Comparison failed");
      } else {
        setCompareResult(data);
      }
    } catch {
      setCompareError("Network error. Please try again.");
    } finally {
      setCompareLoading(false);
    }
  }

  // ── Loading skeleton ─────────────────────────────────────────────────────────

  if (hasResume === null) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400 mr-2" />
        <span className="text-gray-400">Loading…</span>
      </div>
    );
  }

  // ── No resume state ──────────────────────────────────────────────────────────

  if (!hasResume) {
    return (
      <div className="max-w-md mx-auto text-center py-24">
        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <FileText className="w-8 h-8 text-indigo-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">No Resume Found</h2>
        <p className="text-gray-500 text-sm mb-6">
          Upload your resume on the Profile page first — then come back here for
          your AI-powered analysis.
        </p>
        <Link href="/student/profile">
          <Button>
            Go to Profile <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </div>
    );
  }

  // ── Main UI ──────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-indigo-500" />
          <h1 className="text-2xl font-bold text-gray-900">AI Resume Analyzer</h1>
        </div>
        <p className="text-gray-500 text-sm">
          Powered by Claude — get instant feedback, job matches, and gap analysis.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-7">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Tab: ATS Score ── */}
      {activeTab === "ats" && (
        <div className="space-y-5">
          {!atsResult && (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center">
                <TrendingUp className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="font-medium text-gray-700 mb-1">
                  Check your ATS compatibility score
                </p>
                <p className="text-sm text-gray-400 mb-5">
                  Claude will analyse your resume and score it across 5 key sections.
                </p>
                <Button onClick={runATSAnalysis} disabled={atsLoading} className="gap-2">
                  {atsLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {atsLoading ? "Analysing…" : "Analyse My Resume"}
                </Button>
                {atsError && (
                  <p className="text-sm text-red-500 mt-3 flex items-center justify-center gap-1">
                    <AlertCircle className="w-4 h-4" /> {atsError}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {atsLoading && !atsResult && (
            <Card>
              <CardContent className="py-10 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">
                  Claude is reading your resume…
                </p>
              </CardContent>
            </Card>
          )}

          {atsResult && (
            <>
              {/* Score ring card */}
              <Card>
                <CardContent className="py-8">
                  <div className="flex flex-col sm:flex-row items-center gap-8">
                    <ScoreRing score={atsResult.score} />
                    <div className="flex-1 text-center sm:text-left">
                      <h2 className="text-lg font-bold text-gray-900 mb-2">
                        Overall ATS Score
                      </h2>
                      <p className="text-gray-500 text-sm leading-relaxed">
                        {atsResult.summary}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4 gap-1.5"
                        onClick={runATSAnalysis}
                        disabled={atsLoading}
                      >
                        {atsLoading ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                        Re-analyse
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Section breakdown */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Section Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {atsResult.sections.map((s) => (
                    <SectionBar
                      key={s.name}
                      name={s.name}
                      score={s.score}
                      feedback={s.feedback}
                    />
                  ))}
                </CardContent>
              </Card>

              {/* Top issues */}
              {atsResult.topIssues.length > 0 && (
                <Card className="border-amber-200 bg-amber-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-amber-800 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" />
                      Top Issues to Fix
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {atsResult.topIssues.map((issue, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-amber-800"
                        >
                          <span className="mt-0.5 w-5 h-5 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {i + 1}
                          </span>
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Tab: Job Matches ── */}
      {activeTab === "match" && (
        <div className="space-y-4">
          {!matchResult && (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center">
                <Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="font-medium text-gray-700 mb-1">
                  Find your best-fit jobs
                </p>
                <p className="text-sm text-gray-400 mb-5">
                  Claude will rank all open jobs by how well they match your resume.
                </p>
                <Button
                  onClick={runJobMatch}
                  disabled={matchLoading}
                  className="gap-2"
                >
                  {matchLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {matchLoading ? "Matching…" : "Find Matching Jobs"}
                </Button>
                {matchError && (
                  <p className="text-sm text-red-500 mt-3 flex items-center justify-center gap-1">
                    <AlertCircle className="w-4 h-4" /> {matchError}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {matchLoading && !matchResult && (
            <Card>
              <CardContent className="py-10 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">
                  Claude is comparing your profile against open jobs…
                </p>
              </CardContent>
            </Card>
          )}

          {matchResult && matchResult.length === 0 && (
            <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
              <Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No open jobs available right now</p>
              <p className="text-sm text-gray-400 mt-1">
                Check back once the TPO posts new placement drives.
              </p>
            </div>
          )}

          {matchResult && matchResult.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm text-gray-500">
                  Top {matchResult.length} matches out of all open jobs
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={runJobMatch}
                  disabled={matchLoading}
                  className="gap-1 text-xs"
                >
                  {matchLoading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                  Refresh
                </Button>
              </div>

              {matchResult.map((m, i) => {
                const range = scoreRange(m.matchScore);
                return (
                  <Card key={m.jobId} className="overflow-hidden">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        {/* Rank bubble */}
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold text-white ${
                            i === 0
                              ? "bg-indigo-600"
                              : i === 1
                              ? "bg-indigo-400"
                              : "bg-gray-400"
                          }`}
                        >
                          #{i + 1}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {m.title}
                              </h3>
                              <p className="text-sm text-gray-500 mt-0.5">
                                {m.company}
                                {m.package && (
                                  <span className="ml-2 font-medium text-gray-700">
                                    · {m.package}
                                  </span>
                                )}
                              </p>
                            </div>
                            <div className={`text-right flex-shrink-0`}>
                              <span
                                className={`text-2xl font-bold ${TEXT_COLORS[range]}`}
                              >
                                {m.matchScore}%
                              </span>
                              <p className="text-xs text-gray-400">match</p>
                            </div>
                          </div>

                          {/* Match bar */}
                          <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${BAR_COLORS[range]}`}
                              style={{ width: `${m.matchScore}%` }}
                            />
                          </div>

                          <p className="text-xs text-gray-500 mt-2 italic">
                            {m.reason}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* ── Tab: JD Compare ── */}
      {activeTab === "compare" && (
        <div className="space-y-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Paste a Job Description</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                placeholder="Paste the full job description here… include required skills, responsibilities, and qualifications."
                className="min-h-[160px] resize-y text-sm"
              />
              <div className="flex items-center gap-2">
                <Button
                  onClick={runJDCompare}
                  disabled={compareLoading || !jd.trim()}
                  className="gap-2"
                >
                  {compareLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {compareLoading ? "Comparing…" : "Compare with My Resume"}
                </Button>
                {jd.trim() && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setJd("");
                      setCompareResult(null);
                      setCompareError("");
                    }}
                  >
                    Clear
                  </Button>
                )}
              </div>
              {compareError && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> {compareError}
                </p>
              )}
            </CardContent>
          </Card>

          {compareLoading && !compareResult && (
            <Card>
              <CardContent className="py-10 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">
                  Claude is comparing your resume against the JD…
                </p>
              </CardContent>
            </Card>
          )}

          {compareResult && (
            <>
              {/* Match score banner */}
              <Card>
                <CardContent className="py-6">
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p
                        className={`text-5xl font-bold ${TEXT_COLORS[scoreRange(compareResult.matchScore)]}`}
                      >
                        {compareResult.matchScore}%
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {SCORE_LABELS[scoreRange(compareResult.matchScore)]} match
                      </p>
                    </div>
                    <div className="flex-1">
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${BAR_COLORS[scoreRange(compareResult.matchScore)]} transition-all duration-700`}
                          style={{ width: `${compareResult.matchScore}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        Based on skill overlap, experience alignment, and keyword
                        coverage.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Skills grid */}
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Matching skills */}
                <Card className="border-green-200 bg-green-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-green-800 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Matching Skills ({compareResult.matchingSkills.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {compareResult.matchingSkills.length === 0 ? (
                      <p className="text-xs text-green-700 italic">
                        No direct skill matches found
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {compareResult.matchingSkills.map((skill) => (
                          <Badge
                            key={skill}
                            className="bg-green-200 text-green-800 hover:bg-green-200 text-xs"
                          >
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Missing skills */}
                <Card className="border-red-200 bg-red-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-red-800 flex items-center gap-1.5">
                      <XCircle className="w-4 h-4" />
                      Skills to Add ({compareResult.missingSkills.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {compareResult.missingSkills.length === 0 ? (
                      <p className="text-xs text-red-700 italic">
                        Great — no major skill gaps detected!
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {compareResult.missingSkills.map((skill) => (
                          <Badge
                            key={skill}
                            className="bg-red-200 text-red-800 hover:bg-red-200 text-xs"
                          >
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Suggestions */}
              {compareResult.suggestions.length > 0 && (
                <Card className="border-indigo-200 bg-indigo-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-indigo-800 flex items-center gap-1.5">
                      <Lightbulb className="w-4 h-4" />
                      Improvement Suggestions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2.5">
                      {compareResult.suggestions.map((tip, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-indigo-900"
                        >
                          <span className="mt-0.5 w-5 h-5 rounded-full bg-indigo-200 text-indigo-800 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {i + 1}
                          </span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
