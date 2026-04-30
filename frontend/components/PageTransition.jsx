"use client";

import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { usePathname } from "next/navigation";

const pageTransition = {
  duration: 0.36,
  ease: [0.22, 1, 0.36, 1],
};

function getTransitionKey(pathname, preservePrefix) {
  if (preservePrefix && pathname.startsWith(preservePrefix)) {
    return preservePrefix;
  }

  return pathname;
}

export default function PageTransition({
  children,
  className = "",
  groupId = "page-transition",
  preservePrefix = "",
}) {
  const pathname = usePathname() || "/";
  const transitionKey = getTransitionKey(pathname, preservePrefix);

  return (
    <div className={className}>
      <LayoutGroup id={groupId}>
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={transitionKey}
            layout
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={pageTransition}
            className="relative will-change-transform"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </LayoutGroup>
    </div>
  );
}
