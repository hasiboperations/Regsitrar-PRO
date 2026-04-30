import React, { useState } from 'react';
import type { Page } from '../App';
import { getHubIcon, getSmallGeneratorIcon } from '../constants/templates';
import SearchIcon from './icons/SearchIcon';
import ArrowRightIcon from './icons/ArrowRightIcon';
import SparklesIcon from './icons/SparklesIcon';
import BrainCircuitIcon from './icons/BrainCircuitIcon';
import UsersIcon from './icons/UsersIcon';
import DownloadIcon from './icons/DownloadIcon';

interface LandingPageProps {
  onNavigate: (page: Page) => void;
}

const solutionHubs = [
  {
    id: 'meeting_solutions',
    title: 'Meeting Solutions',
    description: 'Streamline your meeting workflow from agenda to action items.',
    icon: getHubIcon('meeting_solutions'),
    page: 'meeting_solutions'
  },
  {
    id: 'notice_letter_solutions',
    title: 'Notices & Letters',
    description: 'Draft official notices, circulars, and certificates instantly.',
    icon: getHubIcon('notice_letter_solutions'),
    page: 'notice_letter_solutions'
  },
  {
    id: 'eligibility_checker',
    title: 'eEligibility Checker',
    description: 'Verify eligibility criteria for programs and services.',
    icon: getHubIcon('eligibility_checker'),
    page: 'eligibility_checker_tool',
    externalLink: 'https://eechecker.vercel.app/'
  },
  {
    id: 'disciplinary_action',
    title: 'Disciplinary Action',
    description: 'Handle disciplinary issues with generated notices and letters.',
    icon: getHubIcon('disciplinary_action'),
    page: 'disciplinary_action'
  },
  {
    id: 'image_solutions',
    title: 'Image to Text',
    description: 'Extract text from images using advanced AI analysis.',
    icon: getHubIcon('image_solutions'),
    page: 'image_editor'
  },
  {
    id: 'hr_solutions',
    title: 'HR Solutions',
    description: 'End-to-End HR Standard Lifecycle, Global Best Practices',
    icon: getHubIcon('hr_solutions'),
    page: 'hr_solutions',
    externalLink: 'https://global-aihr.vercel.app/'
  },
  {
    id: 'alumni_certificate',
    title: 'Alumni Certificate Gen',
    description: 'Create personalized certificates for university alumni to verify their graduation and tenure.',
    icon: getHubIcon('alumni_certificate'),
    page: 'alumni_certificate',
    comingSoon: true
  },
  {
    id: 'reports_records',
    title: 'Reports & Records',
    description: 'Generate comprehensive annual reports and records.',
    icon: getHubIcon('reports_records'),
    page: 'reports_records'
  },
];

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {

  const handleCardClick = (hub: any) => {
      if (hub.comingSoon) return;
      if (hub.externalLink) {
          window.open(hub.externalLink, '_blank', 'noopener,noreferrer');
      } else {
          onNavigate(hub.page as Page);
      }
  };

  const handleDownloadApp = () => {
      window.location.href = "https://drive.usercontent.google.com/download?id=1pzbHWpd1bM57R-TepHvS766wNGNzyDwt&export=download&authuser=0";
  };

  const scrollToSolutions = () => {
      document.getElementById('solution-hubs')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white animate-fade-in font-sans selection:bg-blue-500/30 selection:text-white overflow-hidden">
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-40 overflow-hidden">
        {/* Abstract Background Orbs - Updated to Blue/Teal */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] opacity-30 pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-teal-500/10 rounded-full blur-[100px] opacity-20 pointer-events-none"></div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#3b82f6_1px,transparent_1px),linear-gradient(to_bottom,#3b82f6_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-[0.03]"></div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            
            <div className="flex flex-col items-center justify-center mb-12">
                <div className="flex flex-row items-center justify-center gap-4 mb-6 transform hover:scale-[1.02] transition-transform duration-500">
                    <BrainCircuitIcon className="w-16 h-16 text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.3)] flex-shrink-0" />
                    <h1 className="text-6xl font-extrabold tracking-tight leading-tight">
                        <span className="text-white">AI</span>
                        <span className="text-[#0067b8]">Registrar</span>
                    </h1>
                </div>

                {/* Decorative Line */}
                <div className="h-1 w-24 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full mb-8 shadow-lg shadow-blue-500/50"></div>
                
                <div className="max-w-4xl mx-auto text-center space-y-6">
                    {/* Small Slogan */}
                    <p className="text-sm md:text-base font-bold text-slate-400 tracking-[0.2em] uppercase">
                        Where Intelligence Meets Administration
                    </p>

                    {/* Big Initiative Text */}
                    <p className="text-1xl md:text-2xl lg:text-2xl font-extrabold text-white leading-tight uppercase">
                        AN INITIATIVE OF THE OFFICE OF THE REGISTRAR <br className="hidden md:block" />
                        <span className="text-blue-100">Daffodil International University</span>
                    </p>
                </div>
            </div>

            <div className="mt-12 flex flex-col sm:flex-row justify-center gap-6 px-4">
                <button 
                    onClick={scrollToSolutions}
                    className="px-8 py-4 bg-indigo-600 text-white text-base font-bold rounded-2xl shadow-[0_6px_0_#312e81] hover:bg-indigo-500 active:shadow-none active:translate-y-[6px] transition-all duration-150 uppercase tracking-wider w-full sm:w-auto"
                >
                    Get Started
                </button>
                <button 
                    onClick={() => onNavigate('about')}
                    className="px-8 py-4 bg-slate-700 text-white text-base font-bold rounded-2xl shadow-[0_6px_0_#0f172a] hover:bg-slate-600 active:shadow-none active:translate-y-[6px] transition-all duration-150 uppercase tracking-wider w-full sm:w-auto"
                >
                    Learn More
                </button>
            </div>
        </div>
      </section>

      {/* Solution Hubs Grid Section */}
      <section id="solution-hubs" className="py-24 relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-20">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">Everything you need</h2>
                <div className="h-1.5 w-24 bg-gradient-to-r from-teal-500 to-blue-500 mx-auto rounded-full"></div>
                <p className="mt-6 text-slate-400 max-w-2xl mx-auto text-lg px-4">
                    Comprehensive tools to support your academic and administrative journey.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {solutionHubs.map((hub, index) => (
                    <div 
                        key={hub.id}
                        onClick={() => handleCardClick(hub)}
                        className={`group bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-3xl p-8 transition-all duration-300 relative overflow-hidden flex flex-col ${
                            hub.comingSoon 
                            ? 'opacity-75 cursor-not-allowed hover:bg-slate-900/40' 
                            : 'hover:border-blue-500/30 hover:bg-slate-800/60 cursor-pointer active:scale-[0.98] shadow-lg hover:shadow-blue-500/10'
                        }`}
                    >
                        {!hub.comingSoon && (
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        )}
                        
                        <div className="relative z-10 flex flex-col h-full">
                            <div className={`w-16 h-16 bg-slate-800/80 rounded-2xl flex items-center justify-center mb-8 border border-white/5 flex-shrink-0 ${
                                hub.comingSoon ? 'text-slate-500' : 'text-blue-400 group-hover:scale-110 group-hover:bg-blue-500 group-hover:text-white transition-all duration-500 shadow-inner overflow-hidden'
                            }`}>
                                {hub.icon}
                            </div>
                            
                            <h3 className={`text-2xl font-bold mb-4 ${hub.comingSoon ? 'text-slate-300' : 'text-white group-hover:text-teal-400 transition-colors'}`}>
                                {hub.title}
                            </h3>
                            <p className="text-slate-400 text-base leading-relaxed mb-8 flex-grow">
                                {hub.description}
                            </p>
                            
                            <div className="mt-auto">
                                {hub.comingSoon ? (
                                    <span className="inline-block px-4 py-2 bg-slate-800 text-slate-400 text-xs font-bold uppercase tracking-wider rounded-full border border-white/5">
                                        Coming Soon
                                    </span>
                                ) : (
                                    <div className="flex items-center text-blue-400 font-bold text-sm uppercase tracking-wider group-hover:text-teal-300">
                                        Launch Tool <ArrowRightIcon className="w-5 h-5 ml-2 transform group-hover:translate-x-2 transition-transform duration-300" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {/* Mobile App Promo Card */}
                <div 
                    onClick={handleDownloadApp}
                    className="group bg-[#001e4d] rounded-3xl p-8 border border-blue-800 shadow-2xl relative overflow-hidden cursor-pointer hover:shadow-blue-500/20 hover:border-blue-600 transition-all duration-300 active:scale-[0.98] flex flex-col"
                >
                    {/* Decorative background glow */}
                    <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl -ml-10 -mb-10"></div>

                    <div className="relative z-10 flex flex-col h-full">
                        <h3 className="text-3xl font-extrabold text-white mb-2 leading-tight">
                            Great news!
                        </h3>
                        <p className="text-xl font-bold text-blue-100 mb-2 leading-tight">
                            Our mobile app<br/>is now available.
                        </p>
                        <p className="text-sm text-blue-200 mt-2 mb-8 flex-grow">
                            Use all website features anytime, anywhere.
                        </p>
                        
                        <div className="mt-auto flex items-center justify-between">
                            <div className="flex items-center gap-3 bg-[#002b6e] p-3 rounded-xl border border-blue-700/50">
                                <BrainCircuitIcon className="w-10 h-10 text-cyan-400" />
                                <div>
                                    <div className="text-white font-bold text-sm leading-none">AI</div>
                                    <div className="text-blue-400 font-bold text-sm leading-none">Registrar</div>
                                </div>
                            </div>
                            <div className="bg-white text-blue-900 p-3 rounded-full shadow-lg group-hover:scale-110 transition-transform">
                                <DownloadIcon className="w-6 h-6" />
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-blue-950/20"></div>
          <div className="container mx-auto px-4 relative z-10 text-center">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-8">Ready to transform your workflow?</h2>
              <p className="text-slate-300 mb-12 max-w-2xl mx-auto text-lg px-4">
                  Join the future of academic administration with AI Registrar today. Experience the power of agentic AI.
              </p>
              <button 
                onClick={scrollToSolutions}
                className="px-10 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-[0_6px_0_#312e81] hover:bg-indigo-500 active:shadow-none active:translate-y-[6px] transition-all duration-150 uppercase tracking-wider"
              >
                  Explore Tools
              </button>
          </div>
      </section>

    </div>
  );
};

export default LandingPage;