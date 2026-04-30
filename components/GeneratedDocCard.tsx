import React from 'react';
import type { DocumentContent, DocumentType } from '../types';
import { generateSingleDocx } from '../services/docxService';
import DownloadIcon from './icons/DownloadIcon';

const getDocTypeUIAttributes = (docType: DocumentType): { border: string, name: string } => {
    switch (docType) {
        case 'meeting_memo': case 'memo':
            return { border: 'border-indigo-500', name: 'Memo' };
        case 'committee_formation':
            return { border: 'border-purple-500', name: 'Committee Memo' };
        case 'other_memos':
            return { border: 'border-teal-500', name: 'Memo' };
        default:
            return { border: 'border-gray-400', name: 'Document' };
    }
};

const GeneratedDocCard: React.FC<{
  document: DocumentContent;
  onClick: () => void;
  isSelected: boolean;
  style?: React.CSSProperties;
}> = ({ document, onClick, isSelected, style }) => {

    const handleDownload = async (e: React.MouseEvent) => {
        e.stopPropagation();
        await generateSingleDocx(document);
    }
    
    const { border, name: docTypeName } = getDocTypeUIAttributes(document.doc_type);

    return (
        <div 
            onClick={onClick}
            className={`bg-white rounded-xl shadow-md border hover:shadow-lg transition-all duration-200 p-4 border-l-4 cursor-pointer animate-slide-in-up
                ${isSelected ? 'border-indigo-500 shadow-lg ring-2 ring-indigo-300' : 'border-gray-200'}
                ${border}`}
            style={style}
        >
            <div className="flex flex-col sm:flex-row justify-between items-start gap-3 w-full">
                <div className="flex-grow min-w-0 w-full">
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-sm font-mono bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md font-semibold">{document.doc_id}</span>
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{docTypeName}</span>
                    </div>
                    <h4 className="font-bold text-gray-800 truncate" title={document.subject}>
                        {document.subject}
                    </h4>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0 w-full sm:w-auto justify-end">
                     <button 
                        onClick={handleDownload}
                        className="flex items-center justify-center px-3 py-2 bg-teal-600 text-white text-xs font-semibold rounded-lg hover:bg-teal-700 transition-all duration-200 transform hover:-translate-y-0.5"
                        aria-label={`Download ${document.subject} as DOCX`}
                    >
                        <DownloadIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GeneratedDocCard;