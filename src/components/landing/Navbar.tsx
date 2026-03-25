import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Zap, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const navLinks = [
  { label: "Services", to: "/services" },
  { label: "How It Works", to: "/#features" },
  { label: "Become a Provider", to: "/auth?mode=provider" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <motion.div
        className="transition-all duration-700"
        style={{
          background: scrolled
            ? "hsl(var(--glass) / 0.85)"
            : "hsl(var(--glass) / 0.2)",
          backdropFilter: scrolled ? "blur(40px) saturate(1.6)" : "blur(12px)",
          borderBottom: `1px solid ${scrolled ? "hsl(var(--glass-border) / 0.4)" : "hsl(var(--glass-border) / 0.1)"}`,
          boxShadow: scrolled ? "0 4px 30px hsl(0 0% 0% / 0.15)" : "none",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 font-display font-bold text-xl group">
            <motion.div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))",
                boxShadow: "0 0 20px hsl(var(--primary) / 0.3)",
              }}
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Zap className="w-4 h-4 text-primary-foreground" />
            </motion.div>
            <span className="tracking-tight">ServeNow</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className="relative text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-300 py-1 group"
              >
                {link.label}
                <span
                  className="absolute -bottom-0.5 left-0 h-px w-0 group-hover:w-full transition-all duration-400"
                  style={{ background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))" }}
                />
              </Link>
            ))}
          </div>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link
                  to="/my-bookings"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
                >
                  My Bookings
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-4 py-2 rounded-lg hover:bg-secondary/50"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/auth" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-4 py-2">
                  Log In
                </Link>
                <Link to="/auth?mode=signup" className="glow-button text-sm !px-5 !py-2">
                  Sign Up Free
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden text-foreground p-2 rounded-lg hover:bg-secondary/50 transition-colors" onClick={() => setOpen(!open)}>
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </motion.div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden overflow-hidden"
            style={{ background: "hsl(var(--glass) / 0.95)", backdropFilter: "blur(30px)", borderBottom: "1px solid hsl(var(--glass-border) / 0.4)" }}
          >
            <div className="px-4 pb-6 pt-2">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  className="block py-3 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex gap-3 mt-4">
                {user ? (
                  <button
                    onClick={() => { handleSignOut(); setOpen(false); }}
                    className="outline-glow text-sm flex-1 text-center !py-2"
                  >
                    Sign Out
                  </button>
                ) : (
                  <>
                    <Link to="/auth" className="outline-glow text-sm flex-1 text-center !py-2" onClick={() => setOpen(false)}>
                      Log In
                    </Link>
                    <Link to="/auth?mode=signup" className="glow-button text-sm flex-1 text-center !py-2" onClick={() => setOpen(false)}>
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
