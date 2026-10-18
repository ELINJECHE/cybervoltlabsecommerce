"use client";

import { useEffect, useState } from "react";
import {
  CHANGES_EVENT,
  getUnpublished,
  msUntilNextPublish,
  publishChanges,
  publishConfigured,
  type PublishResult,
  type UnpublishedChanges,
} from "@/lib/deploy";

export default function PublishBar() {
  const [pending, setPending] = useState<UnpublishedChanges | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState<PublishResult | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    const refresh = () => {
      setPending(getUnpublished());
      setCooldown(msUntilNextPublish());
    };
    refresh();
    window.addEventListener(CHANGES_EVENT, refresh);
    const timer = setInterval(() => setCooldown(msUntilNextPublish()), 5000);
    return () => {
      window.removeEventListener(CHANGES_EVENT, refresh);
      clearInterval(timer);
    };
  }, []);

  async function handlePublish() {
    const count = pending?.count ?? 0;
    const message =
      count > 0
        ? `Publish ${count} change${count === 1 ? "" : "s"} to the live website?`
        : "No edits are waiting from this device. Rebuild the live website anyway?";
    if (!confirm(`${message}\n\nThis rebuilds the site once and uses one Netlify build.`)) return;

    setPublishing(true);
    setResult(await publishChanges());
    setPublishing(false);
  }

  const waiting = pending?.count ?? 0;
  const coolingDown = cooldown > 0;

  return (
    <div className="mb-6 rounded-card border border-border bg-surface p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm">
          <p className="font-semibold">
            {waiting > 0
              ? `${waiting} change${waiting === 1 ? "" : "s"} saved, not live yet`
              : "Everything you've saved is published"}
          </p>
          <p className="text-muted">
            Edits save instantly but show on the website only after you publish. Make all your edits
            first, then publish once.
          </p>
        </div>

        <button
          type="button"
          onClick={handlePublish}
          disabled={publishing || coolingDown || !publishConfigured}
          className="tap-target shrink-0 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-muted"
        >
          {publishing ? "Publishing..." : coolingDown ? "Publishing — wait a moment" : "Publish changes"}
        </button>
      </div>

      {!publishConfigured && (
        <p className="mt-3 rounded-md bg-secondary-light px-3 py-2 text-sm text-secondary">
          Publishing from here isn&rsquo;t set up yet. Your edits are saved — to put them live, open
          Netlify → Deploys → Trigger deploy → Deploy project. (To enable this button, add a Netlify
          build hook as <code>NEXT_PUBLIC_DEPLOY_HOOK_URL</code>.)
        </p>
      )}
      {result === "started" && (
        <p className="mt-3 rounded-md bg-success/10 px-3 py-2 text-sm text-foreground">
          Publish started. Your changes should be live in about 1–2 minutes. If they&rsquo;re not,
          check <strong>Deploys</strong> in Netlify.
        </p>
      )}
      {result === "failed" && (
        <p className="mt-3 rounded-md bg-deal/10 px-3 py-2 text-sm text-deal">
          CV-ADM-03: couldn&rsquo;t reach the publish service. Your edits are safe — try again, or deploy from
          Netlify → Deploys.
        </p>
      )}
      {result === "cooling-down" && (
        <p className="mt-3 rounded-md bg-secondary-light px-3 py-2 text-sm text-secondary">
          A publish was just started — please wait a couple of minutes before publishing again.
        </p>
      )}
    </div>
  );
}
