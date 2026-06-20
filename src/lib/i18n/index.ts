import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import de from "./locales/de.json";
import en from "./locales/en.json";
import tr from "./locales/tr.json";
import ar from "./locales/ar.json";
import uk from "./locales/uk.json";
import fr from "./locales/fr.json";
import es from "./locales/es.json";
import it from "./locales/it.json";
import pl from "./locales/pl.json";
import ru from "./locales/ru.json";

export const SUPPORTED_LOCALES = [
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "tr", label: "Türkçe", flag: "🇹🇷" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
  { code: "uk", label: "Українська", flag: "🇺🇦" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "pl", label: "Polski", flag: "🇵🇱" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
] as const;

export type LocaleCode = (typeof SUPPORTED_LOCALES)[number]["code"];

export const RTL_LOCALES: LocaleCode[] = ["ar"];

let initialized = false;

export function initI18n() {
  if (initialized || typeof window === "undefined") return i18n;
  initialized = true;
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        de: { translation: de },
        en: { translation: en },
        tr: { translation: tr },
        ar: { translation: ar },
        uk: { translation: uk },
        fr: { translation: fr },
        es: { translation: es },
        it: { translation: it },
        pl: { translation: pl },
        ru: { translation: ru },
      },
      fallbackLng: "de",
      supportedLngs: SUPPORTED_LOCALES.map((l) => l.code),
      interpolation: { escapeValue: false },
      detection: {
        order: ["localStorage", "navigator"],
        caches: ["localStorage"],
        lookupLocalStorage: "komma-lang",
      },
    });

  i18n.on("languageChanged", (lng) => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lng;
      document.documentElement.dir = RTL_LOCALES.includes(lng as LocaleCode) ? "rtl" : "ltr";
    }
  });

  if (typeof document !== "undefined") {
    document.documentElement.lang = i18n.language || "de";
    document.documentElement.dir = RTL_LOCALES.includes((i18n.language as LocaleCode) ?? "de") ? "rtl" : "ltr";
  }

  return i18n;
}

export { i18n };
