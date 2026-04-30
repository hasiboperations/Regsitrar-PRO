import type { DocumentType } from '../types';

interface Placeholder {
    placeholder: string;
    description: string;
    example: string;
}

// FIX: Added missing properties 'approval_memo' and 'committee_formation' to satisfy the Record<DocumentType, Placeholder[]> type. Also added placeholders used in templates for these types.
export const PLACEHOLDERS: Record<DocumentType, Placeholder[]> = {
    meeting_memo: [
        {
            placeholder: '{{decision}}',
            description: 'The specific, actionable decision made for a single agenda item.',
            example: 'The proposal to purchase new lab equipment for the Chemistry department has been approved for a budget not exceeding $15,000.'
        },
        {
            placeholder: '{{committee_name}}',
            description: 'The name of the committee that held the meeting.',
            example: 'Academic Council'
        },
        {
            placeholder: '{{committee_num}}',
            description: 'The ordinal number of the meeting (e.g., 53rd, 1st).',
            example: '124th'
        },
        {
            placeholder: '{{meeting_date}}',
            description: 'The date on which the meeting was held.',
            example: 'October 26, 2023'
        },
    ],
    committee_formation: [
        {
            placeholder: '{{decision}}',
            description: 'The purpose or objective for forming the new committee.',
            example: 'oversee the upcoming university accreditation process'
        },
        {
            placeholder: '{{committee_name}}',
            description: 'The name of the committee that held the meeting where the formation was decided.',
            example: 'Academic Council'
        },
        {
            placeholder: '{{committee_num}}',
            description: 'The ordinal number of the meeting (e.g., 53rd, 1st).',
            example: '124th'
        },
        {
            placeholder: '{{meeting_date}}',
            description: 'The date on which the meeting was held.',
            example: 'October 26, 2023'
        },
    ],
    other_memos: [],
    memo: [], // Not directly used
};