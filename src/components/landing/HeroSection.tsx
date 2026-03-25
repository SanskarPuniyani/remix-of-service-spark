import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { useEffect, useRef, Suspense, lazy } from "react";

const HeroScene3D = lazy(() => import("@/components/effects/HeroScene3D"));

const letterAnimation = {
  hidden: { opacity: 0, y: 80, rotateX: -90 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: {
      duration: 0.8,
      delay: 0.4 + i * 0.04,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  }),
};

const AnimatedWord = ({ text, className }: { text: string; className?: string }) => (
  <span className={`inline-block ${className || ""}`} style={{ perspective: "600px" }}>
    {text.split("").map((char, i) => (
      <motion.span
        key={i}
        className="inline-block"
        variants={letterAnimation}
        custom={i}
        style={{ transformOrigin: "bottom" }}
      >
        {char === " " ? "\u00A0" : char}
      </motion.span>
    ))}
  </span>
);

const slideUp = {
  hidden: { opacity: 0, y: 60, filter: "blur(12px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 1, ease: [0.16, 1, 0.3, 1] as const } },
};

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15, delayChildren: 0.2 } },
};

const HeroSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const smoothX = useSpring(mouseX, { stiffness: 40, damping: 25 });
  const smoothY = useSpring(mouseY, { stiffness: 40, damping: 25 });
  const glowX = useTransform(smoothX, [0, 1], ["20%", "80%"]);
  const glowY = useTransform(smoothY, [0, 1], ["20%", "80%"]);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouseX.set((e.clientX - rect.left) / rect.width);
      mouseY.set((e.clientY - rect.top) / rect.height);
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, [mouseX, mouseY]);

  return (
    <section ref={containerRef} className="relative min-h-screen flex items-center overflow-hidden">
      {/* 3D Canvas */}
      <Suspense fallback={null}>
        <HeroScene3D />
      </Suspense>

      {/* Mouse-follow glow */}
      <motion.div
        className="absolute w-[900px] h-[900px] rounded-full blur-[250px] pointer-events-none z-[1]"
        style={{
          background: "radial-gradient(circle, hsl(var(--primary) / 0.12) 0%, hsl(var(--accent) / 0.05) 40%, transparent 70%)",
          left: glowX,
          top: glowY,
          x: "-50%",
          y: "-50%",
        }}
      />

      {/* Content */}
      <motion.div
        className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-8"
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        {/* Trust badge */}
        <motion.div variants={slideUp} className="mb-10">
          <span className="inline-flex items-center gap-2.5 glass-card px-5 py-2.5 text-xs font-medium text-muted-foreground tracking-[0.15em] uppercase">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "hsl(var(--success))" }} />
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "hsl(var(--success))" }} />
            </span>
            Trusted by 10,000+ Customers
          </span>
        </motion.div>

        {/* Giant heading with letter animation */}
        <motion.h1
          className="text-6xl sm:text-7xl md:text-8xl lg:text-[7rem] xl:text-[9rem] font-bold font-display leading-[0.85] tracking-[-0.04em] mb-8"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          <div className="overflow-hidden pb-2">
            <AnimatedWord text="Book" />
          </div>
          <div className="overflow-hidden pb-2">
            <AnimatedWord text="Trusted" className="gradient-text" />
          </div>
          <div className="overflow-hidden pb-2">
            <AnimatedWord text="Pros" />
            <motion.span
              className="text-primary inline-block"
              variants={letterAnimation}
              custom={4}
            >
              .
            </motion.span>
          </div>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={slideUp}
          className="text-lg sm:text-xl text-muted-foreground max-w-xl leading-relaxed mb-12"
        >
          From home repairs to beauty services — find verified professionals,
          compare prices, and book in seconds.
        </motion.p>

        {/* CTA with glow distortion */}
        <motion.div variants={slideUp} className="flex flex-col sm:flex-row gap-4">
          <Link to="/services" className="glow-button text-lg group transition-all duration-300 hover:scale-105 active:scale-95 hover:ring-4 hover:ring-accent/30">
            <span className="relative z-10 flex items-center gap-2">
              Browse Services
              <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
            </span>
          </Link>
          <Link to="/auth?mode=provider" className="outline-glow text-lg transition-all duration-300 hover:scale-105 active:scale-95">
            Become a Provider
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div
          variants={slideUp}
          className="mt-20 flex gap-12 border-t border-border/20 pt-10"
        >
          {[
            { value: "10K+", label: "Bookings" },
            { value: "2K+", label: "Providers" },
            { value: "4.9", label: "Avg Rating" },
          ].map(({ value, label }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="text-4xl sm:text-5xl font-bold font-display gradient-text">{value}</p>
              <p className="text-xs text-muted-foreground mt-2 tracking-[0.2em] uppercase">{label}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
      >
        <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/20 flex items-start justify-center p-1.5">
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-primary/60"
            animate={{ y: [0, 14, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
