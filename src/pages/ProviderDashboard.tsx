import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Briefcase, Star, DollarSign, Clock, CheckCircle, XCircle, LogOut, ChevronDown, TrendingUp, Calendar, PlusCircle, Settings, Users, UserPlus, Loader2, MapPin, ClipboardPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import PageTransition from "@/components/effects/PageTransition";
import Navbar from "@/components/landing/Navbar";
import ManualBookingModal from "@/components/ManualBookingModal";

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
  worker_id?: string;
  customer_phone?: string;
  customer_address?: {
    house_no: string;
    area: string;
    city: string;
  };
  booking_type?: string;
  customer_name?: string;
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

type Worker = {
  id: string;
  name: string;
  email: string;
  phone: string;
  is_active: boolean;
  user_id?: string;
  status: string;
};

const statusColors: Record<string, string> = {
  pending: "bg-warning/20 text-warning",
  confirmed: "bg-primary/20 text-primary",
  completed: "bg-success/20 text-success",
  cancelled: "bg-destructive/20 text-destructive",
};

const allServiceCategories = [
  "Electrician", "Plumber", "Electronics", "Painting", "Deep Cleaning",
  "Pest Control", "Beautician", "Barber", "Massage", "Car Wash",
  "Vehicle Repair", "Movers"
];

const ProviderDashboard = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [activeProvider, setActiveProvider] = useState<Provider | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "pending" | "confirmed" | "completed" | "workers">("all");
  const [assigningJobId, setAssigningJobId] = useState<string | null>(null);
  const [newWorkerName, setNewWorkerName] = useState("");
  const [newWorkerPhone, setNewWorkerPhone] = useState("");
  const [newWorkerEmail, setNewWorkerEmail] = useState("");
  const [isAddingWorker, setIsAddingWorker] = useState(false);
  const [showManualBooking, setShowManualBooking] = useState(false);
  const [providerName, setProviderName] = useState("");
  const [showAddCategories, setShowAddCategories] = useState(false);
  const [selectedNewCategories, setSelectedNewCategories] = useState<string[]>([]);
  const [addingCategories, setAddingCategories] = useState(false);

  const existingCategories = providers.map(p => p.service_category);
  const availableCategories = allServiceCategories.filter(c => !existingCategories.includes(c));

  const handleAddCategories = async () => {
    if (!user || !activeProvider || selectedNewCategories.length === 0) return;
    setAddingCategories(true);

    const insertPromises = selectedNewCategories.map(category =>
      supabase.from("providers").insert({
        user_id: user.id,
        service_category: category,
        service_name: activeProvider.service_name,
        base_price: activeProvider.base_price,
        experience: activeProvider.experience,
        service_area: activeProvider.service_area,
        avatar_initials: activeProvider.service_name.slice(0, 2).toUpperCase(),
      })
    );

    const results = await Promise.all(insertPromises);
    const err = results.find(r => r.error)?.error;
    setAddingCategories(false);

    if (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } else {
      toast({ title: "Categories Added!", description: `${selectedNewCategories.length} new service(s) added.` });
      setSelectedNewCategories([]);
      setShowAddCategories(false);
      fetchData();
    }
  };
  const deleteWorker = async (workerId: string) => {
    const { error } = await supabase
      .from("workers")
      .delete()
      .eq("id", workerId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Worker removed" });
      setWorkers(prev => prev.filter(w => w.id !== workerId));
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?mode=provider");
      return;
    }
    if (user) {
      fetchData();
    }
  }, [user, authLoading]);

  const fetchData = async () => {
    if (!user) return;

    const { data: providersData } = await supabase
      .from("providers")
      .select("*")
      .eq("user_id", user.id);

    if (!providersData || providersData.length === 0) {
      navigate("/provider/setup");
      return;
    }

    setProviders(providersData);

    // Fetch provider's actual name
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .maybeSingle();
    setProviderName(profile?.full_name || "Provider");
    
    // Set active provider from URL or default to first
    const searchParams = new URLSearchParams(window.location.search);
    const providerId = searchParams.get("providerId");
    const active = providerId 
      ? providersData.find(p => p.id === providerId) || providersData[0]
      : providersData[0];
    
    setActiveProvider(active);

    const { data: bookingData } = await supabase
      .from("bookings")
      .select("*")
      .eq("provider_id", active.id)
      .order("created_at", { ascending: false });

    if (bookingData && bookingData.length > 0) {
      const customerIds = [...new Set(bookingData.map((b) => b.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, phone, house_no, area, city")
        .in("user_id", customerIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

      setBookings(
        bookingData.map((b) => {
          const profile = profileMap.get(b.user_id);
          return {
            ...b,
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

    const { data: workerData } = await supabase
      .from("workers")
      .select("*")
      .eq("provider_id", active.id);
    
    setWorkers(workerData || []);
    setLoading(false);
  };

  const addWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProvider || !newWorkerEmail) return;

    setIsAddingWorker(true);

    // 1. Find the user in the profiles table
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("user_id, full_name, service_category, city")
      .eq("email", newWorkerEmail)
      .eq("role", "worker")
      .maybeSingle();

    if (profileError || !profile) {
      setIsAddingWorker(false);
      toast({ 
        title: "Worker Not Found", 
        description: "No worker is registered with this email. Please ask them to sign up first.", 
        variant: "destructive" 
      });
      return;
    }

    // 2. Check if their service category matches the provider's
    if (profile.service_category !== activeProvider.service_category) {
      setIsAddingWorker(false);
      toast({ 
        title: "Service Mismatch", 
        description: `This worker is registered for ${profile.service_category}, not ${activeProvider.service_category}.`, 
        variant: "destructive" 
      });
      return;
    }

    // 2b. Check if their city matches the provider's city
    // We need to fetch the provider's city first
    const { data: providerProfile } = await supabase
      .from("profiles")
      .select("city")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profile.city !== providerProfile?.city) {
      setIsAddingWorker(false);
      toast({ 
        title: "City Mismatch", 
        description: `Workers must be in the same city (${providerProfile?.city}) as the provider.`, 
        variant: "destructive" 
      });
      return;
    }

    // 3. Try to insert them into the workers table
    const { data, error } = await supabase
      .from("workers")
      .insert({
        provider_id: activeProvider.id,
        user_id: profile.user_id,
        name: profile.full_name || newWorkerName, // Fallback name
        email: newWorkerEmail,
        phone: newWorkerPhone, // This could also be pulled from profile if available
        status: 'pending'
      })
      .select()
      .single();

    setIsAddingWorker(false);

    if (error) {
      if (error.code === "23505") { // Unique constraint violation
        toast({ 
          title: "Already Employed", 
          description: "This worker is already registered with another provider or has a pending request.", 
          variant: "destructive" 
        });
      } else {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    } else {
      toast({ title: "Request Sent!", description: `An employment request has been sent to ${data.name}.` });
      setWorkers(prev => [...prev, data]);
      setNewWorkerName("");
      setNewWorkerPhone("");
      setNewWorkerEmail("");
    }
  };

  const toggleWorkerStatus = async (workerId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("workers")
      .update({ is_active: !currentStatus })
      .eq("id", workerId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setWorkers(prev => prev.map(w => w.id === workerId ? { ...w, is_active: !currentStatus } : w));
    }
  };

  const handleProviderSwitch = (p: Provider) => {
    setActiveProvider(p);
    setLoading(true);
    navigate(`/provider/dashboard?providerId=${p.id}`, { replace: true });
  };

  // Re-fetch bookings and workers when active provider changes
  useEffect(() => {
    if (activeProvider) {
      const fetchProviderDetails = async () => {
        const { data: bookingData } = await supabase
          .from("bookings")
          .select("*")
          .eq("provider_id", activeProvider.id)
          .order("created_at", { ascending: false });

        if (bookingData && bookingData.length > 0) {
          const customerIds = [...new Set(bookingData.map((b) => b.user_id))];
          const { data: profiles } = await supabase
            .from("profiles")
            .select("user_id, phone, house_no, area, city")
            .in("user_id", customerIds);

          const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

          setBookings(
            bookingData.map((b) => {
              const profile = profileMap.get(b.user_id);
              return {
                ...b,
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

        const { data: workerData } = await supabase
          .from("workers")
          .select("*")
          .eq("provider_id", activeProvider.id);
        
        setWorkers(workerData || []);
        setLoading(false);
      };
      fetchProviderDetails();
    }
  }, [activeProvider?.id]);

  const assignWorker = async (bookingId: string, workerId: string) => {
    const { error } = await supabase
      .from("bookings")
      .update({ worker_id: workerId, status: "confirmed" })
      .eq("id", bookingId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    // Set worker to inactive
    await supabase
      .from("workers")
      .update({ is_active: false })
      .eq("id", workerId);

    toast({ title: "Worker Assigned!" });
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, worker_id: workerId, status: "confirmed" } : b))
    );
    setWorkers((prev) =>
      prev.map((w) => (w.id === workerId ? { ...w, is_active: false } : w))
    );
    setAssigningJobId(null);
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
          {/* Header & Service Switcher */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="text-xs font-semibold tracking-[0.3em] uppercase text-primary mb-2 block">Dashboard</span>
              <h1 className="text-3xl sm:text-4xl font-bold font-display tracking-tight">
                Welcome, <span className="gradient-text">{providerName}</span>
              </h1>
              <p className="text-muted-foreground mt-1">{activeProvider?.service_name} · {activeProvider?.service_category} · {activeProvider?.service_area}</p>
            </motion.div>

            <div className="flex items-center gap-3">
              {/* Service Switcher Dropdown */}
              <div className="relative group">
                <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary/40 border border-border/30 text-sm font-medium hover:bg-secondary/60 transition-all">
                  <Briefcase className="w-4 h-4 text-primary" />
                  Switch Service
                  <ChevronDown className="w-4 h-4 opacity-50" />
                </button>
                <div className="absolute right-0 mt-2 w-64 bg-card border border-border/50 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                  <div className="p-2 space-y-1">
                    {providers.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handleProviderSwitch(p)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                          activeProvider?.id === p.id 
                            ? "bg-primary/10 text-primary" 
                            : "hover:bg-secondary/50 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center font-bold text-xs">
                          {p.service_name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{p.service_name}</p>
                          <p className="text-[10px] opacity-60">{p.service_category}</p>
                        </div>
                      </button>
                    ))}
                    {availableCategories.length > 0 && (
                      <div className="border-t border-border/50 my-2 pt-2">
                        <button 
                          onClick={() => { setShowAddCategories(true); setSelectedNewCategories([]); }}
                          className="w-full flex items-center gap-3 p-3 rounded-xl text-left text-primary hover:bg-primary/5 transition-all"
                        >
                          <PlusCircle className="w-5 h-5" />
                          <span className="text-sm font-semibold">Add More Categories</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowManualBooking(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-primary-foreground transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))" }}
              >
                <ClipboardPlus className="w-4 h-4" />
                Assisted Booking
              </button>

              <button 
                onClick={signOut}
                className="p-2.5 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {[
              { icon: TrendingUp, label: "Total Earnings", value: `₹${totalEarnings.toLocaleString()}`, accent: true },
              { icon: Briefcase, label: "Completed Jobs", value: activeProvider?.completed_jobs || 0 },
              { icon: Star, label: "Rating", value: activeProvider?.rating || "5.0" },
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
            {(["all", "pending", "confirmed", "completed", "workers"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 capitalize flex items-center gap-2 ${
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
                {t === "workers" && <Users className="w-4 h-4" />}
                {t} 
                {t === "pending" && pendingCount > 0 && (
                  <span className="bg-warning/20 text-warning px-1.5 py-0.5 rounded-full text-xs">{pendingCount}</span>
                )}
                {t === "workers" && (
                  <span className="bg-primary/20 text-primary px-1.5 py-0.5 rounded-full text-xs">{workers.length}</span>
                )}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {tab === "workers" ? (
                <motion.div
                  key="workers-panel"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* Add Worker Form */}
                  <form onSubmit={addWorker} className="glass-card p-6 rounded-2xl flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 space-y-2 w-full">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Worker Name</label>
                      <input 
                        required
                        value={newWorkerName}
                        onChange={(e) => setNewWorkerName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full h-11 px-4 rounded-xl bg-secondary/50 border border-border/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <div className="flex-1 space-y-2 w-full">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Email Address</label>
                      <input 
                        type="email"
                        required
                        value={newWorkerEmail}
                        onChange={(e) => setNewWorkerEmail(e.target.value)}
                        placeholder="john@example.com"
                        className="w-full h-11 px-4 rounded-xl bg-secondary/50 border border-border/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <div className="flex-1 space-y-2 w-full">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Phone Number</label>
                      <input 
                        value={newWorkerPhone}
                        onChange={(e) => setNewWorkerPhone(e.target.value)}
                        placeholder="+91 9876543210"
                        className="w-full h-11 px-4 rounded-xl bg-secondary/50 border border-border/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <button 
                      type="submit"
                      disabled={isAddingWorker}
                      className="h-11 px-6 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-50"
                    >
                      {isAddingWorker ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                      Add Worker
                    </button>
                  </form>

                  {/* Workers List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {workers.length === 0 ? (
                      <div className="col-span-full py-12 text-center text-muted-foreground bg-secondary/20 rounded-2xl border border-dashed border-border/50">
                        No workers added yet.
                      </div>
                    ) : (
                      workers.map((worker) => (
                        <div key={worker.id} className="glass-card p-4 rounded-xl flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary">
                              {worker.name.slice(0, 1).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-sm flex items-center gap-2">
                                {worker.name}
                                {worker.status === "accepted" ? (
                                  <span className="text-[10px] bg-success/10 text-success px-1.5 py-0.5 rounded-full">Linked</span>
                                ) : (
                                  <span className="text-[10px] bg-warning/10 text-warning px-1.5 py-0.5 rounded-full">Request Sent</span>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground">{worker.email}</p>
                              <p className="text-[10px] text-muted-foreground/60">{worker.phone || "No phone"}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => toggleWorkerStatus(worker.id, worker.is_active)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                worker.is_active 
                                  ? "bg-success/10 text-success hover:bg-success/20" 
                                  : "bg-destructive/10 text-destructive hover:bg-destructive/20"
                              }`}
                            >
                              {worker.is_active ? "Active" : "Inactive"}
                            </button>
                            <button 
                              onClick={() => deleteWorker(worker.id)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
                              title="Remove Worker"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              ) : filteredBookings.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16 text-muted-foreground"
                >
                  No bookings found
                </motion.div>
              ) : (
                filteredBookings.map((booking, i) => {
                  const assignedWorker = workers.find(w => w.id === booking.worker_id);
                  return (
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
                          {booking.booking_type === "manual" && (
                            <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-accent/20 text-accent-foreground border border-accent/30">
                              Assisted
                            </span>
                          )}
                          {booking.urgency !== "normal" && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/20 text-destructive font-medium capitalize">
                              {booking.urgency}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {booking.booking_date}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {booking.booking_time}</span>
                          <span className="font-semibold text-foreground">₹{booking.final_price}</span>
                        </div>
                        {booking.customer_phone && (
                          <div className="text-xs text-muted-foreground mb-1">
                            {booking.booking_type === "manual" && booking.customer_name && (
                              <span className="font-medium text-foreground mr-2">{booking.customer_name}</span>
                            )}
                            Phone: <a href={`tel:${booking.customer_phone}`} className="text-primary hover:underline">{booking.customer_phone}</a>
                          </div>
                        )}
                        {booking.customer_address && (
                          <div className="text-xs text-muted-foreground mb-2 flex items-start gap-1">
                            <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                            <span>
                              {booking.customer_address.house_no}, {booking.customer_address.area}, {booking.customer_address.city}
                            </span>
                          </div>
                        )}
                        {assignedWorker && (
                          <div className="flex items-center gap-1.5 text-xs text-primary font-medium bg-primary/5 w-fit px-2 py-1 rounded-md">
                            <Users className="w-3 h-3" />
                            Assigned to: {assignedWorker.name}
                          </div>
                        )}
                      </div>

                      {booking.status === "pending" && (
                        <div className="flex flex-col gap-2 shrink-0">
                          {assigningJobId === booking.id ? (
                            <div className="flex flex-col gap-2 p-3 bg-secondary/30 rounded-xl border border-border/50">
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Assign Worker</p>
                              {workers.filter(w => w.status === "accepted" && w.is_active).length === 0 ? (
                                <p className="text-[10px] text-muted-foreground italic">No active workers available</p>
                              ) : (
                                <select
                                  className="w-full h-9 px-3 rounded-lg bg-secondary/50 border border-border/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                  defaultValue=""
                                  onChange={(e) => {
                                    if (e.target.value) assignWorker(booking.id, e.target.value);
                                  }}
                                >
                                  <option value="" disabled>Select a worker...</option>
                                  {workers.filter(w => w.status === "accepted" && w.is_active).map(w => (
                                    <option key={w.id} value={w.id}>{w.name}</option>
                                  ))}
                                </select>
                              )}
                              <button 
                                onClick={() => setAssigningJobId(null)}
                                className="px-2.5 py-1.5 rounded-lg bg-secondary text-muted-foreground text-[10px] font-bold hover:bg-secondary/80"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setAssigningJobId(booking.id)}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-primary-foreground transition-all"
                                style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))" }}
                              >
                                <UserPlus className="w-4 h-4" /> Accept & Assign
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => updateBookingStatus(booking.id, "cancelled")}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all"
                              >
                                <XCircle className="w-4 h-4" /> Decline
                              </motion.button>
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      {activeProvider && (
        <ManualBookingModal
          open={showManualBooking}
          onClose={() => setShowManualBooking(false)}
          providerId={activeProvider.id}
          serviceName={activeProvider.service_name}
          serviceCategory={activeProvider.service_category}
          basePrice={activeProvider.base_price}
          workers={workers}
          onSuccess={() => {
            fetchData();
          }}
        />
      )}
    </PageTransition>
  );
};

export default ProviderDashboard;
