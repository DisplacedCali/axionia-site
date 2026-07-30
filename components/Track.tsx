"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Fires a page view on first load and on every client navigation.
 *
 * Two things worth knowing:
 *
 * 1. UTM parameters are read once and remembered for the session in
 *    sessionStorage. Otherwise only the landing page carries attribution and
 *    every subsequent view looks like direct traffic, which makes campaign
 *    reporting quietly wrong rather than obviously missing.
 *
 * 2. The path is deduplicated against the last one sent. Next re-renders this
 *    component for reasons unrelated to navigation, and without the guard a
 *    single visit inflates into several views.
 *
 * Admin routes are excluded. Measuring your own use of your own tool is noise
 * that makes the traffic numbers lie.
 */

const UTM_KEY = "ax_utm";

function Pageview() {
  const pathname = usePathname();
  const params = useSearchParams();
  const last = useRef<string | null>(null);
  const isFirst = useRef(true);

  useEffect(() => {
    if (!pathname) return;
    if (pathname.startsWith("/admin")) return;

    const key = `${pathname}?${params?.toString() ?? ""}`;
    if (last.current === key) return;
    last.current = key;

    // Captured before the flag flips — only the first view of a session has a
    // referrer that isn't one of our own pages.
    const first = isFirst.current;
    isFirst.current = false;

    let utm: Record<string, string> = {};
    try {
      const fromUrl = {
        utm_source: params?.get("utm_source") ?? "",
        utm_medium: params?.get("utm_medium") ?? "",
        utm_campaign: params?.get("utm_campaign") ?? "",
      };
      if (fromUrl.utm_source || fromUrl.utm_medium || fromUrl.utm_campaign) {
        utm = fromUrl;
        sessionStorage.setItem(UTM_KEY, JSON.stringify(utm));
      } else {
        const saved = sessionStorage.getItem(UTM_KEY);
        if (saved) utm = JSON.parse(saved);
      }
    } catch {
      /* private browsing blocks sessionStorage; attribution is optional */
    }

    const body = JSON.stringify({
      path: pathname,
      referrer: first ? document.referrer || null : null,
      ...utm,
    });

    // keepalive so a view still lands if the click that triggered it also
    // navigates away.
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  }, [pathname, params]);

  return null;
}

/**
 * useSearchParams opts the whole subtree into client-side rendering, and
 * without a Suspense boundary Next refuses to statically render any page that
 * contains it — which would be every marketing page, since this lives in the
 * root layout.
 */
export default function Track() {
  return (
    <Suspense fallback={null}>
      <Pageview />
    </Suspense>
  );
}
