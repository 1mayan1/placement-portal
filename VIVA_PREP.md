# Viva Preparation — AI-Powered College Placement Portal

> 40 likely examiner questions with model answers you can speak naturally.
> Each answer is 3–5 sentences. Read these a few times the night before — don't memorise word-for-word, just internalise the idea so you can say it in your own words.

---

## Category 1: Project Overview (5 questions)

---

**Q1. Give a brief overview of your project.**

I built an AI-powered placement portal specifically for MCA colleges, similar in concept to what LinkedIn or Naukri does but designed for a single college's internal placement workflow. There are two types of users — students and the TPO (Training and Placement Officer). Students can upload their resume, browse jobs, apply, track their status, and use AI features like a resume score and mock interview practice. The TPO can post placement drives, set eligibility criteria, review applicants, and mark students as placed. What makes it different from a basic placement portal is the AI layer — I used Anthropic's Claude to power five distinct features, turning it from a job board into an intelligent preparation platform.

---

**Q2. Who are the users and what does each role do?**

There are two roles. A student can register, upload their PDF resume which Claude automatically reads and fills in their profile, browse open jobs with colour-coded eligibility tags, apply in one click, and track their application moving from Applied to Shortlisted to Selected. They also have three AI tools: an ATS resume scorer, a job matcher that ranks open drives by fit, and a JD gap analyser where they paste any job description and see which skills they have versus which they're missing. There's also a mock interview module where Claude generates 5 role-specific questions and evaluates each answer with a score and feedback. The TPO side is like the admin — they post jobs with eligibility requirements, review all applicants in one place, shortlist or reject them, and record final placement details.

---

**Q3. What problem does this actually solve that existing systems don't?**

Most college placement portals are essentially just a digital notice board — the TPO posts a job, students apply, and someone maintains a spreadsheet. What's completely missing is intelligent support at the preparation stage. My system tells students exactly what's weak about their resume before they even apply, shows them which jobs they're most likely to get based on their actual skills, and lets them practise mock interviews with AI rather than waiting for a scheduled session that may never happen. The eligibility checking is also automated — the server enforces CGPA and branch requirements, so the TPO never has to manually scan through applicants to filter out ineligible ones. The JD gap analysis, where you paste any job description and it shows you a precise list of missing skills, is something I haven't seen in any college-specific placement tool.

---

**Q4. Which part of the project are you most proud of and why?**

The mock interview module, because it's the most interactive and shows the AI working in real time in a way the examiner can clearly see. The student selects a role — either from their applied jobs or by typing a custom one — Claude generates five questions (a mix of technical and behavioural), and as the student submits each answer, Claude evaluates it and returns a score out of ten with specific feedback. The whole session is saved to MongoDB so the student can review past interviews. From a technical problem-solving perspective, I'm also proud of diagnosing and fixing the PDF extraction bug — the standard `pdf-parse` library has a well-known issue where it fails on every upload in Next.js, and I had to investigate why responses were coming back in 11 milliseconds (too fast to have read any file) and then switch to Mozilla's `pdfjs-dist` library.

---

**Q5. How did you structure the development process?**

I broke the project into 10 defined phases, each with a specific deliverable. Phase 1 was database models, Phase 2 was authentication, Phase 3 was the resume upload and AI extraction, Phase 4 was job posting with eligibility, Phase 5 was the application lifecycle, Phases 6 and 7 were the AI features, and Phase 10 was the landing page and documentation. I tested each phase manually before starting the next, so bugs were isolated to the phase where they appeared rather than discovered all at once at the end. This phase-based approach also meant the core workflow was working before the AI features were added, so I could verify the non-AI parts independently.

---

## Category 2: Tech Stack Justification (8 questions)

---

**Q6. Why Next.js instead of a separate React frontend and Express backend?**

Next.js is a full-stack framework — the frontend React components and the backend API routes live in the same project, share the same types, and deploy together as one unit. For a project of this scale with one developer, managing two separate servers, two separate deployments, and CORS configuration between them would add complexity with no real benefit. Next.js also handles routing automatically — there's no need to set up React Router separately. The App Router in Next.js 14 specifically gave me the ability to mix server-rendered pages with client-side interactive components on a per-component basis, which was useful for keeping AI calls strictly on the server.

---

**Q7. Why MongoDB instead of a relational database like MySQL or PostgreSQL?**

My data doesn't fit neatly into fixed columns. A student can have zero projects or ten projects, any number of skills, any number of education entries — this kind of variable-length nested data is natural in MongoDB where each student is one document. In SQL, I'd need separate tables for skills, education, and projects, with foreign keys and joins. The mock interview alone — five questions each with an embedded answer, score, and feedback — would need two tables and multiple joins just to read one session. MongoDB stores it all in one document. There's also a practical consideration: MongoDB Atlas has a free cloud tier that was appropriate for a college-scale project.

---

**Q8. Why Anthropic's Claude instead of OpenAI's ChatGPT?**

Claude claude-sonnet-4-6, which I used, was one of the most capable models available at the time I built this. More specifically, Claude is known for being particularly reliable at following structured output instructions — when I tell it "return only this exact JSON format," it does so consistently. This is critical because if Claude returns anything that's not valid parseable JSON, my application throws an error. I also evaluated it from an academic standpoint — using Anthropic's API demonstrates I evaluated multiple providers rather than defaulting to the most popular option. In practice, any capable LLM could power these features, but prompt compatibility and structured output reliability were the deciding factors.

---

**Q9. Why JWT sessions instead of database sessions?**

JWT stands for JSON Web Token. With JWT sessions, the user's ID and role are encoded and signed into an encrypted token that gets stored in a browser cookie. When the user makes any request, the server decodes the token directly — it doesn't need to query the database to find out who this user is. With database sessions, every single request would require a database lookup to validate the session. JWT is faster because it eliminates that extra query. The tradeoff is that you can't instantly revoke a JWT before it expires — but for a placement portal where sessions expire after 30 days and forced logout isn't a critical requirement, JWTs are the right choice.

---

**Q10. Why pdfjs-dist for PDF parsing instead of pdf-parse?**

`pdf-parse` is the most popular Node.js PDF library but it has a critical bug that nobody warns you about — when the module is imported, it immediately tries to read a test file at the relative path `./test/data/05-versions-space.pdf`. In the Next.js module system, this path doesn't resolve, so the import fails silently and every upload returns an error before even reading the file. I confirmed this was the issue because upload responses were coming back in 11 milliseconds, which is far too fast to have actually parsed any PDF. I switched to `pdfjs-dist`, which is Mozilla's own PDF rendering library used inside Firefox, and it has no such initialization side effects. It requires dynamic import and a few extra configuration steps, but it works reliably.

---

**Q11. Why shadcn/ui instead of a library like Material UI or Bootstrap?**

shadcn/ui is fundamentally different from other component libraries — when you add a component, it copies the actual source code into your project rather than keeping it inside a node_modules package. This means I own and can freely modify every component without fighting against the library's internal styles. Material UI in particular has very opinionated visual defaults that are difficult to override. shadcn/ui uses Tailwind CSS internally, which I was already using for custom styles, so there's zero style conflict. It also produces a modern, clean look without the dated appearance that Bootstrap has in 2025.

---

**Q12. Why TypeScript instead of plain JavaScript?**

TypeScript catches entire categories of bugs before you run the code. For example, if my API route is supposed to return an object with a `score` field but I accidentally return `atsScore`, TypeScript highlights that mismatch immediately. For a project with 20+ API routes and five Mongoose models, those type checks prevented many subtle bugs. It also makes the code self-documenting — when I write `student.cgpa`, I know from the type that it's a number between 0 and 10. I also verify the project is type-correct by running `next build` which performs a full TypeScript check, and the project builds with zero errors.

---

**Q13. Why store PDFs in MongoDB GridFS instead of just saving to the server's filesystem?**

If I saved files to the server's local disk, there are two problems. First, deployment platforms like Vercel don't have persistent storage — every deployment wipes the server's filesystem. Second, if the app runs on multiple servers (for load balancing), they don't share a filesystem, so a file uploaded to server A wouldn't be accessible from server B. GridFS is MongoDB's built-in system for storing binary files — it splits the file into 255 KB chunks and stores each chunk as its own document. Since the files live in the same MongoDB Atlas cluster as all other data, they persist across deployments and are accessible from any server instance.

---

## Category 3: AI Features Deep Dive (10 questions)

---

**Q14. Explain how the resume parser works, end to end.**

When the student drags and drops their PDF, the browser sends it as a multipart form upload to my API route at `/api/student/resume`. The server extracts all text from the PDF using `pdfjs-dist` — it iterates through every page, collects all text items, and joins them into a plain string. That string goes to the Claude API with a prompt that says "extract these exact fields and return them as a JSON object" — fields like name, phone, skills, education history, projects, and certifications. Claude returns structured JSON, the server saves the PDF to GridFS (getting back a file ID), stores the extracted text and file ID in the Student document, and sends the structured data back to the browser so the profile form can auto-fill.

---

**Q15. What prompt did you use for ATS scoring, and how did you design it?**

The prompt tells Claude it's acting as an "ATS expert" and instructs it to return only a specific JSON object — no explanation, no markdown. The JSON has a top-level score from 0 to 100, a two-sentence summary, and an array of five sections: Contact Information, Skills, Experience/Projects, Education, and Formatting — each with their own score and a one-line feedback string. There's also a `topIssues` array with three actionable problems to fix. The key design principle was giving Claude an exact schema to fill. If I just asked "rate my resume," I'd get an essay. By specifying the exact JSON structure with field names, Claude consistently returns parseable data. I also cap the resume text at 6,000 characters to avoid sending unnecessary tokens.

---

**Q16. What is a vector embedding, and does your project use them?**

A vector embedding is a way of converting text into a list of numbers — a point in a high-dimensional space — such that words or sentences with similar meanings end up numerically close together. For example, "software developer" and "programmer" would get similar coordinates. Search systems use embeddings to find semantically similar content even when the exact words don't match. My project does not use embeddings. Instead, I pass the full resume text and full job descriptions directly to Claude and ask it to reason about relevance — this is simpler, requires no separate vector database like Pinecone or Weaviate, and works well at the scale of a college deployment. If I were building this for thousands of companies with millions of job listings, embeddings would make more sense for efficiency.

---

**Q17. What happens if Claude returns invalid or malformed JSON?**

I handle this in layers. The prompt explicitly says "return ONLY valid JSON, no markdown code fences, no explanation." After receiving the response, I run a regex replace to strip out any accidental backtick fences Claude might add anyway. Then I use another regex to extract just the outermost JSON object or array from the string, which handles any stray text before or after the JSON. If `JSON.parse` still fails after all this, the error is caught in a try-catch block and the API route returns an HTTP 500 with a clear message like "AI analysis failed." The user sees an error state in the UI with a retry button. This has never happened during testing because Claude is consistent with structured output instructions.

---

**Q18. How does the mock interview evaluation work technically?**

When the student submits an answer, the frontend sends the question index and their answer text to `/api/student/interview/[sessionId]/answer`. The server fetches the session from MongoDB to get the question text for that index, then sends three things to Claude: the role being practised, the question, and the student's answer. The prompt asks Claude to act as an interview coach and return exactly two fields — a score from 1 to 10, and two to three sentences of feedback covering what was good and what could be improved. The server saves this into the question's slot in the MongoDB document using dot notation (`questions.2.score`, `questions.2.feedback`). After the fifth answer, I average all five scores and multiply by ten to get a 0-to-100 overall score.

---

**Q19. How do you prevent Claude from hallucinating or making up false information?**

The concept of hallucination — an AI confidently stating false information — is a real concern with LLMs. In my project, I've designed every prompt so Claude is working from a source document the user actually provided — their own resume text. It's being asked to extract or evaluate what's already there, not generate information from memory. The ATS scorer reads the resume, the JD comparator reads both the resume and the pasted JD, the mock interview evaluator reads the student's actual answer. The only place Claude generates content freely is the mock interview questions, and there an imperfect question just means a slightly unexpected practice question — it doesn't break anything for the user. I also validate all JSON responses before using them.

---

**Q20. What's the difference between your ATS score and how a real corporate ATS works?**

A real ATS like Workday, Greenhouse, or iCIMS primarily does keyword matching — it scans a resume for specific keywords from the job description and ranks candidates by how many matches it finds. It's quite mechanical and doesn't understand context. My system uses Claude, a large language model, which understands meaning — it can see that "built REST APIs with Express.js" is relevant to a "Node.js backend developer" role even if "Node" isn't mentioned in the resume. So my scoring is arguably more nuanced. However, a real ATS also handles file format parsing for dozens of resume templates, tracks stages across hundreds of simultaneous job postings across companies, and integrates with HR systems — mine is specifically a preparation and teaching tool that helps students understand what to put in a resume and why.

---

**Q21. Why do you store `resumeText` in the Student document rather than extracting it fresh each time?**

PDF text extraction is not instant — it involves downloading the file from GridFS and running it through `pdfjs-dist`'s page-by-page parsing loop. If every AI feature re-did this each time the student clicks a button, there would be noticeable lag from two sequential slow operations (GridFS read + PDF parse) before the Claude call even starts. By extracting the text once during upload and storing it as a plain string field on the Student document, all five AI features can read it with a simple MongoDB `findOne` call that takes milliseconds. It's essentially a pre-computed cache of the extracted text, and it's invalidated automatically whenever the student uploads a new resume.

---

**Q22. How does the JD gap analysis work?**

The student pastes a job description into a text area and clicks "Compare." The frontend sends this to `/api/student/resume/compare`. The backend fetches the student's `resumeText` from MongoDB — not from GridFS, from the cached field — and sends both the resume and the pasted JD to Claude with a prompt asking for four specific fields: a match percentage, an array of skills from the JD that the student already has, an array of skills from the JD that the student is missing, and three specific actionable suggestions for closing the gap. The frontend then renders matching skills as green badges, missing skills as red badges, the match score as a percentage with a colour-coded bar, and the suggestions as a numbered list.

---

**Q23. How does the AI job matching rank jobs?**

When the student clicks "Find Matching Jobs," the backend fetches all open jobs from MongoDB, then sends the student's resume text plus every open job's title, company, and description to Claude in one prompt. The prompt asks Claude to return a JSON array of the top five best-matching jobs sorted by match score, with a score out of 100 and a one-sentence explanation for each. Claude makes the judgment based on skill overlap, experience alignment, and role requirements. I then enrich each result with the package information from the database (since Claude only knows what I gave it) and send the enriched list to the frontend. The key constraint is that I cap the job description at 300 characters per job in the prompt to avoid hitting token limits when there are many open jobs.

---

## Category 4: Database Design (5 questions)

---

**Q24. Why are User and Student separate collections instead of one?**

They represent different concerns. A User is an authentication entity — it stores login credentials and the role (student or tpo). A Student is a domain entity — it stores academic data, resume, skills, placement info. The TPO is also a User but has no Student document. Keeping them separate means I can change authentication logic (like adding OAuth login) without touching the student schema, and I can add placement-specific fields without polluting the auth layer. The two are linked by a `userId` field on the Student document — this is equivalent to a foreign key in SQL. Every student API route does `Student.findOne({ userId: session.user.id })` to get from the logged-in user to their profile.

---

**Q25. How does the Application model link Students and Jobs?**

Application is a separate collection — one document per student-job pair. Each document has the student's ID, the job's ID, a status field (applied, shortlisted, selected, rejected), and a timestamp of when they applied. This is the MongoDB equivalent of a SQL junction table for a many-to-many relationship. When a student clicks Apply, a new Application document is created. When the TPO changes the status, that same document gets updated. Before creating a new application, my API checks whether one already exists for that student-job pair, which prevents duplicate applications. In production, I'd enforce this uniqueness at the database level with a compound index on `{ jobId, studentId }`.

---

**Q26. What is GridFS and why use it for PDF storage?**

MongoDB documents have a hard 16 MB size limit. A resume PDF is usually well under that, but storing binary files inside documents makes every query on the Student collection heavier because MongoDB has to load more data. GridFS is MongoDB's built-in file storage system — it splits any file into 255 KB chunks and stores each chunk as its own document in a `fs.chunks` collection, with a metadata entry in `fs.files`. When a file is uploaded, GridFS gives back a unique file ID, which I store in the Student document as `resumeFileId`. If the student ever needs to download their resume, I use that ID to stream the chunks back and reassemble the file. The big advantage is that PDFs live in the same MongoDB cluster as everything else, so backup and persistence are handled together.

---

**Q27. How does the MockInterview schema store 5 questions and answers?**

The MockInterview document has a `questions` array with up to 5 elements, each being an embedded sub-document with four fields: `q` (the question text), `answer` (what the student typed), `score` (1–10 from Claude), and `feedback`. When the interview session is created, all 5 question texts are filled in immediately but answer, score, and feedback are empty strings and zero. As the student answers each question, I use MongoDB's positional dot notation — for example, `$set: { "questions.2.answer": "my answer" }` — to update just that one slot without rewriting the whole array. This is efficient and atomic. When all 5 answers are filled, the `isCompleted` flag is set to true and `overallScore` is computed and stored.

---

**Q28. What indexes would you add in a production version?**

By default MongoDB only indexes the `_id` field. For production I'd add: an index on `User.email` since every login does a lookup by email; an index on `Student.userId` since every student-facing API route starts by finding the student by their user ID; a compound index on `Application` for `{ jobId, studentId }` both for the duplicate-check query and to enforce uniqueness; and an index on `MockInterview.studentId` since the history page fetches all sessions for one student. Without these, every query does a full collection scan, which is fine for a hundred students but would slow down significantly with thousands.

---

## Category 5: Security (4 questions)

---

**Q29. How are passwords stored? Are they secure?**

Passwords are never stored in plain text. When a user registers, their password goes through `bcrypt`, which is a hashing algorithm specifically designed for passwords — unlike MD5 or SHA-256 which are fast, bcrypt is intentionally slow, taking a few hundred milliseconds per hash. This makes brute-force attacks computationally impractical even if someone stole the database. bcrypt also generates a random "salt" for each password before hashing, so two users with the same password have completely different hashes in the database — this defeats rainbow table attacks. At login, `bcrypt.compare()` checks the submitted password against the stored hash without ever decrypting it.

---

**Q30. How do you prevent a student from accessing TPO routes?**

There are two independent layers. First, the Next.js middleware intercepts every request to `/tpo/*` before the page or API route loads — it checks the user's role from the JWT token and if it's not "tpo," it redirects immediately to the student dashboard. Second, every single TPO API route calls `getServerSession()` and explicitly checks `session.user.role !== "tpo"` before doing anything, returning a 401 if the check fails. This means even if someone somehow bypassed the middleware — which isn't possible, but in theory — the API itself would still reject the request. Having both layers is the "defence in depth" principle.

---

**Q31. What if a student bypasses the UI and sends a direct API request to apply to a job they're ineligible for?**

The frontend shows a disabled button, but I never rely on the frontend for security — a user can send any HTTP request using tools like Postman or curl, bypassing the UI entirely. The `/api/student/jobs/[id]/apply` route re-runs the eligibility check independently using the student's actual data fetched fresh from the database, not anything from the request body. If an ineligible student sends a POST request directly, the server fetches their real CGPA and branch from MongoDB, runs the same `checkEligibility()` function, and returns a 403 Forbidden if they don't qualify. The client-side check is just UX — the server-side check is the real gate.

---

**Q32. Is the Claude API key ever exposed to the browser?**

No, never. The API key is in `.env.local` which Next.js never sends to the browser — environment variables without the `NEXT_PUBLIC_` prefix are server-only. All five AI features are implemented as Next.js API route handlers, which run only on the server. The browser sends a request to my own API (like `/api/student/resume/analyze`), my server makes the call to Anthropic's API using the key, and then only the processed result is sent back to the browser. The Claude API key is never in the JavaScript bundle, never in network traffic from server to client, and the `.env.local` file is in `.gitignore` so it's never committed to the repository either.

---

## Category 6: Architectural Decisions (5 questions)

---

**Q33. Why monolithic architecture instead of microservices?**

Microservices means running the AI features as one server, authentication as another, job management as another — each deployed separately and communicating over HTTP. For a team of one building a college project, that's enormous overhead: separate deployment pipelines, inter-service networking, distributed debugging when something fails across services. A monolith — everything inside one Next.js application — is simpler to build, simpler to reason about, and deployable to Vercel with one command. Microservices are justified when different parts of a system need to scale independently or when different teams own different services. Neither applies here. I'd revisit this if the system needed to serve hundreds of colleges simultaneously.

---

**Q34. Why are all Claude API calls in server-side API routes and not in client components?**

The most important reason is security — the Claude API key must never reach the browser. If I called the Anthropic API from a React component in the browser, the API key would be visible in the network tab of anyone's browser developer tools. Beyond security, server-side calls also let me do pre-processing (like fetching the student's data from MongoDB) and post-processing (like saving the ATS score back to the database) as part of the same transaction before sending anything to the client. Every AI feature is designed as: client requests → server fetches context from DB → server calls Claude → server saves result to DB → server returns processed result to client.

---

**Q35. What is Next.js middleware and how do you use it?**

Middleware is code that runs before any page or API route is served — it intercepts every request and can redirect, rewrite, or modify it. I use it for two purposes: protecting private routes (if you're not logged in and try to access `/student/dashboard`, you get redirected to `/login` before the page even starts rendering) and enforcing role separation (a student trying to access `/tpo/` gets redirected to their own dashboard). I configure it to only run on specific paths using a `matcher` pattern, so it doesn't add any overhead to public routes like the landing page or API auth routes. The middleware uses `withAuth` from NextAuth, which automatically handles decoding the JWT token so I can read the role from it.

---

**Q36. What happens when a user's JWT session expires?**

JWT tokens have an expiry time — in my project it's 30 days after login. When the token expires, the browser's cookie still contains the token but the server will reject it as expired. On the next request to any protected route, the middleware's `authorized` callback returns false, which triggers a redirect to the login page. The user logs in again and gets a fresh token. There's no explicit "your session has expired" message — the user just finds themselves on the login page, which is standard behaviour on virtually every website. This works fine for a placement portal where extended inactivity for 30 days is unlikely during placement season.

---

**Q37. Why is `authOptions` in `src/lib/auth.ts` and not inside the NextAuth route handler?**

This is a Next.js-specific rule. Route handler files — the files that define `GET`, `POST` etc. — are expected by the framework to only export HTTP method handlers. If you export any other named constant from a route file, the TypeScript build fails with a type error about invalid exports. But `authOptions` needs to be used in multiple places: the NextAuth route handler, any server component that calls `getServerSession()`, and any API route that checks who's logged in. The solution is to put `authOptions` in a plain utility file in `src/lib/` and import it wherever needed. The route handler then just does `const handler = NextAuth(authOptions); export { handler as GET, handler as POST }`.

---

## Category 7: Gotcha Questions (3 questions)

---

**Q38. If two students click Apply at the exact same millisecond, could there be a race condition?**

For my specific use case, this is largely a theoretical concern rather than a practical problem. I don't have a "first N students only" cap — all eligible students can apply to a job simultaneously. The only constraint is that one student can't apply to the same job twice. My current check is: "find an existing Application document with this studentId + jobId — if one exists, reject; if not, create one." Two simultaneous requests from the same student could in theory both pass this check before either has created the document. In production I'd fix this with a unique compound index on `{ jobId, studentId }` in MongoDB — then the second insert would get a duplicate key error, which I'd catch and return a "you've already applied" message. This makes the constraint atomic at the database level.

---

**Q39. Your entire AI layer depends on the Claude API being available. What happens if Anthropic's servers go down?**

That's a valid architectural concern and a genuine trade-off I made. The non-AI parts of the system — login, profile editing, job browsing, applying, TPO management, placement marking — continue working completely if Claude is unreachable, because none of those touch the Claude API. Only the five AI features would fail. Each of those routes has a try-catch block that returns a clear HTTP 500 error with a message, rather than crashing. The frontend displays a user-friendly error with a retry button. For a production system, I'd add retry logic with exponential backoff and possibly a cached fallback for the ATS score (show the last computed score instead of failing). For a college portal that's used intermittently rather than continuously, brief API outages are an acceptable risk.

---

**Q40. Is your application vulnerable to injection attacks — SQL injection, or anything similar?**

SQL injection doesn't apply since I'm not using SQL at all. MongoDB has its own injection risk — NoSQL injection — where an attacker sends a query operator object (like `{ "$gt": "" }`) instead of a string value in a field like the login email, potentially bypassing authentication. My application is protected against this because I use Mongoose with defined schemas. Mongoose coerces and validates input against the schema type — if the `email` field is defined as `String`, Mongoose will either coerce the input to a string or reject it, so `{ "$gt": "" }` gets treated as the string "[object Object]" which won't match any email. I also don't use any raw MongoDB query operators where user input could be interpreted as a query clause — all queries go through Mongoose's sanitised methods like `findOne({ email: userInput })`.

---

## Quick Reference — Key Numbers to Remember

| Fact | Value |
|------|-------|
| Claude model used | claude-sonnet-4-6 |
| AI features count | 5 (resume extraction, ATS scoring, job matching, JD comparison, mock interview Q+A) |
| Number of API routes | 17 (approx.) |
| MongoDB collections | 5 (users, students, jobs, applications, mockinterviews) |
| GridFS usage | Storing resume PDFs |
| JWT session duration | 30 days |
| bcrypt rounds | 12 |
| Mock interview questions | 5 per session |
| Question score range | 1–10 (Claude), converted to 0–100 overall |
| PDF text cap for AI calls | 6,000–8,000 characters (sliced before sending) |
| Development phases | 10 |
| Build output | 0 TypeScript errors |

---

## If the Examiner Asks You to Show Something Live

**Suggested demo order (most impressive first):**

1. **Landing page** — Open `/` in a fresh browser. Show the hero, features, two-role section.
2. **Student login** — Log in as `priya@student.com / password123`
3. **Resume upload** — Upload a real PDF, show the form auto-filling from Claude
4. **Mock Interview** — Start an interview for "Full Stack Developer", answer 2 questions live, show the score and feedback appearing in real time
5. **ATS Score** — Click Analyse, show the ring and section bars
6. **JD Compare** — Paste a real job description, show matching/missing skills
7. **TPO view** — Log out, log in as `tpo@college.com / admin123`, show the applications page with Shortlist/Select buttons

---

*Good luck in your viva. You built this — you know it better than any examiner does.*
