"use client";

import { useState } from "react";
import { buildOrderEnquiryLink, buildTrackOrderLink } from "@/lib/whatsapp";
import { BOTTOM_NAV_ENABLED } from "@/lib/community";

export default function WhatsAppFloatButton() {
  const [open, setOpen] = useState(false);

  return (
    <div className={`fixed right-4 z-50 flex flex-col items-end gap-2 ${BOTTOM_NAV_ENABLED ? "bottom-20" : "bottom-4"} lg:bottom-4`}>
      {open && (
        <div className="mb-1 flex animate-slide-up flex-col gap-2 rounded-card border border-border bg-surface p-2 shadow-card">
          <a
            href={buildOrderEnquiryLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="tap-target flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium hover:bg-primary-light"
          >
            💬 Order Enquiry
          </a>
          <a
            href={buildTrackOrderLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="tap-target flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium hover:bg-primary-light"
          >
            📦 Track My Order
          </a>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Chat with us on WhatsApp"
        aria-expanded={open}
        className="tap-target flex h-14 w-14 items-center justify-center rounded-full bg-whatsapp text-white shadow-lg transition hover:brightness-95"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="currentColor" className="h-7 w-7">
          <path d="M16.004 3C9.104 3 3.51 8.594 3.51 15.494c0 2.24.588 4.427 1.706 6.354L3 29l7.323-2.176a12.44 12.44 0 0 0 5.68 1.376h.005c6.9 0 12.494-5.594 12.494-12.494C28.503 8.806 22.909 3.213 16.004 3Zm0 22.86h-.004a10.36 10.36 0 0 1-5.283-1.448l-.379-.225-3.947 1.173 1.192-3.847-.246-.395a10.334 10.334 0 0 1-1.593-5.524c0-5.72 4.657-10.377 10.386-10.377 2.773 0 5.38 1.081 7.34 3.043a10.31 10.31 0 0 1 3.037 7.341c0 5.72-4.658 10.259-10.503 10.259Zm5.687-7.688c-.312-.156-1.845-.911-2.131-1.015-.286-.104-.494-.156-.702.156-.208.312-.807 1.015-.99 1.223-.182.208-.364.234-.676.078-.312-.156-1.316-.485-2.507-1.546-.927-.827-1.553-1.848-1.735-2.16-.182-.312-.02-.48.137-.636.14-.14.312-.364.468-.546.156-.182.208-.312.312-.52.104-.208.052-.39-.026-.546-.078-.156-.702-1.692-.962-2.318-.253-.608-.51-.526-.702-.536-.182-.008-.39-.01-.598-.01-.208 0-.546.078-.832.39-.286.312-1.09 1.066-1.09 2.6 0 1.534 1.116 3.016 1.272 3.224.156.208 2.196 3.353 5.32 4.702.743.321 1.323.512 1.775.655.746.237 1.424.204 1.96.124.598-.089 1.845-.754 2.105-1.483.26-.729.26-1.353.182-1.483-.078-.13-.286-.208-.598-.364Z" />
        </svg>
      </button>
    </div>
  );
}
