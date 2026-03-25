import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, Zap, AlertTriangle, CalendarIcon, CheckCircle2, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Provider {
  id: string;
  name: string;
  service: string;
  price: number;
  avatar: string;
}

interface BookingModalProps {
  provider: Provider;
  open: boolean;
  onClose: () => void;
  onSuccess: (booking: { id: string; providerName: string; date: string; time: string; finalPrice: number }) => void;
}

const urgencyOptions = [
  { value: "normal", label: "Normal", multiplier: 1.0, icon: Clock, color: "text-muted-foreground" },
  { value: "within_24h", label: "Within 24h", multiplier: 1.15, icon: Zap, color: "text-warning" },
  { value: "immediate", label: "Immediate", multiplier: 1.25, icon: AlertTriangle, color: "text-destructive" },
] as const;

const timeSlots = [
  "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM",
  "05:00 PM", "06:00 PM",
];

const BookingModal = ({ provider, open, onClose, onSuccess }: BookingModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [urgency, setUrgency] = useState<string>("normal");
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);

  const selectedUrgency = urgencyOptions.find((u) => u.value === urgency)!;
  const finalPrice = useMemo(() => Math.round(provider.price * selectedUrgency.multiplier), [provider.price, selectedUrgency]);

  const handleDateSelect = async (d: Date | undefined) => {
    setDate(d);
    setTime("");
    if (!d) return;

    const { data } = await supabase
      .from("bookings")
      .select("booking_time")
      .eq("provider_id", provider.id)
      .eq("booking_date", format(d, "yyyy-MM-dd"))
      .in("status", ["pending", "confirmed"]);

    setBookedSlots(data?.map((b) => b.booking_time) ?? []);
  };

  const handleBook = async () => {
    if (!user || !date || !time) return;
    setLoading(true);

    const payload = {
      user_id: user.id,
      provider_id: provider.id,
      service_name: provider.service,
      booking_date: format(date, "yyyy-MM-dd"),
      booking_time: time,
      urgency,
      base_price: Number(provider.price),
      final_price: Number(finalPrice),
    };

    console.log("Booking payload:", payload);

    const { data, error } = await supabase.from("bookings").insert(payload).select("id").single();

    setLoading(false);

    if (error) {
      console.error("Booking error:", error);
      toast({ title: "Booking Failed", description: error.message, variant: "destructive" });
      return;
    }

    onSuccess({
      id: data.id,
      providerName: provider.name,
      date: format(date, "PPP"),
      time,
      finalPrice,
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            className="absolute inset-0"
            style={{ background: "hsl(var(--background) / 0.85)", backdropFilter: "blur(8px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30, filter: "blur(8px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.92, y: 30, filter: "blur(8px)" }}
            transition={{ type: "spring", duration: 0.6, bounce: 0.25 }}
            className="relative glass-card p-7 w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Glow behind modal */}
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[300px] h-[200px] rounded-full blur-[100px] pointer-events-none" style={{ background: "hsl(var(--primary) / 0.1)" }} />

            <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-secondary/50">
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-4 mb-7">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center text-primary font-bold font-display text-lg" style={{ background: "linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--accent) / 0.1))" }}>
                {provider.avatar}
              </div>
              <div>
                <h3 className="font-display font-bold text-lg">{provider.name}</h3>
                <p className="text-sm text-muted-foreground">{provider.service}</p>
              </div>
            </div>

            {/* Urgency */}
            <div className="mb-6">
              <label className="text-sm font-medium text-muted-foreground mb-3 block tracking-wide uppercase">Urgency</label>
              <div className="grid grid-cols-3 gap-2">
                {urgencyOptions.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setUrgency(opt.value)}
                      className={cn(
                        "py-3.5 rounded-xl text-xs font-semibold transition-all duration-400 flex flex-col items-center gap-1.5",
                        urgency === opt.value
                          ? "text-primary-foreground shadow-lg"
                          : "glass-card text-muted-foreground hover:text-foreground"
                      )}
                      style={urgency === opt.value ? {
                        background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))",
                        boxShadow: "0 4px 20px hsl(var(--primary) / 0.3)",
                      } : {}}
                    >
                      <Icon className="w-4 h-4" />
                      {opt.label}
                      {opt.multiplier > 1 && (
                        <span className="text-[10px] opacity-70">+{Math.round((opt.multiplier - 1) * 100)}%</span>
                      )}
                    </button>
                  );
                })}
              </div>
              {urgency === "within_24h" && (
                <p className="text-xs text-warning mt-2">⚡ A 15% convenience fee is added for priority scheduling within 24 hours.</p>
              )}
              {urgency === "immediate" && (
                <p className="text-xs text-destructive mt-2">🔥 A 25% surcharge applies for immediate same-day service.</p>
              )}
            </div>

            {/* Date Picker */}
            <div className="mb-6">
              <label className="text-sm font-medium text-muted-foreground mb-3 block tracking-wide uppercase">Select Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <button className={cn(
                    "w-full h-12 px-4 rounded-xl bg-secondary/80 border border-border text-left flex items-center gap-2 transition-all duration-300 focus:ring-2 focus:ring-primary/50",
                    !date && "text-muted-foreground"
                  )}>
                    <CalendarIcon className="w-4 h-4" />
                    {date ? format(date, "PPP") : "Pick a date"}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={handleDateSelect}
                    disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time Slots */}
            {date && (
              <motion.div
                initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.4 }}
                className="mb-6"
              >
                <label className="text-sm font-medium text-muted-foreground mb-3 block tracking-wide uppercase">Select Time</label>
                {timeSlots.every((slot) => bookedSlots.includes(slot)) ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No slots available for this date. Please try another.</p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {timeSlots.map((slot) => {
                      const isBooked = bookedSlots.includes(slot);
                      return (
                        <button
                          key={slot}
                          disabled={isBooked}
                          onClick={() => setTime(slot)}
                          className={cn(
                            "py-2.5 rounded-lg text-xs font-medium transition-all duration-300",
                            isBooked && "opacity-30 cursor-not-allowed line-through",
                            time === slot
                              ? "text-primary-foreground shadow-md"
                              : "glass-card text-muted-foreground hover:text-foreground"
                          )}
                          style={time === slot ? {
                            background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))",
                          } : {}}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* Price */}
            <motion.div
              className="glass-card p-5 rounded-xl mb-7 flex items-center justify-between"
              animate={{ scale: [1, 1.01, 1] }}
              transition={{ duration: 0.3 }}
              key={finalPrice}
            >
              <div>
                <p className="text-xs text-muted-foreground">Base: ₹{provider.price}</p>
                {selectedUrgency.multiplier > 1 && (
                  <p className="text-xs" style={{ color: "hsl(var(--warning))" }}>+{Math.round((selectedUrgency.multiplier - 1) * 100)}% urgency</p>
                )}
              </div>
              <p className="font-display font-bold text-3xl gradient-text">₹{finalPrice}</p>
            </motion.div>

            {/* Book Button */}
            <button
              onClick={handleBook}
              disabled={loading || !date || !time}
              className={cn(
                "glow-button w-full flex items-center justify-center gap-2 text-base",
                (loading || !date || !time) && "opacity-50 cursor-not-allowed"
              )}
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
              ) : (
                <><CheckCircle2 className="w-4 h-4" /> Confirm Booking — ₹{finalPrice}</>
              )}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BookingModal;
