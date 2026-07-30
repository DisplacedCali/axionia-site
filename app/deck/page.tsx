import { createClient } from "@/lib/supabase/server";
import DeckShell from "@/components/deck/DeckShell";
import { SLIDES } from "@/components/deck/slides";
import "./deck.css";

export const dynamic = "force-dynamic";

/**
 * The buyer deck, at a stable public URL so it can be sent to someone who has
 * no account.
 *
 * Public but NOT discoverable: noindex/nofollow here, absent from the sitemap,
 * absent from nav and footer. A link you choose to share is a different thing
 * from a page search engines surface, and this is the first.
 *
 * The signed-in check happens here, on the server. It decides only whether the
 * print gate appears — the server action re-derives identity from the session
 * regardless, so a client claiming to be signed in gains nothing.
 */
export const metadata = {
  title: "Axionia — Buyer Deck",
  description:
    "Independent analysis of employee benefit programs: the problem, the method, and what an engagement produces.",
  robots: { index: false, follow: false },
};

export default async function DeckPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <DeckShell slides={SLIDES} signedIn={Boolean(user)} />;
}
