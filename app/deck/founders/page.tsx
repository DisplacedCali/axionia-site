import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { STAFF_ROLES, type Role } from "@/lib/auth";
import { verifyDeckLink } from "@/lib/deckLinks";
import DeckShell from "@/components/deck/DeckShell";
import { FOUNDERS_SLIDES } from "@/components/deck/foundersSlides";
import "../deck.css";

export const dynamic = "force-dynamic";

/**
 * The founders deck. Gated, unlike /deck.
 *
 * It carries a $250K number and contract terms that aren't public, and the
 * whole reason founder content came off the marketing site was that it made
 * Axionia read as early to every visitor. So this is reachable two ways only:
 *
 *   1. A staff session — you, presenting.
 *   2. A signed, expiring, per-recipient link — the leave-behind.
 *
 * Failure is notFound(), never a redirect to /login. A redirect confirms the
 * URL exists and invites someone to go looking for credentials; a 404 says
 * nothing at all. That distinction is the entire security value of a private
 * URL, and it's cheap to get right and easy to undo by accident later.
 */
export const metadata = {
  title: "Axionia — Founding Members",
  robots: { index: false, follow: false, nocache: true },
};

export default async function FoundersDeck({
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

  const link = verifyDeckLink(searchParams.k);

  if (!isStaff && !link.ok) notFound();

  return (
    <DeckShell
      slides={FOUNDERS_SLIDES}
      signedIn={isStaff}
      deck="founders"
      linkLabel={link.ok ? link.label : null}
    />
  );
}
