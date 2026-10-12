"use client";

import { useState } from "react";

export default function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Clipboard API needs a secure page; fall back for older/plain-http contexts.
      const field = document.createElement("textarea");
      field.value = value;
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      try {
        document.execCommand("copy");
      } catch {
        // Nothing more to try — the customer can still read the value on screen.
      }
      document.body.removeChild(field);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy ${label}`}
      className={`tap-target rounded-full border px-4 py-1.5 text-xs font-semibold ${
        copied ? "border-success bg-success text-white" : "border-primary bg-surface text-primary"
      }`}
    >
      {copied ? "Copied ✓" : "Copy"}
    </button>
  );
}
