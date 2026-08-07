<script setup lang="tsx">
import { ref } from 'vue';
import dayjs from 'dayjs';
import { NButton, NPopconfirm, NTag } from 'naive-ui';
import { enableStatusRecord } from '@/constants/business';
import { fetchGetTenantList, fetchUpdateTenantStatus } from '@/service/api';
import { useAppStore } from '@/store/modules/app';
import { useAuth } from '@/hooks/business/auth';
import { defaultTransform, useNaivePaginatedTable, useTableOperate } from '@/hooks/common/table';
import { $t } from '@/locales';
import TenantOperateDrawer from './modules/tenant-operate-drawer.vue';
import TenantSearch from './modules/tenant-search.vue';

defineOptions({
  name: 'SystemTenant'
});

const appStore = useAppStore();
const { hasAuth } = useAuth();

const searchParams = ref<Api.SystemManage.TenantSearchParams>({
  current: 1,
  size: 10,
  keyword: null,
  status: null
});

const { columns, columnChecks, data, getData, getDataByPage, loading, mobilePagination } = useNaivePaginatedTable({
  api: () => fetchGetTenantList(searchParams.value),
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
      key: 'code',
      title: $t('page.system.tenant.code'),
      align: 'center'
    },
    {
      key: 'name',
      title: $t('page.system.tenant.name'),
      align: 'center'
    },
    {
      key: 'maxUsers',
      title: $t('page.system.tenant.maxUsers'),
      align: 'center'
    },
    {
      key: 'maxAccounts',
      title: $t('page.system.tenant.maxAccounts'),
      align: 'center'
    },
    {
      key: 'expireAt',
      title: $t('page.system.tenant.expireAt'),
      align: 'center',
      render: row => (row.expireAt ? dayjs(row.expireAt).format('YYYY-MM-DD HH:mm') : '-')
    },
    {
      key: 'status',
      title: $t('page.system.tenant.status'),
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
          {hasAuth('tenant:modify') && (
            <NButton type="primary" ghost size="small" onClick={() => edit(row.id)}>
              {$t('common.edit')}
            </NButton>
          )}
          {hasAuth('tenant:status') && (
            <NPopconfirm onPositiveClick={() => handleToggleStatus(row)}>
              {{
                default: () => $t('page.system.tenant.toggleStatusConfirm'),
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

async function handleToggleStatus(row: Api.SystemManage.Tenant) {
  const newStatus: Api.SystemManage.EnableStatus = row.status === 1 ? 2 : 1;
  const { error } = await fetchUpdateTenantStatus(row.id, newStatus);

  if (!error) {
    window.$message?.success($t('common.updateSuccess'));
    await getDataByPage();
  }
}
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <TenantSearch v-model:model="searchParams" @search="getDataByPage" />
    <NCard :title="$t('page.system.tenant.title')" :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
      <template #header-extra>
        <TableHeaderOperation
          v-model:columns="columnChecks"
          :disabled-delete="checkedRowKeys.length === 0"
          :loading="loading"
          @refresh="getDataByPage"
        >
          <template #default>
            <NButton v-if="hasAuth('tenant:add')" size="small" ghost type="primary" @click="handleAdd">
              <template #icon>
                <icon-ic-round-plus class="text-icon" />
              </template>
              {{ $t('common.add') }}
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
      <TenantOperateDrawer
        v-model:visible="drawerVisible"
        :operate-type="operateType"
        :row-data="editingData"
        @submitted="getDataByPage"
      />
    </NCard>
  </div>
</template>

<style scoped></style>
