<script setup lang="tsx">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { useBoolean } from '@sa/hooks';
import { NButton, NPopconfirm, NTag } from 'naive-ui';
import { enableStatusRecord } from '@/constants/business';
import { fetchGetAdminList, fetchUpdateAdminStatus } from '@/service/api';
import { useAppStore } from '@/store/modules/app';
import { useTenantStore } from '@/store/modules/tenant';
import { useAuth } from '@/hooks/business/auth';
import { defaultTransform, useNaivePaginatedTable, useTableOperate } from '@/hooks/common/table';
import { $t } from '@/locales';
import AdminOperateDrawer from './modules/admin-operate-drawer.vue';
import AdminSearch from './modules/admin-search.vue';
import PlatformUserDrawer from './modules/platform-user-drawer.vue';

defineOptions({
  name: 'SystemAdmin'
});

const appStore = useAppStore();
const tenantStore = useTenantStore();
const { hasAuth } = useAuth();
const { bool: platformDrawerVisible, setTrue: openPlatformDrawer } = useBoolean();

const searchParams = ref<Api.SystemManage.AdminSearchParams>({
  current: 1,
  size: 10,
  keyword: null,
  status: null
});

const { columns, columnChecks, data, getData, getDataByPage, loading, mobilePagination } = useNaivePaginatedTable({
  api: async () => {
    if (!tenantStore.hasTenantContext) {
      return {
        data: { records: [], current: 1, size: 10, total: 0 },
        error: null,
        response: null
      } as unknown as Awaited<ReturnType<typeof fetchGetAdminList>>;
    }
    return fetchGetAdminList(searchParams.value);
  },
  transform: response => defaultTransform(response),
  onPaginationParamsChange: params => {
    searchParams.value.current = params.page;
    searchParams.value.size = params.pageSize;
  },
  columns: () => [
    {
      type: 'selection',
      align: 'center',
      width: 48
    },
    {
      key: 'index',
      title: $t('common.index'),
      align: 'center',
      width: 64,
      render: (_, index) => index + 1
    },
    {
      key: 'account',
      title: $t('page.system.admin.account'),
      align: 'center'
    },
    {
      key: 'nickName',
      title: $t('page.system.admin.nickName'),
      align: 'center'
    },
    {
      key: 'realName',
      title: $t('page.system.admin.realName'),
      align: 'center'
    },
    {
      key: 'phone',
      title: $t('page.system.admin.phone'),
      align: 'center'
    },
    {
      key: 'email',
      title: $t('page.system.admin.email'),
      align: 'center'
    },
    {
      key: 'status',
      title: $t('page.system.admin.status'),
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
          {hasAuth('admin:modify') && (
            <NButton type="primary" ghost size="small" onClick={() => edit(row.id)}>
              {$t('common.edit')}
            </NButton>
          )}
          {hasAuth('admin:status') && (
            <NPopconfirm onPositiveClick={() => handleToggleStatus(row)}>
              {{
                default: () => $t('page.system.admin.toggleStatusConfirm'),
                trigger: () => (
                  <NButton type="warning" ghost size="small">
                    {row.status === 1 ? $t('page.system.common.status.disable') : $t('page.system.common.status.enable')}
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

const { drawerVisible, operateType, editingData, handleAdd, handleEdit, checkedRowKeys } = useTableOperate(
  data,
  'id',
  getData
);

function edit(id: number) {
  handleEdit(id);
}

async function handleToggleStatus(row: Api.SystemManage.Admin) {
  const newStatus: Api.SystemManage.EnableStatus = row.status === 1 ? 2 : 1;
  const { error } = await fetchUpdateAdminStatus(row.id, newStatus);

  if (!error) {
    window.$message?.success($t('common.updateSuccess'));
    await getDataByPage();
  }
}

function handleTenantChanged() {
  getDataByPage();
}

watch(
  () => tenantStore.currentTenantId,
  () => {
    getDataByPage();
  }
);

onMounted(() => {
  window.addEventListener('tenant-changed', handleTenantChanged);
});

onUnmounted(() => {
  window.removeEventListener('tenant-changed', handleTenantChanged);
});
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <NAlert v-if="!tenantStore.hasTenantContext" type="warning" :bordered="false">
      {{ $t('page.system.tenant.selectRequired') }}
    </NAlert>
    <AdminSearch v-model:model="searchParams" @search="getDataByPage" />
    <NCard :title="$t('page.system.admin.title')" :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
      <template #header-extra>
        <TableHeaderOperation v-model:columns="columnChecks" :loading="loading" @refresh="getDataByPage">
          <template #default>
            <NButton v-if="hasAuth('admin:add')" size="small" ghost type="primary" @click="handleAdd">
              <template #icon>
                <icon-ic-round-plus class="text-icon" />
              </template>
              {{ $t('common.add') }}
            </NButton>
            <NButton v-if="hasAuth('platform-user:add')" size="small" ghost type="info" @click="openPlatformDrawer">
              {{ $t('page.system.admin.addPlatformUser') }}
            </NButton>
          </template>
        </TableHeaderOperation>
      </template>
      <NDataTable
        v-model:checked-row-keys="checkedRowKeys"
        :columns="columns"
        :data="data"
        size="small"
        :flex-height="!appStore.isMobile"
        :scroll-x="appStore.isMobile ? 960 : undefined"
        :loading="loading"
        remote
        :row-key="row => row.id"
        :pagination="mobilePagination"
        class="sm:h-full"
      />
      <AdminOperateDrawer
        v-model:visible="drawerVisible"
        :operate-type="operateType"
        :row-data="editingData"
        @submitted="getDataByPage"
      />
      <PlatformUserDrawer v-model:visible="platformDrawerVisible" @submitted="getDataByPage" />
    </NCard>
  </div>
</template>

<style scoped></style>
