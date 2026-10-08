import React, { useState } from 'react';

interface BrandLogoProps {
  className?: string;
  roundedClassName?: string;
  onClick?: () => void;
  title?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ 
  className = "w-10 h-10",
  roundedClassName = "rounded-xl",
  onClick,
  title
}) => {
  const [imgSrc, setImgSrc] = useState<string>('/apple-touch-icon.png');
  const [failedAll, setFailedAll] = useState(false);

  const handleError = () => {
    if (imgSrc === '/apple-touch-icon.png') {
      setImgSrc('/android-chrome-192x192.png');
    } else if (imgSrc === '/android-chrome-192x192.png') {
      setImgSrc('/favicon-32x32.png');
    } else {
      setFailedAll(true);
    }
  };

  const imageElement = (
    <div className={`${className} ${roundedClassName} overflow-hidden flex items-center justify-center shrink-0 ${failedAll ? 'bg-indigo-600 shadow-lg shadow-indigo-600/10' : 'bg-transparent'}`}>
      {!failedAll ? (
        <img
          src={imgSrc}
          alt="needle Logo"
          className={`w-full h-full object-contain ${roundedClassName}`}
          onError={handleError}
        />
      ) : (
        <svg className="w-3/5 h-3/5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="18.5" cy="5.5" rx="1.5" ry="1.5" />
          <path d="M17.5 6.5L4 20" strokeWidth="2.5" />
          <path d="M21 3c-1 1-1.5 2-2.5 2.5" />
        </svg>
      )}
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        title={title}
        aria-label={title || "needle Logo"}
        className="focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-xl cursor-pointer active:scale-90 transition-transform shrink-0"
      >
        {imageElement}
      </button>
    );
  }

  return imageElement;
};
