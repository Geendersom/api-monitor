import { useState, type ReactNode } from "react";

import { Sidebar } from "./Sidebar.js";

type AppLayoutProps = {
  children: ReactNode;
  header: (controls: { onMenuToggle: () => void }) => ReactNode;
};

export const AppLayout = ({ children, header }: AppLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="app-frame">
        {header({ onMenuToggle: () => setSidebarOpen(true) })}
        <main className="app-main">{children}</main>
      </div>
    </div>
  );
};
