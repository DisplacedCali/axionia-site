"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addContact, removeContact } from "@/app/admin/companies/actions";

export type Contact = {
  id: string;
  name: string;
  title: string | null;
  email: string | null;
  source: string | null;
  notes: string | null;
  profile_id: string | null;
};

export type AccountUser = {
  id: string;
  email: string;
  full_name: string | null;
  role: string | null;
};

/**
 * People, in two groups.
 *
 * The page used to list `profiles` under the heading "Contacts", which meant
 * the only people it could show were the ones who had already created an
 * account. Everyone you actually meet first — the person who took the meeting,
 * the person who introduced you — had nowhere to live.
 *
 * Both are shown, and labelled differently, because the distinction is real
 * and useful: one group can sign in and read a released report, the other is
 * someone you know. Collapsing them would lose that.
 */
export default function ContactsPanel({
  companyId,
  contacts,
  users,
}: {
  companyId: string;
  contacts: Contact[];
  users: AccountUser[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [email, setEmail] = useState("");
  const [source, setSource] = useState("");
  const [notes, setNotes] = useState("");

  const field =
    "w-full border border-border bg-white/50 px-3 py-2 text-[14px] focus:outline-none focus:border-navy transition-colors";
  const label =
    "block font-mono text-[9px] uppercase tracking-[0.12em] text-gray-warm mb-1.5";

  const submit = () =>
    start(async () => {
      setErr(null);
      const res = await addContact(companyId, { name, title, email, source, notes });
      if (!res.ok) return setErr(res.error);
      setName("");
      setTitle("");
      setEmail("");
      setSource("");
      setNotes("");
      setOpen(false);
      router.refresh();
    });

  const drop = (id: string) =>
    start(async () => {
      setErr(null);
      const res = await removeContact(companyId, id);
      if (!res.ok) return setErr(res.error);
      router.refresh();
    });

  return (
    <div className="border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-gray-warm">
          People
        </h2>
        <button
          onClick={() => setOpen((v) => !v)}
          className="px-3 py-1.5 border border-navy text-navy font-mono text-[10px] uppercase tracking-[0.12em] hover:bg-navy hover:text-base transition-colors"
        >
          {open ? "Cancel" : "Add contact"}
        </button>
      </div>

      {open && (
        <div className="mb-5 pb-5 border-b border-border grid sm:grid-cols-2 gap-4">
          <div>
            <label className={label}>Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Callie Patel"
              className={field}
            />
          </div>
          <div>
            <label className={label}>Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="SVP, Platform &amp; Operations"
              className={field}
            />
          </div>
          <div>
            <label className={label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={field}
            />
          </div>
          <div>
            <label className={label}>How you know them</label>
            <input
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="Intro through Anay"
              className={field}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={label}>Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What they care about, what they asked, what to send next."
              className={field}
            />
          </div>
          <div className="sm:col-span-2">
            <button
              onClick={submit}
              disabled={pending || !name.trim()}
              className="px-4 py-2 border border-navy bg-navy text-base font-mono text-[10px] uppercase tracking-[0.12em] hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              {pending ? "Saving" : "Save contact"}
            </button>
          </div>
        </div>
      )}

      {contacts.length === 0 && users.length === 0 && (
        <p className="text-[13px] text-gray-cool">
          Nobody recorded yet. Add the people you&rsquo;ve actually spoken to —
          they don&rsquo;t need an account.
        </p>
      )}

      {contacts.map((c) => (
        <div
          key={c.id}
          className="py-3 border-b border-border last:border-b-0 flex items-start gap-4"
        >
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-[15px] text-navy">{c.name}</span>
              {c.title && (
                <span className="text-[13px] text-gray-warm">{c.title}</span>
              )}
              {c.profile_id && (
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-pos">
                  has account
                </span>
              )}
            </div>
            {c.email && (
              <div className="mt-1 font-mono text-[11px] text-gray-cool">
                {c.email}
              </div>
            )}
            {c.source && (
              <div className="mt-1 text-[13px] text-gray-warm italic">
                {c.source}
              </div>
            )}
            {c.notes && (
              <p className="mt-1.5 text-[13px] leading-[1.65] text-gray-warm whitespace-pre-wrap max-w-measure">
                {c.notes}
              </p>
            )}
          </div>
          <button
            onClick={() => drop(c.id)}
            disabled={pending}
            aria-label={`Remove ${c.name}`}
            className="font-mono text-[11px] text-gray-cool hover:text-risk transition-colors shrink-0 disabled:opacity-50"
          >
            ×
          </button>
        </div>
      ))}

      {users.length > 0 && (
        <div className="mt-5 pt-4 border-t border-border">
          <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-gray-cool mb-3">
            Account holders — can sign in and read released reports
          </div>
          {users.map((u) => (
            <div
              key={u.id}
              className="flex flex-wrap items-baseline justify-between gap-2 py-1.5"
            >
              <span className="text-[14px] text-navy">
                {u.full_name || u.email}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-gray-cool">
                {u.role ?? "client"}
              </span>
            </div>
          ))}
        </div>
      )}

      {err && <p className="mt-3 text-risk text-[13px]">{err}</p>}
    </div>
  );
}
