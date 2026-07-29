"use client";

import { motion, type Variants } from "framer-motion";
import { PrimaryButton, GhostButton } from "@/components/ui";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.13, delayChildren: 0.1 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function HeroIntro() {
  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <motion.div variants={item} className="eyebrow mb-4">
        Healthcare Decision Intelligence
      </motion.div>

      <h1 className="font-serif font-light text-5xl md:text-7xl leading-[1.08] tracking-tight max-w-4xl overflow-hidden">
        <motion.span variants={item} className="block">
          The decisions are big.
        </motion.span>
        <motion.span variants={item} className="block italic">
          The tools to evaluate them shouldn&rsquo;t be a black box.
        </motion.span>
      </h1>

      <motion.p
        variants={item}
        className="mt-8 max-w-measure text-[17px] leading-[1.7] text-gray-warm"
      >
        When a benefits vendor tells you their program will save you money, Axionia
        checks whether that&rsquo;s true — independently, with every assumption on the
        table. Built for the HR leaders and CFOs who want defensible numbers, not
        another pitch deck.
      </motion.p>

      <motion.div variants={item} className="mt-10 flex flex-wrap gap-4">
        <PrimaryButton href="/platform">See the platform</PrimaryButton>
        <GhostButton href="/founding-members">Explore founding membership</GhostButton>
      </motion.div>
    </motion.div>
  );
}
