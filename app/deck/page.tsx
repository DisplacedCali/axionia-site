import { createClient } from "@/lib/supabase/server";
import { verifyDownloadGrant, watermarkLine } from "@/lib/deckDownload";
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
    "Independent analysis of employee benefit programs: the problem, the method, and what the relationship produces.",
  robots: { index: false, follow: false },
};

export default async function DeckPage({
  searchParams,
}: {
  searchParams: { dl?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  /*
    A download grant proves the address, because it arrived by email. The
    identity is inside the signature, so a recipient can't edit the URL to put
    someone else's name on a copy they're about to forward — which is the whole
    reason the watermark is worth anything.

    Verified on the SERVER. The watermark is passed down as a string the client
    only renders; it never composes one from a query parameter.
  */
  const grant = searchParams.dl ? verifyDownloadGrant("buyer", searchParams.dl) : null;
  const watermark = grant?.ok ? watermarkLine(grant.identity) : null;

  return (
    <DeckShell
      slides={SLIDES}
      signedIn={Boolean(user)}
      watermark={watermark}
    />
  );
}
