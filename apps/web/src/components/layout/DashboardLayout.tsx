import { useState, type ReactNode } from "react";

import { DashboardHeader } from "./DashboardHeader.js";
import { Sidebar } from "./Sidebar.js";

type DashboardLayoutProps = {
  children: ReactNode;
  lastUpdatedAt: string | null;
  onRefresh: () => void;
  refreshing: boolean;
};

export const DashboardLayout = ({
  children,
  lastUpdatedAt,
  onRefresh,
  refreshing,
}: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="app-frame">
        <DashboardHeader
          lastUpdatedAt={lastUpdatedAt}
          onRefresh={onRefresh}
          refreshing={refreshing}
          onMenuToggle={() => setSidebarOpen(true)}
        />
        <main className="app-main">{children}</main>
      </div>
    </div>
  );
};
