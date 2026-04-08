import React, { useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import LandingPage from './components/LandingPage';
import GeneratorPage from './components/GeneratorPage';
import ProceedingsGeneratorPage from './components/ProceedingsGeneratorPage';
import AgendaGeneratorPage from './components/AgendaGeneratorPage';
import { GENERATOR_CONFIG } from './constants/templates';
import MeetingSolutionsPage from './components/MeetingSolutionsPage';
import DisciplinaryActionPage from './components/DisciplinaryActionPage';
import NoticeLetterPage from './components/NoticeLetterPage';
import HRSolutionsPage from './components/HRSolutionsPage';
import ReportsRecordsPage from './components/ReportsRecordsPage';
import GeneralNoticeGeneratorPage from './components/GeneralNoticeGeneratorPage';
import CommitteeFormationGeneratorPage from './components/CommitteeFormationGeneratorPage';
import OtherMemosGeneratorPage from './components/OtherMemosGeneratorPage';
import ImageEditorPage from './components/ImageEditorPage';
import AboutPage from './components/AboutPage';
import ChatSupportWidget from './components/ChatSupportWidget';

export type Page = 'landing' | 'about' | 'meeting_memo' | 'proceedings_generator' | 'agenda_generator' | 'meeting_solutions' | 'disciplinary_action' | 'notice_letter_solutions' | 'hr_solutions' | 'reports_records' | 'general_notice' | 'committee_formation' | 'other_memos' | 'image_editor';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
    setIsMobileMenuOpen(false); // Close menu on navigation
    window.scrollTo(0, 0);
  };

  const renderPage = () => {
    if (currentPage === 'landing') {
      return <LandingPage onNavigate={handleNavigate} />;
    }

    if (currentPage === 'about') {
      return <AboutPage onNavigate={handleNavigate} />;
    }
    
    if (currentPage === 'meeting_solutions') {
      return <MeetingSolutionsPage onNavigate={handleNavigate} onBack={() => handleNavigate('landing')} />;
    }
    
    if (currentPage === 'disciplinary_action') {
      return <DisciplinaryActionPage onNavigate={handleNavigate} onBack={() => handleNavigate('landing')} />;
    }

    if (currentPage === 'notice_letter_solutions') {
      return <NoticeLetterPage onNavigate={handleNavigate} onBack={() => handleNavigate('landing')} />;
    }
    
    if (currentPage === 'hr_solutions') {
      return <HRSolutionsPage onNavigate={handleNavigate} onBack={() => handleNavigate('landing')} />;
    }

    if (currentPage === 'reports_records') {
      return <ReportsRecordsPage onNavigate={handleNavigate} onBack={() => handleNavigate('landing')} />;
    }

    if (currentPage === 'general_notice') {
      return <GeneralNoticeGeneratorPage onBack={() => handleNavigate('landing')} />;
    }

    if (currentPage === 'committee_formation') {
      return <CommitteeFormationGeneratorPage onBack={() => handleNavigate('landing')} />;
    }

    if (currentPage === 'other_memos') {
      return <OtherMemosGeneratorPage onBack={() => handleNavigate('landing')} />;
    }

    if (currentPage === 'image_editor') {
      return <ImageEditorPage onBack={() => handleNavigate('landing')} />;
    }

    if (currentPage === 'agenda_generator') {
      const config = GENERATOR_CONFIG[currentPage];
      return <AgendaGeneratorPage 
              onBack={() => handleNavigate('landing')}
              title={config.title}
              description={config.description}
              onNavigate={handleNavigate}
             />;
    }

    if (currentPage === 'proceedings_generator') {
      const config = GENERATOR_CONFIG[currentPage];
      return <ProceedingsGeneratorPage 
              onBack={() => handleNavigate('landing')}
              title={config.title}
              description={config.description}
              onNavigate={handleNavigate}
             />;
    }
    
    const config = GENERATOR_CONFIG[currentPage as keyof typeof GENERATOR_CONFIG];
    if (config) {
      return (
        <GeneratorPage
          key={currentPage} // Use key to force re-mount when page changes
          onBack={() => handleNavigate('landing')}
          title={config.title}
          description={config.description}
          templates={config.templates}
          generatorType={currentPage as 'meeting_memo'}
        />
      );
    }
    
    // Fallback to landing page if config not found
    return <LandingPage onNavigate={handleNavigate} />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-200 font-sans">
      <Header
        currentPage={currentPage}
        onNavigate={handleNavigate}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />
      <main className="flex-grow w-full relative">
        {renderPage()}
      </main>
      <Footer onNavigate={handleNavigate} />
      <ChatSupportWidget />
    </div>
  );
};

export default App;