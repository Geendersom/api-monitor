import { NavLink } from "react-router-dom";

type SidebarProps = {
  open: boolean;
  onClose: () => void;
};

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/", label: "Monitores", end: false },
  { to: "/", label: "Incidentes", end: false },
  { to: "/", label: "Alertas", end: false },
  { to: "/", label: "Configurações", end: false },
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
            <NavLink
              key={item.label}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `sidebar__link${isActive && item.end ? " sidebar__link--active" : " sidebar__link--muted"}`
              }
              onClick={onClose}
            >
              {item.label}
            </NavLink>
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
