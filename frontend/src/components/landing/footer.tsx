"use client";
import React from 'react';
import { Brain } from './icons';
import { useLanguage } from './language-context';

export default function Footer() {
    const { t } = useLanguage();

    return (
        <footer className="py-12 px-6 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 relative z-10 transition-colors duration-500">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 transition-colors duration-500">
                    <Brain size={24} />
                    <span className="font-semibold text-slate-900 dark:text-white transition-colors duration-500">Test-Platform</span>
                </div>
                
                <p className="text-slate-500 text-sm text-center md:text-left transition-colors duration-500">
                    {t('footer.desc')}
                </p>
                
                <div className="flex gap-6 text-sm text-slate-500">
                    <a href="#" className="hover:text-indigo-600 dark:hover:text-white transition-colors">{t('footer.l1')}</a>
                    <a href="#" className="hover:text-indigo-600 dark:hover:text-white transition-colors">{t('footer.l2')}</a>
                    <a href="#" className="hover:text-indigo-600 dark:hover:text-white transition-colors">{t('footer.l3')}</a>
                </div>
            </div>
        </footer>
    );
}
