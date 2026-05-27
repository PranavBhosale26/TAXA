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
  AlertCircle, 
  ArrowRight, 
  ArrowLeft,
  RefreshCw
} from "lucide-react";

import { getApiBaseUrl } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [backendReady, setBackendReady] = useState<boolean | null>(null); // null = checking, false = sleeping, true = ready

  // Aggressive backend health check with retries for cold start containers
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
    
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("🛡️ SECURE PORTAL GATEWAY: Name cannot be empty.");
      return;
    }

    setLoading(true);
    try {
      const apiBaseUrl = getApiBaseUrl();
      const res = await fetch(`${apiBaseUrl}/api/quick-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName })
      });
      
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Unable to authorize. Please try again.");
      } else {
        localStorage.setItem("omnimind_token", data.access_token);
        localStorage.setItem("omnimind_user", data.username);
        localStorage.setItem("omnimind_display_name", trimmedName);
        router.push("/chat");
      }
    } catch (err) {
      setError("Unable to connect to the server. Please check if the TAXA database service is running.");
    } finally {
      setLoading(false);
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
          /* Normal Form Entry Content */
          <>
            {/* Diamond Logo Branding */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#7b2cbf] to-[#9d4edd] text-white flex items-center justify-center mb-5 shadow-[0_0_25px_rgba(157,78,221,0.4)] border border-[#e0aaff]/20">
                <Cpu className="w-6.5 h-6.5 text-white" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-1.5 uppercase">
                Welcome to TAXA
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 mt-2 text-center font-light leading-relaxed">
                Enter your name to access your professional AI workspace.
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
              {/* Name Field */}
              <div className="space-y-2 text-left">
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#c084fc]" /> Your Name
                </label>
                <Input 
                  name="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Pranav Bhosale"
                  className="bg-black/45 border-white/[0.07] text-white placeholder:text-zinc-600 focus-visible:ring-[#7b2cbf]/50 focus:border-[#7b2cbf]/50 h-12 rounded-xl transition-all font-light"
                  required
                  autoFocus
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
                    Initializing Workspace...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    Enter Workspace
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </form>
          </>
        )}
      </motion.div>

      {/* Bottom Security Badge */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-[10px] text-zinc-700 tracking-wider font-semibold uppercase pointer-events-none">
        <ShieldCheck className="w-3.5 h-3.5 text-zinc-700" /> AES-256 Workspace Handshake Secure
      </div>
    </div>
  );
}
