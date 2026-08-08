"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DesignStepper from "../DesignStepper";
import SpaceIcon from "../SpaceIcon";
import { SPACES } from "@/lib/spaces";
import { setDesignRequestSpaces } from "@/app/actions/design";
import "../../marketing.css";

const MAX_QTY = 6;

export default function SpacesSurvey({
  id,
  initialQuantities,
  buttonImages,
}: {
  id: string;
  packageKey: string;
  sqft: number;
  initialQuantities: Record<string, number>;
  buttonImages: Record<string, string>;
}) {
  const router = useRouter();
  const [quantities, setQuantities] = useState<Record<string, number>>(initialQuantities);
  const [continuing, setContinuing] = useState(false);

  const selectedCount = Object.values(quantities).filter((q) => q > 0).length;
  const totalInstances = Object.values(quantities).reduce((sum, q) => sum + q, 0);

  function select(key: string) {
    setQuantities((prev) => ({ ...prev, [key]: 1 }));
  }
  function adjust(key: string, delta: number) {
    setQuantities((prev) => {
      const next = Math.max(0, Math.min(MAX_QTY, (prev[key] ?? 0) + delta));
      return { ...prev, [key]: next };
    });
  }

  async function handleContinue() {
    if (selectedCount === 0 || continuing) return;
    setContinuing(true);
    try {
      const entries = Object.entries(quantities)
        .filter(([, qty]) => qty > 0)
        .map(([spaceKey, quantity]) => ({ spaceKey, quantity }));
      await setDesignRequestSpaces(id, entries);
      router.push(`/design/features?id=${id}`);
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
            <span className="survey-count-num">{totalInstances}</span> space{totalInstances === 1 ? "" : "s"} added
          </span>
        </div>

        <div className="space-grid">
          {SPACES.map((s) => {
            const qty = quantities[s.key] ?? 0;
            const isSelected = qty > 0;
            return (
              <div
                key={s.key}
                className={`space-card ${isSelected ? "selected" : ""}`}
                onClick={!isSelected ? () => select(s.key) : undefined}
              >
                {isSelected && <span className="space-check">✓</span>}
                {buttonImages[s.key] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={buttonImages[s.key]} alt="" className="space-icon" />
                ) : (
                  <SpaceIcon spaceKey={s.key} className="space-icon" />
                )}
                <span className="space-label">{s.label}</span>
                {isSelected && (
                  <div className="space-qty-stepper" onClick={(e) => e.stopPropagation()}>
                    <button type="button" onClick={() => adjust(s.key, -1)} aria-label={`Remove one ${s.label}`}>
                      −
                    </button>
                    <span className="space-qty-num">{qty}</span>
                    <button
                      type="button"
                      onClick={() => adjust(s.key, 1)}
                      disabled={qty >= MAX_QTY}
                      aria-label={`Add another ${s.label}`}
                    >
                      +
                    </button>
                  </div>
                )}
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
            disabled={selectedCount === 0 || continuing}
            title={selectedCount === 0 ? "Select at least one space first" : undefined}
            onClick={handleContinue}
          >
            {continuing ? "Saving…" : "Continue →"}
          </button>
        </div>
      </main>
    </div>
  );
}
