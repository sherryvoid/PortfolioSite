import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme" id="theme-toggle">
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
