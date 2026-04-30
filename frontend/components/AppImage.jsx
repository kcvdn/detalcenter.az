"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { isPreviewImageSrc } from "@/lib/images";

export default function AppImage({
  src,
  alt,
  fallbackSrc = "",
  className = "",
  fill = false,
  width = 1200,
  height = 1200,
  sizes = "100vw",
  quality = 70,
  loading = "lazy",
  priority = false,
  unoptimized = false,
  ...props
}) {
  const [currentSrc, setCurrentSrc] = useState(src || fallbackSrc || "");

  useEffect(() => {
    setCurrentSrc(src || fallbackSrc || "");
  }, [fallbackSrc, src]);

  if (!currentSrc) {
    return null;
  }

  const shouldUnoptimize = unoptimized || isPreviewImageSrc(currentSrc);
  const handleError = (event) => {
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    }

    props.onError?.(event);
  };

  if (fill) {
    return (
      <Image
        src={currentSrc}
        alt={alt}
        fill
        sizes={sizes}
        quality={quality}
        loading={priority ? undefined : loading}
        priority={priority}
        unoptimized={shouldUnoptimize}
        onError={handleError}
        className={className}
        {...props}
      />
    );
  }

  return (
    <Image
      src={currentSrc}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      quality={quality}
      loading={priority ? undefined : loading}
      priority={priority}
      unoptimized={shouldUnoptimize}
      onError={handleError}
      className={className}
      {...props}
    />
  );
}
