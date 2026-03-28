import { Outlet } from "react-router-dom";
import TopAppBar from "./TopAppBar";
import BottomNavBar from "./BottomNavBar";
import DonorMessages from "../chat/DonorMessages";
import type { User } from "../../types";

interface DashboardLayoutProps {
  onLogout: () => void;
  user: User;
}

const DashboardLayout = ({ onLogout, user }: DashboardLayoutProps) => {
  return (
    <div className="bg-surface font-body text-on-surface antialiased min-h-screen pb-28 pt-20">
      <TopAppBar onLogout={onLogout} />
      <Outlet />
      <BottomNavBar user={user} />
      {/* Global chat manager — available to all roles */}
      <DonorMessages myId={user._id} />
    </div>
  );
};

export default DashboardLayout;
