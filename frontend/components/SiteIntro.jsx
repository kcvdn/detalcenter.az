"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import BrandLockup from "@/components/BrandLockup";

const exitEase = [0.22, 1, 0.36, 1];
const introDurationMs = 2100;

export default function SiteIntro() {
  const shouldReduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (shouldReduceMotion) {
      setVisible(false);
      return undefined;
    }

    const timerId = window.setTimeout(() => {
      setVisible(false);
    }, introDurationMs);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [shouldReduceMotion]);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          key="site-intro"
          className="site-intro fixed inset-0 z-[120] flex items-center justify-center overflow-hidden px-6"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.45, ease: exitEase } }}
        >
          <div className="site-intro__grid" aria-hidden="true" />

          <motion.div
            className="site-intro__core relative z-[1] flex flex-col items-center gap-5"
            initial={{ opacity: 0, y: 18, scale: 0.88 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.94 }}
            transition={{ duration: 0.82, ease: exitEase }}
          >
            <span className="site-intro__halo" aria-hidden="true" />

            <motion.div
              initial={{ opacity: 0, scale: 0.82, filter: "blur(12px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.88, delay: 0.08, ease: exitEase }}
            >
              <BrandLockup
                stacked
                inverse
                needleRotation={-4}
                markClassName="brand-mark--glow h-24 w-auto sm:h-28"
                titleClassName="tracking-[0.14em]"
                taglineClassName="tracking-[0.48em] text-slate-300/90"
              />
            </motion.div>

            <motion.span
              className="site-intro__line"
              aria-hidden="true"
              initial={{ opacity: 0, scaleX: 0.1 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.78, delay: 0.22, ease: exitEase }}
            />

          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
