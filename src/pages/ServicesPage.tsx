import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Star, MapPin, Briefcase, SortAsc, Loader2 } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import BookingModal from "@/components/BookingModal";
import BookingSuccess from "@/components/BookingSuccess";
import PageTransition from "@/components/effects/PageTransition";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useRef, MouseEvent } from "react";

interface ProviderData {
  id: string;
  name: string;
  service: string;
  rating: number;
  jobs: number;
  price: number;
  distance: number;
  experience: string;
  avatar: string;
}

const sortOptions = ["Rating", "Price", "Distance"];

const ProviderCard = ({
  provider,
  index,
  onBook,
}: {
  provider: ProviderData;
  index: number;
  onBook: () => void;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [10, -10]), { stiffness: 150, damping: 20 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-10, 10]), { stiffness: 150, damping: 20 });
  const glow = useSpring(0, { stiffness: 200, damping: 25 });

  const handleMouseMove = (e: MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
    glow.set(1);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    glow.set(0);
  };

  const ratingGlow = provider.rating >= 4.8;

  return (
    <motion.div
      ref={ref}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 50, rotateX: 10 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="glass-card-hover rounded-2xl group shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out hover:ring-2 hover:ring-primary/30"
    >
      {/* Premium gradient header */}
      <div
        className="rounded-t-2xl px-6 py-4 relative overflow-hidden"
        style={{
          background: ratingGlow
            ? "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent) / 0.9))"
            : "linear-gradient(135deg, hsl(var(--primary) / 0.7), hsl(var(--accent) / 0.5))",
        }}
      >
        <div className="flex items-center justify-between relative z-10">
          <p className="text-primary-foreground font-medium text-sm">{provider.service}</p>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm">
            <Star className="w-3.5 h-3.5 fill-current text-yellow-300" />
            <span className="text-sm font-bold text-primary-foreground">{provider.rating}</span>
          </div>
        </div>
        {/* Shimmer */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
          style={{ background: "linear-gradient(90deg, transparent 30%, hsl(0 0% 100% / 0.08) 50%, transparent 70%)", backgroundSize: "200% 100%", animation: "gradient-shift 3s ease infinite" }}
        />
      </div>

      {/* Glow layer */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          opacity: glow,
          background: "radial-gradient(circle at 50% 30%, hsl(var(--primary) / 0.12), transparent 60%)",
        }}
      />

      <div className="relative z-10 p-6" style={{ transform: "translateZ(20px)" }}>
        <div className="flex items-start gap-4 mb-5">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-primary font-bold font-display text-lg shrink-0 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3"
            style={{
              background: "linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--accent) / 0.1))",
              boxShadow: "0 0 30px hsl(var(--primary) / 0.08)",
            }}
          >
            {provider.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold font-display text-lg tracking-tight">{provider.name}</h3>
            <p className="text-sm text-muted-foreground">{provider.experience} experience</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
          <span className="flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5" /> {provider.jobs} jobs
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" /> {provider.distance} km
          </span>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border/30">
          <p className="font-display font-bold text-xl">
            ₹{provider.price}<span className="text-sm font-normal text-muted-foreground">/visit</span>
          </p>
          <button
            className="glow-button !px-5 !py-2.5 text-sm transition-all duration-300 hover:scale-105 active:scale-95"
            onClick={onBook}
          >
            Book Now
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const ServicesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState("Rating");
  const [providers, setProviders] = useState<ProviderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<ProviderData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [successBooking, setSuccessBooking] = useState<{
    id: string; providerName: string; date: string; time: string; finalPrice: number;
  } | null>(null);

  useEffect(() => {
    const fetchProviders = async () => {
      const { data, error } = await supabase
        .from("providers")
        .select("*")
        .eq("is_active", true);

      if (!error && data) {
        // Fetch profile names separately
        const userIds = data.map((p) => p.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", userIds);

        const nameMap = new Map(profiles?.map((p) => [p.user_id, p.full_name]) || []);

        setProviders(
          data.map((p) => ({
            id: p.id,
            name: nameMap.get(p.user_id) || p.avatar_initials,
            service: p.service_name,
            rating: Number(p.rating),
            jobs: p.completed_jobs,
            price: p.base_price,
            distance: Math.round(Math.random() * 50 + 5) / 10,
            experience: p.experience,
            avatar: p.avatar_initials,
          }))
        );
      }
      setLoading(false);
    };
    fetchProviders();
  }, []);

  const sorted = [...providers].sort((a, b) => {
    if (sortBy === "Rating") return b.rating - a.rating;
    if (sortBy === "Price") return a.price - b.price;
    return a.distance - b.distance;
  });

  const handleBookNow = (provider: ProviderData) => {
    if (!user) {
      navigate(`/auth?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }
    setSelectedProvider(provider);
    setShowModal(true);
  };

  return (
    <PageTransition>
      <div className="min-h-screen relative">
        <Navbar />
        <div className="pt-28 section-padding">
          <div className="max-w-6xl mx-auto" style={{ perspective: "1200px" }}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <span className="text-xs font-semibold tracking-[0.3em] uppercase text-primary mb-4 block">Browse</span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display mb-2 leading-[0.95] tracking-tight">
                Service <span className="gradient-text">Providers</span>
              </h1>
              <div className="h-1 w-16 rounded-full mt-4 mb-6" style={{ background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))" }} />
              <p className="text-muted-foreground text-lg mb-12">
                Browse top-rated professionals near you
              </p>
            </motion.div>

            {/* Sort bar */}
            <motion.div
              className="flex items-center gap-3 mb-12 flex-wrap"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <SortAsc className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground mr-1">Sort by:</span>
              {sortOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setSortBy(opt)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-400 ${
                    sortBy === opt
                      ? "text-primary-foreground shadow-lg"
                      : "glass-card text-muted-foreground hover:text-foreground"
                  }`}
                  style={sortBy === opt ? {
                    background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))",
                    boxShadow: "0 4px 20px hsl(var(--primary) / 0.3)",
                  } : {}}
                >
                  {opt}
                </button>
              ))}
            </motion.div>

            {/* Provider cards */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : sorted.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <p className="text-lg">No providers available yet.</p>
                <p className="text-sm mt-2">Be the first to join as a provider!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sorted.map((provider, i) => (
                  <ProviderCard
                    key={provider.id}
                    provider={provider}
                    index={i}
                    onBook={() => handleBookNow(provider)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
        <Footer />

        {selectedProvider && (
          <BookingModal
            provider={selectedProvider}
            open={showModal}
            onClose={() => { setShowModal(false); setSelectedProvider(null); }}
            onSuccess={(booking) => {
              setShowModal(false);
              setSelectedProvider(null);
              setSuccessBooking(booking);
            }}
          />
        )}

        <AnimatePresence>
          {successBooking && (
            <BookingSuccess
              booking={successBooking}
              onClose={() => setSuccessBooking(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
};

export default ServicesPage;
