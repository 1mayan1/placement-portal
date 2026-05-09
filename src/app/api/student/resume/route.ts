/**
 * POST /api/student/resume
 *
 * Receives a PDF file upload, then:
 * 1. Extracts plain text with pdfjs-dist (Mozilla PDF.js)
 * 2. Sends text to Claude API → returns structured JSON
 * 3. Saves the PDF to MongoDB GridFS
 * 4. Updates the student's resumeFileId in the database
 * 5. Returns the extracted data to the frontend so it can pre-fill the form
 *
 * Why pdfjs-dist instead of pdf-parse?
 * pdf-parse has a bug where it tries to read a test file on every import,
 * which fails in Next.js and causes all uploads to return 422 immediately.
 * pdfjs-dist (Mozilla's own library) has no such issue.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Student from "@/models/Student";
import { uploadResume, deleteResume } from "@/lib/gridfs";
import { extractResumeData } from "@/lib/claude";

/** Extract all text from a PDF buffer using pdfjs-dist. */
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  // Dynamic import keeps pdfjs-dist out of the webpack bundle entirely.
  // Next.js resolves this at runtime through Node.js, not through webpack.
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");

  // pdfjs-dist needs a worker to run PDF decoding in a separate thread.
  // We point it to the actual worker file using a file:// URL so Node.js
  // can locate it in node_modules at runtime.
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    `file://${process.cwd()}/node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs`;

  // Load the PDF — pdfjs-dist expects a Uint8Array, not a Buffer
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
  const pdf = await loadingTask.promise;

  const pageTexts: string[] = [];

  // Loop through every page and collect text
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();

    // Each item is either a TextItem (has .str) or a TextMarkedContent (no .str).
    // We only want TextItem entries.
    const pageText = content.items
      .map((item) => ("str" in item ? (item as { str: string }).str : ""))
      .join(" ");

    pageTexts.push(pageText);
  }

  return pageTexts.join("\n");
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  // Read the multipart form data — Next.js App Router supports this natively
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Could not parse form data" },
      { status: 400 }
    );
  }

  const file = formData.get("resume") as File | null;
  if (!file) {
    return NextResponse.json(
      { error: "No file uploaded. Please attach a PDF." },
      { status: 400 }
    );
  }

  if (file.type !== "application/pdf") {
    return NextResponse.json(
      { error: "Only PDF files are accepted." },
      { status: 400 }
    );
  }

  // Convert the browser File object to a Node.js Buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // ── Step 1: Extract text from PDF ──────────────────────────────────────────
  let resumeText: string;
  try {
    resumeText = await extractTextFromPDF(buffer);

    if (!resumeText || resumeText.trim().length < 50) {
      return NextResponse.json(
        {
          error:
            "Could not extract enough text from this PDF. Please make sure it is a text-based PDF and not a scanned image.",
        },
        { status: 422 }
      );
    }
  } catch (err) {
    console.error("PDF extraction error:", err);
    return NextResponse.json(
      { error: "Failed to read the PDF. Please try a different file." },
      { status: 422 }
    );
  }

  // ── Step 2: Send text to Claude API ────────────────────────────────────────
  let extracted;
  try {
    extracted = await extractResumeData(resumeText);
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI extraction failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  // ── Step 3 & 4: Save PDF to GridFS, update student record ──────────────────
  await connectDB();

  const student = await Student.findOne({ userId: session.user.id });
  if (!student) {
    return NextResponse.json(
      { error: "Student profile not found" },
      { status: 404 }
    );
  }

  // Delete the old resume file if one exists
  if (student.resumeFileId) {
    try {
      await deleteResume(student.resumeFileId.toString());
    } catch {
      // Old file might already be gone — not fatal, continue
    }
  }

  const filename = `resume_${session.user.id}_${Date.now()}.pdf`;
  const fileId = await uploadResume(buffer, filename);

  await Student.findOneAndUpdate(
    { userId: session.user.id },
    { $set: { resumeFileId: fileId, resumeText, atsScore: null } }
  );

  // ── Step 5: Return extracted data to frontend ───────────────────────────────
  return NextResponse.json({
    message: "Resume uploaded and analysed successfully",
    extracted,
  });
}
