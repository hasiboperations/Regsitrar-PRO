
import React from 'react';

const HRIllustrationIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    {/* Abstract Background Circle */}
    <circle cx="50" cy="50" r="48" fill="#EFF6FF" />
    
    {/* Background Elements */}
    <path d="M75 25 L85 25 L85 35" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round"/>
    <path d="M15 75 L15 85 L25 85" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round"/>
    
    {/* Team Members (Right Background) */}
    <circle cx="80" cy="55" r="6" fill="#F87171" opacity="0.8"/>
    <path d="M74 70 C74 62 86 62 86 70" fill="#F87171" opacity="0.8"/>
    
    <circle cx="20" cy="55" r="6" fill="#34D399" opacity="0.8"/>
    <path d="M14 70 C14 62 26 62 26 70" fill="#34D399" opacity="0.8"/>

    {/* Main Figure (Man in Suit) */}
    <path d="M50 78 C35 78 30 100 30 100 H70 C70 100 65 78 50 78 Z" fill="#1E40AF"/> {/* Suit */}
    <path d="M50 78 V100" stroke="#172554" strokeWidth="1"/>
    <path d="M50 78 L45 85 M50 78 L55 85" stroke="white" strokeWidth="2"/> {/* Collar */}
    <path d="M50 85 L50 95" stroke="#60A5FA" strokeWidth="2"/> {/* Tie */}
    <circle cx="50" cy="65" r="10" fill="#FDBA74"/> {/* Head */}
    <path d="M45 58 C45 55 55 55 55 58" fill="#1E293B"/> {/* Hair */}

    {/* Shield (Left Foreground) */}
    <path d="M25 40 C25 40 45 40 45 50 C45 65 35 75 35 75 C35 75 25 65 25 50 V40 Z" fill="#3B82F6"/>
    <path d="M30 52 L34 56 L40 48" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    
    {/* Gear/Settings (Top Right) */}
    <circle cx="75" cy="30" r="5" stroke="#64748B" strokeWidth="2" strokeDasharray="2 2"/>
  </svg>
);

export default HRIllustrationIcon;
