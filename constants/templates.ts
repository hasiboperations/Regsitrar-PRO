
import React from 'react';
import { Page } from '../App';
import type { Template } from '../types';
import BriefcaseIcon from '../components/icons/BriefcaseIcon';
import ShieldCheckIcon from '../components/icons/ShieldCheckIcon';
import MailIcon from '../components/icons/MailIcon';
import UsersIcon from '../components/icons/UsersIcon';
import ReportIcon from '../components/icons/ReportIcon';
import PencilSquareIcon from '../components/icons/PencilSquareIcon';
import MinutesIcon from '../components/icons/MinutesIcon';
import CheckBadgeIcon from '../components/icons/CheckBadgeIcon';
import ClockIcon from '../components/icons/ClockIcon';
import LockClosedIcon from '../components/icons/LockClosedIcon';
import DocumentIcon from '../components/icons/DocumentIcon';
import CalendarDaysIcon from '../components/icons/CalendarDaysIcon';
import CommitteeIcon from '../components/icons/CommitteeIcon';
import ImageIcon from '../components/icons/ImageIcon';
import HRIllustrationIcon from '../components/icons/HRIllustrationIcon';
import MeetingIcon from '../components/icons/MeetingIcon';


interface GeneratorConfig {
  title: string;
  description: string;
  templates: Template[];
}

export const MEETING_COMMITTEES: Record<string, string> = {
  'Management Committee': 'MC',
  "Dean's Committee": 'DC',
  'Joint Committee': 'Joint',
  'Special Committee': 'SC',
  'Academic Council': 'AC',
  'Syndicate': 'Syn'
};

// FIX: Excluded 'meeting_solutions' from the type as it is a hub page and does not have a generator configuration, which caused a type error.
export const GENERATOR_CONFIG: Record<Exclude<Page, 'landing' | 'about' | 'meeting_solutions' | 'disciplinary_action' | 'notice_letter_solutions' | 'hr_solutions' | 'reports_records' | 'image_editor' | 'general_notice'>, GeneratorConfig> = {
  agenda_generator: {
    title: "Meeting Agenda Generator",
    description: "Create professionally formatted DIU meeting agendas with structured inputs and a live preview.",
    templates: [], // This generator does not use templates
  },
  proceedings_generator: {
    title: "Proceedings Generator",
    description: "Generate full, official proceedings from meeting minutes, complete with headers, decisions, and signatures.",
    templates: [], // This generator does not use templates
  },
  meeting_memo: {
    title: "Meeting Memo Generator",
    description: "Extract actionable decisions from any meeting minutes and automatically generate individual memos.",
    templates: [
      {
        id: 'standard_decision',
        name: 'Standard Decision Memo',
        content: 'As per the decision of the {{committee_num}} {{committee_name}} Meeting (held on {{meeting_date}}), I am directed to inform you that the committee {{decision}}.',
        isDefault: true,
      },
    ],
  },
  committee_formation: {
    title: "Committee Formation Memo Generator",
    description: "Create and download a formal university memorandum for forming new committees, with highly specific formatting.",
    templates: [],
  },
  other_memos: {
    title: "Other Memos Generator",
    description: "Create and download various formal university memorandums with specific formatting.",
    templates: [],
  },
};

// --- Centralized Icon Mappings ---

// FIX: Replaced JSX syntax with React.createElement to avoid TS parsing errors in a .ts file.
export const HUB_ICONS: Record<string, React.ReactNode> = {
  meeting_solutions: React.createElement(MeetingIcon, { className: "w-6 h-6" }),
  disciplinary_action: React.createElement(ShieldCheckIcon, { className: "w-6 h-6" }),
  notice_letter_solutions: React.createElement(MailIcon, { className: "w-6 h-6" }),
  hr_solutions: React.createElement(HRIllustrationIcon, { className: "w-10 h-10" }),
  reports_records: React.createElement(ReportIcon, { className: "w-6 h-6" }),
  image_solutions: React.createElement(ImageIcon, { className: "w-6 h-6" }),
  eligibility_checker: React.createElement(CheckBadgeIcon, { className: "w-6 h-6" }),
  alumni_certificate: React.createElement(UsersIcon, { className: "w-6 h-6" }),
};

// For Landing Page cards (smaller icons)
// FIX: Replaced JSX syntax with React.createElement to avoid TS parsing errors in a .ts file.
const smallIcons: Record<string, React.ReactNode> = {
    agenda_generator: React.createElement(PencilSquareIcon, { className: "w-7 h-7" }),
    proceedings_generator: React.createElement(MinutesIcon, { className: "w-7 h-7" }),
    meeting_memo: React.createElement(MailIcon, { className: "w-7 h-7" }),
    committee_formation: React.createElement(CommitteeIcon, { className: "w-7 h-7" }),
    other_memos: React.createElement(PencilSquareIcon, { className: "w-7 h-7" }),
    follow_up: React.createElement(ClockIcon, { className: "w-7 h-7" }),
    show_cause: React.createElement(PencilSquareIcon, { className: "w-7 h-7" }),
    warning_letter: React.createElement(ShieldCheckIcon, { className: "w-7 h-7" }),
    suspension_order: React.createElement(LockClosedIcon, { className: "w-7 h-7" }),
    termination_letter: React.createElement(DocumentIcon, { className: "w-7 h-7" }),
    general_notice: React.createElement(MailIcon, { className: "w-7 h-7" }),
    noc: React.createElement(CheckBadgeIcon, { className: "w-7 h-7" }),
    alumni_cert: React.createElement(UsersIcon, { className: "w-7 h-7" }),
    job_description: React.createElement(BriefcaseIcon, { className: "w-7 h-7" }),
    performance_review: React.createElement(ReportIcon, { className: "w-7 h-7" }),
    leave_application: React.createElement(CalendarDaysIcon, { className: "w-7 h-7" }),
    experience_cert: React.createElement(CheckBadgeIcon, { className: "w-7 h-7" }),
    annual_report: React.createElement(ReportIcon, { className: "w-7 h-7" }),
    image_editor: React.createElement(ImageIcon, { className: "w-7 h-7" }),
    eligibility_checker_tool: React.createElement(CheckBadgeIcon, { className: "w-7 h-7" }),
    default: React.createElement(DocumentIcon, { className: "w-7 h-7" }),
};

// For Hub Page cards (larger icons)
// FIX: Replaced JSX syntax with React.createElement to avoid TS parsing errors in a .ts file.
const largeIcons: Record<string, React.ReactNode> = {
    agenda_generator: React.createElement(PencilSquareIcon, { className: "w-8 h-8" }),
    proceedings_generator: React.createElement(MinutesIcon, { className: "w-8 h-8" }),
    meeting_memo: React.createElement(MailIcon, { className: "w-8 h-8" }),
    committee_formation: React.createElement(CommitteeIcon, { className: "w-8 h-8" }),
    other_memos: React.createElement(PencilSquareIcon, { className: "w-8 h-8" }),
    follow_up: React.createElement(ClockIcon, { className: "w-8 h-8" }),
    show_cause: React.createElement(PencilSquareIcon, { className: "w-8 h-8" }),
    warning_letter: React.createElement(ShieldCheckIcon, { className: "w-8 h-8" }),
    suspension_order: React.createElement(LockClosedIcon, { className: "w-8 h-8" }),
    termination_letter: React.createElement(DocumentIcon, { className: "w-8 h-8" }),
    general_notice: React.createElement(MailIcon, { className: "w-8 h-8" }),
    noc: React.createElement(CheckBadgeIcon, { className: "w-8 h-8" }),
    alumni_cert: React.createElement(UsersIcon, { className: "w-8 h-8" }),
    job_description: React.createElement(BriefcaseIcon, { className: "w-8 h-8" }),
    performance_review: React.createElement(ReportIcon, { className: "w-8 h-8" }),
    leave_application: React.createElement(CalendarDaysIcon, { className: "w-8 h-8" }),
    experience_cert: React.createElement(CheckBadgeIcon, { className: "w-8 h-8" }),
    annual_report: React.createElement(ReportIcon, { className: "w-8 h-8" }),
    image_editor: React.createElement(ImageIcon, { className: "w-8 h-8" }),
    eligibility_checker_tool: React.createElement(CheckBadgeIcon, { className: "w-8 h-8" }),
    default: React.createElement(DocumentIcon, { className: "w-8 h-8" }),
};

export const getHubIcon = (hubId: string): React.ReactNode => {
    // FIX: Replaced JSX syntax with React.createElement to avoid TS parsing errors in a .ts file.
    return HUB_ICONS[hubId] || React.createElement(BriefcaseIcon, { className: "w-6 h-6" });
};

export const getSmallGeneratorIcon = (page: string): React.ReactNode => {
    return smallIcons[page] || smallIcons.default;
};

export const getLargeGeneratorIcon = (page: string): React.ReactNode => {
    return largeIcons[page] || largeIcons.default;
};
