
import React from "react";

interface LocationPinIconProps {
  className?: string;
}

const LocationPinIcon: React.FC<LocationPinIconProps> = ({
  className = "h-6 w-6",
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.152-.722c1.102-.74 2.499-1.856 3.635-3.456 1.137-1.6 1.832-3.41 1.832-5.212 0-4.72-3.8-8.502-8.514-8.502-4.714 0-8.514 3.782-8.514 8.502 0 1.802.695 3.612 1.832 5.212 1.136 1.6 2.533 2.716 3.635 3.456a16.977 16.977 0 001.152.722zM12.75 12a.75.75 0 01-.75.75 2.25 2.25 0 110-4.5.75.75 0 01.75.75v3z"
        clipRule="evenodd"
      />
    </svg>
  );
};

export default LocationPinIcon;