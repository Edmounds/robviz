/**
 * Image Capture Page.
 * Displays real-time raw camera preview and allows capturing lossless PNG images on NUC.
 */

import { Camera, CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import type { WorkerBridge } from "../bridge/WorkerBridge";
import type { ConnectionState, TopicInfo } from "../core/FoxgloveConnection";
import { useI18n } from "../app/i18n";
import {
  CaptureUnconfirmedError,
  ImageCaptureClient,
  type CaptureInfo,
} from "../media/ImageCaptureClient";
import { webRtcManager } from "../media/WebRtcStreamClient";
import { ImagePanel } from "./ImagePanel";

export interface ImageCapturePageProps {
  bridge: WorkerBridge;
  topics: TopicInfo[];
  active: boolean;
  bridgeUrl: string;
  mediaUrl?: string;
  connectionState: ConnectionState;
  theme: "dark" | "light";
  fontScale: number;
}

export function ImageCapturePage({
  bridge,
  topics,
  active,
  bridgeUrl,
  mediaUrl,
  connectionState,
}: ImageCapturePageProps) {
  const { t } = useI18n();
  const [captureInfo, setCaptureInfo] = useState<CaptureInfo | null>(null);
  const [gwConnected, setGwConnected] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [unconfirmedError, setUnconfirmedError] = useState<string | null>(null);

  const clientRef = useRef<ImageCaptureClient | null>(null);
  const gatewayWsUrl = webRtcManager.deriveMediaUrl(
    bridgeUrl || "ws://localhost:8765",
    mediaUrl,
  );

  // Initialize and connect ImageCaptureClient
  useEffect(() => {
    setCaptureInfo(null);
    setGwConnected(false);
    setIsSaving(false);
    setLastSaved(null);
    setLastError(null);
    setUnconfirmedError(null);

    if (!active || connectionState !== "open") {
      if (clientRef.current) {
        clientRef.current.close();
        clientRef.current = null;
      }
      return;
    }

    const client = new ImageCaptureClient(gatewayWsUrl, {
      onInfo: (info) => {
        if (clientRef.current === client) {
          setCaptureInfo(info);
        }
      },
      onConnectionChange: (connected) => {
        if (clientRef.current === client) {
          setGwConnected(connected);
          if (connected) setLastError(null);
        }
      },
      onError: (err) => {
        if (clientRef.current === client) {
          setLastError(err);
        }
      },
    });

    clientRef.current = client;
    client.connect();

    return () => {
      client.close();
      if (clientRef.current === client) {
        clientRef.current = null;
      }
    };
  }, [active, connectionState, gatewayWsUrl]);

  const triggerCapture = useCallback(async () => {
    const client = clientRef.current;
    if (
      !client ||
      isSaving ||
      !gwConnected ||
      !captureInfo?.hasFrame ||
      !active ||
      connectionState !== "open"
    ) {
      return;
    }

    setIsSaving(true);
    setLastSaved(null);
    setLastError(null);
    setUnconfirmedError(null);

    try {
      const result = await client.captureFrame();
      if (clientRef.current !== client) return;
      if (result.success) {
        setLastSaved(result.fileName ?? "image.png");
        setCaptureInfo((prev) =>
          prev
            ? {
                ...prev,
                totalCount: result.totalCount ?? prev.totalCount + 1,
                lastFileName: result.fileName ?? prev.lastFileName,
              }
            : null,
        );
      } else {
        setLastError(result.error ?? "Save failed");
      }
    } catch (err) {
      if (clientRef.current !== client) return;
      if (
        err instanceof CaptureUnconfirmedError ||
        (typeof err === "object" && err !== null && "unconfirmed" in err)
      ) {
        setUnconfirmedError(err instanceof Error ? err.message : String(err));
      } else {
        setLastError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      if (clientRef.current === client) {
        setIsSaving(false);
      }
    }
  }, [active, captureInfo?.hasFrame, connectionState, gwConnected, isSaving]);

  // Spacebar shortcut handling
  useEffect(() => {
    if (!active) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space" && event.key !== " ") return;
      if (event.repeat) return;
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;

      const target = event.target as HTMLElement | null;
      if (target) {
        const tagName = target.tagName.toLowerCase();
        if (
          tagName === "input" ||
          tagName === "textarea" ||
          tagName === "select" ||
          tagName === "button" ||
          target.isContentEditable ||
          target.closest(".terminal-drawer")
        ) {
          return;
        }
      }

      event.preventDefault();
      void triggerCapture();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [active, triggerCapture]);

  const rawTopic = captureInfo?.topic || "/camera/color/image_raw";
  const canCapture =
    !isSaving && gwConnected && Boolean(captureInfo?.hasFrame);

  return (
    <div className="capture-page">
      <div className="capture-toolbar">
        <button
          type="button"
          className="capture-action-btn"
          disabled={!canCapture}
          onClick={() => void triggerCapture()}
          title={t("captureSavePng")}
        >
          <Camera />
          <span>{isSaving ? t("captureSaving") : t("captureSavePng")}</span>
        </button>

        <div className="capture-meta-group">
          <span className="capture-stat-item">
            <strong>{t("captureCount")}:</strong>{" "}
            {captureInfo?.totalCount ?? 0}
          </span>
          <span className="capture-stat-item">
            <strong>{t("captureResolution")}:</strong>{" "}
            {captureInfo?.width && captureInfo?.height
              ? `${captureInfo.width}×${captureInfo.height}`
              : "-"}
          </span>
          <span
            className="capture-stat-item capture-dir-item"
            title={captureInfo?.outputDir ?? ""}
          >
            <strong>{t("captureDir")}:</strong>{" "}
            <code>{captureInfo?.outputDir || "-"}</code>
          </span>
          {captureInfo?.lastFileName && (
            <span
              className="capture-stat-item"
              title={captureInfo.lastFileName}
            >
              <strong>{t("captureLastFile")}:</strong>{" "}
              {captureInfo.lastFileName}
            </span>
          )}
        </div>

        <div className="capture-feedback-area" aria-live="polite">
          {isSaving && (
            <span className="feedback-saving">
              {t("captureSaving")}
            </span>
          )}
          {!isSaving && lastSaved && (
            <span className="feedback-success">
              <CheckCircle2 />
              <span>
                {t("captureSuccess", {
                  file: lastSaved,
                  width: captureInfo?.width ?? 0,
                  height: captureInfo?.height ?? 0,
                })}
              </span>
            </span>
          )}
          {!isSaving && unconfirmedError && (
            <span className="feedback-warning" role="alert">
              <AlertTriangle />
              <span>{t("captureUnconfirmed", { error: unconfirmedError })}</span>
            </span>
          )}
          {!isSaving && lastError && (
            <span className="feedback-error" role="alert">
              <AlertCircle />
              <span>{t("captureError", { error: lastError })}</span>
            </span>
          )}
        </div>
      </div>

      {gwConnected && captureInfo && !captureInfo.hasFrame && (
        <div className="capture-offline-banner" role="status">
          <AlertTriangle />
          <span>{t("captureCameraOffline")}</span>
        </div>
      )}

      <div className="capture-viewport-container">
        <ImagePanel
          bridge={bridge}
          topics={topics}
          fixedTopic={rawTopic}
          active={active}
          mediaUrl={mediaUrl}
          embedded={true}
          onClose={() => {}}
        />
      </div>
    </div>
  );
}
