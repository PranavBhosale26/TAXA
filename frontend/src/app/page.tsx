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
  Activity
} from "lucide-react";

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
  const [activeFact, setActiveFact] = useState(0);
  
  // Interactive Spotlight Grid State
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [mouseCoords, setMouseCoords] = useState({ x: 0, y: 0 });
  
  // Custom Interactive Web States
  const [activeFaqIdx, setActiveFaqIdx] = useState<number | null>(null);
  const [activeNewsIdx, setActiveNewsIdx] = useState<number | null>(null);

  useEffect(() => {
    const user = localStorage.getItem("omnimind_user");
    if (user) setUserName(user);
  }, []);

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
    <div className="relative min-h-screen overflow-x-hidden bg-[#030006] text-white selection:bg-[#7b2cbf]/40 font-sans">
      
      {/* High-End Cinematic Background Glows */}
      <div className="absolute top-[-15%] left-[-15%] z-0 h-[700px] w-[700px] rounded-full bg-gradient-to-br from-[#7b2cbf]/12 to-[#3c096c]/0 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-15%] z-0 h-[700px] w-[700px] rounded-full bg-gradient-to-tl from-[#e0aaff]/8 to-[#9d4edd]/0 blur-[150px] pointer-events-none" />
      <div className="absolute top-[40%] left-[30%] z-0 h-[450px] w-[450px] rounded-full bg-[#7b2cbf]/4 blur-[130px] pointer-events-none" />

      {/* Modern Radial Dot Overlay */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(#ffffff02_1px,transparent_1px)] bg-[size:28px_28px] opacity-75 pointer-events-none"></div>
      
      {/* Sleek Floating Header Navigation */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#07040a]/65 backdrop-blur-xl border-b border-white/[0.03] transition-all">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#7b2cbf] to-[#c084fc] flex items-center justify-center border border-white/10 shadow-[0_0_15px_rgba(157,78,221,0.25)]">
              <Cpu className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-extrabold text-lg tracking-widest text-white group-hover:text-[#c084fc] transition-colors uppercase">TAXA</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-zinc-400">
            <a href="#motive" className="hover:text-white transition-colors">Our Motive</a>
            <a href="#pillars" className="hover:text-white transition-colors">Core Pillars</a>
            <a href="#updates" className="hover:text-white transition-colors">Technical Updates</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>
          
          <div className="flex items-center gap-3">
            {userName && (
              <Button 
                onClick={() => {
                  localStorage.removeItem("omnimind_token");
                  localStorage.removeItem("omnimind_user");
                  setUserName("");
                }}
                size="sm" 
                className="rounded-xl bg-red-950/20 border border-red-500/20 hover:bg-red-500/10 text-red-400 font-bold text-xs tracking-wider uppercase px-5 py-2 h-9 transition-all active:scale-95"
              >
                Sign Out
              </Button>
            )}
            <Link href={userName ? "/chat" : "/login"}>
              <Button size="sm" className="rounded-xl bg-white/5 border border-white/10 hover:bg-[#7b2cbf]/20 hover:border-[#c084fc]/30 text-white font-bold text-xs tracking-wider uppercase px-5 py-2 h-9 transition-all active:scale-95">
                {userName ? "Enter Workspace" : "Access Workspace"}
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
              className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-5 py-2 text-xs font-semibold text-zinc-300 backdrop-blur-xl shadow-lg"
            >
              <Sparkles className="h-4 w-4 text-[#9d4edd] animate-pulse" />
              <span className="tracking-widest uppercase">The Sovereign Intelligent Studio</span>
            </motion.div>

            {/* Glowing Hero Title */}
            <motion.h1 
              variants={itemVariants}
              className="bg-gradient-to-br from-white via-[#f3e8ff] to-[#c084fc] bg-clip-text pb-6 text-6xl font-black tracking-tight text-transparent sm:text-8xl lg:text-9xl relative uppercase"
            >
              T A X A
              <div className="absolute left-1/2 bottom-[-10px] -translate-x-1/2 w-40 h-[3px] bg-gradient-to-r from-transparent via-[#9d4edd]/60 to-transparent blur-[1px]"></div>
            </motion.h1>
            
            {/* Meaning & Subtitle */}
            <motion.p 
              variants={itemVariants}
              className="mt-8 max-w-3xl mx-auto text-base leading-8 text-zinc-400 sm:text-lg lg:text-xl font-light tracking-wide"
            >
              A high-end, secure, local-first artificial intelligence assistant that shapes raw, chaotic files and complex developer commands into elegant, structured solutions. Designed to maximize operational speed, multi-user accessibility, and data sovereignty.
            </motion.p>
            
            {/* Premium CTA Buttons */}
            <motion.div variants={itemVariants} className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-x-6">
              <Link href={userName ? "/chat" : "/login"}>
                <Button size="lg" className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-[#7b2cbf] to-[#9d4edd] px-9 text-white transition-all hover:scale-105 shadow-[0_0_30px_rgba(157,78,221,0.3)] hover:shadow-[0_0_40px_rgba(157,78,221,0.5)] h-14 border border-[#c084fc]/30">
                  <span className="relative z-10 flex items-center gap-2.5 font-semibold text-[15px] uppercase tracking-wider">
                    {userName ? `Enter TAXA Workspace (${userName})` : "Get Started Now"} 
                    <ArrowRight className="h-4.5 w-4.5 transition-transform group-hover:translate-x-1" />
                  </span>
                </Button>
              </Link>
            </motion.div>

            {/* SECTION 1: Our Motive & Purpose */}
            <motion.section 
              id="motive"
              variants={itemVariants}
              className="mt-32 pt-16 border-t border-white/[0.04] text-left"
            >
              <div className="max-w-3xl mx-auto text-center mb-16">
                <div className="inline-flex items-center gap-2 text-xs font-bold text-[#c084fc] uppercase tracking-widest mb-3.5">
                  <Flame className="h-4 w-4" /> The Motive
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                  Chiseling Modern Complexity into Sovereign Clarity
                </h2>
                <p className="mt-4 text-sm sm:text-base text-zinc-400 font-light leading-relaxed">
                  In today's digital era, raw data represents uncarved blocks of marble—dense, fragmented, and full of untapped value. Our core motive is to provide developers, database engineers, and technical creators with a beautiful, unified workspace that operates with absolute speed and absolute privacy.
                </p>
              </div>

              {/* Grid of Challange vs TAXA Solution */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                <div className="p-8 rounded-3xl border border-white/[0.03] bg-white/[0.005] backdrop-blur-xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500/20"></div>
                  <h3 className="text-lg font-bold text-zinc-200 mb-4 flex items-center gap-2.5 uppercase tracking-wide">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span> The Challenge
                  </h3>
                  <ul className="space-y-4 text-xs sm:text-sm text-zinc-400 font-light leading-relaxed">
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

                <div className="p-8 rounded-3xl border border-white/[0.05] bg-gradient-to-br from-white/[0.02] to-transparent backdrop-blur-xl relative overflow-hidden shadow-2xl">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-[#c084fc]"></div>
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2.5 uppercase tracking-wide">
                    <span className="w-2 h-2 rounded-full bg-[#c084fc]"></span> The TAXA Solution
                  </h3>
                  <ul className="space-y-4 text-xs sm:text-sm text-zinc-300 font-light leading-relaxed">
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
              className="mt-32 pt-16 border-t border-white/[0.04] text-left"
            >
              <div className="max-w-3xl mx-auto text-center mb-16">
                <div className="inline-flex items-center gap-2 text-xs font-bold text-[#c084fc] uppercase tracking-widest mb-3.5">
                  <Cpu className="h-4 w-4" /> Core Pillars
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                  Premium Intelligence Designed for Professionals
                </h2>
                <p className="mt-4 text-sm sm:text-base text-zinc-400 font-light leading-relaxed">
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
                    className="p-8 rounded-3xl border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.025] hover:border-white/[0.08] backdrop-blur-xl relative overflow-hidden transition-all shadow-lg flex flex-col justify-between group cursor-default select-none"
                  >
                    {/* Glowing spotlight track */}
                    {hoveredIdx === idx && (
                      <div 
                        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                        style={{
                          background: `radial-gradient(150px circle at ${mouseCoords.x}px ${mouseCoords.y}px, rgba(157, 78, 221, 0.1), transparent 80%)`
                        }}
                      />
                    )}

                    <div className="space-y-4">
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${pillar.accent} flex items-center justify-center border border-white/10 text-white shrink-0 group-hover:scale-105 transition-transform duration-300 shadow-sm`}>
                        <pillar.icon className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-zinc-200 group-hover:text-white transition-colors">{pillar.title}</h3>
                      <p className="text-xs sm:text-sm text-zinc-500 group-hover:text-zinc-400 transition-colors font-light leading-relaxed">{pillar.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>

            {/* SECTION 3: Latest Trending Tech News */}
            <motion.section 
              id="updates"
              variants={itemVariants}
              className="mt-32 pt-16 border-t border-white/[0.04] text-left"
            >
              <div className="flex items-center gap-2.5 mb-10">
                <div className="h-2.5 w-2.5 rounded-full bg-[#c084fc] animate-ping"></div>
                <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
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
                    className="p-6 rounded-2xl border border-white/[0.04] bg-white/[0.008] hover:bg-white/[0.025] hover:border-[#7b2cbf]/30 transition-all duration-300 flex flex-col justify-between h-full group cursor-pointer shadow-md"
                  >
                    <div>
                      <div className="flex justify-between items-center text-[9px] font-bold tracking-wider text-[#c084fc] mb-4 uppercase">
                        <span>{news.tag}</span>
                        <span className="text-zinc-500 font-normal">{news.time}</span>
                      </div>
                      <h3 className="text-base font-semibold text-zinc-200 group-hover:text-white transition-colors leading-snug">
                        {news.title}
                      </h3>
                      <p className="mt-3 text-xs leading-relaxed text-zinc-500 group-hover:text-zinc-400 transition-colors font-light line-clamp-4">
                        {news.desc}
                      </p>
                    </div>

                    <div className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-zinc-400 group-hover:text-[#c084fc] transition-colors">
                      Read full article <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>

            {/* SECTION 4: Carousel Fact Slider */}
            <motion.div 
              variants={cardVariants}
              className="mt-32 p-8 sm:p-10 rounded-3xl border border-white/[0.04] bg-gradient-to-b from-white/[0.015] to-transparent backdrop-blur-2xl text-left relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 h-40 w-40 bg-[#7b2cbf]/4 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="lg:max-w-md">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#c084fc] uppercase tracking-widest mb-3">
                    <Info className="h-4 w-4" /> Workspace Insights
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
                    Synthesizing raw complexity into structural gold
                  </h2>
                  <p className="mt-4 text-xs sm:text-sm text-zinc-400 font-light leading-relaxed">
                    TAXA represents a sovereign developer environment. Whether optimizing large databases, parsing multi-modal images, generating complex coding modules, or dictating hands-free programming blocks—it delivers production-grade results with absolute security.
                  </p>
                </div>

                {/* Facts Slider */}
                <div className="flex-1 lg:max-w-md w-full min-h-[160px] bg-black/40 border border-white/[0.04] p-6 rounded-2xl flex flex-col justify-between relative shadow-inner">
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
                      <h3 className="text-base font-semibold text-zinc-100">{funFacts[activeFact].title}</h3>
                      <p className="text-xs sm:text-sm text-zinc-400 font-light leading-relaxed">{funFacts[activeFact].desc}</p>
                    </motion.div>
                  </AnimatePresence>

                  <div className="flex gap-1.5 mt-6">
                    {funFacts.map((_, idx) => (
                      <button 
                        key={idx}
                        onClick={() => setActiveFact(idx)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${activeFact === idx ? 'w-5 bg-[#c084fc]' : 'w-1.5 bg-zinc-700'}`}
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
              className="mt-32 pt-16 border-t border-white/[0.04] text-left"
            >
              <div className="max-w-3xl mx-auto text-center mb-16">
                <div className="inline-flex items-center gap-2 text-xs font-bold text-[#c084fc] uppercase tracking-widest mb-3.5">
                  <ShieldCheck className="h-4 w-4" /> Sovereign Trust
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                  Frequently Asked Questions
                </h2>
                <p className="mt-4 text-sm sm:text-base text-zinc-400 font-light leading-relaxed">
                  Clear, informative answers about TAXA's multi-user setup, secure SQLite database storage, dynamic layout design, and zero-retention cloud integrations.
                </p>
              </div>

              <div className="max-w-3xl mx-auto space-y-4">
                {faqs.map((faq, idx) => {
                  const isOpen = activeFaqIdx === idx;
                  return (
                    <div 
                      key={idx}
                      className="border border-white/[0.04] bg-white/[0.005] rounded-2xl overflow-hidden transition-all duration-300"
                    >
                      <button
                        onClick={() => setActiveFaqIdx(isOpen ? null : idx)}
                        className="w-full flex items-center justify-between p-5 text-left font-bold text-sm sm:text-base text-zinc-200 hover:text-white transition-colors"
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
                            <div className="p-5 pt-0 border-t border-white/[0.02] text-xs sm:text-sm text-zinc-400 font-light leading-relaxed">
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
            <footer className="mt-36 pt-8 border-t border-white/[0.03] text-center text-xs text-zinc-600 font-light tracking-wide flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" /> TAXA Enterprise Studio. Active, Secure, Uncensored.
              </span>
              <span className="font-semibold uppercase text-[10px] tracking-wider text-zinc-700">
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
