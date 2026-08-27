export interface EcosystemUrls {
  landing: string;
  dashboard: string;
  docs: string;
  demo: string;
}

export function getEcosystemUrls(): EcosystemUrls {
  const isProd =
    typeof window !== "undefined" &&
    !window.location.hostname.includes("localhost") &&
    !window.location.hostname.includes("127.0.0.1");

  return {
    landing: isProd ? "https://ai-credits-landing.vercel.app" : "http://localhost:5176",
    dashboard: isProd ? "https://ai-credits-dashboard.vercel.app" : "http://localhost:5174",
    docs: isProd ? "https://ai-credits-docs.vercel.app" : "http://localhost:5175",
    demo: isProd ? "https://ai-credits-demo.vercel.app" : "http://localhost:5173"
  };
}
