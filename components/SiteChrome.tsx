"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Decides whether a route gets the marketing chrome.
 *
 * The deck is a full-viewport presentation surface: a sticky nav over the top
 * of it would sit in front of slide content, and both nav and footer would
 * print into the PDF between slides.
 *
 * `nav` and `footer` arrive as already-rendered server components passed
 * through as props. That's deliberate — accepting them as ReactNode means this
 * client boundary doesn't force Footer to become a client component just to
 * make a routing decision about it.
 */

/** Route prefixes that render without nav or footer. */
const BARE = ["/deck"];

export default function SiteChrome({
  nav,
  footer,
  notice,
  children,
}: {
  nav: ReactNode;
  footer: ReactNode;
  notice: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const bare = BARE.some((p) => pathname === p || pathname.startsWith(p + "/"));

  if (bare) return <>{children}</>;

  return (
    <>
      {nav}
      <main className="flex-1">{children}</main>
      {footer}
      {notice}
    </>
  );
}
