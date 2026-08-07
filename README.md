# QQ 农场 · 前端（vue-framework）

QQ 农场智能助手管理端：账号托管、自动化配置、个人农场/背包/任务、好友、活动中心、商城与数据分析。

基于 [SoybeanAdmin](https://github.com/soybeanjs/soybean-admin)（Vue 3 + Vite + TypeScript + Naive UI + UnoCSS）改造；业务页面在 `src/views/farm`。

配套后端：[`../go-framework`](../go-framework)。

<span>中文 | <a href="./README.en_US.md">English</a></span>

## 功能页面

| 路由区域            | 说明                                          |
| ------------------- | --------------------------------------------- |
| 工作台              | 账号运行状态、日志、实时通道                  |
| 账号管理            | 农场账号、启停、微信扫码登录                  |
| 个人农场            | 土地操作 · 背包（分类/卖/用）· 每日任务与礼包 |
| 好友                | 列表同步、帮忙/偷菜/捣乱、互动记录            |
| 活动中心            | 千星游记、观星、星砂商店、节令                |
| 游戏商城 / 神秘商人 | 购买与余额                                    |
| 自动化设置          | 巡田间隔、静默时段、种植策略、好友开关等      |
| 游戏配置            | 种子/果实/道具静态配置                        |
| 分析                | 数据概览                                      |
| 系统                | 用户管理                                      |

应用标题见 `.env`：`VITE_APP_TITLE=QQ农场智能助手`。

## 技术栈

- Vue 3、Vite、TypeScript、Pinia、Naive UI、UnoCSS
- 静态扁平菜单（仅登录鉴权，无后端菜单/RBAC）
- 请求封装对接 go-framework（成功码 `0`，Token 刷新等）

## 环境要求

- Node.js ≥ 20.19.0
- pnpm ≥ 10.5.0（请勿用 npm / yarn）

## 快速开始

```bash
pnpm i
pnpm dev          # 默认 mode=test，代理后端
```

后端默认地址（`.env.test`）：

```
VITE_SERVICE_BASE_URL=http://127.0.0.1:9528
```

请先启动 go-framework（`make run` 或 `go run ./cmd/app -e=dev -p=9528`）。

```bash
pnpm build        # 生产构建
pnpm build:test   # 测试环境构建
pnpm lint
pnpm gen-route    # 重新生成路由声明
```

开发代理由 `VITE_HTTP_PROXY=Y` 控制；改后端端口时同步修改 `.env.test` / `.env.prod`。

## 目录结构（业务相关）

```
src/
  views/farm/          # 农场业务页
    account/ dashboard/ personal/ friends/
    activity/ settings/ game-mall/ mystery-shop/
    game-config/ analytics/ card/
  views/system/        # 用户管理
  service/api/         # 含 farm.ts 等接口
  store/modules/       # farm-account 等
  locales/             # 中英 i18n
```

## 权限说明

- 登录后拉取后端路由与按钮 alias
- 页面按钮用 `useAuth().hasAuth('farm-xxx:yyy')` 控制
- 新增后端 API 需在 go-framework 权限种子 / 菜单中登记，否则会 403

## License

MIT（上游 SoybeanAdmin LICENSE 仍适用）。
