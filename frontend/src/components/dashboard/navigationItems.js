import {
  LayoutDashboard,
  FileText,
  UploadCloud,
  Sparkles,
  Briefcase,
  History,
  Wand2,
  User,
  Settings
} from "lucide-react";

export const NAVIGATION_ITEMS = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard
  },
  {
    name: "My Resumes",
    path: "/resumes",
    icon: FileText
  },
  {
    name: "Upload Resume",
    path: "/upload",
    icon: UploadCloud
  },
  {
    name: "Resume Analysis",
    path: "/resume-analysis",
    icon: Sparkles
  },
  {
    name: "Job Matching",
    path: "/job-matching",
    icon: Briefcase
  },
  {
    name: "Analysis History",
    path: "/history",
    icon: History
  },
  {
    name: "Resume Builder",
    path: "/builder",
    icon: Wand2
  },
  {
    name: "My Profile",
    path: "/profile",
    icon: User
  },
  {
    name: "Settings",
    path: "/settings",
    icon: Settings
  }
];
