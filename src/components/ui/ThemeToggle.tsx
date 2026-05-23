import { Sun, Moon } from 'lucide-react';

interface Props {
  isDark: boolean;
  onToggle: () => void;
}

export default function ThemeToggle({ isDark, onToggle }: Props) {
  return (
    <button
      onClick={onToggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300
        text-[var(--text-secondary)] hover:bg-[var(--gold)]/10 hover:text-[var(--gold)]
        active:scale-95"
    >
      {isDark ? (
        <Sun size={18} strokeWidth={2} className="transition-transform duration-300 rotate-0" />
      ) : (
        <Moon size={18} strokeWidth={2} className="transition-transform duration-300 rotate-0" />
      )}
    </button>
  );
}
