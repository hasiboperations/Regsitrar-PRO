import React from 'react';

const HeroIllustration: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
            <linearGradient id="hero-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#4338CA', stopOpacity: 0.8 }} />
                <stop offset="100%" style={{ stopColor: '#14B8A6', stopOpacity: 0.9 }} />
            </linearGradient>
            <linearGradient id="hero-grad-2" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#6D28D9', stopOpacity: 0.7 }} />
                <stop offset="100%" style={{ stopColor: '#EC4899', stopOpacity: 0.8 }} />
            </linearGradient>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="5" result="coloredBlur" />
                <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
        </defs>
        
        {/* Abstract shapes */}
        <path d="M50 150 Q100 50, 200 100 T350 120" stroke="url(#hero-grad-1)" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.8" />
        <path d="M30 250 Q150 280, 250 200 T380 220" stroke="url(#hero-grad-2)" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.7" />
        
        {/* Floating elements */}
        <g transform="translate(80 80)">
            <rect x="0" y="0" width="100" height="120" rx="10" fill="url(#hero-grad-1)" fillOpacity="0.2" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.5"/>
            <text x="10" y="25" fontFamily="monospace" fontSize="12" fill="white" opacity="0.7">const memo =</text>
            <text x="15" y="45" fontFamily="monospace" fontSize="12" fill="white" opacity="0.7">{`{`}</text>
            <text x="25" y="65" fontFamily="monospace" fontSize="12" fill="white" opacity="0.7">subject: '...',</text>
            <text x="25" y="85" fontFamily="monospace" fontSize="12" fill="white" opacity="0.7">to: '...',</text>
            <text x="15" y="105" fontFamily="monospace" fontSize="12" fill="white" opacity="0.7">{`}`}</text>
        </g>
        
        <g transform="translate(240 160)">
            <circle cx="30" cy="30" r="40" fill="url(#hero-grad-2)" fillOpacity="0.3" filter="url(#glow)" />
            <path d="M10 30 L30 50 L50 20" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
        
        {/* Background glow */}
        <circle cx="300" cy="80" r="80" fill="#14B8A6" opacity="0.1" filter="url(#glow)" />
        <circle cx="100" cy="220" r="60" fill="#4338CA" opacity="0.1" filter="url(#glow)" />
    </svg>
);

export default HeroIllustration;