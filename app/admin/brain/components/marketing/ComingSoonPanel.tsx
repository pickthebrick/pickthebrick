"use client";

export default function ComingSoonPanel({ title, description }: { title: string; description: string }) {
  return (
    <div className="brain-comingsoon">
      <div className="brain-comingsoon-badge">Coming soon</div>
      <div className="brain-comingsoon-title">{title}</div>
      <div className="brain-comingsoon-desc">{description}</div>
    </div>
  );
}
