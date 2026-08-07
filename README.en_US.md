# QQ Farm · Frontend (qq-farm-web)

Admin UI for the QQ Farm assistant: multi-account control, automation settings, personal farm / bag / tasks, friends, activity center, mall, and analytics.

Built on [SoybeanAdmin](https://github.com/soybeanjs/soybean-admin) (Vue 3 + Vite + TypeScript + Naive UI + UnoCSS). Farm features live under `src/views/farm`.

- Repo: [github.com/it00021hot/qq-farm-web](https://github.com/it00021hot/qq-farm-web)
- Backend: [`../qq-farm-core`](../qq-farm-core) · [GitHub](https://github.com/it00021hot/qq-farm-core)
- Desktop embed: use with [`../qq-farm-desktop`](../qq-farm-desktop) via `pnpm build:desktop`

<span><a href="./README.md">中文</a> | English</span>

## Features

| Area                | Description                                                      |
| ------------------- | ---------------------------------------------------------------- |
| Dashboard           | Run status, logs, realtime channel                               |
| Accounts            | CRUD, start/stop, WeChat QR login                                |
| Personal farm       | Lands, bag (sell/use), daily gifts & tasks                       |
| Friends             | Sync, help/steal/bad, interaction history                        |
| Activity center     | Travel pass, constellation, star-sand shop, solar terms          |
| Mall / mystery shop | Purchase & balances                                              |
| Automation          | Patrol intervals, quiet hours, planting strategy, friend toggles |
| Game config         | Seed / fruit / item static data                                  |
| Analytics           | Overview                                                         |
| System              | Admin users                                                      |

App title is set in `.env`: `VITE_APP_TITLE=QQ农场智能助手`.

## Stack

- Vue 3, Vite, TypeScript, Pinia, Naive UI, UnoCSS
- Static flat auth routes (login-only; no backend menu/RBAC)
- HTTP client aligned with qq-farm-core (`success code = 0`, token refresh, etc.)

## Requirements

- Node.js ≥ 20.19.0
- pnpm ≥ 10.5.0 (do not use npm / yarn)

## Quick start

```bash
pnpm i
pnpm dev          # mode=test, proxies to backend
```

Backend URL (`.env.test`):

```
VITE_SERVICE_BASE_URL=http://127.0.0.1:9528
```

Start qq-farm-core first (`make run` or `go run ./cmd/app -e=dev -p=9528`).

```bash
pnpm build
pnpm build:test
pnpm build:desktop   # Wails embed (.env.desktop)
pnpm lint
pnpm gen-route
```

Dev proxy is controlled by `VITE_HTTP_PROXY=Y`. Update `.env.test` / `.env.prod` if the API port changes.

Desktop mode (`.env.desktop`): `VITE_IS_DESKTOP=Y`, hash router, direct `http://127.0.0.1:9528`.

## Layout (farm-related)

```
src/
  views/farm/          # farm feature pages
  views/system/        # admin users
  service/api/         # includes farm.ts
  store/modules/       # e.g. farm-account
  layouts/             # desktop window controls, sider layout
  locales/             # zh-CN / en-US
  utils/desktop.ts     # Wails runtime helpers
```

## Auth

- JWT after login; menus are static frontend routes (not backend-driven)
- Optional UI gates via `useAuth()`
- Backend grants full access after login (no Casbin resource seeding)

## License

MIT (upstream SoybeanAdmin LICENSE still applies).
