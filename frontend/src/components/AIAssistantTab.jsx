import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { 
  Bot, User, Send, ShieldAlert, Sparkles, AlertCircle, HelpCircle, 
  Terminal, ShieldCheck, Key, Container, Layers, Copy
} from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import { API_BASE_URL } from '../config';

export default function AIAssistantTab({ findingsContext, repoName }) {
  const [messages, setMessages] = useState([
    { 
      sender: 'bot', 
      text: `Welcome to the SecureFlow AI Security Assistant! 🤖\n\nI have loaded the context from your latest repository audit (**${repoName || 'No repository scanned yet'}**).\n\nYou can ask me detailed questions about any findings, or get advice on securing your Dockerfiles, GitHub Actions workflows, secrets management, or third-party dependencies.\n\nHere are some topics we can explore:`
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Generate suggested questions dynamically based on scanning results
  const getSuggestions = () => {
    const suggestions = [];
    
    if (!findingsContext || findingsContext.length === 0) {
      suggestions.push({
        label: "How to achieve 100% pipeline health?",
        query: "What is pipeline health score and how can I achieve a perfect 100% score for my repository?"
      });
      suggestions.push({
        label: "General CI/CD security advice",
        query: "Provide a checklist of best practices to secure GitHub Actions pipelines."
      });
      suggestions.push({
        label: "Securing container images",
        query: "What are the most critical steps to secure a Docker container configuration?"
      });
    } else {
      // Analyze findings to offer tailored queries
      const hasGitleaks = findingsContext.some(f => f.tool === 'gitleaks');
      const hasHadolint = findingsContext.some(f => f.tool === 'hadolint');
      const hasActionlint = findingsContext.some(f => f.tool === 'actionlint');
      const hasOsv = findingsContext.some(f => f.tool === 'osv');

      if (hasGitleaks) {
        suggestions.push({
          label: "How to rotate leaked secrets?",
          query: "I have secrets detected in my codebase history. How do I properly rotate them and remove them from Git history?"
        });
      }
      if (hasHadolint) {
        suggestions.push({
          label: "Dockerfile non-root user fix",
          query: "Explain why running Docker as non-root is secure, and show me how to update a Dockerfile to use a dedicated USER directive."
        });
      }
      if (hasActionlint) {
        suggestions.push({
          label: "Workflow floating tag mitigation",
          query: "How do I secure GitHub Actions that use floating version tags (like @v4 or @main)? Show me how to use immutable SHA hashes."
        });
      }
      if (hasOsv) {
        suggestions.push({
          label: "Remediation for vulnerable packages",
          query: "My dependencies have active CVE alerts. What is the process for auditing, pinning, and patching third-party packages in Python/Node?"
        });
      }
      
      suggestions.push({
        label: "Explain all active vulnerabilities",
        query: "Summarize all the findings detected in the latest scan, explaining the risk of each and prioritizing which ones I should fix first."
      });
    }

    return suggestions.slice(0, 3); // Return top 3 suggestions
  };

  const handleSend = async (textToSend) => {
    const text = textToSend || inputText.trim();
    if (!text) return;
    
    if (!textToSend) setInputText('');
    
    setMessages(prev => [...prev, { sender: 'user', text }]);
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/api/chat`,
        {
          question: text,
          findings_context: findingsContext || []
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setMessages(prev => [...prev, { sender: 'bot', text: response.data.response }]);
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'bot', text: 'Sorry, I failed to process your request. Please ensure the backend server is running and your API key is configured.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (query) => {
    handleSend(query);
  };

  return (
    <div className="bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row min-h-[650px] h-[calc(100vh-140px)] animate-in fade-in duration-200">
      
      {/* Sidebar: Scanner Context & Quick Guides */}
      <div className="w-full md:w-80 bg-slate-900/60 border-r border-slate-800/80 p-5 flex flex-col justify-between shrink-0 gap-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              AI Context Profile
            </h3>
            <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl space-y-3">
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Active Repository</span>
                <span className="text-xs text-slate-200 font-bold font-mono truncate block mt-0.5">
                  {repoName || 'None Loaded'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Loaded Findings</span>
                <span className="text-xs text-slate-200 font-bold block mt-0.5 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
                  {findingsContext?.length || 0} Alerts Active
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
              Quick Reference Prompts
            </h3>
            <div className="space-y-2 text-xs">
              <button 
                onClick={() => handleSuggestionClick("Generate a complete, fully secured template for GitHub Actions CI/CD workflows.")}
                className="w-full text-left bg-slate-950/30 hover:bg-slate-900 border border-slate-850 hover:border-slate-750 px-3.5 py-2.5 rounded-xl text-slate-300 hover:text-slate-100 flex items-center gap-2 transition-all"
              >
                <Terminal className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Generate Secure YAML</span>
              </button>
              <button 
                onClick={() => handleSuggestionClick("Explain how secrets leakage happens in Git history and how to prevent it.")}
                className="w-full text-left bg-slate-950/30 hover:bg-slate-900 border border-slate-850 hover:border-slate-750 px-3.5 py-2.5 rounded-xl text-slate-300 hover:text-slate-100 flex items-center gap-2 transition-all"
              >
                <Key className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Secret Leak Mitigation</span>
              </button>
              <button 
                onClick={() => handleSuggestionClick("What are Docker best practices regarding user execution permissions?")}
                className="w-full text-left bg-slate-950/30 hover:bg-slate-900 border border-slate-850 hover:border-slate-750 px-3.5 py-2.5 rounded-xl text-slate-300 hover:text-slate-100 flex items-center gap-2 transition-all"
              >
                <Container className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Dockerfile Hardening</span>
              </button>
              <button 
                onClick={() => handleSuggestionClick("How can I audit third-party dependency vulnerabilities (SCA)?")}
                className="w-full text-left bg-slate-950/30 hover:bg-slate-900 border border-slate-850 hover:border-slate-750 px-3.5 py-2.5 rounded-xl text-slate-300 hover:text-slate-100 flex items-center gap-2 transition-all"
              >
                <Layers className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Dependency Audits</span>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-indigo-950/20 border border-indigo-900/30 p-3 rounded-xl flex gap-2.5 items-start">
          <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <p className="text-[10px] text-indigo-200 leading-relaxed">
            The AI automatically consumes Gitleaks, Hadolint, Actionlint, Semgrep, and OSV linter logs to provide precise remediations.
          </p>
        </div>
      </div>

      {/* Main Messaging Interface */}
      <div className="flex-1 flex flex-col justify-between bg-slate-950/20 min-w-0">
        
        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`flex items-start gap-4 max-w-4xl ${
                msg.sender === 'user' ? 'flex-row-reverse ml-auto' : ''
              }`}
            >
              {/* Avatar */}
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg ${
                msg.sender === 'user' 
                  ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-purple-600/10' 
                  : 'bg-gradient-to-tr from-indigo-500 to-emerald-500 shadow-indigo-500/10'
              }`}>
                {msg.sender === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>

              {/* Message Bubble */}
              <div className={`flex-1 min-w-0 rounded-2xl p-4 border transition-all ${
                msg.sender === 'user' 
                  ? 'bg-purple-600/10 border-purple-800/40 text-purple-100 max-w-xl' 
                  : 'bg-[#0f172a]/60 border-slate-800/80 shadow-md text-slate-300'
              }`}>
                {msg.sender === 'user' ? (
                  <p className="text-xs whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                ) : (
                  <MarkdownRenderer content={msg.text} />
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-start gap-4 max-w-2xl">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-emerald-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-500/10 animate-pulse">
                <Bot className="w-5 h-5" />
              </div>
              <div className="bg-[#0f172a]/60 border border-slate-800/80 rounded-2xl p-5 text-slate-400 flex items-center gap-3">
                <div className="flex space-x-1.5">
                  <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className="text-xs italic text-indigo-400/80">SecureFlow AI is writing a response...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area & dynamic recommendations */}
        <div className="p-6 border-t border-slate-800/80 bg-slate-900/20">
          
          {/* Dynamic Suggestion Chips (only display when not active loading) */}
          {!loading && (
            <div className="mb-4">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Recommended queries
              </div>
              <div className="flex flex-wrap gap-2">
                {getSuggestions().map((sug, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestionClick(sug.query)}
                    className="text-[11px] font-medium bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-slate-100 px-3.5 py-1.5 rounded-full transition-all text-left"
                  >
                    {sug.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Form Input */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }} 
            className="flex gap-3 bg-slate-950 border border-slate-800/80 p-2.5 rounded-2xl focus-within:border-indigo-500 transition-colors shadow-inner"
          >
            <input
              type="text"
              className="flex-1 bg-transparent px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
              placeholder="Ask a question about your scan, code, or secure pipelines..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl px-4 py-2.5 flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/10 active:scale-95 transition-all focus:outline-none"
            >
              <Send className="w-4 h-4" />
              <span className="text-xs font-semibold hidden sm:inline">Ask AI</span>
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
