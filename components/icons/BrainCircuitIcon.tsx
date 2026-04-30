
import React from 'react';

const BrainCircuitIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M30 12c-6 0-12 4-12 12 0 0-10 4-10 12 0 10 8 12 8 12s-4 12 14 12c0 0 0-48 0-48z" />
    <path d="M34 12c6 0 12 4 12 12 0 0 10 4 10 12 0 10-8 12-8 12s4 12-14 12c0 0 0-48 0-48z" />
    <line x1="34" y1="26" x2="46" y2="26" />
    <circle cx="46" cy="26" r="3" fill="currentColor" stroke="none" />
    <line x1="34" y1="40" x2="42" y2="40" />
    <circle cx="42" cy="40" r="3" fill="currentColor" stroke="none" />
    <line x1="30" y1="32" x2="18" y2="32" />
    <circle cx="18" cy="32" r="3" fill="currentColor" stroke="none" />
    <line x1="32" y1="12" x2="32" y2="52" strokeWidth="3" />
  </svg>
);

export default BrainCircuitIcon;
