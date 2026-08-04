# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

An alternative, unofficial Meshtastic web client built with Vue 3 (not affiliated with the official meshtastic-web project). It talks to Meshtastic devices over HTTP, Web Bluetooth, or Web Serial, and persists connections/devices/messages/node databases in IndexedDB so the app works fully client-side with no backend.

## Monorepo layout

pnpm workspace, package manager is pnpm only (`preinstall` scripts enforce this via `only-allow pnpm`).

- `packages/web` — the Vue 3 application (the actual product). Everything under "Web app architecture" below applies here.
- `packages/core` — `@meshtastic/core`: transport-agnostic protocol implementation (`MeshDevice` class, event system, packet queue, protocol constants). Published standalone to npm/JSR.
- `packages/protobufs` — `@meshtastic/protobufs`: generated TS stubs from the upstream Meshtastic `.proto` definitions via Buf (git submodule). Not hand-edited; regenerate with `pnpm run gen` inside that package. Requires the [Buf CLI](https://buf.build/docs/cli/installation/#install-the-buf-cli) installed locally.
- `packages/transport-http`, `packages/transport-web-bluetooth`, `packages/transport-web-serial` — transport implementations consumed by `core`/`web`, each publishable independently.

Workspace packages depend on each other via `link:../<package>` in `package.json` (not npm registry versions) — changes in `core` or the transport packages are picked up live by `web` without a publish step.

## Common commands

Run from repo root unless noted:

```bash
pnpm install                 # install all workspace deps
pnpm run build:all           # build every package (pnpm run --filter '*' build)
pnpm run clean:all           # clean every package
pnpm run lint / lint:fix     # Biome lint (root-level, JS/TS outside packages/web)
pnpm run format / format:fix # Biome format
pnpm run check / check:fix   # Biome lint+format combined
```

Web app (`packages/web`):

```bash
cd packages/web
pnpm run dev                 # vite dev server
pnpm run build                # type-check (vue-tsc --noEmit) + vite build, run in parallel
pnpm run build-only           # vite build only, skips type-check
pnpm run type-check           # vue-tsc --noEmit
pnpm run preview              # preview a production build
pnpm run lint                 # eslint . --fix --cache (ESLint, not Biome — web app is excluded from root Biome config)
```

There is no test suite in this repository at present.

Protobufs (`packages/protobufs`, requires Buf CLI):

```bash
cd packages/protobufs
pnpm run gen                  # regenerate TS stubs from .proto submodule
pnpm run build                # clean + gen
```

Publishable packages (`core`, `transport-*`) each have `build:npm` (tsdown), `publish:npm`, `prepare:jsr`/`publish:jsr` scripts — used only when cutting a release, not during normal app development.

### Linting note

Two separate linters are in play: root **Biome** (`biome.json`) covers everything except `packages/web` (explicitly ignored in `files.ignore`), and `packages/web` has its **own ESLint** flat config (`packages/web/eslint.config.ts`) built on `@vue/eslint-config-typescript` + `eslint-plugin-vue`. When editing web app code, use `pnpm run lint` inside `packages/web`, not the root Biome scripts.

## Web app architecture (`packages/web/src`)

### Data flow: transport → core → stores → UI

1. **Transport layer** (`@meshtastic/transport-http` / `-web-bluetooth` / `-web-serial`) wraps the physical connection (fetch/HTTP polling, GATT, Web Serial).
2. **`MeshDevice`** (`@meshtastic/core`) wraps a transport and exposes a typed event bus (`connection.events.on*Packet`) plus command methods (`configure()`, `heartbeat()`, `sendPacket()`, etc.).
3. **`useConnection.ts`** (`src/composables/useConnection.ts`) is the orchestrator: resolves the right transport for a connection's type, constructs a `MeshDevice`, manages the connect/disconnect lifecycle, heartbeats (fast 5s heartbeat during config, slow 5min heartbeat once configured), and single-active-connection enforcement (connecting to one connection disconnects any other active one).
4. **`subscriptions.ts`** (`src/composables/subscriptions.ts`, `subscribeAll()`) wires `MeshDevice` events to store mutations — e.g. `onNodeInfoPacket` → `nodeDB.addNode()`, `onMessagePacket` → `messageStore.saveMessage()`, `onConfigPacket` → `device.setConfig()`. This is the single place that translates protocol packets into app state.
5. **Stores** (`src/composables/stores/*`) hold app state and persist to IndexedDB. **Vue components** read/write stores and never talk to `MeshDevice` directly except through composables.

### Stores (`src/composables/stores/`)

All stores are plain composables (`createSharedComposable` from VueUse — a singleton composable shared across the app), not Pinia. Each domain store follows the same shape: a class implementing an `I<Thing>` interface (e.g. `IConnection`, `IDevice`) with `set()`/`get()` methods for (de)serializing to/from IndexedDB, wrapped by a `use<Thing>Store()` composable exposing CRUD-style async functions.

- **`connection/`** — persisted connection configs (HTTP URL, BT device id, Serial vendor/product id) and their live `ConnectionStatus`. One `Connection` row per configured device; `meshDeviceId` links a connection to the device state below.
- **`device/`** — per-device runtime + persisted state: config/module config (as protobuf `LocalConfig`/`LocalModuleConfig`), channels, hardware info, traceroutes, waypoints, unread counts, client notifications. Has a **unified change-tracking system** (`changeRegistry.ts`) — pending edits to config/module config/channels/admin messages are staged in `changeRegistry.changes` (keyed by `serializeKey()`) before being sent to the device, so the settings UI can show "N pending changes" and diff against the last-known device state before committing. `getEffectiveConfig()`/`getEffectiveModuleConfig()` merge staged changes over the persisted config for display. Retention limits are enforced for traceroutes/waypoints/device history (`useEvictOldestEntries.ts`).
- **`message/`** — chat messages (broadcast per-channel and direct per-node), keyed by device.
- **`nodeDB/`** — the mesh node database: known nodes, positions, telemetry, user info, formatted/derived node views (`useFormattedNodeDatabase.ts`), node validation (`nodeValidation.ts`).
- **`app/`** — small app-wide UI state (e.g. `recentDeviceId`).
- **`indexedDB.ts`** — the shared IndexedDB wrapper (`useIndexedDB()`, via the `idb` package). Defines the store names (`IDB_CONNECTION_STORE`, `IDB_DEVICE_STORE`, `IDB_MESSAGE_STORE`, `IDB_NODESDB_STORE`, `IDB_APP_STORE`) and versioned schema upgrades. Also owns full-database **export/import as a zip** (`exportBackup`/`restoreBackup`) with custom BigInt/Date/Uint8Array (de)serialization, since IndexedDB can't natively round-trip those through JSON.
- **`utils/`** — shared store helpers: `purgeUncloneable.ts` (strips non-structured-cloneable properties before an IndexedDB write, e.g. after a `connection` object reference leaks into device state), `useEvictOldestEntries.ts` (retention/trim helpers).

Each device (a physical Meshtastic radio) gets its own numeric `meshDeviceId`, and device/message/nodeDB stores are keyed/scoped by that id — deleting a connection cascades to delete its device, message store, and node DB (see `useConnectionStore.deleteConnection`).

### Routing (`src/router/index.ts`)

Vue Router with nested routes under a shared `Dashboard.vue` shell. Top-level routes: `/` (connections list), `/nodes`, `/chat/:type(broadcast|direct)/:id`, `/map`, `/settings/{radio,device,modules}`. Route `meta` fields (`viewNodes`, `viewChat`, `viewMap`, `viewSettings`, `viewConnections`) drive which submenu the sidebar shows. The chat route has a `beforeEnter` guard (`validateChatRoute`) that validates `type` is `broadcast`/`direct` and `id` is in the legal numeric range (broadcast channel 0–7, direct node 0–0xFFFFFFFE), redirecting to `chat.default` otherwise.

### UI structure (`src/components/Dashboard/`)

`Pages/{MapView,MessageView,NodeView,Settings}` hold the main per-route screens; `Settings/subforms` and `Settings/components` break the radio/device/module config screens into per-config-section forms that read/write the device store's change-tracking API (`setChange`/`hasChange`/`getEffectiveConfig`) rather than mutating protobuf objects directly.

### UI stack

Vue 3 + PrimeVue (component library, `@primeuix/themes`) + Tailwind CSS v4 (via `@tailwindcss/vite`, with `tailwindcss-primeui` bridging Tailwind utilities and PrimeVue theming) + `@vueuse/core` for composition utilities. Maps use `maplibre-gl` / `@indoorequal/vue-maplibre-gl` + `proj4` for coordinate conversion. Forms use `@vuelidate/core`/`validators`.

### Path alias

`@/` resolves to `packages/web/src/` (configured in `vite.config.ts` and the tsconfig).

### Build-time constants

`vite.config.ts` injects `import.meta.env.VITE_APP_NAME`, `VITE_COMMIT_HASH` (from `git rev-parse --short HEAD`), and `VITE_VERSION` (from `git describe --tags --abbrev=0`) at build time — these fall back to `'DEV'`/empty when not in a git checkout.
