"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

const KEY = "axionia_mobile_notice_dismissed";

/**
 * Mobile-only notice that the site is built for desktop. Deliberately quiet:
 * it sits at the bottom, dismisses on tap, and stays dismissed for the
 * session. The point is to set expectations without apologising or blocking
 * anything — the site does work on a phone.
 */
export default function MobileNotice() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Delay so it doesn't compete with the hero animation on load.
    const dismissed =
      typeof window !== "undefined" && sessionStorage.getItem(KEY) === "1";
    if (dismissed) return;
    const t = setTimeout(() => setShow(true), 1400);
    return () => clearTimeout(t);
  }, []);

  function dismiss() {
    setShow(false);
    try {
      sessionStorage.setItem(KEY, "1");
    } catch {
      /* private browsing — fine, it'll show again next load */
    }
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="md:hidden fixed bottom-4 inset-x-4 z-40"
        >
          <div className="relative bg-navy text-base px-5 py-4 pr-12 shadow-lg">
            <div className="absolute top-0 inset-x-0 h-px bg-axionia-gradient" />
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-gray-cool mb-1.5">
              Note
            </p>
            <p className="text-[13px] leading-[1.6]">
              Axionia is built for the desktop — the interactive report is best
              explored on a larger screen. Everything works here too.
            </p>
            <button
              onClick={dismiss}
              aria-label="Dismiss"
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center text-gray-cool hover:text-base transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M1 1L11 11M11 1L1 11"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
