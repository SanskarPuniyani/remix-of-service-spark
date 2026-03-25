import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import PageTransition from "@/components/effects/PageTransition";
import Navbar from "@/components/landing/Navbar";

type Booking = {
  id: string;
  service_name: string;
  booking_date: string;
  booking_time: string;
  status: string;
  final_price: number;
  urgency: string;
  provider_id: string;
  provider_name?: string;
};

const statusColors: Record<string, string> = {
  pending: "bg-warning/20 text-warning",
  confirmed: "bg-primary/20 text-primary",
  completed: "bg-success/20 text-success",
  cancelled: "bg-destructive/20 text-destructive",
};

const MyBookings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "pending" | "confirmed" | "completed">("all");

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchBookings();
  }, [user]);

  const fetchBookings = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("bookings")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (data && data.length > 0) {
      const providerIds = [...new Set(data.map((b) => b.provider_id))];
      const { data: providers } = await supabase
        .from("providers")
        .select("id, service_name")
        .in("id", providerIds);

      const providerMap = new Map(providers?.map((p) => [p.id, p.service_name]) || []);

      setBookings(
        data.map((b) => ({
          ...b,
          provider_name: providerMap.get(b.provider_id) || "Unknown Provider",
        }))
      );
    } else {
      setBookings([]);
    }
    setLoading(false);
  };

  const markCompleted = async (bookingId: string) => {
    const { error } = await supabase
      .from("bookings")
      .update({ status: "completed" })
      .eq("id", bookingId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Job marked as completed!" });
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: "completed" } : b))
      );
    }
  };

  const filteredBookings = tab === "all" ? bookings : bookings.filter((b) => b.status === tab);

  if (loading) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen relative">
        <Navbar />
        <div className="pt-24 pb-16 px-4 sm:px-8 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <span className="text-xs font-semibold tracking-[0.3em] uppercase text-primary mb-2 block">
              My Bookings
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold font-display tracking-tight">
              Your <span className="gradient-text">Service History</span>
            </h1>
          </motion.div>

          {/* Tabs */}
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            {(["all", "pending", "confirmed", "completed"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 capitalize ${
                  tab === t
                    ? "text-primary-foreground"
                    : "bg-secondary/40 text-muted-foreground hover:text-foreground"
                }`}
                style={
                  tab === t
                    ? {
                        background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))",
                        boxShadow: "0 4px 15px hsl(var(--primary) / 0.3)",
                      }
                    : {}
                }
              >
                {t}
              </button>
            ))}
          </div>

          {/* Bookings List */}
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredBookings.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16 text-muted-foreground"
                >
                  No bookings found
                </motion.div>
              ) : (
                filteredBookings.map((booking, i) => (
                  <motion.div
                    key={booking.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className="rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    style={{
                      background: "hsl(var(--glass) / 0.4)",
                      border: "1px solid hsl(var(--glass-border) / 0.2)",
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-foreground">{booking.service_name}</h3>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-medium capitalize ${
                            statusColors[booking.status] || "bg-secondary text-muted-foreground"
                          }`}
                        >
                          {booking.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{booking.provider_name}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> {booking.booking_date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {booking.booking_time}
                        </span>
                        <span className="font-semibold text-foreground">₹{booking.final_price}</span>
                      </div>
                    </div>

                    {booking.status === "confirmed" && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => markCompleted(booking.id)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-primary-foreground transition-all shrink-0"
                        style={{
                          background: "linear-gradient(135deg, hsl(160 84% 39%), hsl(160 84% 30%))",
                        }}
                      >
                        <CheckCircle className="w-4 h-4" /> Mark Completed
                      </motion.button>
                    )}
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default MyBookings;
