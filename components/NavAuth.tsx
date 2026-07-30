"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Auth state in the nav, read on the client.
 *
 * Deliberately not a server component: the marketing pages are statically
 * prerendered, and reading the session on the server would force every one of
 * them to render dynamically. Reading it here after hydration keeps the pages
 * static and still reflects the real session — which is the bug this fixes.
 * Before, a signed-in user saw "Log in" on every page except /dashboard and
 * reasonably concluded the session had been dropped.
 */
export default function NavAuth({ mobile = false }: { mobile?: boolean }) {
  const [state, setState] = useState<{
    loading: boolean;
    email: string | null;
    isAdmin: boolean;
  }>({ loading: true, email: null, isAdmin: false });

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active) return;

      if (!user) {
        setState({ loading: false, email: null, isAdmin: false });
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (!active) return;
      setState({
        loading: false,
        email: user.email ?? null,
        // Membership, not equality: 'owner' and 'analyst' are staff too.
        isAdmin: ["analyst", "admin", "owner"].includes(profile?.role ?? ""),
      });
    }

    load();

    // Keeps the nav honest after login/logout in another tab.
    const { data: sub } = supabase.auth.onAuthStateChange(() => load());
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Render the signed-out state while loading — it's the common case, and
  // flashing "Dashboard" at anonymous visitors would be worse.
  const signedIn = !state.loading && state.email;

  if (mobile) {
    return (
      <div className="flex flex-col gap-3">
        {signedIn ? (
          <>
            <Link
              href="/dashboard"
              className="relative overflow-hidden text-center px-6 py-4 font-mono text-[11px] uppercase tracking-[0.14em] text-base"
            >
              <span className="absolute inset-0 bg-axionia-gradient" />
              <span className="relative z-10">Your dashboard</span>
            </Link>
            {state.isAdmin && (
              <Link
                href="/admin"
                className="text-center px-6 py-4 border border-navy text-navy font-mono text-[11px] uppercase tracking-[0.14em]"
              >
                Admin
              </Link>
            )}
            <p className="text-center font-mono text-[9px] uppercase tracking-[0.12em] text-gray-cool">
              Signed in as {state.email}
            </p>
          </>
        ) : (
          <>
            <Link
              href="/request-report"
              className="relative overflow-hidden text-center px-6 py-4 font-mono text-[11px] uppercase tracking-[0.14em] text-base"
            >
              <span className="absolute inset-0 bg-axionia-gradient" />
              <span className="relative z-10">Get your free report</span>
            </Link>
            <Link
              href="/login"
              className="text-center px-6 py-4 border border-navy text-navy font-mono text-[11px] uppercase tracking-[0.14em]"
            >
              Client log in
            </Link>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="hidden md:flex items-center gap-4 font-mono text-[11px] uppercase tracking-[0.14em]">
      {signedIn ? (
        <>
          {state.isAdmin && (
            <Link
              href="/admin"
              className="text-caution hover:opacity-70 transition-opacity"
            >
              Admin
            </Link>
          )}
          <Link
            href="/dashboard"
            className="px-4 py-2 border border-navy text-navy hover:bg-navy hover:text-base transition-colors"
          >
            Dashboard
          </Link>
        </>
      ) : (
        <>
          <Link href="/login" className="text-gray-warm hover:text-navy transition-colors">
            Log in
          </Link>
          {/*
            Gradient, not the bordered treatment it used to have. This is the
            site's primary conversion and it competes with three nav groups for
            attention — a ghost button lost that fight.
          */}
          <Link
            href="/request-report"
            className="group relative overflow-hidden px-5 py-2.5 text-base whitespace-nowrap"
          >
            <span className="absolute inset-0 bg-axionia-gradient transition-transform duration-500 ease-out group-hover:scale-110" />
            <span className="relative z-10">Free report</span>
          </Link>
        </>
      )}
    </div>
  );
}
