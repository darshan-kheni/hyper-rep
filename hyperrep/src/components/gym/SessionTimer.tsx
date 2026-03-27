"use client";

import { useState, useEffect } from "react";

interface SessionTimerProps {
  startedAt: string;
}

export function SessionTimer({ startedAt }: SessionTimerProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = new Date(startedAt).getTime();

    const update = () => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  const hrs = Math.floor(elapsed / 3600);
  const mins = Math.floor((elapsed % 3600) / 60);
  const secs = elapsed % 60;

  const formatted = hrs > 0
    ? `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
    : `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  return (
    <div className="flex-1 rounded-xl border border-accent/30 bg-accent-subtle px-4 py-3 text-center font-mono text-sm font-extrabold text-accent tabular-nums">
      {formatted}
    </div>
  );
}
