"use client";

import { FC } from "react";
import { useTheme } from "next-themes";
import { Switch, SwitchProps } from "@nextui-org/switch";
import { SunFilledIcon, MoonFilledIcon } from "@/components/icons";

export interface ThemeSwitchProps {
  className?: string;
  classNames?: SwitchProps["classNames"];
}

export const ThemeSwitcher: FC<ThemeSwitchProps> = ({
  className,
  classNames,
}) => {
  const { theme, setTheme } = useTheme();

  const isDarkMode = theme === "dark";

  const onChange = () => {
    setTheme(isDarkMode ? "light" : "dark");
  };

  return (
    <Switch
      isSelected={isDarkMode}
      aria-label={`Switch to ${isDarkMode ? "light" : "dark"} mode`}
      onChange={onChange}
      size="md"
      className={`${className} md:block hidden`}
      color="primary"
      classNames={{
        thumb: isDarkMode ? "bg-white" : "bg-black", // Keep the thumb white in dark mode, black in light mode
      }}
      startContent={<SunFilledIcon size={15} />}
      endContent={<MoonFilledIcon size={15} />}
    />
  );
};
