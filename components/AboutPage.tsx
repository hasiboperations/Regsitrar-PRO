
import React from 'react';
import type { Page } from '../App';
import CheckCircleIcon from './icons/CheckCircleIcon';

const AboutPage: React.FC<{ onNavigate: (page: Page) => void }> = ({ onNavigate }) => {

    const FeatureListItem: React.FC<{ title: string; children?: React.ReactNode }> = ({ title, children }) => (
        <li className="flex items-start">
            <div className="flex-shrink-0 mt-1">
                <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/50">
                    <CheckCircleIcon className="w-3 h-3 text-indigo-400" />
                </div>
            </div>
            <div className="ml-4">
                <h4 className="text-base font-semibold text-slate-200">{title}</h4>
                {children && <p className="text-sm text-slate-400 mt-0.5">{children}</p>}
            </div>
        </li>
    );

    return (
        <div className="animate-fade-in bg-slate-950 min-h-screen text-slate-200 font-sans selection:bg-indigo-500 selection:text-white relative overflow-hidden">
            
             {/* Background Grid Pattern */}
             <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none"></div>

            <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12 space-y-20 relative z-10">
                
                {/* Deliverables Grid */}
                <section>
                    <div className="text-center mb-10">
                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">What AI Registrar Delivers</h2>
                        <div className="h-1 w-20 bg-indigo-500 mx-auto rounded-full"></div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl hover:border-indigo-500/30 transition-colors">
                            <div className="text-2xl mb-3">⚡</div>
                            <h3 className="text-lg font-bold text-white mb-2">Instant Generation</h3>
                            <p className="text-slate-400 text-sm">Instant generation of memos, notices, letters, proceedings, and many more.</p>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl hover:border-indigo-500/30 transition-colors">
                            <div className="text-2xl mb-3">🤖</div>
                            <h3 className="text-lg font-bold text-white mb-2">Agentic Execution</h3>
                            <p className="text-slate-400 text-sm">Agentic task execution—prepare, process, preserve, complete.</p>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl hover:border-indigo-500/30 transition-colors">
                            <div className="text-2xl mb-3">📘</div>
                            <h3 className="text-lg font-bold text-white mb-2">Policy Compliance</h3>
                            <p className="text-slate-400 text-sm">Policy-aligned decision support ensuring strict adherence.</p>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl hover:border-indigo-500/30 transition-colors">
                            <div className="text-2xl mb-3">🔐</div>
                            <h3 className="text-lg font-bold text-white mb-2">Secure Records</h3>
                            <p className="text-slate-400 text-sm">Secure record management (Coming Soon).</p>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl hover:border-indigo-500/30 transition-colors md:col-span-2 lg:col-span-2">
                            <div className="text-2xl mb-3">📊</div>
                            <h3 className="text-lg font-bold text-white mb-2">Full Automation</h3>
                            <p className="text-slate-400 text-sm">Full workflow automation for administrative efficiency.</p>
                        </div>
                    </div>
                    <p className="text-center mt-12 text-white font-bold text-lg md:text-xl">
                        “AI Registrar is the future of academic administration—faster, smarter, and more reliable.”
                    </p>
                </section>

                {/* Mission & Vision */}
                <section className="grid md:grid-cols-2 gap-8">
                    {/* Vision Card */}
                    <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl blur opacity-10 group-hover:opacity-20 transition-opacity"></div>
                        <div className="relative bg-slate-900 border border-slate-800 p-8 rounded-2xl h-full flex flex-col">
                            <div className="flex items-center mb-6">
                                <div className="p-3 bg-cyan-500/10 rounded-lg text-cyan-400 mr-4">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                </div>
                                <h2 className="text-2xl font-bold text-white">Our Vision</h2>
                            </div>
                            <p className="text-slate-300 leading-relaxed mb-4">
                                To create a smart, efficient, and professionally empowered academic administrative environment where every decision, document, and process reflects accuracy, transparency, and institutional excellence.
                            </p>
                            <p className="text-slate-300 leading-relaxed">
                                AI Registrar supports the Registrar’s vision of modernizing academic operations through intelligent automation and digital innovation.
                            </p>
                        </div>
                    </div>

                    {/* Mission Card */}
                    <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-10 group-hover:opacity-20 transition-opacity"></div>
                        <div className="relative bg-slate-900 border border-slate-800 p-8 rounded-2xl h-full">
                            <div className="flex items-center mb-6">
                                <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400 mr-4">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                </div>
                                <h2 className="text-2xl font-bold text-white">Our Mission</h2>
                            </div>
                            <ul className="space-y-4">
                                <FeatureListItem title="Digital Transformation">To transform the Office of the Registrar into a fully digital, high-efficiency service hub.</FeatureListItem>
                                <FeatureListItem title="Automation">To automate academic administrative processes through agentic AI.</FeatureListItem>
                                <FeatureListItem title="Speed & Accuracy">To deliver fast, accurate, and policy-compliant documents within seconds.</FeatureListItem>
                                <FeatureListItem title="Service Quality">To enhance service quality for students, faculty, staff, and stakeholders.</FeatureListItem>
                                <FeatureListItem title="Security">To ensure secure preservation and governance of academic records.</FeatureListItem>
                                <FeatureListItem title="National Alignment">To support national digital initiatives such as Digital Bangladesh.</FeatureListItem>
                                <FeatureListItem title="Empowerment">To empower the institution with smart decision-making tools.</FeatureListItem>
                            </ul>
                        </div>
                    </div>
                </section>

                <div className="text-center pb-8 border-t border-slate-800 pt-8">
                    <p className="text-sm text-slate-400">
                        Developed by: <span className="font-bold text-white">Md. Hasibul Haque Hasib</span>
                    </p>
                </div>

            </main>
        </div>
    );
};

export default AboutPage;
