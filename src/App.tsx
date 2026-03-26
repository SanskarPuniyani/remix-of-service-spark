import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import ServicesPage from "./pages/ServicesPage";
import MyBookings from "./pages/MyBookings";
import EditProfile from "./pages/EditProfile";
import ProviderDashboard from "./pages/ProviderDashboard";
import ProviderSetup from "./pages/ProviderSetup";
import WorkerDashboard from "./pages/WorkerDashboard";
import WorkerSetup from "./pages/WorkerSetup";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/profile" element={<EditProfile />} />
            <Route path="/provider/dashboard" element={<ProviderDashboard />} />
            <Route path="/provider-setup" element={<ProviderSetup />} />
            <Route path="/worker/dashboard" element={<WorkerDashboard />} />
            <Route path="/worker-setup" element={<WorkerSetup />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
