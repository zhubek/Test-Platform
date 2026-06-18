"use client";
import React from 'react';
import { ArrowRight } from './icons';
import { useLanguage } from './language-context';

export default function FinalCTA() {
    const { t } = useLanguage();

    return (
        <section className="py-32 px-6 relative z-10 overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-indigo-500/10 dark:bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none transition-colors duration-500"></div>
            
            <div className="max-w-4xl mx-auto text-center relative z-10 bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-slate-700/50 rounded-3xl p-12 md:p-20 shadow-xl dark:shadow-2xl transition-colors duration-500">
                <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6 transition-colors duration-500">
                    {t('cta.title1')} <br className="hidden md:block"/> {t('cta.title2')}
                </h2>
                <p className="text-xl text-slate-600 dark:text-slate-300 mb-10 transition-colors duration-500">
                    {t('cta.desc')}
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <a href="/home" className="group flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all shadow-lg hover:shadow-indigo-500/50">
                        {t('cta.btn1')}
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </a>
                    <button className="px-8 py-4 rounded-full bg-transparent hover:bg-slate-50 dark:hover:bg-white/5 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white font-semibold transition-all">
                        {t('cta.btn2')}
                    </button>
                </div>
            </div>
        </section>
    );
}
