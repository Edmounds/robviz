import { useEffect, useId, useMemo, useRef, useState } from "react";

import { CollapsibleSection } from "../app/CollapsibleSection";
import { useI18n } from "../app/i18n";
import type { WorkerBridge } from "../bridge/WorkerBridge";
import type { TopicInfo } from "../core/FoxgloveConnection";
import {
  echoPayloadValue,
  flattenEchoFields,
  type EchoField,
} from "../core/topicEcho";

const MAX_KNOWN_FIELDS = 256;

export function EchoTopicSection({
  bridge,
  topics,
}: {
  bridge: WorkerBridge;
  topics: TopicInfo[];
}) {
  const { t } = useI18n();
  const topicSelectId = useId();
  const [topic, setTopic] = useState("");
  const [knownPaths, setKnownPaths] = useState<string[]>([]);
  const [latestValues, setLatestValues] = useState<Map<string, string>>(new Map());
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [received, setReceived] = useState(false);
  const pendingFieldsRef = useRef<EchoField[] | undefined>(undefined);
  const frameRef = useRef<number | undefined>(undefined);

  const sortedTopics = useMemo(
    () => [...topics].sort((left, right) => left.topic.localeCompare(right.topic)),
    [topics],
  );

  useEffect(() => {
    if (topic && !topics.some((item) => item.topic === topic)) setTopic("");
  }, [topic, topics]);

  useEffect(() => {
    setKnownPaths([]);
    setLatestValues(new Map());
    setSelectedPaths(new Set());
    setReceived(false);
    pendingFieldsRef.current = undefined;
    if (!topic) return;

    const applyPendingFields = () => {
      frameRef.current = undefined;
      const fields = pendingFieldsRef.current ?? [];
      pendingFieldsRef.current = undefined;
      const nextValues = new Map(fields.map((field) => [field.path, field.value]));
      setLatestValues(nextValues);
      setKnownPaths((current) => {
        const known = new Set(current);
        const next = [...current];
        for (const field of fields) {
          if (known.has(field.path) || next.length >= MAX_KNOWN_FIELDS) continue;
          known.add(field.path);
          next.push(field.path);
        }
        return next;
      });
      setReceived(true);
    };

    const unsubscribe = bridge.subscribe(topic, (payload) => {
      pendingFieldsRef.current = flattenEchoFields(echoPayloadValue(payload));
      if (frameRef.current === undefined) {
        frameRef.current = requestAnimationFrame(applyPendingFields);
      }
    });

    return () => {
      unsubscribe();
      if (frameRef.current !== undefined) cancelAnimationFrame(frameRef.current);
      frameRef.current = undefined;
      pendingFieldsRef.current = undefined;
    };
  }, [bridge, topic]);

  const togglePath = (path: string) => {
    setSelectedPaths((current) => {
      const next = new Set(current);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const selected = knownPaths.filter((path) => selectedPaths.has(path));

  return (
    <CollapsibleSection title={t("echoTopic")}>
      <div className="echo-picker">
        <label htmlFor={topicSelectId}>{t("topics")}</label>
        <select
          id={topicSelectId}
          value={topic}
          disabled={topics.length === 0}
          onChange={(event) => setTopic(event.target.value)}
        >
          <option value="">{t("chooseEchoTopic")}</option>
          {sortedTopics.map((item) => {
            const shortSchema = item.schemaName.split("/").pop() || item.schemaName;
            return (
              <option key={item.topic} value={item.topic}>
                {item.topic} ({shortSchema})
              </option>
            );
          })}
        </select>
      </div>

      {!topic && (
        <p className="echo-empty">{topics.length === 0 ? t("noTopics") : t("echoChooseHint")}</p>
      )}
      {topic && !received && <p className="echo-empty">{t("waitingData")}</p>}
      {topic && received && knownPaths.length === 0 && (
        <p className="echo-empty">{t("echoNoFields")}</p>
      )}

      {knownPaths.length > 0 && (
        <>
          <div className="echo-toolbar">
            <span>{t("echoFields")}</span>
            <output>{t("echoSelectedCount", { selected: selected.length, total: knownPaths.length })}</output>
            <button type="button" onClick={() => setSelectedPaths(new Set(knownPaths))}>
              {t("echoSelectAll")}
            </button>
            <button type="button" disabled={selected.length === 0} onClick={() => setSelectedPaths(new Set())}>
              {t("echoClearSelection")}
            </button>
          </div>
          <div className="echo-field-list">
            {knownPaths.map((path) => (
              <label className="echo-field-row" key={path} title={path}>
                <input
                  type="checkbox"
                  checked={selectedPaths.has(path)}
                  onChange={() => togglePath(path)}
                />
                <code>{path}</code>
              </label>
            ))}
          </div>

          <div className="echo-output-heading">{t("echoOutput")}</div>
          {selected.length === 0 ? (
            <p className="echo-empty echo-output-empty">{t("echoNoSelection")}</p>
          ) : (
            <dl className="echo-output">
              {selected.map((path) => (
                <div className="echo-output-row" key={path}>
                  <dt title={path}>{path}</dt>
                  <dd>{latestValues.get(path) ?? "--"}</dd>
                </div>
              ))}
            </dl>
          )}
        </>
      )}
    </CollapsibleSection>
  );
}
