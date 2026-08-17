import { useEffect, useId, useRef, useState } from "react";

import type { MonitorWithStatus } from "../../types/api.js";

type MonitorActionsMenuProps = {
  monitor: MonitorWithStatus;
  onViewDetails: (monitorId: string) => void;
  onEdit: (monitor: MonitorWithStatus) => void;
  onTogglePause: (monitorId: string) => void;
  onDelete: (monitorId: string) => void;
};

export const MonitorActionsMenu = ({
  monitor,
  onViewDetails,
  onEdit,
  onTogglePause,
  onDelete,
}: MonitorActionsMenuProps) => {
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const closeMenu = () => setOpen(false);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(monitor.url);
    } catch {
      // Ignore clipboard failures silently.
    }
    closeMenu();
  };

  const handleDelete = () => {
    closeMenu();
    const confirmed = window.confirm(
      `Excluir "${monitor.name}"? Esta ação não pode ser desfeita.`,
    );

    if (confirmed) {
      onDelete(monitor.id);
    }
  };

  return (
    <div className="table-actions__menu" ref={containerRef}>
      <button
        type="button"
        className="table-actions__button table-actions__button--menu"
        title="Mais opções"
        aria-label={`Mais opções de ${monitor.name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
      >
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <circle cx="10" cy="5" r="1.2" fill="currentColor" />
          <circle cx="10" cy="10" r="1.2" fill="currentColor" />
          <circle cx="10" cy="15" r="1.2" fill="currentColor" />
        </svg>
      </button>

      {open ? (
        <div
          id={menuId}
          className="table-actions__dropdown"
          role="menu"
          aria-label={`Ações de ${monitor.name}`}
        >
          <button
            type="button"
            role="menuitem"
            className="table-actions__dropdown-item"
            onClick={() => {
              closeMenu();
              onViewDetails(monitor.id);
            }}
          >
            Ver detalhes
          </button>
          <button
            type="button"
            role="menuitem"
            className="table-actions__dropdown-item"
            onClick={() => {
              closeMenu();
              onEdit(monitor);
            }}
          >
            Editar
          </button>
          <button
            type="button"
            role="menuitem"
            className="table-actions__dropdown-item"
            onClick={() => {
              closeMenu();
              void handleCopyUrl();
            }}
          >
            Copiar URL
          </button>
          <button
            type="button"
            role="menuitem"
            className="table-actions__dropdown-item"
            onClick={() => {
              closeMenu();
              onTogglePause(monitor.id);
            }}
          >
            {monitor.paused ? "Retomar monitoramento" : "Pausar monitoramento"}
          </button>
          <button
            type="button"
            role="menuitem"
            className="table-actions__dropdown-item table-actions__dropdown-item--danger"
            onClick={handleDelete}
          >
            Excluir API
          </button>
        </div>
      ) : null}
    </div>
  );
};
