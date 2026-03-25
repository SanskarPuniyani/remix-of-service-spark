import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ShieldCheck, Brain, CalendarCheck, Lock } from "lucide-react";
import { useRef, MouseEvent } from "react";

const features = [
  {
    icon: ShieldCheck,
    title: "Verified Providers",
    desc: "Every professional is background-checked and verified for your safety.",
    accent: "--primary",
    gradient: "from-indigo-500/20 to-purple-500/10",
  },
  {
    icon: Brain,
    title: "Smart Matching",
    desc: "AI-powered matching finds the best provider based on your needs and budget.",
    accent: "--accent",
    gradient: "from-purple-500/20 to-pink-500/10",
  },
  {
    icon: CalendarCheck,
    title: "Instant Booking",
    desc: "Book in seconds with real-time availability and instant confirmation.",
    accent: "--neon",
    gradient: "from-cyan-500/20 to-blue-500/10",
  },
  {
    icon: Lock,
    title: "Secure Payments",
    desc: "End-to-end encrypted payments with money-back guarantee.",
    accent: "--success",
    gradient: "from-emerald-500/20 to-teal-500/10",
  },
];

const DepthCard = ({
  children,
  accent,
  index,
}: {
  children: React.ReactNode;
  accent: string;
  index: number;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [12, -12]), { stiffness: 150, damping: 20 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-12, 12]), { stiffness: 150, damping: 20 });
  const glowX = useSpring(useTransform(mouseX, [-0.5, 0.5], [0, 100]), { stiffness: 150, damping: 20 });
  const glowY = useSpring(useTransform(mouseY, [-0.5, 0.5], [0, 100]), { stiffness: 150, damping: 20 });
  const brightness = useMotionValue(0);
  const smoothBrightness = useSpring(brightness, { stiffness: 200, damping: 30 });

  const handleMouseMove = (e: MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
    brightness.set(1);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    brightness.set(0);
  };

  return (
    <motion.div
      ref={ref}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        perspective: "1000px",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="glass-card-hover p-8 group cursor-default relative rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out hover:ring-2 hover:ring-primary/20"
      initial={{ opacity: 0, y: 60, rotateX: 15 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Dynamic glow */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          opacity: smoothBrightness,
          background: `radial-gradient(circle at calc(${glowX}%) calc(${glowY}%), hsl(var(${accent}) / 0.2), transparent 60%)`,
        }}
      />
      {/* Depth layer */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, hsl(var(${accent}) / 0.06), transparent 70%)`,
        }}
      />
      <div className="relative z-10" style={{ transform: "translateZ(30px)" }}>
        {children}
      </div>
    </motion.div>
  );
};

const FeaturesSection = () => {
  return (
    <section className="section-padding relative overflow-hidden">
      {/* Floating shapes */}
      <motion.div
        className="absolute -left-40 top-1/4 w-[500px] h-[500px] rounded-full blur-[180px] pointer-events-none"
        style={{ background: "hsl(var(--primary) / 0.04)" }}
        animate={{ y: [0, -50, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-40 bottom-1/4 w-[400px] h-[400px] rounded-full blur-[150px] pointer-events-none"
        style={{ background: "hsl(var(--accent) / 0.05)" }}
        animate={{ y: [0, 40, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 4 }}
      />

      <div className="max-w-6xl mx-auto relative" style={{ perspective: "1200px" }}>
        {/* Header */}
        <motion.div
          className="mb-24 max-w-2xl"
          initial={{ opacity: 0, y: 60, filter: "blur(8px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="text-xs font-semibold tracking-[0.3em] uppercase text-primary mb-5 block">
            Why ServeNow
          </span>
          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold font-display mb-6 leading-[0.95]">
            Built for <br />
            <span className="gradient-text">Excellence</span>
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            The most reliable platform for connecting you with trusted service professionals.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map(({ icon: Icon, title, desc, accent }, i) => (
            <DepthCard key={title} accent={accent} index={i}>
              <div
                className="w-16 h-16 mb-7 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-6"
                style={{
                  background: `linear-gradient(135deg, hsl(var(${accent}) / 0.15), hsl(var(${accent}) / 0.05))`,
                  boxShadow: `0 0 40px hsl(var(${accent}) / 0.1)`,
                }}
              >
                <Icon className="w-8 h-8 transition-transform duration-500 group-hover:-rotate-6" style={{ color: `hsl(var(${accent}))` }} />
              </div>
              <h3 className="text-lg font-semibold font-display mb-3">{title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
            </DepthCard>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
