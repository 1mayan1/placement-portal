"use client";

/**
 * Mock Interview — Phase 7 showpiece.
 *
 * State machine:
 *   setup → starting → asking → grading → graded → (loop) → done
 *
 * Two tabs: "New Interview" + "Past Sessions"
 */

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Sparkles,
  Mic,
  ChevronDown,
  ChevronUp,
  Trophy,
  Star,
  AlertCircle,
  Bot,
  CheckCircle2,
  Clock,
  RotateCcw,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase =
  | "setup"       // Role selection screen
  | "starting"    // Fetching questions from Claude
  | "asking"      // Showing current question, waiting for student's answer
  | "grading"     // Claude is evaluating the submitted answer
  | "graded"      // Showing the score + feedback for this answer
  | "done";       // All 5 answered — showing final results

type TabId = "new" | "history";

interface EvalResult {
  question: string;
  answer: string;
  score: number;
  feedback: string;
}

interface PastSession {
  _id: string;
  jobRole: string;
  overallScore: number;
  createdAt: string;
  questions: { q: string; answer: string; score: number; feedback: string }[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(n: number, max = 100): string {
  const pct = (n / max) * 100;
  if (pct >= 75) return "text-green-600";
  if (pct >= 55) return "text-blue-600";
  if (pct >= 40) return "text-amber-600";
  return "text-red-600";
}

function scoreBg(n: number, max = 100): string {
  const pct = (n / max) * 100;
  if (pct >= 75) return "bg-green-100 text-green-700";
  if (pct >= 55) return "bg-blue-100 text-blue-700";
  if (pct >= 40) return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
}

function scoreLabel(n: number, max = 100): string {
  const pct = (n / max) * 100;
  if (pct >= 75) return "Excellent";
  if (pct >= 55) return "Good";
  if (pct >= 40) return "Average";
  return "Needs Improvement";
}

/** SVG circular score ring */
function ScoreRing({ score }: { score: number }) {
  const r = 60;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  const color =
    score >= 75 ? "#16a34a" : score >= 55 ? "#2563eb" : score >= 40 ? "#d97706" : "#dc2626";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="152" height="152" className="-rotate-90">
        <circle cx="76" cy="76" r={r} fill="none" stroke="#e5e7eb" strokeWidth="10" />
        <circle
          cx="76"
          cy="76"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-3xl font-bold ${scoreColor(score)}`}>{score}</span>
        <span className="text-xs text-gray-400 font-medium">/ 100</span>
        <span className={`text-[11px] font-semibold mt-0.5 ${scoreColor(score)}`}>
          {scoreLabel(score)}
        </span>
      </div>
    </div>
  );
}

/** 5 progress dots — filled up to the current question index */
function ProgressDots({ current, total = 5 }: { current: number; total?: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`rounded-full transition-all duration-300 ${
            i < current
              ? "w-4 h-4 bg-indigo-600"
              : i === current
              ? "w-4 h-4 bg-indigo-300 ring-2 ring-indigo-400 ring-offset-1"
              : "w-3 h-3 bg-gray-200"
          }`}
        />
      ))}
      <span className="ml-1 text-sm text-gray-500">
        Question <strong>{current + 1}</strong> of {total}
      </span>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function MockInterviewPage() {
  const [activeTab, setActiveTab] = useState<TabId>("new");

  // Role setup
  const [appliedRoles, setAppliedRoles] = useState<{ label: string; value: string }[]>([]);
  const [selectedRole, setSelectedRole] = useState("__custom__");
  const [customRole, setCustomRole] = useState("");
  const [setupError, setSetupError] = useState("");

  // Interview session
  const [phase, setPhase] = useState<Phase>("setup");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [interviewRole, setInterviewRole] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answer, setAnswer] = useState("");
  const [evalResults, setEvalResults] = useState<EvalResult[]>([]);
  const [currentEval, setCurrentEval] = useState<{ score: number; feedback: string } | null>(null);
  const [overallScore, setOverallScore] = useState<number | null>(null);
  const [apiError, setApiError] = useState("");

  // History
  const [pastSessions, setPastSessions] = useState<PastSession[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Fetch applied job roles for dropdown
  useEffect(() => {
    fetch("/api/student/applications")
      .then((r) => r.json())
      .then((data) => {
        const roles = (data.applications ?? [])
          .filter((a: { job: unknown }) => a.job)
          .map((a: { job: { title: string; company: string } }) => ({
            label: `${a.job.title} — ${a.job.company}`,
            value: a.job.title,
          }));
        const seen = new Set<string>();
        const unique = roles.filter((r: { value: string }) => {
          if (seen.has(r.value)) return false;
          seen.add(r.value);
          return true;
        });
        setAppliedRoles(unique);
      })
      .catch(() => {});
  }, []);

  // Fetch history when switching to history tab
  useEffect(() => {
    if (activeTab !== "history") return;
    setHistoryLoading(true);
    fetch("/api/student/interview/sessions")
      .then((r) => r.json())
      .then((data) => setPastSessions(data.sessions ?? []))
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, [activeTab]);

  // ── Derived ────────────────────────────────────────────────────────────────

  const finalRole =
    selectedRole === "__custom__" ? customRole.trim() : selectedRole;

  const inInterview = ["starting", "asking", "grading", "graded", "done"].includes(phase);

  // ── Handlers ───────────────────────────────────────────────────────────────

  async function startInterview() {
    if (!finalRole) {
      setSetupError("Please select or type a role.");
      return;
    }
    setSetupError("");
    setApiError("");
    setPhase("starting");

    try {
      const res = await fetch("/api/student/interview/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: finalRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        setApiError(data.error ?? "Failed to start interview");
        setPhase("setup");
        return;
      }
      setSessionId(data.sessionId);
      setQuestions(data.questions);
      setInterviewRole(finalRole);
      setCurrentQ(0);
      setEvalResults([]);
      setAnswer("");
      setCurrentEval(null);
      setOverallScore(null);
      setPhase("asking");
    } catch {
      setApiError("Network error. Please try again.");
      setPhase("setup");
    }
  }

  async function submitAnswer() {
    if (!answer.trim() || !sessionId) return;
    setPhase("grading");
    setApiError("");

    try {
      const res = await fetch(`/api/student/interview/${sessionId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionIndex: currentQ, answer: answer.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setApiError(data.error ?? "Evaluation failed");
        setPhase("asking");
        return;
      }

      setEvalResults((prev) => [
        ...prev,
        {
          question: questions[currentQ],
          answer: answer.trim(),
          score: data.score,
          feedback: data.feedback,
        },
      ]);
      setCurrentEval({ score: data.score, feedback: data.feedback });

      if (data.isComplete) {
        setOverallScore(data.overallScore);
      }
      setPhase("graded");
    } catch {
      setApiError("Network error. Please try again.");
      setPhase("asking");
    }
  }

  function continueToNext() {
    if (currentQ === 4) {
      setPhase("done");
      return;
    }
    setCurrentQ((q) => q + 1);
    setAnswer("");
    setCurrentEval(null);
    setPhase("asking");
  }

  function resetInterview() {
    setPhase("setup");
    setSessionId(null);
    setQuestions([]);
    setCurrentQ(0);
    setAnswer("");
    setEvalResults([]);
    setCurrentEval(null);
    setOverallScore(null);
    setApiError("");
    setSetupError("");
    setSelectedRole("__custom__");
    setCustomRole("");
  }

  // ── Render sections ────────────────────────────────────────────────────────

  function renderSetup() {
    return (
      <div className="max-w-lg mx-auto">
        <Card>
          <CardContent className="py-8 px-8">
            <div className="text-center mb-7">
              <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Mic className="w-7 h-7 text-indigo-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Start a Mock Interview</h2>
              <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
                Claude generates 5 role-specific questions — a mix of technical and
                behavioural. Each answer gets instant AI feedback.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  What role are you preparing for?
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => {
                    setSelectedRole(e.target.value);
                    setSetupError("");
                  }}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  {appliedRoles.length > 0 && (
                    <optgroup label="Your Applied Jobs">
                      {appliedRoles.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  <optgroup label="Custom">
                    <option value="__custom__">✏️ Type a custom role…</option>
                  </optgroup>
                </select>
              </div>

              {selectedRole === "__custom__" && (
                <input
                  type="text"
                  value={customRole}
                  onChange={(e) => {
                    setCustomRole(e.target.value);
                    setSetupError("");
                  }}
                  placeholder="e.g. Full Stack Developer, Data Analyst, DevOps Engineer…"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onKeyDown={(e) => e.key === "Enter" && startInterview()}
                />
              )}

              {(setupError || apiError) && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {setupError || apiError}
                </p>
              )}

              <Button
                className="w-full gap-2"
                onClick={startInterview}
                disabled={!finalRole}
              >
                <Sparkles className="w-4 h-4" />
                Start Interview
              </Button>

              <p className="text-xs text-center text-gray-400">
                Takes ~15 seconds to generate questions via Claude AI
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  function renderAsking() {
    const question = questions[currentQ];

    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <ProgressDots current={currentQ} />
          <Badge variant="secondary" className="text-xs gap-1">
            <Mic className="w-3 h-3" />
            {interviewRole}
          </Badge>
        </div>

        {/* Question */}
        <Card className="border-indigo-200 bg-indigo-50">
          <CardContent className="py-5 px-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-medium text-indigo-500 mb-1.5">AI Interviewer</p>
                <p className="text-gray-900 font-medium leading-relaxed">{question}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Answer */}
        <div className="space-y-3">
          <Textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer here… Be specific and give examples where possible."
            className="min-h-[140px] resize-none text-sm"
            disabled={phase === "grading"}
          />

          {apiError && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" /> {apiError}
            </p>
          )}

          <Button
            className="w-full gap-2"
            onClick={submitAnswer}
            disabled={!answer.trim() || phase === "grading"}
          >
            {phase === "grading" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Claude is evaluating your answer…
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Submit Answer
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  function renderGraded() {
    if (!currentEval) return null;
    const isLast = currentQ === 4;
    const pct = currentEval.score * 10;

    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <ProgressDots current={currentQ} />
          <Badge variant="secondary" className="text-xs gap-1">
            <Mic className="w-3 h-3" />
            {interviewRole}
          </Badge>
        </div>

        {/* Question recap */}
        <Card className="border-indigo-100 bg-indigo-50">
          <CardContent className="py-4 px-5">
            <p className="text-xs font-medium text-indigo-500 mb-1">Question {currentQ + 1}</p>
            <p className="text-sm text-gray-800 font-medium">{questions[currentQ]}</p>
          </CardContent>
        </Card>

        {/* Evaluation result */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div
              className={`px-6 py-4 flex items-center gap-4 border-b ${
                pct >= 75
                  ? "bg-green-50 border-green-100"
                  : pct >= 55
                  ? "bg-blue-50 border-blue-100"
                  : pct >= 40
                  ? "bg-amber-50 border-amber-100"
                  : "bg-red-50 border-red-100"
              }`}
            >
              <div className={`text-4xl font-bold ${scoreColor(currentEval.score, 10)}`}>
                {currentEval.score}
                <span className="text-xl font-medium text-gray-400">/10</span>
              </div>
              <div>
                <p className={`font-semibold ${scoreColor(currentEval.score, 10)}`}>
                  {scoreLabel(currentEval.score, 10)}
                </p>
                <p className="text-xs text-gray-500">Answer score</p>
              </div>
            </div>
            <div className="px-6 py-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                AI Feedback
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">{currentEval.feedback}</p>
            </div>
          </CardContent>
        </Card>

        <Button className="w-full gap-2" onClick={continueToNext}>
          {isLast ? (
            <>
              <Trophy className="w-4 h-4" />
              View Final Results
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Next Question
            </>
          )}
        </Button>
      </div>
    );
  }

  function renderDone() {
    const score = overallScore ?? 0;

    return (
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Trophy header */}
        <div className="text-center py-4">
          <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Trophy className="w-7 h-7 text-amber-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Interview Complete!</h2>
          <p className="text-sm text-gray-500 mt-1">
            You practised for <strong>{interviewRole}</strong>
          </p>
        </div>

        {/* Overall score ring */}
        <Card>
          <CardContent className="py-6 flex flex-col sm:flex-row items-center gap-6">
            <ScoreRing score={score} />
            <div className="text-center sm:text-left">
              <p className="text-lg font-bold text-gray-900">Overall Score</p>
              <p className="text-sm text-gray-500 mt-1">
                Based on quality, relevance, and depth across all 5 answers.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge className={scoreBg(score)}>{scoreLabel(score)}</Badge>
                <Badge variant="secondary" className="gap-1">
                  <Star className="w-3 h-3" />
                  {evalResults.length} questions answered
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Per-question breakdown */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Question-by-Question Breakdown
          </h3>
          <div className="space-y-3">
            {evalResults.map((e, i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="px-5 py-3 bg-gray-50 border-b flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
                        {i + 1}
                      </span>
                      <p className="text-sm font-medium text-gray-800 leading-snug">
                        {e.question}
                      </p>
                    </div>
                    <span className={`text-sm font-bold flex-shrink-0 ${scoreColor(e.score, 10)}`}>
                      {e.score}/10
                    </span>
                  </div>
                  <div className="px-5 py-3 space-y-2">
                    <div>
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
                        Your Answer
                      </p>
                      <p className="text-sm text-gray-600 line-clamp-3">{e.answer}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
                        Feedback
                      </p>
                      <p className="text-sm text-gray-700 leading-relaxed">{e.feedback}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button className="flex-1 gap-2" onClick={resetInterview}>
            <RotateCcw className="w-4 h-4" />
            Practice Again
          </Button>
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={() => {
              resetInterview();
              setActiveTab("history");
            }}
          >
            <Clock className="w-4 h-4" />
            View History
          </Button>
        </div>
      </div>
    );
  }

  function renderHistory() {
    if (historyLoading) {
      return (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400 mr-2" />
          <span className="text-gray-400">Loading history…</span>
        </div>
      );
    }

    if (pastSessions.length === 0) {
      return (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-xl">
          <Mic className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No completed interviews yet</p>
          <p className="text-sm text-gray-400 mt-1 mb-4">
            Complete your first mock interview to see it here.
          </p>
          <Button variant="outline" onClick={() => setActiveTab("new")}>
            Start an Interview
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {pastSessions.map((s) => {
          const expanded = expandedId === s._id;
          const date = new Date(s.createdAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });

          return (
            <Card key={s._id} className="overflow-hidden">
              <button
                className="w-full text-left"
                onClick={() => setExpandedId(expanded ? null : s._id)}
              >
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Mic className="w-4 h-4 text-indigo-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{s.jobRole}</p>
                        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {date}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <p className={`text-xl font-bold ${scoreColor(s.overallScore)}`}>
                          {s.overallScore}
                        </p>
                        <p className="text-xs text-gray-400">/ 100</p>
                      </div>
                      <Badge className={scoreBg(s.overallScore)}>
                        {scoreLabel(s.overallScore)}
                      </Badge>
                      {expanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </button>

              {expanded && (
                <div className="border-t border-gray-100 bg-gray-50 px-5 py-4 space-y-4">
                  {s.questions.map((q, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
                          {i + 1}
                        </span>
                        <p className="text-sm font-semibold text-gray-800 leading-snug flex-1">
                          {q.q}
                        </p>
                        <span
                          className={`text-sm font-bold flex-shrink-0 ${scoreColor(q.score, 10)}`}
                        >
                          {q.score}/10
                        </span>
                      </div>
                      <div className="ml-7 space-y-1">
                        <p className="text-xs text-gray-500 line-clamp-2">{q.answer}</p>
                        <p className="text-xs text-gray-700 italic bg-white rounded p-2 border border-gray-100">
                          {q.feedback}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    );
  }

  // ── Root render ──────────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl mx-auto">
      {/* Page header */}
      <div className="mb-7">
        <div className="flex items-center gap-2 mb-1">
          <Mic className="w-5 h-5 text-indigo-500" />
          <h1 className="text-2xl font-bold text-gray-900">Mock Interview</h1>
        </div>
        <p className="text-gray-500 text-sm">
          AI-powered practice with instant feedback — get ready for your placement drive.
        </p>
      </div>

      {/* Tab bar — hidden while an interview is running */}
      {!inInterview && (
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-7">
          {(["new", "history"] as TabId[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab === "new" ? "New Interview" : "Past Sessions"}
            </button>
          ))}
        </div>
      )}

      {/* Content area */}
      {!inInterview && activeTab === "new" && renderSetup()}
      {!inInterview && activeTab === "history" && renderHistory()}

      {inInterview && phase === "starting" && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
          <p className="text-gray-500 text-sm">
            Claude is crafting 5 questions for{" "}
            <strong className="text-gray-700">{finalRole}</strong>…
          </p>
        </div>
      )}

      {inInterview && (phase === "asking" || phase === "grading") && renderAsking()}
      {inInterview && phase === "graded" && renderGraded()}
      {inInterview && phase === "done" && renderDone()}
    </div>
  );
}
