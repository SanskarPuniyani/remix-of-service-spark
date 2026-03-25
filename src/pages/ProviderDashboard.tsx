import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Briefcase, Star, DollarSign, Clock, CheckCircle, XCircle, LogOut, ChevronDown, TrendingUp, Calendar } from "lucide-react";
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
  user_id: string;
};

type Provider = {
  id: string;
  service_name: string;
  service_category: string;
  rating: number;
  completed_jobs: number;
  base_price: number;
  experience: string;
  service_area: string;
  is_active: boolean;
};

const statusColors: Record<string, string> = {
  pending: "bg-warning/20 text-warning",
  confirmed: "bg-primary/20 text-primary",
  completed: "bg-success/20 text-success",
  cancelled: "bg-destructive/20 text-destructive",
};

const ProviderDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "pending" | "confirmed" | "completed">("all");

  useEffect(() => {
    if (!user) {
      navigate("/auth?mode=provider");
      return;
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    const { data: providerData } = await supabase
      .from("providers")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!providerData) {
      navigate("/provider/setup");
      return;
    }
    setProvider(providerData);

    const { data: bookingData } = await supabase
      .from("bookings")
      .select("*")
      .eq("provider_id", providerData.id)
      .order("created_at", { ascending: false });

    setBookings(bookingData || []);
    setLoading(false);
  };

  const updateBookingStatus = async (bookingId: string, status: string) => {
    const { error } = await supabase
      .from("bookings")
      .update({ status })
      .eq("id", bookingId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Booking ${status}` });
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status } : b))
      );
    }
  };

  const filteredBookings = tab === "all" ? bookings : bookings.filter((b) => b.status === tab);

  const totalEarnings = bookings
    .filter((b) => b.status === "completed")
    .reduce((sum, b) => sum + b.final_price, 0);

  const pendingCount = bookings.filter((b) => b.status === "pending").length;

  if (loading) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center">
          <motion.div
            className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen relative">
        <Navbar />
        <div className="pt-24 pb-16 px-4 sm:px-8 max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <span className="text-xs font-semibold tracking-[0.3em] uppercase text-primary mb-2 block">Dashboard</span>
            <h1 className="text-3xl sm:text-4xl font-bold font-display tracking-tight">
              Welcome, <span className="gradient-text">{provider?.service_name}</span>
            </h1>
            <p className="text-muted-foreground mt-1">{provider?.service_category} · {provider?.service_area}</p>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {[
              { icon: TrendingUp, label: "Total Earnings", value: `₹${totalEarnings.toLocaleString()}`, accent: true },
              { icon: Briefcase, label: "Completed Jobs", value: provider?.completed_jobs || 0 },
              { icon: Star, label: "Rating", value: provider?.rating || "5.0" },
              { icon: Calendar, label: "Pending", value: pendingCount },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="rounded-2xl p-5 relative overflow-hidden"
                style={{
                  background: "hsl(var(--glass) / 0.5)",
                  border: "1px solid hsl(var(--glass-border) / 0.3)",
                }}
              >
                <stat.icon className={`w-5 h-5 mb-3 ${stat.accent ? "text-primary" : "text-muted-foreground"}`} />
                <p className="text-2xl font-bold font-display">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Booking Tabs */}
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
                    ? { background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))", boxShadow: "0 4px 15px hsl(var(--primary) / 0.3)" }
                    : {}
                }
              >
                {t} {t === "pending" && pendingCount > 0 && (
                  <span className="ml-1 bg-warning/20 text-warning px-1.5 py-0.5 rounded-full text-xs">{pendingCount}</span>
                )}
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
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium capitalize ${statusColors[booking.status] || "bg-secondary text-muted-foreground"}`}>
                          {booking.status}
                        </span>
                        {booking.urgency !== "normal" && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/20 text-destructive font-medium capitalize">
                            {booking.urgency}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {booking.booking_date}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {booking.booking_time}</span>
                        <span className="font-semibold text-foreground">₹{booking.final_price}</span>
                      </div>
                    </div>

                    {booking.status === "pending" && (
                      <div className="flex items-center gap-2 shrink-0">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => updateBookingStatus(booking.id, "confirmed")}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-primary-foreground transition-all"
                          style={{ background: "linear-gradient(135deg, hsl(160 84% 39%), hsl(160 84% 30%))" }}
                        >
                          <CheckCircle className="w-4 h-4" /> Accept
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => updateBookingStatus(booking.id, "cancelled")}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all"
                        >
                          <XCircle className="w-4 h-4" /> Reject
                        </motion.button>
                      </div>
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

export default ProviderDashboard;
