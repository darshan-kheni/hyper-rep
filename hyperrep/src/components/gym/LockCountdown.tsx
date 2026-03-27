"use client";

import { useState, useEffect } from "react";
import { formatLockTime, getTimeRemaining } from "@/lib/gym/lock-utils";

interface LockCountdownProps {
  lockAt: string;
  onLocked?: () => void;
}

export function LockCountdown({ lockAt, onLocked }: LockCountdownProps) {
  const [remaining, setRemaining] = useState(() => getTimeRemaining(lockAt));

  useEffect(() => {
    const interval = setInterval(() => {
      const r = getTimeRemaining(lockAt);
      setRemaining(r);
      if (r <= 0) {
        clearInterval(interval);
        onLocked?.();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockAt, onLocked]);

  if (remaining <= 0) return null;

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 font-mono text-[9px] font-bold text-warning">
      {formatLockTime(remaining)}
    </span>
  );
}
