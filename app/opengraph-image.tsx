import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Axionia — independent analysis of employee benefit programs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Social card. Every share of this site was previously rendering as a bare
 * URL in Slack, LinkedIn and email — for a brand this visually considered,
 * that was the most expensive small gap on the site.
 *
 * Uses system fonts rather than fetching Cormorant/DM Mono: an OG image that
 * fails to render is far worse than one set in a fallback face.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#F8F6F1",
          padding: "72px 80px",
        }}
      >
        {/* wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="52" height="52" viewBox="0 0 40 40">
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#4AC9DC" />
                <stop offset="100%" stopColor="#2463EB" />
              </linearGradient>
              <linearGradient id="g2" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0%" stopColor="#3CBF6C" />
                <stop offset="60%" stopColor="#2463EB" />
              </linearGradient>
            </defs>
            <polygon points="20,2 36,36 26,36 20,18 14,36 4,36" fill="url(#g1)" />
            <polygon points="20,18 30,36 20,30 10,36" fill="url(#g2)" opacity="0.9" />
          </svg>
          <div
            style={{
              fontSize: 30,
              letterSpacing: "0.22em",
              color: "#1C2431",
              fontWeight: 600,
            }}
          >
            AXIONIA
          </div>
        </div>

        {/* headline */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 62,
              lineHeight: 1.15,
              color: "#1C2431",
              letterSpacing: "-0.02em",
              maxWidth: 940,
            }}
          >
            The company selling the program also supplies the study proving it
            works.
          </div>
          <div
            style={{
              fontSize: 34,
              lineHeight: 1.3,
              color: "#706C63",
              marginTop: 26,
            }}
          >
            We check it — independently.
          </div>
        </div>

        {/* gradient rule + footer */}
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div
            style={{
              height: 5,
              width: 180,
              background:
                "linear-gradient(135deg, #4AC9DC 0%, #2463EB 70%, #3CBF6C 130%)",
            }}
          />
          <div
            style={{
              fontSize: 21,
              letterSpacing: "0.16em",
              color: "#706C63",
              textTransform: "uppercase",
            }}
          >
            Independent analysis of employee benefit programs
          </div>
        </div>
      </div>
    ),
    size
  );
}
