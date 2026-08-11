"use client";

import { useEffect, useState } from "react";
import {
  getChatHistoryAction,
  sendChatMessageAction,
  getInstructionsAction,
  addInstructionAction,
  removeInstructionAction,
} from "@/app/actions/marketingAi";
import { SectionCard, Markdown } from "../ui";

type ChatRow = { id: string; role: string; content: string; toolCallsJson: string | null };
type Instruction = { id: string; text: string };

function toolTrace(toolCallsJson: string | null): string[] {
  if (!toolCallsJson) return [];
  try {
    const calls = JSON.parse(toolCallsJson) as { name: string }[];
    return calls.map((c) => c.name.replace(/_/g, " "));
  } catch {
    return [];
  }
}

export default function ChatPanel() {
  const [messages, setMessages] = useState<ChatRow[]>([]);
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  const [input, setInput] = useState("");
  const [newInstruction, setNewInstruction] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getChatHistoryAction(), getInstructionsAction()]).then(([history, instr]) => {
      setMessages(history);
      setInstructions(instr);
      setLoading(false);
    });
  }, []);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setMessages((cur) => [...cur, { id: `pending-${Date.now()}`, role: "user", content: text, toolCallsJson: null }]);
    setBusy(true);
    try {
      const { reply, toolCalls } = await sendChatMessageAction(text);
      setMessages((cur) => [
        ...cur,
        { id: `reply-${Date.now()}`, role: "assistant", content: reply, toolCallsJson: toolCalls.length ? JSON.stringify(toolCalls) : null },
      ]);
    } catch {
      setMessages((cur) => [...cur, { id: `err-${Date.now()}`, role: "assistant", content: "Something went wrong - try again.", toolCallsJson: null }]);
    } finally {
      setBusy(false);
    }
  }

  async function addInstruction() {
    const text = newInstruction.trim();
    if (!text) return;
    setNewInstruction("");
    const updated = await addInstructionAction(text);
    setInstructions(updated);
  }

  async function removeInstruction(id: string) {
    const updated = await removeInstructionAction(id);
    setInstructions(updated);
  }

  return (
    <div className="brain-grid" style={{ gridTemplateColumns: "1fr 320px" }}>
      <SectionCard className="brain-chat-card">
        <div className="brain-chat-thread">
          {loading && <div className="brain-empty-note">Loading…</div>}
          {!loading && messages.length === 0 && (
            <div className="brain-assistant-hint">
              Talk to Marketing like an employee - ask it questions, or tell it to do something: &quot;approve the Google keyword
              recommendation&quot;, &quot;set autonomy to semi-autonomous&quot;, &quot;always flag CPL spikes over 20%&quot;.
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id}>
              <div className={`brain-assistant-bubble brain-assistant-bubble--${m.role} brain-chat-bubble`}>
                {m.role === "assistant" ? <Markdown>{m.content}</Markdown> : m.content}
              </div>
              {toolTrace(m.toolCallsJson).length > 0 && (
                <div className="brain-chat-trace">did: {toolTrace(m.toolCallsJson).join(", ")}</div>
              )}
            </div>
          ))}
          {busy && <div className="brain-assistant-bubble brain-assistant-bubble--assistant brain-chat-bubble">Thinking…</div>}
        </div>
        <div className="brain-assistant-input-row">
          <input
            className="brain-assistant-input"
            value={input}
            placeholder="Message Marketing…"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
            }}
          />
          <div className="brain-btn brain-btn--primary brain-btn--small" onClick={send}>
            Send
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Standing instructions">
        <div className="brain-instruction-input-row">
          <input
            className="brain-checklist-input"
            value={newInstruction}
            placeholder="e.g. always flag CPL spikes…"
            onChange={(e) => setNewInstruction(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addInstruction();
            }}
          />
          <div className="brain-btn brain-btn--primary brain-btn--small" onClick={addInstruction}>
            Add
          </div>
        </div>
        {instructions.length === 0 && <div className="brain-empty-note">No standing instructions yet.</div>}
        {instructions.map((i) => (
          <div className="brain-checklist-row" key={i.id}>
            <div className="brain-checklist-text">{i.text}</div>
            <div className="brain-checklist-delete" onClick={() => removeInstruction(i.id)}>
              ✕
            </div>
          </div>
        ))}
        <div className="brain-modal-note">Followed on every future chat turn, not just when reminded.</div>
      </SectionCard>
    </div>
  );
}
