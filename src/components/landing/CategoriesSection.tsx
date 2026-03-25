import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Wrench, Droplets, Cpu, Paintbrush, SprayCan, Bug,
  Scissors, UserRound, Hand, CarFront, Settings, Truck,
} from "lucide-react";
import { useRef, MouseEvent } from "react";

const categories = [
  {
    name: "Repairing",
    services: [
      { name: "Electrician", icon: Wrench },
      { name: "Plumber", icon: Droplets },
      { name: "Electronics", icon: Cpu },
    ],
  },
  {
    name: "Home Services",
    services: [
      { name: "Painting", icon: Paintbrush },
      { name: "Deep Cleaning", icon: SprayCan },
      { name: "Pest Control", icon: Bug },
    ],
  },
  {
    name: "Beauty",
    services: [
      { name: "Beautician", icon: Scissors },
      { name: "Barber", icon: UserRound },
      { name: "Massage", icon: Hand },
    ],
  },
  {
    name: "Others",
    services: [
      { name: "Car Wash", icon: CarFront },
      { name: "Vehicle Repair", icon: Settings },
      { name: "Movers", icon: Truck },
    ],
  },
];

const ServiceCard = ({ name, icon: Icon }: { name: string; icon: React.ElementType }) => {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), { stiffness: 200, damping: 20 });
  const z = useSpring(0, { stiffness: 300, damping: 25 });

  const handleMouseMove = (e: MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
    z.set(20);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    z.set(0);
  };

  return (
    <motion.div
      ref={ref}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        z,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="glass-card-hover p-5 flex items-center gap-4 group cursor-pointer rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out hover:ring-2 hover:ring-primary/20"
    >
      <motion.div
        className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 transition-all duration-500"
        style={{
          background: "linear-gradient(135deg, hsl(var(--primary) / 0.12), hsl(var(--accent) / 0.08))",
          transform: "translateZ(20px)",
        }}
        whileHover={{ scale: 1.15, rotate: 8 }}
      >
        <Icon className="w-6 h-6 text-primary" />
      </motion.div>
      <div className="min-w-0" style={{ transform: "translateZ(15px)" }}>
        <p className="font-semibold truncate">{name}</p>
        <p className="text-sm text-muted-foreground group-hover:text-primary/70 transition-colors">
          Book now →
        </p>
      </div>
    </motion.div>
  );
};

const CategoriesSection = () => {
  return (
    <section className="section-padding relative overflow-hidden">
      {/* Ambient glow */}
      <motion.div
        className="absolute top-20 right-0 w-[500px] h-[500px] rounded-full blur-[200px] pointer-events-none"
        style={{ background: "hsl(var(--accent) / 0.04)" }}
        animate={{ x: [0, -40, 0], y: [0, 30, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-20 left-0 w-[400px] h-[400px] rounded-full blur-[160px] pointer-events-none"
        style={{ background: "hsl(var(--primary) / 0.03)" }}
        animate={{ x: [0, 30, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 5 }}
      />

      <div className="max-w-6xl mx-auto relative" style={{ perspective: "1200px" }}>
        <motion.div
          className="mb-24 max-w-2xl"
          initial={{ opacity: 0, y: 60, filter: "blur(8px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="text-xs font-semibold tracking-[0.3em] uppercase text-primary mb-5 block">
            Categories
          </span>
          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold font-display mb-6 leading-[0.95]">
            Explore <br />
            <span className="gradient-text">Services</span>
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Find the right professional for any job, big or small.
          </p>
        </motion.div>

        {categories.map((cat, catIdx) => (
          <div key={cat.name} className="mb-16">
            <motion.h3
              className="text-xs font-semibold font-display mb-6 text-muted-foreground tracking-[0.25em] uppercase flex items-center gap-3"
              initial={{ opacity: 0, x: -30, filter: "blur(4px)" }}
              whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, delay: catIdx * 0.08, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="w-10 h-px bg-primary/30" />
              {cat.name}
            </motion.h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {cat.services.map(({ name, icon }, i) => (
                <motion.div
                  key={name}
                  initial={{ opacity: 0, y: 50, rotateX: 10, filter: "blur(6px)" }}
                  whileInView={{ opacity: 1, y: 0, rotateX: 0, filter: "blur(0px)" }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{
                    duration: 0.8,
                    delay: i * 0.12 + catIdx * 0.06,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  <Link to={`/services?category=${encodeURIComponent(name)}`} className="block">
                    <ServiceCard name={name} icon={icon} />
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default CategoriesSection;
