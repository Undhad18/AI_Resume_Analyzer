import { NavLink } from "react-router-dom";
import {
  LogOut,
  BrainCircuit
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { NAVIGATION_ITEMS } from "./navigationItems";

const Sidebar = ({ onNavigate }) => {
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <aside
      aria-label="Sidebar Navigation"
      className="w-64 bg-white border-r border-slate-200 h-full flex flex-col justify-between shrink-0"
    >
      {/* Brand Header */}
      <div>
        <div className="p-5 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm shrink-0">
            <BrainCircuit size={24} />
          </div>
          <div>
            <span className="font-bold text-base text-slate-900 block leading-tight">
              ResumeAI
            </span>
            <span className="text-xs text-slate-400 font-medium">
              AI Resume Analyzer
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3.5 space-y-1 overflow-y-auto max-h-[calc(100vh-180px)]">
          {NAVIGATION_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                    ? "bg-blue-50 text-blue-600 font-semibold shadow-xs"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={18}
                      className={isActive ? "text-blue-600" : "text-slate-400"}
                    />
                    <span>{item.name}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User Quick Info & Logout */}
      <div className="p-3.5 border-t border-slate-100 bg-slate-50/50">
        <div className="px-3 py-2 mb-2 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
            {user?.fullName
              ? user.fullName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)
              : "U"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-800 truncate">
              {user?.fullName || "User"}
            </p>
            <p className="text-[11px] text-slate-400 truncate">
              {user?.email || ""}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          type="button"
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition cursor-pointer"
        >
          <LogOut size={16} />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
