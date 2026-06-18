"use client";
import React from 'react';
import { Brain } from './icons';
import { useLanguage } from './language-context';

export default function Navbar() {
    const { t, lang, setLang } = useLanguage();

    return (
        <nav className="w-full px-6 py-4 flex justify-between items-center border-b border-slate-200 dark:border-white/5 bg-white/50 dark:bg-slate-950/50 backdrop-blur-md sticky top-0 z-50 transition-colors duration-500">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 cursor-pointer group">
                <Brain size={28} className="group-hover:text-cyan-500 dark:group-hover:text-cyan-400 transition-colors duration-300" />
                <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Test-Platform</span>
            </div>
            
            <div className="hidden md:flex gap-8 text-sm font-medium text-slate-600 dark:text-slate-300">
                <a href="#features" className="hover:text-indigo-600 dark:hover:text-white transition-colors">{t('nav.features')}</a>
                <a href="#use-cases" className="hover:text-indigo-600 dark:hover:text-white transition-colors">{t('nav.useCases')}</a>
                <a href="#customers" className="hover:text-indigo-600 dark:hover:text-white transition-colors">{t('nav.customers')}</a>
            </div>
            
            <div className="flex items-center gap-4">
                <select
                    value={lang} 
                    onChange={(e) => setLang(e.target.value as any)}
                    className="bg-transparent text-slate-600 dark:text-slate-300 text-sm font-medium outline-none cursor-pointer hover:text-indigo-600 dark:hover:text-white border-none appearance-none"
                >
                    <option value="en" className="bg-white dark:bg-slate-900">EN</option>
                    <option value="ru" className="bg-white dark:bg-slate-900">RU</option>
                    <option value="kk" className="bg-white dark:bg-slate-900">KK</option>
                </select>

                <a href="/home" className="hidden sm:block text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white transition-colors">
                    {t('nav.login')}
                </a>
                <a href="/home" className="px-5 py-2 rounded-full bg-indigo-600 hover:bg-indigo-500 transition-all text-sm font-semibold text-white shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)]">
                    {t('nav.start')}
                </a>
            </div>
        </nav>
    );
}
