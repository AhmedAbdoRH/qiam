import React from 'react';
import { LucideProps } from 'lucide-react';

export const SelfDialogueIcon = ({ className, ...props }: LucideProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Outer speech bubble - represents "me" */}
      <path 
        d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" 
        fill="rgba(59, 130, 246, 0.2)" 
        stroke="rgb(59, 130, 246)"
      />
      
      {/* Inner speech bubble - represents "myself" */}
      <path 
        d="M15 10a2 2 0 0 1-2 2H5l-2 2V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2z" 
        fill="rgba(236, 72, 153, 0.2)" 
        stroke="rgb(236, 72, 153)"
        transform="translate(4, 3)"
      />
      
      {/* Heart symbol in center - represents self-love/dialogue */}
      <path 
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" 
        fill="rgba(236, 72, 153, 0.3)" 
        stroke="rgb(236, 72, 153)"
        transform="translate(0, -2) scale(0.4)"
      />
      
      {/* Connecting dots - represents dialogue flow */}
      <circle cx="8" cy="12" r="1" fill="rgb(59, 130, 246)" opacity="0.8" />
      <circle cx="12" cy="12" r="1" fill="rgb(147, 51, 234)" opacity="0.8" />
      <circle cx="16" cy="12" r="1" fill="rgb(236, 72, 153)" opacity="0.8" />
    </svg>
  );
};

export const SelfDialogueIconWhite = ({ className, ...props }: LucideProps) => {
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
      {/* Outer speech bubble - represents "me" */}
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      
      {/* Inner speech bubble - represents "myself" */}
      <path 
        d="M15 10a2 2 0 0 1-2 2H5l-2 2V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2z" 
        transform="translate(4, 3)"
      />
      
      {/* Heart symbol in center - represents self-love/dialogue */}
      <path 
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" 
        transform="translate(0, -2) scale(0.4)"
      />
      
      {/* Connecting dots - represents dialogue flow */}
      <circle cx="8" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="16" cy="12" r="1" />
    </svg>
  );
};
