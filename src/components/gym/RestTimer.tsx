"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface RestTimerProps {
  seconds: number;
  onDismiss: () => void;
}

export function RestTimer({ seconds, onDismiss }: RestTimerProps) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (remaining <= 0) {
      onDismiss();
      return;
    }

    const interval = setInterval(() => {
      setRemaining((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [remaining, onDismiss]);

  const pct = ((seconds - remaining) / seconds) * 100;

  return (
    <div className="mt-3 rounded-xl border border-accent/30 bg-accent-subtle px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-accent">REST</span>
        <button
          onClick={onDismiss}
          className="text-text-muted hover:text-text-primary cursor-pointer"
        >
          <X size={14} />
        </button>
      </div>
      <div className="text-center font-mono text-2xl font-extrabold text-accent tabular-nums">
        {remaining}s
      </div>
      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-accent transition-all duration-1000"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
