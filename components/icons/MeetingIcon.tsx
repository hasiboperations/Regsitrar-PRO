import React from 'react';

const MeetingIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    {/* Table */}
    <circle cx="12" cy="12" r="5" opacity="0.4" />
    
    {/* People (5 around table) */}
    {/* Top */}
    <circle cx="12" cy="4" r="2" />
    {/* Top Right */}
    <circle cx="19.6" cy="9.6" r="2" />
    {/* Bottom Right */}
    <circle cx="16.7" cy="18.4" r="2" />
    {/* Bottom Left */}
    <circle cx="7.3" cy="18.4" r="2" />
    {/* Top Left */}
    <circle cx="4.4" cy="9.6" r="2" />
  </svg>
);

export default MeetingIcon;