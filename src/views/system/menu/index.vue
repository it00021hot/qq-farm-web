<script setup lang="tsx">
import { ref, shallowRef } from 'vue';
import { jsonClone } from '@sa/utils';
import { NButton, NPopconfirm, NTag } from 'naive-ui';
import { enableStatusRecord, resourceTypeRecord } from '@/constants/business';
import { fetchDeleteMenu, fetchGetMenuTree } from '@/service/api';
import { useAppStore } from '@/store/modules/app';
import { useAuth } from '@/hooks/business/auth';
import { useNaiveTable, useTableOperate } from '@/hooks/common/table';
import { $t } from '@/locales';
import MenuOperateDrawer from './modules/menu-operate-drawer.vue';

defineOptions({
  name: 'SystemMenu'
});

const appStore = useAppStore();
const { hasAuth } = useAuth();

type MenuTreeNode = Api.SystemManage.Menu & { children?: MenuTreeNode[] };

function buildMenuTree(items: Api.SystemManage.Menu[]): MenuTreeNode[] {
  const map = new Map<number, MenuTreeNode>();
  const roots: MenuTreeNode[] = [];

  items.forEach(item => {
    map.set(item.id, { ...item, children: [] });
  });

  items.forEach(item => {
    const node = map.get(item.id)!;
    if (item.parentId && map.has(item.parentId)) {
      map.get(item.parentId)!.children!.push(node);
    } else {
      roots.push(node);
    }
  });

  function prune(nodes: MenuTreeNode[]) {
    nodes.forEach(node => {
      if (node.children?.length === 0) {
        delete node.children;
      } else if (node.children) {
        prune(node.children);
      }
    });
  }

  prune(roots);
  return roots;
}

const flatList = shallowRef<Api.SystemManage.Menu[]>([]);

const { columns, columnChecks, data, getData, loading, scrollX } = useNaiveTable({
  api: () => fetchGetMenuTree(),
  transform: response => {
    const { data: list, error } = response;

    if (!error && list) {
      flatList.value = list;
      return buildMenuTree(list);
    }

    flatList.value = [];
    return [];
  },
  columns: () => [
    {
      key: 'name',
      title: $t('page.system.menu.name'),
      align: 'left',
      tree: true
    },
    {
      key: 'alias',
      title: $t('page.system.menu.alias'),
      align: 'center'
    },
    {
      key: 'resourceType',
      title: $t('page.system.menu.typeLabel'),
      align: 'center',
      render: row => {
        const tagMap: Record<Api.SystemManage.Menu['resourceType'], NaiveUI.ThemeColor> = {
          1: 'default',
          2: 'primary',
          3: 'info'
        };

        return <NTag type={tagMap[row.resourceType]}>{$t(resourceTypeRecord[row.resourceType])}</NTag>;
      }
    },
    {
      key: 'fUrl',
      title: $t('page.system.menu.fUrl'),
      align: 'center',
      ellipsis: { tooltip: true }
    },
    {
      key: 'bUrl',
      title: $t('page.system.menu.bUrl'),
      align: 'center',
      ellipsis: { tooltip: true }
    },
    {
      key: 'hideInMenu',
      title: $t('page.system.menu.hideInMenu'),
      align: 'center',
      render: row =>
        row.hideInMenu === 2 ? $t('page.system.menu.hideInMenuHide') : $t('page.system.menu.hideInMenuShow')
    },
    {
      key: 'status',
      title: $t('page.system.menu.status'),
      align: 'center',
      render: row => {
        const tagMap: Record<Api.SystemManage.EnableStatus, NaiveUI.ThemeColor> = {
          1: 'success',
          2: 'warning'
        };

        return <NTag type={tagMap[row.status]}>{$t(enableStatusRecord[row.status])}</NTag>;
      }
    },
    {
      key: 'operate',
      title: $t('common.operate'),
      align: 'center',
      width: 180,
      render: row => (
        <div class="flex-center gap-8px">
          {hasAuth('menu:modify') && (
            <NButton type="primary" ghost size="small" onClick={() => edit(row.id)}>
              {$t('common.edit')}
            </NButton>
          )}
          {hasAuth('menu:delete') && (
            <NPopconfirm onPositiveClick={() => handleDelete(row.id)}>
              {{
                default: () => $t('common.confirmDelete'),
                trigger: () => (
                  <NButton type="error" ghost size="small">
                    {$t('common.delete')}
                  </NButton>
                )
              }}
            </NPopconfirm>
          )}
        </div>
      )
    }
  ]
});

const { drawerVisible, operateType, editingData, handleAdd, onDeleted } = useTableOperate(data, 'id', getData);

const parentId = ref<number | undefined>();

function edit(id: number) {
  operateType.value = 'edit';
  // 用扁平列表克隆，避免树节点 Proxy / children 导致 structuredClone 失败
  const item = flatList.value.find(row => row.id === id) || null;
  editingData.value = item ? jsonClone(item) : null;
  drawerVisible.value = true;
}

async function handleDelete(id: number) {
  const { error } = await fetchDeleteMenu(id);

  if (!error) {
    await onDeleted();
  }
}

function handleAddMenu() {
  parentId.value = undefined;
  handleAdd();
}
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <NCard :title="$t('page.system.menu.title')" :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
      <template #header-extra>
        <TableHeaderOperation v-model:columns="columnChecks" :loading="loading" @refresh="getData">
          <template #default>
            <NButton v-if="hasAuth('menu:add')" size="small" ghost type="primary" @click="handleAddMenu">
              <template #icon>
                <icon-ic-round-plus class="text-icon" />
              </template>
              {{ $t('common.add') }}
            </NButton>
          </template>
        </TableHeaderOperation>
      </template>
      <NDataTable
        :columns="columns"
        :data="data"
        size="small"
        :flex-height="!appStore.isMobile"
        :scroll-x="appStore.isMobile ? scrollX : undefined"
        :loading="loading"
        :row-key="row => row.id"
        default-expand-all
        class="sm:h-full"
      />
      <MenuOperateDrawer
        v-model:visible="drawerVisible"
        :operate-type="operateType"
        :row-data="editingData"
        :parent-id="parentId"
        @submitted="getData"
      />
    </NCard>
  </div>
</template>

<style scoped></style>
