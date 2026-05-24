import React from "react";

interface DirhamIconProps {
  className?: string;
  size?: number;
  color?: string;
}

export const DirhamIcon = ({ className = "", size = 16, color = "currentColor" }: DirhamIconProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: "inline-block", verticalAlign: "middle" }}
    >
      {/* Official Symbol Architecture: D with two prominent horizontal parallel strikes */}
      <path d="M6 4h6a7 7 0 0 1 0 14H6V4z" />
      <line x1="3" y1="9" x2="15" y2="9" />
      <line x1="3" y1="13" x2="15" y2="13" />
    </svg>
  );
};

export default DirhamIcon;
