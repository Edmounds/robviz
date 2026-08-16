import { Minus, Plus, X } from "lucide-react";
import { useId, useState } from "react";
import type { ReactNode } from "react";

import { useI18n } from "./i18n";

export function CollapsiblePanel({
  title,
  header,
  children,
  defaultCollapsed = false,
  onClose,
}: {
  title: string;
  header: ReactNode;
  children: ReactNode;
  defaultCollapsed?: boolean;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const contentId = useId();
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const actionLabel = t(collapsed ? "expandPanel" : "collapsePanel", { name: title });

  return (
    <div className={`panel ${collapsed ? "is-collapsed" : ""}`}>
      <div className="panel-header">
        {collapsed ? <span className="panel-title">{title}</span> : header}
        <span className="spacer" />
        <button
          className="panel-collapse"
          type="button"
          aria-controls={contentId}
          aria-expanded={!collapsed}
          aria-label={actionLabel}
          title={actionLabel}
          onClick={() => setCollapsed((current) => !current)}
        >
          {collapsed ? <Plus /> : <Minus />}
        </button>
        <button
          className="panel-close"
          type="button"
          onClick={onClose}
          title={t("closePanel")}
          aria-label={t("closePanel")}
        >
          <X />
        </button>
      </div>
      <div id={contentId} className="panel-content" hidden={collapsed}>
        {children}
      </div>
    </div>
  );
}
