# Task Plan: Base Platform Refactoring & Hardening

Status: IN PROGRESS

## Objectives & Core Constraints
- Base platform boundaries: host owns transport lifecycle, config, workspaces, fault isolation. Plugins own robot-specific topics, controls, and control policies.
- Phase A: Connection validation, authoritative lifecycle state, write gating (fail prompt, no queue/replay), service rejection on disconnect, TF reset on machine change.
- Phase B: Channel schema isolation (quarantine on bad definition, single error report, no Worker crash, retry on re-advertisement).
- Phase C: Bundled plugins (Teleop and Nav), minimal viewport tool extension, session `active` metadata, clean up superseded core UI.
- Phase D: Machine tabs renaming (primary user name + secondary hostname, double click edit), config persistence, documentation updates.
- Preserve existing working tree diffs (localStorage / save as file, etc.). Run full verification.

## Phase Breakdown

- [x] **Phase A: Connection and Write Semantics**
  - [x] A1: Validate connection URLs (valid ws:/wss:) before creating WebSocket; reject deterministic invalid URL synchronously/actionably without Worker crash loops.
  - [x] A2: In `FoxgloveConnection`, on disconnect notify `onChannels([])` and `onServices([])`, reject pending service calls, clear timers.
  - [x] A3: In `WorkerBridge`, track connection generation/state; synchronously gate `publish` (reject/throw or error callback when not open); reject `callService` immediately when not open; settle in-flight service calls on disconnect/close/reconnect/worker failure/dispose with timeout.
  - [x] A4: In `connection.worker.ts`, return `{ ok: false, error: "not connected" }` when `conn` is unset or state not open.
  - [x] A5: In `App.tsx`, clear TF scene state when switching/connecting to different URL. Disable service submit when disconnected.
  - [x] A6: Unit tests for Phase A (`FoxgloveConnection`, `WorkerBridge`, URL validation, service rejection, no write replay).

- [x] **Phase B: Bad Topic Isolation**
  - [x] B1: In `FoxgloveConnection`, move `#readerFor` creation and schema parsing into per-message try/catch or guard during message handling.
  - [x] B2: Quarantine broken channels by channel ID; report error once per channel incarnation; skip messages without crashing.
  - [x] B3: Clear quarantine and cached reader when channel is unadvertised/re-advertised.
  - [x] B4: Guard subscribe/advertise against malformed schema/metadata.
  - [x] B5: Tests for bad channel schema isolation, valid channel B continuing uninterrupted, recovery after re-advertise.

- [x] **Phase C: Plugin Contract and Bundled Controls**
  - [x] C1: Extend plugin types with session activity/connection metadata and `viewportTools`.
  - [x] C2: Migrate Teleop to a bundled plugin; inactive/disconnected sessions stop control and require explicit re-enable; explicit online disable attempts zero Twist.
  - [x] C3: Migrate Nav Goal / Initial Pose to a bundled viewport-tool plugin with configurable topics.
  - [x] C4: Remove superseded host Teleop/Nav paths and default Teleop panel; keep bundled plugins enabled by default.
  - [ ] C5: Plugin registry/Nav publishing and Teleop write-policy tests pass; full React lifecycle/browser exercise for pause/resume remains unverified.
- [ ] **Phase D: Session Tabs and Configuration**
  - [x] D1: Machine tabs support double-click, F2, and pencil-button rename; custom label is primary and hostname secondary.
  - [x] D2: Session labels, plugin state, and plugin-section initialization state persist through browser storage and JSON import/export.
  - [ ] D3: Unit tests cover rename/empty labels, fallback hostname, and config round-trip; interactive cancel/commit behavior still needs browser verification.
  - [x] D4: Update README, plugin guide, and implementation plan documentation.

- [x] **Phase E: Automated Verification**
  - [x] E1: `npm run lint`.
  - [x] E2: `npm test` (29 files, 133 tests).
  - [x] E3: `npm run build` (passes; Vite reports the existing >500 kB bundle advisory).
  - [x] E4: `git diff --check`.

## Remaining Manual Check
- Browser workflow smoke test was attempted with ego-browser, but its browser automation calls hung before returning page data. The Vite dev server remains available at http://127.0.0.1:5174/ for checking connection switching, plugin toggles, rename keyboard/mouse behavior, and offline editing.
