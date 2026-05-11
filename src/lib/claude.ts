/**
 * Claude API helpers — all AI features in the project go through this file.
 *
 * We create the client lazily (on first use) so the server doesn't crash
 * on startup if ANTHROPIC_API_KEY hasn't been set yet.
 */

import Anthropic from "@anthropic-ai/sdk";

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error(
        "ANTHROPIC_API_KEY is not set in .env.local — add it to use AI features"
      );
    }
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _client;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ExtractedResumeData {
  name: string;
  phone: string;
  branch: string;
  semester: number;
  cgpa: number;
  backlogs: number;
  skills: string[];
  education: {
    degree: string;
    institution: string;
    year: string;
    percentage: string;
  }[];
  projects: {
    title: string;
    description: string;
    technologies: string[];
  }[];
  certifications: string[];
}

// ─── Resume Parser ─────────────────────────────────────────────────────────────

/**
 * Sends resume plain-text to Claude and gets back a clean structured JSON object.
 * Claude is instructed to return ONLY JSON — no markdown, no explanation.
 */
export async function extractResumeData(
  resumeText: string
): Promise<ExtractedResumeData> {
  const client = getClient();

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `You are a resume parser. Extract information from the resume text below and return ONLY a valid JSON object — no markdown code blocks, no explanation, just the raw JSON.

Resume text:
---
${resumeText.slice(0, 8000)}
---

Return exactly this JSON structure (fill with empty string / 0 / [] if info is missing):
{
  "name": "full name of the candidate",
  "phone": "phone number",
  "branch": "infer degree program: MCA / BCA / MBA / B.Tech / M.Tech etc.",
  "semester": 0,
  "cgpa": 0.0,
  "backlogs": 0,
  "skills": ["skill1", "skill2"],
  "education": [
    { "degree": "", "institution": "", "year": "", "percentage": "" }
  ],
  "projects": [
    { "title": "", "description": "1-2 sentence summary", "technologies": ["tech1"] }
  ],
  "certifications": ["cert1", "cert2"]
}

Rules:
- skills: individual tools/technologies only (e.g. "Python", "React") — not full sentences
- cgpa: decimal number like 8.5, or 0 if not found
- semester: integer 1-6 or 0 if unknown
- backlogs: integer, almost always 0 in a resume`,
      },
    ],
  });

  const raw =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Strip any accidental markdown fences Claude might add
  const cleaned = raw.replace(/^```(?:json)?\n?/gm, "").replace(/```$/gm, "").trim();

  // Find the outermost JSON object
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error("Claude did not return a valid JSON object");
  }

  return JSON.parse(match[0]) as ExtractedResumeData;
}

// ─── ATS Scorer ───────────────────────────────────────────────────────────────

export interface ATSResult {
  score: number; // 0-100
  summary: string;
  sections: {
    name: string;
    score: number;
    feedback: string;
  }[];
  topIssues: string[];
}

/**
 * Analyses a resume and returns an ATS (Applicant Tracking System) score + feedback.
 * Used on the Resume Analyzer page.
 */
export async function scoreResume(resumeText: string): Promise<ATSResult> {
  const client = getClient();

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are an ATS (Applicant Tracking System) expert. Analyse the resume below and return ONLY a valid JSON object.

Resume:
---
${resumeText.slice(0, 6000)}
---

Return exactly:
{
  "score": 75,
  "summary": "2-sentence overall assessment",
  "sections": [
    { "name": "Contact Information", "score": 90, "feedback": "brief feedback" },
    { "name": "Skills", "score": 70, "feedback": "brief feedback" },
    { "name": "Experience / Projects", "score": 65, "feedback": "brief feedback" },
    { "name": "Education", "score": 80, "feedback": "brief feedback" },
    { "name": "Formatting & Length", "score": 75, "feedback": "brief feedback" }
  ],
  "topIssues": ["issue 1", "issue 2", "issue 3"]
}`,
      },
    ],
  });

  const raw =
    response.content[0].type === "text" ? response.content[0].text : "";
  const cleaned = raw.replace(/^```(?:json)?\n?/gm, "").replace(/```$/gm, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Claude did not return valid JSON for ATS score");
  return JSON.parse(match[0]) as ATSResult;
}

// ─── Job Matcher ───────────────────────────────────────────────────────────────

export interface JobMatch {
  jobId: string;
  title: string;
  company: string;
  matchScore: number;
  reason: string;
}

/**
 * Given resume text + array of jobs, returns top 5 job matches with scores.
 * Used on the Resume Analyzer page.
 */
export async function matchJobsToResume(
  resumeText: string,
  jobs: { id: string; title: string; company: string; description: string }[]
): Promise<JobMatch[]> {
  const client = getClient();

  const jobList = jobs
    .map((j) => `ID:${j.id} | ${j.title} at ${j.company}\n${j.description.slice(0, 300)}`)
    .join("\n---\n");

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are a job matching expert. Given the resume and job listings below, return the top 5 best-matching jobs as ONLY a valid JSON array.

Resume (summary):
${resumeText.slice(0, 3000)}

Jobs:
${jobList}

Return exactly (use the exact jobId strings from the input):
[
  {
    "jobId": "exact_id_from_input",
    "title": "job title",
    "company": "company name",
    "matchScore": 85,
    "reason": "1 sentence explaining the match"
  }
]
Return only the top 5, sorted by matchScore descending.`,
      },
    ],
  });

  const raw =
    response.content[0].type === "text" ? response.content[0].text : "";
  const cleaned = raw.replace(/^```(?:json)?\n?/gm, "").replace(/```$/gm, "").trim();
  const match = cleaned.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("Claude did not return valid JSON for job matches");
  return JSON.parse(match[0]) as JobMatch[];
}

// ─── JD Comparator ────────────────────────────────────────────────────────────

export interface JDCompareResult {
  matchScore: number;
  matchingSkills: string[];
  missingSkills: string[];
  suggestions: string[];
}

/**
 * Compares a resume against a pasted Job Description and returns a detailed analysis.
 * Used in the "Compare with JD" tool.
 */
export async function compareResumeWithJD(
  resumeText: string,
  jobDescription: string
): Promise<JDCompareResult> {
  const client = getClient();

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Compare the resume against the job description and return ONLY a valid JSON object.

Resume:
${resumeText.slice(0, 4000)}

Job Description:
${jobDescription.slice(0, 2000)}

Return exactly:
{
  "matchScore": 72,
  "matchingSkills": ["skill1", "skill2"],
  "missingSkills": ["skill1", "skill2"],
  "suggestions": ["specific actionable tip 1", "tip 2", "tip 3"]
}`,
      },
    ],
  });

  const raw =
    response.content[0].type === "text" ? response.content[0].text : "";
  const cleaned = raw.replace(/^```(?:json)?\n?/gm, "").replace(/```$/gm, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Claude did not return valid JSON for JD compare");
  return JSON.parse(match[0]) as JDCompareResult;
}

// ─── Mock Interview ────────────────────────────────────────────────────────────

/**
 * Generates 5 interview questions for a given job role.
 * Used in the Mock Interview module.
 */
export async function generateInterviewQuestions(
  jobRole: string
): Promise<string[]> {
  const client = getClient();

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `Generate exactly 5 interview questions for a "${jobRole}" role. Return ONLY a valid JSON array of 5 strings — no numbering, no explanation.

Example format: ["Question 1?", "Question 2?", "Question 3?", "Question 4?", "Question 5?"]

Mix technical and behavioural questions appropriate for a fresh graduate.`,
      },
    ],
  });

  const raw =
    response.content[0].type === "text" ? response.content[0].text : "";
  const cleaned = raw.replace(/^```(?:json)?\n?/gm, "").replace(/```$/gm, "").trim();
  const match = cleaned.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("Claude did not return valid JSON for questions");
  return JSON.parse(match[0]) as string[];
}

/**
 * Evaluates a single interview answer and returns a score + feedback.
 * Used in the Mock Interview module.
 */
export async function evaluateAnswer(
  question: string,
  answer: string,
  jobRole: string
): Promise<{ score: number; feedback: string }> {
  const client = getClient();

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `You are an interview coach. Evaluate this answer and return ONLY a valid JSON object.

Role: ${jobRole}
Question: ${question}
Answer: ${answer}

Return exactly:
{
  "score": 7,
  "feedback": "2-3 sentence constructive feedback including what was good and what could be improved"
}

Score is out of 10.`,
      },
    ],
  });

  const raw =
    response.content[0].type === "text" ? response.content[0].text : "";
  const cleaned = raw.replace(/^```(?:json)?\n?/gm, "").replace(/```$/gm, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Claude did not return valid JSON for answer eval");
  return JSON.parse(match[0]) as { score: number; feedback: string };
}
