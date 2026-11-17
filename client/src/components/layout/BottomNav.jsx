import { Bell, Building2, Home, Map, PhoneCall, User } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/auth";

export default function BottomNav() {
  const { isGuest, user } = useAuth();

  const navItems =
    isGuest || !user
      ? [
          { label: "Home", path: "/", icon: Home },
          { label: "Departments", path: "/departments", icon: Building2 },
          { label: "Map", path: "/map", icon: Map },
          { label: "Notices", path: "/notices", icon: Bell },
          { label: "Emergency", path: "/emergency", icon: PhoneCall },
        ]
      : [
          { label: "Home", path: "/", icon: Home },
          { label: "Departments", path: "/departments", icon: Building2 },
          { label: "Map", path: "/map", icon: Map },
          { label: "Notices", path: "/notices", icon: Bell },
          { label: "Profile", path: "/profile", icon: User },
        ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-[1120px] grid-cols-5 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              end={item.path === "/"}
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 py-3 text-xs ${
                  isActive ? "text-blue-600" : "text-slate-500"
                }`
              }
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}
