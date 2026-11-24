import { Outlet, Link } from "react-router-dom";

import {
  LayoutDashboard,
  FileText,
  History,
  Settings,
  LogOut,
  BrainCircuit
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

const MainLayout = () => {

  const { logout } = useAuth();

  const menuItems = [
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
      name: "Analysis History",
      path: "/history",
      icon: History
    },
    {
      name: "Settings",
      path: "/settings",
      icon: Settings
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">

      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 p-5 hidden md:flex flex-col">

        <div className="flex items-center gap-2 mb-10">
          <BrainCircuit className="text-blue-600" size={30} />

          <h1 className="text-lg font-bold">
            ResumeAI
          </h1>
        </div>

        <nav className="space-y-2 flex-1">

          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center gap-3 p-3 rounded-lg text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition"
              >
                <Icon size={20} />

                <span>{item.name}</span>
              </Link>
            );
          })}

        </nav>

        <button
          onClick={logout}
          className="flex items-center gap-3 p-3 text-red-500 hover:bg-red-50 rounded-lg"
        >
          <LogOut size={20} />
          Logout
        </button>

      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">

        <header className="bg-white border-b p-5 flex justify-between items-center">
          <h2 className="font-semibold text-lg">
            AI Resume Analyzer
          </h2>

          <div className="text-sm text-slate-500">
            Welcome to ResumeAI
          </div>
        </header>

        <div className="p-6">
          <Outlet />
        </div>

      </main>

    </div>
  );
};

export default MainLayout;