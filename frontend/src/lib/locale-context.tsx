"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { type Locale, t as translate } from "./i18n";

const COOKIE_NAME = "profwise_locale";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: "en",
  setLocale: () => {},
  t: (key) => key,
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const match = document.cookie.match(
      new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`)
    );
    // `kz` → `kk`: legacy cookies used the old Kazakh code; normalize them.
    const raw = match?.[1] === "kz" ? "kk" : match?.[1];
    if (raw === "en" || raw === "ru" || raw === "kk") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time load of persisted locale on mount
      setLocaleState(raw as Locale);
    }
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    document.cookie = `${COOKIE_NAME}=${next}; path=/; max-age=31536000; SameSite=Lax`;
  }, []);

  const tFn = useCallback(
    (key: string) => translate(locale, key),
    [locale]
  );

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t: tFn }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}

/**
 * Forces a specific locale for a subtree. Every `useLocale()` inside (including
 * deep/shared components) sees this locale for both `locale` and `t`. Used to
 * render catalog previews in the page's editing language.
 */
export function LocaleOverride({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const parent = useContext(LocaleContext);
  const value = useMemo<LocaleContextValue>(
    () => ({ locale, setLocale: parent.setLocale, t: (key: string) => translate(locale, key) }),
    [locale, parent.setLocale],
  );
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}
