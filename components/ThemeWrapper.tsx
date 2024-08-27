"use client";

import { useTheme } from "next-themes";
import { Navbar } from "@/components/navbar";

export const ThemeWrapper = ({ children }: { children: React.ReactNode }) => {
  const { theme } = useTheme();

  return (
    <div className="h-full">
      {/* Pass the theme to the Navbar and other components */}
      <Navbar theme={theme || "light"} />
      {children}
    </div>
  );
};
