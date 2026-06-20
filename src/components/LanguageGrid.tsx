import { useTranslation } from "react-i18next";
import { SUPPORTED_LOCALES, type LocaleCode } from "@/lib/i18n";
import { Check } from "lucide-react";

export function LanguageGrid({ onPick }: { onPick?: (code: LocaleCode) => void }) {
  const { i18n } = useTranslation();
  const current = i18n.language?.split("-")[0] as LocaleCode;
  return (
    <div className="grid grid-cols-2 gap-2">
      {SUPPORTED_LOCALES.map((l) => {
        const on = current === l.code;
        return (
          <button
            key={l.code}
            onClick={() => {
              i18n.changeLanguage(l.code);
              onPick?.(l.code);
            }}
            className={`tap flex items-center justify-between rounded-2xl border p-3.5 text-left transition ${
              on ? "border-primary bg-primary/10" : "border-border bg-surface"
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="text-xl">{l.flag}</span>
              <span className="font-display text-sm font-semibold">{l.label}</span>
            </span>
            {on && <Check className="size-4 text-primary" />}
          </button>
        );
      })}
    </div>
  );
}
