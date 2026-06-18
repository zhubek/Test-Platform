"use client";
import React from 'react';
import { Sparkles, ArrowRight } from './icons';
import { useLanguage } from './language-context';

export default function Hero() {
    const { t } = useLanguage();

    return (
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-4 flex flex-col items-center text-center pointer-events-none">
            <div className="max-w-5xl mx-auto space-y-8 relative z-10 pointer-events-auto">
                
                {/* Eyebrow */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 backdrop-blur-md text-indigo-600 dark:text-indigo-300 text-sm font-medium mb-4 animate-fade-in-up transition-colors duration-500">
                    <Sparkles size={14} className="text-cyan-500 dark:text-cyan-400" />
                    <span>{t('hero.badge')}</span>
                </div>
                
                {/* Headline */}
                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-slate-900 via-slate-700 to-slate-500 dark:from-white dark:via-slate-100 dark:to-slate-400 drop-shadow-sm leading-tight transition-colors duration-500">
                    {t('hero.title1')} <br className="hidden md:block" />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-500 dark:from-indigo-400 dark:to-cyan-400">{t('hero.title2')}</span>
                </h1>
                
                {/* Subheadline */}
                <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed font-light transition-colors duration-500">
                    {t('hero.subtitle')}
                </p>
                
                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                    <a href="/home" className="group flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all shadow-[0_0_30px_-5px_rgba(99,102,241,0.5)] hover:shadow-[0_0_50px_-10px_rgba(99,102,241,0.8)]">
                        {t('hero.cta1')}
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </a>
                    <button className="px-8 py-4 rounded-full bg-white/80 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700/50 border border-slate-200 dark:border-slate-600/50 backdrop-blur-md text-slate-900 dark:text-white font-semibold transition-all hover:border-slate-300 dark:hover:border-slate-400/50 shadow-sm">
                        {t('hero.cta2')}
                    </button>
                </div>
                
                {/* Trust Strip */}
                <div className="pt-16 text-sm text-slate-500 dark:text-slate-400 font-medium transition-colors duration-500">
                    <p>{t('hero.trust')} <span className="text-slate-900 dark:text-slate-200">{t('hero.trustUsers')}</span>.</p>
                </div>
            </div>
        </section>
    );
}
