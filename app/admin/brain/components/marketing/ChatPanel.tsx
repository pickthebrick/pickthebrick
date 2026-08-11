"use client";

import { useEffect, useRef, useState } from "react";
import {
  getChatHistoryAction,
  sendChatMessageAction,
  getInstructionsAction,
  addInstructionAction,
  removeInstructionAction,
  getRecommendationsAction,
  setRecommendationStatusAction,
  executeActionAction,
  getMarketingWorkspaceState,
} from "@/app/actions/marketingAi";
import type { MarketingRecommendation } from "@/lib/ai/marketingProvider";
import { SectionCard, Markdown } from "../ui";
import RecommendationCard from "./RecommendationCard";

type ChatRow = { id: string; role: string; content: string; toolCallsJson: string | null };
type Instruction = { id: string; text: string };
type ToolCallEntry = { name: string; args: Record<string, unknown>; recommendationId?: string };

function parseToolCalls(toolCallsJson: string | null): ToolCallEntry[] {
  if (!toolCallsJson) return [];
  try {
    return JSON.parse(toolCallsJson) as ToolCallEntry[];
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
  const [recMap, setRecMap] = useState<Record<string, MarketingRecommendation>>({});
  const [permissions, setPermissions] = useState<Record<string, string[]>>({});
  const [executing, setExecuting] = useState<Record<string, boolean>>({});
  const threadRef = useRef<HTMLDivElement>(null);

  function loadRecommendations() {
    getRecommendationsAction().then((recs) => {
      setRecMap(Object.fromEntries(recs.map((r) => [r.id, r])));
    });
  }

  useEffect(() => {
    Promise.all([getChatHistoryAction(), getInstructionsAction(), getMarketingWorkspaceState()]).then(([history, instr, state]) => {
      setMessages(history);
      setInstructions(instr);
      setPermissions(state.permissions);
      setLoading(false);
    });
    loadRecommendations();
  }, []);

  // Always jump to the latest message - a chat you have to manually scroll
  // down every turn isn't usable as a live conversation.
  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, busy]);

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
      // Any tool call may have created or changed a recommendation - refresh
      // the whole map rather than trying to reason about which ids changed.
      if (toolCalls.length) loadRecommendations();
    } catch {
      setMessages((cur) => [...cur, { id: `err-${Date.now()}`, role: "assistant", content: "Something went wrong - try again.", toolCallsJson: null }]);
    } finally {
      setBusy(false);
    }
  }

  function setRecStatus(id: string, status: "APPROVED" | "REJECTED") {
    setRecMap((cur) => (cur[id] ? { ...cur, [id]: { ...cur[id], status } } : cur));
    setRecommendationStatusAction(id, status);
  }

  function execute(id: string) {
    setExecuting((s) => ({ ...s, [id]: true }));
    executeActionAction(id)
      .then(() => loadRecommendations())
      .finally(() => setExecuting((s) => ({ ...s, [id]: false })));
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
        <div className="brain-chat-thread" ref={threadRef}>
          {loading && <div className="brain-empty-note">Loading…</div>}
          {!loading && messages.length === 0 && (
            <div className="brain-assistant-hint">
              Talk to Marketing like an employee - ask it questions, or tell it to do something: &quot;approve the Google keyword
              recommendation&quot;, &quot;set autonomy to semi-autonomous&quot;, &quot;always flag CPL spikes over 20%&quot;.
            </div>
          )}
          {messages.map((m) => {
            const calls = parseToolCalls(m.toolCallsJson);
            const recIds = Array.from(new Set(calls.map((c) => c.recommendationId).filter((id): id is string => !!id)));
            return (
              <div key={m.id}>
                <div className={`brain-assistant-bubble brain-assistant-bubble--${m.role} brain-chat-bubble`}>
                  {m.role === "assistant" ? <Markdown>{m.content}</Markdown> : m.content}
                </div>
                {calls.length > 0 && <div className="brain-chat-trace">did: {calls.map((c) => c.name.replace(/_/g, " ")).join(", ")}</div>}
                {recIds.map((id) =>
                  recMap[id] ? (
                    <RecommendationCard
                      key={id}
                      recommendation={recMap[id]}
                      permissions={permissions}
                      onApprove={(recId) => setRecStatus(recId, "APPROVED")}
                      onReject={(recId) => setRecStatus(recId, "REJECTED")}
                      onExecute={execute}
                      executing={!!executing[id]}
                    />
                  ) : null,
                )}
              </div>
            );
          })}
          {busy && <div className="brain-assistant-bubble brain-assistant-bubble--assistant brain-chat-bubble">Thinking…</div>}
        </div>
        <div className="brain-assistant-input-row">
          <input
            className="brain-assistant-input"
            value={input}
            placeholder="Message Aiman…"
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
