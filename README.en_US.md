# QQ Farm · Frontend (vue-framework)

Admin UI for the QQ Farm assistant: multi-account control, automation settings, personal farm / bag / tasks, friends, activity center, mall, and analytics.

Built on [SoybeanAdmin](https://github.com/soybeanjs/soybean-admin) (Vue 3 + Vite + TypeScript + Naive UI + UnoCSS). Farm features live under `src/views/farm`.

Backend: [`../go-framework`](../go-framework).

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
- HTTP client aligned with go-framework (`success code = 0`, token refresh, etc.)

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

Start go-framework first (`make run` or `go run ./cmd/app -e=dev -p=9528`).

```bash
pnpm build
pnpm build:test
pnpm lint
pnpm gen-route
```

Dev proxy is controlled by `VITE_HTTP_PROXY=Y`. Update `.env.test` / `.env.prod` if the API port changes.

## Layout (farm-related)

```
src/
  views/farm/          # farm feature pages
  views/system/        # tenant / role / menu / permission
  service/api/         # includes farm.ts
  store/modules/       # e.g. farm-account
  locales/             # zh-CN / en-US
```

## Permissions

- Routes and button aliases come from the backend after login
- Use `useAuth().hasAuth('farm-xxx:yyy')` for UI gates
- New APIs must be seeded in go-framework RBAC resources or requests return 403

## License

MIT (upstream SoybeanAdmin LICENSE still applies).
