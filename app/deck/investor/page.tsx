import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { STAFF_ROLES, type Role } from "@/lib/auth";
import { verifyDeckLink } from "@/lib/deckLinks";
import DeckShell from "@/components/deck/DeckShell";
import { INVESTOR_SLIDES } from "@/components/deck/investorSlides";
import "../deck.css";

export const dynamic = "force-dynamic";

/**
 * The investor deck. Gated exactly like /deck/founders.
 *
 * It carries a raise, a pre-money valuation, a seven-year model and founder
 * ownership percentages under three scenarios. None of that is public, and
 * some of it would be actively unhelpful for a prospective customer to read —
 * an employer deciding whether to trust an independent analysis does not need
 * to know how thinly the analyst is capitalised.
 *
 * Two ways in, same as founders:
 *
 *   1. A staff session — you, presenting.
 *   2. A signed, expiring, per-recipient link — the leave-behind.
 *
 * Failure is notFound(), never a redirect to /login. A redirect confirms the
 * URL exists and invites someone to go looking for credentials; a 404 says
 * nothing at all.
 *
 * The link is verified against the INVESTOR key, so a founders link does not
 * open this page even though both decks derive from one configured secret.
 * Without that binding the two gated decks would be one deck with two URLs —
 * see the header in lib/deckLinks.ts.
 */
export const metadata = {
  title: "Axionia — Investor Overview",
  robots: { index: false, follow: false, nocache: true },
};

export default async function InvestorDeck({
  searchParams,
}: {
  searchParams: { k?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isStaff = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    isStaff = STAFF_ROLES.includes(profile?.role as Role);
  }

  const link = verifyDeckLink(searchParams.k, "investor");

  if (!isStaff && !link.ok) notFound();

  return (
    /*
      downloadable={false} — this deck does not leave as a file.

      A deterrent, not a control, and worth being clear-eyed about: a screenshot
      defeats it in one keystroke and nothing here pretends otherwise. What it
      does is stop the accidental forward being the path of least resistance,
      and route the deliberate one through a request — at which point the copy
      that travels is watermarked, made out to somebody, and logged.

      The print output says exactly that and offers to send one. The likeliest
      person pressing Ctrl+P is an investor who wants to read it properly, and
      the right answer to that is a PDF by return, not friction.
    */
    <DeckShell
      slides={INVESTOR_SLIDES}
      signedIn={isStaff}
      deck="investor"
      linkLabel={link.ok ? link.label : null}
      downloadable={false}
    />
  );
}
