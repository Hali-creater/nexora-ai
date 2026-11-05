import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare, Plus, Search, Pin, Trash2, Settings, Key, BarChart3,
  Columns, FolderGit2, LogOut, ChevronLeft, ChevronRight, Send, Paperclip,
  Sparkles, Bot, User, Copy, Check, RotateCw, Edit3, Square, ArrowDown,
  Cpu, FileCode, ExternalLink, HelpCircle
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../components/Logo';
import { ModelSelectorModal } from '../components/ModelSelectorModal';
import { ProviderKeysModal } from '../components/ProviderKeysModal';
import { UsageDashboardModal } from '../components/UsageDashboardModal';
import { ModelComparisonView } from '../components/ModelComparisonView';
import { ProjectWorkspacesModal } from '../components/ProjectWorkspacesModal';

export function ChatInterface({ onNavigateHome, onOpenLegal }) {
  const { user, logout, puterUser, puterStatus, signInWithPuter, signOutPuter } = useAuth();

  // Navigation / Modal States
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false);
  const [keysModalOpen, setKeysModalOpen] = useState(false);
  const [usageModalOpen, setUsageModalOpen] = useState(false);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [projectsModalOpen, setProjectsModalOpen] = useState(false);

  // Model & Access State
  const [models, setModels] = useState([]);
  const [accessMethod, setAccessMethod] = useState('puter'); // 'puter' | 'byok'
  const [selectedModel, setSelectedModel] = useState({
    id: 'claude-3-7-sonnet',
    provider: 'puter',
    name: 'Claude 3.7 Sonnet (Puter)',
    accessMethod: 'puter',
    contextLength: 200000
  });

  // Projects State
  const [activeProject, setActiveProject] = useState(null);

  // Conversations State
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [conversationSearch, setConversationSearch] = useState('');

  // Composer State
  const [inputPrompt, setInputPrompt] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [abortController, setAbortController] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // 1. Fetch available models
  useEffect(() => {
    fetch('/api/ai/models')
      .then(r => r.json())
      .then(d => {
        setModels(d.models || []);
      })
      .catch(console.error);
  }, []);

  // 2. Fetch conversations
  const loadConversations = async () => {
    try {
      const url = activeProject
        ? `/api/conversations?projectId=${activeProject.id}`
        : '/api/conversations';
      const res = await fetch(url, { credentials: 'include' });
      if (res.ok) {
        const d = await res.json();
        setConversations(d.conversations || []);
        if (!activeConversation && d.conversations.length > 0) {
          selectConversation(d.conversations[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [activeProject]);

  // 3. Select Conversation & Load Messages
  const selectConversation = async (convId) => {
    try {
      const res = await fetch(`/api/conversations/${convId}`, { credentials: 'include' });
      if (res.ok) {
        const d = await res.json();
        setActiveConversation(d.conversation);
        setMessages(d.messages || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 4. Create New Conversation
  const handleNewChat = async () => {
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'New Conversation',
          modelId: selectedModel.id,
          providerId: selectedModel.provider,
          accessMethod,
          projectId: activeProject ? activeProject.id : null
        }),
        credentials: 'include'
      });
      if (res.ok) {
        const d = await res.json();
        setConversations([d.conversation, ...conversations]);
        setActiveConversation(d.conversation);
        setMessages([]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 5. Handle File Upload (Drag-and-drop or paperclip)
  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/projects/inspect-file', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      if (res.ok) {
        const fileData = await res.json();
        setAttachments(prev => [...prev, fileData]);
      } else {
        const err = await res.json();
        alert(err.error || 'File upload failed');
      }
    } catch (e) {
      alert('Error parsing uploaded file');
    }
  };

  // 6. Send Message with SSE or Puter SDK
  const handleSendMessage = async (customPrompt = null) => {
    const textToSend = customPrompt || inputPrompt;
    if ((!textToSend.trim() && attachments.length === 0) || isGenerating) return;

    let targetConv = activeConversation;

    // Create conversation on the fly if none exists
    if (!targetConv) {
      const createRes = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: textToSend.slice(0, 30) || 'New Conversation',
          modelId: selectedModel.id,
          providerId: selectedModel.provider,
          accessMethod,
          projectId: activeProject ? activeProject.id : null
        }),
        credentials: 'include'
      });
      const d = await createRes.json();
      targetConv = d.conversation;
      setActiveConversation(d.conversation);
      setConversations([d.conversation, ...conversations]);
    }

    // Compose user prompt including attached files
    let fullPromptContent = textToSend;
    if (attachments.length > 0) {
      const attachedText = attachments.map(a =>
        `[ATTACHED FILE: ${a.filename}]\n\`\`\`${a.fileType}\n${a.text}\n\`\`\``
      ).join('\n\n');
      fullPromptContent = `${attachedText}\n\n${textToSend}`;
    }

    const userMessage = {
      role: 'user',
      content: fullPromptContent,
      attachments: [...attachments],
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputPrompt('');
    setAttachments([]);
    setIsGenerating(true);

    // Save user message to backend
    await fetch(`/api/conversations/${targetConv.id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: 'user',
        content: fullPromptContent,
        modelId: selectedModel.id,
        providerId: selectedModel.provider,
        attachments: userMessage.attachments
      }),
      credentials: 'include'
    });

    const assistantMessageId = 'temp-' + Date.now();
    const assistantMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      model_id: selectedModel.id,
      provider_id: selectedModel.provider,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, assistantMessage]);

    // Build chat history payload
    const historyPayload = messages.map(m => ({ role: m.role, content: m.content }));
    if (activeProject?.system_instructions) {
      historyPayload.unshift({ role: 'system', content: activeProject.system_instructions });
    }
    historyPayload.push({ role: 'user', content: fullPromptContent });

    const startTime = Date.now();
    let accumulatedText = '';

    try {
      // Branch: OPTION A - Puter User-Pays
      if (accessMethod === 'puter') {
        if (!window.puter?.ai?.chat) {
          throw new Error('Puter SDK not loaded or supported in this browser. Please use BYOK access.');
        }

        const puterResponse = await window.puter.ai.chat(historyPayload, {
          model: selectedModel.id,
          stream: true
        });

        for await (const part of puterResponse) {
          if (part?.text) {
            accumulatedText += part.text;
            setMessages(prev => prev.map(m => m.id === assistantMessageId ? { ...m, content: accumulatedText } : m));
          }
        }

        // Log Puter inference metrics to local telemetry
        fetch('/api/ai/log-puter-usage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            modelId: selectedModel.id,
            tokensIn: Math.round(fullPromptContent.length / 4),
            tokensOut: Math.round(accumulatedText.length / 4),
            durationMs: Date.now() - startTime
          }),
          credentials: 'include'
        }).catch(console.error);

      } else {
        // Branch: OPTION B - Bring Your Own Key (BYOK SSE)
        const controller = new AbortController();
        setAbortController(controller);

        const res = await fetch('/api/ai/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: targetConv.id,
            providerId: selectedModel.provider,
            modelId: selectedModel.id,
            messages: historyPayload
          }),
          signal: controller.signal,
          credentials: 'include'
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'BYOK inference request failed.');
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data:')) {
              const jsonStr = trimmed.replace('data:', '').trim();
              if (jsonStr) {
                const data = JSON.parse(jsonStr);
                if (data.error) {
                  throw new Error(data.error);
                }
                if (data.delta) {
                  accumulatedText += data.delta;
                  setMessages(prev => prev.map(m => m.id === assistantMessageId ? { ...m, content: accumulatedText } : m));
                }
              }
            }
          }
        }
      }

      // Persist finished assistant message to DB
      await fetch(`/api/conversations/${targetConv.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'assistant',
          content: accumulatedText,
          modelId: selectedModel.id,
          providerId: selectedModel.provider,
          durationMs: Date.now() - startTime
        }),
        credentials: 'include'
      });

      // Refresh title and history list
      loadConversations();
    } catch (err) {
      console.error('Inference error:', err);
      const errorNotice = `\n\n⚠️ **Inference Error:** ${err.message || 'Generation terminated'}`;
      accumulatedText += errorNotice;
      setMessages(prev => prev.map(m => m.id === assistantMessageId ? { ...m, content: accumulatedText, error: err.message } : m));
    } finally {
      setIsGenerating(false);
      setAbortController(null);
    }
  };

  const handleStopGeneration = () => {
    if (abortController) {
      abortController.abort();
      setIsGenerating(false);
    }
  };

  const handleCopyMessage = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleDeleteConversation = async (convId, e) => {
    e.stopPropagation();
    if (!confirm('Permanently delete this conversation?')) return;
    try {
      await fetch(`/api/conversations/${convId}`, { method: 'DELETE', credentials: 'include' });
      setConversations(conversations.filter(c => c.id !== convId));
      if (activeConversation?.id === convId) {
        setActiveConversation(null);
        setMessages([]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex h-screen bg-nexora-darkest text-slate-100 overflow-hidden font-sans">
      {/* 1. LEFT SIDEBAR */}
      <aside
        className={`${
          sidebarOpen ? 'w-72' : 'w-0'
        } transition-all duration-300 ease-in-out border-r border-nexora-border/60 bg-nexora-dark flex flex-col h-full overflow-hidden relative z-30 shrink-0`}
      >
        {/* Brand & New Chat */}
        <div className="p-4 border-b border-nexora-border/60 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Logo onClick={onNavigateHome} textClassName="text-lg font-bold" />
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded-lg text-nexora-muted hover:text-white hover:bg-nexora-card"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleNewChat}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-nexora-accent via-indigo-600 to-nexora-cyan hover:opacity-95 text-white text-xs font-semibold shadow-md shadow-nexora-accent/20 flex items-center justify-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" /> New Chat
          </button>
        </div>

        {/* Search Conversations */}
        <div className="px-3 pt-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-nexora-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={conversationSearch}
              onChange={(e) => setConversationSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-nexora-card border border-nexora-border rounded-lg text-xs text-white placeholder-nexora-muted focus:outline-none focus:border-nexora-accent"
            />
          </div>
        </div>

        {/* Conversations History List */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {conversations
            .filter(c => c.title.toLowerCase().includes(conversationSearch.toLowerCase()))
            .map(c => {
              const isSelected = activeConversation?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => selectConversation(c.id)}
                  className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-nexora-card text-white font-medium border border-nexora-border'
                      : 'text-slate-400 hover:bg-nexora-card/50 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <MessageSquare className="w-3.5 h-3.5 shrink-0 text-nexora-cyan" />
                    <span className="truncate">{c.title}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleDeleteConversation(c.id, e)}
                      className="p-1 rounded text-nexora-muted hover:text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Sidebar Tools Footer */}
        <div className="p-3 border-t border-nexora-border/60 bg-nexora-darkest/40 space-y-1 text-xs">
          <button
            onClick={() => setProjectsModalOpen(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-nexora-card text-slate-300 hover:text-white transition-colors"
          >
            <FolderGit2 className="w-4 h-4 text-nexora-accent" />
            <span className="truncate">
              {activeProject ? activeProject.name : 'Project Workspaces'}
            </span>
          </button>

          <button
            onClick={() => setKeysModalOpen(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-nexora-card text-slate-300 hover:text-white transition-colors"
          >
            <Key className="w-4 h-4 text-yellow-400" />
            <span>BYOK API Keys</span>
          </button>

          <button
            onClick={() => setComparisonOpen(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-nexora-card text-slate-300 hover:text-white transition-colors"
          >
            <Columns className="w-4 h-4 text-nexora-violet" />
            <span>Model Comparison</span>
          </button>

          <button
            onClick={() => setUsageModalOpen(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-nexora-card text-slate-300 hover:text-white transition-colors"
          >
            <BarChart3 className="w-4 h-4 text-nexora-cyan" />
            <span>Usage Dashboard</span>
          </button>

          <div className="pt-2 border-t border-nexora-border/40 flex items-center justify-between px-2">
            <span className="text-[11px] text-nexora-muted truncate">{user?.email}</span>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-nexora-muted hover:text-red-400"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. MAIN CHAT AREA */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* TOP BAR */}
        <header className="h-14 border-b border-nexora-border/60 bg-nexora-dark/60 backdrop-blur-md px-4 flex items-center justify-between z-20 shrink-0">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 rounded-lg text-nexora-muted hover:text-white hover:bg-nexora-card"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {/* Access Method Selector */}
            <div className="flex items-center bg-nexora-card rounded-lg p-0.5 border border-nexora-border">
              <button
                onClick={() => {
                  setAccessMethod('puter');
                  setSelectedModel(models.find(m => m.provider === 'puter') || selectedModel);
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  accessMethod === 'puter'
                    ? 'bg-gradient-to-r from-nexora-accent to-nexora-cyan text-white shadow-sm'
                    : 'text-nexora-muted hover:text-white'
                }`}
              >
                Puter (User-Pays)
              </button>
              <button
                onClick={() => {
                  setAccessMethod('byok');
                  setSelectedModel(models.find(m => m.accessMethod === 'byok') || selectedModel);
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  accessMethod === 'byok'
                    ? 'bg-gradient-to-r from-nexora-accent to-nexora-violet text-white shadow-sm'
                    : 'text-nexora-muted hover:text-white'
                }`}
              >
                BYOK Direct
              </button>
            </div>

            {/* Active Model Selector Button */}
            <button
              onClick={() => setModelSelectorOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-nexora-card border border-nexora-border hover:border-nexora-accent/40 text-xs font-medium text-white transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-nexora-cyan" />
              <span className="truncate max-w-[150px] sm:max-w-[200px]">{selectedModel?.name}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {accessMethod === 'puter' && (
              <div className="flex items-center gap-2">
                {puterStatus === 'logged_in' ? (
                  <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Puter: {puterUser?.username || 'Active'}
                  </span>
                ) : (
                  <button
                    onClick={signInWithPuter}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-nexora-cyan/15 text-nexora-cyan border border-nexora-cyan/30 hover:bg-nexora-cyan/25 font-medium transition-colors"
                  >
                    Authenticate Puter
                  </button>
                )}
              </div>
            )}

            <button
              onClick={handleNewChat}
              className="p-2 rounded-lg text-nexora-muted hover:text-white hover:bg-nexora-card"
              title="New Conversation"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* MESSAGES SCROLL CONTAINER */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center max-w-xl mx-auto text-center space-y-4 py-16">
              <Logo className="w-12 h-12" textClassName="text-2xl font-bold" />
              <h2 className="text-xl font-bold text-white">How can NEXORA AI assist you today?</h2>
              <p className="text-xs sm:text-sm text-nexora-muted">
                {activeProject
                  ? `Active Workspace: ${activeProject.name}`
                  : 'Select an access mode above to stream responses directly through Puter or your private API keys.'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full pt-4 text-left">
                <button
                  onClick={() => handleSendMessage('Design an MQL5 order flow expert advisor with delta volume filters.')}
                  className="p-3.5 rounded-xl bg-nexora-card border border-nexora-border hover:border-nexora-accent/40 text-xs text-slate-300 hover:text-white transition-all space-y-1"
                >
                  <span className="font-semibold text-white block">Quantitative Trading Strategy</span>
                  <span className="text-nexora-muted">MQL5 order flow & delta volume logic</span>
                </button>
                <button
                  onClick={() => handleSendMessage('Compare time and space trade-offs between Redis and Dragonfly.')}
                  className="p-3.5 rounded-xl bg-nexora-card border border-nexora-border hover:border-nexora-accent/40 text-xs text-slate-300 hover:text-white transition-all space-y-1"
                >
                  <span className="font-semibold text-white block">System Architecture</span>
                  <span className="text-nexora-muted">In-memory caching architectures</span>
                </button>
              </div>
            </div>
          ) : (
            messages.map((m, idx) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={m.id || idx}
                  className={`flex gap-3.5 max-w-3xl mx-auto ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-nexora-accent to-nexora-cyan p-[1px] shrink-0 mt-0.5">
                      <div className="w-full h-full bg-nexora-darkest rounded-[11px] flex items-center justify-center">
                        <Bot className="w-4 h-4 text-nexora-cyan" />
                      </div>
                    </div>
                  )}

                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed max-w-[85%] space-y-2 ${
                      isUser
                        ? 'bg-nexora-accent/20 border border-nexora-accent/40 text-white'
                        : 'bg-nexora-card/70 border border-nexora-border text-slate-200'
                    }`}
                  >
                    {/* Render Attachments if present */}
                    {m.attachments?.length > 0 && (
                      <div className="flex flex-wrap gap-2 pb-2 border-b border-nexora-border/40">
                        {m.attachments.map((att, aIdx) => (
                          <span
                            key={aIdx}
                            className="text-[11px] font-mono px-2 py-0.5 rounded bg-nexora-dark border border-nexora-border text-nexora-cyan flex items-center gap-1"
                          >
                            <FileCode className="w-3 h-3" /> {att.filename}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="prose prose-invert prose-sm max-w-none text-xs sm:text-sm">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                      >
                        {m.content}
                      </ReactMarkdown>
                    </div>

                    {!isUser && (
                      <div className="flex items-center justify-between pt-2 border-t border-nexora-border/30 text-[10px] text-nexora-muted">
                        <span className="font-mono">
                          {m.model_id || selectedModel.id} ({m.provider_id || selectedModel.provider})
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopyMessage(m.content, idx)}
                            className="hover:text-white flex items-center gap-1"
                          >
                            {copiedIndex === idx ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-xl bg-nexora-card border border-nexora-border flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-4 h-4 text-slate-300" />
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 3. MESSAGE COMPOSER */}
        <div className="p-4 border-t border-nexora-border/60 bg-nexora-darkest/90 backdrop-blur-md">
          <div className="max-w-3xl mx-auto space-y-2">
            {/* Attached file badges */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 px-1">
                {attachments.map((att, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-nexora-card border border-nexora-border text-xs text-white"
                  >
                    <FileCode className="w-3.5 h-3.5 text-nexora-cyan" />
                    <span className="truncate max-w-[150px]">{att.filename}</span>
                    <button
                      onClick={() => setAttachments(attachments.filter((_, i) => i !== index))}
                      className="text-nexora-muted hover:text-red-400 ml-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input Bar */}
            <div className="relative rounded-2xl bg-nexora-card border border-nexora-border focus-within:border-nexora-accent/60 shadow-lg">
              <textarea
                rows={2}
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={`Ask ${selectedModel?.name} (Shift + Enter for new line)...`}
                className="w-full px-4 pt-3 pb-10 bg-transparent text-sm text-white placeholder-nexora-muted focus:outline-none resize-none leading-relaxed"
              />

              <div className="absolute left-3 bottom-2.5 flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                  accept=".py,.mql5,.mq5,.mqh,.csv,.json,.txt,.log,.pdf,.md"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 rounded-lg text-nexora-muted hover:text-white hover:bg-nexora-dark transition-colors"
                  title="Attach source file (.py, .mql5, .csv, .json, .pdf)"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                {activeProject && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-nexora-dark text-nexora-accent border border-nexora-accent/30">
                    Workspace: {activeProject.name}
                  </span>
                )}
              </div>

              <div className="absolute right-3 bottom-2.5 flex items-center gap-2">
                {isGenerating ? (
                  <button
                    onClick={handleStopGeneration}
                    className="p-1.5 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                    title="Stop Generation"
                  >
                    <Square className="w-4 h-4 fill-red-400" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!inputPrompt.trim() && attachments.length === 0}
                    className="p-2 rounded-xl bg-gradient-to-r from-nexora-accent to-nexora-cyan hover:opacity-90 disabled:opacity-30 text-white transition-all shadow-md shadow-nexora-accent/20"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between px-1 text-[11px] text-nexora-muted">
              <span>
                {accessMethod === 'puter'
                  ? 'Billed directly to your Puter.com allowance.'
                  : 'BYOK: Direct provider API inference, zero platform markup.'}
              </span>
              <button
                onClick={() => onOpenLegal('privacy')}
                className="hover:text-slate-300 transition-colors"
              >
                Privacy & Data Policies
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* MODALS */}
      <ModelSelectorModal
        isOpen={modelSelectorOpen}
        onClose={() => setModelSelectorOpen(false)}
        models={models}
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
        accessMethod={accessMethod}
      />

      <ProviderKeysModal
        isOpen={keysModalOpen}
        onClose={() => setKeysModalOpen(false)}
      />

      <UsageDashboardModal
        isOpen={usageModalOpen}
        onClose={() => setUsageModalOpen(false)}
      />

      {comparisonOpen && (
        <ModelComparisonView
          models={models}
          onClose={() => setComparisonOpen(false)}
        />
      )}

      <ProjectWorkspacesModal
        isOpen={projectsModalOpen}
        onClose={() => setProjectsModalOpen(false)}
        onSelectProject={setActiveProject}
        activeProjectId={activeProject?.id}
      />
    </div>
  );
}
