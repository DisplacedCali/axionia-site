"use client";

import { motion } from "framer-motion";

export default function HeroViz() {
  return (
    <div className="relative w-full max-w-sm mx-auto lg:mx-0">
      <motion.div
        className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-cool mb-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        Modeled outcome range
      </motion.div>

      <svg viewBox="0 0 400 180" className="w-full h-auto overflow-visible">
        <defs>
          <linearGradient id="heroGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#4AC9DC" />
            <stop offset="70%" stopColor="#2463EB" />
            <stop offset="100%" stopColor="#3CBF6C" />
          </linearGradient>
        </defs>

        {/* expected range band */}
        <motion.rect
          x="90"
          y="6"
          width="120"
          height="160"
          fill="#2463EB"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.07 }}
          transition={{ delay: 1.0, duration: 0.7 }}
        />

        {/* baseline */}
        <line x1="10" y1="164" x2="390" y2="164" stroke="#E6E2D9" strokeWidth="1" />

        {/* distribution curve */}
        <motion.path
          d="M10,158 C55,158 68,52 140,34 C195,22 218,58 258,104 C300,146 342,160 390,161"
          fill="none"
          stroke="url(#heroGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
        />

        {/* vendor claim marker */}
        <motion.line
          x1="332"
          y1="14"
          x2="332"
          y2="164"
          stroke="#9C6B1A"
          strokeWidth="1.5"
          strokeDasharray="3 3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.5 }}
        />
        <motion.circle
          cx="332"
          cy="118"
          r="3.5"
          fill="#9C6B1A"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.6, duration: 0.4 }}
        />
      </svg>

      <div className="flex justify-between mt-2">
        <motion.span
          className="font-mono text-[10px] uppercase tracking-[0.1em] text-blue"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.5 }}
        >
          Expected range
        </motion.span>
        <motion.span
          className="font-mono text-[10px] uppercase tracking-[0.1em] text-caution"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.7, duration: 0.5 }}
        >
          Vendor claim
        </motion.span>
      </div>
    </div>
  );
}
