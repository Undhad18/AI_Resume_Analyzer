import { useState, useRef, useEffect } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import {
  Menu,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Sparkles,
  ShieldCheck
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const ROUTE_TITLES = {
  "/dashboard": "Dashboard Overview",
  "/resumes": "My Resumes",
  "/upload": "Upload Resume",
  "/resume-analysis": "AI Resume Analysis",
  "/job-matching": "Job Description Matching",
  "/history": "Analysis History",
  "/analysis-history": "Analysis History",
  "/builder": "AI Resume Builder",
  "/profile": "My Profile",
  "/settings": "Account Settings"
};

const TopNavbar = ({ onOpenMobileMenu }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentTitle = ROUTE_TITLES[location.pathname] || "Dashboard";

  // Generate user avatar initials
  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : "AI";

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleLogout = async () => {
    try {
      setDropdownOpen(false);
      await logout();
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-20 h-16 px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile hamburger & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          type="button"
          aria-label="Open sidebar menu"
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
        >
          <Menu size={22} />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
            {currentTitle}
          </h1>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            AI-assisted resume analysis & job application optimization
          </p>
        </div>
      </div>

      {/* Right: User Profile Dropdown & Badge */}
      <div className="flex items-center gap-3">
        {/* Pro / Active Status Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
          <Sparkles size={13} className="text-blue-600" />
          <span>AI Engine Ready</span>
        </div>

        {/* User Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
            type="button"
            className="flex items-center gap-2.5 p-1 sm:p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
          >
            <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {initials}
            </div>

            <div className="hidden md:block text-left">
              <span className="block text-xs font-semibold text-slate-800 leading-tight">
                {user?.fullName || "User"}
              </span>
              <span className="block text-[11px] text-slate-400">
                {user?.email || "Account"}
              </span>
            </div>

            <ChevronDown
              size={14}
              className={`text-slate-400 transition-transform ${
                dropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div
              role="menu"
              aria-orientation="vertical"
              className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-lg p-2 z-30 animate-in fade-in-50 zoom-in-95 duration-100"
            >
              {/* Profile Card in dropdown */}
              <div className="p-3 border-b border-slate-100 mb-1">
                <p className="text-xs font-semibold text-slate-900">
                  {user?.fullName || "Authenticated User"}
                </p>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                  {user?.email}
                </p>
                <div className="mt-2 flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                  <ShieldCheck size={13} />
                  <span>Active Session</span>
                </div>
              </div>

              {/* Links */}
              <div className="py-1 space-y-0.5">
                <Link
                  to="/profile"
                  onClick={() => setDropdownOpen(false)}
                  role="menuitem"
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-lg transition"
                >
                  <User size={15} />
                  <span>My Profile</span>
                </Link>

                <Link
                  to="/settings"
                  onClick={() => setDropdownOpen(false)}
                  role="menuitem"
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-lg transition"
                >
                  <Settings size={15} />
                  <span>Settings</span>
                </Link>
              </div>

              {/* Divider & Logout */}
              <div className="border-t border-slate-100 pt-1 mt-1">
                <button
                  onClick={handleLogout}
                  role="menuitem"
                  type="button"
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                >
                  <LogOut size={15} />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;
