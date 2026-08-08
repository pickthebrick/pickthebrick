"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DesignStepper from "../DesignStepper";
import SpaceIcon from "../SpaceIcon";
import { SPACE_QUESTIONS } from "@/lib/spaceQuestions";
import {
  saveDesignRequestSpaceAnswers,
  deleteDesignRequestSpace,
  submitDesignRequest,
  setDesignRequestContact,
} from "@/app/actions/design";
import ContactCaptureForm, { type ContactMethod } from "@/app/components/ContactCaptureForm";
import "../../marketing.css";

export type SpaceInstance = {
  id: string;
  spaceKey: string;
  label: string;
  notes: string;
  answers: Record<string, string>;
};

export default function FeaturesWizard({
  designRequestId,
  instances: initialInstances,
  isAnonymous = false,
}: {
  designRequestId: string;
  instances: SpaceInstance[];
  isAnonymous?: boolean;
}) {
  const router = useRouter();
  const [spaceList, setSpaceList] = useState(initialInstances);
  const [index, setIndex] = useState(0);
  const [drafts, setDrafts] = useState<Record<string, Record<string, string>>>(() =>
    Object.fromEntries(initialInstances.map((inst) => [inst.id, inst.answers])),
  );
  const [notesDrafts, setNotesDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(initialInstances.map((inst) => [inst.id, inst.notes])),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contactMethod, setContactMethod] = useState<ContactMethod>("phone");
  const [contactValue, setContactValue] = useState("");

  const current = spaceList[index];
  const questions = SPACE_QUESTIONS[current.spaceKey] ?? [];
  const answers = drafts[current.id] ?? {};
  const notes = notesDrafts[current.id] ?? "";
  const liveFeatures = Object.fromEntries(Object.entries(answers).map(([k, v]) => [k, v === "true"]));

  function setAnswer(key: string, value: string) {
    setDrafts((prev) => ({ ...prev, [current.id]: { ...prev[current.id], [key]: value } }));
  }
  function setNotes(value: string) {
    setNotesDrafts((prev) => ({ ...prev, [current.id]: value }));
  }

  async function save() {
    await saveDesignRequestSpaceAnswers(current.id, drafts[current.id] ?? {}, notesDrafts[current.id] ?? "");
  }

  async function jumpTo(target: number) {
    if (busy || target === index) return;
    setBusy(true);
    setError(null);
    try {
      await save();
      setIndex(target);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your answers");
    } finally {
      setBusy(false);
    }
  }

  async function handleBack() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await save();
      if (index > 0) {
        setIndex(index - 1);
        setBusy(false);
      } else {
        router.push(`/design/spaces?id=${designRequestId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your answers");
      setBusy(false);
    }
  }

  async function handleNext() {
    if (busy) return;
    const isLastSpace = index === spaceList.length - 1;
    if (isLastSpace && isAnonymous && !contactValue.trim()) {
      setError("Please enter a phone number or email so we can send your design request");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await save();
      if (!isLastSpace) {
        setIndex(index + 1);
        setBusy(false);
      } else {
        if (isAnonymous) {
          await setDesignRequestContact(
            designRequestId,
            contactMethod === "phone" ? { phone: contactValue.trim() } : { email: contactValue.trim() },
          );
        }
        await submitDesignRequest(designRequestId);
        router.push(`/design/handover?id=${designRequestId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your answers");
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (busy) return;
    if (!window.confirm(`Remove ${current.label} from this request?`)) return;
    setBusy(true);
    setError(null);
    try {
      await deleteDesignRequestSpace(current.id);
      const removedId = current.id;
      const next = spaceList.filter((inst) => inst.id !== removedId);
      if (next.length === 0) {
        router.push(`/design/spaces?id=${designRequestId}`);
        return;
      }
      setSpaceList(next);
      setIndex((i) => Math.min(i, next.length - 1));
      setBusy(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove this space");
      setBusy(false);
    }
  }

  const isLast = index === spaceList.length - 1;

  return (
    <div className="ptb-marketing">
      <header>
        <Link href="/" className="brand-mark">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="PickTheBrick" />
        </Link>
        <nav>
          <Link href="/">Home</Link>
          <Link href="/design">Design</Link>
        </nav>
      </header>
      <main>
        <DesignStepper current={2} />

        <div className="features-progress">
          <span className="features-progress-label">
            Space {index + 1} of {spaceList.length} &middot; {current.label}
          </span>
          <div className="features-progress-dots">
            {spaceList.map((inst, i) => (
              <button
                key={inst.id}
                type="button"
                className={`features-dot ${i === index ? "active" : i < index ? "done" : ""}`}
                title={inst.label}
                aria-label={`Jump to ${inst.label}`}
                disabled={busy}
                onClick={() => jumpTo(i)}
              />
            ))}
          </div>
        </div>

        {error && (
          <p className="sqft-hint" style={{ textAlign: "center", marginBottom: 12 }}>
            {error}
          </p>
        )}

        <div className="features-wizard">
          <div className="features-graphic">
            <SpaceIcon spaceKey={current.spaceKey} features={liveFeatures} className="features-graphic-icon" />
          </div>
          <div className="features-questions">
            <div className="features-questions-head">
              <h2>{current.label}</h2>
              <button type="button" className="features-remove-btn" disabled={busy} onClick={handleDelete}>
                Remove this space
              </button>
            </div>
            <p className="features-questions-hint">Tap to tell us what this space needs.</p>

            {questions.map((q) => (
              <div key={q.key} className="features-question-row">
                <span className="features-question-label">{q.label}</span>
                {q.type === "boolean" ? (
                  <button
                    type="button"
                    role="switch"
                    aria-checked={answers[q.key] === "true"}
                    className={`features-switch ${answers[q.key] === "true" ? "on" : ""}`}
                    onClick={() => setAnswer(q.key, answers[q.key] === "true" ? "false" : "true")}
                  >
                    <span className="features-switch-knob" />
                  </button>
                ) : (
                  <div className="features-pill-group">
                    {q.options.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        className={`features-pill ${answers[q.key] === opt ? "selected" : ""}`}
                        onClick={() => setAnswer(q.key, opt)}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <label className="features-notes-label" htmlFor="special-requirements">
              Special requirements
            </label>
            <textarea
              id="special-requirements"
              className="features-notes"
              rows={3}
              placeholder="Anything else we should know about this space?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        {isAnonymous && isLast && (
          <div className="sqft-input-card compact" style={{ marginTop: 20 }}>
            <div className="contact-capture-label">Send my design request to WhatsApp</div>
            <ContactCaptureForm
              method={contactMethod}
              onMethodChange={setContactMethod}
              value={contactValue}
              onValueChange={setContactValue}
            />
          </div>
        )}

        <div className="survey-footer">
          <button type="button" className="survey-btn-secondary" disabled={busy} onClick={handleBack}>
            {index === 0 ? "Go back" : "Previous space"}
          </button>
          <button
            type="button"
            className="survey-btn-primary"
            disabled={busy || (isLast && isAnonymous && !contactValue.trim())}
            onClick={handleNext}
          >
            {busy ? "Saving…" : isLast ? "Submit design request →" : "Next space →"}
          </button>
        </div>
      </main>
    </div>
  );
}
