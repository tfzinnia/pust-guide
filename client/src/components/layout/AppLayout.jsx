import BottomNav from "./BottomNav";
import ConnectionBar from "./ConnectionBar";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/auth";

export default function AppLayout({ children }) {
  const { user } = useAuth();
  return (
    <div className="app-shell pb-44">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <ConnectionBar />
      {user && user.role !== "student" && (
        <div className="flex justify-between bg-slate-900 px-6 py-3 text-sm text-white">
          <span>PUST Guide</span>
          <Link to={user.role === "super_admin" ? "/admin" : "/teacher"}>
            Management dashboard →
          </Link>
        </div>
      )}
      <div id="main-content" tabIndex={-1}>
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
