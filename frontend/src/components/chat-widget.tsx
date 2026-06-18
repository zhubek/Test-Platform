"use client";

// Floating AI-assistant chat for the admin panel: a corner bubble that expands
// into a chat panel. Talks to the backend `/assistant/chat` SSE proxy (which
// holds the Gemini key and the read-only content tools / MCP layer). Renders the
// reply token-by-token and shows a marker whenever the assistant uses a tool.

import { useEffect, useRef, useState } from "react";
import { Bot, Send, X, Loader2, Sparkles, Wrench } from "lucide-react";
import { apiFetchStream } from "@/lib/api-client";
import { useProject } from "@/lib/project-context";
import { useLocale } from "@/lib/locale-context";
import { localize } from "@/lib/localized";
import { cn } from "@/lib/utils";

interface Msg {
  role: "user" | "assistant" | "tool";
  content?: string;
  error?: boolean;
  tool?: { name: string; args: Record<string, unknown> };
}

const GREETING: Msg = {
  role: "assistant",
  content: "Hi! I'm your assistant. Ask me about your projects, tests, blocks, or catalogs.",
};

export function ChatWidget() {
  const { project } = useProject();
  const { locale } = useLocale();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open, loading]);

  // Grow the open assistant bubble, or start a new one if the last turn was a
  // user message or a tool marker.
  const pushToken = (token: string) =>
    setMessages((ms) => {
      const last = ms[ms.length - 1];
      if (last && last.role === "assistant" && !last.error) {
        return ms.map((m, i) =>
          i === ms.length - 1 ? { ...m, content: (m.content ?? "") + token } : m,
        );
      }
      return [...ms, { role: "assistant", content: token }];
    });

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const history = messages.filter((m) => !m.error && m.role !== "tool");
    const next: Msg[] = [...history, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);

    // Only the real text turns go to the model (drop the greeting + tool chips).
    const turns = next
      .filter((m) => m !== GREETING && m.role !== "tool" && m.content)
      .map((m) => ({ role: m.role, content: m.content as string }));

    try {
      const res = await apiFetchStream("/assistant/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: turns,
          projectId: project.id || undefined,
          projectName: project.id ? localize(project.name, locale) : undefined,
        }),
      });
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let sep: number;
        while ((sep = buffer.indexOf("\n\n")) >= 0) {
          const raw = buffer.slice(0, sep);
          buffer = buffer.slice(sep + 2);
          let event = "message";
          let data = "";
          for (const line of raw.split("\n")) {
            if (line.startsWith("event:")) event = line.slice(6).trim();
            else if (line.startsWith("data:")) data += line.slice(5).trim();
          }
          if (!data) continue;
          if (event === "token") {
            pushToken((JSON.parse(data) as { token: string }).token);
          } else if (event === "tool") {
            const tool = JSON.parse(data) as { name: string; args: Record<string, unknown> };
            setMessages((ms) => [...ms, { role: "tool", tool }]);
          } else if (event === "error") {
            const { message } = JSON.parse(data) as { message: string };
            setMessages((ms) => [...ms, { role: "assistant", content: `⚠️ ${message}`, error: true }]);
          }
        }
      }
    } catch (e) {
      setMessages((ms) => [
        ...ms,
        { role: "assistant", content: `⚠️ ${(e as Error).message}`, error: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const last = messages[messages.length - 1];
  const waiting = loading && (last?.role === "user" || last?.role === "tool");

  return (
    <div className="fixed bottom-5 right-5 z-[60] flex flex-col items-end">
      {open && (
        <div className="animate-fade-up mb-3 flex h-[40rem] max-h-[calc(100vh-6rem)] w-[30rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
              </span>
              <div className="leading-tight">
                <div className="text-sm font-semibold">Assistant</div>
                <div className="text-[0.65rem] text-muted-foreground">
                  Powered by Gemini · reads your content
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title="Minimize"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
            {messages.map((m, i) => {
              if (m.role === "tool") {
                return (
                  <div key={i} className="flex justify-center">
                    <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted/60 px-2.5 py-1 text-[0.7rem] text-muted-foreground">
                      <Wrench className="h-3 w-3" />
                      Used <span className="font-mono font-medium">{m.tool!.name}</span>
                    </span>
                  </div>
                );
              }
              if (!m.content) return null;
              return (
                <div
                  key={i}
                  className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[88%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-[0.85rem] leading-relaxed",
                      m.role === "user"
                        ? "rounded-br-sm bg-primary text-primary-foreground"
                        : m.error
                          ? "rounded-bl-sm bg-red-50 text-red-700"
                          : "rounded-bl-sm bg-muted text-foreground",
                    )}
                  >
                    {m.content}
                  </div>
                </div>
              );
            })}
            {waiting && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm bg-muted px-3 py-2 text-[0.82rem] text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
                </div>
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="border-t p-2.5">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                rows={1}
                placeholder="Ask about your tests, blocks, catalogs…"
                className="max-h-32 flex-1 resize-none rounded-lg border bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring"
              />
              <button
                onClick={() => void send()}
                disabled={!input.trim() || loading}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
                title="Send"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle bubble */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
        title={open ? "Close assistant" : "Open assistant"}
      >
        {open ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
      </button>
    </div>
  );
}
