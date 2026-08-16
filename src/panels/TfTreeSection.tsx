/** TF 树：child→parent 映射转成缩进树；点击节点一键视角跟踪该 frame */
import { useMemo } from "react";
import { CollapsibleSection } from "../app/CollapsibleSection";
import { useI18n } from "../app/i18n";

export function TfTreeSection({
  tree,
  followFrame,
  onFollow,
}: {
  tree: Map<string, string>;
  followFrame?: string;
  onFollow?: (frame: string) => void;
}) {
  const { t } = useI18n();
  const lines = useMemo(() => {
    if (tree.size === 0) return [];
    const children = new Map<string, string[]>();
    const allChildren = new Set(tree.keys());
    const roots = new Set<string>();
    for (const [child, parent] of tree) {
      let list = children.get(parent);
      if (!list) {
        list = [];
        children.set(parent, list);
      }
      list.push(child);
      if (!allChildren.has(parent)) roots.add(parent);
    }
    const out: Array<{ name: string; depth: number }> = [];
    const walk = (frame: string, depth: number) => {
      out.push({ name: frame, depth });
      for (const c of (children.get(frame) ?? []).sort()) walk(c, depth + 1);
    };
    for (const root of [...roots].sort()) walk(root, 0);
    return out;
  }, [tree]);

  if (lines.length === 0) return null;

  return (
    <CollapsibleSection title={t("tfTree")}>
      <div className="tf-tree">
        {lines.map(({ name, depth }) => (
          <button
            key={name}
            className={`tf-node ${followFrame === name ? "following" : ""}`}
            style={{ paddingLeft: 12 + depth * 14 }}
            onClick={() => onFollow?.(name)}
            title={followFrame === name ? t("cancelFollow") : t("followFrame")}
          >
            {depth > 0 && <span className="tf-branch">└ </span>}
            {name}
            {followFrame === name && <span className="tf-follow-mark"> ◉</span>}
          </button>
        ))}
      </div>
    </CollapsibleSection>
  );
}
