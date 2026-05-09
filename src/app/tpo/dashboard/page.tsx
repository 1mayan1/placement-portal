"use client";

/**
 * TPO dashboard — live stats + quick-action cards.
 */

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PlusCircle,
  Briefcase,
  Users,
  BarChart2,
  GraduationCap,
  ClipboardList,
} from "lucide-react";

interface Stats {
  totalStudents: number;
  openJobs: number;
  totalApplications: number;
  studentsPlaced: number;
}

export default function TpoDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/tpo/stats")
      .then((r) => r.json())
      .then((data) => setStats(data));
  }, []);

  const quickLinks = [
    {
      title: "Post a New Job",
      description: "Add a new placement drive for visiting companies",
      href: "/tpo/jobs/new",
      icon: PlusCircle,
      color: "bg-indigo-50 text-indigo-600",
    },
    {
      title: "Manage Jobs",
      description: "View all posted jobs, review applicants, close drives",
      href: "/tpo/jobs",
      icon: Briefcase,
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "All Students",
      description: "Browse student profiles, filter by branch and CGPA",
      href: "/tpo/students",
      icon: Users,
      color: "bg-green-50 text-green-600",
    },
    {
      title: "Reports",
      description: "Placement stats, charts, and export options",
      href: "/tpo/reports",
      icon: BarChart2,
      color: "bg-orange-50 text-orange-600",
    },
  ];

  const statCards = [
    {
      label: "Total Students",
      value: stats?.totalStudents ?? "—",
      icon: GraduationCap,
      color: "text-blue-500",
    },
    {
      label: "Open Jobs",
      value: stats?.openJobs ?? "—",
      icon: Briefcase,
      color: "text-green-500",
    },
    {
      label: "Total Applications",
      value: stats?.totalApplications ?? "—",
      icon: ClipboardList,
      color: "text-indigo-500",
    },
    {
      label: "Students Placed",
      value: stats?.studentsPlaced ?? "—",
      icon: Users,
      color: "text-purple-500",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {session?.user?.name ?? "TPO"} 👋
        </h1>
        <p className="text-gray-500 mt-1">Placement Portal — Admin Dashboard</p>
      </div>

      {/* Live stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
                </div>
                <stat.icon className={`w-5 h-5 mt-1 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {quickLinks.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader className="pb-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${item.color}`}
                >
                  <item.icon className="w-5 h-5" />
                </div>
                <CardTitle className="text-base">{item.title}</CardTitle>
                <CardDescription className="text-sm">
                  {item.description}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
