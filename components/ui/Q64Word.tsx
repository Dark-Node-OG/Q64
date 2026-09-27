// Q64 wordmark — clean, premium text (no logo mark). "Q" in a cool white-to-slate
// gradient, "64" in an electric blue → cyan → violet gradient, with a soft glow and,
// on the big sizes, a luminous underline. Used consistently across the app.

type Size = "sm" | "md" | "lg" | "xl";

const SIZE: Record<Size, string> = {
  sm: "text-xl",
  md: "text-3xl",
  lg: "text-5xl",
  xl: "text-7xl",
};

export default function Q64Word({
  size = "md",
  tagline = false,
  className = "",
}: {
  size?: Size;
  tagline?: boolean;
  className?: string;
}) {
  const big = size === "lg" || size === "xl" || tagline;
  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <span
        className={`relative font-black leading-none ${SIZE[size]} ${big ? "q64-glow" : ""}`}
        style={{ letterSpacing: "-0.035em" }}
      >
        <span className="bg-gradient-to-b from-white via-white to-slate-300 bg-clip-text text-transparent drop-shadow-[0_0_18px_rgba(46,125,246,0.5)]">
          Q
        </span>
        <span className="bg-gradient-to-r from-electric-400 via-cyan-q to-violet-q bg-clip-text text-transparent drop-shadow-[0_0_18px_rgba(52,216,241,0.55)]">
          64
        </span>
      </span>
      {big && (
        <span className="mt-1.5 h-[2px] w-[78%] rounded-full bg-gradient-to-r from-transparent via-cyan-q/80 to-transparent" />
      )}
      {tagline && (
        <span className="mt-2.5 text-[11px] tracking-[0.55em] text-slate-300/90">CHESS REIMAGINED</span>
      )}
    </div>
  );
}
