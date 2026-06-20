/**
 * Hook for managing application language/locale.
 * Integrates with i18next for multi-language support.
 *
 * Usage:
 *   const { language, setLanguage } = useLang();
 *   return <button onClick={() => setLanguage("es")}>Español</button>;
 */

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { config } from "@/config";
import { logger } from "@/lib/logger";

export function useLang(): {
  language: string;
  setLanguage: (lang: string) => void;
  supportedLanguages: string[];
} {
  const { i18n } = useTranslation();
  const [language, setLanguageState] = useState<string>(config.i18n.defaultLanguage);

  useEffect(() => {
    // Initialize from localStorage or browser preference
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("preferredLanguage");
      if (saved && (config.i18n.supportedLanguages as readonly string[]).includes(saved)) {
        setLanguageState(saved);
        i18n.changeLanguage(saved);
      }
    }
  }, [i18n]);

  const setLanguage = (lang: string) => {
    if (!(config.i18n.supportedLanguages as readonly string[]).includes(lang)) {
      logger.warn("Unsupported language", { lang });
      return;
    }
    setLanguageState(lang);
    i18n.changeLanguage(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("preferredLanguage", lang);
    }
    logger.info("Language changed", { language: lang });
  };

  return {
    language,
    setLanguage,
    supportedLanguages: config.i18n.supportedLanguages,
  };
}
