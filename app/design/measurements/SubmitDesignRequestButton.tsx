"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitDesignRequest } from "@/app/actions/design";

export default function SubmitDesignRequestButton({ id }: { id: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitDesignRequest(id);
      router.push("/my-quotes");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit your request");
      setSubmitting(false);
    }
  }

  return (
    <div className="design-summary" style={{ justifyContent: "center", flexDirection: "column", gap: 12 }}>
      <button type="button" className="design-start-btn" onClick={handleSubmit} disabled={submitting}>
        {submitting ? "Submitting…" : "Submit design request →"}
      </button>
      {error && <p className="sqft-hint">{error}</p>}
    </div>
  );
}
