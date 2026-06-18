"use client";

import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import Scene from "./scene";
import Navbar from "./navbar";
import Hero from "./hero";
import SocialProof from "./social-proof";
import FeatureAI from "./feature-ai";
import Pillars from "./pillars";
import Steps from "./steps";
import FeaturesList from "./features-list";
import Credibility from "./credibility";
import FinalCTA from "./final-cta";
import Footer from "./footer";
import { LanguageProvider } from "./language-context";
import "./landing.css";

// Light-only landing (no dark mode / theme switcher).
export default function Landing() {
  return (
    <LanguageProvider>
      <div className="relative w-full min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-500/30">
        {/* Fixed 3D background layer */}
        <div className="fixed inset-0 z-0">
          <Canvas camera={{ position: [0, 0, 8], fov: 60 }}>
            <Suspense fallback={null}>
              <Scene />
            </Suspense>
          </Canvas>
          <div className="absolute inset-0 bg-gradient-to-b from-slate-50/50 via-slate-50/80 to-slate-50 pointer-events-none" />
        </div>

        {/* Scrolling UI content layer */}
        <div className="relative z-10 flex flex-col min-h-screen pointer-events-none">
          <div className="pointer-events-auto">
            <Navbar />
          </div>

          <main className="flex-grow">
            <Hero />
            <div className="pointer-events-auto">
              <SocialProof />
              <FeatureAI />
              <Pillars />
              <Steps />
              <FeaturesList />
              <Credibility />
              <FinalCTA />
            </div>
          </main>

          <div className="pointer-events-auto">
            <Footer />
          </div>
        </div>
      </div>
    </LanguageProvider>
  );
}
