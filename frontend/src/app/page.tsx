"use client";

// Public landing page (AI-Studio Three.js design, ported to Next). It's a heavy
// client/3D page, so it's dynamically imported with SSR disabled.
import dynamic from "next/dynamic";

const Landing = dynamic(() => import("@/components/landing/Landing"), {
  ssr: false,
  loading: () => <div className="min-h-screen w-full bg-slate-950" />,
});

export default function Page() {
  return <Landing />;
}
