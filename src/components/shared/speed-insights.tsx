"use client";

import { SpeedInsights as VercelSpeedInsights } from "@vercel/speed-insights/next";
import { redactUrl } from "@/lib/utils/redact-url";

// Client wrapper so the root layout (a Server Component) can mount Speed
// Insights with a beforeSend function, which can't cross the RSC boundary.
export function SpeedInsights() {
  return (
    <VercelSpeedInsights
      beforeSend={(event) => ({ ...event, url: redactUrl(event.url) })}
    />
  );
}
