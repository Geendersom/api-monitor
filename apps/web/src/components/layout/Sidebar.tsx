type SidebarProps = {
  open: boolean;
  onClose: () => void;
};

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", active: true },
  { id: "monitors", label: "Monitores", active: false },
  { id: "incidents", label: "Incidentes", active: false },
  { id: "alerts", label: "Alertas", active: false },
  { id: "settings", label: "Configurações", active: false },
];

export const Sidebar = ({ open, onClose }: SidebarProps) => {
  return (
    <>
      <button
        type="button"
        className={`sidebar-backdrop${open ? " sidebar-backdrop--visible" : ""}`}
        aria-label="Fechar menu"
        onClick={onClose}
      />
      <aside
        className={`sidebar${open ? " sidebar--open" : ""}`}
        aria-label="Navegação principal"
      >
        <div className="sidebar__brand">
          <span className="sidebar__logo" aria-hidden="true">
            AM
          </span>
          <div>
            <p className="sidebar__product">API Monitor</p>
            <p className="sidebar__tagline">Uptime &amp; health</p>
          </div>
        </div>

        <nav className="sidebar__nav">
          {NAV_ITEMS.map((item) => (
            <span
              key={item.id}
              className={`sidebar__link${item.active ? " sidebar__link--active" : " sidebar__link--muted"}`}
              aria-current={item.active ? "page" : undefined}
            >
              {item.label}
            </span>
          ))}
        </nav>

        <div className="sidebar__footer">
          <p className="sidebar__footer-label">Sistema</p>
          <p className="sidebar__footer-value">API Monitor v1</p>
          <p className="sidebar__footer-meta">Dashboard operacional</p>
        </div>
      </aside>
    </>
  );
};
