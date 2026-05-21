"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Cpu, ShieldCheck, User, Lock, AlertCircle, ArrowRight, ArrowLeft } from "lucide-react";

import { getApiBaseUrl } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
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
        setError(data.detail || "Authentication blueprint mismatch. Verify your codename or secret key.");
      } else {
        localStorage.setItem("omnimind_token", data.access_token);
        localStorage.setItem("omnimind_user", data.username);
        router.push("/chat");
      }
    } catch (err) {
      setError("Failed to establish handshake with the Core database. Ensure the backend is active.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#030006] text-[#f3e8ff] font-sans relative overflow-hidden px-4 selection:bg-[#7b2cbf]/40">
      
      {/* Premium Studio Accent Glows */}
      <div className="absolute top-[-15%] left-[-15%] z-0 h-[600px] w-[600px] rounded-full bg-[#7b2cbf]/10 blur-[150px]" />
      <div className="absolute bottom-[-15%] right-[-15%] z-0 h-[600px] w-[600px] rounded-full bg-[#c084fc]/5 blur-[150px]" />
      
      {/* Fine-grain dot matrix backdrop */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(#ffffff02_1px,transparent_1px)] bg-[size:32px_32px]"></div>

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
        className="w-full max-w-md p-8 sm:p-10 bg-white/[0.01] backdrop-blur-3xl border border-white/[0.04] rounded-3xl shadow-2xl relative z-10"
      >
        {/* Diamond Logo Branding */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#7b2cbf] to-[#c084fc] text-white flex items-center justify-center mb-5 shadow-[0_0_25px_rgba(157,78,221,0.4)] border border-[#e0aaff]/20">
            <Cpu className="w-6.5 h-6.5 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-1.5">
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
            className="w-full bg-gradient-to-r from-[#7b2cbf] to-[#9d4edd] hover:from-[#7b2cbf] hover:to-[#c084fc] text-white font-semibold tracking-wide mt-8 h-12 rounded-xl shadow-[0_0_20px_rgba(157,78,221,0.2)] transition-transform active:scale-[0.98] border border-[#c084fc]/30 flex items-center justify-center gap-2"
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

        {/* Dynamic Toggle Option */}
        <div className="mt-8 text-center text-xs sm:text-sm text-zinc-500 font-medium">
          {isLogin ? "Not registered yet? " : "Already verified? "}
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(""); }} 
            className="text-zinc-300 hover:text-white transition-colors underline decoration-[#c084fc]/40 underline-offset-4 font-semibold"
          >
            {isLogin ? "Create an account." : "Sign in here."}
          </button>
        </div>

        {/* Go back to main page button */}
        <div className="mt-6 pt-5 border-t border-white/[0.04]">
          <Link 
            href="/" 
            className="w-full flex items-center justify-center gap-2 py-3 bg-white/[0.01] hover:bg-white/[0.04] border border-white/[0.04] hover:border-white/[0.08] text-zinc-400 hover:text-white transition-all text-xs font-semibold uppercase tracking-wider rounded-xl transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Landing Page
          </Link>
        </div>
      </motion.div>
      
      {/* Bottom Security Badge */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-[10px] text-zinc-700 tracking-wider font-semibold uppercase">
        <ShieldCheck className="w-3.5 h-3.5 text-zinc-700" /> AES-256 Workspace Handshake Secure
      </div>
    </div>
  );
}
