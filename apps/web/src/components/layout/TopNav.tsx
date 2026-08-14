import { NavLink } from "react-router-dom";

type TopNavProps = {
  operational?: boolean;
  menuOpen: boolean;
  onMenuToggle: () => void;
  onMenuClose: () => void;
};

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/monitors", label: "Monitores" },
  { to: "/incidents", label: "Incidentes" },
  { to: "/alerts", label: "Alertas" },
  { to: "/settings", label: "Configurações" },
];

export const TopNav = ({
  operational = true,
  menuOpen,
  onMenuToggle,
  onMenuClose,
}: TopNavProps) => {
  return (
    <>
      <button
        type="button"
        className={`topnav-backdrop${menuOpen ? " topnav-backdrop--visible" : ""}`}
        aria-label="Fechar menu"
        onClick={onMenuClose}
      />
      <header className="topnav">
        <div className="topnav__inner">
          <div className="topnav__start">
            <NavLink to="/" className="topnav__brand" onClick={onMenuClose}>
              <span className="topnav__logo" aria-hidden="true">
                AM
              </span>
              <span className="topnav__product">API Monitor</span>
            </NavLink>
            <button
              type="button"
              className="topnav__menu-toggle"
              aria-label="Abrir menu"
              aria-expanded={menuOpen}
              onClick={onMenuToggle}
            >
              <span aria-hidden="true" />
              <span aria-hidden="true" />
              <span aria-hidden="true" />
            </button>
          </div>

          <nav
            className={`topnav__links${menuOpen ? " topnav__links--open" : ""}`}
            aria-label="Navegação principal"
          >
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                {...(item.end ? { end: true } : {})}
                className={({ isActive }) =>
                  `topnav__link${isActive ? " topnav__link--active" : ""}`
                }
                onClick={onMenuClose}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="topnav__status">
            <span
              className={`topnav__status-dot topnav__status-dot--${operational ? "ok" : "down"}`}
              aria-hidden="true"
            />
            <span className="topnav__status-text">
              {operational ? "Operational" : "Degraded"}
            </span>
          </div>
        </div>
      </header>
    </>
  );
};
