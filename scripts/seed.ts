/**
 * SEED SCRIPT — run once to populate the database with test data.
 *
 * What it creates:
 *   • 1 TPO (admin) account   → email: tpo@college.edu  / password: tpo123
 *   • 5 student accounts      → emails below            / password: student123
 *   • 5 sample jobs
 *
 * Run with: npx tsx scripts/seed.ts
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

// Load .env.local from the project root
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  console.error("❌  .env.local not found. Please create it first.");
  process.exit(1);
}

// Import models (we define the schemas inline here to avoid NextJS-specific imports)
import User from "../src/models/User";
import Student from "../src/models/Student";
import Job from "../src/models/Job";

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌  MONGODB_URI is not set in .env.local");
    process.exit(1);
  }

  console.log("🔌  Connecting to MongoDB...");
  await mongoose.connect(uri);
  console.log("✅  Connected!");

  // ── Wipe existing data so we start fresh every time ──────────────────
  await User.deleteMany({});
  await Student.deleteMany({});
  await Job.deleteMany({});
  console.log("🗑️   Cleared old seed data");

  // ── Hash passwords ────────────────────────────────────────────────────
  const tpoHash = await bcrypt.hash("tpo123", 10);
  const studentHash = await bcrypt.hash("student123", 10);

  // ── Create TPO user ───────────────────────────────────────────────────
  const tpoUser = await User.create({
    name: "Dr. Ramesh Gupta",
    email: "tpo@college.edu",
    passwordHash: tpoHash,
    role: "tpo",
  });
  console.log("👔  TPO created:", tpoUser.email);

  // ── Student data ──────────────────────────────────────────────────────
  const studentsData = [
    {
      name: "Priya Sharma",
      email: "priya@student.edu",
      branch: "MCA",
      semester: 6,
      cgpa: 8.7,
      backlogs: 0,
      phone: "9876543210",
      rollNumber: "MCA2021001",
      skills: ["Python", "Django", "SQL", "Machine Learning"],
    },
    {
      name: "Arjun Mehta",
      email: "arjun@student.edu",
      branch: "MCA",
      semester: 6,
      cgpa: 7.2,
      backlogs: 1,
      phone: "9876543211",
      rollNumber: "MCA2021002",
      skills: ["JavaScript", "React", "Node.js", "MongoDB"],
    },
    {
      name: "Sneha Patil",
      email: "sneha@student.edu",
      branch: "BCA",
      semester: 6,
      cgpa: 9.1,
      backlogs: 0,
      phone: "9876543212",
      rollNumber: "BCA2021001",
      skills: ["Java", "Spring Boot", "MySQL", "Docker"],
    },
    {
      name: "Rahul Verma",
      email: "rahul@student.edu",
      branch: "MCA",
      semester: 6,
      cgpa: 6.5,
      backlogs: 3,
      phone: "9876543213",
      rollNumber: "MCA2021003",
      skills: ["C++", "Data Structures", "Linux"],
    },
    {
      name: "Anjali Singh",
      email: "anjali@student.edu",
      branch: "MBA",
      semester: 4,
      cgpa: 8.0,
      backlogs: 0,
      phone: "9876543214",
      rollNumber: "MBA2022001",
      skills: ["Excel", "Power BI", "SQL", "Data Analysis"],
    },
  ];

  for (const s of studentsData) {
    // Create login account
    const userDoc = await User.create({
      name: s.name,
      email: s.email,
      passwordHash: studentHash,
      role: "student",
    });

    // Create profile linked to that account
    await Student.create({
      userId: userDoc._id,
      rollNumber: s.rollNumber,
      branch: s.branch,
      semester: s.semester,
      cgpa: s.cgpa,
      backlogs: s.backlogs,
      phone: s.phone,
      skills: s.skills,
      education: [
        {
          degree: "Bachelor's",
          institution: "Example College",
          year: "2021",
          percentage: "75%",
        },
      ],
      projects: [],
      certifications: [],
    });

    console.log("🎓  Student created:", s.email);
  }

  // ── Create sample jobs ────────────────────────────────────────────────
  const jobsData = [
    {
      title: "Software Engineer Trainee",
      company: "Infosys",
      description:
        "Infosys is looking for MCA/BCA graduates for their Systems Engineer training program. Selected candidates will undergo 3 months of training in Java, Spring, and cloud technologies before being deployed to client projects.\n\nResponsibilities:\n- Develop and maintain enterprise applications\n- Write clean, testable code\n- Collaborate with senior developers\n\nRequired skills: Java, OOP, SQL, Problem Solving",
      package: "3.6 LPA",
      eligibility: {
        branches: ["MCA", "BCA"],
        minCGPA: 6.5,
        maxBacklogs: 2,
      },
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
    {
      title: "Associate Software Developer",
      company: "TCS",
      description:
        "Tata Consultancy Services is hiring fresh graduates for their NextStep program. Candidates with strong fundamentals in programming and databases are preferred.\n\nRoles involve working on digital transformation projects for Fortune 500 clients.\n\nRequired skills: Any programming language, DBMS, Analytical skills",
      package: "3.36 LPA",
      eligibility: {
        branches: ["MCA", "BCA", "MBA"],
        minCGPA: 6.0,
        maxBacklogs: 2,
      },
      deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
    },
    {
      title: "Full Stack Developer",
      company: "Wipro",
      description:
        "Wipro Technologies is seeking talented developers for their digital services division. You will work on React + Node.js based web applications for global clients.\n\nResponsibilities:\n- Build responsive web UIs with React\n- Develop REST APIs with Node.js\n- Database design with MongoDB/PostgreSQL\n\nRequired skills: React, Node.js, MongoDB, JavaScript",
      package: "4.5 LPA",
      eligibility: {
        branches: ["MCA"],
        minCGPA: 7.0,
        maxBacklogs: 1,
      },
      deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    },
    {
      title: "Data Analyst",
      company: "Accenture",
      description:
        "Accenture Analytics is looking for data-savvy graduates who can work with large datasets, build dashboards, and generate business insights.\n\nResponsibilities:\n- Analyse business data using Python/SQL\n- Build Power BI dashboards\n- Present findings to stakeholders\n\nRequired skills: SQL, Python or R, Excel, Data Visualization",
      package: "5.0 LPA",
      eligibility: {
        branches: ["MCA", "MBA"],
        minCGPA: 7.5,
        maxBacklogs: 0,
      },
      deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    },
    {
      title: "Business Analyst Intern",
      company: "Cognizant",
      description:
        "Cognizant is offering a 6-month internship for students with strong analytical and communication skills. The role bridges the gap between business stakeholders and the technical team.\n\nResponsibilities:\n- Gather and document business requirements\n- Create process flow diagrams\n- Perform UAT testing\n\nRequired skills: Communication, Excel, Basic SQL, Logical Thinking",
      package: "2.5 LPA (stipend)",
      eligibility: {
        branches: ["MBA", "MCA", "BCA"],
        minCGPA: 6.0,
        maxBacklogs: 3,
      },
      deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    },
  ];

  for (const j of jobsData) {
    await Job.create({ ...j, postedBy: tpoUser._id });
    console.log("💼  Job created:", j.title, "at", j.company);
  }

  // ── Done ──────────────────────────────────────────────────────────────
  console.log("\n✅  Seed complete! Here are your login credentials:");
  console.log("─".repeat(50));
  console.log("  TPO (admin)");
  console.log("    Email:    tpo@college.edu");
  console.log("    Password: tpo123");
  console.log("\n  Students (all use password: student123)");
  console.log("    priya@student.edu   (MCA, CGPA 8.7, 0 backlogs)");
  console.log("    arjun@student.edu   (MCA, CGPA 7.2, 1 backlog)");
  console.log("    sneha@student.edu   (BCA, CGPA 9.1, 0 backlogs)");
  console.log("    rahul@student.edu   (MCA, CGPA 6.5, 3 backlogs)");
  console.log("    anjali@student.edu  (MBA, CGPA 8.0, 0 backlogs)");
  console.log("─".repeat(50));

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌  Seed failed:", err);
  mongoose.disconnect();
  process.exit(1);
});
