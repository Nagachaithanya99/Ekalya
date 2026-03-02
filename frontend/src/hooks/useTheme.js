import { useEffect, useState } from "react";

const KEY = "lp_theme"; // saved in localStorage
const THEMES = ["dark", "midnight"]; // both are dark styles

export default function useTheme() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem(KEY);
    return THEMES.includes(saved) ? saved : "dark";
  });

  useEffect(() => {
    // apply to <html>
    const html = document.documentElement;
    if (theme === "dark") html.removeAttribute("data-theme");
    else html.setAttribute("data-theme", theme);

    localStorage.setItem(KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((t) => (t === "dark" ? "midnight" : "dark"));
  };

  return { theme, setTheme, toggleTheme };
}
