"use client";
import React from 'react';
import { useLanguage } from './language-context';

export default function Steps() {
    const { t } = useLanguage();

    const steps = [
        {
            num: "01",
            title: t('steps.1.title'),
            desc: t('steps.1.desc')
        },
        {
            num: "02",
            title: t('steps.2.title'),
            desc: t('steps.2.desc')
        },
        {
            num: "03",
            title: t('steps.3.title'),
            desc: t('steps.3.desc')
        }
    ];

    return (
        <section className="py-24 px-6 relative z-10">
            <div className="max-w-5xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold text-center text-slate-900 dark:text-white mb-16 transition-colors duration-500">{t('steps.title')}</h2>
                
                <div className="grid md:grid-cols-3 gap-8 relative">
                    {/* Connecting line for desktop */}
                    <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-px bg-gradient-to-r from-indigo-500/0 via-indigo-500/30 dark:via-indigo-500/50 to-indigo-500/0"></div>
                    
                    {steps.map((step, idx) => (
                        <div key={idx} className="relative flex flex-col items-center text-center">
                            <div className="w-24 h-24 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-6 relative z-10 shadow-lg dark:shadow-[0_0_20px_rgba(0,0,0,0.5)] transition-colors duration-500">
                                {step.num}
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 transition-colors duration-500">{step.title}</h3>
                            <p className="text-slate-600 dark:text-slate-400 transition-colors duration-500">{step.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
