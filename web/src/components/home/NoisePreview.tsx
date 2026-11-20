"use client";

import { ArrowDownRight } from "lucide-react";
import { useState } from "react";

export function NoisePreview() {
  const [filtered, setFiltered] = useState(true);
  return (
    <div className="noise-preview">
      <div className="noise-preview-heading">
        <h3>A little tuning. A lot of clarity.</h3>
        <button
          type="button"
          role="switch"
          aria-checked={filtered}
          aria-label="Filter known noise"
          onClick={() => setFiltered(!filtered)}
        >
          <span />
          Filter noise
        </button>
      </div>
      <div
        className="noise-plot"
        aria-label={
          filtered
            ? "Illustration showing known noise removed and threat signals remaining"
            : "Illustration showing threat signals mixed with known noise"
        }
      >
        {Array.from({ length: 90 }, (_, i) => (
          <span
            key={i}
            className={`${i % 17 === 3 ? "is-signal" : "is-noise"} ${filtered ? "is-filtered" : ""}`}
            style={{ transitionDelay: `${(i % 15) * 12}ms` }}
          />
        ))}
      </div>
      <div className="noise-legend">
        <span>
          <i />
          Known noise
        </span>
        <span>
          <i />
          Threat signals
        </span>
        <span className="noise-state">
          <ArrowDownRight size={15} aria-hidden="true" />
          {filtered ? "Focus on what matters" : "Every event competes for attention"}
        </span>
      </div>
      <p className="noise-caption">
        A simple illustration. Explore the lab for the full tuning model.
      </p>
    </div>
  );
}
