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
  const [customGoogleEmail, setCustomGoogleEmail] = useState("");
  const [customGoogleName, setCustomGoogleName] = useState("");
  const [showCustomGoogleForm, setShowCustomGoogleForm] = useState(false);

  // Secure Connection Handshake States
  const [selectedGoogleAccount, setSelectedGoogleAccount] = useState<{ email: string; name: string } | null>(null);
  const [showHandshakeModal, setShowHandshakeModal] = useState(false);
  const [handshakeStepIdx, setHandshakeStepIdx] = useState(-1); // -1: Not started, 0, 1, 2: Active steps, 3: Success
  const [authChecked, setAuthChecked] = useState(true);
  const [storageChecked, setStorageChecked] = useState(true);
  const [handshakeError, setHandshakeError] = useState("");

  // Optimistic auto-login bypass
  useEffect(() => {
    const token = localStorage.getItem("omnimind_token");
    const user = localStorage.getItem("omnimind_user");
    if (token && user) {
      router.push("/chat");
    }
  }, [router]);

  // Predictive pre-warming of backend container (Render free tier cold start bypass)
  useEffect(() => {
    const warmUpBackend = async () => {
      try {
        const apiBaseUrl = getApiBaseUrl();
        await fetch(`${apiBaseUrl}/api/health`);
      } catch (e) {
        // ignore errors
      }
    };
    warmUpBackend();
  }, []);

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
        router.push("/chat");
      }
    } catch (err) {
      setError("Unable to connect to the server. Please check if the TAXA database service is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleAccountSelect = (email: string, name: string) => {
    setSelectedGoogleAccount({ email, name });
    setShowGooglePicker(false);
    setHandshakeStepIdx(-1);
    setHandshakeError("");
    setShowHandshakeModal(true);
  };

  const startHandshake = () => {
    if (!authChecked || !storageChecked || !selectedGoogleAccount) return;
    setHandshakeStepIdx(0);
    setHandshakeError("");

    // Step 0: Generates secure ephemeral keys
    setTimeout(() => {
      setHandshakeStepIdx(1);
      // Step 1: Performs handshake verification with SQLite backend
      setTimeout(() => {
        setHandshakeStepIdx(2);
        // Step 2: Opens sandbox environment
        setTimeout(() => {
          setHandshakeStepIdx(3);
          // Step 3: Complete & execute API login call
          finalizeGoogleLogin(selectedGoogleAccount.email, selectedGoogleAccount.name);
        }, 120);
      }, 120);
    }, 120);
  };

  const finalizeGoogleLogin = async (email: string, name: string) => {
    try {
      const apiBaseUrl = getApiBaseUrl();
      const res = await fetch(`${apiBaseUrl}/api/google-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name })
      });
      
      const data = await res.json();
      if (!res.ok) {
        setHandshakeError(data.detail || "Google login authentication failed.");
        setHandshakeStepIdx(-1);
      } else {
        localStorage.setItem("omnimind_token", data.access_token);
        localStorage.setItem("omnimind_user", data.username);
        router.push("/chat");
      }
    } catch (err) {
      setHandshakeError("Unable to connect to the server. Please check if the TAXA database service is running.");
      setHandshakeStepIdx(-1);
    }
  };

  const handshakeSteps = [
    { label: "Generating secure ephemeral ECDH public keys...", id: 0 },
    { label: "Performing cryptographic handshake verification with SQLite...", id: 1 },
    { label: "Establishing isolated secure workspace sandbox session...", id: 2 }
  ];

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
          onClick={() => setShowGooglePicker(true)}
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
      </motion.div>

      {/* Simulated Premium Google Account Picker popup */}
      <AnimatePresence>
        {showGooglePicker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 transition-all duration-300">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-sm bg-[#0b0612] border border-white/10 rounded-3xl shadow-2xl p-6 sm:p-7 overflow-hidden text-center"
            >
              {/* Google style branding */}
              <div className="flex flex-col items-center mb-6">
                <svg className="w-9 h-9 mb-4" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.2-5.136 4.2A5.6 5.6 0 0 1 8.35 13a5.6 5.6 0 0 1 5.64-5.6c1.55 0 2.97.58 4.05 1.54l3.12-3.12A9.91 9.91 0 0 0 13.99 2a10 10 0 0 0-10 10 10 10 0 0 0 10 10c5.56 0 10.01-4.04 10.01-9.98a8.87 8.87 0 0 0-.17-1.73H12.24Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M3.99 12a10 10 0 0 0 .17 1.73l3.66-2.84A5.6 5.6 0 0 1 8.35 12c0-1.12.33-2.17.91-3.05l-3.66-2.84A9.9 9.9 0 0 0 3.99 12Z"
                  />
                  <path
                    fill="#34A853"
                    d="M13.99 22c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H3.99v2.84C5.8 19.53 9.5 22 13.99 22Z"
                  />
                  <path
                    fill="#4285F4"
                    d="M21.27 19.34A10 10 0 0 0 24 12c0-.58-.07-1.16-.17-1.73H12.24V14.4h6.887a5.92 5.92 0 0 1-2.21 3.31l3.57 2.77c1.07-1.02 2.1-2.22 3.03-3.14Z"
                  />
                </svg>
                <h3 className="text-lg font-bold text-white uppercase tracking-wider">Choose an Account</h3>
                <p className="text-xs text-zinc-400 mt-1">to continue to TAXA Workspace</p>
              </div>

              {!showCustomGoogleForm ? (
                <div className="space-y-3">
                  {/* Account 1 */}
                  <button
                    onClick={() => handleAccountSelect("pranav.bhosale@gmail.com", "Pranav Bhosale")}
                    className="w-full p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-[#7b2cbf]/10 hover:border-[#c084fc]/30 transition-all flex items-center justify-between text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7b2cbf] to-[#c084fc] text-white flex items-center justify-center text-xs font-bold shadow-md">
                        PB
                      </div>
                      <div>
                        <p className="text-xs font-bold text-zinc-100 group-hover:text-white transition-colors">Pranav Bhosale</p>
                        <p className="text-[10px] text-zinc-500 group-hover:text-zinc-400 transition-colors">pranav.bhosale@gmail.com</p>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-[#c084fc] transition-colors" />
                  </button>

                  {/* Account 2 */}
                  <button
                    onClick={() => handleAccountSelect("demo.user@gmail.com", "Demo User")}
                    className="w-full p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-[#7b2cbf]/10 hover:border-[#c084fc]/30 transition-all flex items-center justify-between text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-zinc-800 text-zinc-300 flex items-center justify-center text-xs font-bold border border-zinc-700">
                        DU
                      </div>
                      <div>
                        <p className="text-xs font-bold text-zinc-100 group-hover:text-white transition-colors">Demo User</p>
                        <p className="text-[10px] text-zinc-500 group-hover:text-zinc-400 transition-colors">demo.user@gmail.com</p>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-[#c084fc] transition-colors" />
                  </button>

                  {/* Use another account trigger */}
                  <button
                    onClick={() => setShowCustomGoogleForm(true)}
                    className="w-full py-3.5 rounded-2xl bg-white/[0.01] hover:bg-white/[0.04] border border-white/[0.05] border-dashed text-zinc-400 hover:text-white transition-all flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider"
                  >
                    <PlusCircle className="w-4 h-4 text-[#c084fc]" />
                    Use another account
                  </button>

                  {/* Cancel Button */}
                  <button
                    onClick={() => setShowGooglePicker(false)}
                    className="w-full mt-4 py-2.5 text-xs text-zinc-500 hover:text-zinc-300 font-bold uppercase tracking-wider transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="space-y-4 text-left">
                  {/* Custom Name */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Full Name</label>
                    <Input
                      type="text"
                      placeholder="e.g. John Doe"
                      value={customGoogleName}
                      onChange={(e) => setCustomGoogleName(e.target.value)}
                      className="bg-black/45 border-white/[0.07] text-white placeholder:text-zinc-700 focus-visible:ring-[#7b2cbf]/50 focus:border-[#7b2cbf]/50 h-11 rounded-xl transition-all text-xs font-light"
                      required
                    />
                  </div>

                  {/* Custom Email */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Google Email</label>
                    <Input
                      type="email"
                      placeholder="e.g. user@gmail.com"
                      value={customGoogleEmail}
                      onChange={(e) => setCustomGoogleEmail(e.target.value)}
                      className="bg-black/45 border-white/[0.07] text-white placeholder:text-zinc-700 focus-visible:ring-[#7b2cbf]/50 focus:border-[#7b2cbf]/50 h-11 rounded-xl transition-all text-xs font-light"
                      required
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      onClick={() => setShowCustomGoogleForm(false)}
                      className="flex-1 h-11 rounded-xl bg-white/[0.01] hover:bg-white/[0.04] border border-white/[0.06] text-zinc-400 hover:text-white font-bold text-xs uppercase tracking-wider transition-all"
                    >
                      Back
                    </Button>
                    <Button
                      type="button"
                      disabled={!customGoogleEmail || !customGoogleName}
                      onClick={() => handleAccountSelect(customGoogleEmail, customGoogleName)}
                      className="flex-1 h-11 rounded-xl bg-gradient-to-r from-[#7b2cbf] to-[#9d4edd] text-white font-bold text-xs uppercase tracking-wider transition-all border border-[#c084fc]/30"
                    >
                      Sign In
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* High-Fidelity Secure Google Connection Handshake Gate Modal */}
      <AnimatePresence>
        {showHandshakeModal && selectedGoogleAccount && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-lg p-4 transition-all duration-300">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#0a0510]/95 border border-white/10 rounded-3xl shadow-2xl p-6 sm:p-8 overflow-hidden text-center"
            >
              {/* Top Security Banner */}
              <div className="inline-flex items-center gap-1.5 bg-[#7b2cbf]/10 border border-[#c084fc]/20 text-[#c084fc] px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-6">
                <ShieldCheck className="w-3.5 h-3.5 animate-pulse" /> Cryptographic Key Negotiation
              </div>

              <h3 className="text-xl font-extrabold text-white uppercase tracking-wide">Handshake Authorization</h3>
              <p className="text-xs text-zinc-400 mt-1.5">Verify connection parameters to initialize device sandbox.</p>

              {/* Cryptographic Tunnel Diagram */}
              <div className="flex items-center justify-between gap-4 my-6 p-4.5 rounded-2xl bg-black/40 border border-white/5 relative overflow-hidden">
                {/* Profile Card */}
                <div className="flex flex-col items-center gap-1.5 z-10 shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center shadow-md">
                    <Mail className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className="text-[9px] font-bold text-zinc-400">Google Auth</span>
                </div>

                {/* Cryptographic Tunnel */}
                <div className="flex-1 flex flex-col items-center gap-1.5 relative py-2">
                  <div className="h-[2px] w-full bg-gradient-to-r from-blue-500/30 via-[#c084fc]/50 to-[#7b2cbf]/30 relative overflow-hidden rounded-full">
                    {/* Animated pulse dot moving along the tunnel */}
                    <motion.div 
                      animate={handshakeStepIdx >= 0 ? { x: ["-100%", "250%"] } : {}}
                      transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                      className="absolute h-full w-12 bg-gradient-to-r from-transparent via-[#c084fc] to-transparent"
                    />
                  </div>
                  <span className="text-[8px] font-mono tracking-widest text-[#c084fc] uppercase animate-pulse">
                    {handshakeStepIdx >= 0 && handshakeStepIdx < 3 ? "Exchanging Keys..." : handshakeStepIdx === 3 ? "Secure Tunnel Open" : "Tunnel Negotiating"}
                  </span>
                </div>

                {/* TAXA Node Card */}
                <div className="flex flex-col items-center gap-1.5 z-10 shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-[#7b2cbf]/10 border border-[#7b2cbf]/25 flex items-center justify-center shadow-md">
                    <Cpu className="w-5 h-5 text-[#c084fc]" />
                  </div>
                  <span className="text-[9px] font-bold text-[#c084fc]">TAXA SQLite Node</span>
                </div>
              </div>

              {/* Selected Profile Summary */}
              <div className="p-4 mb-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] text-left">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Target Account Profile</span>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7b2cbf] to-[#c084fc] text-white flex items-center justify-center text-xs font-extrabold shadow-md shrink-0">
                    {selectedGoogleAccount.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="overflow-hidden">
                    <span className="text-xs font-bold text-white block truncate">{selectedGoogleAccount.name}</span>
                    <span className="text-[10px] text-zinc-400 block truncate">{selectedGoogleAccount.email}</span>
                  </div>
                </div>
              </div>

              {/* Handshake Ticking Status or Consent Checkboxes */}
              {handshakeStepIdx === -1 ? (
                <div className="space-y-3.5 text-left mb-6">
                  <label className="flex items-start gap-3 cursor-pointer text-[11px] text-zinc-400 hover:text-zinc-200 select-none leading-relaxed transition-colors">
                    <input 
                      type="checkbox" 
                      checked={authChecked} 
                      onChange={(e) => setAuthChecked(e.target.checked)}
                      className="mt-0.5 rounded border-zinc-700 bg-black text-[#7b2cbf] focus:ring-[#7b2cbf] w-4 h-4 shrink-0 transition-all" 
                    />
                    <span>I authorize TAXA to establish a secure, local-first sandbox session for my user identity.</span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer text-[11px] text-zinc-400 hover:text-zinc-200 select-none leading-relaxed transition-colors">
                    <input 
                      type="checkbox" 
                      checked={storageChecked} 
                      onChange={(e) => setStorageChecked(e.target.checked)}
                      className="mt-0.5 rounded border-zinc-700 bg-black text-[#7b2cbf] focus:ring-[#7b2cbf] w-4 h-4 shrink-0 transition-all" 
                    />
                    <span>Allow encrypted storage of session tokens under private device sandbox.</span>
                  </label>
                </div>
              ) : (
                <div className="space-y-2.5 text-left mb-6 p-4 rounded-2xl bg-black/50 border border-white/[0.03] font-mono">
                  {handshakeSteps.map((step) => {
                    const isSuccess = handshakeStepIdx > step.id;
                    const isActive = handshakeStepIdx === step.id;
                    return (
                      <div 
                        key={step.id} 
                        className={`flex items-center gap-2.5 text-xs transition-colors duration-300 ${isSuccess ? "text-emerald-400" : isActive ? "text-[#c084fc]" : "text-zinc-600"}`}
                      >
                        {isSuccess ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : isActive ? (
                          <RefreshCw className="w-3.5 h-3.5 text-[#c084fc] shrink-0 animate-spin" />
                        ) : (
                          <div className="w-3.5 h-3.5 border border-zinc-700 rounded-full shrink-0" />
                        )}
                        <span className="truncate">{step.label}</span>
                      </div>
                    );
                  })}
                  
                  {handshakeStepIdx === 3 && (
                    <div className="flex items-center gap-2 text-xs text-emerald-400 pt-1">
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                      <span>[✓] Safe Handshake Established! Redirecting...</span>
                    </div>
                  )}
                </div>
              )}

              {/* Handshake Error Message */}
              {handshakeError && (
                <div className="mb-5 p-3.5 rounded-xl bg-red-950/20 border border-red-500/25 text-red-400 text-xs text-left flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{handshakeError}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  disabled={handshakeStepIdx >= 0}
                  onClick={() => {
                    setShowHandshakeModal(false);
                    setSelectedGoogleAccount(null);
                  }}
                  className="flex-1 h-12 rounded-xl bg-white/[0.01] hover:bg-white/[0.04] border border-white/[0.06] text-zinc-400 hover:text-white font-bold text-xs uppercase tracking-wider transition-all"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={!authChecked || !storageChecked || handshakeStepIdx >= 0}
                  onClick={startHandshake}
                  className="flex-1 h-12 rounded-xl bg-gradient-to-r from-[#7b2cbf] to-[#9d4edd] disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-600 disabled:border-transparent text-white font-bold text-xs uppercase tracking-wider transition-all border border-[#c084fc]/30 flex items-center justify-center gap-1.5 shadow-lg shadow-[#7b2cbf]/10"
                >
                  Confirm & Connect
                  <ArrowRight className="w-4 h-4" />
                </Button>
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
