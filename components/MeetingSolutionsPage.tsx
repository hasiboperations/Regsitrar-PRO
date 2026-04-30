
import React from 'react';
import type { Page } from '../App';
import HomeIcon from './icons/HomeIcon';
import { getLargeGeneratorIcon } from '../constants/templates';

const GeneratorCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  style: React.CSSProperties;
  className?: string;
  disabled?: boolean;
}> = ({ icon, title, description, onClick, style, className, disabled }) => (
  <div
    onClick={disabled ? undefined : onClick}
    style={style}
    className={`flex flex-col text-center bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-3xl transition-all duration-300 p-8 group ${
        disabled 
        ? 'opacity-50 saturate-0 cursor-not-allowed' 
        : 'hover:bg-slate-800/60 hover:border-cyan-500/30 hover:shadow-2xl hover:shadow-cyan-500/10 hover:-translate-y-2 cursor-pointer'
    } ${className || ''}`}
    role="button"
    tabIndex={disabled ? -1 : 0}
    onKeyPress={(e) => { if (!disabled && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onClick(); }}}
    aria-disabled={disabled}
  >
    <div className={`flex-shrink-0 self-center flex justify-center items-center h-20 w-20 rounded-2xl mb-6 text-white shadow-lg transition-transform duration-500 border border-white/5 ${
        disabled 
        ? 'bg-slate-800' 
        : 'bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 group-hover:from-indigo-500 group-hover:to-cyan-500 group-hover:scale-110 group-hover:rotate-3'
    }`}>
      <div className={`${disabled ? 'text-slate-500' : 'text-cyan-400 group-hover:text-white transition-colors duration-300'}`}>
        {icon}
      </div>
    </div>
    <h3 className="text-xl font-bold text-slate-100 mb-3 group-hover:text-cyan-400 transition-colors">{title}</h3>
    <p className="text-slate-400 text-sm flex-grow mb-8 leading-relaxed">{description}</p>
    <div className="mt-auto w-full">
      {disabled ? (
        <span className="inline-block px-6 py-2 bg-slate-800 text-slate-500 text-xs font-bold uppercase tracking-wider rounded-full border border-white/5">
          Coming Soon
        </span>
      ) : (
        <span className="inline-block w-full py-3 bg-indigo-600 text-white font-bold rounded-2xl text-sm shadow-[0_4px_0_#312e81] hover:bg-indigo-500 active:shadow-none active:translate-y-[4px] transition-all uppercase tracking-wide">
          Launch Generator
        </span>
      )}
    </div>
  </div>
);


const MeetingSolutionsPage: React.FC<{ onNavigate: (page: Page) => void; onBack: () => void; }> = ({ onNavigate, onBack }) => {
    return (
        <div className="animate-fade-in min-h-screen bg-slate-950 relative overflow-hidden selection:bg-indigo-500/30 selection:text-white">
             {/* Background Effects */}
            <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="shrink-0 relative z-40 pt-8 pb-4">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <button onClick={onBack} className="flex items-center text-slate-400 hover:text-white font-medium mb-6 text-sm transition-colors group">
                        <span className="p-2 rounded-full bg-slate-900 group-hover:bg-indigo-600 transition-colors mr-3 border border-white/5"><HomeIcon className="w-4 h-4" /></span>
                        Back to Home
                    </button>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-3">
                        Meeting <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Solutions</span>
                    </h1>
                     <p className="text-slate-400 text-lg max-w-2xl">A suite of agentic tools to streamline your meeting workflow, from agenda to action.</p>
                </div>
            </div>
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    <GeneratorCard
                        style={{ animationDelay: '100ms' }}
                        className="animate-slide-in-up"
                        icon={getLargeGeneratorIcon('agenda_generator')}
                        title="Meeting Agenda"
                        description="Create professionally formatted meeting agendas using structured inputs and a live preview."
                        onClick={() => onNavigate('agenda_generator')}
                    />
                    <GeneratorCard
                        style={{ animationDelay: '200ms' }}
                        className="animate-slide-in-up"
                        icon={getLargeGeneratorIcon('proceedings_generator')}
                        title="Meeting Proceedings"
                        description="Generate full, official proceedings from meeting minutes, complete with headers, decisions, and signatures."
                        onClick={() => onNavigate('proceedings_generator')}
                    />
                    <GeneratorCard
                        style={{ animationDelay: '300ms' }}
                        className="animate-slide-in-up"
                        icon={getLargeGeneratorIcon('meeting_memo')}
                        title="Meeting Memoranda"
                        description="Extract actionable decisions from any meeting minutes and automatically generate individual memos."
                        onClick={() => onNavigate('meeting_memo')}
                    />
                    <GeneratorCard
                        style={{ animationDelay: '400ms' }}
                        className="animate-slide-in-up"
                        icon={getLargeGeneratorIcon('committee_formation')}
                        title="Committee Formation"
                        description="Create official memos for forming new committees or task forces."
                        onClick={() => onNavigate('committee_formation')}
                    />
                    <GeneratorCard
                        style={{ animationDelay: '500ms' }}
                        className="animate-slide-in-up"
                        icon={getLargeGeneratorIcon('other_memos')}
                        title="Other Memos"
                        description="Generate various official memos using a flexible form."
                        onClick={() => onNavigate('other_memos')}
                    />
                    <GeneratorCard
                        style={{ animationDelay: '600ms' }}
                        className="animate-slide-in-up"
                        icon={getLargeGeneratorIcon('follow_up')}
                        title="Follow-Up"
                        description="Track actions, send reminders, and ensure decisions are implemented. (Coming Soon)"
                        onClick={() => {}}
                        disabled
                    />
                </div>
            </main>
        </div>
    );
};

export default MeetingSolutionsPage;
