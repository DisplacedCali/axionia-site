"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Logo from "./Logo";
import NavAuth from "./NavAuth";

type NavChild = { href: string; label: string; note: string };
type NavGroup = { label: string; href: string; children: NavChild[] };

/**
 * Three groups, not six flat links. The old nav mixed product, offer and
 * company at one level, and left /methodology and /request-report reachable
 * only from the footer or from in-page CTAs — /request-report is the primary
 * conversion and had no persistent presence at all.
 *
 * Every child carries a `note`. The nav is the only place a visitor sees the
 * whole site at once, so it's the cheapest place to explain what a page is
 * before they spend a click finding out.
 */
const groups: NavGroup[] = [
  {
    label: "Platform",
    href: "/platform",
    children: [
      {
        href: "/platform",
        label: "Overview",
        note: "The methodology in one page",
      },
      {
        href: "/who-its-for",
        label: "Who it's for",
        note: "The decisions we're built for",
      },
      {
        href: "/platform#report",
        label: "Interactive report",
        note: "Turn the dials on a live report",
      },
      {
        href: "/platform/outputs",
        label: "What you receive",
        note: "Every deliverable, and when it lands",
      },
      {
        href: "/methodology",
        label: "Methodology",
        note: "How the numbers are built",
      },
      {
        href: "/research",
        label: "Research engagements",
        note: "Commissioned independent research",
      },
    ],
  },
  {
    label: "Pricing",
    href: "/pricing",
    children: [
      {
        href: "/pricing",
        label: "Plans & pricing",
        note: "What the engagement costs",
      },
      {
        href: "/contact?interest=on-prem",
        label: "Enterprise & on-prem",
        note: "Your infrastructure, your data",
      },
    ],
  },
  {
    label: "Company",
    href: "/about",
    children: [
      { href: "/about", label: "About", note: "Who's building this, and why" },
      { href: "/contact", label: "Contact", note: "Talk to us" },
    ],
  },
];

/** Strip hash and query so /platform#report still marks Platform active. */
const basePath = (href: string) => href.split(/[#?]/)[0];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [mobileGroup, setMobileGroup] = useState<string | null>(null);
  const [headerH, setHeaderH] = useState(73);
  const headerRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const pathname = usePathname();

  // Measure the header rather than hardcoding — its height changes with
  // font loading and viewport width.
  useEffect(() => {
    const measure = () => setHeaderH(headerRef.current?.offsetHeight ?? 73);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    setOpen(false);
    setOpenGroup(null);
    setMobileGroup(null);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Escape closes whichever layer is open, innermost first.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (openGroup) setOpenGroup(null);
      else if (open) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, openGroup]);

  // A dropdown left open while the user clicks elsewhere on the page reads as
  // a stuck menu, so close on any outside pointer down.
  useEffect(() => {
    if (!openGroup) return;
    const onDown = (e: PointerEvent) => {
      if (!navRef.current?.contains(e.target as Node)) setOpenGroup(null);
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [openGroup]);

  const groupActive = (g: NavGroup) =>
    g.children.some((c) => basePath(c.href) === pathname);

  return (
    <>
      <header
        ref={headerRef}
        className="sticky top-0 z-50 border-b border-border bg-base/85 backdrop-blur-md supports-[backdrop-filter]:bg-base/70"
      >
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center shrink-0">
            <Logo size={28} withWordmark />
          </Link>

          <nav
            ref={navRef}
            className="hidden md:flex items-center gap-5 lg:gap-7 font-mono text-[11px] uppercase tracking-[0.12em] text-gray-warm"
          >
            {groups.map((g) => {
              const isOpen = openGroup === g.label;
              const active = groupActive(g);
              return (
                <div
                  key={g.label}
                  className="relative"
                  onMouseEnter={() => setOpenGroup(g.label)}
                  onMouseLeave={() => setOpenGroup(null)}
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-haspopup="true"
                    onClick={() => setOpenGroup(isOpen ? null : g.label)}
                    onFocus={() => setOpenGroup(g.label)}
                    className={`relative group flex items-center gap-1.5 py-1 uppercase tracking-[0.12em] transition-colors ${
                      active || isOpen ? "text-navy" : "hover:text-navy"
                    }`}
                  >
                    {g.label}
                    <svg
                      width="7"
                      height="5"
                      viewBox="0 0 7 5"
                      aria-hidden="true"
                      className={`transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    >
                      <path
                        d="M0.5 0.5 L3.5 4 L6.5 0.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                      />
                    </svg>
                    <span
                      className={`absolute -bottom-0.5 left-0 h-px w-full origin-left bg-axionia-gradient transition-transform duration-300 ease-out ${
                        active || isOpen ? "scale-x-100" : "scale-x-0"
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.16, ease: "easeOut" }}
                        /*
                          pt-3 rather than mt-3: the padding keeps the panel
                          touching the trigger so the pointer can cross into it
                          without tripping onMouseLeave.
                        */
                        className="absolute left-0 top-full pt-3 z-50"
                      >
                        <div className="w-[290px] border border-border bg-base shadow-[0_18px_40px_-24px_rgba(28,36,49,0.35)]">
                          <div className="h-px bg-axionia-gradient" />
                          {g.children.map((c) => {
                            const here = basePath(c.href) === pathname;
                            return (
                              <Link
                                key={c.href}
                                href={c.href}
                                onClick={() => setOpenGroup(null)}
                                className="block px-5 py-3.5 border-b border-border last:border-b-0 hover:bg-base-2 transition-colors"
                              >
                                <span
                                  className={`block font-mono text-[11px] uppercase tracking-[0.12em] ${
                                    here ? "text-blue" : "text-navy"
                                  }`}
                                >
                                  {c.label}
                                </span>
                                <span className="block mt-1 font-sans normal-case tracking-normal text-[12px] leading-snug text-gray-warm">
                                  {c.note}
                                </span>
                              </Link>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </nav>

          {/* reflects the real session — see NavAuth for why it's client-side */}
          <NavAuth />

          <button
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="md:hidden relative w-11 h-11 -mr-2 flex flex-col items-center justify-center gap-[5px]"
          >
            <motion.span
              className="block w-6 h-px bg-navy"
              animate={open ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.25 }}
            />
            <motion.span
              className="block w-6 h-px bg-navy"
              animate={open ? { opacity: 0 } : { opacity: 1 }}
              transition={{ duration: 0.2 }}
            />
            <motion.span
              className="block w-6 h-px bg-navy"
              animate={open ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.25 }}
            />
          </button>
        </div>
      </header>

      {/*
        Rendered as a SIBLING of <header>, not a child. The header uses
        backdrop-blur, and backdrop-filter makes an element the containing
        block for position:fixed descendants — nesting the panel inside it
        sizes it against the 73px header instead of the viewport, collapsing
        it to nothing.
      */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ top: headerH }}
            className="md:hidden fixed inset-x-0 bottom-0 z-40 bg-base overflow-y-auto overscroll-contain"
          >
            <nav className="px-5 py-6 flex flex-col min-h-full">
              {groups.map((g, i) => {
                const expanded = mobileGroup === g.label;
                return (
                  <motion.div
                    key={g.label}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.04 + i * 0.045, duration: 0.3 }}
                    className="border-b border-border"
                  >
                    <button
                      type="button"
                      aria-expanded={expanded}
                      onClick={() => setMobileGroup(expanded ? null : g.label)}
                      className={`w-full flex items-center justify-between py-4 font-serif text-[28px] leading-tight ${
                        groupActive(g) ? "text-blue" : "text-navy"
                      }`}
                    >
                      {g.label}
                      <motion.span
                        animate={{ rotate: expanded ? 45 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="font-mono text-[20px] text-gray-cool leading-none"
                      >
                        +
                      </motion.span>
                    </button>

                    <AnimatePresence initial={false}>
                      {expanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.24, ease: "easeOut" }}
                          className="overflow-hidden"
                        >
                          <div className="pb-4 pl-1">
                            {g.children.map((c) => (
                              <Link
                                key={c.href}
                                href={c.href}
                                className="block py-3 border-l-2 border-border pl-4"
                              >
                                <span
                                  className={`block font-mono text-[11px] uppercase tracking-[0.12em] ${
                                    basePath(c.href) === pathname
                                      ? "text-blue"
                                      : "text-navy"
                                  }`}
                                >
                                  {c.label}
                                </span>
                                <span className="block mt-0.5 text-[13px] leading-snug text-gray-warm">
                                  {c.note}
                                </span>
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28, duration: 0.3 }}
                className="mt-7"
              >
                <NavAuth mobile />
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.38 }}
                className="mt-auto pt-10 font-serif italic text-[17px] leading-snug text-gray-warm"
              >
                &ldquo;We tell you what we think — but we expose the entire model.&rdquo;
              </motion.p>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
