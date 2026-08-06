"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Cloudflare Turnstile, without a dependency.
 *
 * Signup abuse filled the user table with accounts that were never verified —
 * and because Supabase creates the auth user when a code is REQUESTED rather
 * than entered, every one of those sent an OTP email to a real, harvested
 * address. The accounts couldn't reach anything, but the domain was being used
 * as a spam relay against people who never asked.
 *
 * Turnstile rather than a honeypot because the traffic is scripted and
 * persistent: a hidden field stops naive bots for about a week. It's also
 * already free with the Cloudflare account that serves the DNS.
 *
 * No npm package on purpose — the stack is deliberately thin and this is a
 * script tag and one global. `@marsidev/react-turnstile` would be a dependency
 * to keep current for about forty lines of code.
 *
 * GRACEFUL WHEN UNCONFIGURED. Without a site key it renders nothing and
 * reports a null token, so local development and any environment where
 * Supabase's captcha setting is off keep working. That is the correct
 * behaviour and also the risk: Supabase enforcing captcha while this key is
 * missing means every signup fails. Set both together or neither.
 */

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id?: string) => void;
      remove: (id?: string) => void;
    };
  }
}

const SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

export const turnstileEnabled = () =>
  Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

export default function Turnstile({
  onToken,
  action,
}: {
  onToken: (token: string | null) => void;
  /** Shows up in Cloudflare analytics, so signup and report-request separate. */
  action?: string;
}) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!siteKey || !ref.current) return;
    const el = ref.current;
    let cancelled = false;

    function render() {
      if (cancelled || !window.turnstile || widgetId.current) return;
      widgetId.current = window.turnstile.render(el, {
        sitekey: siteKey,
        action,
        theme: "light",
        callback: (token: string) => onToken(token),
        // A token is single-use and short-lived. Clearing it on expiry stops a
        // form sitting open for ten minutes from submitting something stale
        // and failing in a way that looks like a broken signup.
        "expired-callback": () => onToken(null),
        "error-callback": () => {
          onToken(null);
          setFailed(true);
        },
      });
    }

    if (window.turnstile) {
      render();
    } else if (!document.querySelector(`script[src="${SCRIPT}"]`)) {
      const s = document.createElement("script");
      s.src = SCRIPT;
      s.async = true;
      s.defer = true;
      s.onload = render;
      s.onerror = () => setFailed(true);
      document.head.appendChild(s);
    } else {
      // Another instance is already loading it.
      const t = setInterval(() => {
        if (window.turnstile) {
          clearInterval(t);
          render();
        }
      }, 100);
      return () => clearInterval(t);
    }

    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current);
        widgetId.current = null;
      }
    };
  }, [siteKey, action, onToken]);

  if (!siteKey) return null;

  return (
    <div>
      <div ref={ref} />
      {failed && (
        <p className="mt-2 text-[13px] leading-[1.6] text-caution-dark">
          The verification widget didn&rsquo;t load — an ad blocker or strict
          privacy extension will do that. Disable it for this page, or email us
          and we&rsquo;ll set you up directly.
        </p>
      )}
    </div>
  );
}
