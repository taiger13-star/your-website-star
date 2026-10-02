import { displaySize, type VariantMeasurements } from "@/lib/product-details";

export function DimensionOverlay({
  sizeCode,
  measurements,
}: {
  sizeCode: string;
  measurements: VariantMeasurements;
}) {
  const footprint = measurements.outerDiameterMm
    ? `Ø${measurements.outerDiameterMm}`
    : [measurements.outerWidthMm, measurements.outerDepthMm].filter(Boolean).join(" × ");
  const height = measurements.outerHeightMm ? `H${measurements.outerHeightMm}` : "";
  if (!footprint && !height) return null;
  return (
    <svg
      viewBox="0 0 100 100"
      className="pointer-events-none absolute inset-0 h-full w-full text-primary-foreground drop-shadow-[0_1px_3px_rgba(0,0,0,.55)]"
      aria-label={`Схема размеров: ${displaySize(sizeCode, measurements)}`}
      role="img"
    >
      <g fill="none" stroke="currentColor" strokeWidth="0.45" opacity="0.95">
        <path d="M16 84H84M16 80V88M84 80V88" />
        <path d="M88 24V78M84 24H92M84 78H92" />
        <path
          d="M18 83l3-1.5v3zM82 83l-3-1.5v3zM88 26l-1.5 3h3zM88 76l-1.5-3h3z"
          fill="currentColor"
        />
      </g>
      <g fill="currentColor" fontFamily="Manrope, sans-serif" fontSize="4" letterSpacing="0.4">
        {footprint ? (
          <text x="50" y="92" textAnchor="middle">
            {footprint} ММ
          </text>
        ) : null}
        {height ? (
          <text x="94" y="51" textAnchor="middle" transform="rotate(-90 94 51)">
            {height} ММ
          </text>
        ) : null}
      </g>
    </svg>
  );
}

export function ScaleReference({ measurements }: { measurements: VariantMeasurements }) {
  if (measurements.scaleReference === "none") return null;
  const label =
    measurements.scaleReference === "person"
      ? "Масштаб относительно человека 170 см"
      : measurements.scaleReference === "interior"
        ? "Масштаб для интерьерной поверхности"
        : "Масштаб относительно комнатного растения";
  return (
    <div className="mt-4 flex items-end gap-3 border-y border-hairline py-3 text-xs text-muted-foreground">
      <svg viewBox="0 0 48 54" className="h-12 w-10 text-taupe" aria-hidden="true">
        <circle cx="24" cy="8" r="5" fill="currentColor" opacity="0.55" />
        {measurements.scaleReference === "person" ? (
          <path d="M20 15h8l4 17-5 1-1-10v27h-4V23l-1 10-5-1z" fill="currentColor" opacity="0.55" />
        ) : (
          <>
            <path d="M24 47V25M24 32L12 20M24 35L37 19" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M12 20c-8-2-6-10 1-8 3 1 2 5-1 8ZM37 19c8-2 6-10-1-8-3 1-2 5 1 8Z"
              fill="currentColor"
              opacity="0.55"
            />
          </>
        )}
      </svg>
      <span>{label}</span>
    </div>
  );
}
