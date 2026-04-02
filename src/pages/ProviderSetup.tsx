import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, Briefcase, MapPin, DollarSign, Clock, ArrowRight, Loader2, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import PageTransition from "@/components/effects/PageTransition";
import { LocationPicker } from "@/components/LocationPicker";

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

const ProviderSetup = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, role } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    selected_categories: [] as string[],
    service_name: "",
    base_price: 500,
    experience: "1-3 years",
    service_area: "",
    avatar_initials: "",
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
  });

  const update = (key: string, value: string | number | undefined) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    // Check if user is already a worker
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profile?.role === "worker") {
      toast({ title: "Operation Failed", description: "You are already a worker. Workers cannot become providers.", variant: "destructive" });
      setLoading(false);
      return;
    }
    const initials = form.avatar_initials || form.service_name.slice(0, 2).toUpperCase();

    let lat = form.latitude;
    let lon = form.longitude;

    // Geocode if address is provided and coordinates are still missing
    if (form.service_area && (!lat || !lon)) {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(form.service_area)}&limit=1`);
        const data = await response.json();
        if (data && data[0]) {
          lat = parseFloat(data[0].lat);
          lon = parseFloat(data[0].lon);
        }
      } catch (err) {
        console.error("Geocoding failed:", err);
      }
    }

    // Create a provider entry for each selected category
    const insertPromises = form.selected_categories.map((category) =>
      supabase.from("providers").insert({
        user_id: user.id,
        service_category: category,
        service_name: form.service_name,
        base_price: form.base_price,
        experience: form.experience,
        service_area: form.service_area,
        avatar_initials: initials,
      })
    );

    const results = await Promise.all(insertPromises);
    const providerError = results.find(r => r.error)?.error;

    if (!providerError) {
      // Ensure profile role is updated to provider and coordinates are saved
      await supabase
        .from("profiles")
        .update({ 
          role: "provider",
          latitude: lat,
          longitude: lon
        })
        .eq("user_id", user.id);
    }

    setLoading(false);
    if (providerError) {
      toast({ title: "Setup Failed", description: providerError.message, variant: "destructive" });
    } else {
      toast({ title: "Service added!", description: "Your new service is now live!" });
      navigate("/provider/dashboard");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate("/auth?mode=provider");
    return null;
  }

  if (role === "worker") {
    toast({ 
      title: "Access Denied", 
      description: "Workers cannot register as providers. Please use your worker dashboard.",
      variant: "destructive"
    });
    navigate("/worker/dashboard");
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
            <h1 className="text-3xl font-bold font-display tracking-tight text-foreground">Service Setup</h1>
            <p className="text-muted-foreground mt-2">Add or update your service offerings</p>
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
                  <Briefcase className="w-4 h-4 text-primary" /> Service Categories
                  <span className="text-xs text-muted-foreground">(select one or more)</span>
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-3 rounded-xl bg-secondary/30 border border-border/30">
                  {serviceCategories.map((cat) => {
                    const isSelected = form.selected_categories.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setForm(prev => ({
                            ...prev,
                            selected_categories: isSelected
                              ? prev.selected_categories.filter(c => c !== cat)
                              : [...prev.selected_categories, cat]
                          }));
                        }}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all text-left ${
                          isSelected
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
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
                  <MapPin className="w-4 h-4 text-primary" /> Service Area (City)
                </label>
                <input
                  type="text"
                  required
                  value={form.service_area}
                  onChange={(e) => update("service_area", e.target.value)}
                  placeholder="e.g. Mumbai"
                  className="w-full h-12 px-4 rounded-xl bg-secondary/50 border border-border/30 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300 text-sm"
                />
              </div>

              {/* Pinpoint Location Map */}
              <div className="space-y-3 pt-2">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" /> Pinpoint Exact Business Location
                </label>
                <LocationPicker 
                  initialLat={form.latitude}
                  initialLon={form.longitude}
                  onLocationSelect={(lat, lon) => {
                    update("latitude", lat);
                    update("longitude", lon);
                  }}
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
                  <>Add Service <ArrowRight className="w-4 h-4" /></>
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
