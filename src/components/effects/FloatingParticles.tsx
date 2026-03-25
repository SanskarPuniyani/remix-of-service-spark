import { useMemo } from "react";
import { motion } from "framer-motion";

const FloatingParticles = () => {
  const particles = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2.5 + 0.5,
        duration: Math.random() * 20 + 12,
        delay: Math.random() * 10,
        opacity: Math.random() * 0.2 + 0.03,
        color: i % 3 === 0 ? "--primary" : i % 3 === 1 ? "--accent" : "--neon",
      })),
    []
  );

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: `hsl(var(${p.color}) / ${p.opacity})`,
            boxShadow: `0 0 ${p.size * 4}px hsl(var(${p.color}) / ${p.opacity * 0.5})`,
          }}
          animate={{
            y: [0, -250, -500],
            x: [0, Math.random() * 50 - 25, Math.random() * 80 - 40],
            opacity: [0, p.opacity, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
};

export default FloatingParticles;
