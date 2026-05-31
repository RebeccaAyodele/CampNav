/**
 * SearchBar Component
 *
 * Purpose:
 *   - Search input field with language toggle
 *   - Handles location search queries
 *   - Language selection for multi-lingual events
 *   - Real-time suggestions as user types
 *
 * Props:
 *   - value?: string — controlled input value
 *   - onChange?: (value: string) => void — input change callback
 *   - onLanguageChange?: (lang: string) => void — language selection callback
 *   - placeholder?: string — input placeholder text
 *   - disabled?: boolean — disable input
 *   - showLanguageToggle?: boolean — show/hide language selector
 */

interface SearchBarProps {
  value?: string;
  onChange?: (value: string) => void;
  onLanguageChange?: (lang: string) => void;
  placeholder?: string;
  disabled?: boolean;
  showLanguageToggle?: boolean;
  currentLanguage?: string;
  supportedLanguages?: string[];
}

export default function SearchBar({
  value = "",
  onChange,
  onLanguageChange,
  placeholder = "Search locations...",
  disabled = false,
  showLanguageToggle = true,
  currentLanguage = "EN",
  supportedLanguages = ["EN", "ES", "FR"],
}: SearchBarProps): JSX.Element {
  return (
    <div className="w-full flex gap-2 items-center bg-white p-3 border-b border-border shadow-sm">
      {/* Search Input */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 rounded-lg border border-border bg-surface px-4 py-2 text-sm placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-500 disabled:opacity-50"
      />

      {/* Language Toggle */}
      {showLanguageToggle && (
        <div className="flex gap-1">
          {supportedLanguages.map((lang) => (
            <button
              key={lang}
              onClick={() => onLanguageChange?.(lang)}
              disabled={disabled}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                currentLanguage === lang
                  ? "bg-accent-500 text-white"
                  : "border border-border bg-surface text-primary-900 hover:bg-white"
              } disabled:opacity-50`}
            >
              {lang}
            </button>
          ))}
        </div>
      )}

      {/* TODO: Implement real-time search suggestions */}
      {/* TODO: Connect to location database */}
      {/* TODO: Handle autocomplete dropdown */}
    </div>
  );
}
