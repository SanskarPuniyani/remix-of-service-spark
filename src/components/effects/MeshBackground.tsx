import { motion } from "framer-motion";

const MeshBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.08]" />

      {/* Primary blob */}
      <motion.div
        className="absolute w-[900px] h-[900px] rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(var(--primary) / 0.06) 0%, transparent 70%)",
          filter: "blur(180px)",
          top: "-10%",
          left: "-10%",
        }}
        animate={{ x: [0, 100, 0], y: [0, 60, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Accent blob */}
      <motion.div
        className="absolute w-[700px] h-[700px] rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(var(--accent) / 0.05) 0%, transparent 70%)",
          filter: "blur(160px)",
          top: "30%",
          right: "-5%",
        }}
        animate={{ x: [0, -80, 0], y: [0, -60, 0], scale: [1, 1.25, 1] }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 4 }}
      />

      {/* Neon blob */}
      <motion.div
        className="absolute w-[800px] h-[800px] rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(var(--neon) / 0.03) 0%, transparent 70%)",
          filter: "blur(200px)",
          bottom: "-15%",
          left: "20%",
        }}
        animate={{ x: [0, 60, 0], y: [0, -40, 0], scale: [1.1, 1, 1.1] }}
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut", delay: 8 }}
      />

      {/* Deep purple core */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(var(--glow-primary) / 0.04) 0%, transparent 60%)",
          filter: "blur(120px)",
          top: "60%",
          left: "60%",
        }}
        animate={{ x: [0, -40, 0], y: [0, 30, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
    </div>
  );
};

export default MeshBackground;
