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
  Shield,
  Sun,
  Moon,
  Eye,
  EyeOff
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
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [isRecentChatsHidden, setIsRecentChatsHidden] = useState(false);
  
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
  const [voiceGender, setVoiceGender] = useState<"female" | "male">("female");
  const [isVoicePortalOpen, setIsVoicePortalOpen] = useState(false);
  const [voiceAssistantState, setVoiceAssistantState] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
  const [lastUserVoiceTranscript, setLastUserVoiceTranscript] = useState("");
  const [lastAssistantVoiceTranscript, setLastAssistantVoiceTranscript] = useState("");
  
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
  const isListeningRef = useRef(false);

  // Synchronous state refs to prevent stale closures in async voice handlers
  const isTwoWayModeRef = useRef(isTwoWayMode);
  const voiceGenderRef = useRef(voiceGender);
  const voiceAssistantStateRef = useRef(voiceAssistantState);
  const isMicPausedRef = useRef(false);
  const isInterruptedRef = useRef(false);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    isTwoWayModeRef.current = isTwoWayMode;
  }, [isTwoWayMode]);

  useEffect(() => {
    voiceGenderRef.current = voiceGender;
  }, [voiceGender]);

  useEffect(() => {
    voiceAssistantStateRef.current = voiceAssistantState;
  }, [voiceAssistantState]);



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
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.getVoices();
        };
      }
    }
  }, []);

  // Load theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("omnimind_theme") as "dark" | "light" | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("omnimind_theme", nextTheme);
  };

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
    const token = localStorage.getItem("omnimind_token");
    const user = localStorage.getItem("omnimind_user");
    if (!token || !user) {
      localStorage.removeItem("omnimind_token");
      localStorage.removeItem("omnimind_user");
      router.push("/login");
      return;
    }
    setUserName(user);

    const fetchSessions = async () => {
      try {
        const apiBaseUrl = getApiBaseUrl();
        const res = await fetch(`${apiBaseUrl}/api/sessions/${user}`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
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
        } else if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("omnimind_token");
          localStorage.removeItem("omnimind_user");
          router.push("/login");
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
      const token = localStorage.getItem("omnimind_token");
      const res = await fetch(`${apiBaseUrl}/api/history/${sessionId}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
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
      const token = localStorage.getItem("omnimind_token");
      const res = await fetch(`${apiBaseUrl}/api/sessions/${sessionId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
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
      const token = localStorage.getItem("omnimind_token");
      const res = await fetch(`${apiBaseUrl}/api/sessions/clear/${userName}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
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
      const token = localStorage.getItem("omnimind_token");
      const res = await fetch(`${apiBaseUrl}/api/upload`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
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
    
    // Check dynamic gender voice switch request
    const lowerText = messageText.toLowerCase();
    if (
      lowerText.includes("talk to a male") || 
      lowerText.includes("switch to male") || 
      lowerText.includes("switch to boy") || 
      lowerText.includes("talk to male") || 
      lowerText.includes("male voice") || 
      lowerText.includes("boy voice")
    ) {
      setVoiceGender("male");
      voiceGenderRef.current = "male";
      setInput("");
      clearAttachment();
      const confirmText = "Kabir switched in. Main Kabir hoon, aapka male voice assistant. How can I help you today?";
      setMessages(prev => [
        ...prev, 
        { role: "user", content: messageText },
        { role: "assistant", content: confirmText }
      ]);
      setLastUserVoiceTranscript(messageText);
      setLastAssistantVoiceTranscript(confirmText);
      setVoiceAssistantState("speaking");
      speakText(confirmText, () => {
        if (isTwoWayModeRef.current && !isMicPausedRef.current) {
          setVoiceAssistantState("listening");
          setTimeout(() => {
            if (isTwoWayModeRef.current && !isMicPausedRef.current && !isListeningRef.current) {
              toggleListening(true);
            }
          }, 250);
        } else {
          setVoiceAssistantState("idle");
        }
      });
      return;
    }

    if (
      lowerText.includes("talk to a female") || 
      lowerText.includes("switch to female") || 
      lowerText.includes("switch to girl") || 
      lowerText.includes("talk to female") || 
      lowerText.includes("female voice") || 
      lowerText.includes("girl voice")
    ) {
      setVoiceGender("female");
      voiceGenderRef.current = "female";
      setInput("");
      clearAttachment();
      const confirmText = "Anya switched in. Main Anya hoon, aapki female voice assistant. How can I help you today?";
      setMessages(prev => [
        ...prev, 
        { role: "user", content: messageText },
        { role: "assistant", content: confirmText }
      ]);
      setLastUserVoiceTranscript(messageText);
      setLastAssistantVoiceTranscript(confirmText);
      setVoiceAssistantState("speaking");
      speakText(confirmText, () => {
        if (isTwoWayModeRef.current && !isMicPausedRef.current) {
          setVoiceAssistantState("listening");
          setTimeout(() => {
            if (isTwoWayModeRef.current && !isMicPausedRef.current && !isListeningRef.current) {
              toggleListening(true);
            }
          }, 250);
        } else {
          setVoiceAssistantState("idle");
        }
      });
      return;
    }
    
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
      const token = localStorage.getItem("omnimind_token");
      const res = await fetch(`${apiBaseUrl}/api/chat`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
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
      const sessRes = await fetch(`${apiBaseUrl}/api/sessions/${userName}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (sessRes.ok) {
        setSessions(await sessRes.json());
      }

      // Voice Response Integration
      if (isTwoWayModeRef.current) {
        setVoiceAssistantState("speaking");
        setLastAssistantVoiceTranscript(taxaResponse);

        speakText(taxaResponse, () => {
           if (isTwoWayModeRef.current && !isMicPausedRef.current) {
              setVoiceAssistantState("listening");
              setTimeout(() => {
                if (isTwoWayModeRef.current && !isMicPausedRef.current && !isListeningRef.current) {
                  toggleListening(true);
                }
              }, 150);
           } else {
              setVoiceAssistantState("idle");
           }
        }, true);
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

  const openVoicePortal = async () => {
    setIsVoicePortalOpen(true);
    setIsTwoWayMode(true);
    isMicPausedRef.current = false; // Reset manual pause state
    setVoiceAssistantState("speaking");
    setLastUserVoiceTranscript("");
    
    // Explicit SpeechSynthesis unlock for Chrome/Safari autoplay policies
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.resume();
      const unlockUtterance = new SpeechSynthesisUtterance(" ");
      unlockUtterance.volume = 0.01;
      window.speechSynthesis.speak(unlockUtterance);
    }
    
    // Request microphone permission once upfront to avoid checking on every tick or breaking non-secure contexts
    if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err) {
        console.warn("Microphone access permission error or denied:", err);
      }
    }
    
    // Exact requested greeting: "Hi [Name], I'm TAXA. Tell me, how can I help you?"
    const greetingText = `Hi ${userName}, I'm TAXA. Tell me, how can I help you?`;
    setLastAssistantVoiceTranscript(greetingText);
    
    speakText(greetingText, () => {
      if (isTwoWayModeRef.current && !isMicPausedRef.current) {
        setVoiceAssistantState("listening");
        setTimeout(() => {
          if (isTwoWayModeRef.current && !isMicPausedRef.current && !isListeningRef.current) {
            toggleListening(true);
          }
        }, 150);
      }
    });
  };

  const closeVoicePortal = () => {
    setIsVoicePortalOpen(false);
    setIsTwoWayMode(false);
    isMicPausedRef.current = true; // Mark as paused to prevent restarts
    setVoiceAssistantState("idle");
    window.speechSynthesis.cancel();
    isListeningRef.current = false;
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {}
    }
  };

  // High-performance browser speech synthesis (Instant load & premium accents)
  const speakText = (text: string, onEnd?: () => void, isAsync: boolean = false) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      // Only call cancel if actively speaking/pending to prevent Chrome/Safari idle stuck issues
      if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
        window.speechSynthesis.cancel(); 
      }
      window.speechSynthesis.resume(); // Force-resume in case synthesis is in a stuck paused state!
    }
    
    // Strip markdown formatting before speaking to keep it highly fluent
    const cleanText = text
      .replace(/```[\s\S]*?```/g, "") // Remove all code blocks completely!
      .replace(/[*#`_\[\]()\-]/g, "")
      .replace(/\n+/g, " ")
      .trim();
      
    if (!cleanText) {
      if (onEnd) onEnd();
      return;
    }

    const startSpeaking = () => {
      if (typeof window === "undefined" || !window.speechSynthesis) {
        if (onEnd) onEnd();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.volume = 1.0; // Force full audibility output (1.0 = maximum volume)
      utterance.pitch = 1.0; // Pleasant human-like tone
      utterance.rate = 1.12; // Extremely natural, human conversational speed
      
      // Store reference persistently to completely prevent Chrome garbage-collection silent cutoff bugs!
      activeUtteranceRef.current = utterance;
      
      const setVoice = () => {
          const voices = window.speechSynthesis.getVoices();
          
          // Separate local offline-capable system voices from online cloud ones
          const localVoices = voices.filter(v => v.localService === true);
          const voicePool = localVoices.length > 0 ? localVoices : voices;
          
          if (voiceGender === "female") {
              // Prioritize premium Indian English/local female voices (Veena, Lekha, Aditi, Google India, en-IN) for flawless pronunciation of transliterated text
              const femaleNames = ["veena", "lekha", "aditi", "samantha", "heera", "monica", "victoria", "karen", "tessa", "moira", "fiona", "ava", "allison", "female", "zira", "hazel"];
              // 1. Try local en-IN female
              let selectedVoice = voicePool.find(v => 
                v.lang.toLowerCase().startsWith("en-in") && 
                femaleNames.some(name => v.name.toLowerCase().includes(name))
              );
              // 2. Try any local female
              if (!selectedVoice) {
                selectedVoice = voicePool.find(v => femaleNames.some(name => v.name.toLowerCase().includes(name)));
              }
              // 3. Try any local 'in' language voice
              if (!selectedVoice) {
                selectedVoice = voicePool.find(v => v.lang.toLowerCase().includes("in"));
              }
              // 4. Try any en- female voice
              if (!selectedVoice) {
                selectedVoice = voices.find(v => v.lang.startsWith("en-") && femaleNames.some(name => v.name.toLowerCase().includes(name)));
              }
              // 5. Try any female voice
              if (!selectedVoice) {
                selectedVoice = voices.find(v => femaleNames.some(name => v.name.toLowerCase().includes(name)));
              }
              
              if (selectedVoice) {
                utterance.voice = selectedVoice;
                utterance.lang = selectedVoice.lang;
              } else {
                utterance.lang = "en-IN"; // Explicit default fallback lang to guarantee local speech synthesis catalog engine is activated
              }
          } else {
              // Prioritize premium Indian English/local male voices (Rishi, Ravi, Google India, en-IN)
              const maleNames = ["rishi", "ravi", "david", "daniel", "aaron", "alex", "fred", "guy", "male", "george", "james"];
              // 1. Try local en-IN male
              let selectedVoice = voicePool.find(v => 
                v.lang.toLowerCase().startsWith("en-in") && 
                maleNames.some(name => v.name.toLowerCase().includes(name))
              );
              // 2. Try any local male
              if (!selectedVoice) {
                selectedVoice = voicePool.find(v => maleNames.some(name => v.name.toLowerCase().includes(name)));
              }
              // 3. Try any local 'in' language voice
              if (!selectedVoice) {
                selectedVoice = voicePool.find(v => v.lang.toLowerCase().includes("in"));
              }
              // 4. Try any en- male voice
              if (!selectedVoice) {
                selectedVoice = voices.find(v => v.lang.startsWith("en-") && maleNames.some(name => v.name.toLowerCase().includes(name)));
              }
              // 5. Try any male voice
              if (!selectedVoice) {
                selectedVoice = voices.find(v => maleNames.some(name => v.name.toLowerCase().includes(name)));
              }
              
              if (selectedVoice) {
                utterance.voice = selectedVoice;
                utterance.lang = selectedVoice.lang;
              } else {
                utterance.lang = "en-IN"; // Explicit default fallback lang
              }
          }
      };
      
      setVoice();
      // Only keep voiceschanged bound if we don't have voices loaded yet to avoid re-triggering mid-speech
      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = setVoice;
      }
      
      let hasEnded = false;
      const estimatedDuration = (cleanText.split(/\s+/).length * 450) + 2000;
      let speechTimeout: NodeJS.Timeout | null = null;
      const triggerEnd = () => {
        if (hasEnded) return;
        hasEnded = true;
        activeUtteranceRef.current = null; // Clear persistent ref on end to allow garbage collection
        if (speechTimeout) {
          clearTimeout(speechTimeout);
        }
        if (isInterruptedRef.current) {
          isInterruptedRef.current = false;
          return;
        }
        if (onEnd) onEnd();
      };
      
      utterance.onend = triggerEnd;
      utterance.onerror = (e) => {
        console.warn("Synthesis error", e);
        triggerEnd();
      };
      
      speechTimeout = setTimeout(() => {
        if (!hasEnded) {
          console.warn("Failsafe triggered for stuck speech synthesis.");
          if (typeof window !== "undefined" && window.speechSynthesis) {
            window.speechSynthesis.cancel();
          }
          triggerEnd();
        }
      }, estimatedDuration);
      
      window.speechSynthesis.speak(utterance);
    };

    if (isAsync) {
      // Buffer of 100ms for asynchronous speech synthesis triggers so Chrome/Safari audio thread completes cancel()
      setTimeout(startSpeaking, 100);
    } else {
      startSpeaking();
    }
  };

  // Speaks/Stops individual messages in standard chat bubbles
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
  const toggleListening = async (autoSend: boolean = false) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your system browser does not support local speech recognition.");
      return;
    }
    
    // Explicit microphone permission trigger
    if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err) {
        console.warn("Microphone access is required to use voice assistance:", err);
        isMicPausedRef.current = true; // Pause to prevent endless loop of error/alerts
        setVoiceAssistantState("idle");
        return;
      }
    }
    
    // Safely stop if already listening to prevent duplicate session crashes
    if (isListeningRef.current) {
      isMicPausedRef.current = true; // Mark as manually paused!
      isListeningRef.current = false;
      setIsListening(false);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (err) {}
      }
      return;
    }

    isMicPausedRef.current = false; // Reset manual pause state on activation
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = false;
    
    // Choose correct language support (en-IN captures English, Hindi, and transliterated accents spectacularly)
    recognition.lang = 'en-IN'; 

    recognition.onstart = () => {
      isListeningRef.current = true;
      setIsListening(true);
      if (voiceAssistantStateRef.current !== "speaking" && voiceAssistantStateRef.current !== "thinking") {
        setVoiceAssistantState("listening");
      }
    };

    // Hands-free interruption (Barge-in): instantly halt speaking and switch to listening when user starts speaking
    recognition.onspeechstart = () => {
      if (voiceAssistantStateRef.current === "speaking" || window.speechSynthesis.speaking) {
        isInterruptedRef.current = true;
        window.speechSynthesis.cancel();
        setVoiceAssistantState("listening");
      }
    };

    recognition.onsoundstart = () => {
      if (voiceAssistantStateRef.current === "speaking" || window.speechSynthesis.speaking) {
        isInterruptedRef.current = true;
        window.speechSynthesis.cancel();
        setVoiceAssistantState("listening");
      }
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      isListeningRef.current = false;
      setIsListening(false);
      setLastUserVoiceTranscript(transcript);
      setVoiceAssistantState("thinking");
      
      // Parse for local instant voice commands to switch genders seamlessly
      const cleanTranscript = transcript.toLowerCase().trim();
      if (
        cleanTranscript.includes("switch to male") || 
        cleanTranscript.includes("talk to male") || 
        cleanTranscript.includes("wanna talk with male") ||
        cleanTranscript.includes("switch to boy") || 
        cleanTranscript.includes("talk to boy") ||
        cleanTranscript.includes("male voice") || 
        cleanTranscript.includes("boy voice")
      ) {
        setVoiceGender("male");
        voiceGenderRef.current = "male";
        setVoiceAssistantState("speaking");
        const replyText = `Sure, switching to my male voice assistant. Kabir is now active and ready. Boliye, main aapki kya madad karoon?`;
        setLastAssistantVoiceTranscript(replyText);
        speakText(replyText, () => {
          if (isTwoWayModeRef.current && !isMicPausedRef.current) {
            setVoiceAssistantState("listening");
            setTimeout(() => {
              if (isTwoWayModeRef.current && !isMicPausedRef.current && !isListeningRef.current) {
                toggleListening(true);
              }
            }, 150);
          } else {
            setVoiceAssistantState("idle");
          }
        }, true);
        return; // Intercept: do not send to LLM
      } else if (
        cleanTranscript.includes("switch to female") || 
        cleanTranscript.includes("talk to female") || 
        cleanTranscript.includes("wanna talk with female") ||
        cleanTranscript.includes("switch to girl") || 
        cleanTranscript.includes("talk to girl") ||
        cleanTranscript.includes("female voice") || 
        cleanTranscript.includes("girl voice")
      ) {
        setVoiceGender("female");
        voiceGenderRef.current = "female";
        setVoiceAssistantState("speaking");
        const replyText = `Sure, switching to my female voice assistant. Anya is now active and ready. Boliye, main aapki kya madad karoon?`;
        setLastAssistantVoiceTranscript(replyText);
        speakText(replyText, () => {
          if (isTwoWayModeRef.current && !isMicPausedRef.current) {
            setVoiceAssistantState("listening");
            setTimeout(() => {
              if (isTwoWayModeRef.current && !isMicPausedRef.current && !isListeningRef.current) {
                toggleListening(true);
              }
            }, 150);
          } else {
            setVoiceAssistantState("idle");
          }
        }, true);
        return; // Intercept: do not send to LLM
      }

      if (autoSend || isTwoWayModeRef.current) {
        sendMessage(transcript);
      } else {
        setInput(prev => prev + (prev ? " " : "") + transcript);
      }
    };

    recognition.onerror = (e: any) => {
      isListeningRef.current = false;
      setIsListening(false);
      
      const errorType = e?.error || "unknown";
      // Silently swallow harmless warnings like "no-speech" or "aborted" to prevent dev overlay crashes
      if (errorType !== "no-speech" && errorType !== "aborted") {
        console.warn("Speech recognition warning:", errorType);
      }
      
      if (isTwoWayModeRef.current && !isMicPausedRef.current) {
        setTimeout(() => {
          if (isTwoWayModeRef.current && !isMicPausedRef.current && !isListeningRef.current) {
            toggleListening(true);
          }
        }, 1000);
      } else {
        setVoiceAssistantState("idle");
      }
    };

    recognition.onend = () => {
      isListeningRef.current = false;
      setIsListening(false);
      
      if (isTwoWayModeRef.current && !isMicPausedRef.current) {
        setTimeout(() => {
          // Restart loop if active
          if (
            isTwoWayModeRef.current && 
            !isMicPausedRef.current &&
            voiceAssistantStateRef.current !== "thinking" && 
            voiceAssistantStateRef.current !== "speaking" && 
            !isListeningRef.current
          ) {
            setVoiceAssistantState("listening");
            toggleListening(true);
          }
        }, 800);
      } else {
        if (!isTwoWayModeRef.current || isMicPausedRef.current) {
          setVoiceAssistantState("idle");
        }
      }
    };
    
    try {
      recognition.start();
    } catch (err) {
      console.warn("Speech recognition already active:", err);
    }
  };

  // Instant Tap/Click Interruption handler
  const handleInterrupt = () => {
    if (window.speechSynthesis.speaking || voiceAssistantStateRef.current === "speaking") {
      isInterruptedRef.current = true;
      window.speechSynthesis.cancel();
      isMicPausedRef.current = false;
      setVoiceAssistantState("listening");
      setTimeout(() => {
        if (isTwoWayModeRef.current && !isMicPausedRef.current && !isListeningRef.current) {
          toggleListening(true);
        }
      }, 100);
    }
  };

  // Listen for Spacebar to trigger instant voice barge-in/interruption
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isVoicePortalOpen) {
        if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
          return;
        }
        if (e.code === "Space") {
          e.preventDefault();
          handleInterrupt();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isVoicePortalOpen]);

  const toggleTwoWayMode = () => {
    if (!isTwoWayMode) {
      openVoicePortal();
    } else {
      closeVoicePortal();
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
    <div className={`flex w-full h-screen overflow-hidden font-sans transition-colors duration-300 ${
      theme === 'light' 
        ? 'bg-[#fbfafc] text-[#1f1a24] selection:bg-[#7b2cbf]/20' 
        : 'bg-[#030006] text-zinc-100 selection:bg-[#7b2cbf]/40'
    }`}>
      
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
        className={`fixed md:relative top-0 bottom-0 left-0 z-40 flex w-72 flex-col shrink-0 border-r h-screen transition-all duration-300 ease-in-out ${
          theme === 'light'
            ? 'border-[#7b2cbf]/10 bg-[#f3eff7]/95 md:bg-[#f3eff7]/90'
            : 'border-white/[0.04] bg-[#07040a]/95 md:bg-[#07040a]/90'
        } backdrop-blur-3xl ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } ${isSidebarCollapsed ? "md:-ml-72 md:border-r-0" : "md:ml-0"}`}
      >
        {/* Core TAXA Logo */}
        <div className={`p-5 flex items-center justify-between border-b shrink-0 ${
          theme === 'light' ? 'border-[#7b2cbf]/10' : 'border-white/[0.03]'
        }`}>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                setIsSidebarOpen(false); // Mobile
                setIsSidebarCollapsed(true); // Desktop
              }}
              className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#7b2cbf] to-[#c084fc] text-white flex items-center justify-center shadow-[0_0_15px_rgba(157,78,221,0.3)] border border-[#e0aaff]/15 hover:opacity-85 transition-opacity active:scale-95 shrink-0"
              title="Collapse Sidebar"
            >
              <Layers className="w-4.5 h-4.5 text-white" />
            </button>
            <button 
              onClick={() => router.push('/')}
              className={`font-extrabold text-xl tracking-widest hover:opacity-80 transition-all uppercase active:scale-95 ${
                theme === 'light' ? 'text-[#1a1523] hover:text-[#7b2cbf]' : 'text-white hover:text-[#c084fc]'
              }`}
              title="Go to Home"
            >
              TAXA
            </button>
          </div>
          
          <div className="flex items-center gap-1">
            <Button 
              onClick={createNewChat}
              size="icon" 
              variant="ghost" 
              title="New Chat"
              className={`rounded-lg h-9 w-9 transition-colors border ${
                theme === 'light'
                  ? 'text-zinc-600 hover:text-[#7b2cbf] hover:bg-[#7b2cbf]/5 border-[#7b2cbf]/10'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5 border-white/[0.04]'
              }`}
            >
              <Plus className="w-5 h-5" />
            </Button>
            
            {/* Mobile Close Button */}
            <Button
              onClick={() => setIsSidebarOpen(false)}
              size="icon"
              variant="ghost"
              className={`md:hidden rounded-lg h-9 w-9 transition-colors border ${
                theme === 'light'
                  ? 'text-zinc-600 hover:text-[#7b2cbf] hover:bg-[#7b2cbf]/5 border-[#7b2cbf]/10'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5 border-white/[0.04]'
              }`}
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
                  ? theme === 'light'
                    ? 'bg-[#7b2cbf]/10 text-[#7b2cbf] border-[#7b2cbf]/20 shadow-sm'
                    : 'bg-white/[0.03] text-[#c084fc] border-white/[0.06] shadow-sm' 
                  : theme === 'light'
                    ? 'bg-transparent text-zinc-500 hover:text-[#7b2cbf] border-transparent'
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
            <div className={`relative flex items-center border rounded-xl px-3 h-10 transition-all ${
              theme === 'light'
                ? 'bg-white border-[#7b2cbf]/20 focus-within:ring-1 focus-within:ring-[#7b2cbf] focus-within:border-[#7b2cbf]'
                : 'bg-black/40 border-white/[0.05] focus-within:ring-1 focus-within:ring-[#7b2cbf]/50 focus-within:border-[#7b2cbf]/50'
            }`}>
              <Search className="w-4 h-4 text-zinc-500 mr-2" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sessions..."
                className={`bg-transparent border-none outline-none text-xs w-full ${
                  theme === 'light' ? 'text-zinc-800 placeholder:text-zinc-400' : 'text-zinc-200 placeholder:text-zinc-600'
                }`}
              />
            </div>
          </div>
        )}

        {/* Dynamic Sidebar Body Content Panel */}
        <div className="flex-1 overflow-y-auto px-3.5 py-3 scrollbar-thin scrollbar-thumb-white/[0.04]">
          
          {/* TAB 1: Chat Sessions List */}
          {activeTab === "chats" && (
            <div className="space-y-1">
              <div className="flex items-center justify-between px-2 pb-2">
                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Recent Chats</p>
                <button 
                  onClick={() => setIsRecentChatsHidden(!isRecentChatsHidden)}
                  title={isRecentChatsHidden ? "Show Recent Chats" : "Hide Recent Chats"}
                  className="text-zinc-500 hover:text-white transition-colors p-0.5 rounded hover:bg-white/5"
                >
                  {isRecentChatsHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              
              {!isRecentChatsHidden && (
                filteredSessions.length === 0 ? (
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
                          ? theme === 'light'
                            ? 'bg-gradient-to-r from-[#7b2cbf]/8 to-transparent text-[#7b2cbf] border-[#7b2cbf]/15 shadow-[0_2px_8px_rgba(123,44,191,0.06)]'
                            : 'bg-gradient-to-r from-[#7b2cbf]/10 to-transparent text-white border-[#7b2cbf]/20' 
                          : theme === 'light'
                            ? 'text-zinc-600 hover:text-[#7b2cbf] hover:bg-[#7b2cbf]/5 border-transparent'
                            : 'text-zinc-400 hover:text-white hover:bg-white/[0.03] border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <MessageSquare className={`w-4 h-4 shrink-0 ${
                          currentSessionId === s.id 
                            ? 'text-[#c084fc]' 
                            : theme === 'light' ? 'text-zinc-400 group-hover:text-[#7b2cbf]' : 'text-zinc-600 group-hover:text-white'
                        }`} />
                        <span className="truncate pr-1">{s.title}</span>
                      </div>
                      
                      {/* Delete chat button (reveals on hover) */}
                      <button
                        onClick={(e) => deleteSession(e, s.id)}
                        title="Discard session"
                        className={`opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg ${
                          theme === 'light' ? 'hover:bg-[#7b2cbf]/5 hover:text-red-500' : 'hover:bg-white/5 hover:text-red-400'
                        }`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )
              )}
            </div>
          )}

          {/* TAB 2: Library (Uploaded Files) */}
          {activeTab === "library" && (
            <div className="space-y-3">
              <p className={`px-1 pb-1.5 text-[10px] font-bold uppercase tracking-widest font-sans ${
                theme === 'light' ? 'text-zinc-400' : 'text-zinc-600'
              }`}>Workspace Documents</p>
              
              {libraryFiles.length === 0 ? (
                <div className={`text-center py-8 text-xs font-light flex flex-col items-center gap-2 ${
                  theme === 'light' ? 'text-zinc-400' : 'text-zinc-600'
                }`}>
                  <FileText className={`w-8 h-8 ${theme === 'light' ? 'text-[#7b2cbf]/20' : 'text-zinc-700'}`} />
                  No documents in workspace cache.
                </div>
              ) : (
                libraryFiles.map((file, idx) => (
                  <div 
                    key={idx}
                    className={`p-3 border rounded-xl flex items-center justify-between gap-2.5 transition-colors ${
                      theme === 'light'
                        ? 'bg-white border-[#7b2cbf]/10 shadow-sm'
                        : 'bg-black/40 border-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {file.type === "image" ? (
                        <FileImage className="w-5 h-5 text-[#c084fc] shrink-0" />
                      ) : (
                        <FileText className="w-5 h-5 text-[#c084fc] shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-bold truncate leading-tight ${
                          theme === 'light' ? 'text-[#1a1523]' : 'text-zinc-200'
                        }`}>{file.name}</p>
                        <p className={`text-[9px] font-medium uppercase mt-0.5 ${
                          theme === 'light' ? 'text-zinc-400' : 'text-zinc-600'
                        }`}>{file.type}</p>
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
                   onClick={toggleTheme}
                   className="w-full flex items-center justify-between px-2.5 py-2 text-xs font-semibold text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-all text-left"
                 >
                   <div className="flex items-center gap-2.5">
                     {theme === "dark" ? (
                       <Sun className="w-4 h-4 shrink-0 text-amber-400" />
                     ) : (
                       <Moon className="w-4 h-4 shrink-0 text-[#7b2cbf]" />
                     )}
                     <span>Appearance</span>
                   </div>
                   <span className="text-[9px] font-extrabold text-zinc-500 uppercase tracking-widest px-1.5 py-0.5 rounded bg-white/5">
                     {theme === "dark" ? "Dark" : "Light"}
                   </span>
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
      <div className={`flex-1 flex flex-col relative h-screen transition-colors duration-300 overflow-hidden ${
        theme === 'light' ? 'bg-[#fbfafc]' : 'bg-[#030006]'
      }`}>
        
        {/* Top Floating Action Bar (Desktop only) */}
        <div className="hidden md:flex absolute top-5 right-5 z-30 gap-3 items-center">
          <button
            onClick={openVoicePortal}
            className="relative flex items-center gap-2.5 px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-[#7b2cbf] to-[#9d4edd] hover:from-[#8b3cd3] hover:to-[#a85cfc] border border-[#c084fc]/40 rounded-full shadow-[0_0_15px_rgba(123,44,191,0.3)] hover:shadow-[0_0_25px_rgba(123,44,191,0.5)] transition-all active:scale-95 group overflow-hidden"
            title="TAXA Voice Assistance"
          >
            {/* Pulsing ring highlights */}
            <span className="absolute inset-0 w-full h-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            <Headphones className="w-4 h-4 text-purple-100 group-hover:rotate-[360deg] transition-transform duration-700 shrink-0" />
            <span>TAXA Voice Assistance</span>
            <span className="flex h-2.5 w-2.5 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 shadow-[0_0_8px_#34d399]"></span>
            </span>
          </button>
        </div>
        
        {/* Sidebar Expand Trigger for Desktop (visible when collapsed) */}
        {isSidebarCollapsed && (
          <div className="hidden md:flex absolute top-5 left-5 z-50 animate-in fade-in duration-300">
            <button
              onClick={() => setIsSidebarCollapsed(false)}
              className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#7b2cbf] to-[#c084fc] text-white flex items-center justify-center shadow-[0_0_15px_rgba(157,78,221,0.3)] border border-[#e0aaff]/15 hover:opacity-85 transition-opacity active:scale-95 shrink-0"
              title="Expand Sidebar"
            >
              <Layers className="w-4.5 h-4.5 text-white" />
            </button>
          </div>
        )}

        {/* Soft Background Accents */}
        <div className={`absolute top-0 right-0 -z-10 h-[600px] w-[600px] translate-x-1/3 -translate-y-1/3 rounded-full blur-[120px] pointer-events-none transition-opacity ${
          theme === 'light' ? 'bg-[#7b2cbf]/3' : 'bg-[#7b2cbf]/5'
        }`} />
        <div className={`absolute bottom-0 left-0 -z-10 h-[600px] w-[600px] -translate-x-1/3 translate-y-1/3 rounded-full blur-[120px] pointer-events-none transition-opacity ${
          theme === 'light' ? 'bg-[#c084fc]/1.5' : 'bg-[#c084fc]/3'
        }`} />

        {/* Mobile Header Banner */}
        <div className={`md:hidden flex p-4 border-b items-center justify-between backdrop-blur-xl z-20 shrink-0 ${
          theme === 'light'
            ? 'border-[#7b2cbf]/10 bg-[#f3eff7]/90'
            : 'border-white/[0.03] bg-[#07040a]/90'
        }`}>
           <div className="flex items-center gap-2">
             <Button 
               onClick={() => {
                 setIsSidebarOpen(true);
                 setIsSidebarCollapsed(false);
               }}
               variant="ghost" 
               size="icon" 
               className="text-zinc-400 h-9 w-9 hover:bg-white/5 rounded-lg mr-1"
             >
               <Menu className="w-5 h-5" />
             </Button>
             <div className={`font-extrabold flex items-center gap-2 tracking-widest text-lg ${
                theme === 'light' ? 'text-[#1f1a24]' : 'text-white'
              }`}>
                <div className={`w-6.5 h-6.5 rounded-lg bg-gradient-to-br from-[#7b2cbf] to-[#c084fc] flex items-center justify-center border ${
                  theme === 'light' ? 'border-black/5' : 'border-white/5'
                }`}><Layers className="w-3.5 h-3.5 text-white"/></div>
                TAXA
              </div>
           </div>
           
           <div className="flex gap-2 items-center">
              <button 
                onClick={openVoicePortal} 
                className="relative flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-white bg-gradient-to-r from-[#7b2cbf] to-[#9d4edd] border border-[#c084fc]/30 rounded-full shadow-[0_0_10px_rgba(123,44,191,0.2)] active:scale-[0.93] group" 
                title="TAXA Voice Assistance"
              >
                <Headphones className="w-3.5 h-3.5 text-purple-100 group-hover:rotate-[360deg] transition-transform duration-700 shrink-0" />
                <span className="hidden sm:inline">TAXA Voice</span>
                <span className="flex h-1.5 w-1.5 relative shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
                </span>
              </button>
             <Button onClick={createNewChat} variant="ghost" size="icon" className="text-zinc-400 h-9 w-9 hover:bg-white/5 rounded-lg"><Plus className="w-4 h-4"/></Button>
             <Button onClick={handleLogout} variant="ghost" size="icon" className="text-zinc-500 hover:text-red-400 h-9 w-9 hover:bg-white/5 rounded-lg"><LogOut className="w-4 h-4"/></Button>
           </div>
        </div>

        {/* Scrollable Messages Area */}
        <div ref={scrollRef} className={`flex-1 overflow-y-auto p-4 sm:p-8 scrollbar-thin scrollbar-track-transparent ${
          theme === 'light' ? 'scrollbar-thumb-[#7b2cbf]/10' : 'scrollbar-thumb-white/[0.04]'
        }`} style={{ direction: 'rtl' }}>
          <div className={`max-w-4xl mx-auto pb-4 ${!messages.some(m => m.role === 'user') ? 'h-full flex flex-col justify-center' : 'space-y-8'}`} style={{ direction: 'ltr' }}>
            {!messages.some(m => m.role === 'user') ? (
              <div className="flex-1 flex flex-col items-center justify-center py-6 sm:py-12 px-4 select-none">
                {/* Center-aligned large title */}
                <h1 className="text-center font-extrabold tracking-tight text-3xl sm:text-5xl leading-tight mb-2">
                  <span className="bg-gradient-to-r from-[#7b2cbf] via-[#c084fc] to-[#7b2cbf] bg-clip-text text-transparent animate-pulse">
                    Hi, {userName}.
                  </span>
                  <br />
                  <span className={theme === 'light' ? 'text-zinc-700' : 'text-zinc-300'}>
                    How can I help you today?
                  </span>
                </h1>
                
                {/* Orbital energy sphere */}
                <div className="relative w-36 h-36 my-6 flex items-center justify-center scale-90 sm:scale-100">
                  {/* Outer pulse ring */}
                  <div className="absolute inset-0 rounded-full bg-[#7b2cbf]/10 blur-xl animate-pulse"></div>
                  {/* Ring 1 */}
                  <div className="absolute w-28 h-28 rounded-full border border-[#7b2cbf]/25 animate-spin" style={{ animationDuration: '8s' }}></div>
                  {/* Ring 2 */}
                  <div className="absolute w-22 h-22 rounded-full border border-dashed border-[#c084fc]/30 animate-spin" style={{ animationDuration: '4s', animationDirection: 'reverse' }}></div>
                  {/* Ring 3 */}
                  <div className="absolute w-16 h-16 rounded-full border border-dotted border-[#7b2cbf]/40 animate-pulse"></div>
                  {/* Core Sphere */}
                  <div className="absolute w-12 h-12 rounded-full bg-gradient-to-tr from-[#7b2cbf] to-[#c084fc] shadow-[0_0_25px_rgba(123,44,191,0.65)] hover:scale-110 transition-transform duration-500 cursor-pointer"></div>
                </div>

                {/* Suggestion cards grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl mb-8">
                  {[
                    {
                      title: "Mock Interview Prep",
                      desc: "Upload a resume or practice core software concepts",
                      prompt: "Help me prepare for my upcoming React developer mock interview. Ask me technical questions."
                    },
                    {
                      title: "Clean Typo & Refine",
                      desc: "Input a messy query to get high-fidelity explanations",
                      prompt: "I have a messy query with typos: 'cna u explian how async/await wrks under teh hood in js?'. Please analyze and explain."
                    },
                    {
                      title: "Data Analysis & Code",
                      desc: "Write high-performance scripts or analyze structured files",
                      prompt: "Let's perform a deep-dive data analysis. Write a Python script to clean and visualize a CSV dataset."
                    },
                    {
                      title: "General Coding Help",
                      desc: "Design scalable, robust systems with perfect clarity",
                      prompt: "Explain the architectural difference between REST and gRPC with a detailed comparison table."
                    }
                  ].map((card, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setInput(card.prompt);
                        const textarea = document.querySelector('textarea');
                        if (textarea) textarea.focus();
                      }}
                      className={`text-left p-4 rounded-2xl border transition-all duration-300 hover:translate-y-[-4px] active:scale-[0.98] ${
                        theme === 'light'
                          ? 'bg-white hover:bg-[#7b2cbf]/5 border-zinc-200 hover:border-[#7b2cbf]/40 hover:shadow-[0_8px_30px_rgba(123,44,191,0.06)]'
                          : 'bg-white/[0.02] hover:bg-[#7b2cbf]/10 border-white/[0.05] hover:border-[#7b2cbf]/30 hover:shadow-[0_8px_30px_rgba(123,44,191,0.15)]'
                      }`}
                    >
                      <div className="font-bold text-sm tracking-wide text-[#c084fc] mb-1">{card.title}</div>
                      <div className={`text-xs ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'}`}>{card.desc}</div>
                    </button>
                  ))}
                </div>

                {/* Floating centered input bar */}
                <div className="w-full max-w-2xl animate-in slide-in-from-bottom-6 duration-500">
                  {/* Realtime Upload Preview Layout */}
                  {attachedFileName && (
                     <div className={`flex items-center gap-2 px-3 py-2.5 text-xs font-semibold rounded-xl w-max border shadow-2xl backdrop-blur-xl animate-fade-in mb-3 ${
                       theme === 'light'
                         ? 'bg-[#7b2cbf]/5 border-[#7b2cbf]/10 text-zinc-800'
                         : 'bg-white/[0.02] border-white/[0.05] text-zinc-300'
                     }`}>
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
                  <div className={`relative flex items-end border rounded-2xl p-2.5 transition-all shadow-2xl ${
                    theme === 'light'
                      ? 'bg-white border-zinc-200 focus-within:ring-[#7b2cbf]/40 focus-within:border-[#7b2cbf]/40'
                      : 'bg-[#08040a]/90 border-white/[0.06] focus-within:ring-[#7b2cbf]/50 focus-within:border-[#7b2cbf]/50'
                  }`}>
                    
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept=".pdf,.txt,.json,.csv,.png,.jpg,.jpeg,.webp" />
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={loading || uploading}
                      className={`rounded-xl h-11 w-11 mb-0.5 ml-0.5 shrink-0 transition-colors ${
                        theme === 'light' ? 'text-zinc-500 hover:text-zinc-800 hover:bg-[#7b2cbf]/5' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                      }`}
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
                      className={`w-full max-h-56 min-h-[44px] resize-none bg-transparent px-4 py-3 text-sm placeholder:text-zinc-600 focus:outline-none font-light leading-relaxed ${
                        theme === 'light' ? 'text-[#1f1a24]' : 'text-zinc-100'
                      }`}
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
                          : theme === 'light' ? 'text-zinc-500 hover:text-zinc-800 hover:bg-[#7b2cbf]/5' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
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
            ) : (
              <>
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
                            ? theme === 'light'
                              ? 'bg-[#7b2cbf]/5 text-[#1f1a24] rounded-tr-sm border border-[#7b2cbf]/10'
                              : 'bg-white/[0.025] text-zinc-100 rounded-tr-sm border border-white/[0.04]' 
                            : theme === 'light'
                              ? 'bg-transparent text-[#2c2438] prose prose-p:leading-relaxed prose-pre:bg-[#f3eff7] prose-pre:border prose-pre:border-[#7b2cbf]/10 max-w-none'
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
              </>
            )}
          </div>
        </div>

        {/* Input Text Box with attached preview thumbnail */}
        {messages.some(m => m.role === 'user') && (
          <div className={`shrink-0 p-4 sm:p-6 z-10 transition-colors ${
            theme === 'light'
              ? 'bg-gradient-to-t from-[#fbfafc] via-[#fbfafc]/95 to-transparent'
              : 'bg-gradient-to-t from-[#030006] via-[#030006]/95 to-transparent'
          }`}>
            <div className="max-w-4xl mx-auto flex flex-col gap-3">
              
              {/* Realtime Upload Preview Layout */}
              {attachedFileName && (
                 <div className={`flex items-center gap-2 px-3 py-2.5 text-xs font-semibold rounded-xl w-max border shadow-2xl backdrop-blur-xl animate-fade-in ${
                   theme === 'light'
                     ? 'bg-[#7b2cbf]/5 border-[#7b2cbf]/10 text-zinc-800'
                     : 'bg-white/[0.02] border-white/[0.05] text-zinc-300'
                 }`}>
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
              <div className={`relative flex items-end border rounded-2xl p-2.5 transition-all shadow-2xl ${
                theme === 'light'
                  ? 'bg-white border-zinc-200 focus-within:ring-[#7b2cbf]/40 focus-within:border-[#7b2cbf]/40'
                  : 'bg-[#08040a]/90 border-white/[0.06] focus-within:ring-[#7b2cbf]/50 focus-within:border-[#7b2cbf]/50'
              }`}>
                
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept=".pdf,.txt,.json,.csv,.png,.jpg,.jpeg,.webp" />
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading || uploading}
                  className={`rounded-xl h-11 w-11 mb-0.5 ml-0.5 shrink-0 transition-colors ${
                    theme === 'light' ? 'text-zinc-500 hover:text-zinc-800 hover:bg-[#7b2cbf]/5' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
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
                  className={`w-full max-h-56 min-h-[44px] resize-none bg-transparent px-4 py-3 text-sm placeholder:text-zinc-600 focus:outline-none font-light leading-relaxed ${
                    theme === 'light' ? 'text-[#1f1a24]' : 'text-zinc-100'
                  }`}
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
                      : theme === 'light' ? 'text-zinc-500 hover:text-zinc-800 hover:bg-[#7b2cbf]/5' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
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
        )}
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

      {/* STUNNING STANDALONE VOICE PORTAL PAGE UI OVERLAY */}
      <AnimatePresence>
        {isVoicePortalOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            onClick={handleInterrupt}
            className="fixed inset-0 z-50 flex flex-col bg-[#030006] text-zinc-100 overflow-hidden font-sans cursor-pointer"
          >
            {/* Ambient Animated Cosmos Blur Gradients */}
            <div className="absolute top-[-10%] left-[-10%] h-[600px] w-[600px] rounded-full bg-[#7b2cbf]/8 blur-[160px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] h-[600px] w-[600px] rounded-full bg-[#c084fc]/6 blur-[160px] pointer-events-none" />
            
            {/* Elegant Header Action Bar */}
            <div className="flex justify-between items-center px-6 py-5 border-b border-white/[0.03] backdrop-blur-xl bg-black/35 shrink-0 z-10">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#7b2cbf] to-[#c084fc] flex items-center justify-center border border-white/10 shrink-0 shadow-lg shadow-[#7b2cbf]/10">
                  <Sparkles className="w-4 h-4 text-white animate-pulse" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold tracking-wider text-white">TAXA VOICE PORTAL</h2>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      voiceAssistantState === "listening" ? "bg-emerald-400 animate-ping" : "bg-[#c084fc] animate-pulse"
                    }`} />
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                      {voiceAssistantState === "idle" && "Ready to assist"}
                      {voiceAssistantState === "listening" && "Listening closely..."}
                      {voiceAssistantState === "thinking" && "TAXA is thinking..."}
                      {voiceAssistantState === "speaking" && "TAXA is speaking..."}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Premium Navigation Controls */}
              <div className="flex items-center gap-4">
                {/* Exit Portal Button */}
                <button
                  onClick={(e) => { e.stopPropagation(); closeVoicePortal(); }}
                  className="text-zinc-400 hover:text-white transition-all duration-200 p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 shadow-md active:scale-95 animate-fade-in"
                  title="Close Voice Assistant"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Pulsing Glassmorphic Interruption Helper Banner */}
            {voiceAssistantState === "speaking" && (
              <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-white/[0.03] border border-white/5 py-2.5 px-6 rounded-full text-xs font-semibold text-zinc-400 tracking-wider flex items-center gap-2.5 animate-bounce shadow-2xl z-20 backdrop-blur-xl">
                <span className="h-2.5 w-2.5 rounded-full bg-[#7b2cbf] animate-ping" />
                <span>TAXA is speaking. Tap anywhere or press Spacebar to interrupt.</span>
              </div>
            )}

            {/* Core Interaction Hub */}
            <div className="flex-1 flex flex-col md:flex-row items-center justify-between p-6 sm:p-12 gap-8 relative overflow-y-auto">
              
              {/* Left Column: Responsive Assistant Output */}
              <div className="flex-1 w-full flex flex-col justify-end md:justify-center max-w-xl h-[35%] md:h-full z-10">
                <div className="space-y-4">
                  <span className="text-[10px] font-bold text-[#c084fc] uppercase tracking-widest flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#c084fc] animate-pulse" />
                    TAXA Response
                  </span>
                  
                  <div className="bg-white/[0.02] border border-white/[0.04] backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-2xl relative overflow-hidden group min-h-[160px] flex items-center">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#7b2cbf]/0 via-[#7b2cbf]/3 to-[#7b2cbf]/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out pointer-events-none" />
                    <p className="text-lg sm:text-xl font-medium leading-relaxed bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent w-full">
                      {lastAssistantVoiceTranscript || "Awaiting your prompt..."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Center Hub: Sphere + Luxurious Identity Selector */}
              <div className="flex flex-col items-center justify-center gap-8 shrink-0 my-4 md:my-0 z-20">
                {/* Center Orbital Energy Sphere Container */}
                <div className="relative flex items-center justify-center w-[200px] h-[200px] sm:w-[260px] sm:h-[260px] shrink-0">
                  {/* Outer Orbiting Dashed Ring */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: voiceAssistantState === "thinking" ? 6 : 24, ease: "linear" }}
                    className="absolute inset-0 rounded-full border border-[#7b2cbf]/20 border-dashed pointer-events-none"
                  />
                  
                  {/* Inner Orbiting Dotted Ring */}
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ repeat: Infinity, duration: voiceAssistantState === "speaking" ? 8 : 16, ease: "linear" }}
                    className="absolute inset-4 rounded-full border border-dotted border-[#c084fc]/15 pointer-events-none"
                  />

                  {/* Central Ambient Pulse Glow */}
                  <div className={`absolute inset-10 rounded-full blur-2xl transition-all duration-700 opacity-60 pointer-events-none ${
                    voiceAssistantState === "listening" ? "bg-emerald-500/25" :
                    voiceAssistantState === "thinking" ? "bg-amber-500/20" :
                    voiceAssistantState === "speaking" ? "bg-[#7b2cbf]/30" : "bg-[#7b2cbf]/10"
                  }`} />

                  {/* Main Interactive Sphere */}
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (voiceAssistantState === "speaking") {
                        handleInterrupt();
                      } else {
                        toggleListening(true);
                      }
                    }}
                    className={`relative w-[130px] h-[130px] sm:w-[160px] sm:h-[160px] rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl border cursor-pointer hover:scale-105 ${
                      voiceAssistantState === "listening" 
                        ? "bg-gradient-to-tr from-[#10b981] via-[#059669] to-[#047857] shadow-[#10b981]/30 border-emerald-400/30 scale-105" 
                        : voiceAssistantState === "thinking"
                        ? "bg-gradient-to-tr from-[#f59e0b] via-[#d97706] to-[#b45309] shadow-[#f59e0b]/30 border-amber-400/30 scale-95"
                        : voiceAssistantState === "speaking"
                        ? "bg-gradient-to-tr from-[#a855f7] via-[#7b2cbf] to-[#6366f1] shadow-[#7b2cbf]/40 border-purple-400/30 scale-100"
                        : "bg-gradient-to-tr from-zinc-800 via-zinc-950 to-zinc-900 shadow-black/80 border-white/5 scale-95"
                    }`}
                  >
                    {/* Subtle inner gloss layer */}
                    <div className="absolute inset-1 rounded-full bg-black/10 backdrop-blur-xs border border-white/10 pointer-events-none" />
                    
                    {/* State-driven Icon */}
                    <div className="z-10 text-white flex flex-col items-center">
                      {voiceAssistantState === "listening" && <Mic className="w-10 h-10 animate-bounce text-white" />}
                      {voiceAssistantState === "thinking" && <Loader2 className="w-10 h-10 animate-spin text-amber-200" />}
                      {voiceAssistantState === "speaking" && <Volume2 className="w-10 h-10 animate-pulse text-purple-200" />}
                      {voiceAssistantState === "idle" && <Headphones className="w-10 h-10 text-zinc-400" />}
                    </div>
                    
                    {/* Active Ripple Halos */}
                    {voiceAssistantState === "speaking" && (
                      <>
                        <div className="absolute -inset-4 rounded-full border border-[#7b2cbf]/30 animate-ping opacity-60 pointer-events-none" />
                        <div className="absolute -inset-10 rounded-full border border-[#c084fc]/20 animate-ping opacity-45 delay-300 pointer-events-none" />
                      </>
                    )}
                    {voiceAssistantState === "listening" && (
                      <>
                        <div className="absolute -inset-4 rounded-full border border-emerald-500/30 animate-ping opacity-60 pointer-events-none" />
                        <div className="absolute -inset-8 rounded-full border border-emerald-400/20 animate-ping opacity-45 delay-300 pointer-events-none" />
                      </>
                    )}
                  </div>
                </div>

                {/* Luxurious Dual-Card Identity Selector Panel */}
                <div className="flex flex-row items-center gap-3 bg-white/[0.02] border border-white/[0.04] p-1.5 rounded-2xl backdrop-blur-xl shadow-2xl transition-all duration-300 shrink-0">
                  {/* Anya (Female) Card */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (voiceGender !== "female") {
                        setVoiceGender("female");
                        voiceGenderRef.current = "female";
                        setVoiceAssistantState("speaking");
                        const confirmText = "Switched to Anya. Main Anya hoon, aapki female voice assistant. How can I help you today?";
                        setLastAssistantVoiceTranscript(confirmText);
                        speakText(confirmText, () => {
                          if (isTwoWayModeRef.current && !isMicPausedRef.current) {
                            setVoiceAssistantState("listening");
                            setTimeout(() => {
                              if (isTwoWayModeRef.current && !isMicPausedRef.current && !isListeningRef.current) {
                                toggleListening(true);
                              }
                            }, 150);
                          } else {
                            setVoiceAssistantState("idle");
                          }
                        });
                      }
                    }}
                    className={`relative flex items-center gap-3.5 px-4 py-3 rounded-xl border transition-all duration-300 active:scale-95 ${
                      voiceGender === "female"
                        ? "bg-[#7b2cbf]/15 border-[#7b2cbf]/40 shadow-[0_0_20px_rgba(123,44,191,0.2)] text-white scale-105"
                        : "bg-transparent border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]"
                    }`}
                  >
                    <span className={`absolute top-2 right-2 h-1.5 w-1.5 rounded-full ${
                      voiceGender === "female" ? "bg-purple-400 animate-pulse shadow-[0_0_8px_rgba(192,132,252,0.8)]" : "bg-transparent"
                    }`} />
                    <div className={`h-8.5 w-8.5 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-all duration-300 ${
                      voiceGender === "female" ? "bg-[#7b2cbf] text-white shadow-md shadow-[#7b2cbf]/30" : "bg-white/[0.04] text-zinc-400"
                    }`}>
                      A
                    </div>
                    <div className="text-left">
                      <div className="text-[11px] font-extrabold tracking-wider text-zinc-100 uppercase">ANYA</div>
                      <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">Female Voice</div>
                    </div>
                  </button>

                  <div className="h-6 w-[1px] bg-white/[0.08]" />

                  {/* Kabir (Male) Card */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (voiceGender !== "male") {
                        setVoiceGender("male");
                        voiceGenderRef.current = "male";
                        setVoiceAssistantState("speaking");
                        const confirmText = "Switched to Kabir. Main Kabir hoon, aapka male voice assistant. How can I help you today?";
                        setLastAssistantVoiceTranscript(confirmText);
                        speakText(confirmText, () => {
                          if (isTwoWayModeRef.current && !isMicPausedRef.current) {
                            setVoiceAssistantState("listening");
                            setTimeout(() => {
                              if (isTwoWayModeRef.current && !isMicPausedRef.current && !isListeningRef.current) {
                                toggleListening(true);
                              }
                            }, 150);
                          } else {
                            setVoiceAssistantState("idle");
                          }
                        });
                      }
                    }}
                    className={`relative flex items-center gap-3.5 px-4 py-3 rounded-xl border transition-all duration-300 active:scale-95 ${
                      voiceGender === "male"
                        ? "bg-[#3b82f6]/15 border-[#3b82f6]/40 shadow-[0_0_20px_rgba(59,130,246,0.2)] text-white scale-105"
                        : "bg-transparent border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]"
                    }`}
                  >
                    <span className={`absolute top-2 right-2 h-1.5 w-1.5 rounded-full ${
                      voiceGender === "male" ? "bg-blue-400 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]" : "bg-transparent"
                    }`} />
                    <div className={`h-8.5 w-8.5 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-all duration-300 ${
                      voiceGender === "male" ? "bg-[#3b82f6] text-white shadow-md shadow-[#3b82f6]/30" : "bg-white/[0.04] text-zinc-400"
                    }`}>
                      K
                    </div>
                    <div className="text-left">
                      <div className="text-[11px] font-extrabold tracking-wider text-zinc-100 uppercase">KABIR</div>
                      <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">Male Voice</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Right Column: Responsive User Input Transcript */}
              <div className="flex-1 w-full flex flex-col justify-start md:justify-center max-w-xl h-[35%] md:h-full z-10">
                <div className="space-y-4">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                    <Mic className="w-3.5 h-3.5 text-zinc-400" />
                    Detected Speech
                  </span>
                  
                  <div className="bg-white/[0.02] border border-white/[0.04] backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-2xl relative min-h-[160px] flex items-center">
                    <p className="text-lg sm:text-xl font-medium leading-relaxed italic bg-gradient-to-r from-zinc-300 via-zinc-400 to-zinc-500 bg-clip-text text-transparent w-full">
                      {lastUserVoiceTranscript 
                        ? `"${lastUserVoiceTranscript}"` 
                        : isListening 
                        ? "Listening... Speak naturally in Hinglish, Marathi, etc." 
                        : "Microphone paused. Click start below to chat."
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Section: Dynamic Waveforms & Primary Action Controllers */}
            <div className="px-6 py-8 border-t border-white/[0.03] bg-black/45 backdrop-blur-xl flex flex-col items-center gap-6 shrink-0 z-10">
              
              {/* Dynamic Sound Wave Heights */}
              <div className="flex items-end gap-1.5 h-12">
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      height: 
                        voiceAssistantState === "speaking"
                          ? [8, [24, 48, 16, 36][i % 4], 8]
                          : voiceAssistantState === "listening"
                          ? [8, [32, 16, 40, 24][i % 4], 8]
                          : 8
                    }}
                    transition={{
                      duration: 0.7 + (i * 0.12),
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className={`w-1.5 rounded-full ${
                      voiceAssistantState === "listening"
                        ? "bg-gradient-to-t from-emerald-600 to-emerald-400"
                        : "bg-gradient-to-t from-[#7b2cbf] to-[#c084fc]"
                    }`}
                  />
                ))}
              </div>

              {/* Controller Bar */}
              <div className="flex items-center gap-4">
                {/* Master Play/Pause Voice Session Button */}
                <button
                  onClick={() => toggleListening(true)}
                  className={`flex items-center justify-center p-5 rounded-full shadow-2xl transition-all duration-300 active:scale-90 border ${
                    isListening 
                      ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20 border-emerald-400/30" 
                      : "bg-[#7b2cbf] hover:bg-[#9d4edd] text-white shadow-[#7b2cbf]/30 border-[#9d4edd]/20"
                  }`}
                  title={isListening ? "Pause Listening" : "Start Listening"}
                >
                  {isListening ? <Mic className="w-6 h-6 animate-pulse" /> : <MicOff className="w-6 h-6" />}
                </button>
                
                {/* Direct Connection Info Overlay */}
                <div className="bg-white/[0.03] border border-white/5 py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-semibold tracking-wide flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${isListening ? "bg-emerald-400 animate-pulse" : "bg-zinc-500"}`} />
                  <span className="text-zinc-300">
                    {isListening ? "Listening - Hands-Free active" : "Microphone paused"}
                  </span>
                </div>
              </div>

              {/* Subtitle tag */}
              <p className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-widest">
                TAXA speaks fluently in English, Hinglish, Marathi, Hindi, Gujarati, and Marwadi
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

