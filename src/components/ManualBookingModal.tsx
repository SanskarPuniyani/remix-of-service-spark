import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, UserPlus, Loader2, Calendar, Clock, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { LocationPicker } from "@/components/LocationPicker";

type Worker = {
  id: string;
  name: string;
  is_active: boolean;
  status: string;
};

interface ManualBookingModalProps {
  open: boolean;
  onClose: () => void;
  providerId: string;
  serviceName: string;
  serviceCategory: string;
  basePrice: number;
  workers: Worker[];
  onSuccess: () => void;
}

const ManualBookingModal = ({
  open,
  onClose,
  providerId,
  serviceName,
  serviceCategory,
  basePrice,
  workers,
  onSuccess,
}: ManualBookingModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [assignedWorker, setAssignedWorker] = useState("");
  const [price, setPrice] = useState(basePrice.toString());
  const [addressText, setAddressText] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const activeWorkers = workers.filter(w => w.status === "accepted" && w.is_active);

  const handleLocationSelect = (lat: number, lon: number, address?: string) => {
    setLatitude(lat);
    setLongitude(lon);
    if (address) setAddressText(address);
  };

  const handleSaveLocation = (lat: number, lon: number, address?: string) => {
    setLatitude(lat);
    setLongitude(lon);
    if (address) setAddressText(address);
    setShowMap(false);
    toast({ title: "Location saved" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !customerName.trim() || !customerPhone.trim() || !bookingDate || !bookingTime) return;

    setLoading(true);

    const finalPrice = parseInt(price) || basePrice;

    const insertData: any = {
      provider_id: providerId,
      user_id: user.id,
      service_name: serviceName,
      booking_date: bookingDate,
      booking_time: bookingTime,
      base_price: basePrice,
      final_price: finalPrice,
      urgency: "normal",
      status: assignedWorker ? "confirmed" : "pending",
      booking_type: "manual",
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim(),
      worker_id: assignedWorker || null,
    };

    if (addressText) insertData.customer_address_text = addressText;
    if (latitude) insertData.customer_latitude = latitude;
    if (longitude) insertData.customer_longitude = longitude;

    const { error } = await supabase.from("bookings").insert(insertData);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    // Set worker inactive if assigned
    if (assignedWorker) {
      await supabase.from("workers").update({ is_active: false }).eq("id", assignedWorker);
    }

    toast({ title: "Booking created successfully!" });
    setLoading(false);
    onSuccess();
    onClose();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-6"
          style={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold font-display">Assisted Booking</h2>
              <p className="text-xs text-muted-foreground mt-1">{serviceName} · {serviceCategory}</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Customer Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Customer Name *</label>
              <input
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter customer name"
                className="w-full h-11 px-4 rounded-xl bg-secondary/50 border border-border/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* Customer Phone */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Customer Phone *</label>
              <input
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+91 9876543210"
                className="w-full h-11 px-4 rounded-xl bg-secondary/50 border border-border/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Address</label>
              <div className="flex gap-2">
                <input
                  value={addressText}
                  onChange={(e) => setAddressText(e.target.value)}
                  placeholder="Customer address"
                  className="flex-1 h-11 px-4 rounded-xl bg-secondary/50 border border-border/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button
                  type="button"
                  onClick={() => setShowMap(!showMap)}
                  className="h-11 px-4 rounded-xl bg-primary/10 text-primary text-sm font-medium flex items-center gap-1.5 hover:bg-primary/20 transition-all"
                >
                  <MapPin className="w-4 h-4" />
                  {showMap ? "Hide Map" : "Pin on Map"}
                </button>
              </div>
              {latitude && longitude && (
                <p className="text-[10px] text-muted-foreground">📍 {latitude.toFixed(5)}, {longitude.toFixed(5)}</p>
              )}
            </div>

            {/* Map */}
            {showMap && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <LocationPicker
                  onLocationSelect={handleLocationSelect}
                  showSaveButton
                  onSave={handleSaveLocation}
                />
              </motion.div>
            )}

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date *</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="date"
                    required
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-secondary/50 border border-border/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Time *</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="time"
                    required
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-secondary/50 border border-border/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
            </div>

            {/* Price */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Price (₹)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full h-11 px-4 rounded-xl bg-secondary/50 border border-border/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* Assign Worker */}
            {activeWorkers.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assign Worker (Optional)</label>
                <select
                  value={assignedWorker}
                  onChange={(e) => setAssignedWorker(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-secondary/50 border border-border/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">No worker assigned</option>
                  {activeWorkers.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))",
                boxShadow: "0 4px 15px hsl(var(--primary) / 0.3)",
              }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Create Booking
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ManualBookingModal;
