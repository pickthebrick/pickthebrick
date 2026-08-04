"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DesignStepper from "../DesignStepper";
import SpaceIcon from "../SpaceIcon";
import { SPACES } from "@/lib/spaces";
import { updateDesignRequestSpaces } from "@/app/actions/design";
import "../../marketing.css";

export default function SpacesSurvey({
  id,
  initialSpaces,
}: {
  id: string;
  packageKey: string;
  sqft: number;
  initialSpaces: string[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSpaces));
  const [continuing, setContinuing] = useState(false);

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handleContinue() {
    if (selected.size === 0 || continuing) return;
    setContinuing(true);
    try {
      await updateDesignRequestSpaces(id, Array.from(selected));
      router.push(`/design/measurements?id=${id}`);
    } catch {
      setContinuing(false);
    }
  }

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
        <DesignStepper current={1} />

        <div className="survey-heading-row">
          <button type="button" className="survey-back" onClick={() => router.back()}>
            &larr; Select the spaces required
          </button>
          <span className="survey-count">
            <span className="survey-count-num">{selected.size}</span> of {SPACES.length} selected
          </span>
        </div>

        <div className="space-grid">
          {SPACES.map((s) => {
            const isSelected = selected.has(s.key);
            return (
              <div key={s.key} className={`space-card ${isSelected ? "selected" : ""}`} onClick={() => toggle(s.key)}>
                {isSelected && <span className="space-check">✓</span>}
                <SpaceIcon spaceKey={s.key} className="space-icon" />
                <span className="space-label">{s.label}</span>
              </div>
            );
          })}
        </div>

        <div className="survey-footer">
          <button type="button" className="survey-btn-secondary" onClick={() => router.back()}>
            Go back
          </button>
          <button
            type="button"
            className="survey-btn-primary"
            disabled={selected.size === 0 || continuing}
            title={selected.size === 0 ? "Select at least one space first" : undefined}
            onClick={handleContinue}
          >
            {continuing ? "Saving…" : "Continue →"}
          </button>
        </div>
      </main>
    </div>
  );
}
