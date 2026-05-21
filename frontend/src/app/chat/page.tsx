"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Send, 
  Menu, 
  Plus, 
  MessageSquare, 
  Paperclip, 
  FileText, 
  Loader2, 
  Volume2, 
  Square, 
  Mic, 
  MicOff, 
  Headphones, 
  Search, 
  Trash2, 
  Library, 
  Settings, 
  LogOut, 
  RefreshCw, 
  X, 
  Sparkles, 
  FileImage,
  Layers,
  ChevronRight,
  HelpCircle,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getApiBaseUrl } from "@/lib/api";

type Message = { role: "user" | "assistant"; content: string; image_url?: string };
type Session = { id: string; title: string };
type ActiveTab = "chats" | "library";

type UploadedFile = {
  name: string;
  type: "image" | "text";
  content: string;
};

const generateSessionId = () => "session-" + Math.random().toString(36).substr(2, 9);

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // RAG / File attachment states
  const [attachedContext, setAttachedContext] = useState("");
  const [attachedFileName, setAttachedFileName] = useState("");
  const [attachedFileType, setAttachedFileType] = useState<"image" | "text" | "">("");
  const [attachedImage, setAttachedImage] = useState(""); // base64 representation
  
  const [userName, setUserName] = useState("Guest");
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  
  // Voice states
  const [isListening, setIsListening] = useState(false);
  const [isTwoWayMode, setIsTwoWayMode] = useState(false);
  
  // Session & UI States
  const [currentSessionId, setCurrentSessionId] = useState("");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<ActiveTab>("chats");
  
  // Setting Gear Dropdown State
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  
  // Library tracking (list of uploaded files in current workspace)
  const [libraryFiles, setLibraryFiles] = useState<UploadedFile[]>([]);
  
  // Help & Privacy Modal States
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // Mobile & Collapsible Sidebar States
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);


  // Auto-scroll messages to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Pre-load voices on mount to eliminate voice-bot delay
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  // Listen for Escape key to close active overlay modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowHelpModal(false);
        setShowPrivacyModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Initialize and Fetch History
  useEffect(() => {
    const user = localStorage.getItem("omnimind_user");
    if (!user) {
      router.push("/login");
      return;
    }
    setUserName(user);

    const fetchSessions = async () => {
      try {
        const apiBaseUrl = getApiBaseUrl();
        const res = await fetch(`${apiBaseUrl}/api/sessions/${user}`);
        if (res.ok) {
          const data = await res.json();
          setSessions(data);
          
          // Generate a fresh session to start
          const newSessionId = generateSessionId();
          setCurrentSessionId(newSessionId);
          setMessages([
            { 
              role: "assistant", 
              content: `Welcome to your data workshop, **${user}**. I am **TAXA**.` 
            }
          ]);
        }
      } catch (err) {
        setMessages([{ role: "assistant", content: "[TAXA Status]: Hands-free connection to the core server is offline. Run the backend to synchronize." }]);
      }
    };
    fetchSessions();
  }, [router]);

  // Load an existing session
  const loadSession = async (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setSearchQuery(""); // Clear search to see active item
    setIsSidebarOpen(false); // Close sidebar on mobile
    try {
      const apiBaseUrl = getApiBaseUrl();
      const res = await fetch(`${apiBaseUrl}/api/history/${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
      }
    } catch (err) {
      alert("Failed to reconstruct history for this chat block.");
    }
  };

  // Delete a specific session
  const deleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation(); // Avoid loading the session while deleting
    if (!confirm("Are you sure you want to discard this chat session?")) return;
    
    try {
      const apiBaseUrl = getApiBaseUrl();
      const res = await fetch(`${apiBaseUrl}/api/sessions/${sessionId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        // Remove from list
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        // If it was active, create a new fresh chat
        if (currentSessionId === sessionId) {
          createNewChat();
        }
      } else {
        alert("Failed to delete session.");
      }
    } catch (err) {
      alert("Failed to talk to backend.");
    }
  };

  // Clear all chats
  const clearAllChats = async () => {
    if (!confirm("CRITICAL WARNING: This will permanently delete all chat history. Proceed?")) return;
    try {
      const apiBaseUrl = getApiBaseUrl();
      const res = await fetch(`${apiBaseUrl}/api/sessions/clear/${userName}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setSessions([]);
        createNewChat();
        setShowSettingsMenu(false);
      }
    } catch (err) {
      alert("Failed to clear history.");
    }
  };

  // Create a new fresh session
  const createNewChat = () => {
    const newId = generateSessionId();
    setCurrentSessionId(newId);
    setMessages([
      { 
        role: "assistant", 
        content: `A fresh slate, **${userName}**. How can I help you today? Ask me any question, write code, or analyze files.` 
      }
    ]);
    // Clear current attachments
    clearAttachment();
    setIsSidebarOpen(false); // Close sidebar on mobile
  };

  const clearAttachment = () => {
    setAttachedContext("");
    setAttachedFileName("");
    setAttachedFileType("");
    setAttachedImage("");
  };

  // Handle PDF/Image/TXT uploads
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const apiBaseUrl = getApiBaseUrl();
      const res = await fetch(`${apiBaseUrl}/api/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setAttachedFileName(data.filename);
        setAttachedFileType(data.type);
        
        if (data.type === "image") {
          setAttachedImage(data.content);
          setAttachedContext("");
        } else {
          setAttachedContext(data.content);
          setAttachedImage("");
        }

        // Add to active library tracking
        const newLibFile: UploadedFile = {
          name: file.name,
          type: data.type,
          content: data.content
        };
        setLibraryFiles(prev => [newLibFile, ...prev]);
        
      } else {
        alert("Authentication/Extraction mismatch. Core failed to extract document.");
      }
    } catch (err) {
      alert("Failed to capture the structural soul of this file.");
    } finally {
      setUploading(false);
    }
  };

  // Send message with base64 multimodal image support
  const sendMessage = async (textOverride?: string) => {
    const messageText = textOverride !== undefined ? textOverride : input;
    if (!messageText.trim() && !attachedContext && !attachedImage) return;
    
    const userMsg: Message = { 
      role: "user", 
      content: messageText,
      image_url: attachedImage || undefined
    };

    // UI optimistic updates (render PDF icon if attaching document text)
    const displayMsg: Message = { 
      role: "user", 
      content: attachedFileName && attachedFileType === "text" 
        ? `📄 [Attached Document: ${attachedFileName}]\n\n${messageText}`
        : messageText,
      image_url: attachedImage || undefined
    };

    setMessages(prev => [...prev, displayMsg]);
    setInput("");
    
    // Cache current attachment data to pass in request body
    const activeFileName = attachedFileName;
    const activeFileContent = attachedContext;
    const isTextFile = attachedFileType === "text";

    // Clear active attachment indicators instantly for seamless texting
    clearAttachment();
    setLoading(true);

    // Strip massive base64 image data from historical messages to prevent huge payload transport lag
    const cleanedHistory = messages.map(m => ({
      role: m.role,
      content: m.content
    }));

    try {
      const apiBaseUrl = getApiBaseUrl();
      const res = await fetch(`${apiBaseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: [...cleanedHistory, userMsg], 
          session_id: currentSessionId, 
          username: userName,
          attached_file_content: isTextFile ? activeFileContent : null,
          attached_file_name: isTextFile ? activeFileName : null
        })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Connection lost");
      }
      
      const taxaResponse = data.response;
      setMessages(prev => [...prev, { role: "assistant", content: taxaResponse }]);
      
      // Update session titles in sidebar
      const sessRes = await fetch(`${apiBaseUrl}/api/sessions/${userName}`);
      if (sessRes.ok) {
        setSessions(await sessRes.json());
      }

      // Voice Response Integration
      if (isTwoWayMode) {
        speakText(taxaResponse, () => {
           if (isTwoWayMode) toggleListening(true);
        });
      }
      
    } catch (error) {
      setMessages(prev => [...prev, { role: "assistant", content: "[TAXA Connect Issue]: My cognitive line is fluctuating. Restart your local server engine." }]);
    } finally {
      setLoading(false);
    }
  };

  // Re-attach a document from the Library tab
  const attachLibraryFile = (file: UploadedFile) => {
    setAttachedFileName(file.name);
    setAttachedFileType(file.type);
    if (file.type === "image") {
      setAttachedImage(file.content);
      setAttachedContext("");
    } else {
      setAttachedContext(file.content);
      setAttachedImage("");
    }
    setActiveTab("chats"); // Swap back to chat view
    setIsSidebarOpen(false); // Close sidebar on mobile
  };

  // High-performance browser speech synthesis (Instant load)
  const speakText = (text: string, onEnd?: () => void) => {
    window.speechSynthesis.cancel(); // Cancel any delayed speaking instantly
    
    // Strip markdown formatting before speaking
    const cleanText = text.replace(/[*#`_\[\]()\-]/g, "").replace(/\n+/g, " ");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    const setVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        
        // Block harsh system voices
        const blockedNames = ["rishi", "daniel", "aaron", "alex", "fred", "guy"];
        const filteredVoices = voices.filter(v => !blockedNames.some(name => v.name.toLowerCase().includes(name)));
        
        // Prioritize clear female natural voices
        const femaleNames = ["veena", "lekha", "samantha", "victoria", "karen", "tessa", "moira", "fiona", "ava", "allison", "susan", "female"];
        let selectedVoice = filteredVoices.find(v => femaleNames.some(name => v.name.toLowerCase().includes(name)));
        
        if (!selectedVoice) {
            // Fallback English
            selectedVoice = filteredVoices.find(v => v.lang.startsWith("en-"));
        }
        
        if (selectedVoice) utterance.voice = selectedVoice;
    };
    
    setVoice();
    window.speechSynthesis.onvoiceschanged = setVoice;
    utterance.pitch = 1.05; // Perfect pleasant pitch
    utterance.rate = 1.15; // Natural conversational speed
    
    if (onEnd) utterance.onend = onEnd;
    window.speechSynthesis.speak(utterance);
  };

  // Speaks/Stops individual messages
  const handleSpeakMessage = (text: string, index: number) => {
    if (speakingIdx === index) {
      window.speechSynthesis.cancel();
      setSpeakingIdx(null);
      return;
    }
    setSpeakingIdx(index);
    speakText(text, () => setSpeakingIdx(null));
  };

  // Trigger continuous listening / speech-to-text
  const toggleListening = (autoSend: boolean = false) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your system browser does not support local speech recognition.");
      return;
    }
    
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setIsListening(false);
      
      if (autoSend || isTwoWayMode) {
        sendMessage(transcript);
      } else {
        setInput(prev => prev + (prev ? " " : "") + transcript);
      }
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    
    recognition.start();
  };

  const toggleTwoWayMode = () => {
    const nextState = !isTwoWayMode;
    setIsTwoWayMode(nextState);
    if (nextState) {
      toggleListening(true);
    } else {
      window.speechSynthesis.cancel();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("omnimind_token");
    localStorage.removeItem("omnimind_user");
    router.push("/login");
  };

  // Filter session logs using search query
  const filteredSessions = sessions.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex w-full h-screen bg-[#030006] text-zinc-100 overflow-hidden font-sans selection:bg-[#7b2cbf]/40">
      
      {/* Sidebar Redesign - Beautiful Claude/Gemini Styling */}
      {/* Sidebar Mobile Backdrop Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-35 bg-black/60 backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Panel - Responsive & Collapsible */}
      <div 
        className={`fixed md:relative top-0 bottom-0 left-0 z-40 flex w-72 flex-col shrink-0 border-r border-white/[0.04] bg-[#07040a]/95 md:bg-[#07040a]/90 backdrop-blur-3xl h-screen transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } ${isSidebarCollapsed ? "md:-translate-x-full md:w-0 md:border-r-0" : "md:translate-x-0 md:w-72"}`}
      >
        {/* Core TAXA Logo */}
        <div className="p-5 flex items-center justify-between border-b border-white/[0.03] shrink-0">
          <button 
            onClick={() => {
              setIsSidebarOpen(false); // Mobile
              setIsSidebarCollapsed(true); // Desktop
            }}
            className="flex items-center gap-3 font-extrabold text-xl text-white tracking-widest hover:opacity-80 transition-opacity active:scale-95 text-left"
            title="Collapse Sidebar"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#7b2cbf] to-[#c084fc] text-white flex items-center justify-center shadow-[0_0_15px_rgba(157,78,221,0.3)] border border-[#e0aaff]/15">
              <Layers className="w-4.5 h-4.5 text-white" />
            </div>
            TAXA
          </button>
          
          <div className="flex items-center gap-1">
            <Button 
              onClick={createNewChat}
              size="icon" 
              variant="ghost" 
              title="New Chat"
              className="rounded-lg h-9 w-9 text-zinc-400 hover:text-white hover:bg-white/5 transition-colors border border-white/[0.04]"
            >
              <Plus className="w-5 h-5" />
            </Button>
            
            {/* Mobile Close Button */}
            <Button
              onClick={() => setIsSidebarOpen(false)}
              size="icon"
              variant="ghost"
              className="md:hidden rounded-lg h-9 w-9 text-zinc-400 hover:text-white hover:bg-white/5 transition-colors border border-white/[0.04]"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Tab Selection Bar (Claude/Gemini Category Tabs) */}
        <div className="px-4 pt-4 pb-2 flex gap-1.5 justify-between shrink-0">
          {[
            { id: "chats", label: "Chats", icon: MessageSquare },
            { id: "library", label: "Library", icon: Library }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ActiveTab)}
              className={`flex-1 flex flex-col items-center gap-1.5 py-2 px-1 rounded-xl text-[10px] font-bold tracking-wider uppercase transition-all border ${
                activeTab === tab.id 
                  ? 'bg-white/[0.03] text-[#c084fc] border-white/[0.06] shadow-sm' 
                  : 'bg-transparent text-zinc-500 hover:text-zinc-300 border-transparent'
              }`}
            >
              <tab.icon className="w-4.5 h-4.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Chats Input (Only visible on Chats Tab) */}
        {activeTab === "chats" && (
          <div className="px-4 py-2 shrink-0">
            <div className="relative flex items-center bg-black/40 border border-white/[0.05] rounded-xl px-3 h-10 focus-within:ring-1 focus-within:ring-[#7b2cbf]/50 focus-within:border-[#7b2cbf]/50 transition-all">
              <Search className="w-4 h-4 text-zinc-500 mr-2" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sessions..."
                className="bg-transparent border-none outline-none text-xs text-zinc-200 placeholder:text-zinc-600 w-full"
              />
            </div>
          </div>
        )}

        {/* Dynamic Sidebar Body Content Panel */}
        <div className="flex-1 overflow-y-auto px-3.5 py-3 scrollbar-thin scrollbar-thumb-white/[0.04]">
          
          {/* TAB 1: Chat Sessions List */}
          {activeTab === "chats" && (
            <div className="space-y-1">
              <p className="px-2 pb-2 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Recent Chats</p>
              
              {filteredSessions.length === 0 ? (
                <div className="text-center py-8 text-xs text-zinc-600 font-light">
                  No sessions created yet.
                </div>
              ) : (
                filteredSessions.map(s => (
                  <div 
                    key={s.id} 
                    onClick={() => loadSession(s.id)}
                    className={`w-full flex items-center justify-between rounded-xl p-3 text-xs font-medium cursor-pointer transition-all border group ${
                      currentSessionId === s.id 
                        ? 'bg-gradient-to-r from-[#7b2cbf]/10 to-transparent text-white border-[#7b2cbf]/20' 
                        : 'text-zinc-400 hover:text-white hover:bg-white/[0.03] border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <MessageSquare className={`w-4 h-4 shrink-0 ${currentSessionId === s.id ? 'text-[#c084fc]' : 'text-zinc-600'}`} />
                      <span className="truncate pr-1">{s.title}</span>
                    </div>
                    
                    {/* Delete chat button (reveals on hover) */}
                    <button
                      onClick={(e) => deleteSession(e, s.id)}
                      title="Discard session"
                      className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity p-1.5 rounded-lg hover:bg-white/5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: Library (Uploaded Files) */}
          {activeTab === "library" && (
            <div className="space-y-3">
              <p className="px-1 pb-1.5 text-[10px] font-bold text-zinc-600 uppercase tracking-widest font-sans">Workspace Documents</p>
              
              {libraryFiles.length === 0 ? (
                <div className="text-center py-8 text-xs text-zinc-600 font-light flex flex-col items-center gap-2">
                  <FileText className="w-8 h-8 text-zinc-700" />
                  No documents in workspace cache.
                </div>
              ) : (
                libraryFiles.map((file, idx) => (
                  <div 
                    key={idx}
                    className="p-3 bg-black/40 border border-white/[0.04] rounded-xl flex items-center justify-between gap-2.5"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {file.type === "image" ? (
                        <FileImage className="w-5 h-5 text-[#c084fc] shrink-0" />
                      ) : (
                        <FileText className="w-5 h-5 text-[#c084fc] shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-zinc-200 truncate leading-tight">{file.name}</p>
                        <p className="text-[9px] text-zinc-600 font-medium uppercase mt-0.5">{file.type}</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => attachLibraryFile(file)}
                      size="sm"
                      variant="ghost"
                      className="text-[#c084fc] hover:bg-[#7b2cbf]/10 h-7 text-[10px] font-bold rounded-lg uppercase shrink-0"
                    >
                      Attach
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}

        </div>
        
        {/* Bottom User Profile card with Gear popup menu */}
        <div className="p-4 border-t border-white/[0.03] flex items-center justify-between bg-white/[0.005] shrink-0 relative">
           
           <div className="flex items-center gap-3 min-w-0">
             <Avatar className="w-9 h-9 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center text-sm font-bold border border-white/5 text-zinc-200">
                {userName.charAt(0).toUpperCase()}
             </Avatar>
             <div className="flex flex-col min-w-0">
               <span className="text-xs sm:text-sm font-semibold text-zinc-300 truncate">{userName}</span>
               <span className="text-[9px] text-[#c084fc] font-bold tracking-widest uppercase">Master Architect</span>
             </div>
           </div>

           {/* Settings Gear trigger button */}
           <Button
             onClick={() => setShowSettingsMenu(!showSettingsMenu)}
             size="icon"
             variant="ghost"
             className={`rounded-lg h-8 w-8 text-zinc-500 hover:text-white transition-colors hover:bg-white/5 ${showSettingsMenu ? 'text-white bg-white/5' : ''}`}
           >
             <Settings className="w-4 h-4" />
           </Button>

           {/* Elegant Settings Dropdown Menu */}
           <AnimatePresence>
             {showSettingsMenu && (
               <motion.div
                 initial={{ opacity: 0, y: 15 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: 15 }}
                 className="absolute bottom-16 right-4 w-52 bg-[#0d0714] border border-white/[0.06] rounded-2xl p-2.5 shadow-2xl z-30"
               >
                 <div className="px-2.5 py-1.5 border-b border-white/[0.04] mb-1.5 shrink-0">
                   <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Studio controls</p>
                 </div>
                 
                 <button
                   onClick={clearAllChats}
                   className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold text-zinc-400 hover:text-red-400 rounded-lg hover:bg-white/5 transition-all text-left"
                 >
                   <Trash2 className="w-4 h-4 shrink-0" />
                   Clear Chat History
                 </button>

                  <button
                    onClick={() => {
                      setShowHelpModal(true);
                      setShowSettingsMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-all text-left"
                  >
                    <HelpCircle className="w-4 h-4 shrink-0 text-[#c084fc]" />
                    Help Center
                  </button>

                  <button
                    onClick={() => {
                      setShowPrivacyModal(true);
                      setShowSettingsMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-all text-left"
                  >
                    <Shield className="w-4 h-4 shrink-0 text-[#c084fc]" />
                    Privacy & Legal
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold text-red-500 rounded-lg hover:bg-red-500/10 transition-all text-left"
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    Logout Session
                  </button>
               </motion.div>
             )}
           </AnimatePresence>
        </div>
      </div>

      {/* Main Chat Area - absolute Flex-column prevents any browser scroll overflow */}
      <div className="flex-1 flex flex-col relative h-screen bg-[#030006] overflow-hidden">
        
        {/* Sidebar Expand Trigger for Desktop (visible when collapsed) */}
        {isSidebarCollapsed && (
          <div className="hidden md:flex absolute top-5 left-5 z-30 animate-in fade-in duration-300">
            <button
              onClick={() => setIsSidebarCollapsed(false)}
              className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-bold text-zinc-400 hover:text-white bg-black/40 hover:bg-[#0d0714]/80 border border-white/[0.06] hover:border-white/15 backdrop-blur-md rounded-xl shadow-xl transition-all active:scale-95 group"
              title="Expand Sidebar"
            >
              <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-[#7b2cbf] to-[#c084fc] text-white flex items-center justify-center border border-white/10 shrink-0">
                <Layers className="w-3 h-3 text-white" />
              </div>
              <span className="opacity-0 w-0 group-hover:opacity-100 group-hover:w-auto transition-all duration-300 overflow-hidden whitespace-nowrap">Open Sidebar</span>
            </button>
          </div>
        )}

        {/* Soft Background Accents */}
        <div className="absolute top-0 right-0 -z-10 h-[600px] w-[600px] translate-x-1/3 -translate-y-1/3 rounded-full bg-[#7b2cbf]/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 -z-10 h-[600px] w-[600px] -translate-x-1/3 translate-y-1/3 rounded-full bg-[#c084fc]/3 blur-[120px] pointer-events-none" />

        {/* Mobile Header Banner */}
        <div className="md:hidden flex p-4 border-b border-white/[0.03] items-center justify-between bg-[#07040a]/90 backdrop-blur-xl z-10 shrink-0">
           <div className="flex items-center gap-2">
             <Button 
               onClick={() => setIsSidebarOpen(true)}
               variant="ghost" 
               size="icon" 
               className="text-zinc-400 h-9 w-9 hover:bg-white/5 rounded-lg mr-1"
             >
               <Menu className="w-5 h-5" />
             </Button>
             
             <div className="font-extrabold flex items-center gap-2 text-white tracking-widest text-lg">
               <div className="w-6.5 h-6.5 rounded-lg bg-gradient-to-br from-[#7b2cbf] to-[#c084fc] flex items-center justify-center border border-white/5"><Layers className="w-3.5 h-3.5 text-white"/></div>
               TAXA
             </div>
           </div>
           
           <div className="flex gap-2">
             <Button onClick={createNewChat} variant="ghost" size="icon" className="text-zinc-400 h-9 w-9 hover:bg-white/5 rounded-lg"><Plus className="w-4 h-4"/></Button>
             <Button onClick={handleLogout} variant="ghost" size="icon" className="text-zinc-500 hover:text-red-400 h-9 w-9 hover:bg-white/5 rounded-lg"><LogOut className="w-4 h-4"/></Button>
           </div>
        </div>

        {/* Scrollable Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 scrollbar-thin scrollbar-thumb-white/[0.04] scrollbar-track-transparent" style={{ direction: 'rtl' }}>
          <div className="max-w-4xl mx-auto space-y-8 pb-4" style={{ direction: 'ltr' }}>
            <AnimatePresence initial={false}>
              {messages.map((m, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-4 sm:gap-6 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <Avatar className="w-9 h-9 sm:w-10 sm:h-10 border border-white/5 shrink-0 shadow-lg rounded-xl overflow-hidden">
                    {m.role === 'assistant' ? (
                      <div className="bg-gradient-to-br from-[#12071d] to-[#040106] w-full h-full flex items-center justify-center border border-[#7b2cbf]/20">
                        <Layers className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-[#c084fc]" />
                      </div>
                    ) : (
                      <div className="bg-zinc-800 w-full h-full flex items-center justify-center">
                        <span className="text-xs sm:text-sm font-semibold text-zinc-300">{userName.charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                  </Avatar>
                  
                  <div className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} max-w-[85%] group`}>
                    
                    {/* Header: User name and voice speak icon */}
                    <div className="flex items-center gap-3 mb-1.5 px-1 text-[11px] font-semibold text-zinc-500 tracking-wider">
                      <span>{m.role === 'user' ? userName : 'TAXA'}</span>
                      {m.role === 'assistant' && (
                        <button 
                          onClick={() => handleSpeakMessage(m.content, i)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 hover:text-[#c084fc]"
                          title={speakingIdx === i ? "Stop Chisel Voice" : "Chisel Voice"}
                        >
                          {speakingIdx === i ? <Square className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                    
                    {/* Message Body Content */}
                    <div className={`p-4 sm:p-5 rounded-2xl text-[14.5px] leading-relaxed shadow-sm ${
                      m.role === 'user' 
                        ? 'bg-white/[0.025] text-zinc-100 rounded-tr-sm border border-white/[0.04]' 
                        : 'bg-transparent text-zinc-300 prose prose-invert prose-p:leading-relaxed prose-pre:bg-[#060408] prose-pre:border prose-pre:border-white/[0.05] max-w-none'
                    }`}>
                      {m.role === 'assistant' ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                      ) : (
                        <div className="space-y-3">
                          {/* Image preview thumbnail inside bubble */}
                          {m.image_url && (
                            <img 
                              src={m.image_url} 
                              alt="Uploaded Image" 
                              className="max-h-60 rounded-lg border border-white/10 shadow-lg object-contain"
                            />
                          )}
                          <span className="whitespace-pre-wrap">{m.content}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {/* Loading Indicator */}
            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-6">
                <Avatar className="w-10 h-10 shrink-0 rounded-xl">
                  <div className="bg-[#12071d] w-full h-full flex items-center justify-center animate-pulse border border-[#7b2cbf]/20 rounded-xl">
                    <Layers className="w-5 h-5 text-[#c084fc]" />
                  </div>
                </Avatar>
                <div className="flex items-center text-[#c084fc] text-sm font-semibold tracking-widest uppercase">
                  <span className="animate-pulse flex items-center gap-2">
                    <Sparkles className="w-4 h-4 animate-spin text-[#c084fc]" />
                    Thinking...
                  </span>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Input Text Box with attached preview thumbnail */}
        <div className="shrink-0 p-4 sm:p-6 bg-gradient-to-t from-[#030006] via-[#030006]/95 to-transparent z-10">
          <div className="max-w-4xl mx-auto flex flex-col gap-3">
            
            {/* Realtime Upload Preview Layout */}
            {attachedFileName && (
               <div className="flex items-center gap-2 px-3 py-2.5 bg-white/[0.02] text-zinc-300 text-xs font-semibold rounded-xl w-max border border-white/[0.05] shadow-2xl backdrop-blur-xl animate-fade-in">
                 {attachedFileType === "image" ? (
                   <div className="flex items-center gap-2">
                     <img src={attachedImage} alt="Attachment preview" className="w-8 h-8 rounded-lg object-cover border border-white/10 shrink-0" />
                     <span className="max-w-xs truncate">{attachedFileName}</span>
                   </div>
                 ) : (
                   <div className="flex items-center gap-2">
                     <FileText className="w-4.5 h-4.5 text-[#c084fc] shrink-0" />
                     <span className="max-w-xs truncate">{attachedFileName} (RAG ready)</span>
                   </div>
                 )}
                 
                 <button 
                   onClick={clearAttachment} 
                   className="ml-3 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-md p-1 shrink-0"
                 >
                   <X className="w-3.5 h-3.5" />
                 </button>
               </div>
            )}

            {/* Premium Chat Bar layout */}
            <div className="relative flex items-end bg-[#08040a]/90 backdrop-blur-3xl border border-white/[0.06] rounded-2xl p-2.5 focus-within:ring-1 focus-within:ring-[#7b2cbf]/50 focus-within:border-[#7b2cbf]/50 transition-all shadow-2xl">
              
              <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept=".pdf,.txt,.json,.csv,.png,.jpg,.jpeg,.webp" />
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => fileInputRef.current?.click()}
                disabled={loading || uploading}
                className="rounded-xl h-11 w-11 mb-0.5 ml-0.5 text-zinc-400 hover:text-white hover:bg-white/5 shrink-0 transition-colors"
                title="Upload file or image"
              >
                {uploading ? <Loader2 className="w-5 h-5 animate-spin text-[#c084fc]" /> : <Paperclip className="w-5 h-5" />}
              </Button>

              <textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                   if (e.key === 'Enter' && !e.shiftKey) {
                     e.preventDefault();
                     sendMessage();
                   }
                }}
                placeholder={isListening ? "Listening with local voice bot..." : "Ask me anything..."}
                className="w-full max-h-56 min-h-[44px] resize-none bg-transparent px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none font-light leading-relaxed"
                rows={1}
              />
              
              {/* Mic Icon listening indicator */}
              <Button 
                onClick={() => toggleListening()}
                variant="ghost"
                size="icon"
                title={isListening ? "Stop voice input" : "Speak voice input"}
                className={`rounded-xl h-11 w-11 mb-0.5 mr-1 shrink-0 transition-colors ${
                  isListening 
                    ? 'text-red-400 bg-red-500/10 animate-pulse border border-red-500/20' 
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </Button>

              {/* 2-Way continuous voice toggle */}
              <Button 
                onClick={toggleTwoWayMode}
                variant="ghost"
                size="icon"
                title={isTwoWayMode ? "Disable 2-Way Voice" : "Enable 2-Way Voice"}
                className={`rounded-xl h-11 w-11 mb-0.5 mr-1 shrink-0 transition-all border ${
                  isTwoWayMode 
                    ? 'bg-[#7b2cbf]/15 text-[#c084fc] border-[#7b2cbf]/30 shadow-md animate-pulse' 
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5 border-transparent'
                }`}
              >
                <Headphones className="w-5 h-5" />
              </Button>

              {/* Send Button */}
              <Button 
                onClick={() => sendMessage()}
                disabled={(!input.trim() && !attachedContext && !attachedImage) || loading}
                size="icon"
                className="rounded-xl h-11 w-11 mb-0.5 mr-0.5 bg-gradient-to-r from-[#7b2cbf] to-[#9d4edd] text-white hover:from-[#7b2cbf] hover:to-[#c084fc] transition-all active:scale-95 disabled:opacity-20 shrink-0 shadow-lg border border-[#c084fc]/35"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Help Center Dialog Overlay */}
      {showHelpModal && (
        <div 
          onClick={() => setShowHelpModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 sm:p-6 transition-all duration-300 animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl bg-[#09040e]/95 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-[#12081d]/60 shrink-0">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#c084fc]" />
                <h3 className="text-sm font-bold text-white tracking-wide uppercase">TAXA Workspace Help Center</h3>
              </div>
              <button 
                onClick={() => setShowHelpModal(false)}
                className="text-zinc-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-zinc-300 text-xs sm:text-sm font-light leading-relaxed scrollbar-thin scrollbar-thumb-white/[0.04] scrollbar-track-transparent">
              <section className="space-y-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#c084fc]"></span>
                  1. Workspace Essentials
                </h4>
                <p>
                  Welcome to <strong>TAXA</strong>, your professional AI assistant workspace designed for advanced programming, data engineering, and structured analysis. 
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-zinc-400">
                  <li><strong>Start a New Chat</strong>: Click the plus <code className="text-white bg-white/5 px-1 rounded">+</code> icon in the left sidebar to generate a fresh, secure session.</li>
                  <li><strong>Search chats</strong>: Use the sidebar text input to instantly filter active sessions and message history in real-time.</li>
                  <li><strong>Session Deletion</strong>: Click the trash bin icon next to any recent log in the sidebar to permanently clear it from the SQLite database.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#c084fc]"></span>
                  2. Document Management & RAG Engine
                </h4>
                <p>
                  TAXA handles raw text files, spreadsheets, code assets, and multi-modal image uploads. 
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-zinc-400">
                  <li><strong>Attachments</strong>: Click the paperclip icon inside the input bar to upload images (<code className="text-white bg-white/5 px-1 rounded">PNG</code>, <code className="text-white bg-white/5 px-1 rounded">JPG</code>, <code className="text-white bg-white/5 px-1 rounded">WEBP</code>) or text documents.</li>
                  <li><strong>Automated RAG</strong>: Documents exceeding 20,000 words are automatically chunked and indexed. TAXA uses a semantic keyword TF-IDF pipeline to inject only the most relevant passages, preserving prompt limits.</li>
                  <li><strong>Library Cache</strong>: Click the <strong>Library</strong> tab in the sidebar to inspect all files active in your current session.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#c084fc]"></span>
                  3. Voice Synthesis & Dictation
                </h4>
                <p>
                  TAXA features low-latency voice command dictation and active female vocal synthesis:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-zinc-400">
                  <li><strong>Voice Input</strong>: Click the microphone icon next to the chat bar to dictate commands. Dictation requires browser microphone permissions.</li>
                  <li><strong>Continuous Audio Feedback</strong>: Click the headphones toggle to enable automatic vocal responses. TAXA uses pre-fetched natural browser voices to eliminate synthesis lag.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#c084fc]"></span>
                  4. Frequently Asked Questions
                </h4>
                <div className="space-y-3 pl-2">
                  <div>
                    <h5 className="font-bold text-zinc-200">Is my data secure?</h5>
                    <p className="text-zinc-400 text-xs mt-0.5">Yes. TAXA implements standard session isolation and crypt-hashing. Your account, credentials, and conversation blocks remain securely isolated and stored inside the SQLite database, protected from unauthorized external access.</p>
                  </div>
                  <div>
                    <h5 className="font-bold text-zinc-200">Why does my voice command stop automatically?</h5>
                    <p className="text-zinc-400 text-xs mt-0.5">Web Speech API dictates text when you speak and automatically stops when you pause to compile your output prompt. Toggle continuous audio off and on to refresh dictation parameters.</p>
                  </div>
                </div>
              </section>
            </div>
            
            {/* Footer bar */}
            <div className="px-6 py-4 bg-zinc-900/50 flex justify-between items-center text-[10px] text-zinc-500 font-semibold uppercase tracking-wider shrink-0 border-t border-white/5">
              <span>TAXA Help Desk Active</span>
              <span>v1.0.0 Stable</span>
            </div>
          </div>
        </div>
      )}

      {/* Privacy & Legal Dialog Overlay */}
      {showPrivacyModal && (
        <div 
          onClick={() => setShowPrivacyModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 sm:p-6 transition-all duration-300 animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl bg-[#09040e]/95 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-[#12081d]/60 shrink-0">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#c084fc]" />
                <h3 className="text-sm font-bold text-white tracking-wide uppercase">Privacy Policy & Legal Disclosures</h3>
              </div>
              <button 
                onClick={() => setShowPrivacyModal(false)}
                className="text-zinc-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-zinc-300 text-xs sm:text-sm font-light leading-relaxed scrollbar-thin scrollbar-thumb-white/[0.04] scrollbar-track-transparent">
              <p className="text-zinc-400 italic">
                Last Updated: May 21, 2026. This Privacy & Legal Disclosure governs usage of the TAXA AI professional workspace.
              </p>

              <section className="space-y-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#c084fc]"></span>
                  1. Local Data Sovereignty & Storage
                </h4>
                <p>
                  TAXA operates under a local-first architectural model. 
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-zinc-400">
                  <li><strong>SQLite Storage</strong>: All registration schemas, user passwords (hashed securely using <code className="text-white bg-white/5 px-1 rounded">bcrypt</code>), message history, and text segments are written directly to your isolated, self-hosted local SQLite relational database instance.</li>
                  <li><strong>Workspace Cache</strong>: Uploaded files, document vectors, and base64 vision images are cached in the secure database directory. No remote database mirror is maintained.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#c084fc]"></span>
                  2. LLM Enterprise Connection Security
                </h4>
                <p>
                  To deliver sub-second, highly complex cognitive responses, TAXA transmits prompts, multimodal image segments, and semantic text RAG context to Google's Gemini-2.5-flash model via OpenRouter API endpoints.
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-zinc-400">
                  <li><strong>Zero Data Retention</strong>: In accordance with enterprise terms of service, queries sent to the model endpoints are strictly processed for real-time inference and <strong>are never stored, mirrored, or utilized for training</strong> public foundation models.</li>
                  <li><strong>Encrypted Transport</strong>: Handshakes and payloads sent to model gateways utilize TLS 1.3 transport layers to prevent packet inspection.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#c084fc]"></span>
                  3. User Control & Right to Erasure (GDPR / CCPA)
                </h4>
                <p>
                  TAXA fully enforces modern compliance rights regarding the erasure and deletion of your sensitive records:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-zinc-400">
                  <li><strong>Right to be Forgotten</strong>: Click "Clear Chat History" inside the settings gear panel to instantly run database purge sweeps that delete 100% of recorded message logs and uploaded documents.</li>
                  <li><strong>Identity Protection</strong>: TAXA uses secure user accounts with bcrypt-encrypted passwords. Every user's workspace is completely isolated, ensuring that other clients cannot access your active data streams or conversation history.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#c084fc]"></span>
                  4. Disclaimers & Usage License
                </h4>
                <p className="text-zinc-400">
                  TAXA is provided on an "as-is" basis for daily productivity and code optimization use. Content generated by LLMs represents synthetic intelligence outputs and should be verified for engineering correctness before production deployment.
                </p>
              </section>
            </div>
            
            {/* Footer bar */}
            <div className="px-6 py-4 bg-zinc-900/50 flex justify-between items-center text-[10px] text-zinc-500 font-semibold uppercase tracking-wider shrink-0 border-t border-white/5">
              <span>TAXA Legal Division</span>
              <span>AES-256 Compliant</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
