/**
 * 模块级故障舱壁：任何面板/区块渲染崩溃只影响自己，
 * 显示错误 + 重置按钮，其余 UI 与数据流不受影响。
 */
import { Component } from "react";
import type { ReactNode } from "react";
import type { Translate } from "./i18n";
import { useI18n } from "./i18n";

interface Props {
  /** 模块名（错误提示用） */
  name: string;
  children: ReactNode;
  /** 重置时额外清理（如关闭面板） */
  onReset?: () => void;
}

interface InnerProps extends Props {
  t: Translate;
}

interface State {
  error?: Error;
}

class ErrorBoundaryImpl extends Component<InnerProps, State> {
  state: State = {};

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error): void {
    console.error(`[${this.props.name}] 模块崩溃（已隔离）:`, error);
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="module-error">
          <div className="module-error-title">{this.props.t("moduleError", { name: this.props.name })}</div>
          <div className="module-error-msg">{this.state.error.message}</div>
          <button
            onClick={() => {
              this.props.onReset?.();
              this.setState({ error: undefined });
            }}
          >
            {this.props.t("reset")}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function ErrorBoundary(props: Props) {
  const { t } = useI18n();
  return <ErrorBoundaryImpl {...props} t={t} />;
}
