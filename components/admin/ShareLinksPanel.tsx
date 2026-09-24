"use client";

import { useState } from "react";

/**
 * Every share link minted against this company (043), newest first.
 *
 * Exists because links are stateless: before 043 a URL lived only in the email
 * it was pasted into, and re-sending one meant minting a second. Now the link
 * can be copied again from here.
 *
 * Status is computed on the server by re-verifying each stored token against
 * the current secret (see the company page), not read from a column. Rotating
 * a secret revokes links without touching this table, so a stored status would
 * say "active" about a link that 404s, which is the one mistake this panel
 * mustn't make. For the same reason Copy and Open are only offered on links
 * that would actually open.
 */

export type LinkStatus =
  | "active"
  | "expired"
  | "revoked"
  | "version-off"
  | "version-deleted"
  | "disabled"
  | "unreadable";

export type ShareLinkRow = {
  id: string;
  deck: string;
  label: string;
  url: string;
  createdAt: string;
  expiresAt: string;
  createdBy: string | null;
  versionLabel: string | null;
  status: LinkStatus;
};

const STATUS: Record<LinkStatus, { text: string; label: string; hint?: string }> = {
  active: { text: "text-pos", label: "Active" },
  expired: { text: "text-gray-cool", label: "Expired" },
  revoked: {
    text: "text-risk",
    label: "Revoked",
    hint: "The signing secret was rotated after this link was made.",
  },
  "version-off": {
    text: "text-caution",
    label: "Version not approved",
    hint: "The proposal version was unapproved or retired, so this link 404s. Re-approve it to bring the link back.",
  },
  "version-deleted": {
    text: "text-risk",
    label: "Version deleted",
    hint: "The proposal version this link opened no longer exists.",
  },
  disabled: {
    text: "text-caution",
    label: "Secret not set",
    hint: "The signing secret for this deck isn't configured, so no link verifies.",
  },
  unreadable: { text: "text-risk", label: "Unreadable" },
};

const DECK_NAME: Record<string, string> = {
  buyer: "Buyer deck",
  founders: "Founders deck",
  investor: "Investor deck",
  proposal: "Proposal",
};

function day(ts: string) {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ShareLinksPanel({
  links,
  loadError,
}: {
  links: ShareLinkRow[];
  loadError: string | null;
}) {
  const [copied, setCopied] = useState<string | null>(null);
  const live = links.filter((l) => l.status === "active").length;

  return (
    <div className="border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-gray-warm">
          Share links
        </h2>
        {links.length > 0 && (
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-gray-cool">
            {live} active · {links.length} total
          </span>
        )}
      </div>

      {/* Read the error: an empty list here would otherwise look like no link
          was ever sent, which is the wrong thing to believe mid-follow-up. */}
      {loadError ? (
        <p className="text-[13px] leading-[1.65] text-caution">{loadError}</p>
      ) : links.length === 0 ? (
        <p className="text-[13px] leading-[1.65] text-gray-cool">
          No links minted for this company yet. Links made from a proposal
          version above, or from Decks with this company attached, appear here.
          Links made before this log existed weren&rsquo;t recorded.
        </p>
      ) : (
        <div>
          {links.map((l) => {
            const s = STATUS[l.status];
            const usable = l.status === "active";
            return (
              <div
                key={l.id}
                className="py-4 border-b border-border last:border-b-0 first:pt-0"
              >
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <span className="text-[15px] text-navy flex-1 min-w-[200px]">
                    {DECK_NAME[l.deck] ?? l.deck}
                    {l.versionLabel && (
                      <span className="text-gray-warm"> · {l.versionLabel}</span>
                    )}
                  </span>
                  <span
                    className={`font-mono text-[9px] uppercase tracking-[0.12em] ${s.text}`}
                    title={s.hint}
                  >
                    {s.label}
                  </span>
                  {usable && (
                    <>
                      <button
                        onClick={() => {
                          navigator.clipboard?.writeText(l.url);
                          setCopied(l.id);
                          setTimeout(() => setCopied(null), 1600);
                        }}
                        className="font-mono text-[10px] uppercase tracking-[0.12em] text-blue hover:underline"
                      >
                        {copied === l.id ? "Copied" : "Copy"}
                      </button>
                      <a
                        href={l.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-cool hover:text-navy"
                      >
                        Open
                      </a>
                    </>
                  )}
                </div>
                <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-gray-cool">
                  For {l.label} · made {day(l.createdAt)}
                  {l.createdBy ? ` by ${l.createdBy}` : ""} ·{" "}
                  {l.status === "expired" ? "expired" : "expires"} {day(l.expiresAt)}
                </p>
                {!usable && s.hint && (
                  <p className="mt-1 text-[12px] leading-[1.6] text-gray-cool">{s.hint}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
