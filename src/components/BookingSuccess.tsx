import { motion } from "framer-motion";
import { CheckCircle2, Calendar, Clock, User, Hash, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useMemo } from "react";

interface BookingSuccessProps {
  booking: {
    id: string;
    providerName: string;
    date: string;
    time: string;
    finalPrice: number;
  };
  onClose: () => void;
}

const ConfettiParticle = ({ delay, x }: { delay: number; x: number }) => (
  <motion.div
    className="absolute w-2 h-2 rounded-full"
    style={{
      left: `${x}%`,
      top: "50%",
      background: `hsl(${Math.random() * 60 + 220} 80% 60%)`,
    }}
    initial={{ y: 0, opacity: 1, scale: 1 }}
    animate={{
      y: [0, -200 - Math.random() * 100],
      x: [0, (Math.random() - 0.5) * 200],
      opacity: [1, 0],
      scale: [1, 0.5],
      rotate: [0, Math.random() * 720],
    }}
    transition={{ duration: 1.5, delay, ease: "easeOut" }}
  />
);

const BookingSuccess = ({ booking, onClose }: BookingSuccessProps) => {
  const confetti = useMemo(
    () => Array.from({ length: 20 }, (_, i) => ({ id: i, delay: 0.3 + i * 0.05, x: 30 + Math.random() * 40 })),
    []
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0" style={{ background: "hsl(var(--background) / 0.85)", backdropFilter: "blur(8px)" }} />
      <motion.div
        initial={{ opacity: 0, scale: 0.85, filter: "blur(10px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        transition={{ type: "spring", duration: 0.7, bounce: 0.3 }}
        className="relative glass-card p-8 w-full max-w-md text-center overflow-hidden"
      >
        {/* Confetti */}
        {confetti.map((c) => (
          <ConfettiParticle key={c.id} delay={c.delay} x={c.x} />
        ))}

        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[200px] rounded-full blur-[100px] pointer-events-none" style={{ background: "hsl(var(--success) / 0.1)" }} />

        {/* Animated check */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 12 }}
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: "linear-gradient(135deg, hsl(var(--success) / 0.2), hsl(var(--success) / 0.05))" }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
          >
            <CheckCircle2 className="w-10 h-10" style={{ color: "hsl(var(--success))" }} />
          </motion.div>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-2xl font-bold font-display mb-2"
        >
          Booking Confirmed!
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-muted-foreground mb-7 flex items-center justify-center gap-1.5"
        >
          <Sparkles className="w-4 h-4 text-primary" />
          Your service has been booked successfully
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="glass-card p-5 rounded-xl mb-7 text-left space-y-3"
        >
          <div className="flex items-center gap-3 text-sm">
            <Hash className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Booking ID:</span>
            <span className="font-mono text-xs ml-auto">{booking.id.slice(0, 8)}...</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Provider:</span>
            <span className="font-semibold ml-auto">{booking.providerName}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Date:</span>
            <span className="ml-auto">{booking.date}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Time:</span>
            <span className="ml-auto">{booking.time}</span>
          </div>
          <div className="border-t border-border/50 pt-3 flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Total Amount</span>
            <span className="font-display font-bold text-2xl gradient-text">₹{booking.finalPrice}</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85 }}
          className="flex gap-3"
        >
          <Link to="/" className="outline-glow flex-1 text-center text-sm !py-3" onClick={onClose}>
            Back Home
          </Link>
          <button onClick={onClose} className="glow-button flex-1 text-sm !py-3">
            Done
          </button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default BookingSuccess;
