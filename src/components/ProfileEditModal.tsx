import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Phone, Home, Building, MapPin, Loader2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LocationPicker } from "./LocationPicker";

interface Profile {
  full_name: string;
  phone: string;
  house_no: string;
  area: string;
  city: string;
  latitude?: number;
  longitude?: number;
}

export const ProfileEditModal = ({ 
  userId, 
  open, 
  onClose, 
  onSuccess 
}: { 
  userId: string; 
  open: boolean; 
  onClose: () => void; 
  onSuccess: () => void;
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [form, setForm] = useState<Profile>({
    full_name: "",
    phone: "",
    house_no: "",
    area: "",
    city: ""
  });

  useEffect(() => {
    if (open && userId) {
      const fetchProfile = async () => {
        setFetching(true);
        const { data, error } = await supabase
          .from("profiles")
          .select("full_name, phone, house_no, area, city, latitude, longitude")
          .eq("user_id", userId)
          .maybeSingle();
        
        if (data) {
          setForm({
            full_name: data.full_name || "",
            phone: data.phone || "",
            house_no: data.house_no || "",
            area: data.area || "",
            city: data.city || "",
            latitude: data.latitude,
            longitude: data.longitude
          });
        }
        setFetching(false);
      };
      fetchProfile();
    }
  }, [open, userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      .update({
        full_name: form.full_name,
        phone: form.phone,
        house_no: form.house_no,
        area: form.area,
        city: form.city,
        latitude: lat,
        longitude: lon
      })
      .eq("user_id", userId);

    setLoading(false);
    if (error) {
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile Updated", description: "Your changes have been saved successfully." });
      onSuccess();
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-card border border-border shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border/50 px-8 py-5">
              <h3 className="font-display text-xl font-bold">Edit Profile</h3>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary transition-colors">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            {fetching ? (
              <div className="p-20 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-8 space-y-5">
                <div className="space-y-4">
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      required
                      value={form.full_name}
                      onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                      placeholder="Full Name"
                      className="w-full h-12 pl-11 pr-4 rounded-xl bg-secondary/50 border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      required
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="Phone Number"
                      className="w-full h-12 pl-11 pr-4 rounded-xl bg-secondary/50 border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <Home className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        required
                        value={form.house_no}
                        onChange={(e) => setForm({ ...form, house_no: e.target.value })}
                        placeholder="House No."
                        className="w-full h-12 pl-11 pr-4 rounded-xl bg-secondary/50 border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      />
                    </div>
                    <div className="relative">
                      <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        required
                        value={form.area}
                        onChange={(e) => setForm({ ...form, area: e.target.value })}
                        placeholder="Area"
                        className="w-full h-12 pl-11 pr-4 rounded-xl bg-secondary/50 border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      required
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      placeholder="City"
                      className="w-full h-12 pl-11 pr-4 rounded-xl bg-secondary/50 border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                  
                  {/* Pinpoint Location Map */}
                  <div className="space-y-3 pt-2">
                    <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" /> Pinpoint Exact Location
                    </label>
                    <LocationPicker 
                      initialLat={form.latitude}
                      initialLon={form.longitude}
                      fallbackCity={form.city}
                      onLocationSelect={(lat, lon) => {
                        setForm(prev => ({ ...prev, latitude: lat, longitude: lon }));
                      }}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 h-12 rounded-xl border border-border font-semibold hover:bg-secondary transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-[2] h-12 rounded-xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Save Changes
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
