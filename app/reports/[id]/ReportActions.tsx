"use client";

import { useEffect, useRef } from "react";
import { logReportEvent } from "./actions";

/**
 * View beacon and print control.
 *
 * A client island on an otherwise server-rendered page, because both events
 * are things only the browser knows: that the page was actually reached, and
 * that the user asked to print it.
 *
 * The view fires from an effect rather than during the server render. A server
 * render happens on prefetch too, so logging there would count reports as read
 * that nobody opened — the same inflation `/api/track` guards against with the
 * prefetch header.
 *
 * `sent` is a ref, not state: React 18 StrictMode runs effects twice in dev,
 * and every report would otherwise show a phantom double view.
 */
export default function ReportActions({ reportId }: { reportId: string }) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    void logReportEvent(reportId, "view");
  }, [reportId]);

  // Fires on Cmd-P as well as the button — the keyboard path is the one a
  // client is more likely to use, and it's the print that matters.
  useEffect(() => {
    const onBefore = () => void logReportEvent(reportId, "print");
    window.addEventListener("beforeprint", onBefore);
    return () => window.removeEventListener("beforeprint", onBefore);
  }, [reportId]);

  return (
    <button
      onClick={() => window.print()}
      className="px-4 py-2 border border-navy text-navy font-mono text-[10px] uppercase tracking-[0.12em] hover:bg-navy hover:text-base transition-colors print:hidden"
    >
      Print / PDF
    </button>
  );
}
