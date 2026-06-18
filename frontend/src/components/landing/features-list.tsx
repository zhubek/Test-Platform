"use client";
import React from 'react';
import { Zap, Globe, LayoutDashboard, Users } from './icons';
import { useLanguage } from './language-context';

export default function FeaturesList() {
    const { t } = useLanguage();

    return (
        <section id="use-cases" className="py-24 px-6 bg-slate-50/50 dark:bg-slate-900/30 relative z-10 border-y border-slate-200 dark:border-white/5 transition-colors duration-500">
            <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20">
                
                {/* Differentiators */}
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8 transition-colors duration-500">{t('fl.title1')}</h2>
                    <div className="space-y-8">
                        {[
                            { icon: <Zap size={24}/>, title: t('fl.f1.title'), desc: t('fl.f1.desc') },
                            { icon: <Globe size={24}/>, title: t('fl.f2.title'), desc: t('fl.f2.desc') },
                            { icon: <Users size={24}/>, title: t('fl.f3.title'), desc: t('fl.f3.desc') },
                            { icon: <LayoutDashboard size={24}/>, title: t('fl.f4.title'), desc: t('fl.f4.desc') }
                        ].map((item, i) => (
                            <div key={i} className="flex gap-4">
                                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center transition-colors duration-500">
                                    {item.icon}
                                </div>
                                <div>
                                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-1 transition-colors duration-500">{item.title}</h4>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed transition-colors duration-500">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Use Cases */}
                <div className="bg-white/80 dark:bg-slate-950/50 rounded-3xl p-8 md:p-12 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none transition-colors duration-500">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8 transition-colors duration-500">{t('fl.title2')}</h2>
                    <ul className="space-y-6">
                        {[
                            { title: t('fl.u1.title'), desc: t('fl.u1.desc') },
                            { title: t('fl.u2.title'), desc: t('fl.u2.desc') },
                            { title: t('fl.u3.title'), desc: t('fl.u3.desc') },
                            { title: t('fl.u4.title'), desc: t('fl.u4.desc') }
                        ].map((item, i) => (
                            <li key={i} className="border-b border-slate-200 dark:border-slate-800 pb-6 last:border-0 last:pb-0 transition-colors duration-500">
                                <h4 className="text-lg font-semibold text-cyan-600 dark:text-cyan-400 mb-2 transition-colors duration-500">{item.title}</h4>
                                <p className="text-slate-600 dark:text-slate-300 transition-colors duration-500">{item.desc}</p>
                            </li>
                        ))}
                    </ul>
                </div>

            </div>
        </section>
    );
}
