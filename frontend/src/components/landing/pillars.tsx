"use client";
import React from 'react';
import { FileText, Layers, LayoutDashboard, CheckCircle } from './icons';
import { useLanguage } from './language-context';

export default function Pillars() {
    const { t } = useLanguage();

    const pillars = [
        {
            icon: <FileText size={32} />,
            title: t('pillars.1.title'),
            desc: t('pillars.1.desc'),
            features: [t('pillars.1.f1'), t('pillars.1.f2'), t('pillars.1.f3'), t('pillars.1.f4')],
            color: "text-indigo-600 dark:text-indigo-400",
            bg: "bg-indigo-100 dark:bg-indigo-500/10",
            border: "border-indigo-200 dark:border-indigo-500/20"
        },
        {
            icon: <Layers size={32} />,
            title: t('pillars.2.title'),
            desc: t('pillars.2.desc'),
            features: [t('pillars.2.f1'), t('pillars.2.f2'), t('pillars.2.f3'), t('pillars.2.f4')],
            color: "text-cyan-600 dark:text-cyan-400",
            bg: "bg-cyan-100 dark:bg-cyan-500/10",
            border: "border-cyan-200 dark:border-cyan-500/20"
        },
        {
            icon: <LayoutDashboard size={32} />,
            title: t('pillars.3.title'),
            desc: t('pillars.3.desc'),
            features: [t('pillars.3.f1'), t('pillars.3.f2'), t('pillars.3.f3'), t('pillars.3.f4')],
            color: "text-violet-600 dark:text-violet-400",
            bg: "bg-violet-100 dark:bg-violet-500/10",
            border: "border-violet-200 dark:border-violet-500/20"
        }
    ];

    return (
        <section className="py-24 px-6 bg-slate-50/50 dark:bg-slate-900/30 relative z-10 transition-colors duration-500">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4 transition-colors duration-500">{t('pillars.title')}</h2>
                    <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto transition-colors duration-500">{t('pillars.desc')}</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {pillars.map((pillar, idx) => (
                        <div key={idx} className={`p-8 rounded-2xl bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 hover:${pillar.border} transition-colors duration-500 group shadow-sm dark:shadow-none`}>
                            <div className={`w-16 h-16 rounded-xl ${pillar.bg} ${pillar.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                {pillar.icon}
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 transition-colors duration-500">{pillar.title}</h3>
                            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6 h-24 transition-colors duration-500">
                                {pillar.desc}
                            </p>
                            <ul className="space-y-3">
                                {pillar.features.map((feat, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300 transition-colors duration-500">
                                        <CheckCircle size={16} className={`mt-0.5 ${pillar.color}`} />
                                        <span>{feat}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
