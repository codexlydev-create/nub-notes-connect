import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu } from "lucide-react";
import logo from "@/assets/logo.png";

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const loc = useLocation();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCollapsed(window.innerWidth < 1024);
    }
  }, []);

  // Auto-close mobile drawer on every route change
  useEffect(() => {
    setMobileOpen(false);
  }, [loc.pathname, loc.search]);

  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      </div>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-50 bg-background/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          >
            <motion.div
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              onClick={(e) => e.stopPropagation()}
              className="h-full"
            >
              <Sidebar collapsed={false} setCollapsed={() => setMobileOpen(false)} onNavigate={() => setMobileOpen(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile-only slim bar: just a menu button */}
        <div className="md:hidden sticky top-0 z-30 glass border-b border-border flex items-center px-4 h-14">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-muted" aria-label="Open menu">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 ml-3">
            <img src={logo} alt="Note Share" className="w-7 h-7 rounded-lg" />
            <span className="font-bold text-sm">Note Share</span>
          </div>
        </div>
        <main className="flex-1 overflow-x-hidden">
          <motion.div
            key={loc.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="px-4 md:px-8 py-6 md:py-10 max-w-7xl mx-auto w-full"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}