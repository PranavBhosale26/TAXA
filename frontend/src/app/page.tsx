"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  BrainCircuit, 
  Database, 
  Lock, 
  Zap, 
  ArrowRight, 
  Sparkles, 
  Flame, 
  Cpu, 
  Info, 
  Globe,
  X,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Activity,
  Settings,
  Sun,
  Moon,
  Laptop
} from "lucide-react";
import { getApiBaseUrl } from "@/lib/api";

export default function Home() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 25 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const } },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.96 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
  };

  const [userName, setUserName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [activeFact, setActiveFact] = useState(0);
  
  // Interactive Spotlight Grid State
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [mouseCoords, setMouseCoords] = useState({ x: 0, y: 0 });
  
  // Custom Interactive Web States
  const [activeFaqIdx, setActiveFaqIdx] = useState<number | null>(null);
  const [activeNewsIdx, setActiveNewsIdx] = useState<number | null>(null);

  // Dynamic Theme & Settings states
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light" | "system">("dark");
  const [resolvedTheme, setResolvedTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  const getFriendlyName = (name: string): string => {
    if (!name) return "";
    let clean = name.toLowerCase().trim();
    if (clean.includes("@")) {
      clean = clean.split("@")[0];
    }
    clean = clean.replace(/\d+$/, "");
    if (clean.includes("pranav")) {
      return "Pranav";
    }
    if (clean.startsWith("bhosale") && clean.length > 7) {
      const suffix = clean.slice(7);
      if (suffix) {
        return suffix.charAt(0).toUpperCase() + suffix.slice(1);
      }
    }
    const parts = clean.split(/[._-]/);
    let firstPart = parts[0];
    return firstPart.charAt(0).toUpperCase() + firstPart.slice(1);
  };

  useEffect(() => {
    const user = localStorage.getItem("omnimind_user");
    const savedDisplayName = localStorage.getItem("omnimind_display_name");
    if (user) {
      setUserName(user);
      setDisplayName(savedDisplayName || user);
    }
  }, []);

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

  // Sync theme from localStorage on client mount
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("omnimind_theme") as "dark" | "light" | "system" | null;
    const initialTheme = savedTheme || "system";
    setTheme(initialTheme);
    
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      root.classList.remove("light", "dark");
      
      if (initialTheme === "system") {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        root.classList.add(systemTheme);
        setResolvedTheme(systemTheme);
      } else {
        root.classList.add(initialTheme);
        setResolvedTheme(initialTheme);
      }
    }
  }, []);

  // Update root element classes when theme state is modified
  useEffect(() => {
    if (!mounted) return;
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      root.classList.remove("light", "dark");
      
      if (theme === "system") {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        root.classList.add(systemTheme);
        setResolvedTheme(systemTheme);
      } else {
        root.classList.add(theme);
        setResolvedTheme(theme);
      }
    }
  }, [theme, mounted]);

  const funFacts = [
    {
      title: "Ancient Abstraction",
      desc: "TAXA draws its name from 'Taksha', meaning 'to organize or structure' in ancient Sanskrit. It represents the ultimate digital architect, shaping raw, chaotic inputs into pristine, structured solutions."
    },
    {
      title: "Unprecedented Capability",
      desc: "TAXA possesses an exceptionally massive context engine, capable of digesting up to 750,000 words in a single conversational session. This allows you to analyze entire books, heavy business spreadsheets, or extensive archives effortlessly."
    },
    {
      title: "Unified Analytical Workspace",
      desc: "Whether analyzing complex financial reports, dense regulatory files, high-resolution media mockups, or multi-tab spreadsheets, TAXA processes and correlates them all with absolute precision."
    },
    {
      title: "Pleasant & Professional Wit",
      desc: "Moving past dry clinical dialogue, TAXA is packed with a sharp, sophisticated, and highly professional personality that makes daily research and creative brainstorming a delightful experience."
    }
  ];

  const newsFeed = [
    {
      tag: "COMPUTING",
      title: "NVIDIA Blackwell Platform Redefines Generative AI Scale",
      desc: "Blackwell GPUs deliver up to 20 petaflops of FP4 AI performance, enabling organizations to run real-time generative AI on trillion-parameter large language models at unprecedented speed and power efficiency.",
      details: "The Blackwell platform features six revolutionary technologies for accelerated computing, which will help unlock breakthroughs in data processing, engineering simulation, electronic design automation, computer-aided drug design, and quantum computing. It promises up to 25x reduced energy costs and operating footprint compared to the previous Hopper architecture.",
      time: "Trending Now",
      url: "https://nvidianews.nvidia.com/news/nvidia-blackwell-platform-arrives-to-power-a-new-era-of-computing"
    },
    {
      tag: "BIOTECH",
      title: "Google DeepMind Unveils AlphaFold 3 Molecular Engine",
      desc: "Introducing a revolutionary model that predicts structure and interactions of DNA, RNA, proteins, and chemical compounds with high precision, unlocking new pathways for biology and molecular drug design.",
      details: "AlphaFold 3 goes beyond proteins to map a broad spectrum of biomolecules. Developed in collaboration with Isomorphic Labs, it allows researchers to model interactions with nucleic acids and chemical compounds, significantly accelerating vaccine and targeted drug design research workflows.",
      time: "Hot Topic",
      url: "https://deepmind.google/technologies/alphafold/"
    },
    {
      tag: "AI FRONTIER",
      title: "OpenAI Announces GPT-4o Omnimodal Native Assistant",
      desc: "A massive leap in human-computer interaction, natively integrating real-time voice conversations, high-fidelity visual reasoning, and sub-second multilingual text generation in a unified intelligence.",
      details: "GPT-4o ('o' for omni) represents a massive step toward much more natural human-computer interaction. It accepts any combination of text, audio, and image inputs and generates text, audio, and image outputs natively. This enables instant dialogue response times averaging 232 milliseconds, matching human conversational speed.",
      time: "Breaking News",
      url: "https://openai.com/index/gpt-4o-and-more-capabilities-to-chatgpt/"
    }
  ];

  const corePillars = [
    {
      title: "Intelligent Document Sculptor",
      desc: "Upload PDFs, spreadsheet rows, reports, or text files. TAXA dynamically analyzes and organizes raw information with extreme precision and clarity.",
      icon: Database,
      accent: "from-[#7b2cbf] to-[#c084fc]"
    },
    {
      title: "Dynamic Visual Assistant",
      desc: "Upload high-resolution designs, user mockups, chart graphics, or complex diagram sheets. TAXA visualizes bottlenecks and offers immediate constructive insights.",
      icon: BrainCircuit,
      accent: "from-[#c084fc] to-[#e0aaff]"
    },
    {
      title: "Hands-Free Voice Assistant",
      desc: "Enable low-latency voice command dictation and pleasant audio synthesis to dictate prompts and listen to summaries with zero delay.",
      icon: Zap,
      accent: "from-[#7b2cbf] to-[#9d4edd]"
    },
    {
      title: "Private Account Isolation",
      desc: "Complete privacy and data sovereignty. Every user profile is secured under custom encrypted sandboxes, preventing unauthorized access.",
      icon: Lock,
      accent: "from-[#9d4edd] to-[#e0aaff]"
    }
  ];

  const faqs = [
    {
      q: "How does TAXA guarantee 100% private data security?",
      a: "TAXA is architected with a private-first philosophy. All registration records, securely hashed passwords, active session histories, and uploaded document fragments are stored strictly inside a secure database on your host server. Your sensitive files and prompts are never mirrored onto external public servers."
    },
    {
      q: "What AI model is utilized and does it retain prompt history?",
      a: "TAXA leverages Google's advanced Gemini 2.5 Flash model via enterprise-grade secure gateways. Handshakes operate under secure encrypted transports, and queries are governed by standard Zero Data Retention policies—meaning your inputs and files are strictly used for real-time inference and are never stored or used to train public foundation models."
    },
    {
      q: "Can anyone register and access the workspace?",
      a: "Yes! Any user on the web can securely register an account, log in with their credentials, and establish their own isolated chat history environment. The database isolates session records by user ID, ensuring full privacy and dynamic usability across multiple clients."
    },
    {
      q: "Is the interface responsive and mobile-friendly?",
      a: "Absolutely. TAXA features a highly responsive, modern glassmorphic interface that adapts perfectly across multiple devices—including laptops, tablets, iOS/Android mobile screens, and wide office monitors. The interface scales automatically to optimize your screen space."
    }
  ];

  // Mouse Coordinate spotlight tracker
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, idx: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMouseCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFact((prev) => (prev + 1) % funFacts.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [funFacts.length]);

  return (
    <div className={`relative min-h-screen overflow-x-hidden transition-colors duration-500 selection:bg-[#7b2cbf]/40 font-sans ${!mounted || resolvedTheme === "dark" ? "bg-[#030006] text-white" : "bg-[#fbfafc] text-[#1f1a24]"}`}>
      
      {/* High-End Cinematic Background Glows */}
      <div className={`absolute top-[-15%] left-[-15%] z-0 h-[700px] w-[700px] rounded-full bg-gradient-to-br blur-[150px] pointer-events-none transition-all duration-500 ${resolvedTheme === 'light' ? 'from-[#7b2cbf]/6 to-[#c084fc]/0' : 'from-[#7b2cbf]/12 to-[#3c096c]/0'}`} />
      <div className={`absolute bottom-[-15%] right-[-15%] z-0 h-[700px] w-[700px] rounded-full bg-gradient-to-tl blur-[150px] pointer-events-none transition-all duration-500 ${resolvedTheme === 'light' ? 'from-[#e0aaff]/4 to-[#9d4edd]/0' : 'from-[#e0aaff]/8 to-[#9d4edd]/0'}`} />
      <div className={`absolute top-[40%] left-[30%] z-0 h-[450px] w-[450px] rounded-full blur-[130px] pointer-events-none transition-all duration-500 ${resolvedTheme === 'light' ? 'bg-[#7b2cbf]/2' : 'bg-[#7b2cbf]/4'}`} />

      {/* Modern Radial Dot Overlay */}
      <div className={`absolute inset-0 z-0 bg-[size:28px_28px] opacity-75 pointer-events-none transition-all duration-500 ${resolvedTheme === 'light' ? 'bg-[radial-gradient(#00000004_1px,transparent_1px)]' : 'bg-[radial-gradient(#ffffff02_1px,transparent_1px)]'}`}></div>
      
      {/* Sleek Floating Header Navigation */}
      <header className={`fixed top-0 left-0 right-0 z-40 backdrop-blur-xl border-b transition-all duration-300 ${resolvedTheme === 'light' ? 'bg-[#fbfafc]/75 border-black/[0.04]' : 'bg-[#07040a]/65 border-white/[0.03]'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#7b2cbf] to-[#c084fc] flex items-center justify-center border border-white/10 shadow-[0_0_15px_rgba(157,78,221,0.25)]">
              <Cpu className="w-4.5 h-4.5 text-white" />
            </div>
            <span className={`font-extrabold text-lg tracking-widest transition-colors uppercase ${resolvedTheme === 'light' ? 'text-[#1f1a24] group-hover:text-[#7b2cbf]' : 'text-white group-hover:text-[#c084fc]'}`}>TAXA</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-wider">
            <a href="#motive" className={`transition-colors ${resolvedTheme === 'light' ? 'text-zinc-500 hover:text-black' : 'text-zinc-400 hover:text-white'}`}>Our Motive</a>
            <a href="#pillars" className={`transition-colors ${resolvedTheme === 'light' ? 'text-zinc-500 hover:text-black' : 'text-zinc-400 hover:text-white'}`}>Core Pillars</a>
            <a href="#updates" className={`transition-colors ${resolvedTheme === 'light' ? 'text-zinc-500 hover:text-black' : 'text-zinc-400 hover:text-white'}`}>Technical Updates</a>
            <a href="#faq" className={`transition-colors ${resolvedTheme === 'light' ? 'text-zinc-500 hover:text-black' : 'text-zinc-400 hover:text-white'}`}>FAQ</a>
          </nav>
          
          <div className="flex items-center gap-3 relative">
            {userName && (
              <Button 
                onClick={() => {
                  localStorage.removeItem("omnimind_token");
                  localStorage.removeItem("omnimind_user");
                  localStorage.removeItem("omnimind_display_name");
                  setUserName("");
                }}
                size="sm" 
                className="hidden sm:inline-flex rounded-xl bg-red-950/20 border border-red-500/20 hover:bg-red-500/10 text-red-400 font-bold text-xs tracking-wider uppercase px-5 py-2 h-9 transition-all active:scale-95"
              >
                Sign Out
              </Button>
            )}

            {/* Floating Settings Dropdown Panel */}
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all active:scale-95 ${resolvedTheme === 'light' ? 'bg-black/5 border-black/10 text-zinc-700 hover:bg-black/10' : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10'}`}
                title="Workspace Settings"
              >
                <Settings className={`w-4.5 h-4.5 transition-transform duration-500 ${showSettings ? 'rotate-90 text-[#c084fc]' : ''}`} />
              </button>
              
              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className={`absolute right-0 mt-3.5 w-64 rounded-2xl border p-4.5 shadow-2xl backdrop-blur-2xl z-50 text-left ${resolvedTheme === 'light' ? 'bg-[#fbfafc]/95 border-black/10 shadow-black/5 text-[#1f1a24]' : 'bg-[#0b0612]/95 border-white/10 shadow-black/40 text-white'}`}
                  >
                    <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-white/5">
                      <h4 className="text-xs font-bold uppercase tracking-wider">System Settings</h4>
                      <div className="flex items-center gap-1.5 text-[9px] font-bold text-[#c084fc] bg-[#7b2cbf]/10 px-2 py-0.5 rounded-full uppercase">
                        <ShieldCheck className="w-3 h-3 text-[#c084fc]" /> Active
                      </div>
                    </div>
                    
                    {/* Theme Mode Selector */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Theme Style</label>
                      <div className={`grid grid-cols-3 gap-1 p-1 rounded-xl ${resolvedTheme === 'light' ? 'bg-black/5' : 'bg-black/40 border border-white/5'}`}>
                        {/* Dark Option */}
                        <button
                          onClick={() => {
                            setTheme("dark");
                            localStorage.setItem("omnimind_theme", "dark");
                          }}
                          className={`flex flex-col items-center gap-1 py-1.5 rounded-lg transition-all ${theme === 'dark' ? 'bg-[#7b2cbf] text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300 text-xs'}`}
                        >
                          <Moon className="w-3.5 h-3.5" />
                          <span className="text-[9px] font-semibold">Dark</span>
                        </button>
                        
                        {/* Light Option */}
                        <button
                          onClick={() => {
                            setTheme("light");
                            localStorage.setItem("omnimind_theme", "light");
                          }}
                          className={`flex flex-col items-center gap-1 py-1.5 rounded-lg transition-all ${theme === 'light' ? 'bg-[#7b2cbf] text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-400 text-xs'}`}
                        >
                          <Sun className="w-3.5 h-3.5" />
                          <span className="text-[9px] font-semibold">Light</span>
                        </button>
                        
                        {/* System Option */}
                        <button
                          onClick={() => {
                            setTheme("system");
                            localStorage.setItem("omnimind_theme", "system");
                          }}
                          className={`flex flex-col items-center gap-1 py-1.5 rounded-lg transition-all ${theme === 'system' ? 'bg-[#7b2cbf] text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-400 text-xs'}`}
                        >
                          <Laptop className="w-3.5 h-3.5" />
                          <span className="text-[9px] font-semibold">System</span>
                        </button>
                      </div>
                    </div>
                    
                    {/* Database & Connection Health Indicator */}
                    <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                      <div className="flex items-center justify-between text-[10px] text-zinc-400 font-medium">
                        <span>Database Node:</span>
                        <span className={`font-bold ${resolvedTheme === 'light' ? 'text-zinc-700' : 'text-zinc-200'}`}>SQLite-v3</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-zinc-400 font-medium">
                        <span>Handshake State:</span>
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                          Secure SSL
                        </span>
                      </div>
                    </div>

                    {userName && (
                      <div className="mt-4 pt-4 border-t border-white/5 sm:hidden">
                        <button
                          onClick={() => {
                            localStorage.removeItem("omnimind_token");
                            localStorage.removeItem("omnimind_user");
                            localStorage.removeItem("omnimind_display_name");
                            setUserName("");
                            setShowSettings(false);
                          }}
                          className="w-full py-2.5 rounded-xl bg-red-950/20 border border-red-500/20 hover:bg-red-500/10 text-red-400 font-bold text-xs tracking-wider uppercase transition-all active:scale-95 text-center"
                        >
                          Sign Out
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link href={userName ? "/chat" : "/login"}>
              <Button size="sm" className={`rounded-xl transition-all active:scale-95 font-bold text-xs tracking-wider uppercase px-5 py-2 h-9 ${resolvedTheme === 'light' ? 'bg-black/5 border border-black/10 hover:bg-[#7b2cbf]/10 hover:border-[#7b2cbf]/20 text-[#1f1a24]' : 'bg-white/5 border border-white/10 hover:bg-[#7b2cbf]/20 hover:border-[#c084fc]/30 text-white'}`}>
                <span className="hidden sm:inline">{userName ? "Enter " : "Access "}</span>
                <span>Workspace</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 pt-32 pb-24 sm:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Elegant Premium Badge */}
            <motion.div 
              variants={itemVariants} 
              className={`mb-8 inline-flex items-center gap-2 rounded-full border px-5 py-2 text-xs font-semibold backdrop-blur-xl shadow-lg transition-all duration-300 ${resolvedTheme === 'light' ? 'border-black/10 bg-black/[0.01] text-zinc-700' : 'border-white/10 bg-white/[0.02] text-zinc-300'}`}
            >
              <Sparkles className="h-4 w-4 text-[#9d4edd] animate-pulse" />
              <span className="tracking-widest uppercase">The Sovereign Intelligent Studio</span>
            </motion.div>

            {/* Glowing Hero Title */}
            <motion.h1 
              variants={itemVariants}
              className={`bg-gradient-to-br bg-clip-text pb-6 text-5xl font-black tracking-tight text-transparent sm:text-8xl lg:text-9xl relative uppercase transition-all duration-500 ${resolvedTheme === 'light' ? 'from-[#1f1a24] via-[#7b2cbf] to-[#c084fc]' : 'from-white via-[#f3e8ff] to-[#c084fc]'}`}
            >
              T A X A
              <div className="absolute left-1/2 bottom-[-10px] -translate-x-1/2 w-40 h-[3px] bg-gradient-to-r from-transparent via-[#9d4edd]/60 to-transparent blur-[1px]"></div>
            </motion.h1>
            
            {/* Meaning & Subtitle */}
            <motion.p 
              variants={itemVariants}
              className={`mt-8 max-w-3xl mx-auto text-base leading-8 sm:text-lg lg:text-xl font-light tracking-wide transition-all duration-300 ${resolvedTheme === 'light' ? 'text-zinc-600' : 'text-zinc-400'}`}
            >
              A high-end, secure, local-first artificial intelligence assistant that shapes raw, chaotic files and complex developer commands into elegant, structured solutions. Designed to maximize operational speed, multi-user accessibility, and data sovereignty.
            </motion.p>
            
            {/* Premium CTA Buttons */}
            <motion.div variants={itemVariants} className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-x-6">
              <Link href={userName ? "/chat" : "/login"}>
                <Button size="lg" className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-[#7b2cbf] to-[#9d4edd] px-9 text-white transition-all hover:scale-105 shadow-[0_0_30px_rgba(157,78,221,0.3)] hover:shadow-[0_0_40px_rgba(157,78,221,0.5)] h-14 border border-[#c084fc]/30">
                  <span className="relative z-10 flex items-center gap-2.5 font-semibold text-[15px] uppercase tracking-wider">
                    {userName ? `Enter TAXA Workspace (${getFriendlyName(displayName)})` : "Get Started Now"} 
                    <ArrowRight className="h-4.5 w-4.5 transition-transform group-hover:translate-x-1" />
                  </span>
                </Button>
              </Link>
            </motion.div>

            {/* SECTION 1: Our Motive & Purpose */}
            <motion.section 
              id="motive"
              variants={itemVariants}
              className={`mt-32 pt-16 border-t text-left transition-all duration-300 ${resolvedTheme === 'light' ? 'border-black/[0.04]' : 'border-white/[0.04]'}`}
            >
              <div className="max-w-3xl mx-auto text-center mb-16">
                <div className="inline-flex items-center gap-2 text-xs font-bold text-[#c084fc] uppercase tracking-widest mb-3.5">
                  <Flame className="h-4 w-4" /> The Motive
                </div>
                <h2 className={`text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight transition-all duration-300 ${resolvedTheme === 'light' ? 'text-[#1f1a24]' : 'text-white'}`}>
                  Chiseling Modern Complexity into Sovereign Clarity
                </h2>
                <p className={`mt-4 text-sm sm:text-base font-light leading-relaxed transition-all duration-300 ${resolvedTheme === 'light' ? 'text-zinc-600' : 'text-zinc-400'}`}>
                  In today's digital era, raw data represents uncarved blocks of marble—dense, fragmented, and full of untapped value. Our core motive is to provide developers, database engineers, and technical creators with a beautiful, unified workspace that operates with absolute speed and absolute privacy.
                </p>
              </div>

              {/* Grid of Challange vs TAXA Solution */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                <div className={`p-8 rounded-3xl border backdrop-blur-xl relative overflow-hidden transition-all duration-300 ${resolvedTheme === 'light' ? 'border-black/5 bg-black/[0.01]' : 'border-white/[0.03] bg-white/[0.005]'}`}>
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500/20"></div>
                  <h3 className={`text-lg font-bold mb-4 flex items-center gap-2.5 uppercase tracking-wide transition-all duration-300 ${resolvedTheme === 'light' ? 'text-zinc-800' : 'text-zinc-200'}`}>
                    <span className="w-2 h-2 rounded-full bg-red-500"></span> The Challenge
                  </h3>
                  <ul className={`space-y-4 text-xs sm:text-sm font-light leading-relaxed transition-all duration-300 ${resolvedTheme === 'light' ? 'text-zinc-600' : 'text-zinc-400'}`}>
                    <li className="flex items-start gap-3">
                      <span className="text-red-400 font-bold shrink-0 mt-0.5">✕</span>
                      <span>Fragmented data flows, confusing JSON payloads, and unstructured script logs.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-red-400 font-bold shrink-0 mt-0.5">✕</span>
                      <span>Expensive server latency, heavy response lags, and token limits that crash prompts.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-red-400 font-bold shrink-0 mt-0.5">✕</span>
                      <span>Privacy vulnerabilities where user credentials and logs are mirrored on external clouds.</span>
                    </li>
                  </ul>
                </div>

                <div className={`p-8 rounded-3xl border backdrop-blur-xl relative overflow-hidden shadow-2xl transition-all duration-300 ${resolvedTheme === 'light' ? 'border-[#7b2cbf]/10 bg-gradient-to-br from-[#7b2cbf]/5 to-transparent' : 'border-white/[0.05] bg-gradient-to-br from-white/[0.02] to-transparent'}`}>
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-[#c084fc]"></div>
                  <h3 className={`text-lg font-bold mb-4 flex items-center gap-2.5 uppercase tracking-wide transition-all duration-300 ${resolvedTheme === 'light' ? 'text-[#1f1a24]' : 'text-white'}`}>
                    <span className="w-2 h-2 rounded-full bg-[#c084fc]"></span> The TAXA Solution
                  </h3>
                  <ul className={`space-y-4 text-xs sm:text-sm font-light leading-relaxed transition-all duration-300 ${resolvedTheme === 'light' ? 'text-zinc-700' : 'text-zinc-300'}`}>
                    <li className="flex items-start gap-3">
                      <span className="text-emerald-400 font-bold shrink-0 mt-0.5">✓</span>
                      <span>Unified agentic intelligence that parses files, mockups, and spreadsheets instantly.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-emerald-400 font-bold shrink-0 mt-0.5">✓</span>
                      <span>Sub-second token streams utilizing ultra-fast Gemini 2.5 Flash engines.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-emerald-400 font-bold shrink-0 mt-0.5">✓</span>
                      <span>Strict data sovereignty with local SQLite caching, secure hashing, and zero-data-retention model gateways.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.section>

            {/* SECTION 2: Core Pillars */}
            <motion.section 
              id="pillars"
              variants={itemVariants}
              className={`mt-32 pt-16 border-t text-left transition-all duration-300 ${resolvedTheme === 'light' ? 'border-black/[0.04]' : 'border-white/[0.04]'}`}
            >
              <div className="max-w-3xl mx-auto text-center mb-16">
                <div className="inline-flex items-center gap-2 text-xs font-bold text-[#c084fc] uppercase tracking-widest mb-3.5">
                  <Cpu className="h-4 w-4" /> Core Pillars
                </div>
                <h2 className={`text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight transition-all duration-300 ${resolvedTheme === 'light' ? 'text-[#1f1a24]' : 'text-white'}`}>
                  Premium Intelligence Designed for Professionals
                </h2>
                <p className={`mt-4 text-sm sm:text-base font-light leading-relaxed transition-all duration-300 ${resolvedTheme === 'light' ? 'text-zinc-600' : 'text-zinc-400'}`}>
                  TAXA operates at the intersection of extreme speed, complete user security, and dynamic multi-device capabilities. Explore the pillars that power your daily productivity studio.
                </p>
              </div>

              {/* Spring-physics cards without raw code listings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                {corePillars.map((pillar, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ y: -6, scale: 1.015 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    onMouseMove={(e) => {
                      setHoveredIdx(idx);
                      handleMouseMove(e, idx);
                    }}
                    onMouseLeave={() => setHoveredIdx(null)}
                    className={`p-8 rounded-3xl border backdrop-blur-xl relative overflow-hidden transition-all shadow-lg flex flex-col justify-between group cursor-default select-none ${resolvedTheme === 'light' ? 'border-black/5 bg-black/[0.01] hover:bg-[#7b2cbf]/5 hover:border-[#7b2cbf]/10' : 'border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.025] hover:border-white/[0.08]'}`}
                  >
                    {/* Glowing spotlight track */}
                    {hoveredIdx === idx && (
                      <div 
                        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                        style={{
                          background: resolvedTheme === 'light' 
                            ? `radial-gradient(150px circle at ${mouseCoords.x}px ${mouseCoords.y}px, rgba(123, 44, 191, 0.05), transparent 80%)`
                            : `radial-gradient(150px circle at ${mouseCoords.x}px ${mouseCoords.y}px, rgba(157, 78, 221, 0.1), transparent 80%)`
                        }}
                      />
                    )}

                    <div className="space-y-4">
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${pillar.accent} flex items-center justify-center border border-white/10 text-white shrink-0 group-hover:scale-105 transition-transform duration-300 shadow-sm`}>
                        <pillar.icon className="w-5 h-5 text-white" />
                      </div>
                      <h3 className={`text-lg font-bold transition-colors ${resolvedTheme === 'light' ? 'text-zinc-800 group-hover:text-[#7b2cbf]' : 'text-zinc-200 group-hover:text-white'}`}>{pillar.title}</h3>
                      <p className={`text-xs sm:text-sm transition-colors font-light leading-relaxed ${resolvedTheme === 'light' ? 'text-zinc-500 group-hover:text-zinc-600' : 'text-[#77757f] group-hover:text-zinc-400'}`}>{pillar.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>

            {/* SECTION 3: Latest Trending Tech News */}
            <motion.section 
              id="updates"
              variants={itemVariants}
              className={`mt-32 pt-16 border-t text-left transition-all duration-300 ${resolvedTheme === 'light' ? 'border-black/[0.04]' : 'border-white/[0.04]'}`}
            >
              <div className="flex items-center gap-2.5 mb-10">
                <div className="h-2.5 w-2.5 rounded-full bg-[#c084fc] animate-ping"></div>
                <h2 className={`text-2xl font-bold tracking-tight flex items-center gap-2 transition-all duration-300 ${resolvedTheme === 'light' ? 'text-[#1f1a24]' : 'text-white'}`}>
                  <Activity className="h-5 w-5 text-[#c084fc]" /> Latest Trending Tech News
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {newsFeed.map((news, idx) => (
                  <div 
                    key={idx}
                    onClick={() => {
                      if (news.url) {
                        window.open(news.url, '_blank');
                      }
                    }}
                    className={`p-6 rounded-2xl border transition-all duration-300 flex flex-col justify-between h-full group cursor-pointer shadow-md ${resolvedTheme === 'light' ? 'border-black/5 bg-black/[0.005] hover:bg-[#7b2cbf]/5 hover:border-[#7b2cbf]/20' : 'border-white/[0.04] bg-white/[0.008] hover:bg-white/[0.025] hover:border-[#7b2cbf]/30'}`}
                  >
                    <div>
                      <div className="flex justify-between items-center text-[9px] font-bold tracking-wider text-[#c084fc] mb-4 uppercase">
                        <span>{news.tag}</span>
                        <span className="text-zinc-500 font-normal">{news.time}</span>
                      </div>
                      <h3 className={`text-base font-semibold group-hover:text-[#7b2cbf] transition-colors leading-snug ${resolvedTheme === 'light' ? 'text-zinc-800' : 'text-zinc-200'}`}>
                        {news.title}
                      </h3>
                      <p className={`mt-3 text-xs leading-relaxed transition-colors font-light line-clamp-4 ${resolvedTheme === 'light' ? 'text-zinc-500 group-hover:text-zinc-600' : 'text-[#77757f] group-hover:text-zinc-400'}`}>
                        {news.desc}
                      </p>
                    </div>

                    <div className={`mt-6 flex items-center gap-1.5 text-xs font-semibold transition-colors ${resolvedTheme === 'light' ? 'text-zinc-500 group-hover:text-[#7b2cbf]' : 'text-zinc-400 group-hover:text-[#c084fc]'}`}>
                      Read full article <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>

            {/* SECTION 4: Carousel Fact Slider */}
            <motion.div 
              variants={cardVariants}
              className={`mt-32 p-8 sm:p-10 rounded-3xl border backdrop-blur-2xl text-left relative overflow-hidden transition-all duration-500 ${resolvedTheme === 'light' ? 'border-black/5 bg-gradient-to-b from-black/[0.01] to-transparent' : 'border-white/[0.04] bg-gradient-to-b from-white/[0.015] to-transparent'}`}
            >
              <div className="absolute top-0 right-0 h-40 w-40 bg-[#7b2cbf]/4 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="lg:max-w-md">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#c084fc] uppercase tracking-widest mb-3">
                    <Info className="h-4 w-4" /> Workspace Insights
                  </div>
                  <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight leading-snug transition-colors duration-500 ${resolvedTheme === 'light' ? 'text-[#1f1a24]' : 'text-white'}`}>
                    Synthesizing raw complexity into structural gold
                  </h2>
                  <p className={`mt-4 text-xs sm:text-sm font-light leading-relaxed transition-colors duration-500 ${resolvedTheme === 'light' ? 'text-zinc-600' : 'text-zinc-400'}`}>
                    TAXA represents a sovereign developer environment. Whether optimizing large databases, parsing multi-modal images, generating complex coding modules, or dictating hands-free programming blocks—it delivers production-grade results with absolute security.
                  </p>
                </div>

                {/* Facts Slider */}
                <div className={`flex-1 lg:max-w-md w-full min-h-[160px] border p-6 rounded-2xl flex flex-col justify-between relative shadow-inner transition-colors duration-500 ${resolvedTheme === 'light' ? 'bg-black/5 border-black/10' : 'bg-black/40 border-white/[0.04]'}`}>
                  <AnimatePresence mode="wait">
                    <motion.div 
                      key={activeFact}
                      initial={{ opacity: 0, x: 15 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -15 }}
                      transition={{ duration: 0.4 }}
                      className="space-y-2.5"
                    >
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#c084fc] flex items-center gap-2">
                        <Flame className="h-3.5 w-3.5 text-[#c084fc]" /> Did you know?
                      </h4>
                      <h3 className={`text-base font-semibold transition-colors duration-500 ${resolvedTheme === 'light' ? 'text-zinc-800' : 'text-zinc-100'}`}>{funFacts[activeFact].title}</h3>
                      <p className={`text-xs sm:text-sm font-light leading-relaxed transition-colors duration-500 ${resolvedTheme === 'light' ? 'text-zinc-500' : 'text-zinc-400'}`}>{funFacts[activeFact].desc}</p>
                    </motion.div>
                  </AnimatePresence>

                  <div className="flex gap-1.5 mt-6">
                    {funFacts.map((_, idx) => (
                      <button 
                        key={idx}
                        onClick={() => setActiveFact(idx)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${activeFact === idx ? 'w-5 bg-[#c084fc]' : resolvedTheme === 'light' ? 'w-1.5 bg-zinc-300' : 'w-1.5 bg-zinc-700'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* SECTION 5: Polished Expanding FAQ Accordion */}
            <motion.section 
              id="faq"
              variants={itemVariants}
              className={`mt-32 pt-16 border-t text-left transition-colors duration-500 ${resolvedTheme === 'light' ? 'border-black/[0.04]' : 'border-white/[0.04]'}`}
            >
              <div className="max-w-3xl mx-auto text-center mb-16">
                <div className="inline-flex items-center gap-2 text-xs font-bold text-[#c084fc] uppercase tracking-widest mb-3.5">
                  <ShieldCheck className="h-4 w-4" /> Sovereign Trust
                </div>
                <h2 className={`text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight transition-colors duration-500 ${resolvedTheme === 'light' ? 'text-[#1f1a24]' : 'text-white'}`}>
                  Frequently Asked Questions
                </h2>
                <p className={`mt-4 text-sm sm:text-base font-light leading-relaxed transition-colors duration-500 ${resolvedTheme === 'light' ? 'text-zinc-600' : 'text-zinc-400'}`}>
                  Clear, informative answers about TAXA's multi-user setup, secure SQLite database storage, dynamic layout design, and zero-retention cloud integrations.
                </p>
              </div>

              <div className="max-w-3xl mx-auto space-y-4">
                {faqs.map((faq, idx) => {
                  const isOpen = activeFaqIdx === idx;
                  return (
                    <div 
                      key={idx}
                      className={`border rounded-2xl overflow-hidden transition-all duration-300 ${resolvedTheme === 'light' ? 'border-black/5 bg-black/[0.005]' : 'border-white/[0.04] bg-white/[0.005]'}`}
                    >
                      <button
                        onClick={() => setActiveFaqIdx(isOpen ? null : idx)}
                        className={`w-full flex items-center justify-between p-5 text-left font-bold text-sm sm:text-base transition-colors ${resolvedTheme === 'light' ? 'text-zinc-800 hover:text-black' : 'text-zinc-200 hover:text-white'}`}
                      >
                        <span className="pr-4">{faq.q}</span>
                        {isOpen ? <ChevronUp className="w-5 h-5 text-[#c084fc] shrink-0" /> : <ChevronDown className="w-5 h-5 text-zinc-500 shrink-0" />}
                      </button>
                      
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                          >
                            <div className={`p-5 pt-0 border-t text-xs sm:text-sm font-light leading-relaxed transition-colors duration-500 ${resolvedTheme === 'light' ? 'border-black/5 text-zinc-600' : 'border-white/[0.02] text-zinc-400'}`}>
                              {faq.a}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </motion.section>

            {/* Professional Footer */}
            <footer className={`mt-36 pt-8 border-t text-center text-xs font-light tracking-wide flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors duration-500 ${resolvedTheme === 'light' ? 'border-black/[0.04] text-zinc-500' : 'border-white/[0.03] text-zinc-600'}`}>
              <span className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" /> TAXA Enterprise Studio. Active, Secure, Uncensored.
              </span>
              <span className={`font-semibold uppercase text-[10px] tracking-wider transition-colors duration-500 ${resolvedTheme === 'light' ? 'text-zinc-400' : 'text-zinc-700'}`}>
                AES-256 Cloud Transports & SQLite Sovereignty Compliant
              </span>
            </footer>
          </motion.div>
        </div>
      </div>

      {/* Dynamic Glassmorphic Bulletins Modal Overlay */}
      <AnimatePresence>
        {activeNewsIdx !== null && (
          <div 
            onClick={() => setActiveNewsIdx(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 sm:p-6 transition-all duration-300"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl bg-[#0a0510]/95 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-[#12081d]/60 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#c084fc] animate-pulse"></div>
                  <span className="text-[10px] font-bold text-[#c084fc] tracking-wider uppercase">{newsFeed[activeNewsIdx].tag} Bulletin</span>
                </div>
                <button 
                  onClick={() => setActiveNewsIdx(null)}
                  className="text-zinc-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable text details */}
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-4 text-zinc-300 text-xs sm:text-sm font-light leading-relaxed scrollbar-thin scrollbar-thumb-white/[0.04]">
                <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight leading-snug">
                  {newsFeed[activeNewsIdx].title}
                </h3>
                <p className="text-[11px] text-zinc-500 font-semibold uppercase">{newsFeed[activeNewsIdx].time}</p>
                <div className="h-[1px] w-full bg-white/[0.05] my-4" />
                <p className="text-zinc-400 font-medium italic">
                  {newsFeed[activeNewsIdx].desc}
                </p>
                <p className="pt-2 text-zinc-300 leading-relaxed">
                  {newsFeed[activeNewsIdx].details}
                </p>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-zinc-900/50 flex justify-between items-center text-[10px] text-zinc-500 font-semibold uppercase tracking-wider shrink-0 border-t border-white/5">
                <span>TAXA Release Bulletin</span>
                <span>Secure Socket Channel</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
