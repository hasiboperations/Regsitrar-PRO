import React from 'react';

const AboutIllustration: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 500 400" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
            <linearGradient id="about-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#4f46e5' }} />
                <stop offset="100%" style={{ stopColor: '#14b8a6' }} />
            </linearGradient>
             <linearGradient id="about-grad-2" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#3b82f6' }} />
                <stop offset="100%" style={{ stopColor: '#8b5cf6' }} />
            </linearGradient>
            <filter id="about-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="10" result="coloredBlur" />
                <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
        </defs>

        {/* Background shapes */}
        <circle cx="150" cy="150" r="150" fill="url(#about-grad-1)" opacity="0.1" filter="url(#about-glow)" />
        <circle cx="350" cy="250" r="120" fill="url(#about-grad-2)" opacity="0.15" filter="url(#about-glow)" />

        {/* Central "M" shape for "Move" */}
        <path d="M100 250 L150 150 L200 250 L250 150 L300 250" stroke="url(#about-grad-1)" strokeWidth="12" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.8">
            <animate attributeName="stroke-dasharray" values="0 1000;1000 0" dur="3s" repeatCount="indefinite" />
        </path>
        
        {/* Branching path for "Act" and "Decide" */}
        <g>
            <path d="M300 250 Q350 200, 400 220" stroke="url(#about-grad-2)" strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray="10 15">
                 <animate attributeName="stroke-dashoffset" from="0" to="25" dur="1s" repeatCount="indefinite" />
            </path>
            <path d="M300 150 Q360 120, 420 130" stroke="url(#about-grad-2)" strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray="10 15">
                 <animate attributeName="stroke-dashoffset" from="0" to="-25" dur="1s" repeatCount="indefinite" />
            </path>
        </g>

        {/* Floating circles representing "Gen" (generation) */}
        <circle cx="400" cy="220" r="10" fill="#14b8a6">
             <animate attributeName="r" values="5;12;5" dur="2s" repeatCount="indefinite" />
        </circle>
         <circle cx="420" cy="130" r="10" fill="#4f46e5">
             <animate attributeName="r" values="5;12;5" dur="2s" begin="1s" repeatCount="indefinite" />
        </circle>
    </svg>
);

export default AboutIllustration;
