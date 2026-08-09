import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyDownloadGrant, watermarkLine } from "@/lib/deckDownload";
import DeckShell from "@/components/deck/DeckShell";
import { buildSlides } from "@/components/deck/slides";
import { mergeCustom, type DeckCustom } from "@/lib/deck/custom";
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
  searchParams: { dl?: string; v?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  /*
    A tailored version, if one was asked for and approved.

    APPROVED ONLY, checked here on the server. A draft holds unreviewed model
    output, and the entire safety argument for letting an agent write deck copy
    is that a person reads it before anyone else does. Serving drafts by id
    would make that gate decorative — and ids leak, because they end up in
    URLs people paste to each other.

    A bad or draft id falls through to the standard deck rather than erroring.
    Sending someone the wrong link should show them the normal argument, not a
    404 in the middle of a meeting.
  */
  let custom = undefined;
  if (searchParams.v) {
    const { data: version } = await createAdminClient()
      .from("deck_versions")
      .select("generated, edits, status, deck")
      .eq("id", searchParams.v)
      .eq("status", "approved")
      .eq("deck", "buyer")
      .maybeSingle();
    if (version) {
      custom = mergeCustom(
        version.generated as DeckCustom,
        version.edits as DeckCustom,
      );
    }
  }

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
      slides={buildSlides(custom)}
      signedIn={Boolean(user)}
      watermark={watermark}
      grantName={grant?.ok ? grant.identity.name : null}
      grantEmail={grant?.ok ? grant.identity.email : null}
    />
  );
}
