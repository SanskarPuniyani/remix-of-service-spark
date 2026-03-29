import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Briefcase, Star, Clock, MapPin, Loader2, ArrowRight, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import PageTransition from "@/components/effects/PageTransition";
import Navbar from "@/components/landing/Navbar";

const serviceCategories = [
  "Electrician",
  "Plumber",
  "Electronics",
  "Painting",
  "Deep Cleaning",
  "Pest Control",
  "Beautician",
  "Barber",
  "Massage",
  "Car Wash",
  "Vehicle Repair",
  "Movers"
];

const experienceOptions = ["< 1 year", "1-3 years", "3-5 years", "5-10 years", "10+ years"];

const WorkerSetup = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, role } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    service_category: "",
    experience: "1-3 years",
    skills: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
    if (role === "provider") {
      toast({ 
        title: "Access Denied", 
        description: "Providers cannot register as workers. Please use your provider dashboard to manage workers.",
        variant: "destructive"
      });
      navigate("/provider/dashboard");
    }
  }, [user, authLoading, role, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    // Check if user is already a provider
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (profile?.role === "provider") {
      toast({ title: "Operation Failed", description: "You are already a provider.", variant: "destructive" });
      setLoading(false);
      return;
    }

    // Update profile with worker info - providers will add them via email later
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ 
        role: "worker",
        service_category: form.service_category,
        experience: form.experience,
        full_name: form.name || undefined
      })
      .eq("user_id", user.id);

    const workerError = profileError;
      await supabase
        .from("profiles")
        .update({ role: "worker" })
        .eq("user_id", user.id);
      
      toast({ title: "Registration Successful!", description: "You are now registered as a worker." });
      navigate("/worker/dashboard");
    } else {
      toast({ title: "Setup Failed", description: workerError.message, variant: "destructive" });
    }
    setLoading(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-background">
        <Navbar />
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex p-3 rounded-2xl bg-accent/10 text-accent mb-4"
            >
              <User className="w-8 h-8" />
            </motion.div>
            <h1 className="text-4xl font-bold font-display tracking-tight mb-3">
              Become a <span className="text-accent">Worker</span>
            </h1>
            <p className="text-muted-foreground">Register yourself to start receiving service assignments.</p>
          </div>

          <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-xl">
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold flex items-center gap-2">
                    <User className="w-4 h-4 text-accent" /> Display Name
                  </label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Enter your name as it will appear to customers"
                    className="w-full h-12 px-4 rounded-xl bg-secondary/30 border border-border focus:ring-2 focus:ring-accent/20 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-accent" /> Service Category
                  </label>
                  <div className="relative group">
                    <select
                      required
                      value={form.service_category}
                      onChange={(e) => setForm({ ...form, service_category: e.target.value })}
                      className="w-full h-12 px-4 rounded-xl bg-secondary/30 border border-border focus:ring-2 focus:ring-accent/20 outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="" disabled>Select a category</option>
                      {serviceCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none transition-transform group-hover:scale-110" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-accent" /> Experience Level
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {experienceOptions.map((exp) => (
                      <button
                        key={exp}
                        type="button"
                        onClick={() => setForm({ ...form, experience: exp })}
                        className={`h-11 rounded-xl border text-xs font-medium transition-all ${
                          form.experience === exp
                            ? "bg-accent text-accent-foreground border-accent shadow-lg shadow-accent/20"
                            : "bg-secondary/30 border-border hover:border-accent/50"
                        }`}
                      >
                        {exp}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold flex items-center gap-2">
                    <Star className="w-4 h-4 text-accent" /> Skills
                  </label>
                  <textarea
                    required
                    value={form.skills}
                    onChange={(e) => setForm({ ...form, skills: e.target.value })}
                    placeholder="e.g. Wiring, Installation, Troubleshooting (comma separated)"
                    className="w-full p-4 rounded-xl bg-secondary/30 border border-border focus:ring-2 focus:ring-accent/20 outline-none transition-all min-h-[100px]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 rounded-2xl bg-accent text-accent-foreground font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-xl shadow-accent/20 disabled:opacity-50 mt-4"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <ArrowRight className="w-6 h-6" />}
                Complete Registration
              </button>
            </form>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default WorkerSetup;
