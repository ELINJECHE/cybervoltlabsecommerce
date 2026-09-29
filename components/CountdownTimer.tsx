"use client";

import { useEffect, useState } from "react";

function getRemaining(endsAt: string) {
  const diff = new Date(endsAt).getTime() - Date.now();
  const clamped = Math.max(diff, 0);
  const hours = Math.floor(clamped / (1000 * 60 * 60));
  const minutes = Math.floor((clamped / (1000 * 60)) % 60);
  const seconds = Math.floor((clamped / 1000) % 60);
  return { hours, minutes, seconds, expired: diff <= 0 };
}

export default function CountdownTimer({ endsAt }: { endsAt: string }) {
  // Starts null so server and first client render match; the real value is
  // filled in after mount, since Date.now() differs between server and client.
  const [remaining, setRemaining] = useState<ReturnType<typeof getRemaining> | null>(null);

  useEffect(() => {
    setRemaining(getRemaining(endsAt));
    const interval = setInterval(() => setRemaining(getRemaining(endsAt)), 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  if (!remaining) {
    return <span className="text-xs font-semibold text-white/80" aria-hidden="true">&nbsp;</span>;
  }

  if (remaining.expired) {
    return <span className="text-xs font-semibold text-white/80">Deal ended</span>;
  }

  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <div className="flex items-center gap-1 font-mono text-sm font-bold text-white" role="timer" aria-label="Time left on this deal">
      {[remaining.hours, remaining.minutes, remaining.seconds].map((unit, i) => (
        <span key={i} className="flex items-center gap-1">
          <span className="rounded bg-black/30 px-1.5 py-0.5">{pad(unit)}</span>
          {i < 2 && <span>:</span>}
        </span>
      ))}
    </div>
  );
}
