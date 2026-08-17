import { NavLink, useNavigate } from "react-router-dom";

import sidebarUserAvatar from "../../assets/sidebar-user-avatar.png";
import { clearAuthenticated } from "../../auth/session.js";

type SidebarProps = {
  open: boolean;
  operational?: boolean;
  alertCount?: number;
  onClose: () => void;
};

const NAV_ITEMS = [
  { to: "/", label: "Visão Geral", end: true },
  { to: "/monitors", label: "APIs Monitoradas" },
  { to: "/incidents", label: "Incidentes" },
  { to: "/alerts", label: "Alertas", badge: true },
  { to: "/settings", label: "Configurações" },
];

export const Sidebar = ({
  open,
  operational = true,
  alertCount = 0,
  onClose,
}: SidebarProps) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuthenticated();
    onClose();
    void navigate("/login", { replace: true });
  };

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
          <NavLink
            to="/"
            className="sidebar__brand-link"
            aria-label="Ir para Visão Geral"
            onClick={onClose}
          >
            <img
              src="/app-name.png"
              alt=""
              className="sidebar__brand-name"
              width={248}
              height={48}
            />
          </NavLink>
        </div>

        <nav className="sidebar__nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              {...(item.end ? { end: true } : {})}
              className={({ isActive }) =>
                `sidebar__link${isActive ? " sidebar__link--active" : ""}`
              }
              onClick={onClose}
            >
              <span className="sidebar__link-label">{item.label}</span>
              {item.badge && alertCount > 0 ? (
                <span className="sidebar__badge">{alertCount}</span>
              ) : null}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer">
          <button
            type="button"
            className="sidebar__user"
            onClick={handleLogout}
            aria-label="Sair da conta"
          >
            <img
              src={sidebarUserAvatar}
              alt=""
              className="sidebar__user-icon"
              width={36}
              height={36}
            />
            <div className="sidebar__user-details">
              <p className="sidebar__user-name">Administrador</p>
              <p className="sidebar__user-role">admin@moniapi.local</p>
            </div>
            <span className="sidebar__logout">Sair</span>
          </button>
          <div className="sidebar__footer-status">
            <span
              className={`sidebar__footer-dot sidebar__footer-dot--${operational ? "ok" : "down"}`}
              aria-hidden="true"
            />
            <span className="sidebar__footer-value">
              {operational ? "Sistema operacional" : "Sistema degradado"}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
