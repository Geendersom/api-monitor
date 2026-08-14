import { useState, type ReactNode } from "react";

import { MockDataBanner } from "../ui/MockDataBanner.js";
import { PageHeader } from "./PageHeader.js";
import { TopNav } from "./TopNav.js";

type AppLayoutProps = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  lastUpdatedAt?: string | null;
  downMonitors?: number;
  onRefresh?: () => void;
  refreshing?: boolean;
  operational?: boolean;
  isMock?: boolean;
  headerContent?: ReactNode;
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
  isMock = false,
  headerContent,
}: AppLayoutProps) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="app-shell">
      <TopNav
        operational={operational}
        menuOpen={menuOpen}
        onMenuToggle={() => setMenuOpen(true)}
        onMenuClose={() => setMenuOpen(false)}
      />
      <div className="app-frame">
        {headerContent ??
          (title ? (
            <PageHeader
              title={title}
              {...(subtitle ? { subtitle } : {})}
              {...(lastUpdatedAt ? { lastUpdatedAt } : {})}
              {...(downMonitors !== undefined ? { downMonitors } : {})}
              {...(onRefresh ? { onRefresh, refreshing } : {})}
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
