import { NavLink, useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Home, Search, Users, Info, Mail, LayoutDashboard, LogIn, Bookmark,
  ChevronLeft, ChevronRight, LogOut, Moon, Sun, UserCircle2, UploadCloud,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import UserAvatar from "@/components/UserAvatar";

const publicLinks = [
  { to: "/", label: "Home", icon: Home },
  { to: "/find", label: "Find Notes", icon: Search },
  { to: "/contributors", label: "Contributors", icon: Users },
  { to: "/about", label: "About", icon: Info },
  { to: "/contact", label: "Contact", icon: Mail },
];

const privateLinks = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/upload", label: "Upload Note", icon: UploadCloud },
  { to: "/dashboard/saved", label: "Saved Notes", icon: Bookmark },
  { to: "/profile", label: "Profile", icon: UserCircle2 },
];

export default function Sidebar({ collapsed, setCollapsed, onNavigate }: { collapsed: boolean; setCollapsed: (v: boolean) => void; onNavigate?: () => void }) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  useLocation();

  const handleLogout = () => {
    logout();
    toast.success("Signed out");
    navigate("/", { replace: true });
    onNavigate?.();
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 260 }}
      transition={{ type: "spring", stiffness: 260, damping: 30 }}
      className="sticky top-0 h-screen shrink-0 border-r border-border bg-sidebar flex flex-col"
    >
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
        <img src={logo} alt="Note Share" className="w-9 h-9 rounded-xl shadow-elegant shrink-0" />
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="font-bold text-sidebar-foreground leading-tight">Note Share</div>
            <div className="text-[11px] text-muted-foreground">NUB community</div>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <SectionLabel collapsed={collapsed}>Explore</SectionLabel>
        {publicLinks.map((l) => <Item key={l.to} {...l} collapsed={collapsed} onNavigate={onNavigate} />)}

        {user && (
          <>
            <SectionLabel collapsed={collapsed} className="mt-4">Account</SectionLabel>
            {privateLinks.map((l) => <Item key={l.to} {...l} collapsed={collapsed} onNavigate={onNavigate} />)}
          </>
        )}
      </nav>

      <div className="p-3 border-t border-sidebar-border space-y-2">
        {user ? (
          <>
            <NavLink
              to="/profile"
              onClick={() => onNavigate?.()}
              className={cn(
                "w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-sidebar-accent transition-colors",
                collapsed && "justify-center"
              )}
            >
              <UserAvatar
                name={user.name}
                photoUrl={user.avatarUrl}
                className="w-9 h-9"
                textClass="text-xs"
              />
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-sidebar-foreground truncate">{user.name}</div>
                  <div className="text-[11px] text-muted-foreground truncate">View profile</div>
                </div>
              )}
            </NavLink>
            <button
              onClick={handleLogout}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent transition-colors",
                collapsed && "justify-center"
              )}
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {!collapsed && "Logout"}
            </button>
          </>
        ) : (
          <NavLink
            to="/login"
            onClick={() => onNavigate?.()}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium bg-gradient-primary text-primary-foreground hover:opacity-90 transition-opacity shadow-soft",
              collapsed && "justify-center"
            )}
          >
            <LogIn className="w-4 h-4 shrink-0" />
            {!collapsed && "Login / Register"}
          </NavLink>
        )}
        <button
          onClick={toggle}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-sidebar-foreground hover:bg-sidebar-accent transition-colors",
            collapsed && "justify-center"
          )}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
          {!collapsed && (theme === "dark" ? "Light mode" : "Dark mode")}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-muted-foreground hover:bg-sidebar-accent transition-colors",
            collapsed && "justify-center"
          )}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /> Collapse</>}
        </button>
      </div>
    </motion.aside>
  );
}

function SectionLabel({ children, collapsed, className }: { children: React.ReactNode; collapsed: boolean; className?: string }) {
  if (collapsed) return null;
  return (
    <div className={cn("px-3 pt-2 pb-1 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold", className)}>
      {children}
    </div>
  );
}

function Item({ to, label, icon: Icon, collapsed, onNavigate }: { to: string; label: string; icon: any; collapsed: boolean; onNavigate?: () => void }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      onClick={() => onNavigate?.()}
      className={({ isActive }) =>
        cn(
          "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground hover:bg-sidebar-accent/60",
          collapsed && "justify-center"
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId="side-active"
              className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-gradient-primary"
            />
          )}
          <Icon className="w-4 h-4 shrink-0" />
          {!collapsed && <span className="truncate">{label}</span>}
        </>
      )}
    </NavLink>
  );
}