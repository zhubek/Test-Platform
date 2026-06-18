"use client";
import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from './language-context';
import { School, MapPin, BarChartIcon } from './icons';

// Custom hook for intersection observer to trigger animations when in view
const useInView = (threshold = 0.2) => {
    const ref = useRef<HTMLDivElement>(null);
    const [isInView, setIsInView] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true);
                    observer.disconnect(); // Only trigger once
                }
            },
            { threshold }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, [threshold]);

    return { ref, isInView };
};

// Reusable 3D Interactive Wrapper for the Dashboards
const InteractiveDashboard = ({ 
    children, 
    className = "", 
    glowColor = "indigo" 
}: { 
    children: React.ReactNode, 
    className?: string,
    glowColor?: "indigo" | "cyan"
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [rotation, setRotation] = useState({ x: 0, y: 0 });
    const [glarePos, setGlarePos] = useState({ x: 50, y: 50 });
    const [isTracking, setIsTracking] = useState(false);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        // Calculate rotation (max 8 degrees X, 12 degrees Y)
        const rotateX = ((y - centerY) / centerY) * -8;
        const rotateY = ((x - centerX) / centerX) * 12;

        setRotation({ x: rotateX, y: rotateY });
        setGlarePos({ x: (x / rect.width) * 100, y: (y / rect.height) * 100 });
        setIsTracking(true);
    };

    const handleMouseLeave = () => {
        setRotation({ x: 0, y: 0 });
        setGlarePos({ x: 50, y: 50 });
        setIsTracking(false);
    };

    const glowClass = glowColor === 'cyan' ? 'bg-cyan-500/20 dark:bg-cyan-500/30' : 'bg-indigo-500/20 dark:bg-indigo-500/30';

    return (
        <div className={className} style={{ perspective: '1000px' }}>
            <div 
                ref={containerRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                className={`relative w-full h-full transform-gpu ${isTracking ? 'transition-transform duration-100 ease-out' : 'transition-all duration-700 ease-out'}`}
                style={{ 
                    transform: `rotateY(${rotation.y}deg) rotateX(${rotation.x}deg) ${isTracking ? 'scale(1.02)' : 'scale(1)'}`,
                    transformStyle: 'preserve-3d'
                }}
            >
                {/* Main Dashboard Card */}
                <div className="w-full h-full bg-slate-50/90 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-6 md:p-8 relative z-10 shadow-lg dark:shadow-inner flex flex-col overflow-hidden transition-colors duration-500">
                    {/* Subtle Grid Background for UI feel */}
                    <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" 
                         style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '20px 20px' }}>
                    </div>
                    
                    {children}
                    
                    {/* Dynamic Glare Overlay */}
                    <div 
                        className="absolute inset-0 pointer-events-none rounded-2xl transition-opacity duration-300"
                        style={{
                            background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.4) 0%, transparent 60%)`,
                            opacity: isTracking ? 1 : 0
                        }}
                    />
                </div>
                
                {/* 3D Depth Glow Element */}
                <div 
                    className={`absolute -inset-4 ${glowClass} blur-2xl rounded-full transition-opacity duration-500 pointer-events-none`}
                    style={{ 
                        opacity: isTracking ? 0.6 : 0, 
                        transform: 'translateZ(-30px)' 
                    }}
                ></div>
            </div>
        </div>
    );
};

export default function Credibility() {
    const { t } = useLanguage();
    const { ref: d1Ref, isInView: d1InView } = useInView(0.3);
    const { ref: d2Ref, isInView: d2InView } = useInView(0.3);

    return (
        <section id="customers" className="py-24 px-6 relative z-10">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-20">
                    <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6 transition-colors duration-500">{t('cred.title')}</h2>
                    <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed transition-colors duration-500">
                        {t('cred.desc')}
                    </p>
                </div>

                <div className="space-y-12">
                    
                    {/* Case 1: Bolashaq Schools (Full Width) */}
                    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-slate-700/50 rounded-3xl p-8 md:p-12 flex flex-col lg:flex-row gap-12 shadow-xl dark:shadow-2xl relative overflow-hidden group transition-colors duration-500">
                        {/* Background Glow */}
                        <div className="absolute -top-32 -right-32 w-96 h-96 bg-indigo-500/5 dark:bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none group-hover:bg-indigo-500/10 dark:group-hover:bg-indigo-500/20 transition-colors duration-700"></div>
                        
                        {/* Text Content */}
                        <div className="lg:w-5/12 flex flex-col justify-center relative z-10">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="p-3 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl shadow-sm dark:shadow-inner border border-indigo-200 dark:border-indigo-500/30 transition-colors duration-500">
                                    <School size={32}/>
                                </div>
                                <div>
                                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 transition-colors duration-500">{t('cred.c1.title')}</h3>
                                    <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20 transition-colors duration-500">
                                        {t('cred.c1.stat')}
                                    </div>
                                </div>
                            </div>
                            <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed transition-colors duration-500">
                                {t('cred.c1.desc')}
                            </p>
                        </div>

                        {/* Dashboard Visual: Bolashaq (Interactive 3D) */}
                        <InteractiveDashboard className="lg:w-7/12" glowColor="indigo">
                            <div className="flex items-center justify-between mb-8 relative z-10">
                                <div className="text-sm text-slate-600 dark:text-slate-300 uppercase tracking-widest font-semibold flex items-center gap-2 transition-colors duration-500">
                                    <BarChartIcon size={18} className="text-indigo-600 dark:text-indigo-400" />
                                    {t('cred.d1.title')}
                                </div>
                                <div className="text-xs text-slate-500 font-mono bg-slate-200 dark:bg-slate-900 px-3 py-1 rounded-full border border-slate-300 dark:border-slate-800 transition-colors duration-500">N=50,241</div>
                            </div>
                            
                            <div ref={d1Ref} className="space-y-8 flex-grow flex flex-col justify-center relative z-10">
                                {/* Legend */}
                                <div className={`flex flex-wrap gap-4 md:gap-6 text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 transition-all duration-700 ${d1InView ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-cyan-500 dark:bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)] dark:shadow-[0_0_10px_rgba(34,211,238,0.5)]"></div>{t('cred.d1.tech')}</div>
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-violet-500 dark:bg-violet-400 shadow-[0_0_10px_rgba(139,92,246,0.5)] dark:shadow-[0_0_10px_rgba(167,139,250,0.5)]"></div>{t('cred.d1.hum')}</div>
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-indigo-500 dark:bg-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.5)] dark:shadow-[0_0_10px_rgba(129,140,248,0.5)]"></div>{t('cred.d1.ling')}</div>
                                </div>

                                {/* Rows */}
                                {[
                                    { name: t('cred.d1.s1'), tech: 45, hum: 30, ling: 25 },
                                    { name: t('cred.d1.s2'), tech: 20, hum: 50, ling: 30 },
                                    { name: t('cred.d1.s3'), tech: 35, hum: 25, ling: 40 },
                                ].map((school, idx) => (
                                    <div 
                                        key={idx} 
                                        className={`group/row transform transition-all duration-700 ease-out ${d1InView ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
                                        style={{ transitionDelay: `${idx * 150}ms` }}
                                    >
                                        <div className="text-sm text-slate-800 dark:text-white font-medium mb-3 flex justify-between transition-colors duration-500">
                                            <span>{school.name}</span>
                                        </div>
                                        <div className="h-6 w-full flex rounded-full overflow-hidden shadow-inner bg-slate-200 dark:bg-slate-900 transition-colors duration-500 p-0.5 gap-0.5">
                                            <div 
                                                className="bg-gradient-to-r from-cyan-500 to-cyan-400 flex items-center justify-center text-[11px] text-white dark:text-slate-900 font-bold transition-all ease-out group-hover/row:brightness-110 rounded-l-full" 
                                                style={{
                                                    width: d1InView ? `${school.tech}%` : '0%', 
                                                    transitionDuration: '1.2s', 
                                                    transitionDelay: `${idx * 150 + 300}ms`
                                                }}
                                            >
                                                <span className={`transition-opacity duration-300 delay-1000 ${d1InView ? 'opacity-100' : 'opacity-0'}`}>{school.tech}%</span>
                                            </div>
                                            <div 
                                                className="bg-gradient-to-r from-violet-500 to-violet-400 flex items-center justify-center text-[11px] text-white font-bold transition-all ease-out group-hover/row:brightness-110" 
                                                style={{
                                                    width: d1InView ? `${school.hum}%` : '0%', 
                                                    transitionDuration: '1.2s', 
                                                    transitionDelay: `${idx * 150 + 400}ms`
                                                }}
                                            >
                                                <span className={`transition-opacity duration-300 delay-1000 ${d1InView ? 'opacity-100' : 'opacity-0'}`}>{school.hum}%</span>
                                            </div>
                                            <div 
                                                className="bg-gradient-to-r from-indigo-500 to-indigo-400 flex items-center justify-center text-[11px] text-white font-bold transition-all ease-out group-hover/row:brightness-110 rounded-r-full" 
                                                style={{
                                                    width: d1InView ? `${school.ling}%` : '0%', 
                                                    transitionDuration: '1.2s', 
                                                    transitionDelay: `${idx * 150 + 500}ms`
                                                }}
                                            >
                                                <span className={`transition-opacity duration-300 delay-1000 ${d1InView ? 'opacity-100' : 'opacity-0'}`}>{school.ling}%</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </InteractiveDashboard>
                    </div>

                    {/* Case 2: Regions (Full Width, Reversed) */}
                    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-slate-700/50 rounded-3xl p-8 md:p-12 flex flex-col lg:flex-row-reverse gap-12 shadow-xl dark:shadow-2xl relative overflow-hidden group transition-colors duration-500">
                        {/* Background Glow */}
                        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-cyan-500/5 dark:bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none group-hover:bg-cyan-500/10 dark:group-hover:bg-cyan-500/20 transition-colors duration-700"></div>
                        
                        {/* Text Content */}
                        <div className="lg:w-5/12 flex flex-col justify-center relative z-10">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="p-3 bg-cyan-100 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 rounded-xl shadow-sm dark:shadow-inner border border-cyan-200 dark:border-cyan-500/30 transition-colors duration-500">
                                    <MapPin size={32}/>
                                </div>
                                <div>
                                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-1 transition-colors duration-500">{t('cred.c2.title')}</h3>
                                    <div className="text-base text-slate-600 dark:text-slate-400 mb-3 transition-colors duration-500">{t('cred.c2.subtitle')}</div>
                                    <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-cyan-100 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/20 transition-colors duration-500">
                                        {t('cred.c2.stat')}
                                    </div>
                                </div>
                            </div>
                            <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed transition-colors duration-500">
                                {t('cred.c2.desc')}
                            </p>
                        </div>

                        {/* Dashboard Visual: Regions (Interactive 3D) */}
                        <InteractiveDashboard className="lg:w-7/12" glowColor="cyan">
                            <div className="flex items-center justify-between mb-6 relative z-10">
                                <div className="text-sm text-slate-600 dark:text-slate-300 uppercase tracking-widest font-semibold flex items-center gap-2 transition-colors duration-500">
                                    <BarChartIcon size={18} className="text-cyan-600 dark:text-cyan-400" />
                                    {t('cred.d2.title')}
                                </div>
                            </div>
                            
                            <div ref={d2Ref} className="space-y-4 flex-grow flex flex-col justify-center relative z-10">
                                {[
                                    { name: t('cred.d2.p1'), regions: [t('cred.d2.l1'), t('cred.d2.l2')], match: 94, color: 'from-emerald-500 to-emerald-400', bg: 'bg-emerald-500 dark:bg-emerald-400' },
                                    { name: t('cred.d2.p2'), regions: [t('cred.d2.l4'), t('cred.d2.l3')], match: 88, color: 'from-cyan-500 to-cyan-400', bg: 'bg-cyan-500 dark:bg-cyan-400' },
                                    { name: t('cred.d2.p3'), regions: [t('cred.d2.l2'), t('cred.d2.l3')], match: 85, color: 'from-indigo-500 to-indigo-400', bg: 'bg-indigo-500 dark:bg-indigo-400' },
                                    { name: t('cred.d2.p4'), regions: [t('cred.d2.l1'), t('cred.d2.l4')], match: 82, color: 'from-violet-500 to-violet-400', bg: 'bg-violet-500 dark:bg-violet-400' },
                                ].map((prof, idx) => (
                                    <div 
                                        key={idx} 
                                        className={`bg-white dark:bg-slate-800/40 p-4 md:p-5 rounded-xl border border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all duration-700 ease-out group/prof shadow-sm dark:shadow-none transform ${d2InView ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'}`}
                                        style={{ transitionDelay: `${idx * 150}ms` }}
                                    >
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
                                            <div>
                                                <div className="text-base font-bold text-slate-900 dark:text-white mb-2 transition-colors duration-500">{prof.name}</div>
                                                <div className="flex flex-wrap gap-2">
                                                    {prof.regions.map(r => (
                                                        <span key={r} className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 transition-colors duration-500">
                                                            {r}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="text-sm font-mono font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-2 self-start sm:self-auto transition-colors duration-500">
                                                <div className={`w-2 h-2 rounded-full ${prof.bg} ${d2InView ? 'animate-pulse' : ''}`}></div>
                                                {prof.match}% <span className="text-slate-500 dark:text-slate-400 text-xs font-sans font-normal transition-colors duration-500">{t('cred.d2.match')}</span>
                                            </div>
                                        </div>
                                        <div className="h-2 w-full bg-slate-200 dark:bg-slate-900 rounded-full overflow-hidden shadow-inner transition-colors duration-500">
                                            <div 
                                                className={`h-full bg-gradient-to-r ${prof.color} transition-all ease-out group-hover/prof:brightness-110`} 
                                                style={{
                                                    width: d2InView ? `${prof.match}%` : '0%',
                                                    transitionDuration: '1.5s',
                                                    transitionDelay: `${idx * 150 + 400}ms`
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </InteractiveDashboard>
                    </div>

                </div>
            </div>
        </section>
    );
}
