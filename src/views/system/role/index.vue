<script setup lang="tsx">
import { ref, shallowRef } from 'vue';
import { useBoolean } from '@sa/hooks';
import { jsonClone } from '@sa/utils';
import { NButton, NPopconfirm, NTag } from 'naive-ui';
import { enableStatusRecord, roleTypeRecord } from '@/constants/business';
import { fetchDeleteRole, fetchGetRoleTree } from '@/service/api';
import { useAppStore } from '@/store/modules/app';
import { useAuth } from '@/hooks/business/auth';
import { useNaiveTable, useTableOperate } from '@/hooks/common/table';
import { $t } from '@/locales';
import RoleAuthModal from './modules/role-auth-modal.vue';
import RoleOperateDrawer from './modules/role-operate-drawer.vue';

defineOptions({
  name: 'SystemRole'
});

const appStore = useAppStore();
const { hasAuth } = useAuth();

type RoleTreeNode = Api.SystemManage.Role & { children?: RoleTreeNode[] };

function buildRoleTree(items: Api.SystemManage.Role[]): RoleTreeNode[] {
  const map = new Map<number, RoleTreeNode>();
  const roots: RoleTreeNode[] = [];

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

  function prune(nodes: RoleTreeNode[]) {
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

const flatList = shallowRef<Api.SystemManage.Role[]>([]);

const { columns, columnChecks, data, getData, loading, scrollX } = useNaiveTable({
  api: () => fetchGetRoleTree(),
  transform: response => {
    const { data: list, error } = response;

    if (!error && list) {
      flatList.value = list;
      return buildRoleTree(list);
    }

    flatList.value = [];
    return [];
  },
  columns: () => [
    {
      key: 'name',
      title: $t('page.system.role.name'),
      align: 'left',
      tree: true
    },
    {
      key: 'code',
      title: $t('page.system.role.code'),
      align: 'center'
    },
    {
      key: 'roleType',
      title: $t('page.system.role.typeLabel'),
      align: 'center',
      render: row => $t(roleTypeRecord[row.roleType])
    },
    {
      key: 'status',
      title: $t('page.system.role.status'),
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
      width: 260,
      render: row => (
        <div class="flex-center gap-8px">
          {hasAuth('role:modify') && (
            <NButton type="primary" ghost size="small" onClick={() => edit(row.id)}>
              {$t('common.edit')}
            </NButton>
          )}
          {hasAuth('role:auth') && (
            <NButton type="info" ghost size="small" onClick={() => openAuth(row)}>
              {$t('page.system.role.auth')}
            </NButton>
          )}
          {hasAuth('role:delete') && (
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

const { bool: authVisible, setTrue: openAuthModal } = useBoolean();
const authRole = ref<Pick<Api.SystemManage.Role, 'id' | 'name'>>({ id: 0, name: '' });
const parentId = ref<number | undefined>();

function edit(id: number) {
  operateType.value = 'edit';
  // 用扁平列表克隆，避免树节点 Proxy / children 导致 structuredClone 失败
  const item = flatList.value.find(row => row.id === id) || null;
  editingData.value = item ? jsonClone(item) : null;
  drawerVisible.value = true;
}

function openAuth(row: Api.SystemManage.Role) {
  authRole.value = { id: row.id, name: row.name };
  openAuthModal();
}

async function handleDelete(id: number) {
  const { error } = await fetchDeleteRole(id);

  if (!error) {
    await onDeleted();
  }
}

function handleAddRole() {
  parentId.value = undefined;
  handleAdd();
}
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <NCard :title="$t('page.system.role.title')" :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
      <template #header-extra>
        <TableHeaderOperation v-model:columns="columnChecks" :loading="loading" @refresh="getData">
          <template #default>
            <NButton v-if="hasAuth('role:add')" size="small" ghost type="primary" @click="handleAddRole">
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
      <RoleOperateDrawer
        v-model:visible="drawerVisible"
        :operate-type="operateType"
        :row-data="editingData"
        :parent-id="parentId"
        @submitted="getData"
      />
      <RoleAuthModal
        v-model:visible="authVisible"
        :role-id="authRole.id"
        :role-name="authRole.name"
        @submitted="getData"
      />
    </NCard>
  </div>
</template>

<style scoped></style>
