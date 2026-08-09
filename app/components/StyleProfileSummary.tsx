import { rankStyleFinderStats, MIN_SHOWN_FOR_CONFIDENT_PICK } from "@/lib/styleFinder";

// Read-only Style Finder result summary, shared between the client's "My
// design" tab (app/my-quotes/MyQuotesClient.tsx) and the designer's Details
// panel (app/designer/DesignerClient.tsx) - same tally rendering the quiz
// itself shows on completion (see .sf-tally* rules in app/marketing.css),
// just without the swipe-deck chrome around it.
export default function StyleProfileSummary({
  topStyle,
  stats,
}: {
  topStyle: string | null;
  stats: { styleKey: string; shown: number; liked: number }[];
}) {
  const ranked = rankStyleFinderStats(stats);
  if (ranked.length === 0) {
    return <div className="empty">No swipes recorded.</div>;
  }
  const winner = topStyle ? ranked.find((r) => r.key === topStyle) : undefined;

  return (
    <div className="sf-tally-compact">
      {ranked.map((r) => {
        const isWinner = winner && r.key === winner.key;
        const lowSample = r.shown < MIN_SHOWN_FOR_CONFIDENT_PICK;
        return (
          <div key={r.key} className="sf-tally-row">
            <div className="sf-tally-top">
              <span>
                {isWinner ? "🏆 " : ""}
                {r.name}
                {lowSample && <span className="sf-tally-lowsample"> (low sample)</span>}
              </span>
              <span>
                {r.liked}/{r.shown} liked · {r.pct}%
              </span>
            </div>
            <div className="sf-tally-bar">
              <div className="sf-tally-fill" style={{ width: `${r.pct}%`, opacity: isWinner ? 1 : 0.55 }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
