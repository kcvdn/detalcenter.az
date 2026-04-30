"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import useTranslation from "@/hooks/useTranslation";

export default function AddToCartModal({ open, onClose, onGoToCart }) {
  const { t } = useTranslation();
  const [shouldRender, setShouldRender] = useState(open);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setShouldRender(true);

      const frameId = window.requestAnimationFrame(() => {
        setIsVisible(true);
      });

      const handleEscape = (event) => {
        if (event.key === "Escape") {
          onClose?.();
        }
      };

      window.addEventListener("keydown", handleEscape);

      return () => {
        window.cancelAnimationFrame(frameId);
        window.removeEventListener("keydown", handleEscape);
      };
    }

    setIsVisible(false);

    const timeoutId = window.setTimeout(() => {
      setShouldRender(false);
    }, 200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [open, onClose]);

  if (!shouldRender) {
    return null;
  }

  const modalContent = (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 transition-opacity duration-200 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      onClick={onClose}
      role="presentation"
    >
      <div
        className={`w-full max-w-md rounded-[28px] bg-white px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-4 shadow-2xl transition duration-300 md:p-6 ${
          isVisible ? "translate-y-0 scale-100" : "translate-y-3 scale-95"
        }`}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-to-cart-modal-title"
      >
        <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-slate-200" />

        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-2xl text-green-600">
          +
        </div>

        <h2 id="add-to-cart-modal-title" className="text-center text-xl font-bold text-slate-950">
          {t("added_to_cart_modal")}
        </h2>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onClose}
            className="press-feedback touch-target rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition duration-200 hover:bg-slate-50"
          >
            {t("continue_shopping")}
          </button>

          <button
            type="button"
            onClick={onGoToCart}
            className="press-feedback touch-target rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-slate-800"
          >
            {t("go_to_cart")}
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(modalContent, document.body);
}
