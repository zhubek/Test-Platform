"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Users, LayoutDashboard, LinkIcon, BarChartIcon } from './icons';
import { useLanguage } from './language-context';

// --- Mockup Components for each step ---

const CreateMockup = ({ t, isActive }: { t: (k: string) => string, isActive: boolean }) => {
    const fullText = t('ai.m1.user');
    const [text, setText] = useState('');
    const [phase, setPhase] = useState(0); // 0: typing, 1: generating, 2: done

    useEffect(() => {
        if (!isActive) {
            setText('');
            setPhase(0);
            return;
        }

        let i = 0;
        setText('');
        setPhase(0);

        const typingInterval = setInterval(() => {
            i++;
            setText(fullText.slice(0, i));
            if (i >= fullText.length) {
                clearInterval(typingInterval);
                setPhase(1);
                setTimeout(() => setPhase(2), 1500); // Show generating for 1.5s
            }
        }, 25); // Typing speed

        return () => clearInterval(typingInterval);
    }, [isActive, fullText]);

    // Highlight the "User:" prefix dynamically based on language
    const colonIndex = text.indexOf(':');
    const hasPrefix = colonIndex !== -1 && colonIndex < 15;
    const prefix = hasPrefix ? text.slice(0, colonIndex + 1) : '';
    const restText = hasPrefix ? text.slice(colonIndex + 1) : text;

    return (
        <div className="space-y-4 w-full flex flex-col justify-center">
            {/* Prompt Box */}
            <div className="bg-slate-100 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700 shadow-inner transition-colors duration-500 min-h-[80px]">
                <p className="text-sm text-slate-700 dark:text-slate-300 font-mono">
                    {hasPrefix ? (
                        <>
                            <span className="text-indigo-600 dark:text-indigo-400">{prefix}</span>
                            {restText}
                        </>
                    ) : (
                        text
                    )}
                    {/* Blinking Cursor */}
                    <span className={`inline-block w-1.5 h-4 bg-indigo-500 ml-1 align-middle ${phase === 0 ? 'animate-pulse' : 'opacity-0'}`}></span>
                </p>
            </div>

            {/* Generating Indicator */}
            <div className="h-6 flex items-center">
                <div className={`flex gap-2 items-center text-xs text-cyan-600 dark:text-cyan-400 font-mono transition-opacity duration-300 px-2 ${phase === 1 ? 'opacity-100 animate-pulse' : 'opacity-0'}`}>
                    <Sparkles size={12} className={phase === 1 ? 'animate-spin-slow' : ''} /> {t('ai.m1.gen')}
                </div>
            </div>

            {/* Result Card */}
            <div className={`transition-all duration-700 ease-out transform ${phase === 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none absolute'}`}>
                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 border border-indigo-200 dark:border-indigo-500/30 backdrop-blur-sm transition-colors duration-500">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-slate-900 dark:text-white font-medium flex items-center gap-2">
                            <Sparkles size={14} className="text-indigo-600 dark:text-indigo-400"/> {t('ai.m1.ready')}
                        </span>
                        <span className="text-xs bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded-full border border-indigo-200 dark:border-indigo-500/30">{t('ai.m1.q')}</span>
                    </div>
                    <div className="space-y-2">
                        <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-1000 ease-out ${phase === 2 ? 'w-full' : 'w-0'}`}></div>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                            <span>{t('ai.m1.l1')}</span>
                            <span>{t('ai.m1.l2')}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const TrackMockup = ({ t, isActive }: { t: (k: string) => string, isActive: boolean }) => {
    const [mikeStatus, setMikeStatus] = useState('progress');

    useEffect(() => {
        if (!isActive) {
            setMikeStatus('progress');
            return;
        }
        // Simulate live update after 2 seconds
        const timer = setTimeout(() => {
            setMikeStatus('completed');
        }, 2000);
        
        return () => clearTimeout(timer);
    }, [isActive]);

    return (
        <div className="space-y-5 w-full">
            <div className="bg-slate-100 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex justify-between items-center shadow-inner transition-colors duration-500">
                <div className="flex items-center gap-2 overflow-hidden">
                    <LinkIcon size={14} className="text-slate-500 dark:text-slate-400 flex-shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300 text-sm font-mono truncate">test-platform.com/t/hq-hire-24</span>
                </div>
                <button className="bg-indigo-100 dark:bg-indigo-500/20 hover:bg-indigo-200 dark:hover:bg-indigo-500/40 transition-colors text-indigo-700 dark:text-indigo-300 px-3 py-1.5 rounded text-xs font-medium border border-indigo-200 dark:border-indigo-500/30 flex-shrink-0">
                    {t('ai.m2.link')}
                </button>
            </div>
            
            <div className="space-y-3">
                <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest font-semibold flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                    {t('ai.m2.live')}
                </div>
                
                <div className="flex items-center gap-3 bg-white dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-700/50 backdrop-blur-sm transition-colors duration-500 shadow-sm">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-green-500/20">SJ</div>
                    <div className="flex-1">
                        <div className="text-sm text-slate-900 dark:text-slate-200 font-medium">Sarah J. <span className="text-slate-500 dark:text-slate-400 font-normal">{t('ai.m2.s1')}</span></div>
                        <div className="text-xs text-slate-500">{t('ai.m2.s1t')}</div>
                    </div>
                    <div className="text-sm text-emerald-600 dark:text-emerald-400 font-mono font-bold bg-emerald-50 dark:bg-emerald-400/10 px-2 py-1 rounded">92/100</div>
                </div>
                
                <div className="flex items-center gap-3 bg-white dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-700/50 backdrop-blur-sm transition-colors duration-500 shadow-sm relative overflow-hidden">
                    {/* Flash effect when completed */}
                    <div className={`absolute inset-0 bg-emerald-400/20 dark:bg-emerald-400/10 transition-opacity duration-500 ${mikeStatus === 'completed' ? 'opacity-0 animate-[flash_1s_ease-out]' : 'opacity-0'}`}></div>

                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg relative z-10 transition-colors duration-500 ${mikeStatus === 'progress' ? 'bg-gradient-to-br from-yellow-400 to-orange-500 shadow-yellow-500/20' : 'bg-gradient-to-br from-green-400 to-emerald-600 shadow-green-500/20'}`}>MT</div>
                    <div className="flex-1 relative z-10">
                        <div className="text-sm text-slate-900 dark:text-slate-200 font-medium">
                            Mike T. <span className="text-slate-500 dark:text-slate-400 font-normal transition-all duration-300">
                                {mikeStatus === 'progress' ? t('ai.m2.s2') : t('ai.m2.s1')}
                            </span>
                        </div>
                        <div className="text-xs text-slate-500">{t('ai.m2.s2t')}</div>
                    </div>
                    <div className="relative z-10">
                        {mikeStatus === 'progress' ? (
                            <div className="text-xs text-yellow-600 dark:text-yellow-400 font-mono bg-yellow-50 dark:bg-yellow-400/10 px-2 py-1 rounded animate-pulse">
                                {t('ai.m2.s2s')}
                            </div>
                        ) : (
                            <div className="text-sm text-emerald-600 dark:text-emerald-400 font-mono font-bold bg-emerald-50 dark:bg-emerald-400/10 px-2 py-1 rounded animate-[popIn_0.5s_ease-out]">
                                88/100
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const DashboardMockup = ({ t, isActive }: { t: (k: string) => string, isActive: boolean }) => {
    // Data points for the line chart
    const points = [
        { left: '0%', top: '75%', val: 40 },
        { left: '35%', top: '25%', val: 85 },
        { left: '70%', top: '62.5%', val: 60 },
        { left: '100%', top: '12.5%', val: 92 },
    ];

    return (
        <div className="space-y-4 w-full">
            <div className="bg-slate-100 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700 shadow-inner transition-colors duration-500">
                <p className="text-sm text-slate-700 dark:text-slate-300 font-mono">
                    <span className="text-indigo-600 dark:text-indigo-400">User:</span> {t('ai.m3.user')}
                </p>
            </div>
            
            <div className="grid grid-cols-3 gap-4 pt-2">
                {/* Animated Line Chart (Wider) */}
                <div className="col-span-2 bg-white dark:bg-slate-800/40 p-4 rounded-lg border border-slate-200 dark:border-slate-700/50 backdrop-blur-sm flex flex-col justify-between h-32 relative group transition-colors duration-500 shadow-sm overflow-hidden">
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1 relative z-10">
                        <BarChartIcon size={12} /> {t('ai.m3.avg')}
                    </div>
                    
                    {/* Chart Area */}
                    <div className="absolute inset-0 top-8 bottom-6 left-4 right-4">
                        {/* The chart-reveal class animates the clip-path from left to right */}
                        <div className={`w-full h-full relative ${isActive ? 'chart-reveal' : ''}`} style={{ clipPath: isActive ? undefined : 'inset(-20px 100% -20px -20px)' }}>
                            <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full overflow-visible absolute inset-0">
                                <defs>
                                    <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="currentColor" className="text-indigo-500" stopOpacity="0.3" />
                                        <stop offset="100%" stopColor="currentColor" className="text-indigo-500" stopOpacity="0" />
                                    </linearGradient>
                                </defs>
                                {/* Area Fill (Straight Lines) */}
                                <path d="M 0 30 L 35 10 L 70 25 L 100 5 L 100 40 L 0 40 Z" fill="url(#lineGradient)" />
                                {/* Line (Straight Lines) */}
                                <path d="M 0 30 L 35 10 L 70 25 L 100 5" fill="none" stroke="currentColor" className="text-indigo-500 dark:text-indigo-400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            
                            {/* Interactive HTML Dots */}
                            {points.map((p, i) => (
                                <div key={i} className="absolute w-2.5 h-2.5 -ml-[5px] -mt-[5px] rounded-full bg-white dark:bg-slate-900 border-2 border-indigo-500 dark:border-indigo-400 cursor-pointer group/point transition-transform hover:scale-150 z-20" style={{ left: p.left, top: p.top }}>
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 -translate-y-1.5 bg-slate-800 dark:bg-white text-white dark:text-slate-900 text-[10px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover/point:opacity-100 transition-opacity pointer-events-none shadow-lg">
                                        {p.val}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-between text-[9px] text-slate-500 mt-auto font-mono uppercase relative z-10">
                        <span>W1</span>
                        <span>W2</span>
                        <span>W3</span>
                        <span>W4</span>
                    </div>
                </div>
                
                {/* Mini Stat Cards (Narrower) */}
                <div className="col-span-1 space-y-3">
                    <div className="bg-white dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-700/50 backdrop-blur-sm h-[calc(50%-0.375rem)] flex flex-col justify-center transition-colors duration-500 shadow-sm">
                        <div className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5 truncate">{t('ai.m3.tc')}</div>
                        <div className="text-lg font-bold text-slate-900 dark:text-white leading-none">1,248</div>
                        <div className="text-[9px] text-emerald-600 dark:text-emerald-400 mt-1 truncate">{t('ai.m3.tcu')}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-700/50 backdrop-blur-sm h-[calc(50%-0.375rem)] flex flex-col justify-center transition-colors duration-500 shadow-sm">
                        <div className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5 truncate">{t('ai.m3.at')}</div>
                        <div className="text-lg font-bold text-slate-900 dark:text-white leading-none">14m</div>
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- Main Component ---

export default function FeatureAI() {
    const { t } = useLanguage();
    const [activeStep, setActiveStep] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    
    // 3D Interaction State
    const containerRef = useRef<HTMLDivElement>(null);
    const [rotation, setRotation] = useState({ x: 5, y: -15 });
    const [glarePos, setGlarePos] = useState({ x: 50, y: 50 });
    const [isTracking, setIsTracking] = useState(false);

    const steps = [
        { 
            id: 'create', 
            title: t('ai.step1.title'), 
            desc: t('ai.step1.desc'), 
            icon: <Sparkles size={20} />,
            renderMockup: (isActive: boolean) => <CreateMockup t={t} isActive={isActive} />
        },
        { 
            id: 'track', 
            title: t('ai.step2.title'), 
            desc: t('ai.step2.desc'), 
            icon: <Users size={20} />,
            renderMockup: (isActive: boolean) => <TrackMockup t={t} isActive={isActive} />
        },
        { 
            id: 'analyze', 
            title: t('ai.step3.title'), 
            desc: t('ai.step3.desc'), 
            icon: <LayoutDashboard size={20} />,
            renderMockup: (isActive: boolean) => <DashboardMockup t={t} isActive={isActive} />
        }
    ];

    // Auto-play logic
    useEffect(() => {
        if (isHovered || isTracking) return; // Pause auto-play if user is interacting
        
        const timer = setInterval(() => {
            setActiveStep((prev) => (prev + 1) % steps.length);
        }, 5000);
        
        return () => clearInterval(timer);
    }, [isHovered, isTracking, steps.length]);

    // Mouse tracking logic for 3D tilt
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        // Calculate rotation (max 10 degrees X, 15 degrees Y)
        const rotateX = ((y - centerY) / centerY) * -10;
        const rotateY = ((x - centerX) / centerX) * 15;

        setRotation({ x: rotateX, y: rotateY });
        setGlarePos({ x: (x / rect.width) * 100, y: (y / rect.height) * 100 });
        setIsTracking(true);
    };

    const handleMouseLeave = () => {
        setRotation({ x: 5, y: -15 }); // Return to default tilt
        setGlarePos({ x: 50, y: 50 });
        setIsTracking(false);
    };

    return (
        <section id="features" className="py-24 px-6 relative z-10 overflow-hidden">
            <div className="max-w-7xl mx-auto">
                
                {/* Section Header */}
                <div className="mb-16 md:text-center">
                    <span className="text-cyan-600 dark:text-cyan-400 font-semibold tracking-wider uppercase text-sm transition-colors duration-500">{t('ai.eyebrow')}</span>
                    <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mt-2 mb-4 transition-colors duration-500">
                        {t('ai.title1')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-500 dark:from-indigo-400 dark:to-cyan-400">{t('ai.title2')}</span>
                    </h2>
                    <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto transition-colors duration-500">
                        {t('ai.desc')}
                    </p>
                </div>

                <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
                    
                    {/* Left Column: Navigation Steps */}
                    <div className="lg:col-span-5 space-y-4" 
                         onMouseEnter={() => setIsHovered(true)} 
                         onMouseLeave={() => setIsHovered(false)}>
                        {steps.map((step, idx) => {
                            const isActive = activeStep === idx;
                            return (
                                <button 
                                    key={step.id}
                                    onClick={() => setActiveStep(idx)}
                                    className={`w-full text-left p-6 rounded-2xl transition-all duration-300 border ${
                                        isActive 
                                        ? 'bg-white dark:bg-slate-800/80 border-indigo-200 dark:border-indigo-500/50 shadow-[0_0_30px_rgba(99,102,241,0.1)] dark:shadow-[0_0_30px_rgba(99,102,241,0.15)]' 
                                        : 'bg-slate-50/50 dark:bg-slate-900/30 border-transparent hover:bg-white dark:hover:bg-slate-800/40 hover:border-slate-200 dark:hover:border-slate-700'
                                    }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`mt-1 p-2 rounded-lg transition-colors ${
                                            isActive ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                                        }`}>
                                            {step.icon}
                                        </div>
                                        <div>
                                            <h3 className={`text-xl font-bold mb-2 transition-colors ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                                                {step.title}
                                            </h3>
                                            <p className={`text-sm leading-relaxed transition-colors ${isActive ? 'text-slate-600 dark:text-slate-300' : 'text-slate-500'}`}>
                                                {step.desc}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {/* Progress bar for active step (visual indicator of auto-play) */}
                                    {isActive && !isHovered && !isTracking && (
                                        <div className="mt-4 h-1 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                                            <div className="h-full bg-indigo-500 animate-[progress_5s_linear_infinite]"></div>
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Right Column: 3D Mockup Presentation */}
                    <div className="lg:col-span-7 relative h-[450px] flex items-center justify-center">
                        {/* Background Glow */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-cyan-500/10 dark:from-indigo-500/20 dark:to-cyan-500/20 blur-3xl rounded-full pointer-events-none transition-colors duration-500"></div>
                        
                        {/* 3D Tilted Container with Mouse Tracking */}
                        <div 
                            ref={containerRef}
                            onMouseMove={handleMouseMove}
                            onMouseLeave={handleMouseLeave}
                            className={`relative w-full max-w-lg transform-gpu ${isTracking ? 'transition-transform duration-100 ease-out' : 'transition-all duration-700 ease-out'}`}
                            style={{ 
                                transform: `perspective(1000px) rotateY(${rotation.y}deg) rotateX(${rotation.x}deg) translateZ(50px) ${isTracking ? 'scale(1.02)' : 'scale(1)'}`,
                                transformStyle: 'preserve-3d'
                            }}
                        >
                            {/* The Glassmorphism "Device" Frame */}
                            <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-600/50 rounded-2xl p-6 shadow-[20px_20px_60px_rgba(0,0,0,0.1),_0_0_0_1px_rgba(255,255,255,0.5)_inset] dark:shadow-[20px_20px_60px_rgba(0,0,0,0.5),_0_0_0_1px_rgba(255,255,255,0.1)_inset] relative overflow-hidden transition-colors duration-500">
                                
                                {/* Mockup Header (Browser/App dots) */}
                                <div className="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-700/50 pb-4 transition-colors duration-500">
                                    <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                                    <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                                    <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                                    <div className="ml-4 text-xs text-slate-500 font-mono uppercase tracking-widest">
                                        Test-Platform OS
                                    </div>
                                </div>
                                
                                {/* Dynamic Content Area with Smooth Transitions */}
                                <div className="relative min-h-[240px] w-full flex items-center">
                                    {steps.map((step, idx) => {
                                        const isActive = activeStep === idx;
                                        // Determine direction for slide effect
                                        const isPast = idx < activeStep;
                                        
                                        return (
                                            <div
                                                key={step.id}
                                                className={`absolute inset-0 flex items-center transition-all duration-500 ease-in-out ${
                                                    isActive
                                                        ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
                                                        : `opacity-0 pointer-events-none ${isPast ? '-translate-y-8 scale-95' : 'translate-y-8 scale-105'}`
                                                }`}
                                            >
                                                {step.renderMockup(isActive)}
                                            </div>
                                        );
                                    })}
                                </div>
                                
                                {/* Dynamic Glare Overlay based on mouse position */}
                                <div 
                                    className="absolute inset-0 pointer-events-none rounded-2xl transition-opacity duration-300"
                                    style={{
                                        background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.4) 0%, transparent 60%)`,
                                        opacity: isTracking ? 1 : 0
                                    }}
                                />
                                {/* Static reflection overlay for when not tracking */}
                                <div 
                                    className="absolute inset-0 bg-gradient-to-tr from-white/40 dark:from-white/5 to-transparent pointer-events-none transition-opacity duration-300"
                                    style={{ opacity: isTracking ? 0 : 0.5 }}
                                />
                            </div>
                            
                            {/* Floating decorative elements to enhance 3D feel */}
                            <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-cyan-500/20 blur-2xl rounded-full" style={{ transform: 'translateZ(-20px)' }}></div>
                            <div className="absolute -left-8 -top-8 w-32 h-32 bg-indigo-500/20 blur-2xl rounded-full" style={{ transform: 'translateZ(-40px)' }}></div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
