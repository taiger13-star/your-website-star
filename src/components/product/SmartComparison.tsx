import { Check, Minus } from "lucide-react";

import { formatPrice } from "@/lib/format";
import { SMART_COMPARISON_FEATURES, type SmartPriceComparison } from "@/lib/smart-comparison";

export function SmartComparison({
  prices,
  compact = false,
}: {
  prices: SmartPriceComparison;
  compact?: boolean;
}) {
  const features = compact ? SMART_COMPARISON_FEATURES.slice(0, 4) : SMART_COMPARISON_FEATURES;
  return (
    <div
      className={`border border-hairline ${compact ? "bg-surface-raised p-4" : "bg-background"}`}
    >
      {compact ? <p className="label-caps text-taupe">Что добавляет NOIR SMART</p> : null}
      <div className={`grid grid-cols-[minmax(0,1fr)_4.8rem_5.8rem] ${compact ? "mt-3" : ""}`}>
        <div className="border-b border-hairline px-3 py-3 text-xs text-taupe">Исполнение</div>
        <div className="border-b border-l border-hairline px-2 py-3 text-center text-xs text-taupe">
          Standard
        </div>
        <div className="border-b border-l border-hairline bg-ink px-2 py-3 text-center text-xs text-sand">
          SMART
        </div>
        {features.map((feature) => (
          <FeatureRow
            key={feature.label}
            label={feature.label}
            standard={feature.standard}
            smart={feature.smart}
          />
        ))}
        <div className="px-3 py-3 text-sm font-medium">Цена</div>
        <div className="border-l border-hairline px-2 py-3 text-center text-xs text-ink-soft">
          {prices.standardPrice ? formatPrice(prices.standardPrice) : "—"}
        </div>
        <div className="border-l border-hairline bg-ink px-2 py-3 text-center text-xs text-sand">
          {prices.smartPrice ? formatPrice(prices.smartPrice) : "—"}
        </div>
      </div>
    </div>
  );
}

function FeatureRow({
  label,
  standard,
  smart,
}: {
  label: string;
  standard: boolean;
  smart: boolean;
}) {
  return (
    <>
      <div className="border-b border-hairline px-3 py-2.5 text-sm text-ink-soft">{label}</div>
      <Value available={standard} dark={false} />
      <Value available={smart} dark />
    </>
  );
}

function Value({ available, dark }: { available: boolean; dark: boolean }) {
  return (
    <div
      className={`flex items-center justify-center border-b border-l border-hairline ${dark ? "bg-ink text-sand" : "text-taupe"}`}
    >
      {available ? (
        <Check className="h-4 w-4" strokeWidth={1.5} />
      ) : (
        <Minus className="h-4 w-4" strokeWidth={1.25} />
      )}
    </div>
  );
}
