const STEPS = ["Package", "Spaces", "Features", "Checkout"];

export default function DesignStepper({ current }: { current: number }) {
  return (
    <div className="design-stepper">
      {STEPS.map((step, i) => (
        <div key={step} className="design-stepper-group">
          <div className={`design-stepper-step ${i < current ? "done" : i === current ? "active" : ""}`}>
            <span className="design-stepper-circle">{i < current ? "✓" : i + 1}</span>
            <span className="design-stepper-label">{step}</span>
          </div>
          {i < STEPS.length - 1 && <span className={`design-stepper-line ${i < current ? "done" : ""}`} />}
        </div>
      ))}
    </div>
  );
}
