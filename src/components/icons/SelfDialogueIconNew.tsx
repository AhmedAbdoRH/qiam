import React from 'react';
import { LucideProps } from 'lucide-react';

export const SelfDialogueIconNew = ({ className, ...props }: LucideProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="white"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Brain silhouette - represents inner dialogue */}
      <path 
        d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h2v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7z" 
        fill="white" 
        fillOpacity="0.9"
      />
      
      {/* Inner thought patterns - represents self-reflection */}
      <circle cx="9" cy="9" r="1.5" fill="rgba(0,0,0,0.2)" />
      <circle cx="15" cy="9" r="1.5" fill="rgba(0,0,0,0.2)" />
      <circle cx="12" cy="13" r="1.5" fill="rgba(0,0,0,0.2)" />
      
      {/* Connecting lines - represents dialogue flow */}
      <path d="M9 9 L12 13" stroke="rgba(0,0,0,0.3)" strokeWidth="1" />
      <path d="M15 9 L12 13" stroke="rgba(0,0,0,0.3)" strokeWidth="1" />
      
      {/* Small dots - represents thoughts */}
      <circle cx="8" cy="7" r="0.5" />
      <circle cx="16" cy="7" r="0.5" />
      <circle cx="12" cy="16" r="0.5" />
    </svg>
  );
};
