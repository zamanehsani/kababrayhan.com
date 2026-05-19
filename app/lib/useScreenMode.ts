"use client";

import { useEffect, useState } from "react";

export type ScreenMode = "mobile" | "tablet" | "desktop";

function getScreenMode(width: number): ScreenMode {
  if (width >= 1024) return "desktop";
  if (width >= 768) return "tablet";
  return "mobile";
}

export function useScreenMode(): ScreenMode | null {
  const [screenMode, setScreenMode] = useState<ScreenMode | null>(null);

  useEffect(() => {
    const updateScreenMode = () => {
      setScreenMode(getScreenMode(window.innerWidth));
    };

    updateScreenMode();
    window.addEventListener("resize", updateScreenMode);

    return () => {
      window.removeEventListener("resize", updateScreenMode);
    };
  }, []);

  return screenMode;
}
