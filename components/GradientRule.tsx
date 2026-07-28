"use client";

import { motion } from "framer-motion";

export default function GradientRule() {
  return (
    <motion.div
      className="h-[3px] w-16 bg-axionia-gradient origin-left"
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
    />
  );
}
