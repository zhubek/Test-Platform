"use client";
import React from 'react';
import { Users, Layers, Sparkles } from './icons';
import { useLanguage } from './language-context';

export default function SocialProof() {
    const { t } = useLanguage();

    return (
        <section className="py-12 border-y border-slate-200 dark:border-white/5 bg-white/60 dark:bg-slate-950/40 backdrop-blur-sm relative z-10 transition-colors duration-500">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-white/10 text-center transition-colors duration-500">
                    
                    <div className="flex flex-col items-center justify-center p-4">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mb-4 transition-colors duration-500">
                            <Users size={24} />
                        </div>
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-1 transition-colors duration-500">50,000+</h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm transition-colors duration-500">{t('sp.stat1')}</p>
                    </div>

                    <div className="flex flex-col items-center justify-center p-4">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-cyan-100 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 mb-4 transition-colors duration-500">
                            <Layers size={24} />
                        </div>
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-1 transition-colors duration-500">3</h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm transition-colors duration-500">{t('sp.stat2')}</p>
                    </div>

                    <div className="flex flex-col items-center justify-center p-4">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 mb-4 transition-colors duration-500">
                            <Sparkles size={24} />
                        </div>
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-1 transition-colors duration-500">1</h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm transition-colors duration-500">{t('sp.stat3')}</p>
                    </div>

                </div>
            </div>
        </section>
    );
}
