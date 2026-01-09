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
const supportedLocales: Locale[] = ["en", "de", "tr"];

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

function pickBrowserLocale(): Locale {
  if (typeof window === "undefined") return "en";
  const candidates =
    window.navigator.languages && window.navigator.languages.length > 0
      ? window.navigator.languages
      : [window.navigator.language];
  for (const candidate of candidates) {
    if (!candidate) continue;
    const code = candidate.toLowerCase().split("-")[0];
    if (supportedLocales.includes(code as Locale)) {
      return code as Locale;
    }
  }
  return "en";
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("locale") as Locale | null;
    if (saved && supportedLocales.includes(saved)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocaleState(saved);
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocaleState(pickBrowserLocale());
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = locale;
  }, [locale]);

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
