export type DocumentType = 'memo' | 'meeting_memo' | 'committee_formation' | 'other_memos';

export interface DocumentContent {
  doc_id: string; // e.g., M1, L1, R1
  doc_type: DocumentType;
  ref: string;
  doc_date: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  cc: string[];
  // Optional fields that might not apply to all types
  committee_name?: string;
  meeting_date?: string;
}

export interface Template {
  id: string;
  name:string;
  content: string;
  isDefault?: boolean;
}

export interface CustomPlaceholder {
  id: string;
  name: string; // The key, e.g., "project_manager"
  description: string;
}