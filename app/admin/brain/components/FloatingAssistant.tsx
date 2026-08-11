"use client";

import { useEffect, useState } from "react";
import { getChatHistoryAction, sendChatMessageAction } from "@/app/actions/marketingAi";

type ChatRow = { id: string; role: string; content: string };

export default function FloatingAssistant({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [messages, setMessages] = useState<ChatRow[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Same persisted thread as the full Chat tab - Marketing is one
    // employee, reachable either way, not two separate conversations.
    getChatHistoryAction().then((history) => {
      setMessages(history);
      setLoaded(true);
    });
  }, []);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setMessages((cur) => [...cur, { id: `pending-${Date.now()}`, role: "user", content: text }]);
    setInput("");
    setBusy(true);
    try {
      const { reply } = await sendChatMessageAction(text);
      setMessages((cur) => [...cur, { id: `reply-${Date.now()}`, role: "assistant", content: reply }]);
    } catch {
      setMessages((cur) => [...cur, { id: `err-${Date.now()}`, role: "assistant", content: "Something went wrong — try again." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="brain-assistant-btn" onClick={() => onOpenChange(!open)}>
        AI
      </div>
      {open && (
        <div className="brain-assistant-panel">
          <div className="brain-assistant-title">AI Assistant</div>
          <div className="brain-assistant-messages">
            {loaded && messages.length === 0 && (
              <>
                <div className="brain-assistant-bubble">Ask me anything, or tell me to do something - I can act on it.</div>
                <div className="brain-assistant-hint">e.g. &quot;Why did CPL rise this week?&quot;</div>
              </>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`brain-assistant-bubble brain-assistant-bubble--${m.role}`}>
                {m.content}
              </div>
            ))}
            {busy && <div className="brain-assistant-bubble brain-assistant-bubble--assistant">Thinking…</div>}
          </div>
          <div className="brain-assistant-input-row">
            <input
              className="brain-assistant-input"
              value={input}
              placeholder="Ask something…"
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
            />
            <div className="brain-assistant-send" onClick={send}>
              →
            </div>
          </div>
        </div>
      )}
    </>
  );
}
