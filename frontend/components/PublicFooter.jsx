"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import SiteFooterContent from "@/components/SiteFooterContent";
import { cachedGet } from "@/lib/apiClient";
import { defaultSiteContent, normalizeSiteContent } from "@/lib/marketplaceData";

function shouldHideFooter(pathname) {
  return (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/dashboard")
  );
}

export default function PublicFooter() {
  const pathname = usePathname() || "/";
  const [content, setContent] = useState(defaultSiteContent);

  useEffect(() => {
    if (shouldHideFooter(pathname)) {
      return undefined;
    }

    let ignore = false;

    cachedGet("/api/content", { ttl: 300_000 })
      .then((data) => {
        if (!ignore) {
          setContent(normalizeSiteContent(data));
        }
      })
      .catch(() => {
        if (!ignore) {
          setContent(defaultSiteContent);
        }
      });

    return () => {
      ignore = true;
    };
  }, [pathname]);

  if (shouldHideFooter(pathname)) {
    return null;
  }

  return (
    <SiteFooterContent
      content={content}
      showScrollTop
      onScrollTop={() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
    />
  );
}
