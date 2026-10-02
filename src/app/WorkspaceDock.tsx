import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import {
  DockviewReact,
  type DockviewApi,
  type IDockviewHeaderActionsProps,
  type DockviewReadyEvent,
  type IDockviewPanelProps,
  type SerializedDockview,
  themeAbyss,
  themeLight,
} from "dockview-react";
import "dockview-react/dist/styles/dockview.css";

import type { WorkspacePanel } from "../core/workspacePanels";

interface PanelParams {
  panelId: string;
  kind: string;
  [key: string]: unknown;
}

interface WorkspaceDockProps {
  panels: WorkspacePanel[];
  layout?: unknown;
  theme: "dark" | "light";
  titleForKind: (kind: string) => string;
  renderPanel: (panel: WorkspacePanel) => ReactNode;
  onPanelClosed: (id: string) => void;
  onLayoutChange: (layout: SerializedDockview) => void;
  onInvalidLayout?: () => void;
  maximizeLabel: string;
  restoreLabel: string;
}

const RenderPanelContext = createContext<WorkspaceDockProps["renderPanel"] | undefined>(undefined);
const HeaderLabelsContext = createContext({ maximize: "Maximize panel", restore: "Restore panel" });
const PANEL_MINIMUM_HEIGHT = 30;
const PANEL_MINIMUM_WIDTH = 30;

function WorkspaceDockPanel({ params }: IDockviewPanelProps<PanelParams>) {
  const renderPanel = useContext(RenderPanelContext);
  if (!renderPanel) return null;
  return renderPanel({ id: params.panelId, kind: params.kind });
}

function WorkspaceHeaderActions({ api, containerApi }: IDockviewHeaderActionsProps) {
  const labels = useContext(HeaderLabelsContext);
  const [maximized, setMaximized] = useState(api.isMaximized());

  useEffect(() => {
    const disposable = containerApi.onDidMaximizedGroupChange(() => {
      setMaximized(api.isMaximized());
    });
    return () => disposable.dispose();
  }, [api, containerApi]);

  return (
    <button
      type="button"
      className="dock-maximize-action"
      title={maximized ? labels.restore : labels.maximize}
      aria-label={maximized ? labels.restore : labels.maximize}
      onClick={(event) => {
        event.stopPropagation();
        if (maximized) api.exitMaximized();
        else api.maximize();
      }}
    >
      {maximized ? <Minimize2 /> : <Maximize2 />}
    </button>
  );
}

function addPanel(
  api: DockviewApi,
  panel: WorkspacePanel,
  title: string,
  position?: Parameters<DockviewApi["addPanel"]>[0]["position"],
): void {
  const added = api.addPanel<PanelParams>({
    id: panel.id,
    component: "workspace-panel",
    title,
    params: { panelId: panel.id, kind: panel.kind },
    renderer: "always",
    floating: false,
    minimumHeight: PANEL_MINIMUM_HEIGHT,
    minimumWidth: PANEL_MINIMUM_WIDTH,
    ...(position ? { position } : {}),
  });
  added.api.group.api.setConstraints({
    minimumHeight: PANEL_MINIMUM_HEIGHT,
    minimumWidth: PANEL_MINIMUM_WIDTH,
  });
}

function buildDefaultLayout(
  api: DockviewApi,
  panels: WorkspacePanel[],
  titleForKind: (kind: string) => string,
): void {
  const byKind = new Map(panels.map((panel) => [panel.kind, panel]));
  const threeD = byKind.get("3d");
  const topics = byKind.get("topics");
  const utilityKinds = ["echo", "services", "tf-tree"];

  if (threeD) addPanel(api, threeD, titleForKind(threeD.kind));
  if (topics) {
    addPanel(
      api,
      topics,
      titleForKind(topics.kind),
      threeD ? { referencePanel: threeD.id, direction: "right" } : undefined,
    );
  }

  let utilityReference: WorkspacePanel | undefined;
  for (const kind of utilityKinds) {
    const panel = byKind.get(kind);
    if (!panel) continue;
    addPanel(
      api,
      panel,
      titleForKind(kind),
      utilityReference
        ? { referencePanel: utilityReference.id }
        : topics
          ? { referencePanel: topics.id, direction: "below" }
          : threeD
            ? { referencePanel: threeD.id, direction: "right" }
            : undefined,
    );
    utilityReference = panel;
  }

  const placed = new Set(api.panels.map((panel) => panel.id));
  let dynamicReference = threeD?.id ?? api.activePanel?.id;
  for (const panel of panels) {
    if (placed.has(panel.id)) continue;
    addPanel(
      api,
      panel,
      titleForKind(panel.kind),
      dynamicReference
        ? { referencePanel: dynamicReference, direction: dynamicReference === threeD?.id ? "below" : "right" }
        : undefined,
    );
    dynamicReference = panel.id;
  }
}

function positionForAddedPanel(api: DockviewApi, panel: WorkspacePanel) {
  if (panel.kind.startsWith("plugin-section:")) {
    const utility = ["tf-tree", "services", "echo"]
      .map((id) => api.getPanel(id))
      .find((candidate) => candidate !== undefined);
    if (utility) return { referencePanel: utility } as const;
  }
  const active = api.activePanel;
  return active ? { referencePanel: active, direction: "right" as const } : undefined;
}

export function WorkspaceDock({
  panels,
  layout,
  theme,
  titleForKind,
  renderPanel,
  onPanelClosed,
  onLayoutChange,
  onInvalidLayout,
  maximizeLabel,
  restoreLabel,
}: WorkspaceDockProps) {
  const apiRef = useRef<DockviewApi | undefined>(undefined);
  const disposablesRef = useRef<Array<{ dispose(): void }>>([]);
  const panelsRef = useRef(panels);
  const titleForKindRef = useRef(titleForKind);
  const onPanelClosedRef = useRef(onPanelClosed);
  const onLayoutChangeRef = useRef(onLayoutChange);
  const layoutRef = useRef(layout);
  const onInvalidLayoutRef = useRef(onInvalidLayout);
  const lastSerializedLayoutRef = useRef("");
  const previousLayoutPropRef = useRef(layout);
  panelsRef.current = panels;
  titleForKindRef.current = titleForKind;
  onPanelClosedRef.current = onPanelClosed;
  onLayoutChangeRef.current = onLayoutChange;
  layoutRef.current = layout;
  onInvalidLayoutRef.current = onInvalidLayout;

  const components = useMemo(() => ({ "workspace-panel": WorkspaceDockPanel }), []);

  const handleReady = useCallback((event: DockviewReadyEvent) => {
    const api = event.api;
    apiRef.current = api;
    const emitLayout = () => {
      const next = api.toJSON();
      const serialized = JSON.stringify(next);
      if (serialized === lastSerializedLayoutRef.current) return;
      lastSerializedLayoutRef.current = serialized;
      onLayoutChangeRef.current(next);
    };
    let restored = false;
    if (layoutRef.current) {
      try {
        api.fromJSON(layoutRef.current as SerializedDockview);
        restored = true;
      } catch (error) {
        console.warn("[workspace] 停靠布局损坏，恢复默认布局:", error);
        api.clear();
        onInvalidLayoutRef.current?.();
      }
    }
    if (!restored) buildDefaultLayout(api, panelsRef.current, titleForKindRef.current);
    for (const panel of api.panels) {
      const configured = panelsRef.current.find((candidate) => candidate.id === panel.id);
      if (configured) {
        panel.api.setTitle(titleForKindRef.current(configured.kind));
        panel.api.updateParameters({ panelId: configured.id, kind: configured.kind });
      }
      panel.api.setConstraints({
        minimumHeight: PANEL_MINIMUM_HEIGHT,
        minimumWidth: PANEL_MINIMUM_WIDTH,
      });
    }
    for (const group of api.groups) {
      group.api.setConstraints({
        minimumHeight: PANEL_MINIMUM_HEIGHT,
        minimumWidth: PANEL_MINIMUM_WIDTH,
      });
    }

    disposablesRef.current.push(api.onDidMutateLayout(emitLayout));
    disposablesRef.current.push(api.onDidAddGroup((group) => {
      group.api.setConstraints({
        minimumHeight: PANEL_MINIMUM_HEIGHT,
        minimumWidth: PANEL_MINIMUM_WIDTH,
      });
    }));
    disposablesRef.current.push(api.onDidRemovePanel((removed) => {
      queueMicrotask(() => {
        if (!api.getPanel(removed.id)) onPanelClosedRef.current(removed.id);
      });
    }));
    emitLayout();
  }, []);

  useEffect(() => () => {
    for (const disposable of disposablesRef.current) disposable.dispose();
    disposablesRef.current = [];
    apiRef.current = undefined;
  }, []);

  useEffect(() => {
    const api = apiRef.current;
    if (!api) return;
    const expectedIds = new Set(panels.map((panel) => panel.id));
    for (const dockPanel of [...api.panels]) {
      if (!expectedIds.has(dockPanel.id)) api.removePanel(dockPanel);
    }
    for (const panel of panels) {
      const existing = api.getPanel(panel.id);
      if (existing) {
        existing.api.setTitle(titleForKind(panel.kind));
        existing.api.setConstraints({
          minimumHeight: PANEL_MINIMUM_HEIGHT,
          minimumWidth: PANEL_MINIMUM_WIDTH,
        });
        existing.api.updateParameters({ panelId: panel.id, kind: panel.kind });
        continue;
      }
      addPanel(
        api,
        panel,
        titleForKind(panel.kind),
        positionForAddedPanel(api, panel),
      );
    }
  }, [panels, titleForKind]);

  useEffect(() => {
    const previous = previousLayoutPropRef.current;
    previousLayoutPropRef.current = layout;
    const api = apiRef.current;
    if (!api || layout !== undefined || previous === undefined) return;
    api.clear();
    buildDefaultLayout(api, panelsRef.current, titleForKindRef.current);
    const next = api.toJSON();
    lastSerializedLayoutRef.current = JSON.stringify(next);
    onLayoutChangeRef.current(next);
  }, [layout]);

  return (
    <HeaderLabelsContext.Provider value={{ maximize: maximizeLabel, restore: restoreLabel }}>
      <RenderPanelContext.Provider value={renderPanel}>
        <div className="workspace-dock">
          <DockviewReact
            components={components}
            onReady={handleReady}
            theme={theme === "dark" ? themeAbyss : themeLight}
            rightHeaderActionsComponent={WorkspaceHeaderActions}
            disableFloatingGroups
            singleTabMode="default"
          />
        </div>
      </RenderPanelContext.Provider>
    </HeaderLabelsContext.Provider>
  );
}
