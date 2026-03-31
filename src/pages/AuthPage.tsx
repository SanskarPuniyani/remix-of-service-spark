import { useState, useMemo } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Mail, Lock, User, ArrowRight, Eye, EyeOff, Loader2, Check, Phone, Briefcase, MapPin, Home, Building } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PageTransition from "@/components/effects/PageTransition";

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

/* ── Floating Label Input ── */
const FloatingInput = ({
  icon: Icon,
  label,
  type = "text",
  value,
  onChange,
  required,
  minLength,
  showToggle,
  onToggle,
  toggleState,
}: {
  icon: React.ElementType;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  minLength?: number;
  showToggle?: boolean;
  onToggle?: () => void;
  toggleState?: boolean;
}) => {
  const [focused, setFocused] = useState(false);
  const active = focused || value.length > 0;

  return (
    <div className="relative group">
      <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-purple-400 transition-colors duration-300 z-10" />
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        minLength={minLength}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="peer w-full h-14 pl-11 pr-12 pt-4 pb-1 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-transparent focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 focus:bg-white/[0.06] transition-all duration-300 text-sm"
      />
      <label
        className={`absolute left-11 transition-all duration-300 pointer-events-none ${
          active
            ? "top-2 text-[10px] font-medium text-purple-400/80"
            : "top-1/2 -translate-y-1/2 text-sm text-white/30"
        }`}
      >
        {label}
      </label>
      {showToggle && (
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors z-10"
        >
          {toggleState ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
};

/* ── Password Strength ── */
const PasswordStrength = ({ password }: { password: string }) => {
  const strength = useMemo(() => {
    let s = 0;
    if (password.length >= 6) s++;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  }, [password]);

  const labels = ["", "Weak", "Fair", "Good", "Strong", "Excellent"];
  const colors = ["#ef4444", "#ef4444", "#f59e0b", "#f59e0b", "#22c55e", "#22c55e"];

  if (!password) return null;

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <motion.div
            key={i}
            className="h-1 flex-1 rounded-full"
            style={{ background: i <= strength ? colors[strength] : "rgba(255,255,255,0.06)" }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
          />
        ))}
      </div>
      <p className="text-[11px] text-white/40">{labels[strength]}</p>
    </div>
  );
};

/* ── Main Component ── */
const AuthPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(searchParams.get("mode") !== "signup");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const role = "customer";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [houseNo, setHouseNo] = useState("");
  const [area, setArea] = useState("");
  const [city, setCity] = useState("");
  const [serviceCategory, setServiceCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const redirectTo = searchParams.get("redirect") || "/services";
  const passwordsMatch = isLogin || password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLogin && !passwordsMatch) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    setLoading(true);

    if (isLogin) {
      const { error, data } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) {
        toast({ title: "Login Failed", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Welcome back!" });
        // Check profile role for redirect
        const { data: profileData } = await supabase
          .from("profiles")
          .select("role")
          .eq("user_id", data.user.id)
          .single();
        const userRole = profileData?.role;
        if (userRole === "provider") {
          navigate("/provider/dashboard");
        } else if (userRole === "worker") {
          navigate("/worker/dashboard");
        } else {
          navigate(redirectTo);
        }
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { 
            full_name: fullName, 
            role: "customer"
          },
          emailRedirectTo: window.location.origin,
        },
      });
      setLoading(false);
      if (error) {
        toast({ title: "Signup Failed", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Account created!", description: "You are now signed in." });
        navigate(redirectTo);
      }
    }
  };

  const formVariants = {
    hidden: { opacity: 0, y: 20, filter: "blur(6px)" },
    visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
    exit: { opacity: 0, y: -20, filter: "blur(6px)", transition: { duration: 0.3 } },
  };

  return (
    <PageTransition>
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0a0a1a 0%, #0f0f2e 30%, #0a0a1a 60%, #0d0d24 100%)" }}>

        {/* Animated background orbs */}
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)", top: "-10%", right: "-5%" }}
          animate={{ scale: [1, 1.2, 1], x: [0, -30, 0], y: [0, 20, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)", bottom: "-15%", left: "-10%" }}
          animate={{ scale: [1.1, 1, 1.1], x: [0, 40, 0], y: [0, -30, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        />
        <motion.div
          className="absolute w-[300px] h-[300px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 70%)", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 6 }}
        />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "60px 60px"
        }} />

        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md mx-6 relative z-10"
        >
          {/* Logo */}
          <motion.div
            className="flex items-center justify-center gap-2.5 mb-8"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
                background: "linear-gradient(135deg, #8b5cf6, #3b82f6)",
                boxShadow: "0 4px 20px rgba(139,92,246,0.4)"
              }}>
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                ServeNow
              </span>
            </Link>
          </motion.div>

          {/* Glass Card */}
          <motion.div
            className="rounded-2xl p-8 relative overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.03)",
              backdropFilter: "blur(40px) saturate(1.3)",
              border: "1px solid rgba(255,255,255,0.06)",
              boxShadow: "0 25px 60px rgba(0,0,0,0.5), 0 0 80px rgba(139,92,246,0.06), inset 0 1px 0 rgba(255,255,255,0.04)",
            }}
            whileHover={{ y: -2, transition: { duration: 0.3 } }}
          >
            {/* Top shimmer line */}
            <div className="absolute top-0 left-0 right-0 h-px" style={{
              background: "linear-gradient(90deg, transparent 0%, rgba(139,92,246,0.4) 30%, rgba(59,130,246,0.3) 70%, transparent 100%)"
            }} />

            <AnimatePresence mode="wait">
              <motion.div
                key={isLogin ? "login" : "signup"}
                variants={formVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <h1 className="text-3xl font-bold text-white mb-1.5 tracking-tight text-center" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {isLogin ? "Welcome Back" : "Create Account"}
                </h1>
                <p className="text-white/40 text-sm mb-8 text-center">
                  {isLogin ? "Enter your credentials to continue" : "Fill in your details to get started"}
                </p>

                {/* All users sign up as customers */}

                <form className="space-y-4" onSubmit={handleSubmit}>
                  {!isLogin && (
                    <FloatingInput icon={User} label="Full Name" value={fullName} onChange={setFullName} required />
                  )}

                  <FloatingInput icon={Mail} label="Email address" type="email" value={email} onChange={setEmail} required />

                  <div className="space-y-1.5">
                    <FloatingInput
                      icon={Lock}
                      label="Password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={setPassword}
                      required
                      minLength={6}
                      showToggle
                      onToggle={() => setShowPassword(!showPassword)}
                      toggleState={showPassword}
                    />
                    {!isLogin && <PasswordStrength password={password} />}
                  </div>

                  {!isLogin && (
                    <div className="space-y-1.5">
                      <FloatingInput
                        icon={Lock}
                        label="Confirm Password"
                        type={showConfirm ? "text" : "password"}
                        value={confirmPassword}
                        onChange={setConfirmPassword}
                        required
                        minLength={6}
                        showToggle
                        onToggle={() => setShowConfirm(!showConfirm)}
                        toggleState={showConfirm}
                      />
                      {confirmPassword && !passwordsMatch && (
                        <motion.p className="text-[11px] text-red-400 flex items-center gap-1" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}>
                          Passwords don't match
                        </motion.p>
                      )}
                      {confirmPassword && passwordsMatch && (
                        <motion.p className="text-[11px] text-emerald-400 flex items-center gap-1" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}>
                          <Check className="w-3 h-3" /> Passwords match
                        </motion.p>
                      )}
                    </div>
                  )}

                  {/* Remember / Forgot */}
                  {isLogin && (
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <div
                          className={`w-4 h-4 rounded border transition-all duration-200 flex items-center justify-center ${
                            rememberMe ? "border-purple-500 bg-purple-500" : "border-white/10 group-hover:border-white/20"
                          }`}
                          onClick={() => setRememberMe(!rememberMe)}
                        >
                          {rememberMe && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className="text-xs text-white/40">Remember me</span>
                      </label>
                      <button type="button" className="text-xs text-purple-400/80 hover:text-purple-300 transition-colors">
                        Forgot password?
                      </button>
                    </div>
                  )}

                  {/* Submit */}
                  <motion.button
                      type="submit"
                      disabled={loading || (!isLogin && !passwordsMatch) || (!isLogin && !fullName)}
                      className="w-full h-12 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold text-white mt-2 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden transition-all duration-300"
                    style={{
                      background: "linear-gradient(135deg, #8b5cf6, #3b82f6)",
                      boxShadow: "0 4px 20px rgba(139,92,246,0.3)",
                    }}
                    whileHover={{ scale: 1.02, boxShadow: "0 6px 30px rgba(139,92,246,0.5), 0 0 60px rgba(139,92,246,0.15)" }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {loading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Please wait...</>
                    ) : (
                      <>{isLogin ? "Sign In" : "Create Account"} <ArrowRight className="w-4 h-4" /></>
                    )}
                  </motion.button>
                </form>

                {/* Divider */}
                {isLogin && (
                  <div className="flex items-center gap-4 my-6">
                    <div className="flex-1 h-px bg-white/[0.06]" />
                    <span className="text-xs text-white/25 font-medium">OR</span>
                    <div className="flex-1 h-px bg-white/[0.06]" />
                  </div>
                )}

                {/* Google button */}
                {isLogin && (
                  <button
                    type="button"
                    className="w-full h-12 rounded-xl border border-white/[0.06] bg-white/[0.03] flex items-center justify-center gap-3 text-sm font-medium text-white/70 hover:bg-white/[0.06] hover:border-white/[0.1] transition-all duration-300"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continue with Google
                  </button>
                )}

                {/* Switch mode */}
                <p className="text-center text-sm text-white/35 mt-6">
                  {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                  <button
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-purple-400 font-semibold hover:text-purple-300 transition-colors"
                  >
                    {isLogin ? "Sign Up" : "Sign In"}
                  </button>
                </p>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </div>
    </PageTransition>
  );
};

export default AuthPage;
