"use client";

import { useState } from "react";
import { CALC_QUALITY_MULTIPLIER, CALC_PER_SQFT, CALC_PER_EMPLOYEE, CALC_BREAKDOWN_PCT } from "../../data";
import { SectionCard, ProgressBar, PrimaryButton } from "../ui";

const QUALITIES = Object.keys(CALC_QUALITY_MULTIPLIER);

export default function CalculatorPanel() {
  const [size, setSize] = useState(3000);
  const [employees, setEmployees] = useState(40);
  const [quality, setQuality] = useState("Premium");

  const mult = CALC_QUALITY_MULTIPLIER[quality];
  const total = Math.round((size * CALC_PER_SQFT + employees * CALC_PER_EMPLOYEE) * mult);

  return (
    <div className="brain-grid" style={{ gridTemplateColumns: "1fr 1.2fr" }}>
      <SectionCard>
        <div className="brain-slider-label">
          Office size: <span className="brain-slider-value">{size.toLocaleString()} sqft</span>
        </div>
        <input
          type="range"
          min={500}
          max={10000}
          step={100}
          value={size}
          onChange={(e) => setSize(Number(e.target.value))}
          className="brain-slider"
        />
        <div className="brain-slider-label">
          Employees: <span className="brain-slider-value">{employees}</span>
        </div>
        <input
          type="range"
          min={5}
          max={200}
          step={5}
          value={employees}
          onChange={(e) => setEmployees(Number(e.target.value))}
          className="brain-slider"
        />
        <div className="brain-slider-label">Quality level</div>
        <div className="brain-quality-row">
          {QUALITIES.map((q) => (
            <div key={q} className={`brain-quality-pill ${quality === q ? "brain-quality-pill--active" : ""}`} onClick={() => setQuality(q)}>
              {q}
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard accent="gold" title="Estimated project cost">
        <div className="brain-calc-total">AED {total.toLocaleString()}</div>
        {CALC_BREAKDOWN_PCT.map(([label, pct]) => (
          <div className="brain-breakdown-row" key={label}>
            <div className="brain-breakdown-label">{label}</div>
            <ProgressBar pct={pct} />
            <div className="brain-breakdown-value">AED {Math.round((total * pct) / 100).toLocaleString()}</div>
          </div>
        ))}
        <PrimaryButton>Customize My Office</PrimaryButton>
      </SectionCard>
    </div>
  );
}
