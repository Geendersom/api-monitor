import type { ReactNode } from "react";

type DashboardLayoutProps = {
  children: ReactNode;
};

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__content">
          <div>
            <p className="app-header__eyebrow">API Monitor</p>
            <h1 className="app-header__title">Dashboard</h1>
          </div>
          <p className="app-header__subtitle">
            Visão consolidada de monitores, incidentes e alertas.
          </p>
        </div>
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
};
