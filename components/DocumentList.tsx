import React from 'react';
import type { DocumentContent } from '../types';
import GeneratedDocCard from './GeneratedDocCard';

interface DocumentListProps {
  documents: DocumentContent[];
  selectedDocId: string | null;
  onSelectDoc: (docId: string) => void;
}

const DocumentList: React.FC<DocumentListProps> = ({ documents, selectedDocId, onSelectDoc }) => {
  return (
    <div className="space-y-3 p-3">
      {documents.map((doc, index) => (
        <GeneratedDocCard
          key={doc.doc_id + doc.ref}
          document={doc}
          onClick={() => onSelectDoc(doc.doc_id)}
          isSelected={doc.doc_id === selectedDocId}
          style={{ animationDelay: `${index * 50}ms` }}
        />
      ))}
    </div>
  );
};

export default DocumentList;
