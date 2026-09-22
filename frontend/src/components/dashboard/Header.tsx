import { useTranslation } from 'react-i18next';
import { useTheme } from '../ThemeProvider';

interface HeaderProps {
  activeNav: string;
  onNavChange: (nav: string) => void;
}

const Header = ({ activeNav, onNavChange }: HeaderProps) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  return (
    <header className="h-16 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex items-center px-6">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[var(--color-primary)] rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-xl">P</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex items-center gap-6 ml-12">
        <button
          onClick={() => onNavChange('analytics')}
          className={`text-sm transition-colors ${
            activeNav === 'analytics'
              ? 'text-[var(--color-text)]'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
          }`}
        >
          Analytics
        </button>
        <button
          onClick={() => onNavChange('my-plant')}
          className={`text-sm flex items-center gap-2 transition-colors ${
            activeNav === 'my-plant'
              ? 'text-[var(--color-text)]'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
          }`}
        >
          {activeNav === 'my-plant' && (
            <span className="w-2 h-2 bg-[var(--color-success)] rounded-full"></span>
          )}
          My Plant
        </button>
      </nav>

      {/* Search */}
      <div className="flex-1 mx-12">
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Search..."
            className="w-full h-10 pl-10 pr-4 bg-[var(--color-surface-hover)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-secondary)] to-[var(--color-primary)] flex items-center justify-center">
        <span className="text-white font-semibold">JD</span>
      </div>
    </header>
  );
};

export default Header;
