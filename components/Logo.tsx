// Verbatim from axionia_brand_tokens.md — never redraw the geometry.
// gradient ids are namespaced per instance so multiple logos on one page don't collide.
let instanceCount = 0;

export default function Logo({
  size = 40,
  variant = "color",
  withWordmark = false,
  className = "",
}: {
  size?: number;
  variant?: "color" | "navy" | "white";
  withWordmark?: boolean;
  className?: string;
}) {
  instanceCount += 1;
  const g1 = `ax_g1_${instanceCount}`;
  const g2 = `ax_g2_${instanceCount}`;

  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      {variant === "color" && (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
          <defs>
            <linearGradient id={g1} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#4AC9DC" />
              <stop offset="100%" stopColor="#2463EB" />
            </linearGradient>
            <linearGradient id={g2} x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="#3CBF6C" />
              <stop offset="60%" stopColor="#2463EB" />
            </linearGradient>
          </defs>
          <polygon points="20,2 36,36 26,36 20,18 14,36 4,36" fill={`url(#${g1})`} />
          <polygon points="20,18 30,36 20,30 10,36" fill={`url(#${g2})`} opacity="0.9" />
        </svg>
      )}
      {variant === "navy" && (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
          <polygon points="20,2 36,36 26,36 20,18 14,36 4,36" fill="#1C2431" />
          <polygon points="20,18 30,36 20,30 10,36" fill="#1C2431" opacity="0.55" />
        </svg>
      )}
      {variant === "white" && (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
          <polygon points="20,2 36,36 26,36 20,18 14,36 4,36" fill="#FFFFFF" />
          <polygon points="20,18 30,36 20,30 10,36" fill="#FFFFFF" opacity="0.6" />
        </svg>
      )}
      {withWordmark && <span className="wordmark text-lg">AXIONIA</span>}
    </span>
  );
}
