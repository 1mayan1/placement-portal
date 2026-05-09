# AI-Powered College Placement Portal

A full-stack web application that brings AI assistance to every stage of the college placement lifecycle — from resume screening to mock interview practice.

Built as an MCA Final Year Major Project using Next.js 14, MongoDB, and Anthropic's Claude API.

---

## What it does

**For Students:**
- Upload a PDF resume → Claude AI automatically extracts and fills your profile
- Browse open placement drives with real-time eligibility indicators (branch, CGPA, backlogs)
- Apply in one click; track status from Applied → Shortlisted → Selected → Placed
- Get an ATS compatibility score with section-by-section feedback
- Find your best-fit jobs — Claude ranks all open drives by resume match percentage
- Compare your resume against any job description — see exactly which skills you have and which you're missing
- Practise mock interviews: Claude generates 5 role-specific questions, evaluates each answer with a score (1–10) and constructive feedback, and shows an overall score at the end

**For TPOs (Training & Placement Officers):**
- Post placement drives with eligibility criteria (branch, minimum CGPA, maximum backlogs)
- Review all applicants in one place with full student profiles
- Shortlist, select, or reject applicants
- Mark selected students as placed with company and package details
- Live dashboard: total students, open jobs, total applications, students placed

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | MongoDB Atlas + Mongoose |
| Authentication | NextAuth.js v4 (JWT sessions) |
| AI | Anthropic Claude API (`claude-sonnet-4-6`) |
| PDF extraction | pdfjs-dist (Mozilla PDF.js) |
| File storage | MongoDB GridFS (PDF resumes) |
| Password hashing | bcryptjs |

---

## Prerequisites

- **Node.js** 18.x or 20.x LTS
- **npm** 9+
- A **MongoDB Atlas** account (free M0 cluster is sufficient)
- An **Anthropic API key** (get one at [console.anthropic.com](https://console.anthropic.com))

---

## Setup

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd mca-placement
```

### 2. Install dependencies

```bash
npm install
```

> **Note:** If you see broken symlinks in `node_modules/.bin/` after cloning (e.g., `next` or `tsc` not found), fix them with:
> ```bash
> rm node_modules/.bin/next && ln -s ../next/dist/bin/next node_modules/.bin/next
> rm node_modules/.bin/tsc  && ln -s ../typescript/bin/tsc  node_modules/.bin/tsc
> ```

### 3. Configure environment variables

Create a `.env.local` file in the project root:

```env
# MongoDB Atlas connection string
# Get this from: Atlas Dashboard → Your Cluster → Connect → Drivers
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/placement?retryWrites=true&w=majority

# NextAuth — must match the URL you run the app on
NEXTAUTH_URL=http://localhost:3000

# NextAuth secret — any random string, minimum 32 characters
# Generate one: openssl rand -base64 32
NEXTAUTH_SECRET=your-random-secret-here

# Anthropic Claude API key
# Get this from: console.anthropic.com → API Keys
ANTHROPIC_API_KEY=sk-ant-api03-...
```

> `.env.local` is in `.gitignore` — never commit this file.

### 4. Seed the database

This creates test accounts (8 students, 1 TPO, 3 jobs) so you can start testing immediately.

```bash
npx ts-node --project tsconfig.json src/scripts/seed.ts
```

Expected output:
```
Connected to MongoDB
Seeded 11 documents (8 students + 1 TPO + 3 jobs)
Done.
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you should see the landing page.

---

## Default Test Accounts

> All passwords use the values set in `src/scripts/seed.ts`.

| Role | Email | Password | Notes |
|------|-------|----------|-------|
| Student | `priya@student.com` | `password123` | MCA, CGPA 8.9, 0 backlogs — eligible for most jobs |
| Student | `rahul@student.com` | `password123` | MCA, CGPA 6.1 — ineligible for high-CGPA jobs |
| Student | `anjali@student.com` | `password123` | BCA branch |
| TPO | `tpo@college.com` | `admin123` | Full TPO access |

> Upload a real PDF resume to test the AI extraction — the seeded students have profile data but no resume file.

---

## Available Scripts

```bash
npm run dev      # Start development server on http://localhost:3000
npm run build    # Production build (also runs TypeScript type-check)
npm start        # Start production server (after build)
npm run lint     # Run ESLint
```

---

## Project Structure

```
mca-placement/
├── src/
│   ├── app/
│   │   ├── page.tsx                          # Public landing page (/)
│   │   ├── login/page.tsx                    # Login form
│   │   ├── signup/page.tsx                   # Student registration
│   │   │
│   │   ├── student/                          # Student-only pages
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── profile/page.tsx              # Resume upload + profile editor
│   │   │   ├── jobs/
│   │   │   │   ├── page.tsx                  # Browse jobs with eligibility
│   │   │   │   └── [id]/page.tsx             # Job detail + apply
│   │   │   ├── applications/page.tsx         # Track my applications
│   │   │   ├── resume/page.tsx               # AI Resume Analyzer (3 tabs)
│   │   │   └── interview/page.tsx            # Mock Interview module
│   │   │
│   │   ├── tpo/                              # TPO-only pages
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── jobs/
│   │   │   │   ├── page.tsx                  # Manage all jobs
│   │   │   │   ├── new/page.tsx              # Post a new job
│   │   │   │   ├── [id]/page.tsx             # Edit a job
│   │   │   │   └── [id]/applications/page.tsx # Review applicants
│   │   │   └── students/page.tsx             # All student profiles
│   │   │
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts   # NextAuth handler
│   │       ├── student/
│   │       │   ├── profile/route.ts          # GET/PUT student profile
│   │       │   ├── applications/route.ts     # GET my applications
│   │       │   ├── jobs/
│   │       │   │   ├── route.ts              # GET open jobs with eligibility
│   │       │   │   └── [id]/apply/route.ts   # POST apply to job
│   │       │   ├── resume/
│   │       │   │   ├── route.ts              # POST upload PDF
│   │       │   │   ├── analyze/route.ts      # POST ATS score
│   │       │   │   ├── match/route.ts        # POST job matches
│   │       │   │   └── compare/route.ts      # POST JD comparison
│   │       │   └── interview/
│   │       │       ├── start/route.ts        # POST create session
│   │       │       ├── sessions/route.ts     # GET past sessions
│   │       │       └── [sessionId]/answer/route.ts  # POST evaluate answer
│   │       └── tpo/
│   │           ├── stats/route.ts            # GET dashboard counts
│   │           ├── jobs/
│   │           │   ├── route.ts              # GET all jobs / POST new job
│   │           │   └── [id]/
│   │           │       ├── route.ts          # GET/PUT/DELETE a job
│   │           │       └── applications/route.ts  # GET job applicants
│   │           ├── applications/[id]/route.ts # PUT update status
│   │           └── students/[id]/place/route.ts   # PUT mark as placed
│   │
│   ├── lib/
│   │   ├── auth.ts           # NextAuth authOptions (shared across the app)
│   │   ├── claude.ts         # All Claude API functions
│   │   ├── eligibility.ts    # Pure function: checkEligibility(student, job)
│   │   ├── gridfs.ts         # GridFS helpers: upload/download/delete resume
│   │   └── mongodb.ts        # Cached Mongoose connection
│   │
│   ├── models/
│   │   ├── User.ts
│   │   ├── Student.ts
│   │   ├── Job.ts
│   │   ├── Application.ts
│   │   └── MockInterview.ts
│   │
│   ├── components/
│   │   ├── providers.tsx     # SessionProvider wrapper
│   │   ├── layouts/          # Student and TPO sidebar layouts
│   │   └── ui/               # shadcn/ui components
│   │
│   ├── middleware.ts          # Route protection (auth + role enforcement)
│   └── scripts/
│       └── seed.ts           # Database seeder
│
├── next.config.mjs            # pdfjs-dist in serverComponentsExternalPackages
├── tailwind.config.ts
├── tsconfig.json
├── .env.local                 # ← you create this (not in git)
├── PROJECT_REPORT.md          # Full college-format project report
└── VIVA_PREP.md               # 40 viva questions with model answers
```

---

## AI Features — How They Work

All AI calls go through `src/lib/claude.ts` and are invoked from server-side API routes only. The Claude API key is never sent to the browser.

### 1. Resume Extraction
`POST /api/student/resume`

Extracts text from the uploaded PDF using `pdfjs-dist`, sends it to Claude with a prompt that specifies an exact JSON schema to fill, and returns structured profile data (name, skills, education, projects, certifications) to auto-populate the form.

### 2. ATS Score
`POST /api/student/resume/analyze`

Sends the stored `resumeText` to Claude asking for a JSON response with: overall score (0–100), five section scores (Contact, Skills, Projects, Education, Formatting) with feedback, and top issues to fix. Score is saved to the database.

### 3. Job Matching
`POST /api/student/resume/match`

Sends the student's resume text plus all open job titles and descriptions to Claude, which returns the top 5 best-fit jobs ranked by match percentage with a one-line reason for each.

### 4. JD Comparison
`POST /api/student/resume/compare`

Student pastes any job description. Claude compares it against their resume and returns: match score (%), matching skills (array), missing skills (array), and 3 improvement suggestions.

### 5. Mock Interview
`POST /api/student/interview/start` → `POST /api/student/interview/[sessionId]/answer`

Claude generates 5 role-specific questions (mix of technical + behavioural). After each answer, Claude evaluates it with a score out of 10 and feedback. The session is stored in MongoDB. Overall score = `average(5 scores) × 10`.

---

## Key Design Decisions

**Why pdfjs-dist instead of pdf-parse?**
`pdf-parse` has a known bug where it reads a test file during module initialization, which fails in the Next.js module system and causes every upload to return an error immediately. `pdfjs-dist` (Mozilla's PDF.js) has no such issue and is more actively maintained.

**Why is `resumeText` stored in the database?**
PDF text extraction is slow (requires reading from GridFS + parsing). By storing the plain text on upload, all five AI features can access it with a single fast MongoDB query instead of re-parsing the PDF each time.

**Why `authOptions` in `src/lib/auth.ts` and not in the route handler?**
Next.js's TypeScript types reject non-HTTP exports from route handler files. Since `authOptions` is needed in multiple places (the handler, server components, API routes), it lives in a shared library file.

**Why server-side AI calls?**
The Claude API key must never reach the browser. All AI requests go through Next.js API routes on the server, which call Anthropic's API and return only the processed result to the client.

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | Full MongoDB connection string including database name |
| `NEXTAUTH_URL` | Yes | Full URL of your app (`http://localhost:3000` for dev) |
| `NEXTAUTH_SECRET` | Yes | Random secret for signing JWT tokens (min 32 chars) |
| `ANTHROPIC_API_KEY` | Yes | Your Claude API key from console.anthropic.com |

---

## Deployment

### Vercel (recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables via Vercel dashboard or CLI:
vercel env add MONGODB_URI
vercel env add NEXTAUTH_URL        # set to your production URL
vercel env add NEXTAUTH_SECRET
vercel env add ANTHROPIC_API_KEY
```

### Self-hosted

```bash
npm run build
npm start
# Runs on port 3000 by default; use a reverse proxy (nginx/caddy) for production
```

---

## Common Issues

**`Cannot find module '../lib/tsc.js'` or similar**
Node.js sometimes copies rather than symlinks binaries. Fix:
```bash
rm node_modules/.bin/tsc && ln -s ../typescript/bin/tsc node_modules/.bin/tsc
rm node_modules/.bin/next && ln -s ../next/dist/bin/next node_modules/.bin/next
```

**PDF upload returns 422 with "Failed to read the PDF"**
Make sure you're uploading a text-based PDF, not a scanned image. Scanned PDFs have no embedded text layer and cannot be parsed without OCR.

**Claude returns 401**
Your `ANTHROPIC_API_KEY` in `.env.local` is incorrect or missing. Verify it at [console.anthropic.com](https://console.anthropic.com).

**MongoDB connection fails**
Check that your IP address is whitelisted in MongoDB Atlas (Network Access → Add IP Address → Allow from Anywhere for development).

**`Session not found` in mock interview**
This happens if you navigate away mid-interview and the session ID is lost from React state. The in-progress session remains in MongoDB with `isCompleted: false` but cannot be resumed — start a new interview.

---

## Academic Context

This project was built as a major project for the Master of Computer Applications (MCA) programme at **[COLLEGE NAME]**, affiliated to **[UNIVERSITY NAME]**.

- **Student:** [STUDENT NAME] (Roll No. [ROLL NUMBER])
- **Guide:** [GUIDE NAME], [GUIDE DESIGNATION]
- **Academic Year:** 2025–26

See [`PROJECT_REPORT.md`](./PROJECT_REPORT.md) for the full college-format project report.
See [`VIVA_PREP.md`](./VIVA_PREP.md) for 40 viva questions with model answers.

---

## License

This project is submitted as an academic major project. All rights reserved by the author. The codebase may be used for educational reference with appropriate attribution.
