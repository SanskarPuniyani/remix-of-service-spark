import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Briefcase, Clock, CheckCircle, XCircle, LogOut, Calendar, MapPin, Phone, Settings, UserPlus, Map } from "lucide-react";
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
  provider_id: string;
  customer_name?: string;
  customer_phone?: string;
  customer_address?: {
    house_no: string;
    area: string;
    city: string;
  };
  customer_latitude?: number;
  customer_longitude?: number;
};

const statusColors: Record<string, string> = {
  pending: "bg-warning/20 text-warning",
  confirmed: "bg-primary/20 text-primary",
  completed: "bg-success/20 text-success",
  cancelled: "bg-destructive/20 text-destructive",
};

const WorkerDashboard = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [worker, setWorker] = useState<any>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "pending" | "confirmed" | "completed">("all");
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [viewingMapBooking, setViewingMapBooking] = useState<Booking | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?role=worker");
      return;
    }
    if (user) {
      fetchData();
    }
  }, [user, authLoading]);

  const fetchData = async () => {
    if (!user) return;

    // 1. Fetch worker details linked to this user (accepted only)
    let { data: workerData } = await supabase
      .from("workers")
      .select("*, providers(service_name, service_area, service_category)")
      .eq("user_id", user.id)
      .eq("status", "accepted")
      .maybeSingle();

    // 2. Fetch pending requests
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, service_category")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profile?.email) {
      const { data: requests } = await supabase
        .from("workers")
        .select("*, providers(service_name, service_area, service_category)")
        .eq("email", profile.email)
        .eq("status", "pending");
      
      setPendingRequests(requests || []);
    }

    if (!workerData) {
      setLoading(false);
      setWorker(null);
      return; 
    }
    setWorker(workerData);

    // 3. Fetch assigned bookings
    const { data: bookingData } = await supabase
      .from("bookings")
      .select("*")
      .eq("worker_id", workerData.id)
      .order("created_at", { ascending: false });

    if (bookingData && bookingData.length > 0) {
      const customerIds = [...new Set(bookingData.map((b) => b.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, phone, house_no, area, city")
        .in("user_id", customerIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

      setBookings(
        bookingData.map((b) => {
          const profile = profileMap.get(b.user_id);
          return {
            ...b,
            customer_name: profile?.full_name || "Anonymous Customer",
            customer_phone: profile?.phone,
            customer_address: profile ? {
              house_no: profile.house_no,
              area: profile.area,
              city: profile.city
            } : undefined
          };
        })
      );
    } else {
      setBookings([]);
    }
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
      toast({ title: `Job ${status}!` });
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status } : b))
      );
    }
  };

  const handleRequestResponse = async (requestId: string, accept: boolean) => {
    if (accept) {
      const { error } = await supabase
        .from("workers")
        .update({ status: "accepted", user_id: user?.id })
        .eq("id", requestId);
      
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Request Accepted!", description: "You are now linked to this provider." });
        fetchData();
      }
    } else {
      const { error } = await supabase
        .from("workers")
        .delete()
        .eq("id", requestId);
      
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Request Declined" });
        setPendingRequests(prev => prev.filter(r => r.id !== requestId));
      }
    }
  };

  const unregisterFromProvider = async () => {
    if (!worker) return;
    
    const confirm = window.confirm("Are you sure you want to unregister? This will remove you from this provider's team.");
    if (!confirm) return;

    const { error } = await supabase
      .from("workers")
      .delete()
      .eq("id", worker.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Unregistered successfully" });
      setWorker(null);
      setBookings([]);
      fetchData();
    }
  };

  const filteredBookings = tab === "all" ? bookings : bookings.filter((b) => b.status === tab);

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
        <div className="pt-24 pb-16 px-4 sm:px-8 max-w-5xl mx-auto">
          <div className="flex justify-between items-start mb-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <span className="text-xs font-semibold tracking-[0.3em] uppercase text-primary mb-2 block">Worker Portal</span>
              <h1 className="text-3xl sm:text-4xl font-bold font-display tracking-tight">
                Hello, <span className="gradient-text">{worker?.name || user?.user_metadata?.full_name}</span>
              </h1>
              {worker ? (
                <p className="text-muted-foreground mt-1">
                  {worker.providers?.service_name} · {worker.providers?.service_area}
                </p>
              ) : (
                <div className="mt-4 p-6 rounded-2xl bg-warning/10 border border-warning/20 text-warning">
                  <p className="font-semibold">Account Unlinked</p>
                  <p className="text-sm opacity-80">Your account is not yet linked to a service provider. Please contact your employer to link your email.</p>
                </div>
              )}
            </motion.div>
            <div className="flex gap-2">
              {worker && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={unregisterFromProvider}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-destructive/10 border border-destructive/20 text-sm font-semibold text-destructive hover:bg-destructive/20 transition-all"
                >
                  <XCircle className="w-4 h-4" />
                  Unregister
                </motion.button>
              )}
            </div>
          </div>

          {pendingRequests.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-10 space-y-4"
            >
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" />
                Employment Requests
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingRequests.map((req) => (
                  <div key={req.id} className="glass-card p-6 rounded-2xl border border-primary/30 bg-primary/5">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg">{req.providers?.service_name}</h3>
                        <p className="text-sm text-muted-foreground">{req.providers?.service_category} · {req.providers?.service_area}</p>
                      </div>
                      <span className="text-[10px] px-2 py-1 rounded-full bg-primary/20 text-primary font-bold uppercase tracking-wider">New Request</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRequestResponse(req.id, true)}
                        className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:scale-[1.02] transition-all"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRequestResponse(req.id, false)}
                        className="flex-1 py-2 rounded-xl bg-secondary text-muted-foreground text-sm font-bold hover:bg-secondary/80 transition-all"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {worker ? (
            <>
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
                        ? { background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))", boxShadow: "0 4px 15px hsl(var(--primary) / 0.3)" }
                        : {}
                    }
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Bookings List */}
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {filteredBookings.length === 0 ? (
                    <motion.div
                      key="empty-jobs"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-16 text-muted-foreground bg-secondary/10 rounded-2xl border border-dashed border-border"
                    >
                      No assigned jobs found
                    </motion.div>
                  ) : (
                    filteredBookings.map((booking) => (
                      <motion.div
                        key={booking.id}
                        layout
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card p-6 rounded-2xl border border-border/30 shadow-lg"
                      >
                        <div className="flex flex-col md:flex-row justify-between gap-6">
                          <div className="space-y-3 flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="text-lg font-bold">{booking.service_name}</h3>
                              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium capitalize ${statusColors[booking.status] || "bg-secondary text-muted-foreground"}`}>
                                {booking.status}
                              </span>
                              {booking.urgency !== "normal" && (
                                <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-bold uppercase tracking-wider animate-pulse">
                                  <Clock className="w-3 h-3" />
                                  Immediate
                                </span>
                              )}
                            </div>
                            
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium flex items-center gap-2">
                                  <Briefcase className="w-4 h-4 text-primary" />
                                  Customer: <span className="text-foreground">{booking.customer_name}</span>
                                </p>
                                <p className="text-lg font-bold text-primary">
                                  ₹{booking.final_price}
                                </p>
                              </div>
                              {booking.customer_phone && (
                                <p className="text-sm text-muted-foreground flex items-center gap-2">
                                  <Phone className="w-4 h-4" />
                                  <a href={`tel:${booking.customer_phone}`} className="hover:text-primary transition-colors">
                                    {booking.customer_phone}
                                  </a>
                                </p>
                              )}
                              {booking.customer_address && (
                                <p className="text-sm text-muted-foreground flex items-start gap-2">
                                  <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                                  <span>
                                    {booking.customer_address.house_no}, {booking.customer_address.area}, {booking.customer_address.city}
                                  </span>
                                </p>
                              )}
                              <p className="text-sm text-muted-foreground flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                {booking.booking_date} at {booking.booking_time}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-row md:flex-col gap-2 justify-end">
                            {booking.status === "confirmed" && (
                              <button
                                onClick={() => updateBookingStatus(booking.id, "completed")}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-success text-success-foreground font-semibold text-sm hover:scale-105 transition-all"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Complete Job
                              </button>
                            )}
                            {booking.status === "pending" && (
                              <button
                                onClick={() => updateBookingStatus(booking.id, "confirmed")}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:scale-105 transition-all"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Start Job
                              </button>
                            )}
                            {booking.customer_phone && (
                              <a 
                                href={`tel:${booking.customer_phone}`}
                                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-secondary/50 text-muted-foreground font-medium text-sm hover:bg-secondary transition-all"
                              >
                                <Phone className="w-4 h-4" />
                                Contact
                              </a>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </PageTransition>
  );
};

export default WorkerDashboard;
