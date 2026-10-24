import { Suspense, useEffect, useRef, useState } from "react";
import { Button, Checkbox, EmptyState, Field, LogTerminal, Notice, NumberInput, Page,
  PanelBody, Section, Select, SplitGroup, SplitHandle, SplitPanel, StatusBadge,
  TextInput, Toolbar, validateInputs, type LogTerminalHandle } from "@robviz/core";
import { I18nProvider } from "../app/i18n";

export function Preview() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [scale, setScale] = useState(1);
  const [name, setName] = useState("/cmd_vel");
  const [speed, setSpeed] = useState<number | undefined>(0.5);
  const [enabled, setEnabled] = useState(false);
  const [saved, setSaved] = useState(false);
  const fields = useRef<HTMLDivElement>(null);
  const log = useRef<LogTerminalHandle>(null);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.setProperty("--effective-font-scale", String(scale));
  }, [theme, scale]);

  return <I18nProvider locale="zh-CN"><Page>
    <Toolbar>
      <strong>RobViz 共享 UI</strong>
      <Button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>切换深浅主题</Button>
      <label>字号 <Select value={scale} onChange={(event) => setScale(Number(event.target.value))}>
        <option value={0.75}>75%</option><option value={1}>100%</option><option value={1.5}>150%</option>
      </Select></label>
      <StatusBadge>无机器人连接</StatusBadge>
    </Toolbar>
    <SplitGroup style={{ flex: 1 }} orientation="horizontal">
      <SplitPanel minSize="260px">
        <Section title="控件与校验">
          <PanelBody ref={fields}>
            <Field label="控制话题"><TextInput value={name} required onChange={(event) => setName(event.target.value)} /></Field>
            <Field label="线速度 / m/s"><NumberInput value={speed} min={0.1} max={2} onValueChange={setSpeed} /></Field>
            <Checkbox checked={enabled} onChange={(event) => setEnabled(event.target.checked)}>启用示例</Checkbox>
            <Toolbar>
              <Button variant="primary" onClick={() => setSaved(validateInputs(fields.current))}>校验字段</Button>
              <Button selected={enabled} onClick={() => setEnabled(!enabled)}>选中状态</Button>
              <Button disabled>不可用操作</Button>
              <Button variant="danger" onClick={() => setSaved(false)}>清除结果</Button>
            </Toolbar>
          </PanelBody>
          {saved && <Notice>字段有效。此页面不发布任何机器人命令。</Notice>}
          <Notice tone="warning">警告仅使用主页的语义状态色。</Notice>
          <Notice tone="error">错误提示示例，不使用插件自定义红色。</Notice>
          <EmptyState>空状态与辅助信息</EmptyState>
        </Section>
      </SplitPanel>
      <SplitHandle aria-label="调整示例分栏" />
      <SplitPanel minSize="220px">
        <Section title="共享日志" actions={<Button onClick={() => log.current?.write("[UI] 共享日志示例\r\n")}>写入示例</Button>}>
          <div style={{ height: 240 }}><Suspense fallback={<EmptyState>正在加载终端…</EmptyState>}>
            <LogTerminal ref={log} label="共享日志示例" theme={theme} fontScale={scale} initialText={"RobViz UI preview\r\n"} />
          </Suspense></div>
          <Toolbar><StatusBadge>正常状态</StatusBadge><StatusBadge tone="warning">警告</StatusBadge><StatusBadge tone="error">错误</StatusBadge></Toolbar>
        </Section>
      </SplitPanel>
    </SplitGroup>
  </Page></I18nProvider>;
}

