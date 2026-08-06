/**
 * CRM stage vocabulary.
 *
 * Lives here, NOT in CrmPanel.tsx, and that isn't tidiness — it's a
 * correctness fix. `/admin/companies` is a Server Component and was importing
 * `STAGE_TONE` from a `"use client"` module. Next turns every export of a
 * client module into a client *reference*, so reading a property off it during
 * a server render throws — and the whole page 500s.
 *
 * It went unnoticed because the failure needs data: the empty-state branch
 * never touched the map, so the page rendered fine until the first company
 * existed.
 *
 * The rule this encodes: **a value shared between a server and a client
 * component belongs in a plain module.** If both sides import it, neither side
 * gets to own it.
 */

export const STAGES = [
  { id: "lead", label: "Lead", note: "Known to us, nothing in motion" },
  { id: "engaged", label: "Engaged", note: "Two-way conversation underway" },
  { id: "analysis", label: "Analysis", note: "We're running work for them" },
  { id: "proposal", label: "Proposal", note: "Terms are with them" },
  { id: "client", label: "Client", note: "Signed and running" },
  { id: "dormant", label: "Dormant", note: "Real, but not now" },
  { id: "declined", label: "Declined", note: "Said no, or we did" },
] as const;

export const STAGE_TONE: Record<string, string> = {
  lead: "text-gray-warm border-border",
  engaged: "text-blue border-blue/40",
  analysis: "text-blue border-blue/40",
  proposal: "text-caution border-caution/40",
  client: "text-pos border-pos/40",
  dormant: "text-gray-cool border-stone",
  declined: "text-gray-cool border-stone",
};
