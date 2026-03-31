import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Phone, Home, Building, MapPin, Loader2, Save, ArrowLeft, Mail, Shield, Briefcase, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { LocationPicker } from "@/components/LocationPicker";
import PageTransition from "@/components/effects/PageTransition";
import Navbar from "@/components/landing/Navbar";

interface Profile {
  full_name: string;
  email: string;
  phone: string;
  house_no: string;
  area: string;
  city: string;
  role: string;
  service_category?: string;
  latitude?: number;
  longitude?: number;
  experience?: string;
  hourly_rate?: number;
}

const EditProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [form, setForm] = useState<Profile>({
    full_name: "",
    email: "",
    phone: "",
    house_no: "",
    area: "",
    city: "",
    role: "customer"
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    if (user) {
      const fetchProfile = async () => {
        setFetching(true);
        const { data, error } = await supabase
          .from("profiles")
          .select("full_name, email, phone, house_no, area, city, role, service_category, latitude, longitude, experience, hourly_rate")
          .eq("user_id", user.id)
          .single();
        
        if (data) {
          setForm({
            full_name: data.full_name || user?.user_metadata?.full_name || "",
            email: data.email || user?.email || "",
            phone: data.phone || "",
            house_no: data.house_no || "",
            area: data.area || "",
            city: data.city || "",
            role: data.role || "customer",
            service_category: data.service_category,
            latitude: data.latitude,
            longitude: data.longitude,
            experience: data.experience || "",
            hourly_rate: data.hourly_rate || 0
          });
        } else {
          // No profile row yet — use auth metadata
          setForm(prev => ({
            ...prev,
            full_name: user?.user_metadata?.full_name || "",
            email: user?.email || "",
          }));
        }
        setFetching(false);
      };
      fetchProfile();
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    let lat = form.latitude;
    let lon = form.longitude;

    // Geocode if coordinates are still missing but address is present
    if (!lat || !lon) {
      try {
        const query = `${form.house_no}, ${form.area}, ${form.city}`;
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
        const data = await response.json();
        if (data && data[0]) {
          lat = parseFloat(data[0].lat);
          lon = parseFloat(data[0].lon);
        }
      } catch (err) {
        console.error("Geocoding failed:", err);
      }
    }

    const { error } = await supabase
      .from("profiles")
      .upsert({
        user_id: user.id,
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        house_no: form.house_no,
        area: form.area,
        city: form.city,
        role: form.role,
        latitude: lat,
        longitude: lon,
        experience: form.experience,
        hourly_rate: form.hourly_rate
      }, { onConflict: "user_id" });

    setLoading(false);
    if (error) {
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile Updated", description: "Your changes have been saved successfully." });
      navigate(-1); // Go back to previous page
    }
  };

  if (authLoading || fetching) {
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
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <button 
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-4 group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back
              </button>
              <h1 className="text-3xl font-bold font-display tracking-tight">
                Edit <span className="gradient-text">Profile</span>
              </h1>
              <p className="text-muted-foreground mt-2">Manage your personal information and service location.</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-xl">
            <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-8">
                  {/* Account Info Section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                      <Shield className="w-4 h-4" /> Account Information
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                          <Mail className="w-3 h-3" /> Registered Email
                        </label>
                        <div className="w-full h-12 px-4 rounded-xl bg-secondary/20 border border-border/50 flex items-center text-sm text-muted-foreground">
                          {form.email}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                            <Shield className="w-3 h-3" /> Account Role
                          </label>
                          <div className="w-full h-12 px-4 rounded-xl bg-secondary/20 border border-border/50 flex items-center text-sm font-bold uppercase tracking-wider text-primary">
                            {form.role}
                          </div>
                        </div>
                        {form.service_category && (
                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                              <Briefcase className="w-3 h-3" /> Category
                            </label>
                            <div className="w-full h-12 px-4 rounded-xl bg-secondary/20 border border-border/50 flex items-center text-sm font-semibold text-foreground">
                              {form.service_category}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Personal Details Section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                      <User className="w-4 h-4" /> Personal Details
                    </h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold flex items-center gap-2">
                          Full Name
                        </label>
                        <div className="w-full h-12 px-4 rounded-xl bg-secondary/20 border border-border/50 flex items-center text-sm text-muted-foreground">
                          {form.full_name}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-semibold flex items-center gap-2">
                          Phone Number
                        </label>
                        <input
                          required
                          type="tel"
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          placeholder="Enter your phone number"
                          className="w-full h-12 px-4 rounded-xl bg-secondary/30 border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        />
                      </div>

                      {/* Professional Info (If applicable) */}
                      {(form.role === "provider" || form.role === "worker") && (
                        <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-500">
                          <div className="space-y-2">
                            <label className="text-sm font-semibold flex items-center gap-2">
                              <Briefcase className="w-4 h-4 text-primary" /> Experience
                            </label>
                            <select
                              value={form.experience}
                              onChange={(e) => setForm({ ...form, experience: e.target.value })}
                              className="w-full h-12 px-4 rounded-xl bg-secondary/30 border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none"
                            >
                              <option value="< 1 year">&lt; 1 year</option>
                              <option value="1-3 years">1-3 years</option>
                              <option value="3-5 years">3-5 years</option>
                              <option value="5-10 years">5-10 years</option>
                              <option value="10+ years">10+ years</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-semibold flex items-center gap-2">
                              <Plus className="w-4 h-4 text-primary" /> Hourly Rate (₹)
                            </label>
                            <input
                              type="number"
                              value={form.hourly_rate}
                              onChange={(e) => setForm({ ...form, hourly_rate: parseInt(e.target.value) })}
                              className="w-full h-12 px-4 rounded-xl bg-secondary/30 border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Address Section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                      <Home className="w-4 h-4" /> Service Address
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-semibold">House No.</label>
                          <input
                            required
                            value={form.house_no}
                            onChange={(e) => setForm({ ...form, house_no: e.target.value })}
                            placeholder="No."
                            className="w-full h-12 px-4 rounded-xl bg-secondary/30 border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-semibold">Area</label>
                          <input
                            required
                            value={form.area}
                            onChange={(e) => setForm({ ...form, area: e.target.value })}
                            placeholder="Area/Street"
                            className="w-full h-12 px-4 rounded-xl bg-secondary/30 border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold">City</label>
                        <input
                          required
                          value={form.city}
                          onChange={(e) => setForm({ ...form, city: e.target.value })}
                          placeholder="Enter your city"
                          className="w-full h-12 px-4 rounded-xl bg-secondary/30 border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Location Section */}
                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> Precise Map Location
                  </h3>
                  <div className="bg-secondary/10 rounded-3xl p-2 border border-border/50">
                    <LocationPicker 
                      initialLat={form.latitude}
                      initialLon={form.longitude}
                      fallbackCity={form.city}
                      onLocationSelect={(lat, lon) => {
                        setForm(prev => ({ ...prev, latitude: lat, longitude: lon }));
                      }}
                    />
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                    <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                      Please ensure the map pin is placed exactly on your building. This helps providers find your location more accurately and ensures faster service.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-8 border-t border-border/50">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="flex-1 h-12 rounded-xl border border-border font-semibold hover:bg-secondary transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] h-12 rounded-xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Update Profile Information
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default EditProfile;
