"use client";

import React, { useState } from "react";

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "right" | "top" | "bottom" | "left";
  disabled?: boolean;
  className?: string;
}

export function Tooltip({
  content,
  children,
  side = "right",
  disabled = false,
  className = "",
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  if (disabled || !content) {
    return <>{children}</>;
  }

  const sideClasses = {
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  }[side];

  return (
    <div
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          role="tooltip"
          className={`absolute ${sideClasses} z-50 whitespace-nowrap rounded bg-slate-800 px-2.5 py-1 text-xs font-medium text-white shadow-md transition-opacity duration-150 animate-in fade-in pointer-events-none`}
        >
          {content}
        </div>
      )}
    </div>
  );
}
