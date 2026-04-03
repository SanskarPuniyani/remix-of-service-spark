import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, Zap, LogOut, MapPin, User as UserIcon, Settings, Shield, Briefcase, Plus, Trash2, Check, LayoutDashboard, UserCircle, Phone, XCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LocationPicker } from "@/components/LocationPicker";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";

const navLinks = [
  { label: "Services", to: "/services" },
  { label: "How It Works", to: "/#features" },
];

interface Address {
  id: string;
  full_address: string;
  latitude: number;
  longitude: number;
  is_default: boolean;
  label: string;
}

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [hasProviderRecord, setHasProviderRecord] = useState(false);
  const [hasWorkerRecord, setHasWorkerRecord] = useState(false);
  const navigate = useNavigate();
  const { user, signOut, role, activeView, switchView, setDbRole } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (user) {
      fetchAddresses();
      fetchProfile();
      checkProfessionalRecords();
    } else {
      setAddresses([]);
      setProfile(null);
      setHasProviderRecord(false);
      setHasWorkerRecord(false);
    }
  }, [user, role]);

  const checkProfessionalRecords = async () => {
    if (!user) return;
    const [providerRes, workerRes] = await Promise.all([
      supabase.from("providers").select("id").eq("user_id", user.id).maybeSingle(),
      supabase.from("workers").select("id").eq("user_id", user.id).maybeSingle()
    ]);
    setHasProviderRecord(!!providerRes.data);
    setHasWorkerRecord(!!workerRes.data);
  };

  const handleSwitchView = (targetRole: string) => {
    switchView(targetRole);
    toast({ 
      title: `Switched to ${targetRole.charAt(0).toUpperCase() + targetRole.slice(1)} View`,
      description: `You are now viewing the app as a ${targetRole}.`
    });
    if (targetRole === "customer") navigate("/");
    else if (targetRole === "provider") navigate("/provider/dashboard");
    else if (targetRole === "worker") navigate("/worker/dashboard");
  };

  const handleRevokeRole = async (revokeRole: "provider" | "worker") => {
    if (!user) return;
    try {
      if (revokeRole === "provider") {
        const { data: providerRecords } = await supabase.from("providers").select("id").eq("user_id", user.id);
        if (providerRecords) {
          for (const p of providerRecords) {
            await supabase.from("workers").delete().eq("provider_id", p.id);
            await supabase.from("providers").delete().eq("id", p.id);
          }
        }
      } else {
        await supabase.from("workers").delete().eq("user_id", user.id);
      }
      await setDbRole("customer");
      setHasProviderRecord(false);
      setHasWorkerRecord(false);
      toast({ title: "Role Revoked", description: `You are now a customer. You can become a ${revokeRole} again anytime.` });
      navigate("/");
    } catch (error) {
      toast({ title: "Failed to revoke role", variant: "destructive" });
    }
  };

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if (data) {
      setProfile(data);
    } else {
      // Fallback to auth metadata if no profile row yet
      setProfile({
        full_name: user.user_metadata?.full_name || "",
        email: user.email || "",
        phone: "",
        city: "",
      });
    }
  };

  const fetchAddresses = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setAddresses(data);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleSetDefaultAddress = async (id: string) => {
    const { error } = await supabase.from("addresses").update({ is_default: true }).eq("id", id);
    if (!error) {
      fetchAddresses();
      toast({ title: "Default Address Updated" });
    }
  };

  const handleDeleteAddress = async (id: string) => {
    const { error } = await supabase.from("addresses").delete().eq("id", id);
    if (!error) {
      fetchAddresses();
      toast({ title: "Address Deleted" });
    }
  };

  const handleLocationSelect = async (lat: number, lon: number, address?: string) => {
    if (!user) {
      toast({ title: "Please sign in", description: "You need to be logged in to save addresses." });
      return;
    }
    const { error } = await supabase.from("addresses").insert({
      user_id: user.id,
      full_address: address || "Pinned Location",
      latitude: lat,
      longitude: lon,
      is_default: addresses.length === 0,
      label: "Home"
    });
    if (error) {
      toast({ title: "Failed to save address", description: error.message, variant: "destructive" });
    } else {
      fetchAddresses();
      toast({ title: "Address Saved" });
      setIsLocationModalOpen(false);
    }
  };

  const defaultAddress = addresses.find(a => a.is_default) || addresses[0];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className={`transition-all duration-700 ${scrolled ? "bg-background/80 backdrop-blur-md border-b border-border py-2" : "bg-transparent py-4"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 font-display font-bold text-xl group">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="tracking-tight">ServeNow</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link key={link.label} to={link.to} className="relative text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-300 py-1">
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button onClick={() => setIsLocationModalOpen(true)} className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border border-border hover:border-primary/50 transition-all group">
                      <MapPin className="w-4 h-4 text-primary group-hover:animate-bounce" />
                      <span className="text-xs font-medium max-w-[150px] truncate">{defaultAddress ? defaultAddress.full_address : "Set Location"}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent><p className="text-xs">Selected City: <span className="font-bold text-primary">{profile?.city || "Not Set"}</span></p></TooltipContent>
                </Tooltip>

                <div className="flex items-center gap-2">
                  {role !== "provider" && role !== "worker" && !hasProviderRecord && !hasWorkerRecord && (
                    <Link to="/provider-setup"><Button variant="outline" size="sm" className="rounded-full border-primary/20 hover:bg-primary/5 text-primary h-9">Become Provider</Button></Link>
                  )}
                  {role !== "worker" && role !== "provider" && !hasWorkerRecord && !hasProviderRecord && (
                    <Link to="/worker-setup"><Button variant="outline" size="sm" className="rounded-full border-accent/20 hover:bg-accent/5 text-accent h-9">Become Worker</Button></Link>
                  )}
                  {hasProviderRecord && activeView !== "provider" && (
                    <Button variant="outline" size="sm" onClick={() => handleSwitchView("provider")} className="rounded-full border-primary/20 hover:bg-primary/5 text-primary h-9 gap-2"><Zap className="w-3 h-3" /> Switch to Provider</Button>
                  )}
                  {hasWorkerRecord && activeView !== "worker" && (
                    <Button variant="outline" size="sm" onClick={() => handleSwitchView("worker")} className="rounded-full border-accent/20 hover:bg-accent/5 text-accent h-9 gap-2"><Zap className="w-3 h-3" /> Switch to Worker</Button>
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 p-1.5 rounded-full hover:bg-secondary/80 transition-all outline-none group">
                      <Avatar className="w-8 h-8 border-2 border-primary/20 group-hover:border-primary/50 transition-all">
                        <AvatarImage src={profile?.avatar_url} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{profile?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
                      </Avatar>
                      <div className="text-left hidden lg:block pr-2">
                        <p className="text-xs font-bold truncate max-w-[100px] leading-tight">{profile?.full_name || "User"}</p>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider leading-tight">{activeView}</p>
                      </div>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-72 p-2 rounded-2xl shadow-xl border-border">
                    <DropdownMenuLabel className="px-3 py-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10 border-2 border-primary/20">
                            <AvatarImage src={profile?.avatar_url} />
                            <AvatarFallback className="bg-primary/10 text-primary font-bold">{profile?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <p className="text-sm font-bold">{profile?.full_name || "User"}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[180px]">{user?.email}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-1.5 mt-2 bg-secondary/30 p-3 rounded-xl border border-border/50">
                          <div className="flex items-center gap-2 text-[11px]"><Phone className="w-3 h-3 text-primary" /><span className="text-muted-foreground font-medium">Phone:</span><span className="font-bold">{profile?.phone || "Not provided"}</span></div>
                          <div className="flex items-center gap-2 text-[11px]"><MapPin className="w-3 h-3 text-primary" /><span className="text-muted-foreground font-medium">City:</span><span className="font-bold">{profile?.city || "Not provided"}</span></div>
                          <div className="flex items-center gap-2 text-[11px]"><Shield className="w-3 h-3 text-primary" /><span className="text-muted-foreground font-medium">Role:</span><span className="font-bold uppercase text-primary">{role}</span>{activeView !== role && <span className="text-[9px] text-muted-foreground">(viewing as {activeView})</span>}</div>
                          {profile?.experience && <div className="flex items-center gap-2 text-[11px]"><Briefcase className="w-3 h-3 text-primary" /><span className="text-muted-foreground font-medium">Experience:</span><span className="font-bold">{profile.experience}</span></div>}
                          {profile?.hourly_rate && <div className="flex items-center gap-2 text-[11px]"><Plus className="w-3 h-3 text-primary" /><span className="text-muted-foreground font-medium">Rate:</span><span className="font-bold">₹{profile.hourly_rate}/hr</span></div>}
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="rounded-xl px-3 py-2.5 cursor-pointer"><Link to="/profile" className="flex items-center gap-3"><Settings className="w-4 h-4 text-primary" /><span className="font-medium">Edit Profile</span></Link></DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-xl px-3 py-2.5 cursor-pointer"><Link to="/my-bookings" className="flex items-center gap-3"><Shield className="w-4 h-4 text-primary" /><span className="font-medium">My Bookings</span></Link></DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground px-3 py-2">Switch Perspective</DropdownMenuLabel>
                    {role !== "customer" && <DropdownMenuItem onClick={() => handleSwitchView("customer")} className="rounded-xl px-3 py-2.5 cursor-pointer"><div className="flex items-center gap-3"><UserCircle className="w-4 h-4 text-primary" /><span className="font-medium">Switch to Customer View</span></div></DropdownMenuItem>}
                    {hasProviderRecord && role !== "provider" && <DropdownMenuItem onClick={() => handleSwitchView("provider")} className="rounded-xl px-3 py-2.5 cursor-pointer"><div className="flex items-center gap-3"><LayoutDashboard className="w-4 h-4 text-primary" /><span className="font-medium">Switch to Provider View</span></div></DropdownMenuItem>}
                    {hasWorkerRecord && role !== "worker" && <DropdownMenuItem onClick={() => handleSwitchView("worker")} className="rounded-xl px-3 py-2.5 cursor-pointer"><div className="flex items-center gap-3"><LayoutDashboard className="w-4 h-4 text-accent" /><span className="font-medium">Switch to Worker View</span></div></DropdownMenuItem>}
                    {role === "provider" && <DropdownMenuItem asChild className="rounded-xl px-3 py-2.5 cursor-pointer bg-primary/5"><Link to="/provider/dashboard" className="flex items-center gap-3"><Zap className="w-4 h-4 text-primary" /><span className="font-medium">Provider Dashboard</span></Link></DropdownMenuItem>}
                    {role === "worker" && <DropdownMenuItem asChild className="rounded-xl px-3 py-2.5 cursor-pointer bg-accent/5"><Link to="/worker/dashboard" className="flex items-center gap-3"><Zap className="w-4 h-4 text-accent" /><span className="font-medium">Worker Dashboard</span></Link></DropdownMenuItem>}
                    {hasProviderRecord && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleRevokeRole("provider")} className="rounded-xl px-3 py-2.5 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/5"><div className="flex items-center gap-3"><XCircle className="w-4 h-4" /><span className="font-medium">Revoke Provider Role</span></div></DropdownMenuItem>
                      </>
                    )}
                    {hasWorkerRecord && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleRevokeRole("worker")} className="rounded-xl px-3 py-2.5 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/5"><div className="flex items-center gap-3"><XCircle className="w-4 h-4" /><span className="font-medium">Revoke Worker Role</span></div></DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="rounded-xl px-3 py-2.5 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/5"><div className="flex items-center gap-3"><LogOut className="w-4 h-4" /><span className="font-medium">Sign Out</span></div></DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/auth" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-4 py-2">Log In</Link>
                <Link to="/auth?mode=signup"><Button className="rounded-full px-6 shadow-lg shadow-primary/20 font-semibold">Sign Up Free</Button></Link>
              </div>
            )}
          </div>

          <button className="md:hidden text-foreground p-2 rounded-lg hover:bg-secondary/50 transition-colors" onClick={() => setOpen(!open)}>{open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}</button>
        </div>
      </div>

      {open && (
        <div className="md:hidden bg-background border-b border-border animate-in slide-in-from-top duration-300">
          <div className="px-4 pb-6 pt-2 space-y-2">
            {user && (
              <div className="p-4 bg-secondary/30 rounded-2xl mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="w-10 h-10 border border-primary/20">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback>{profile?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-bold">{profile?.full_name || "User"}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{role}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Link to="/profile" onClick={() => setOpen(false)} className="text-[11px] font-bold text-center py-2 bg-background rounded-lg border border-border">EDIT PROFILE</Link>
                  <Link to="/my-bookings" onClick={() => setOpen(false)} className="text-[11px] font-bold text-center py-2 bg-background rounded-lg border border-border">BOOKINGS</Link>
                </div>
                <div className="mt-3 space-y-2">
                  {role !== "customer" && <Button variant="ghost" onClick={() => { handleSwitchView("customer"); setOpen(false); }} className="w-full justify-start gap-3 rounded-xl h-11 bg-primary/5 text-primary hover:bg-primary/10"><UserCircle className="w-4 h-4" /><span className="text-xs font-bold">SWITCH TO CUSTOMER VIEW</span></Button>}
                  {hasProviderRecord && role !== "provider" && <Button variant="ghost" onClick={() => { handleSwitchView("provider"); setOpen(false); }} className="w-full justify-start gap-3 rounded-xl h-11 bg-primary/5 text-primary hover:bg-primary/10"><LayoutDashboard className="w-4 h-4" /><span className="text-xs font-bold">SWITCH TO PROVIDER VIEW</span></Button>}
                  {hasWorkerRecord && role !== "worker" && <Button variant="ghost" onClick={() => { handleSwitchView("worker"); setOpen(false); }} className="w-full justify-start gap-3 rounded-xl h-11 bg-accent/5 text-accent hover:bg-accent/10"><LayoutDashboard className="w-4 h-4" /><span className="text-xs font-bold">SWITCH TO WORKER VIEW</span></Button>}
                </div>
                {role === "customer" && !hasProviderRecord && !hasWorkerRecord && (
                  <div className="mt-3 flex flex-col gap-2">
                    <Link to="/provider-setup" onClick={() => setOpen(false)} className="w-full"><Button variant="outline" size="sm" className="w-full rounded-xl border-primary/20 text-primary h-10">Become Provider</Button></Link>
                    <Link to="/worker-setup" onClick={() => setOpen(false)} className="w-full"><Button variant="outline" size="sm" className="w-full rounded-xl border-accent/20 text-accent h-10">Become Worker</Button></Link>
                  </div>
                )}
                {(hasProviderRecord || hasWorkerRecord) && (
                  <div className="mt-3 space-y-2">
                    {hasProviderRecord && <Button variant="ghost" onClick={() => { handleRevokeRole("provider"); setOpen(false); }} className="w-full justify-start gap-3 rounded-xl h-11 text-destructive hover:bg-destructive/5"><XCircle className="w-4 h-4" /><span className="text-xs font-bold">REVOKE PROVIDER ROLE</span></Button>}
                    {hasWorkerRecord && <Button variant="ghost" onClick={() => { handleRevokeRole("worker"); setOpen(false); }} className="w-full justify-start gap-3 rounded-xl h-11 text-destructive hover:bg-destructive/5"><XCircle className="w-4 h-4" /><span className="text-xs font-bold">REVOKE WORKER ROLE</span></Button>}
                  </div>
                )}
              </div>
            )}
            {navLinks.map((link) => (
              <Link key={link.label} to={link.to} className="block py-3 px-4 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/30 rounded-xl transition-all" onClick={() => setOpen(false)}>{link.label}</Link>
            ))}
            <div className="pt-4 flex flex-col gap-2">
              {user ? (
                <Button variant="outline" onClick={() => { handleSignOut(); setOpen(false); }} className="w-full rounded-xl border-destructive/20 text-destructive hover:bg-destructive/5">Sign Out</Button>
              ) : (
                <>
                  <Link to="/auth" onClick={() => setOpen(false)}><Button variant="outline" className="w-full rounded-xl">Log In</Button></Link>
                  <Link to="/auth?mode=signup" onClick={() => setOpen(false)}><Button className="w-full rounded-xl">Sign Up Free</Button></Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <Dialog open={isLocationModalOpen} onOpenChange={setIsLocationModalOpen}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-2xl font-bold font-display">Manage <span className="gradient-text">Location</span></DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="saved" className="w-full">
            <TabsList className="mx-6 mt-4 w-[calc(100%-48px)] bg-secondary/50 p-1 rounded-xl">
              <TabsTrigger value="saved" className="flex-1 rounded-lg">Saved Addresses</TabsTrigger>
              <TabsTrigger value="map" className="flex-1 rounded-lg">Pin on Map</TabsTrigger>
            </TabsList>
            <TabsContent value="saved" className="p-6 focus-visible:ring-0">
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {addresses.length === 0 ? (
                  <div className="text-center py-12 bg-secondary/20 rounded-2xl border border-dashed border-border">
                    <MapPin className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No saved addresses yet.</p>
                  </div>
                ) : (
                  addresses.map((addr) => (
                    <div key={addr.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${addr.is_default ? 'bg-primary/5 border-primary/20 shadow-sm' : 'bg-secondary/20 border-border hover:border-primary/30'}`}>
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <MapPin className={`w-5 h-5 mt-0.5 ${addr.is_default ? 'text-primary' : 'text-muted-foreground'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{addr.full_address}</p>
                          {addr.is_default && <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Default Address</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-4">
                        {!addr.is_default && <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:text-primary" onClick={() => handleSetDefaultAddress(addr.id)}><Check className="w-4 h-4" /></Button>}
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:text-destructive" onClick={() => handleDeleteAddress(addr.id)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
            <TabsContent value="map" className="p-6 focus-visible:ring-0">
              <LocationPicker 
                initialLat={profile?.latitude} 
                initialLon={profile?.longitude} 
                fallbackCity={profile?.city} 
                onLocationSelect={(lat, lon, address) => {
                  // Just updates the pin position, doesn't save yet
                }}
                showSaveButton={true}
                onSave={handleLocationSelect}
              />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </nav>
  );
};

export default Navbar;
