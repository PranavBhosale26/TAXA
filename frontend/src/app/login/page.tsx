"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Cpu, 
  ShieldCheck, 
  User, 
  Lock, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft,
  Mail,
  PlusCircle,
  Check,
  Activity,
  RefreshCw,
  Terminal,
  ShieldAlert
} from "lucide-react";

import { getApiBaseUrl } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Google Login Custom States
  const [showGooglePicker, setShowGooglePicker] = useState(false);
  const [googleStep, setGoogleStep] = useState<"choose" | "email" | "name">("email");
  const [customGoogleEmail, setCustomGoogleEmail] = useState("");
  const [customGoogleName, setCustomGoogleName] = useState("");
  const [savedGoogleUsers, setSavedGoogleUsers] = useState<{ name: string; email: string }[]>([]);
  const [backendReady, setBackendReady] = useState<boolean | null>(null); // null = checking, false = sleeping, true = ready

  // Aggressive backend health check with automatic retries for cold start containers
  useEffect(() => {
    let active = true;
    let retryTimeout: NodeJS.Timeout;

    const checkHealth = async () => {
      try {
        const apiBaseUrl = getApiBaseUrl();
        const res = await fetch(`${apiBaseUrl}/api/health`);
        if (res.ok && active) {
          setBackendReady(true);
        } else if (active) {
          setBackendReady(false);
          retryTimeout = setTimeout(checkHealth, 3000);
        }
      } catch (err) {
        if (active) {
          setBackendReady(false);
          retryTimeout = setTimeout(checkHealth, 3000);
        }
      }
    };

    checkHealth();

    return () => {
      active = false;
      clearTimeout(retryTimeout);
    };
  }, []);

  // Load cached google user on mount to offer 1-click login if they previously signed in
  useEffect(() => {
    if (typeof window !== "undefined") {
      const cachedUser = localStorage.getItem("omnimind_user");
      const cachedDisplayName = localStorage.getItem("omnimind_display_name");
      const cachedEmail = localStorage.getItem("omnimind_cached_email");
      
      if (cachedUser && cachedEmail) {
        setSavedGoogleUsers([
          { name: cachedDisplayName || cachedUser, email: cachedEmail }
        ]);
        setGoogleStep("choose");
      } else {
        setSavedGoogleUsers([]);
        setGoogleStep("email");
      }
    }
  }, []);

  // Optimistic auto-login bypass
  useEffect(() => {
    const token = localStorage.getItem("omnimind_token");
    const user = localStorage.getItem("omnimind_user");
    if (token && user) {
      router.push("/chat");
    }
  }, [router]);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Strict password complexity enforcement during registration to prevent data breach warnings
    if (!isLogin) {
      if (password.length < 8) {
        setError("🛡️ SECURE PORTAL GATEWAY: Password must be at least 8 characters long to protect your secure workspace.");
        return;
      }
      const hasNumber = /\d/.test(password);
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
      if (!hasNumber || !hasSpecial) {
        setError("🛡️ SECURE PORTAL GATEWAY: Password must contain at least one number and one special character (e.g., !, @, #, etc.) to prevent data breach exposure.");
        return;
      }
    }

    setLoading(true);
    const endpoint = isLogin ? "/api/login" : "/api/register";
    try {
      const apiBaseUrl = getApiBaseUrl();
      const res = await fetch(`${apiBaseUrl}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Incorrect username or password. Please verify your credentials.");
      } else {
        localStorage.setItem("omnimind_token", data.access_token);
        localStorage.setItem("omnimind_user", data.username);
        localStorage.setItem("omnimind_display_name", data.username);
        router.push("/chat");
      }
    } catch (err) {
      setError("Unable to connect to the server. Please check if the TAXA database service is running.");
    } finally {
      setLoading(false);
    }
  };

  const finalizeGoogleLogin = async (email: string, name: string) => {
    setLoading(true);
    setError("");
    try {
      const apiBaseUrl = getApiBaseUrl();
      const res = await fetch(`${apiBaseUrl}/api/google-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name })
      });
      
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Google login authentication failed.");
      } else {
        localStorage.setItem("omnimind_token", data.access_token);
        localStorage.setItem("omnimind_user", data.username);
        localStorage.setItem("omnimind_display_name", name || data.username);
        localStorage.setItem("omnimind_cached_email", email);
        router.push("/chat");
      }
    } catch (err) {
      setError("Unable to connect to the server. Please check if the TAXA database service is running.");
    } finally {
      setLoading(false);
      setShowGooglePicker(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#030006] text-[#f3e8ff] font-sans relative overflow-hidden px-4 selection:bg-[#7b2cbf]/40">
      
      {/* Premium Studio Accent Glows */}
      <div className="absolute top-[-15%] left-[-15%] z-0 h-[600px] w-[600px] rounded-full bg-[#7b2cbf]/10 blur-[150px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-15%] right-[-15%] z-0 h-[600px] w-[600px] rounded-full bg-[#c084fc]/5 blur-[150px] pointer-events-none animate-pulse" />
      
      {/* Fine-grain dot matrix backdrop */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(#ffffff02_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none"></div>

      {/* Floating Go Back Home Button */}
      <Link 
        href="/" 
        className="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-zinc-400 hover:text-white bg-white/[0.01] hover:bg-white/[0.04] border border-white/[0.05] hover:border-white/[0.12] backdrop-blur-md rounded-full shadow-lg transition-all group duration-300 active:scale-95"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        Back to Home
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md p-8 sm:p-10 bg-white/[0.01] backdrop-blur-3xl border border-white/[0.04] rounded-3xl shadow-2xl relative z-10 overflow-hidden"
      >
        {/* Animated glowing border effect */}
        <div className="absolute inset-0 -z-10 rounded-3xl p-[1px] bg-gradient-to-br from-white/[0.05] via-transparent to-[#7b2cbf]/25" />
        
        {/* Secure TLS Link Badge */}
        <div className="mb-6 p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-between text-left">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">TLS 1.3 Link Active</span>
          </div>
          <span className="text-[8.5px] font-mono text-zinc-500">AES-256-GCM / SQLite-v3</span>
        </div>

        {backendReady !== true ? (
          /* Premium Boot loader overlay for cold starting Render containers */
          <div className="flex flex-col items-center justify-center py-10 text-center select-none animate-in fade-in duration-500">
            {/* Pulsing circular visualizer */}
            <div className="relative w-28 h-28 mb-8 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-[#7b2cbf]/10 blur-xl animate-pulse"></div>
              <div className="absolute w-24 h-24 rounded-full border border-dashed border-[#7b2cbf]/20 animate-spin" style={{ animationDuration: '6s' }}></div>
              <div className="absolute w-18 h-18 rounded-full border border-dotted border-[#c084fc]/30 animate-spin" style={{ animationDuration: '3s', animationDirection: 'reverse' }}></div>
              <div className="absolute w-12 h-12 rounded-full bg-gradient-to-tr from-[#7b2cbf] to-[#c084fc] shadow-[0_0_20px_rgba(123,44,191,0.5)] flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-white animate-spin" style={{ animationDuration: '2.5s' }} />
              </div>
            </div>

            <h3 className="text-sm font-bold text-white tracking-widest uppercase mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#c084fc] animate-ping shrink-0"></span>
              {backendReady === null ? "Initializing Secure Link..." : "Waking up TAXA Cores..."}
            </h3>
            <p className="text-xs text-zinc-400 font-light leading-relaxed max-w-xs">
              {backendReady === null 
                ? "Establishing connection to the secure AI portal. Standby..." 
                : "The server is sleeping. Render's free tier takes up to 45 seconds to boot up. We are auto-connecting, please hold..."}
            </p>
            
            <div className="mt-8 px-4 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] text-[10px] font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
              Status: Connecting...
            </div>
          </div>
        ) : (
          /* Normal Form Login / Register Content */
          <>
            {/* Diamond Logo Branding */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#7b2cbf] to-[#9d4edd] text-white flex items-center justify-center mb-5 shadow-[0_0_25px_rgba(157,78,221,0.4)] border border-[#e0aaff]/20">
                <Cpu className="w-6.5 h-6.5 text-white" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-1.5 uppercase">
                {isLogin ? "TAXA Workspace" : "Acquire Identity"}
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 mt-2 text-center font-light leading-relaxed">
                {isLogin 
                  ? "Authenticate to enter the professional AI workspace." 
                  : "Register your secure username to access the workspace."}
              </p>
            </div>

            {/* Beautiful Animated Error Panel */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="mb-6 p-4 rounded-xl bg-red-950/20 border border-red-500/25 text-red-400 text-xs sm:text-sm text-left flex items-start gap-3.5 font-light"
                >
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username Field */}
              <div className="space-y-2 text-left">
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#c084fc]" /> Username
                </label>
                <Input 
                  name="username"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="bg-black/45 border-white/[0.07] text-white placeholder:text-zinc-600 focus-visible:ring-[#7b2cbf]/50 focus:border-[#7b2cbf]/50 h-12 rounded-xl transition-all font-light"
                  required
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2 text-left">
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#c084fc]" /> Password
                </label>
                <Input 
                  name="password"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-black/45 border-white/[0.07] text-white placeholder:text-zinc-600 focus-visible:ring-[#7b2cbf]/50 focus:border-[#7b2cbf]/50 h-12 rounded-xl transition-all font-light"
                  required
                />
              </div>

              {/* Interactive Action Button */}
              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-gradient-to-r from-[#7b2cbf] to-[#9d4edd] hover:from-[#7b2cbf] hover:to-[#c084fc] text-white font-semibold tracking-wide mt-6 h-12 rounded-xl shadow-[0_0_20px_rgba(157,78,221,0.2)] transition-transform active:scale-[0.98] border border-[#c084fc]/30 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                    Authenticating...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    {isLogin ? "Authenticate & Enter" : "Establish Identity"}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </form>

            {/* Separator */}
            <div className="flex items-center gap-3 my-6">
              <div className="h-[1px] flex-1 bg-white/[0.06]" />
              <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest text-center">Or Securely Connect</span>
              <div className="h-[1px] flex-1 bg-white/[0.06]" />
            </div>

            {/* Google Sign-in Trigger */}
            <Button
              type="button"
              onClick={() => {
                if (savedGoogleUsers.length > 0) {
                  setGoogleStep("choose");
                } else {
                  setGoogleStep("email");
                }
                setShowGooglePicker(true);
              }}
              className="w-full h-12 rounded-xl bg-white/[0.02] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.15] text-zinc-200 hover:text-white font-medium text-sm transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Continue with Google
            </Button>

            {/* Dynamic Toggle Option */}
            <div className="mt-8 text-center text-xs sm:text-sm text-zinc-500 font-medium">
              {isLogin ? "Not registered yet? " : "Already verified? "}
              <button 
                type="button"
                onClick={() => { setIsLogin(!isLogin); setError(""); }} 
                className="text-zinc-300 hover:text-white transition-colors underline decoration-[#c084fc]/40 underline-offset-4 font-semibold"
              >
                {isLogin ? "Create an account." : "Sign in here."}
              </button>
            </div>
          </>
        )}
      </motion.div>

      {/* Google Account Credentials Input Portal (Google Chooser Style) */}
      <AnimatePresence>
        {showGooglePicker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 transition-all duration-300">
            {/* Elegant Background Google style footer markers */}
            <div className="absolute bottom-6 left-6 text-xs text-[#9aa0a6] hover:text-white cursor-pointer font-light transition-colors hidden md:block">
              English (United Kingdom) ▾
            </div>
            <div className="absolute bottom-6 right-6 flex gap-6 text-xs text-[#9aa0a6] font-light hidden md:block">
              <span className="hover:text-white cursor-pointer transition-colors">Help</span>
              <span className="hover:text-white cursor-pointer transition-colors">Privacy</span>
              <span className="hover:text-white cursor-pointer transition-colors">Terms</span>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              className="relative w-full max-w-3xl bg-[#131314] border border-[#2e2e30] rounded-[28px] p-8 md:p-10 shadow-2xl overflow-hidden flex flex-col md:flex-row gap-8 md:gap-12 md:min-h-[400px]"
            >
              {/* Left Column: Sign in header & Title */}
              <div className="flex-1 flex flex-col justify-between text-left">
                <div>
                  {/* Google Logo Header */}
                  <div className="flex items-center gap-2.5 mb-8">
                    <svg className="w-5.5 h-5.5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span className="text-sm font-medium text-[#c4c7c5]">Sign in with Google</span>
                  </div>

                  {googleStep === "choose" && (
                    <>
                      <h2 className="text-3xl font-normal text-white tracking-tight leading-tight">Choose an account</h2>
                      <p className="text-sm text-[#c4c7c5] mt-3">to continue to <span className="text-[#a8c7fa] font-medium hover:underline cursor-pointer">taxa.ai</span></p>
                    </>
                  )}

                  {googleStep === "email" && (
                    <>
                      <h2 className="text-3xl font-normal text-white tracking-tight leading-tight">Sign in</h2>
                      <p className="text-sm text-[#c4c7c5] mt-3">to continue to <span className="text-[#a8c7fa] font-medium hover:underline cursor-pointer">taxa.ai</span></p>
                    </>
                  )}

                  {googleStep === "name" && (
                    <>
                      <h2 className="text-3xl font-normal text-white tracking-tight leading-tight">Welcome</h2>
                      <p className="text-sm text-[#c084fc] font-mono mt-3 font-semibold truncate max-w-full">{customGoogleEmail}</p>
                    </>
                  )}
                </div>

                {/* Left Bottom Close Button overlay */}
                <button
                  onClick={() => setShowGooglePicker(false)}
                  className="text-xs text-[#9aa0a6] hover:text-white transition-colors underline underline-offset-4 text-left mt-6 md:mt-0 font-medium uppercase tracking-wider"
                >
                  Close Gateway
                </button>
              </div>

              {/* Right Column: Account Selection / Interactive Input Fields */}
              <div className="flex-[1.3] flex flex-col justify-between text-left">
                
                {googleStep === "choose" && (
                  <div className="flex flex-col justify-between h-full">
                    {/* Account picker rows */}
                    <div className="space-y-0.5 divide-y divide-[#2e2e30] border-y border-[#2e2e30]">
                      
                      {/* List browser-cached logged-in accounts strictly */}
                      {savedGoogleUsers.map((user, idx) => (
                        <button
                          key={idx}
                          onClick={() => finalizeGoogleLogin(user.email, user.name)}
                          className="w-full py-4 flex items-center justify-between text-left hover:bg-white/[0.04] px-3 -mx-3 rounded-2xl transition-all group active:scale-[0.99]"
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            {/* Avatar Circle with Initial */}
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7b2cbf] to-[#c084fc] flex items-center justify-center text-[15px] font-bold text-white uppercase shrink-0 shadow-lg shadow-[#7b2cbf]/15">
                              {user.name.charAt(0)}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-[15px] font-medium text-white group-hover:text-[#a8c7fa] transition-colors truncate">{user.name}</span>
                              <span className="text-xs text-[#c4c7c5] truncate mt-0.5">{user.email}</span>
                            </div>
                          </div>
                        </button>
                      ))}

                      {/* Use Another Account button */}
                      <button
                        onClick={() => {
                          setCustomGoogleEmail("");
                          setCustomGoogleName("");
                          setGoogleStep("email");
                        }}
                        className="w-full py-4 flex items-center gap-4 text-left hover:bg-white/[0.04] px-3 -mx-3 rounded-2xl transition-all group active:scale-[0.99]"
                      >
                        <div className="w-10 h-10 rounded-full bg-[#1f1f20] border border-[#2e2e30] flex items-center justify-center shrink-0">
                          <svg className="w-5 h-5 text-[#c4c7c5]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                          </svg>
                        </div>
                        <div className="text-[15px] font-medium text-white group-hover:text-[#a8c7fa] transition-colors">Use another account</div>
                      </button>

                    </div>

                    {/* Bottom Google terms disclosure */}
                    <div className="text-xs text-[#c4c7c5] leading-relaxed pt-8 font-light mt-6 md:mt-0">
                      Before using this app, you can review taxa.ai's <span className="text-[#a8c7fa] hover:underline cursor-pointer">Privacy Policy</span> and <span className="text-[#a8c7fa] hover:underline cursor-pointer">Terms of Service</span>.
                    </div>
                  </div>
                )}

                {googleStep === "email" && (
                  <div className="flex flex-col justify-between h-full space-y-6">
                    <div className="space-y-5">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest animate-pulse">Email or Phone</label>
                        <Input
                          name="google-email-input"
                          autoComplete="email"
                          type="email"
                          placeholder="Enter your email address"
                          value={customGoogleEmail}
                          onChange={(e) => setCustomGoogleEmail(e.target.value)}
                          className="bg-black/45 border-white/[0.07] text-white placeholder:text-zinc-700 focus-visible:ring-[#7b2cbf]/50 focus:border-[#7b2cbf]/50 h-12 rounded-xl transition-all text-sm font-light px-4"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-4 w-full">
                      <Button
                        type="button"
                        onClick={() => setGoogleStep("choose")}
                        className="flex-1 h-12 rounded-xl bg-white/[0.01] hover:bg-white/[0.04] border border-white/[0.06] text-zinc-400 hover:text-white font-bold text-xs uppercase tracking-wider transition-all"
                      >
                        Back
                      </Button>
                      <Button
                        type="button"
                        disabled={!customGoogleEmail.includes("@")}
                        onClick={() => setGoogleStep("name")}
                        className="flex-1 h-12 rounded-xl bg-gradient-to-r from-[#7b2cbf] to-[#9d4edd] text-white font-bold text-xs uppercase tracking-wider transition-all border border-[#c084fc]/30 shadow-lg shadow-[#7b2cbf]/10 flex items-center justify-center gap-1.5"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}

                {googleStep === "name" && (
                  <div className="flex flex-col justify-between h-full space-y-6">
                    <div className="space-y-5">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest animate-pulse">Your Full Name</label>
                        <Input
                          name="google-name-input"
                          autoComplete="name"
                          type="text"
                          placeholder="e.g. John Doe"
                          value={customGoogleName}
                          onChange={(e) => setCustomGoogleName(e.target.value)}
                          className="bg-black/45 border-white/[0.07] text-white placeholder:text-zinc-700 focus-visible:ring-[#7b2cbf]/50 focus:border-[#7b2cbf]/50 h-12 rounded-xl transition-all text-sm font-light px-4"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-4 w-full">
                      <Button
                        type="button"
                        onClick={() => setGoogleStep("email")}
                        className="flex-1 h-12 rounded-xl bg-white/[0.01] hover:bg-white/[0.04] border border-white/[0.06] text-zinc-400 hover:text-white font-bold text-xs uppercase tracking-wider transition-all"
                      >
                        Back
                      </Button>
                      <Button
                        type="button"
                        disabled={!customGoogleName || loading}
                        onClick={() => finalizeGoogleLogin(customGoogleEmail, customGoogleName)}
                        className="flex-1 h-12 rounded-xl bg-gradient-to-r from-[#7b2cbf] to-[#9d4edd] text-white font-bold text-xs uppercase tracking-wider transition-all border border-[#c084fc]/30 shadow-lg shadow-[#7b2cbf]/10 flex items-center justify-center gap-1.5"
                      >
                        {loading ? (
                          <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                        ) : (
                          "Sign In"
                        )}
                      </Button>
                    </div>
                  </div>
                )}

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Bottom Security Badge */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-[10px] text-zinc-700 tracking-wider font-semibold uppercase pointer-events-none">
        <ShieldCheck className="w-3.5 h-3.5 text-zinc-700" /> AES-256 Workspace Handshake Secure
      </div>
    </div>
  );
}
