"use client";

import { useState } from "react";
import Link from "next/link";
import LayoutGenerator from "../LayoutGenerator";
import "../../../marketing.css";

export default function DrawBoardClient({ designRequestId }: { designRequestId: string }) {
  const [generated, setGenerated] = useState(false);

  return (
    <div className="ptb-marketing">
      <header>
        <Link href="/" className="brand-mark">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="PickTheBrick" />
        </Link>
      </header>
      <main>
        <div className="layout-board-page">
          <h1>Draw your office layout</h1>
          <p className="sqft-hint" style={{ marginTop: 0 }}>
            Trace your wall outline and mark doors/windows - this becomes a starting point for your designer, not a
            final design.
          </p>
          {generated && (
            <p className="sqft-hint">
              Layout generated - you can close this tab and return to{" "}
              <Link href={`/design/handover?id=${designRequestId}`}>the Handover step</Link>.
            </p>
          )}
          <LayoutGenerator designRequestId={designRequestId} onGenerated={() => setGenerated(true)} />
        </div>
      </main>
    </div>
  );
}
