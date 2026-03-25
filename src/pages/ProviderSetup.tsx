import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, Briefcase, MapPin, DollarSign, Clock, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import PageTransition from "@/components/effects/PageTransition";

const serviceCategories = [
  "Electrician", "Plumber", "Deep Cleaning", "Beautician",
  "Painter", "Pest Control", "Carpenter", "AC Repair",
];

const experienceOptions = ["< 1 year", "1-3 years", "3-5 years", "5-10 years", "10+ years"];

const ProviderSetup = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    service_category: "",
    service_name: "",
    base_price: 500,
    experience: "1-3 years",
    service_area: "",
    avatar_initials: "",
  });

  const update = (key: string, value: string | number) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    const initials = form.avatar_initials || form.service_name.slice(0, 2).toUpperCase();

    const { error } = await supabase.from("providers").insert({
      user_id: user.id,
      service_category: form.service_category,
      service_name: form.service_name,
      base_price: form.base_price,
      experience: form.experience,
      service_area: form.service_area,
      avatar_initials: initials,
    });

    setLoading(false);
    if (error) {
      toast({ title: "Setup Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile created!", description: "Welcome aboard!" });
      navigate("/provider/dashboard");
    }
  };

  if (!user) {
    navigate("/auth?mode=provider");
    return null;
  }

  return (
    <PageTransition>
      <div
        className="min-h-screen flex items-center justify-center relative overflow-hidden py-12 px-4"
        style={{ background: "linear-gradient(135deg, hsl(var(--background)) 0%, hsl(230 25% 10%) 50%, hsl(var(--background)) 100%)" }}
      >
        {/* Background glow */}
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.1) 0%, transparent 70%)", top: "-10%", right: "10%" }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-lg relative z-10"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{
                background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))",
                boxShadow: "0 4px 30px hsl(var(--primary) / 0.3)",
              }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
            >
              <Zap className="w-7 h-7 text-primary-foreground" />
            </motion.div>
            <h1 className="text-3xl font-bold font-display tracking-tight text-foreground">Set Up Your Profile</h1>
            <p className="text-muted-foreground mt-2">Tell us about your services to get started</p>
          </div>

          {/* Form Card */}
          <div
            className="rounded-2xl p-8 relative overflow-hidden"
            style={{
              background: "hsl(var(--glass) / 0.6)",
              backdropFilter: "blur(40px)",
              border: "1px solid hsl(var(--glass-border) / 0.3)",
              boxShadow: "0 20px 50px hsl(0 0% 0% / 0.3)",
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-px" style={{
              background: "linear-gradient(90deg, transparent 0%, hsl(var(--primary) / 0.4) 50%, transparent 100%)"
            }} />

            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* Service Category */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-primary" /> Service Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {serviceCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => update("service_category", cat)}
                      className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                        form.service_category === cat
                          ? "text-primary-foreground shadow-lg"
                          : "bg-secondary/50 border border-border/30 text-muted-foreground hover:text-foreground hover:bg-secondary"
                      }`}
                      style={
                        form.service_category === cat
                          ? { background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))", boxShadow: "0 4px 15px hsl(var(--primary) / 0.3)" }
                          : {}
                      }
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Service Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Service Title</label>
                <input
                  type="text"
                  required
                  value={form.service_name}
                  onChange={(e) => update("service_name", e.target.value)}
                  placeholder="e.g. Expert Electrician"
                  className="w-full h-12 px-4 rounded-xl bg-secondary/50 border border-border/30 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300 text-sm"
                />
              </div>

              {/* Price & Experience row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-primary" /> Base Price (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min={100}
                    value={form.base_price}
                    onChange={(e) => update("base_price", parseInt(e.target.value) || 0)}
                    className="w-full h-12 px-4 rounded-xl bg-secondary/50 border border-border/30 text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" /> Experience
                  </label>
                  <select
                    value={form.experience}
                    onChange={(e) => update("experience", e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-secondary/50 border border-border/30 text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300 text-sm appearance-none"
                  >
                    {experienceOptions.map((exp) => (
                      <option key={exp} value={exp}>{exp}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Service Area */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" /> Service Area
                </label>
                <input
                  type="text"
                  required
                  value={form.service_area}
                  onChange={(e) => update("service_area", e.target.value)}
                  placeholder="e.g. Mumbai, Delhi NCR"
                  className="w-full h-12 px-4 rounded-xl bg-secondary/50 border border-border/30 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300 text-sm"
                />
              </div>

              {/* Initials */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Display Initials (2 letters)</label>
                <input
                  type="text"
                  maxLength={2}
                  value={form.avatar_initials}
                  onChange={(e) => update("avatar_initials", e.target.value.toUpperCase())}
                  placeholder="RS"
                  className="w-full h-12 px-4 rounded-xl bg-secondary/50 border border-border/30 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300 text-sm uppercase"
                />
              </div>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={loading || !form.service_category || !form.service_name || !form.service_area}
                className="w-full h-12 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold text-primary-foreground mt-4 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                style={{
                  background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))",
                  boxShadow: "0 4px 20px hsl(var(--primary) / 0.3)",
                }}
                whileHover={{ scale: 1.02, boxShadow: "0 6px 30px hsl(var(--primary) / 0.5)" }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Setting up...</>
                ) : (
                  <>Complete Setup <ArrowRight className="w-4 h-4" /></>
                )}
              </motion.button>
            </form>
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
};

export default ProviderSetup;
