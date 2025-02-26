import React from 'react';

interface WaveformIconProps {
  className?: string;
}

const WaveformIcon: React.FC<WaveformIconProps> = ({ className = "" }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M4 10L4 14" />
      <path d="M8 7L8 17" />
      <path d="M12 4L12 20" />
      <path d="M16 7L16 17" />
      <path d="M20 10L20 14" />
    </svg>
  );
};

export default WaveformIcon; 