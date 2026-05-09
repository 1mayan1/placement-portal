/**
 * GridFS helpers — stores and retrieves large files (PDFs) in MongoDB.
 *
 * Why GridFS? MongoDB documents have a 16 MB size limit. GridFS works around
 * this by splitting files into 255 KB chunks and storing them across multiple
 * documents in two collections: resumes.files (metadata) and resumes.chunks (data).
 */

import mongoose from "mongoose";
import { GridFSBucket, ObjectId } from "mongodb";
import { connectDB } from "./mongodb";

async function getBucket(): Promise<GridFSBucket> {
  await connectDB();
  // mongoose.connection.db is the raw MongoDB Db instance
  const db = mongoose.connection.db!;
  return new GridFSBucket(db, { bucketName: "resumes" });
}

/** Saves a PDF buffer to GridFS and returns the file's ObjectId as a string. */
export async function uploadResume(
  buffer: Buffer,
  filename: string
): Promise<string> {
  const bucket = await getBucket();

  return new Promise((resolve, reject) => {
    const stream = bucket.openUploadStream(filename, {
      metadata: { contentType: "application/pdf" },
    });

    stream.end(buffer);
    stream.on("finish", () => resolve(stream.id.toString()));
    stream.on("error", reject);
  });
}

/** Fetches a PDF from GridFS and returns it as a Buffer. */
export async function downloadResume(fileId: string): Promise<Buffer> {
  const bucket = await getBucket();
  const chunks: Buffer[] = [];

  return new Promise((resolve, reject) => {
    const stream = bucket.openDownloadStream(new ObjectId(fileId));
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}

/** Deletes a PDF from GridFS (used when the student uploads a new resume). */
export async function deleteResume(fileId: string): Promise<void> {
  const bucket = await getBucket();
  await bucket.delete(new ObjectId(fileId));
}
