import { BriefcaseBusiness, Compass, LogOut, UserCircle2 } from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-ink/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
        <Link to="/" className="flex items-center gap-3">
          <div className="rounded-2xl bg-coral px-3 py-2 font-display text-lg font-bold">D</div>
          <div>
            <div className="font-display text-lg">Doondo</div>
            <div className="text-xs text-white/45">Nearby hiring, faster</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-3 md:flex">
          <NavLink to="/jobs" className="button-secondary gap-2 !px-4 !py-2">
            <Compass size={16} />
            Explore jobs
          </NavLink>
          {user?.role === "employer" && (
            <NavLink to="/subscription" className="button-secondary gap-2 !px-4 !py-2">
              <BriefcaseBusiness size={16} />
              Subscription
            </NavLink>
          )}
          {isAuthenticated ? (
            <>
              <NavLink
                to={user.role === "employer" ? "/dashboard/employer" : "/dashboard/seeker"}
                className="button-secondary gap-2 !px-4 !py-2"
              >
                <UserCircle2 size={16} />
                Dashboard
              </NavLink>
              <NotificationBell />
              <button type="button" onClick={handleLogout} className="button-primary gap-2 !px-4 !py-2">
                <LogOut size={16} />
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="button-secondary !px-4 !py-2">
                Login
              </NavLink>
              <NavLink to="/signup" className="button-primary !px-4 !py-2">
                Join Doondo
              </NavLink>
            </>
          )}
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          {isAuthenticated && <NotificationBell compact />}
          <Link to="/jobs" className="rounded-2xl border border-white/10 p-3">
            <Compass size={16} />
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
