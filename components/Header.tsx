
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import type { Page } from '../App';
import MenuIcon from './icons/MenuIcon';
import CloseIcon from './icons/CloseIcon';
import SparklesIcon from './icons/SparklesIcon';
import LogoutIcon from './icons/LogoutIcon';

const AppLogo: React.FC<{ onClick: () => void }> = ({ onClick }) => (
    <button onClick={onClick} className="flex items-center justify-center transition-transform hover:scale-105 active:scale-95 duration-200" aria-label="Go to homepage">
        <img 
            src="https://daffodilvarsity.edu.bd/template/images/diulogoside.png" 
            alt="AI Registrar Logo" 
            className="h-8 md:h-10 lg:h-11 w-auto"
        />
    </button>
);

interface HeaderProps {
    currentPage: Page;
    onNavigate: (page: Page) => void;
    isMobileMenuOpen: boolean;
    setIsMobileMenuOpen: (isOpen: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ currentPage, onNavigate, isMobileMenuOpen, setIsMobileMenuOpen }) => {
    
    // Full navigation list in the requested order
    const navLinks = [
        { id: 'landing', title: 'Home' },
        { id: 'about', title: 'About' },
        { id: 'agenda_generator', title: 'Meeting Agenda' },
        { id: 'proceedings_generator', title: 'Proceedings' },
        { id: 'meeting_memo', title: 'Meeting Memo' },
        { id: 'committee_formation', title: 'Committee Formation' },
        { id: 'other_memos', title: 'Other Memos' },
    ];

    const NavLink: React.FC<{ page: string, title: string }> = ({ page, title }) => (
        <button
            onClick={() => onNavigate(page as Page)}
            className={`px-3 py-1.5 lg:px-4 lg:py-2 text-xs lg:text-sm font-bold rounded-lg transition-all duration-200 whitespace-nowrap ${
                currentPage === page 
                ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600 active:scale-95'
            }`}
        >
            {title}
        </button>
    );
    
    const MobileNavLink: React.FC<{ page: string, title: string }> = ({ page, title }) => (
         <button
            onClick={() => {
                onNavigate(page as Page);
                setIsMobileMenuOpen(false);
            }}
            className={`block w-full text-left px-5 py-3.5 text-base font-semibold rounded-xl transition-all duration-200 border border-transparent active:scale-[0.98] ${
                currentPage === page 
                ? 'bg-gradient-to-r from-indigo-600/20 to-purple-600/20 text-indigo-300 border-indigo-500/30 shadow-sm' 
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
        >
            {title}
        </button>
    );

    const handleGetStarted = () => {
      if (currentPage === 'landing') {
        document.getElementById('solution-hubs')?.scrollIntoView({ behavior: 'smooth' });
      } else {
        onNavigate('landing');
      }
    };

    return (
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm/50 backdrop-blur-xl bg-white/90 transition-all duration-300">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16 lg:h-20 gap-4">
                    <div className="flex items-center gap-2 lg:gap-8 flex-shrink-0">
                        <AppLogo onClick={() => onNavigate('landing')} />
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex items-center space-x-1 xl:space-x-2 flex-shrink-0 ml-auto">
                        {navLinks.map(link => (
                            <NavLink key={link.id} page={link.id} title={link.title} />
                        ))}
                    </nav>

                    <div className="flex items-center space-x-3 lg:space-x-4 flex-shrink-0">
                         <button
                            onClick={handleGetStarted}
                            className="hidden sm:flex items-center px-5 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-full hover:bg-slate-800 active:scale-95 transition-all shadow-lg shadow-slate-900/20"
                        >
                            <SparklesIcon className="w-4 h-4 mr-2 text-indigo-400" />
                            Get Started
                        </button>

                        {/* Mobile menu button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="lg:hidden p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 transition-all active:scale-95"
                            aria-expanded={isMobileMenuOpen}
                            aria-label="Toggle menu"
                        >
                            {isMobileMenuOpen ? (
                                <CloseIcon className="block h-6 w-6" aria-hidden="true" />
                            ) : (
                                <MenuIcon className="block h-6 w-6" aria-hidden="true" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Overlay - Portaled to body to escape sticky header context and ensure high z-index */}
            {isMobileMenuOpen && createPortal(
                <div 
                    className="lg:hidden fixed top-0 left-0 w-full h-full z-[9999] bg-black/60 backdrop-blur-sm transition-opacity duration-300" 
                    onClick={() => setIsMobileMenuOpen(false)}
                >
                    <div 
                        className="absolute right-0 top-0 bottom-0 w-[85%] max-w-sm bg-slate-900 shadow-2xl p-6 overflow-y-auto border-l border-white/10 flex flex-col h-full transform transition-transform duration-300 ease-out z-[10000]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Menu Header */}
                        <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                                    <SparklesIcon className="w-5 h-5 text-indigo-400" />
                                </div>
                                <span className="text-xl font-bold text-white tracking-tight">AI Registrar</span>
                            </div>
                            <button 
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="p-2.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors border border-transparent hover:border-white/10 active:scale-90"
                                aria-label="Close menu"
                            >
                                <CloseIcon className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Navigation Links */}
                        <nav className="space-y-2 flex-grow">
                            {navLinks.map(link => (
                                <MobileNavLink key={link.id} page={link.id} title={link.title} />
                            ))}
                        </nav>

                        {/* Menu Footer */}
                        <div className="mt-8 pt-6 border-t border-white/10">
                            <p className="text-center text-xs text-slate-600 mt-6">
                                © {new Date().getFullYear()} AI Registrar. v1.0
                            </p>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </header>
    );
};

export default Header;
