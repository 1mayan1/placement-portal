/**
 * Eligibility checker — pure function, no DB calls.
 *
 * Used both server-side (in API routes) and can be used client-side.
 * A student is eligible for a job if ALL three conditions pass:
 *   1. Their branch is in the job's allowed branches list
 *   2. Their CGPA >= the job's minimum CGPA
 *   3. Their active backlogs <= the job's maximum allowed backlogs
 */

export interface EligibilityResult {
  eligible: boolean;
  reasons: string[]; // human-readable reasons for being NOT eligible (empty if eligible)
}

export function checkEligibility(
  student: { branch: string; cgpa: number; backlogs: number },
  job: { eligibility: { branches: string[]; minCGPA: number; maxBacklogs: number } }
): EligibilityResult {
  const reasons: string[] = [];

  // Branch check — if branches list is empty the job is open to everyone
  if (
    job.eligibility.branches.length > 0 &&
    student.branch &&
    !job.eligibility.branches.includes(student.branch)
  ) {
    reasons.push(
      `Branch not eligible (yours: ${student.branch}, required: ${job.eligibility.branches.join(" / ")})`
    );
  }

  // CGPA check
  if (student.cgpa < job.eligibility.minCGPA) {
    reasons.push(
      `CGPA too low (yours: ${student.cgpa}, required: ≥ ${job.eligibility.minCGPA})`
    );
  }

  // Backlogs check
  if (student.backlogs > job.eligibility.maxBacklogs) {
    reasons.push(
      `Too many backlogs (yours: ${student.backlogs}, allowed: ≤ ${job.eligibility.maxBacklogs})`
    );
  }

  // Profile incomplete — nudge the student to fill in their details
  if (!student.branch && reasons.length === 0) {
    reasons.push("Complete your profile (add your branch) to check eligibility");
  }

  return { eligible: reasons.length === 0, reasons };
}
