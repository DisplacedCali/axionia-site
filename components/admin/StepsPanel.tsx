"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addStep, toggleStep, removeStep } from "@/app/admin/companies/actions";

export type Step = {
  id: string;
  step: string;
  due_on: string | null;
  done_at: string | null;
};

/**
 * Open steps for one account.
 *
 * Sits above everything except the brief, because it's the reason to open the
 * page. The previous version buried a single `next_action` as the third field
 * of a box labelled "Pipeline", next to a stage select and an owner — three
 * unrelated questions sharing a heading.
 *
 * Closed steps stay visible but collapsed. They're the answer to "what did we
 * already do with these people", which is the question before a second
 * meeting, and deleting them to keep the list tidy throws that away.
 */

function dueTone(due: string | null): string {
  if (!due) return "text-gray-cool";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(`${due}T00:00:00`);
  if (d < today) return "text-risk";
  const soon = new Date(today);
  soon.setDate(soon.getDate() + 3);
  return d <= soon ? "text-caution" : "text-gray-cool";
}

function dueLabel(due: string | null) {
  if (!due) return "no date";
  return new Date(`${due}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function StepsPanel({
  companyId,
  steps,
}: {
  companyId: string;
  steps: Step[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [text, setText] = useState("");
  const [due, setDue] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [showDone, setShowDone] = useState(false);

  const open = steps.filter((s) => !s.done_at);
  const done = steps.filter((s) => s.done_at);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      setErr(null);
      const res = await fn();
      if (!res.ok) return setErr(res.error ?? "Something went wrong.");
      router.refresh();
    });

  const submit = () => {
    if (!text.trim()) return;
    run(async () => {
      const res = await addStep(companyId, { step: text, dueOn: due || null });
      if (res.ok) {
        setText("");
        setDue("");
      }
      return res;
    });
  };

  return (
    <div className="border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-gray-warm">
          Next steps
        </h2>
        {open.length > 0 && (
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-gray-cool">
            {open.length} open
          </span>
        )}
      </div>

      {open.length === 0 && (
        <p className="text-[13px] text-gray-cool mb-4">
          Nothing open. Add what has to happen next.
        </p>
      )}

      {open.map((s) => (
        <div
          key={s.id}
          className="flex items-start gap-3 py-2.5 border-b border-border last:border-b-0"
        >
          <button
            onClick={() => run(() => toggleStep(companyId, s.id, true))}
            disabled={pending}
            aria-label="Mark done"
            className="mt-0.5 w-3.5 h-3.5 shrink-0 border border-gray-cool hover:border-pos hover:bg-green-light transition-colors disabled:opacity-50"
          />
          <span className="flex-1 min-w-0 text-[14px] leading-snug text-navy">
            {s.step}
          </span>
          <span
            className={`font-mono text-[10px] uppercase tracking-[0.1em] shrink-0 ${dueTone(
              s.due_on,
            )}`}
          >
            {dueLabel(s.due_on)}
          </span>
          <button
            onClick={() => run(() => removeStep(companyId, s.id))}
            disabled={pending}
            aria-label="Delete step"
            className="font-mono text-[11px] text-gray-cool hover:text-risk transition-colors shrink-0 disabled:opacity-50"
          >
            ×
          </button>
        </div>
      ))}

      {/* add */}
      <div className="mt-4 flex flex-wrap gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Send the portfolio analysis to Callie"
          className="flex-1 min-w-[200px] border border-border bg-white/50 px-3 py-2 text-[14px] focus:outline-none focus:border-navy transition-colors"
        />
        <input
          type="date"
          value={due}
          onChange={(e) => setDue(e.target.value)}
          className="border border-border bg-white/50 px-3 py-2 font-mono text-[12px] text-gray-warm focus:outline-none focus:border-navy transition-colors"
        />
        <button
          onClick={submit}
          disabled={pending || !text.trim()}
          className="px-4 py-2 border border-navy text-navy font-mono text-[10px] uppercase tracking-[0.12em] hover:bg-navy hover:text-base transition-colors disabled:opacity-40"
        >
          Add
        </button>
      </div>

      {done.length > 0 && (
        <div className="mt-5 pt-4 border-t border-border">
          <button
            onClick={() => setShowDone((v) => !v)}
            className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-cool hover:text-navy transition-colors"
          >
            {showDone ? "Hide" : "Show"} {done.length} done
          </button>
          {showDone &&
            done.map((s) => (
              <div key={s.id} className="flex items-center gap-3 py-2">
                <button
                  onClick={() => run(() => toggleStep(companyId, s.id, false))}
                  disabled={pending}
                  aria-label="Reopen"
                  className="w-3.5 h-3.5 shrink-0 border border-pos bg-green-light disabled:opacity-50"
                />
                <span className="flex-1 min-w-0 text-[13px] text-gray-cool line-through">
                  {s.step}
                </span>
                <span className="font-mono text-[10px] text-gray-cool shrink-0">
                  {new Date(s.done_at!).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            ))}
        </div>
      )}

      {err && <p className="mt-3 text-risk text-[13px]">{err}</p>}
    </div>
  );
}
