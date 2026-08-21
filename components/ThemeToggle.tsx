"use client";

import { IoMoonOutline, IoSunnyOutline } from "react-icons/io5";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const toggle = () => {
    const isDark = document.documentElement.classList.toggle("dark");
    try {
      localStorage.setItem("theme", isDark ? "dark" : "light");
    } catch {
      /* storage unavailable */
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
      className={`btn btn-ghost p-2 cursor-pointer ${className}`}
    >
      <IoMoonOutline className="text-xl dark:hidden" />
      <IoSunnyOutline className="hidden text-xl dark:inline" />
    </button>
  );
}
