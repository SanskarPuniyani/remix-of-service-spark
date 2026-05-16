import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Star, MapPin, Briefcase, SortAsc, Loader2, MessageSquare, X, Phone, Mail, Home, Search, ChevronDown } from "lucide-react";
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
  city: string;
  full_address?: string;
  phone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  workers?: Array<{
    id: string;
    name: string;
    rating: number;
    completed_jobs: number;
  }>;
  reviews?: Array<{
    id: string;
    rating: number;
    comment: string;
    worker_rating?: number;
    worker_comment?: string;
    created_at: string;
    full_name?: string;
    worker_name?: string;
  }>;
}

const sortOptions = ["Distance", "Rating", "Price"];

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
};

const deg2rad = (deg: number) => {
  return deg * (Math.PI / 180);
};

const ProviderProfileModal = ({ provider, onClose, open }: { provider: ProviderData; onClose: () => void; open: boolean }) => (
  <AnimatePresence>
    {open && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
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
          <div className="p-8">
            <div className="flex justify-between items-start mb-8">
              <div className="flex gap-5">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-primary font-bold font-display text-2xl" style={{ background: "linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--accent) / 0.1))" }}>
                  {provider.avatar}
                </div>
                <div>
                  <h3 className="text-2xl font-bold font-display">{provider.name}</h3>
                  <p className="text-primary font-medium">{provider.service}</p>
                  <div className="flex items-center gap-1 mt-1 text-yellow-500">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-sm font-bold">{provider.rating} ({provider.jobs} jobs)</span>
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Contact Information</h4>
                <div className="grid gap-3">
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-secondary/30 border border-border/50">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Phone className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase">Phone Number</p>
                      <a href={`tel:${provider.phone}`} className="text-sm font-semibold hover:text-primary transition-colors">{provider.phone}</a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-secondary/30 border border-border/50">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                      <Mail className="w-4 h-4 text-accent" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase">Email Address</p>
                      <a href={`mailto:${provider.email}`} className="text-sm font-semibold hover:text-accent transition-colors">{provider.email}</a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Location Details</h4>
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-secondary/30 border border-border/50">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Home className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">Full Address</p>
                    <p className="text-sm font-semibold leading-relaxed">{provider.full_address}</p>
                  </div>
                </div>
              </div>
            </div>

            <button onClick={onClose} className="w-full mt-8 glow-button !py-4 font-bold">
              Close Profile
            </button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const ProviderCard = ({
  provider,
  index,
  onBook,
  onViewProfile,
  isExpanded,
  onToggleReviews,
}: {
  provider: ProviderData;
  index: number;
  onBook: () => void;
  onViewProfile: () => void;
  isExpanded: boolean;
  onToggleReviews: () => void;
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
            <MapPin className="w-3.5 h-3.5" /> {provider.city} ({provider.distance} km)
          </span>
        </div>

        <div className="flex items-center justify-between gap-3 pt-2">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Starts from</span>
            <span className="text-xl font-bold text-foreground">₹{provider.price}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onViewProfile}
              className="px-4 py-2.5 rounded-xl bg-secondary/50 text-muted-foreground font-semibold text-xs hover:bg-secondary hover:text-foreground transition-all duration-300"
            >
              View Profile
            </button>
            <button
              onClick={onBook}
              className="glow-button px-6 py-2.5 text-xs"
            >
              Book Now
            </button>
          </div>
        </div>

        {provider.reviews && provider.reviews.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border/30">
            <button
              onClick={onToggleReviews}
              className="flex items-center gap-2 text-sm text-primary font-medium hover:underline transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              {isExpanded ? "Hide Reviews" : `View ${provider.reviews.length} Reviews`}
            </button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mt-4 space-y-4"
                >
                  {provider.reviews.map((review) => (
                    <div key={review.id} className="bg-muted/30 rounded-xl p-3 border border-border/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-foreground">
                          {review.full_name} 
                          {review.worker_name && (
                            <span className="text-[10px] text-primary ml-1 font-normal">
                              (Review for {review.worker_name})
                            </span>
                          )}
                        </span>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-2.5 h-2.5 ${
                                i < (review.worker_rating || review.rating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed italic">
                        "{review.worker_comment || review.comment || "No comment provided."}"
                      </p>
                      {review.worker_comment && review.comment && (
                        <p className="text-[10px] text-muted-foreground/60 mt-2 border-t border-border/10 pt-1">
                          Provider Feedback: {review.comment}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground/60 mt-2">
                        {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const ServicesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState("Distance");
  const [providers, setProviders] = useState<ProviderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<ProviderData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [successBooking, setSuccessBooking] = useState<{
    id: string; providerName: string; date: string; time: string; finalPrice: number;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedService, setSelectedService] = useState("all");
  const [serviceCategories, setServiceCategories] = useState<string[]>([]);

  useEffect(() => {
    const fetchProviders = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      // Get user's city from profile
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("city, latitude, longitude")
        .eq("user_id", user.id)
        .maybeSingle();

      // Also check for default address (takes priority for distance calc)
      const { data: defaultAddr } = await supabase
        .from("addresses")
        .select("latitude, longitude")
        .eq("user_id", user.id)
        .eq("is_default", true)
        .maybeSingle();

      const userLat = defaultAddr?.latitude ?? userProfile?.latitude;
      const userLon = defaultAddr?.longitude ?? userProfile?.longitude;
      const userCity = (userProfile?.city || "").trim().toLowerCase();

      const { data, error } = await supabase
        .from("providers")
        .select("*, reviews(*), workers(*)")
        .eq("is_active", true);

      if (!error && data) {
        // Fetch profile names and addresses for providers
        const userIds = data.map((p) => p.user_id);
        
        // Also get user ids for review authors
        const reviewUserIds = data.flatMap(p => p.reviews?.map((r: any) => r.user_id) || []);
        const allUserIds = [...new Set([...userIds, ...reviewUserIds])];

        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, email, phone, house_no, area, city, latitude, longitude")
          .in("user_id", allUserIds);

        const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

        const filteredProviders = data
          .map((p) => {
            const providerProfile = profileMap.get(p.user_id);
            const workerMap = new Map(p.workers?.map((w: any) => [w.id, w.name]) || []);
            
            // Calculate distance if coordinates are available
            let distance = Math.round(Math.random() * 50 + 5) / 10; // Fallback to mock
            const pLat = providerProfile?.latitude;
            const pLon = providerProfile?.longitude;
            
            const currentLat = userLat;
            const currentLon = userLon;

            if (currentLat && currentLon && pLat && pLon) {
              distance = calculateDistance(
                Number(currentLat),
                Number(currentLon),
                Number(pLat),
                Number(pLon)
              );
              distance = Math.round(distance * 10) / 10;
            }

            return {
              id: p.id,
              name: providerProfile?.full_name || p.avatar_initials,
              service: p.service_name,
              rating: Number(p.rating),
              jobs: p.completed_jobs,
              price: p.base_price,
              distance,
              experience: p.experience,
              avatar: p.avatar_initials,
              city: providerProfile?.city || "",
              full_address: providerProfile ? `${providerProfile.house_no}, ${providerProfile.area}, ${providerProfile.city}` : undefined,
              phone: providerProfile?.phone,
              email: providerProfile?.email,
              latitude: pLat,
              longitude: pLon,
              workers: p.workers || [],
              reviews: (p.reviews || []).map((r: any) => ({
                ...r,
                full_name: profileMap.get(r.user_id)?.full_name || "Anonymous User",
                worker_name: r.worker_id ? workerMap.get(r.worker_id) : undefined,
              })).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            };
          })
          .filter(p => p.city === userProfile.city);

        setProviders(filteredProviders);
        
        // Extract unique service categories
        const categories = [...new Set(filteredProviders.map(p => p.service))];
        setServiceCategories(categories);
      }
      setLoading(false);
    };
    fetchProviders();
  }, [user]);

  const sortedProviders = [...providers]
    .filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            p.service.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesService = selectedService === "all" || p.service === selectedService;
      return matchesSearch && matchesService;
    })
    .sort((a, b) => {
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

  const [expandedReviews, setExpandedReviews] = useState<string | null>(null);
  const [viewingProfile, setViewingProfile] = useState<ProviderData | null>(null);

  return (
    <PageTransition>
      <div className="min-h-screen relative">
        <Navbar />
        <div className="pt-28 section-padding">
          <div className="max-w-6xl mx-auto" style={{ perspective: "1200px" }}>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <span className="text-xs font-semibold tracking-[0.3em] uppercase text-primary mb-2 block">Local Experts</span>
                <h1 className="text-4xl sm:text-5xl font-bold font-display tracking-tight">
                  Available <span className="gradient-text">Providers</span>
                </h1>
                <p className="text-muted-foreground mt-2 max-w-md">
                  Showing top-rated professionals in your city.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto"
              >
                {/* Search Bar */}
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search providers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-secondary/50 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  />
                </div>

                {/* Service Filter */}
                <div className="relative w-full sm:w-48 group">
                  <select
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    className="w-full h-11 pl-4 pr-10 rounded-xl bg-secondary/50 border border-border/50 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer"
                  >
                    <option value="all">All Services</option>
                    {serviceCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>

                {/* Sort Dropdown */}
                <div className="relative w-full sm:w-40 group">
                  <button className="w-full h-11 px-4 rounded-xl bg-secondary/50 border border-border/50 text-sm font-medium flex items-center justify-between hover:bg-secondary/80 transition-all">
                    <span className="flex items-center gap-2">
                      <SortAsc className="w-4 h-4 text-primary" />
                      {sortBy}
                    </span>
                    <ChevronDown className="w-4 h-4 opacity-50" />
                  </button>
                  <div className="absolute right-0 mt-2 w-full bg-card border border-border/50 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                    {sortOptions.map((option) => (
                      <button
                        key={option}
                        onClick={() => setSortBy(option)}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                          sortBy === option ? "bg-primary/10 text-primary font-semibold" : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Provider cards */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : sortedProviders.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <p className="text-lg font-medium">No providers found</p>
                <p className="text-sm mt-2">Try adjusting your search or filters.</p>
              </div>
            ) : (
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: { staggerChildren: 0.1 }
                  }
                }}
              >
                {sortedProviders.map((p, i) => (
                  <ProviderCard
                    key={p.id}
                    provider={p}
                    index={i}
                    onBook={() => handleBookNow(p)}
                    onViewProfile={() => setViewingProfile(p)}
                    isExpanded={expandedReviews === p.id}
                    onToggleReviews={() => setExpandedReviews(expandedReviews === p.id ? null : p.id)}
                  />
                ))}
              </motion.div>
            )}
          </div>
        </div>
        <Footer />

        {viewingProfile && (
          <ProviderProfileModal
            provider={viewingProfile}
            open={!!viewingProfile}
            onClose={() => setViewingProfile(null)}
          />
        )}

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
