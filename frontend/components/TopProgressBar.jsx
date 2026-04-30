"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import NProgress from "nprogress";
import { startNavigationProgress, stopNavigationProgress } from "@/lib/navigationProgress";

function shouldTrackNavigation(event) {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    !(event.target instanceof Element)
  ) {
    return false;
  }

  const anchor = event.target.closest("a");

  if (
    !anchor ||
    anchor.target === "_blank" ||
    anchor.hasAttribute("download") ||
    anchor.dataset.noProgress === "true"
  ) {
    return false;
  }

  const href = anchor.getAttribute("href");

  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return false;
  }

  const nextUrl = new URL(anchor.href, window.location.href);
  const currentUrl = new URL(window.location.href);

  if (nextUrl.origin !== currentUrl.origin) {
    return false;
  }

  return nextUrl.pathname !== currentUrl.pathname;
}

export default function TopProgressBar() {
  const pathname = usePathname();

  useEffect(() => {
    NProgress.configure({
      minimum: 0.12,
      showSpinner: false,
      trickleSpeed: 140,
    });

    stopNavigationProgress();
  }, []);

  useEffect(() => {
    stopNavigationProgress();
  }, [pathname]);

  useEffect(() => {
    const handleClick = (event) => {
      if (shouldTrackNavigation(event)) {
        startNavigationProgress();
      }
    };

    const handlePopState = () => {
      startNavigationProgress();
    };

    document.addEventListener("click", handleClick, true);
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  return null;
}
