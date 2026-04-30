import BrandMark from "@/components/BrandMark";
import { BRAND_PREFIX, BRAND_SUFFIX, BRAND_TAGLINE } from "@/lib/brand";

export default function BrandLockup({
  className = "",
  markClassName = "h-12 w-auto shrink-0",
  titleClassName = "",
  taglineClassName = "",
  inverse = false,
  showTagline = true,
  stacked = false,
  needleRotation = 0,
}) {
  const layoutClasses = stacked
    ? "flex-col items-center gap-4 text-center"
    : "items-center gap-3";
  const wordmarkTone = inverse ? "text-white" : "text-slate-950";
  const taglineTone = inverse ? "text-slate-300" : "text-slate-500";
  const defaultTitleClasses = stacked
    ? "text-3xl tracking-[0.2em] sm:text-5xl"
    : "text-base tracking-[0.14em] sm:text-lg";
  const defaultTaglineClasses = stacked
    ? "text-[11px] tracking-[0.38em] sm:text-sm"
    : "text-[10px] tracking-[0.28em] sm:text-xs";

  return (
    <div className={`flex min-w-0 ${layoutClasses} ${className}`.trim()}>
      <BrandMark className={markClassName} needleRotation={needleRotation} />
      <div className="min-w-0">
        <p className={`whitespace-nowrap font-black uppercase leading-none ${wordmarkTone} ${defaultTitleClasses} ${titleClassName}`.trim()}>
          <span className="text-red-500">{BRAND_PREFIX}</span>
          <span>{BRAND_SUFFIX}</span>
        </p>
        {showTagline ? (
          <p className={`mt-1 whitespace-nowrap font-medium uppercase ${taglineTone} ${defaultTaglineClasses} ${taglineClassName}`.trim()}>
            {BRAND_TAGLINE}
          </p>
        ) : null}
      </div>
    </div>
  );
}
