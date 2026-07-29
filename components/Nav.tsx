"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Logo from "./Logo";

const links = [
  { href: "/platform", label: "Platform" },
  { href: "/founding-members", label: "Founding Members" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close on navigation.
  useEffect(() => setOpen(false), [pathname]);

  // Lock body scroll while the panel is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-base/85 backdrop-blur-md supports-[backdrop-filter]:bg-base/70">
      <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center shrink-0">
          <Logo size={30} withWordmark />
        </Link>

        {/* desktop links */}
        <nav className="hidden md:flex items-center gap-8 font-mono text-[11px] uppercase tracking-[0.14em] text-gray-warm">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="relative group py-1 hover:text-navy transition-colors"
            >
              {l.label}
              <span className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-axionia-gradient transition-transform duration-300 ease-out group-hover:scale-x-100" />
            </Link>
          ))}
        </nav>

        {/* desktop actions */}
        <div className="hidden md:flex items-center gap-4 font-mono text-[11px] uppercase tracking-[0.14em]">
          <Link href="/login" className="text-gray-warm hover:text-navy transition-colors">
            Log in
          </Link>
          <Link
            href="/request-report"
            className="px-4 py-2 border border-navy text-navy hover:bg-navy hover:text-base transition-colors"
          >
            Free report
          </Link>
        </div>

        {/* mobile toggle */}
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="md:hidden relative w-10 h-10 -mr-2 flex flex-col items-center justify-center gap-[5px]"
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

      {/* mobile panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden fixed inset-x-0 top-[73px] bottom-0 bg-base border-t border-border overflow-y-auto"
          >
            <nav className="px-6 py-6 flex flex-col">
              {links.map((l, i) => (
                <motion.div
                  key={l.href}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 + i * 0.05, duration: 0.35 }}
                >
                  <Link
                    href={l.href}
                    className={`flex items-center justify-between py-5 border-b border-border font-serif text-3xl ${
                      pathname === l.href ? "text-blue" : "text-navy"
                    }`}
                  >
                    {l.label}
                    <span className="font-mono text-[11px] text-gray-cool">
                      0{i + 1}
                    </span>
                  </Link>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.32, duration: 0.35 }}
                className="mt-8 flex flex-col gap-3"
              >
                <Link
                  href="/request-report"
                  className="relative overflow-hidden text-center px-6 py-4 font-mono text-[11px] uppercase tracking-[0.14em] text-base"
                >
                  <span className="absolute inset-0 bg-axionia-gradient" />
                  <span className="relative z-10">Get your free report</span>
                </Link>
                <Link
                  href="/login"
                  className="text-center px-6 py-4 border border-navy text-navy font-mono text-[11px] uppercase tracking-[0.14em]"
                >
                  Client log in
                </Link>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.42 }}
                className="mt-10 font-serif italic text-lg text-gray-warm"
              >
                &ldquo;We tell you what we think — but we expose the entire model.&rdquo;
              </motion.p>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
