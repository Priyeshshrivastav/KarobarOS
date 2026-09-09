'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { VoiceInput } from '@/components/voice-input';
import { 
  Sparkles, 
  Send, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle, 
  Bot, 
  User, 
  Wrench,
  XCircle,
  RefreshCw
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: Array<{ name: string; input: any; output: any }>;
  needsConfirmation?: {
    aiActionId: string;
    prompt: string;
    actionDetails: any;
  } | null;
  confirmed?: boolean;
}

function AssistantChat() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Namaste! Main aapka KarobarOS AI Assistant hoon. Aap mujhse bolkar ya likhkar apne customers, sales, appointments aur tasks manage kar sakte hain. Boliye, aaj kya karna hai?',
    },
  ]);
  const [input, setInput] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    if (initialQuery) {
      sendMessage(initialQuery);
    }
  }, []);

  const sendMessage = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply,
        toolCalls: data.tool_calls,
        needsConfirmation: data.needs_confirmation,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Maaf kijiye, error aaya: ${err.message || 'Unable to connect'}. Kripya dobara try karein.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAction = async (msgId: string, aiActionId: string) => {
    setConfirmingId(aiActionId);
    try {
      const res = await fetch('/api/ai/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ai_action_id: aiActionId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Confirmation failed');
      }

      // Mark this message's confirmation as executed
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? {
                ...m,
                confirmed: true,
                content: `${m.content}\n\n✅ **Action Confirmed & Executed!**`,
              }
            : m
        )
      );
    } catch (err: any) {
      alert(`Confirmation error: ${err.message}`);
    } finally {
      setConfirmingId(null);
    }
  };

  const handleDismissConfirmation = (msgId: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? {
              ...m,
              needsConfirmation: null,
              content: `${m.content}\n\n❌ **Action Cancelled by User.**`,
            }
          : m
      )
    );
  };

  const chips = [
    'Rahul ko naya customer banao (9876543210)',
    'Aaj ki total kitni sale hui?',
    'Pending udhaar payments dikhao',
    'Priya ka kal 11 baje haircut appointment book karo',
    'Priya ko payment reminder message draft karo',
  ];

  return (
    <AppShell>
      <div className="flex flex-col h-[calc(100vh-8.5rem)] md:h-[calc(100vh-5rem)] max-w-4xl mx-auto glass-panel rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
        {/* Header */}
        <div className="px-4 py-3 bg-[#0c1222] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                KarobarOS AI Assistant
                <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded font-mono">
                  Llama 3.3 70B
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">Hindi &bull; Hinglish &bull; English</p>
            </div>
          </div>
          <button
            onClick={() => setMessages([messages[0]])}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-slate-800 transition-colors"
            title="Clear Chat History"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>

        {/* Message List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className="max-w-[85%] sm:max-w-[75%] space-y-2">
                <div
                  className={`p-3.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-emerald-600 text-white rounded-tr-sm shadow-md'
                      : 'bg-slate-900/90 text-slate-200 border border-slate-800 rounded-tl-sm'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>

                {/* Tool call details pill */}
                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {msg.toolCalls.map((tc, idx) => (
                      <div
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/80 text-[10px] text-emerald-300 font-mono"
                      >
                        <Wrench className="w-3 h-3 text-emerald-400" />
                        <span>{tc.name}</span>
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 ml-0.5" />
                      </div>
                    ))}
                  </div>
                )}

                {/* CONFIRMATION CARD (Section 5 requirement) */}
                {msg.needsConfirmation && !msg.confirmed && (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-3 mt-2 shadow-lg">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                          Action Requires Confirmation
                        </p>
                        <p className="text-xs text-slate-200 mt-1">
                          {msg.needsConfirmation.prompt}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() =>
                          handleConfirmAction(
                            msg.id,
                            msg.needsConfirmation!.aiActionId
                          )
                        }
                        disabled={confirmingId === msg.needsConfirmation.aiActionId}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                      >
                        {confirmingId === msg.needsConfirmation.aiActionId ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        <span>Confirm &amp; Execute</span>
                      </button>

                      <button
                        onClick={() => handleDismissConfirmation(msg.id)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Dismiss</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-emerald-400 animate-pulse pl-10">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>KarobarOS AI soch raha hai...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips */}
        <div className="px-3 py-2 bg-slate-950/60 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {chips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => sendMessage(chip)}
              className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-[11px] text-slate-300 hover:text-white whitespace-nowrap transition-colors"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-[#0c1222] border-t border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask in Hindi, Hinglish, or English..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* Voice Input Microphone */}
            <VoiceInput
              onTranscript={(text) => {
                setInput(text);
                sendMessage(text);
              }}
              disabled={loading}
            />

            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all active:scale-95 disabled:opacity-40"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}

export default function AssistantPage() {
  return (
    <Suspense fallback={<div className="text-center p-8 text-slate-400">Loading Assistant...</div>}>
      <AssistantChat />
    </Suspense>
  );
}
