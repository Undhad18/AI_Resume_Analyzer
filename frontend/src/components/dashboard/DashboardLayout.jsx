import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopNavbar from "./TopNavbar";
import MobileSidebar from "./MobileSidebar";

/**
 * DashboardLayout
 * Fixed desktop sidebar and top navbar, with only the middle main content area scrolling.
 */
const DashboardLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="h-screen bg-slate-50 flex overflow-hidden">
      {/* Desktop Persistent Sidebar (Fixed in place) */}
      <div className="hidden lg:block shrink-0 h-full">
        <Sidebar />
      </div>

      {/* Mobile / Tablet Drawer */}
      <MobileSidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Column Area (Fixed TopNavbar + Scrollable Main Content) */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Navigation Bar (Fixed in place) */}
        <div className="shrink-0 z-20">
          <TopNavbar onOpenMobileMenu={() => setMobileMenuOpen(true)} />
        </div>

        {/* Dynamic Route Content (Only this middle part scrolls!) */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
