import { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  X,
  Send,
  Trash2,
  Loader2,
  AlertCircle,
  RefreshCw,
  Bot,
  User as UserIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { sendAssistantMessage } from "../services/assistantService";

const QUICK_ACTIONS = [
  "How do I upload a video?",
  "Why is my video processing?",
  "How does semantic search work?",
  "How do I use Studio?",
  "Why can't my video play?",
];

const INITIAL_WELCOME_MESSAGE = {
  id: "welcome-1",
  role: "assistant",
  text: `👋 Hi! I'm your **AI Help Assistant**.

I can help you understand and operate the platform.

You can ask me about:
• Uploading videos
• Video processing
• Dashboard
• Library
• Studio
• Semantic Search
• Video playback
• Processing status
• Chapters and summaries
• Troubleshooting

How can I help you?`,
};

export default function AiHelpDrawer({ isOpen, onClose }) {
  const [messages, setMessages] = useState([INITIAL_WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUserMessage, setLastUserMessage] = useState("");

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, loading]);

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    setError(null);
    setInput("");
    setLastUserMessage(text);

    const userMsg = { id: Date.now().toString(), role: "user", text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      // Prepare conversation history (exclude initial system welcome for API history)
      const historyPayload = updatedMessages
        .filter((m) => m.id !== "welcome-1")
        .map((m) => ({
          role: m.role,
          text: m.text,
        }));

      const res = await sendAssistantMessage(text, historyPayload);
      if (res.data?.success && res.data?.data?.message) {
        const aiMsg = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          text: res.data.data.message,
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        throw new Error("Invalid response format from AI assistant API");
      }
    } catch (err) {
      console.error("AI Help Assistant error:", err);
      setError("Sorry, I couldn't connect to the AI assistant right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    if (lastUserMessage) {
      handleSendMessage(lastUserMessage);
    }
  };

  const handleClearChat = () => {
    setMessages([INITIAL_WELCOME_MESSAGE]);
    setError(null);
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 15, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 15, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="fixed top-20 right-6 z-50 w-[92vw] sm:w-[420px] h-[600px] max-h-[82vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/60 flex flex-col overflow-hidden backdrop-blur-xl"
      >
        {/* Header */}
        <div className="bg-slate-950/80 border-b border-slate-800 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Sparkles className="text-white" size={20} />
            </div>
            <div>
              <h3 className="text-white font-semibold text-base flex items-center gap-2">
                AI Help Assistant
              </h3>
              <p className="text-slate-400 text-xs">Ask me anything about the platform.</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleClearChat}
              title="Clear conversation"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <Trash2 size={17} />
            </button>
            <button
              onClick={onClose}
              title="Close AI Help"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Message Area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-900/50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${
                msg.role === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 border border-slate-700 text-blue-400"
                }`}
              >
                {msg.role === "user" ? <UserIcon size={16} /> : <Bot size={16} />}
              </div>

              <div
                className={`max-w-[82%] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-2xl rounded-tr-none shadow-md shadow-blue-600/10 font-medium"
                    : "bg-slate-800/90 text-slate-200 border border-slate-700/80 rounded-2xl rounded-tl-none"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {/* Quick Action Suggestion Chips (Shown on initial start) */}
          {messages.length === 1 && !loading && (
            <div className="pt-2 space-y-2">
              <p className="text-slate-400 text-xs font-semibold px-1">Suggested Questions:</p>
              <div className="flex flex-col gap-2">
                {QUICK_ACTIONS.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(action)}
                    className="text-left text-xs text-blue-300 hover:text-white bg-slate-800/70 hover:bg-blue-600/30 border border-slate-700/70 hover:border-blue-500/50 px-3.5 py-2.5 rounded-xl transition duration-150"
                  >
                    💡 {action}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Thinking Loading Indicator */}
          {loading && (
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-blue-400 flex items-center justify-center shrink-0">
                <Bot size={16} />
              </div>
              <div className="bg-slate-800/90 border border-slate-700 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-3">
                <Loader2 className="animate-spin text-blue-400" size={18} />
                <span className="text-slate-400 text-xs italic">Thinking...</span>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3.5 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-red-400 text-xs font-medium">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
              <button
                onClick={handleRetry}
                className="self-end flex items-center gap-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
              >
                <RefreshCw size={13} />
                Retry
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Box */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800">
          <div className="flex items-end gap-2 bg-slate-900 border border-slate-700/80 rounded-xl p-2 focus-within:border-blue-500 transition">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything..."
              disabled={loading}
              className="flex-1 bg-transparent text-white text-sm outline-none resize-none placeholder-slate-500 max-h-24 px-1 py-1"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!input.trim() || loading}
              className="w-9 h-9 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white flex items-center justify-center transition shrink-0"
            >
              <Send size={16} />
            </button>
          </div>
          <p className="text-[10px] text-slate-500 text-center mt-2">
            Press <kbd className="bg-slate-800 px-1 rounded text-slate-400">Enter</kbd> to send,{" "}
            <kbd className="bg-slate-800 px-1 rounded text-slate-400">Shift + Enter</kbd> for line break
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
