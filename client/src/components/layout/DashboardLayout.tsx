import { Outlet } from "react-router-dom";
import TopAppBar from "./TopAppBar";
import BottomNavBar from "./BottomNavBar";

interface DashboardLayoutProps {
  onLogout: () => void;
}

const DashboardLayout = ({ onLogout }: DashboardLayoutProps) => {
  return (
    <div className="bg-surface font-body text-on-surface antialiased min-h-screen pb-28 pt-20">
      <TopAppBar onLogout={onLogout} />
      <Outlet />
      <BottomNavBar />
    </div>
  );
};

export default DashboardLayout;
