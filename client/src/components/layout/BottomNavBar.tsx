import { Link, useLocation } from "react-router-dom";
import type { User } from "../../types";

interface NavItem {
  path: string;
  icon: string;
  label: string;
}

function getNavItems(role: string): NavItem[] {
  const homePath =
    role === "admin" ? "/admin" : role === "requester" ? "/requester" : "/dashboard";

  if (role === "requester") {
    return [
      { path: homePath, icon: "home_health", label: "Home" },
      { path: "/donors", icon: "group", label: "Donors" },
      { path: "/requester/donors-near-me", icon: "person_search", label: "Near Me" },

      { path: "/profile", icon: "person", label: "Profile" },
    ];
  }

  return [
    { path: homePath, icon: "home_health", label: "Home" },
    { path: "/requests", icon: "bloodtype", label: "Requests" },
    { path: "/donors", icon: "group", label: "Donors" },
    { path: "/profile", icon: "person", label: "Profile" },
  ];
}

interface BottomNavBarProps {
  user: User;
}

const BottomNavBar = ({ user }: BottomNavBarProps) => {
  const location = useLocation();
  const navItems = getNavItems(user.role);

  return (
    <nav className="fixed bottom-0 w-full z-50 rounded-t-3xl border-t border-gray-100 bg-white/80 backdrop-blur-xl shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center px-4 pt-3 pb-6 w-full">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center px-5 py-2 transition-all active:scale-90 duration-150 ${
                isActive
                  ? "bg-red-50 text-red-700 rounded-2xl"
                  : "text-gray-400 hover:text-red-600"
              }`}
            >
              <span
                className="material-symbols-outlined"
                style={
                  isActive
                    ? { fontVariationSettings: "'FILL' 1" }
                    : undefined
                }
              >
                {item.icon}
              </span>
              <span className="text-[10px] font-semibold tracking-wide uppercase mt-1">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavBar;
