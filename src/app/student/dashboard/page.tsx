"use client";

/**
 * Student dashboard — the first page a student sees after login.
 * Shows summary stats and quick links. Will be enriched in later phases.
 */

import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Briefcase, ClipboardList, FileText, MessageSquare, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function StudentDashboard() {
  const { data: session } = useSession();

  // Quick-action cards shown on the dashboard
  const quickLinks = [
    {
      title: "Browse Jobs",
      description: "View all open placement drives and check your eligibility",
      href: "/student/jobs",
      icon: Briefcase,
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "My Applications",
      description: "Track the status of jobs you have applied to",
      href: "/student/applications",
      icon: ClipboardList,
      color: "bg-green-50 text-green-600",
    },
    {
      title: "Resume Analyzer",
      description: "Get your ATS score and AI-powered improvement tips",
      href: "/student/resume",
      icon: FileText,
      color: "bg-purple-50 text-purple-600",
    },
    {
      title: "Mock Interview",
      description: "Practice with AI-generated role-specific questions",
      href: "/student/interview",
      icon: MessageSquare,
      color: "bg-orange-50 text-orange-600",
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {session?.user?.name?.split(" ")[0] ?? "Student"} 👋
        </h1>
        <p className="text-gray-500 mt-1">
          Here&apos;s what&apos;s happening with your placement journey.
        </p>
      </div>

      {/* Profile completion banner — shown until profile is filled */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8 flex items-center justify-between">
        <div>
          <p className="font-medium text-blue-900">Complete your profile</p>
          <p className="text-sm text-blue-600 mt-0.5">
            Upload your resume to auto-fill your profile and unlock AI features
          </p>
        </div>
        <Link
          href="/student/profile"
          className="flex items-center gap-1 text-sm font-medium text-blue-700 hover:text-blue-900"
        >
          Go to Profile <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Quick action cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {quickLinks.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader className="pb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${item.color}`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <CardTitle className="text-base">{item.title}</CardTitle>
                <CardDescription className="text-sm">{item.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      {/* Placeholder stats — these will use real data from Phase 4 onwards */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        {[
          { label: "Jobs Available", value: "—", note: "Come back after Phase 4" },
          { label: "Applications", value: "—", note: "Come back after Phase 5" },
          { label: "ATS Score", value: "—", note: "Upload resume in Phase 3" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm font-medium text-gray-600 mt-1">{stat.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{stat.note}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
