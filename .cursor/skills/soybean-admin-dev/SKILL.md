---
name: soybean-admin-dev
description: Develop pages and features in the soybean-admin Vue3/Vite/NaiveUI scaffold. Covers file-based routes, API/typings, CRUD pages (search/table/drawer), i18n, UnoCSS, and verification (typecheck/lint/fmt). Use when working under soybean-admin/, adding views, service/api, typings, Elegant Router, or NaiveUI admin list/form pages.
---

# soybean-admin Development

Work from the `soybean-admin/` repo root. Node `>=20.19`, pnpm `>=10.5` (**pnpm only**).

Stack: Vue3 + Vite8 + TypeScript + Pinia + NaiveUI + UnoCSS + Elegant Router.

Env: `.env` / `.env.test` / `.env.prod`. `pnpm dev` uses `--mode test`. Proxy: `VITE_HTTP_PROXY=Y`. Backend success code: `VITE_SERVICE_SUCCESS_CODE` (default `0000`) — change env when integrating a custom backend; do not hardcode success checks in pages.

## Feature workflow

Do not skip layers. Order:

1. **Typings** — `src/typings/api/{module}.d.ts` under `declare namespace Api { namespace Xxx { ... } }`
2. **API** — `src/service/api/{module}.ts` (`fetchGetXxx` / `fetchXxx` + `request<T>`); re-export from `src/service/api/index.ts`
3. **Constants** — enums/options in `src/constants/business.ts` via `Record` + `transformRecordToOption`
4. **i18n** — add keys to both `src/locales/langs/zh-cn.ts` and `en-us.ts` (`page.{domain}.*`); UI text only via `$t`
5. **Views** — `src/views/{domain}/index.vue` + `modules/{domain}-search.vue` + `modules/{domain}-operate-drawer.vue` (optional `modules/shared.ts`)
6. **Hooks** — `useNaivePaginatedTable` + `defaultTransform` + `useTableOperate`; forms: `useNaiveForm` / `useFormRules`; buttons: `useAuth().hasAuth(code)`
7. **Routes** — file-based (Elegant Router); run `pnpm gen-route` when needed; never hand-edit `src/router/elegant` or generated `elegant-router.d.ts`
8. **Store** — global state only in `src/store/modules/*`; keep page state in the view/composable

## Coding conventions

### Format and quality gates

- Formatter: `oxfmt` (printWidth 120, singleQuote, trailingComma none) — see [`.oxfmtrc.json`](../../../.oxfmtrc.json)
- Lint: `oxlint --fix` + `eslint --fix` (`@soybeanjs/eslint-config-vue`); template components PascalCase except `icon-*`
- Indent 2 spaces (`.editorconfig`)
- Before finish: `pnpm typecheck && pnpm lint && pnpm fmt`

### Vue / TypeScript

- Default `<script setup lang="ts">`; use `lang="tsx"` when table columns need JSX `render`
- Child modules: `defineOptions({ name: 'PascalCase' })`
- Prefer `defineModel` for two-way bindings; declare Props/Emits with `interface`
- Reuse global namespaces: `Api.*`, `NaiveUI.*`, `App.*`, `CommonType.*` — do not redefine DTOs in views
- Enable status: string union `'1' | '2'` (1 enable, 2 disable)
- Clone form defaults with `jsonClone` from `@sa/utils`

### Typings template

```ts
declare namespace Api {
  namespace Demo {
    type CommonSearchParams = Pick<Common.PaginatingCommonParams, 'current' | 'size'>;

    type Item = Common.CommonRecord<{
      name: string;
    }>;

    type SearchParams = CommonType.RecordNullable<Pick<Item, 'name' | 'status'> & CommonSearchParams>;

    type List = Common.PaginatingQueryRecord<Item>;
  }
}
```

### API template

```ts
import { request } from '../request';

export function fetchGetItemList(params?: Api.Demo.SearchParams) {
  return request<Api.Demo.List>({
    url: '/demo/getList',
    method: 'get',
    params
  });
}
```

Use only `src/service/request` (`createFlatRequest`). Call sites destructure `{ error, data }`. Do not call axios directly.

### API path convention（与后端对齐）

- `/auth/*` — 登录、info、user-routes、logout、password
- `/platform/*` — 租户 / 角色 / 菜单 / 权限
- `/system/*` — 用户 / 附件 / platform-user
- 动作：`list|add|modify|delete`（及 `detail|tree|status`）；方法仅 `get` / `post`
- 按钮权限：`useAuth().hasAuth('tenant:add')`；`buttons` 含 `*` 时全部放行
- 菜单 `hideInMenu`：`1` 显示 / `2` 隐藏（侧栏）；空 `fUrl` 的菜单不进动态路由

### Constants template

```ts
export const enableStatusRecord: Record<Api.Common.EnableStatus, App.I18n.I18nKey> = {
  '1': 'page.manage.common.status.enable',
  '2': 'page.manage.common.status.disable'
};

export const enableStatusOptions = transformRecordToOption(enableStatusRecord);
```

### List page (index.vue)

```ts
const searchParams = ref<Api.Demo.SearchParams>({
  current: 1,
  size: 10,
  name: null,
  status: null
});

const { columns, columnChecks, data, getData, getDataByPage, loading, mobilePagination } = useNaivePaginatedTable({
  api: () => fetchGetItemList(searchParams.value),
  transform: response => defaultTransform(response),
  onPaginationParamsChange: params => {
    searchParams.value.current = params.page;
    searchParams.value.size = params.pageSize;
  },
  columns: () => [
    /* selection, index, fields, NTag enums, operate with NButton + NPopconfirm */
  ]
});

const { drawerVisible, operateType, editingData, handleAdd, handleEdit, checkedRowKeys, onDeleted } = useTableOperate(
  data,
  'id',
  getData
);
```

Layout:

- Root: `min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto`
- Search module: `v-model:model="searchParams"` + `@search="getDataByPage"`
- Card: `NCard` + `TableHeaderOperation` + `NDataTable` with `remote`, `:row-key`, `mobilePagination`, `:flex-height="!appStore.isMobile"`
- Drawer: `v-model:visible` + `:operate-type` + `:row-data` + `@submitted="getDataByPage"`
- Copy via `$t`; enum cells via `NTag` + `*Record` + `$t`

### Table columns (hard rules)

无特殊说明时，**所有业务表格列必须遵守**：

1. **文字居中**：每列 `align: 'center'`（含表头与单元格）。例外：树表带 `tree: true` 的名称列可用 `align: 'left'` 以保留缩进。
2. **列宽平均分配**：业务数据列**禁止**随意写死 `width` / `minWidth`，交给表格均分剩余宽度。仅允许固定宽度的列：
   - `selection`：`width: 48`
   - `index`：`width: 64`
   - `operate`：按按钮数量给固定 `width`（如单按钮 100、双按钮 160、三按钮 220）
3. **横向滚动**：桌面默认不绑死 `:scroll-x` 常数（避免破坏均分）；仅移动端需要时可 `:scroll-x="appStore.isMobile ? scrollX : undefined"`。
4. **文件大小**：存库为字节时，展示用 `formatFileSizeMB`（`@/utils/common`）换算为 `x.xx MB`，勿直接输出原始字节。

```ts
columns: () => [
  { type: 'selection', align: 'center', width: 48 },
  { key: 'index', title: $t('common.index'), align: 'center', width: 64, render: (_, i) => i + 1 },
  { key: 'name', title: $t('...'), align: 'center' }, // 无 width/minWidth
  { key: 'operate', title: $t('common.operate'), align: 'center', width: 180, render: ... }
]
```

### Search module

- `defineModel<Api.Demo.SearchParams>('model', { required: true })`
- `useNaiveForm` + optional `patternRules` inside `computed` for locale reactivity
- UI: `NCard` → `NCollapse` → `NForm` → `NGrid` / `NFormItemGi` with `span="24 s:12 m:6"`
- Reset: restore default via `jsonClone(toRaw(model))` + `restoreValidation`; Search: `validate` then `emit('search')`

### Operate drawer

- Props: `operateType: NaiveUI.TableOperateType` (`add` | `edit`), `rowData?`
- `defineModel<boolean>('visible')`; width ~360; `NDrawer` + `NDrawerContent`
- `watch(visible)` when open: `createDefaultModel` / assign `jsonClone(rowData)`, `restoreValidation`, load select options
- Submit: `validate` → API → `window.$message?.success($t('common.updateSuccess'))` → close → `emit('submitted')`
- Rules: `useFormRules().defaultRequiredRule` / `patternRules`

### Style

- Prefer UnoCSS utilities: `flex-center`, `gap-8px`, `card-wrapper`, `sm:flex-1-hidden`, `text-icon`
- Avoid large scoped CSS; icons via `icon-*` / Iconify prefixes from env

### Auth

```ts
const { hasAuth } = useAuth();
// hasAuth('btn_code') or hasAuth(['a', 'b'])
```

Gate buttons with backend button aliases; do not invent a parallel permission system.

## Commands

| Task            | Command                          |
| --------------- | -------------------------------- |
| Install         | `pnpm i`                         |
| Dev             | `pnpm dev`                       |
| Dev (prod mode) | `pnpm dev:prod`                  |
| Build           | `pnpm build` / `pnpm build:test` |
| Typecheck       | `pnpm typecheck`                 |
| Lint            | `pnpm lint`                      |
| Format          | `pnpm fmt`                       |
| Gen routes      | `pnpm gen-route`                 |
| Commit          | `pnpm commit` / `pnpm commit:zh` |

## Verification checklist

After changes, in order:

1. `pnpm typecheck`
2. `pnpm lint`
3. `pnpm fmt` (no leftover format diff)
4. `pnpm dev` smoke: route entry, list/search/drawer, `hasAuth` buttons
5. If API contract changed: align typings; adjust `.env*` success code / proxy target only as needed

## Hard rules

- pnpm only; never hand-edit Elegant Router generated files
- i18n required (zh-cn + en-us together); no hardcoded UI Chinese/English in views
- New CRUD must be search + table + operate trio — do not dump large forms into `index.vue`
- NaiveUI + UnoCSS only for UI styling; do not add a competing component library
- Custom backend: change env / API urls only; keep flat-request interceptor pattern

## References

- Overview: [README.md](../../../README.md)
- Table hooks: [src/hooks/common/table.ts](../../../src/hooks/common/table.ts)
- Request client: [src/service/request/index.ts](../../../src/service/request/index.ts)
- Formatter: [.oxfmtrc.json](../../../.oxfmtrc.json)
- SoybeanJS standard: https://docs.soybeanjs.cn/zh/standard
