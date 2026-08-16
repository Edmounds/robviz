import { Minus, Plus } from "lucide-react";
import { useId, useState } from "react";
import type { ReactNode } from "react";

import { useI18n } from "./i18n";

export function CollapsibleSection({
  title,
  children,
  defaultCollapsed = false,
}: {
  title: string;
  children: ReactNode;
  defaultCollapsed?: boolean;
}) {
  const { t } = useI18n();
  const contentId = useId();
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const actionLabel = t(collapsed ? "expandPanel" : "collapsePanel", { name: title });

  return (
    <section className={`side-section ${collapsed ? "is-collapsed" : ""}`}>
      <div className="side-section-header">
        <h2>{title}</h2>
        <button
          className="side-section-toggle"
          type="button"
          aria-controls={contentId}
          aria-expanded={!collapsed}
          aria-label={actionLabel}
          title={actionLabel}
          onClick={() => setCollapsed((current) => !current)}
        >
          {collapsed ? <Plus /> : <Minus />}
        </button>
      </div>
      <div id={contentId} className="side-section-content" hidden={collapsed}>
        {children}
      </div>
    </section>
  );
}
