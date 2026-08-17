import { useState, type ReactNode } from "react";

import { MockDataBanner } from "../ui/MockDataBanner.js";
import { PageHeader } from "./PageHeader.js";
import { Sidebar } from "./Sidebar.js";

type LayoutControls = {
  onMenuToggle: () => void;
};

type AppLayoutProps = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  lastUpdatedAt?: string | null;
  downMonitors?: number;
  onRefresh?: () => void;
  refreshing?: boolean;
  operational?: boolean;
  alertCount?: number;
  isMock?: boolean;
  headerActions?: ReactNode;
  headerContent?:
    | ReactNode
    | ((controls: LayoutControls) => ReactNode);
};

export const AppLayout = ({
  children,
  title,
  subtitle,
  lastUpdatedAt,
  downMonitors,
  onRefresh,
  refreshing,
  operational = true,
  alertCount,
  isMock = false,
  headerActions,
  headerContent,
}: AppLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const openSidebar = () => setSidebarOpen(true);
  const closeSidebar = () => setSidebarOpen(false);

  const resolvedHeader =
    typeof headerContent === "function"
      ? headerContent({ onMenuToggle: openSidebar })
      : headerContent;

  return (
    <div className="app-shell">
      <Sidebar
        open={sidebarOpen}
        operational={operational}
        {...(alertCount !== undefined ? { alertCount } : {})}
        onClose={closeSidebar}
      />
      <div className="app-frame">
        {resolvedHeader ??
          (title ? (
            <PageHeader
              title={title}
              {...(subtitle ? { subtitle } : {})}
              {...(lastUpdatedAt ? { lastUpdatedAt } : {})}
              {...(downMonitors !== undefined ? { downMonitors } : {})}
              {...(onRefresh ? { onRefresh, refreshing } : {})}
              {...(headerActions ? { actions: headerActions } : {})}
              onMenuToggle={openSidebar}
            />
          ) : null)}
        <main className="app-main">
          <MockDataBanner visible={isMock} />
          <div className="app-main__body">{children}</div>
        </main>
      </div>
    </div>
  );
};
