"use client";

import { useEffect, useState, type ReactNode } from "react";
import { bfPhase } from "@/lib/blackfriday";

// Shows the Black Friday version until the campaign has ended, then the normal one. The check runs in
// the browser, so the theme turns itself off on 30 Nov without a rebuild.
export default function BlackFridaySwitch({ bf, normal }: { bf: ReactNode; normal: ReactNode }) {
  const [ended, setEnded] = useState(false);
  useEffect(() => setEnded(bfPhase() === "ended"), []);
  return <>{ended ? normal : bf}</>;
}
