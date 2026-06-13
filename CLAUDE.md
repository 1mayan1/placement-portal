# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server at http://localhost:3000
npm run build     # Production build
npm run lint      # ESLint via Next.js
npm run seed      # Seed MongoDB with test data (TPO + 5 students + 5 jobs)
```

There are no unit tests. The seed script uses `tsx` directly and reads `.env.local` from the project root.

**Seed credentials:**
- TPO: `tpo@college.edu` / `tpo123`
- Students: `priya@student.edu`, `arjun@student.edu`, etc. / `student123`

## Environment

Copy `.env.example` to `.env.local` and fill in:
- `MONGODB_URI` — MongoDB Atlas connection string
- `NEXTAUTH_SECRET` — random 32+ char string (`openssl rand -base64 32`)
- `NEXTAUTH_URL` — `http://localhost:3000` for dev
- `ANTHROPIC_API_KEY` — for all AI features
- `RESEND_API_KEY` + `RESEND_FROM_EMAIL` — for email notifications

## Architecture

**Two user roles with separate route trees:**
- `/student/*` — student-facing pages (dashboard, jobs, resume, interview, applications, profile)
- `/tpo/*` — TPO (Training & Placement Officer) pages (dashboard, jobs, students, reports)

`src/middleware.ts` enforces role-based access: unauthenticated → `/login`; wrong role → own dashboard.

**Auth:** NextAuth v4 with a credentials provider (`src/lib/auth.ts`). JWT sessions carry `id` and `role`. The `User` model stores `passwordHash` (bcrypt). Each student has a separate `Student` document linked via `userId`.

**Database:** MongoDB via Mongoose. Connection is cached globally in `src/lib/mongodb.ts` to survive Next.js hot reloads. All Mongoose models guard against re-compilation with `mongoose.models.X || mongoose.model(...)`.

**Resume storage:** PDFs are stored in MongoDB GridFS (`resumes` bucket) via `src/lib/gridfs.ts`. The extracted plain text is cached in `Student.resumeText` so AI routes don't re-parse the PDF on every request.

**AI features** (`src/lib/claude.ts`) — all use `claude-sonnet-4-6` and return structured JSON:
- `extractResumeData` — parses uploaded resume PDF text into structured student profile fields
- `scoreResume` — ATS scoring (0–100) with section-level feedback
- `matchJobsToResume` — returns top 5 job matches with scores
- `compareResumeWithJD` — compares resume against a pasted job description
- `generateInterviewQuestions` / `evaluateAnswer` — mock interview question generation and answer scoring

**Eligibility check** (`src/lib/eligibility.ts`) — pure function (no DB), used both in API routes and client components. A student is eligible if their branch is in `job.eligibility.branches` (empty = open to all), CGPA ≥ `minCGPA`, and backlogs ≤ `maxBacklogs`.

**UI:** shadcn/ui components (`src/components/ui/`) with Tailwind CSS. `src/components/providers.tsx` wraps the app with the NextAuth `SessionProvider`.

**API routes** follow the same `/student` and `/tpo` split under `src/app/api/`. Each route calls `getServerSession(authOptions)` to verify the session and role before touching the DB.
