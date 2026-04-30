
import React from 'react';

const DragVerticalIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M12 2.25a.75.75 0 01.75.75v18a.75.75 0 01-1.5 0v-18a.75.75 0 01.75-.75zM6 2.25a.75.75 0 01.75.75v18a.75.75 0 01-1.5 0v-18A.75.75 0 016 2.25zM18 2.25a.75.75 0 01.75.75v18a.75.75 0 01-1.5 0v-18a.75.75 0 01.75-.75z" clipRule="evenodd" transform="rotate(90 12 12)" />
    <path d="M7 15h2v2H7v-2zm0-4h2v2H7v-2zm0-4h2v2H7V7zm4 8h2v2h-2v-2zm0-4h2v2h-2v-2zm0-4h2v2h-2V7zm4 8h2v2h-2v-2zm0-4h2v2h-2v-2zm0-4h2v2h-2V7z" fill="currentColor" opacity="0.6"/>
  </svg>
);

const DragHandleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M8 5a1 1 0 100 2 1 1 0 000-2zm0 6a1 1 0 100 2 1 1 0 000-2zm0 6a1 1 0 100 2 1 1 0 000-2zm8-12a1 1 0 100 2 1 1 0 000-2zm0 6a1 1 0 100 2 1 1 0 000-2zm0 6a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
    </svg>
);

export default DragHandleIcon;
