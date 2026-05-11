/**
 * POST /api/auth/register
 * Creates a new student account + blank student profile.
 * TPO accounts cannot be created through this route.
 */

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Student from "@/models/Student";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    // Basic validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if email is already registered
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 } // 409 = Conflict
      );
    }

    // Hash the password — never store plain text passwords
    const passwordHash = await bcrypt.hash(password, 10);

    // Create the User (login credentials)
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: "student",
    });

    // Create the blank Student profile linked to this user
    // The student will fill it in on the Profile page
    await Student.create({
      userId: user._id,
    });

    return NextResponse.json(
      { message: "Account created successfully" },
      { status: 201 }
    );
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json(
      { error: "Server error. Please try again." },
      { status: 500 }
    );
  }
}
