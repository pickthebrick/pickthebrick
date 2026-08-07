"use client";

import { useRef, useState } from "react";
import { askSiteAssistant, type ChatMessage } from "@/app/actions/assistant";

const STARTER_PROMPTS = [
  "What's the difference between Design and Build?",
  "Are your prices really all-inclusive?",
  "How do I become a contractor partner?",
];

export default function AskAiClient() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const send = async (text: string) => {
    const question = text.trim();
    if (!question || busy) return;
    const next: ChatMessage[] = [...messages, { role: "user", content: question }];
    setMessages(next);
    setInput("");
    setBusy(true);
    setError(null);
    try {
      const reply = await askSiteAssistant(next);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setError("Something went wrong reaching the assistant - please try again.");
    } finally {
      setBusy(false);
      requestAnimationFrame(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }));
    }
  };

  return (
    <div className="landing-section ask-ai-page">
      <div className="ask-ai-intro">
        <h1>Ask AI</h1>
        <p>Have a question about PickTheBrick, Design vs Build, pricing, or becoming a partner? Ask below.</p>
      </div>

      <div className="ask-ai-box">
        <div className="ask-ai-messages" ref={listRef}>
          {messages.length === 0 && (
            <div className="ask-ai-empty">
              <p>Try one of these:</p>
              <div className="ask-ai-starters">
                {STARTER_PROMPTS.map((p) => (
                  <button key={p} type="button" onClick={() => send(p)} disabled={busy}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`ask-ai-bubble ${m.role}`}>
              {m.content}
            </div>
          ))}
          {busy && <div className="ask-ai-bubble assistant ask-ai-typing">Thinking…</div>}
        </div>

        {error && <p className="ask-ai-error">{error}</p>}

        <form
          className="ask-ai-input-row"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            disabled={busy}
          />
          <button type="submit" className="landing-hero-cta" disabled={busy || !input.trim()}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
