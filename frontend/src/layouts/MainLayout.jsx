import DashboardLayout from "../components/dashboard/DashboardLayout";

/**
 * MainLayout delegates to the modern modular DashboardLayout.
 * Preserved for backwards compatibility with existing route imports.
 */
const MainLayout = () => {
  return <DashboardLayout />;
};

export default MainLayout;
