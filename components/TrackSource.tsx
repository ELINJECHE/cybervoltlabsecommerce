"use client";

import { useEffect } from "react";
import { captureSource } from "@/lib/source";

// Records where the visitor came from once per page load (see lib/source.ts).
export default function TrackSource() {
  useEffect(() => { captureSource(); }, []);
  return null;
}
