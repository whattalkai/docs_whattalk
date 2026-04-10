"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { Task, Message, ApiAction, Settings } from "./types";

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function parseApiActions(text: string): { cleanText: string; actions: Array<{ method: string; endpoint: string; body: unknown; description: string }> } {
  const actions: Array<{ method: string; endpoint: string; body: unknown; description: string }> = [];
  const cleanText = text.replace(/```api-action\n([\s\S]*?)```/g, (_, json) => {
    try {
      actions.push(JSON.parse(json.trim()));
    } catch { /* ignore parse errors */ }
    return "";
  });
  return { cleanText: cleanText.trim(), actions };
}

function SettingsModal({ settings, onSave, onClose }: {
  settings: Settings;
  onSave: (s: Settings) => void;
  onClose: () => void;
}) {
  const [local, setLocal] = useState(settings);
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-[#1a1a1a] rounded-xl p-6 w-[480px] border border-[#2e2e2e]" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold mb-4">Settings</h2>
        <div className="space-y-4">
          <p className="text-xs text-[#666] mb-2">Anthropic API key is loaded from .env.local on the server.</p>
          <div>
            <label className="block text-sm text-[#a0a0a0] mb-1">AutoCalls API Key (optional — for API actions)</label>
            <input type="password" value={local.autocallsApiKey}
              onChange={(e) => setLocal({ ...local, autocallsApiKey: e.target.value })}
              className="w-full bg-[#0f0f0f] border border-[#2e2e2e] rounded-lg px-3 py-2 text-sm text-[#e5e5e5] focus:outline-none focus:border-[#6d5cff]"
              placeholder="your-autocalls-api-key" />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm text-[#a0a0a0] hover:text-[#e5e5e5]">Cancel</button>
          <button onClick={() => { onSave(local); onClose(); }} className="px-4 py-2 text-sm bg-[#6d5cff] hover:bg-[#7d6eff] rounded-lg text-white">Save</button>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ tasks, activeTaskId, onSelect, onCreate }: {
  tasks: Task[];
  activeTaskId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
}) {
  const statusColors: Record<string, string> = {
    idle: "#666", running: "#6d5cff", done: "#22c55e", error: "#ef4444",
  };
  return (
    <div className="w-[280px] min-w-[280px] bg-[#1a1a1a] border-r border-[#2e2e2e] flex flex-col h-full">
      <div className="p-4 border-b border-[#2e2e2e] flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-[#6d5cff] flex items-center justify-center text-white text-sm font-bold">W</div>
        <span className="font-semibold text-sm">WhatTalk Prompt Agent</span>
      </div>
      <div className="p-3">
        <button onClick={onCreate} className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-[#242424] hover:bg-[#2a2a2a] rounded-lg transition-colors">
          <span className="text-[#6d5cff]">+</span><span>New Task</span>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-2">
        {tasks.map((task) => (
          <button key={task.id} onClick={() => onSelect(task.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-left transition-colors ${activeTaskId === task.id ? "bg-[#242424]" : "hover:bg-[#2a2a2a]"}`}>
            <div className="flex-1 min-w-0">
              <div className="text-sm truncate">{task.name}</div>
              <div className="text-xs text-[#666]">{formatTime(task.createdAt)}</div>
            </div>
            <div className="w-2 h-2 rounded-full" style={{ background: statusColors[task.status] }} />
          </button>
        ))}
      </div>
    </div>
  );
}

function ChatPanel({ messages, isStreaming, onSend }: {
  messages: Message[];
  isStreaming: boolean;
  onSend: (text: string) => void;
}) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    onSend(input.trim());
    setInput("");
  };
  return (
    <div className="flex-1 flex flex-col h-full min-w-0">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-5xl mb-4">&#9742;</div>
              <h3 className="text-lg font-semibold mb-2">WhatTalk Prompt Agent</h3>
              <p className="text-sm text-[#a0a0a0] max-w-md">
                Design AI voice assistants, create system prompts, configure tools and variables — all through chat.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 justify-center">
                {["List my assistants", "Create an outbound assistant", "Show available voices", "Search phone numbers"].map((s) => (
                  <button key={s} onClick={() => onSend(s)}
                    className="px-3 py-1.5 text-xs bg-[#242424] hover:bg-[#2a2a2a] border border-[#2e2e2e] rounded-lg transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === "user" ? "bg-[#6d5cff] text-white" : "bg-[#242424] text-[#e5e5e5]"
            }`}>
              <div className="whitespace-pre-wrap break-words">{msg.content}</div>
              <div className={`text-[10px] mt-1 ${msg.role === "user" ? "text-white/50" : "text-[#666]"}`}>
                {formatTime(msg.timestamp)}
              </div>
            </div>
          </div>
        ))}
        {isStreaming && (
          <div className="flex justify-start">
            <div className="bg-[#242424] rounded-xl px-4 py-3">
              <div className="typing-indicator flex gap-1">
                <span className="w-2 h-2 rounded-full bg-[#a0a0a0]" />
                <span className="w-2 h-2 rounded-full bg-[#a0a0a0]" />
                <span className="w-2 h-2 rounded-full bg-[#a0a0a0]" />
              </div>
            </div>
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="p-4 border-t border-[#2e2e2e]">
        <div className="flex gap-2">
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Message the agent..."
            disabled={isStreaming}
            className="flex-1 bg-[#242424] border border-[#2e2e2e] rounded-xl px-4 py-3 text-sm text-[#e5e5e5] focus:outline-none focus:border-[#6d5cff] placeholder:text-[#666] disabled:opacity-50" />
          <button type="submit" disabled={isStreaming || !input.trim()}
            className="px-5 py-3 bg-[#6d5cff] hover:bg-[#7d6eff] disabled:opacity-40 rounded-xl text-sm font-medium text-white transition-colors">
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

function ResultsPanel({ actions, onRunAction }: {
  actions: ApiAction[];
  onRunAction: (action: ApiAction) => void;
}) {
  return (
    <div className="w-[380px] min-w-[380px] bg-[#1a1a1a] border-l border-[#2e2e2e] flex flex-col h-full">
      <div className="p-4 border-b border-[#2e2e2e]">
        <h2 className="font-semibold text-sm">API Actions & Results</h2>
        <p className="text-xs text-[#666] mt-0.5">{actions.length} actions</p>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {actions.length === 0 && (
          <div className="flex items-center justify-center h-full text-[#666] text-sm">
            API actions will appear here
          </div>
        )}
        {actions.map((action) => (
          <div key={action.id} className="bg-[#0f0f0f] border border-[#2e2e2e] rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${
                  action.method === "GET" ? "bg-green-900/30 text-green-400" :
                  action.method === "POST" ? "bg-blue-900/30 text-blue-400" :
                  action.method === "PUT" ? "bg-yellow-900/30 text-yellow-400" :
                  "bg-red-900/30 text-red-400"
                }`}>{action.method}</span>
                <span className="text-xs font-mono text-[#a0a0a0] truncate max-w-[180px]">{action.endpoint}</span>
              </div>
              <div className="flex items-center gap-2">
                {action.statusCode && <span className="text-xs font-mono text-[#666]">{action.statusCode}</span>}
                <div className="w-2 h-2 rounded-full" style={{
                  background: action.status === "success" ? "#22c55e" : action.status === "error" ? "#ef4444" : "#f59e0b"
                }} />
              </div>
            </div>
            {action.status === "pending" && (
              <div className="px-3 pb-2">
                <button onClick={() => onRunAction(action)}
                  className="text-xs bg-[#6d5cff] hover:bg-[#7d6eff] px-3 py-1 rounded-md text-white transition-colors">
                  Run
                </button>
              </div>
            )}
            {action.responseBody && (
              <div className="border-t border-[#2e2e2e] px-3 py-2">
                <pre className="text-xs text-[#a0a0a0] overflow-x-auto max-h-[200px] overflow-y-auto whitespace-pre-wrap !bg-transparent !border-0 !p-0">
                  {action.responseBody}
                </pre>
              </div>
            )}
            <div className="px-3 py-1 text-[10px] text-[#666]">{formatTime(action.timestamp)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const [settings, setSettings] = useState<Settings>({ autocallsApiKey: "" });
  const [showSettings, setShowSettings] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([
    { id: "default", name: "General", status: "idle", type: "general", createdAt: new Date().toISOString() },
  ]);
  const [activeTaskId, setActiveTaskId] = useState("default");
  const [taskMessages, setTaskMessages] = useState<Record<string, Message[]>>({ default: [] });
  const [taskActions, setTaskActions] = useState<Record<string, ApiAction[]>>({ default: [] });
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("agent-settings");
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  const saveSettings = (s: Settings) => {
    setSettings(s);
    localStorage.setItem("agent-settings", JSON.stringify(s));
  };

  const messages = taskMessages[activeTaskId] || [];
  const actions = taskActions[activeTaskId] || [];

  const createTask = () => {
    const id = generateId();
    const task: Task = { id, name: `Task ${tasks.length}`, status: "idle", type: "general", createdAt: new Date().toISOString() };
    setTasks((prev) => [task, ...prev]);
    setTaskMessages((prev) => ({ ...prev, [id]: [] }));
    setTaskActions((prev) => ({ ...prev, [id]: [] }));
    setActiveTaskId(id);
  };

  const addMessage = useCallback((taskId: string, msg: Message) => {
    setTaskMessages((prev) => ({ ...prev, [taskId]: [...(prev[taskId] || []), msg] }));
  }, []);

  const updateLastAssistantMessage = useCallback((taskId: string, text: string) => {
    setTaskMessages((prev) => {
      const msgs = prev[taskId] || [];
      const last = msgs[msgs.length - 1];
      if (last && last.role === "assistant") {
        return { ...prev, [taskId]: [...msgs.slice(0, -1), { ...last, content: last.content + text }] };
      }
      return prev;
    });
  }, []);

  const addAction = useCallback((taskId: string, action: ApiAction) => {
    setTaskActions((prev) => ({ ...prev, [taskId]: [...(prev[taskId] || []), action] }));
  }, []);

  const sendMessage = async (text: string) => {
    const taskId = activeTaskId;
    const userMsg: Message = { id: generateId(), role: "user", content: text, timestamp: new Date().toISOString() };
    addMessage(taskId, userMsg);

    if ((taskMessages[taskId] || []).length === 0) {
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, name: text.slice(0, 40), status: "running" } : t)));
    }

    setIsStreaming(true);
    const assistantMsg: Message = { id: generateId(), role: "assistant", content: "", timestamp: new Date().toISOString() };
    addMessage(taskId, assistantMsg);

    const allMessages = [...(taskMessages[taskId] || []), userMsg].map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: allMessages, autocallsApiKey: settings.autocallsApiKey }),
      });

      if (!res.ok) {
        updateLastAssistantMessage(taskId, "Error: Failed to get response. Check your API key.");
        setIsStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          for (const line of chunk.split("\n")) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") break;
              try {
                const parsed = JSON.parse(data);
                fullText += parsed.text;
                updateLastAssistantMessage(taskId, parsed.text);
              } catch { /* ignore */ }
            }
          }
        }
      }

      const { actions: parsedActions } = parseApiActions(fullText);
      for (const action of parsedActions) {
        addAction(taskId, {
          id: generateId(), method: action.method, endpoint: action.endpoint,
          status: "pending", requestBody: action.body ? JSON.stringify(action.body, null, 2) : undefined,
          timestamp: new Date().toISOString(),
        });
      }
    } catch {
      updateLastAssistantMessage(taskId, "Error: Network error");
    }

    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: "done" } : t)));
    setIsStreaming(false);
  };

  const runAction = async (action: ApiAction) => {
    if (!settings.autocallsApiKey) { setShowSettings(true); return; }

    try {
      const res = await fetch("/api/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: action.method, endpoint: action.endpoint,
          body: action.requestBody ? JSON.parse(action.requestBody) : null,
          apiKey: settings.autocallsApiKey,
        }),
      });
      const result = await res.json();
      setTaskActions((prev) => ({
        ...prev,
        [activeTaskId]: (prev[activeTaskId] || []).map((a) =>
          a.id === action.id ? { ...a, status: result.ok ? "success" as const : "error" as const, statusCode: result.status, responseBody: JSON.stringify(result.data, null, 2) } : a
        ),
      }));
    } catch {
      setTaskActions((prev) => ({
        ...prev,
        [activeTaskId]: (prev[activeTaskId] || []).map((a) =>
          a.id === action.id ? { ...a, status: "error" as const, responseBody: "Network error" } : a
        ),
      }));
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar tasks={tasks} activeTaskId={activeTaskId} onSelect={setActiveTaskId} onCreate={createTask} />
      <ChatPanel messages={messages} isStreaming={isStreaming} onSend={sendMessage} />
      <ResultsPanel actions={actions} onRunAction={runAction} />
      <button onClick={() => setShowSettings(true)} title="Settings"
        className="fixed bottom-4 left-4 w-8 h-8 rounded-full bg-[#242424] border border-[#2e2e2e] flex items-center justify-center text-[#666] hover:text-[#e5e5e5] transition-colors z-10">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      </button>
      {showSettings && <SettingsModal settings={settings} onSave={saveSettings} onClose={() => setShowSettings(false)} />}
    </div>
  );
}
