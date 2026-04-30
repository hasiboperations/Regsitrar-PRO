
import React from 'react';
import type { Page } from '../App';
import MailIcon from './icons/MailIcon';
import PhoneIcon from './icons/PhoneIcon';
import LocationIcon from './icons/LocationIcon';

const AppLogo: React.FC = () => (
    <div className="flex items-center space-x-3" aria-label="Go to homepage">
        <div className="flex flex-col text-left">
            <span className="text-2xl font-extrabold text-white tracking-tight">AI Registrar</span>
        </div>
    </div>
);

const FooterLink: React.FC<{ onClick: () => void, children: React.ReactNode }> = ({ onClick, children }) => (
    <button onClick={onClick} className="text-white/80 hover:underline hover:text-white transition-colors duration-200 text-sm font-medium text-left">
        {children}
    </button>
);


const Footer: React.FC<{ onNavigate: (page: Page) => void; }> = ({ onNavigate }) => {
    return (
    <footer className="bg-[#050B18] text-white py-[60px] px-[40px] w-full border-t border-white/5 relative z-10">
        <div className="container mx-auto">
            <div className="flex flex-col md:flex-row justify-between gap-10">
                {/* Brand Column */}
                <div className="flex-1 space-y-4">
                    <AppLogo />
                    <p className="text-white/80 text-sm leading-relaxed max-w-sm">
                        AI Registrar is a next-generation agentic AI system and an initiative of the Office of the Registrar. It automates critical academic processes, generates official documents instantly, and ensures strict policy compliance with speed, accuracy, and professional excellence.
                    </p>
                </div>
                
                {/* Quick Links Column */}
                <div className="flex-1 space-y-4">
                    <h3 className="text-lg font-bold text-white mb-4">Quick Links</h3>
                    <ul className="list-none p-0 space-y-2">
                        <li><FooterLink onClick={() => onNavigate('landing')}>Home</FooterLink></li>
                        <li><FooterLink onClick={() => onNavigate('about')}>About Us</FooterLink></li>
                    </ul>
                </div>

                {/* Contact Column */}
                <div className="flex-1 space-y-4">
                    <h3 className="text-lg font-bold text-white mb-4">Contact</h3>
                    <ul className="list-none p-0 space-y-2 text-sm text-white/80">
                        <li className="flex items-center gap-3">
                            <MailIcon className="w-4 h-4 text-white" />
                            <span>hasib@daffodilvarsity.edu.bd</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <PhoneIcon className="w-4 h-4 text-white" />
                            <span>+8801847140181</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <LocationIcon className="w-4 h-4 text-white mt-1" />
                            <span>Daffodil Smart City (DSC), Birulia, Savar, Dhaka – 1216, Bangladesh</span>
                        </li>
                    </ul>
                </div>
            </div>
            
            <div className="mt-12 pt-8 border-t border-white/10 flex flex-col items-center justify-center text-center">
                <p className="font-bold text-white text-sm md:text-base leading-relaxed">
                    &copy; 2025 AI Registrar. Concept and development by Hasibul Haque (Hasib), All rights reserved.
                </p>
            </div>
        </div>
    </footer>
    );
};

export default Footer;
