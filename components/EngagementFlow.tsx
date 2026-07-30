import { ReactNode } from "react";

/**
 * The engagement, as nine deliverables across three phases.
 *
 * Two decisions worth keeping:
 *
 * 1. `status` is on every card, including the ones that don't exist yet. The
 *    alternative — showing only what ships today, or showing everything as
 *    though it ships today — is either a thin page or a false one. A visible
 *    roadmap is the same principle as exposing the model.
 *
 * 2. Status chips deliberately do NOT use the semantic scale. Green, amber and
 *    red are reserved in the brand tokens for savings / vendor watch-out /
 *    risk. Spending amber on "not built yet" would make the reserved meaning
 *    unreadable everywhere else on the site, so build state is carried in
 *    navy and grays instead.
 */

export type Status = "Live" | "In build" | "Planned";

export type Deliverable = {
  name: string;
  question: string;
  body: string;
  audience: string;
  format: string;
  status: Status;
  /** Honest footnote — what exists behind the card today. */
  note?: string;
};

const statusChip: Record<Status, string> = {
  Live: "bg-navy text-base border-navy",
  "In build": "border-gray-warm text-gray-warm",
  Planned: "border-stone text-gray-cool",
};

export const SETUP: Deliverable[] = [
  {
    name: "Profile & Benefits Mix",
    question: "What are we actually buying today?",
    body: "Programs, carriers, contract dates and renewal timing — captured once, then reused by every analysis that follows.",
    audience: "HR",
    format: "Guided intake · ~15 min",
    status: "Live",
  },
  {
    name: "Workforce Segmentation",
    question: "Who are we buying it for?",
    body: "Your population split by role type, geography and workforce composition. This is the input that makes benefit economics specific to you rather than generic to your industry.",
    audience: "HR · CFO",
    format: "Segment map",
    status: "In build",
    note: "The segment library is built; the client-facing view is next.",
  },
  {
    name: "Data & Document Load",
    question: "What does the evidence actually say?",
    body: "Vendor decks, renewal proposals and claim studies loaded once, read in full, and held against every claim made later.",
    audience: "HR",
    format: "Upload · any format",
    status: "Planned",
    note: "Designed so protected health information is rejected before it is ever stored.",
  },
];

export const ANALYZE_FREE: Deliverable[] = [
  {
    name: "Portfolio Score & Radar",
    question: "Where do we stand against comparable employers?",
    body: "Eight axes, one composite, banded from Foundation to Strong. The lowest band reads as opportunity — we don't grade you and we don't tell you you're failing.",
    audience: "CFO · HR",
    format: "1 page + radar",
    status: "Live",
  },
];

export const ANALYZE_PAID: Deliverable[] = [
  {
    name: "Vendor Claim Teardown",
    question: "Is this savings number real?",
    body: "Selection bias, overlap with programs you already run, and how much of the published outcome transfers to your actual workforce — each adjustment shown separately, with the vendor's unadjusted claim kept visible beside it.",
    audience: "CFO",
    format: "Per vendor · 2–3 pages",
    status: "Live",
  },
  {
    name: "Scenario & Optimization",
    question: "What is it worth, and what should we do about it?",
    body: "Low, expected and high — never a single number. Actions ranked by opportunity range, with every assumption exposed and adjustable.",
    audience: "CFO · HR",
    format: "Interactive + PDF",
    status: "Live",
  },
];

export const STEWARD: Deliverable[] = [
  {
    name: "Monthly Signal Update",
    question: "What changed since last month?",
    body: "Vendor news, mandate movement, and contract dates coming into range. Short by design — most months there is little to report, and saying so plainly is part of the service.",
    audience: "HR",
    format: "Email · under a page",
    status: "Planned",
  },
  {
    name: "Quarterly Portfolio Refresh",
    question: "Are we moving?",
    body: "The portfolio re-scored against a benchmark that has itself moved, with the change on each axis since last quarter.",
    audience: "CFO · HR",
    format: "Re-scored report",
    status: "In build",
    note: "Every run is retained rather than overwritten, so movement over time is already recoverable.",
  },
  {
    name: "Annual Strategy Review",
    question: "What are we doing next year?",
    body: "The renewal cycle planned against multi-year scenarios instead of one year at a time.",
    audience: "CFO",
    format: "Working session + brief",
    status: "Planned",
  },
];

export function DeliverableCard({ d }: { d: Deliverable }) {
  return (
    <div className="flex flex-col h-full bg-base border border-border p-7 transition-colors duration-300 hover:border-navy">
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-serif text-[22px] leading-tight">{d.name}</h3>
        <span
          className={`shrink-0 mt-1 px-2 py-1 border font-mono text-[9px] uppercase tracking-[0.12em] ${statusChip[d.status]}`}
        >
          {d.status}
        </span>
      </div>

      <p className="mt-3 font-serif italic text-[17px] leading-snug text-blue">
        {d.question}
      </p>

      <p className="mt-4 text-[14px] leading-[1.7] text-gray-warm">{d.body}</p>

      {d.note && (
        <p className="mt-4 pl-3 border-l-2 border-border text-[12px] leading-[1.6] text-gray-cool">
          {d.note}
        </p>
      )}

      <div className="mt-auto pt-6 flex items-center justify-between gap-3 font-mono text-[9px] uppercase tracking-[0.12em] text-gray-cool">
        <span>{d.audience}</span>
        <span className="text-right">{d.format}</span>
      </div>
    </div>
  );
}

export function PhaseHeading({
  num,
  title,
  children,
}: {
  num: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="max-w-2xl mb-10">
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-[11px] tracking-[0.14em] text-blue">
          {num}
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>
      <h2 className="mt-4 font-serif font-light text-3xl md:text-4xl leading-tight">
        {title}
      </h2>
      <p className="mt-4 text-[15px] leading-[1.7] text-gray-warm">{children}</p>
    </div>
  );
}

/**
 * The free/paid boundary, drawn once and explicitly.
 *
 * The Portfolio Scorer is the front door and the validated discovery motion —
 * a visitor who can't tell where free stops reads the whole nine-card
 * engagement as the price of entry and leaves.
 */
export function FreeLine() {
  return (
    <div className="my-12">
      <div className="h-px bg-axionia-gradient opacity-60" />
      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 font-mono text-[10px] uppercase tracking-[0.14em]">
        <span className="text-navy">
          ↑ Free. No card, no call, no obligation.
        </span>
        <span className="text-gray-warm">
          ↓ The paid engagement begins here.
        </span>
      </div>
    </div>
  );
}

/**
 * Marks the stewardship phase as a cycle rather than a third column. The
 * recurring half of the engagement is what separates this from a one-off
 * report, so it gets drawn rather than asserted.
 */
export function CycleRule() {
  return (
    <div className="mt-10 flex items-center gap-4" aria-hidden="true">
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
        <path
          d="M22 13a9 9 0 1 1-3.2-6.9"
          stroke="#2463EB"
          strokeWidth="1.25"
          fill="none"
        />
        <path
          d="M22.4 2.2v4.6h-4.6"
          stroke="#2463EB"
          strokeWidth="1.25"
          fill="none"
        />
      </svg>
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-warm">
        Repeats for the life of the engagement
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}
