import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "@/contexts/AuthContext";
import MeshBackground from "@/components/effects/MeshBackground";
import FloatingParticles from "@/components/effects/FloatingParticles";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import ServicesPage from "./pages/ServicesPage";
import ProviderSetup from "./pages/ProviderSetup";
import ProviderDashboard from "./pages/ProviderDashboard";
import MyBookings from "./pages/MyBookings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/provider/setup" element={<ProviderSetup />} />
        <Route path="/provider/dashboard" element={<ProviderDashboard />} />
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <div className="noise-overlay">
            <MeshBackground />
            <FloatingParticles />
            <AnimatedRoutes />
          </div>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
