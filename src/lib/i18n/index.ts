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
import no from "./locales/no.json";

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
  { code: "no", label: "Norsk", flag: "🇳🇴" },
] as const;

export type LocaleCode = (typeof SUPPORTED_LOCALES)[number]["code"];
export const RTL_LOCALES: LocaleCode[] = ["ar"];

const resources = {
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
  no: { translation: no },
};

let initialized = false;

export function initI18n() {
  if (initialized) return i18n;
  initialized = true;
  const isClient = typeof window !== "undefined";
  const chain = isClient ? i18n.use(LanguageDetector) : i18n;
  chain.use(initReactI18next).init({
    resources,
    fallbackLng: "de",
    lng: isClient ? undefined : "de",
    supportedLngs: SUPPORTED_LOCALES.map((l) => l.code),
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "komma-lang",
    },
  });

  return i18n;
}

// Eager init so useTranslation() works on first render.
initI18n();

export { i18n };
