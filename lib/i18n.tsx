import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { de } from "@/locales/de";
import { en } from "@/locales/en";
import { tr } from "@/locales/tr";
import { TranslationDict } from "@/locales/types";

type Locale = "en" | "de" | "tr";

const translations: Record<Locale, TranslationDict> = { en, de, tr };

const I18nContext = createContext<{
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string>) => string;
}>({
  locale: "en",
  setLocale: () => {},
  t: (key: string) => key,
});

function format(text: string, params?: Record<string, string>) {
  if (!params) return text;
  return Object.entries(params).reduce((acc, [k, v]) => {
    return acc.replace(new RegExp(`{${k}}`, "g"), v);
  }, text);
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("locale") as Locale | null;
    if (saved && (saved === "en" || saved === "de" || saved === "tr")) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocaleState(saved);
      return;
    }
    const browser = window.navigator.language.slice(0, 2);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocaleState(browser === "de" ? "de" : browser === "tr" ? "tr" : "en");
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("locale", next);
    }
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string>) => {
      const dictionary = translations[locale] || translations.en;
      const fallbackDictionary = translations.en;
      const raw = dictionary[key] ?? fallbackDictionary[key] ?? key;
      return format(raw, params);
    },
    [locale]
  );

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
