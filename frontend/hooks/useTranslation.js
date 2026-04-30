"use client";

import { useEffect, useMemo, useState } from "react";
import az from "@/locales/az.json";
import en from "@/locales/en.json";
import ru from "@/locales/ru.json";

const dictionaries = {
  az,
  en,
  ru,
};

const locales = {
  az: "az-AZ",
  en: "en-US",
  ru: "ru-RU",
};

export default function useTranslation() {
  const [lang, setLang] = useState("az");

  useEffect(() => {
    const syncLanguage = () => {
      if (typeof window === "undefined") {
        return;
      }

      const storedLang = localStorage.getItem("lang") || "az";
      setLang(dictionaries[storedLang] ? storedLang : "az");
    };

    syncLanguage();
    window.addEventListener("storage", syncLanguage);
    window.addEventListener("langchange", syncLanguage);

    return () => {
      window.removeEventListener("storage", syncLanguage);
      window.removeEventListener("langchange", syncLanguage);
    };
  }, []);

  const dictionary = dictionaries[lang] || dictionaries.az;

  const t = useMemo(() => {
    return (key) => dictionary[key] || dictionaries.az[key] || key;
  }, [dictionary]);

  return {
    lang,
    locale: locales[lang] || locales.az,
    t,
  };
}
