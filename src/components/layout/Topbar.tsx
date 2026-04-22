import { Moon, Sun, Menu } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function Topbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const { theme, toggle } = useTheme();
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 glass border-b border-border">
      <div className="flex items-center justify-between px-4 md:px-8 h-16">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden md:block text-sm text-muted-foreground">
          Welcome{user ? `, ${user.name.split(" ")[0]}` : " to Note Share"} 👋
        </div>

        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            whileHover={{ rotate: 12 }}
            onClick={toggle}
            className="w-10 h-10 rounded-xl border border-border bg-card hover:bg-muted flex items-center justify-center transition-colors shadow-soft"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </motion.button>

          {user ? (
            <Link to="/dashboard" className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-muted transition-colors">
              <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div className="hidden sm:block text-sm font-medium">{user.name.split(" ")[0]}</div>
            </Link>
          ) : (
            <Link to="/login" className="text-sm font-medium px-4 py-2 rounded-xl bg-gradient-primary text-primary-foreground shadow-soft hover:opacity-90 transition">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}