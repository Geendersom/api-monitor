import { useTheme } from "../../theme/ThemeProvider.js";

type DashboardToolbarProps = {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onAddMonitor: () => void;
};

export const DashboardToolbar = ({
  searchQuery,
  onSearchQueryChange,
  onAddMonitor,
}: DashboardToolbarProps) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="dashboard-toolbar">
      <button
        type="button"
        className="dashboard-toolbar__icon-button"
        aria-label={
          theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"
        }
        onClick={toggleTheme}
      >
        {theme === "dark" ? (
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M10 3.5a1 1 0 0 1 1 1V5a1 1 0 1 1-2 0v-.5a1 1 0 0 1 1-1Zm0 11a1 1 0 0 1 1 1v.5a1 1 0 1 1-2 0V15a1 1 0 0 1 1-1Zm6.5-5a1 1 0 0 1-1 1h-.5a1 1 0 1 1 0-2h.5a1 1 0 0 1 1 1ZM5 10a1 1 0 0 1-1 1h-.5a1 1 0 1 1 0-2H4a1 1 0 0 1 1 1Zm9.78-4.28a1 1 0 0 1 0 1.42l-.35.35a1 1 0 1 1-1.42-1.42l.35-.35a1 1 0 0 1 1.42 0ZM6.57 13.43a1 1 0 0 1 0 1.42l-.35.35a1 1 0 1 1-1.42-1.42l.35-.35a1 1 0 0 1 1.42 0Zm7.78 0a1 1 0 0 1 1.42 0l.35.35a1 1 0 0 1-1.42 1.42l-.35-.35a1 1 0 0 1 0-1.42ZM6.57 5.15a1 1 0 0 1-1.42 0l-.35.35A1 1 0 0 1 6.22 7l.35-.35a1 1 0 0 1 1.42 0ZM10 6.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z"
              fill="currentColor"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M10.9 2.5a7 7 0 1 0 4.6 12.1 5.5 5.5 0 0 1-6.5-8.6A5.5 5.5 0 0 1 10.9 2.5Z"
              fill="currentColor"
            />
          </svg>
        )}
      </button>

      <label className="dashboard-search">
        <span className="dashboard-search__icon" aria-hidden="true">
          <svg viewBox="0 0 20 20" fill="none">
            <path
              d="M9 3.5a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11Z"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            <path
              d="m14.5 14.5 3 3"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          placeholder="Buscar APIs..."
          aria-label="Buscar APIs"
        />
      </label>

      <button
        type="button"
        className="dashboard-toolbar__add-button"
        onClick={onAddMonitor}
      >
        <span aria-hidden="true">+</span>
        Adicionar API
      </button>
    </div>
  );
};
