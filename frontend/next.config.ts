import type { NextConfig } from "next";

// The NestJS backend. The frontend proxies /api/* to it so the browser only
// ever talks to the frontend origin — works the same over localhost or a public
// tunnel (ngrok), with no CORS and no second tunnel.
const BACKEND = process.env.BACKEND_URL ?? "http://localhost:4000";

// Hosts allowed to reach the dev server's internal endpoints (HMR, _next/*).
// Free ngrok URLs change each session — update this host when the tunnel
// restarts, or set NGROK_HOST in the environment.
const nextConfig: NextConfig = {
  allowedDevOrigins: [process.env.NGROK_HOST, "f6f7-178-88-80-58.ngrok-free.app"].filter(
    (h): h is string => !!h,
  ),
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${BACKEND}/:path*` }];
  },
};

export default nextConfig;
