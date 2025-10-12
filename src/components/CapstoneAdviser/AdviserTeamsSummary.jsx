// src/components/TermsOfService.jsx
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

const TermsOfService = ({ open, onAccept, onDecline }) => {
  const [choice, setChoice] = useState(null);

  useEffect(() => {
    if (open) {
      // lock scroll while open
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative z-10 w-[92%] max-w-[720px] rounded-lg bg-white shadow-2xl">
        <div className="px-6 pt-6 pb-4">
          <h2 className="text-2xl font-bold text-neutral-900">Terms of Service</h2>
          <p className="mt-4 text-sm leading-relaxed text-neutral-700">
            Welcome to TaskSphere IT. Please review our Terms of Service. By selecting
            <strong> Accept</strong> you agree to comply with these terms. If you select
            <strong> Decline</strong>, you will be signed out and returned to the sign-in page.
          </p>
          <p className="mt-2 text-xs italic text-neutral-500">
            (This is placeholder content; we’ll replace it with your .docx later.)
          </p>

          <div className="mt-5 space-y-3">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="radio"
                name="tos"
                value="accept"
                checked={choice === "accept"}
                onChange={() => setChoice("accept")}
                className="h-4 w-4"
              />
              <span className="font-medium text-neutral-900">Accept</span>
            </label>

            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="radio"
                name="tos"
                value="decline"
                checked={choice === "decline"}
                onChange={() => setChoice("decline")}
                className="h-4 w-4"
              />
              <span className="font-medium text-neutral-900">Decline</span>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 pb-6 pt-2">
          <button
            type="button"
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            onClick={() => (choice === "decline" ? onDecline() : setChoice("decline"))}
          >
            Decline
          </button>
          <button
            type="button"
            className="rounded-md bg-[#611A11] px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50"
            disabled={choice !== "accept"}
            onClick={onAccept}
          >
            Accept & Continue
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default TermsOfService;
