import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";

const Footer = () => (
  <footer className="relative border-t border-border/30 section-padding !py-16 overflow-hidden">
    {/* Background gradient */}
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background: "linear-gradient(to top, hsl(var(--background)), hsl(var(--glass) / 0.2))",
      }}
    />

    {/* Subtle glow */}
    <motion.div
      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] rounded-full blur-[120px] pointer-events-none"
      style={{ background: "hsl(var(--primary) / 0.04)" }}
      animate={{ opacity: [0.3, 0.6, 0.3] }}
      transition={{ duration: 6, repeat: Infinity }}
    />

    <motion.div
      className="max-w-6xl mx-auto relative flex flex-col sm:flex-row items-center justify-between gap-6"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link to="/" className="flex items-center gap-2.5 font-display font-bold text-lg group">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))" }}
        >
          <Zap className="w-3.5 h-3.5 text-primary-foreground" />
        </div>
        ServeNow
      </Link>
      <div className="flex items-center gap-8 text-sm text-muted-foreground">
        <Link to="/services" className="hover:text-foreground transition-colors duration-300">
          Services
        </Link>
        <Link to="/auth" className="hover:text-foreground transition-colors duration-300">
          Login
        </Link>
        <span className="opacity-40">© 2026 ServeNow</span>
      </div>
    </motion.div>
  </footer>
);

export default Footer;
