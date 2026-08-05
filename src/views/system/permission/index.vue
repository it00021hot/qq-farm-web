<script setup lang="tsx">
import { onMounted, ref, watch } from 'vue';
import type { FlatResponseData } from '@sa/axios';
import {
  fetchGetAssignableRoles,
  fetchGetPermissionApis,
  fetchGetRolePolicies,
  fetchGetRoleTree,
  fetchReloadPermission
} from '@/service/api';
import { useAppStore } from '@/store/modules/app';
import { useAuth } from '@/hooks/business/auth';
import { useNaiveTable } from '@/hooks/common/table';
import { $t } from '@/locales';

defineOptions({
  name: 'SystemPermission'
});

const appStore = useAppStore();
const { hasAuth } = useAuth();

const activeTab = ref('apis');
const roleId = ref<number | null>(null);
const roleOptions = ref<CommonType.Option<number>[]>([]);
const reloading = ref(false);
const loadingPolicies = ref(false);
const policyData = ref<Api.SystemManage.RolePolicyItem[]>([]);

const { columns, columnChecks, data, getData, loading, scrollX } = useNaiveTable({
  api: () => fetchGetPermissionApis(),
  transform: (
    response: FlatResponseData<App.Service.Response<Api.SystemManage.APIItem[]>, Api.SystemManage.APIItem[]>
  ) => {
    const { data: list, error } = response;
    if (!error && Array.isArray(list)) {
      return list;
    }
    return [];
  },
  columns: () => [
    {
      key: 'index',
      title: $t('common.index'),
      align: 'center',
      width: 64,
      render: (_, index) => index + 1
    },
    {
      key: 'method',
      title: $t('page.system.permission.method'),
      align: 'center'
    },
    {
      key: 'path',
      title: $t('page.system.permission.path'),
      align: 'center',
      ellipsis: { tooltip: true }
    },
    {
      key: 'name',
      title: $t('page.system.permission.name'),
      align: 'center'
    }
  ]
});

const policyColumns = [
  {
    key: 'index',
    title: $t('common.index'),
    align: 'center' as const,
    width: 64,
    render: (_: Api.SystemManage.RolePolicyItem, index: number) => index + 1
  },
  {
    key: 'source',
    title: $t('page.system.permission.source'),
    align: 'center' as const
  },
  {
    key: 'ptype',
    title: $t('page.system.permission.ptype'),
    align: 'center' as const
  },
  {
    key: 'v0',
    title: $t('page.system.permission.roleId'),
    align: 'center' as const,
    ellipsis: { tooltip: true }
  },
  {
    key: 'v1',
    title: $t('page.system.permission.path'),
    align: 'center' as const,
    ellipsis: { tooltip: true }
  },
  {
    key: 'v2',
    title: $t('page.system.permission.method'),
    align: 'center' as const,
    ellipsis: { tooltip: true }
  }
];

async function loadRoleOptions() {
  const { data: tree, error } = await fetchGetRoleTree();
  if (!error && tree?.length) {
    roleOptions.value = tree.map(item => ({
      label: `${item.name} (${item.code})`,
      value: item.id
    }));
  } else {
    const { data: assignable } = await fetchGetAssignableRoles();
    roleOptions.value = (assignable || []).map(item => ({
      label: `${item.name} (${item.code})`,
      value: item.id
    }));
  }

  if (!roleId.value && roleOptions.value.length) {
    roleId.value = roleOptions.value[0].value;
  }
}

async function loadPolicies() {
  if (!roleId.value) {
    policyData.value = [];
    return;
  }

  loadingPolicies.value = true;
  const { error, data: policies } = await fetchGetRolePolicies(roleId.value);
  loadingPolicies.value = false;

  if (!error) {
    policyData.value = policies || [];
  }
}

async function handleReload() {
  reloading.value = true;
  const { error } = await fetchReloadPermission();
  reloading.value = false;

  if (!error) {
    window.$message?.success($t('page.system.permission.reloadSuccess'));
    await getData();
    await loadPolicies();
  }
}

watch(roleId, () => {
  if (activeTab.value === 'policies') {
    loadPolicies();
  }
});

watch(activeTab, tab => {
  if (tab === 'policies') {
    loadPolicies();
  }
});

onMounted(async () => {
  await loadRoleOptions();
});
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <NCard
      :title="$t('page.system.permission.title')"
      :bordered="false"
      size="small"
      class="card-wrapper sm:flex-1-hidden"
    >
      <template #header-extra>
        <NButton
          v-if="hasAuth('permission:reload')"
          size="small"
          type="warning"
          :loading="reloading"
          @click="handleReload"
        >
          {{ $t('page.system.permission.reload') }}
        </NButton>
      </template>

      <div class="h-full flex-col-stretch gap-12px overflow-hidden">
        <NAlert type="info" :bordered="false" class="shrink-0">
          {{ $t('page.system.permission.hint') }}
        </NAlert>

        <NTabs v-model:value="activeTab" type="line" animated class="h-full flex-col-stretch">
          <NTabPane name="apis" :tab="$t('page.system.permission.apiList')" class="h-full">
            <div class="h-full min-h-360px flex-col-stretch gap-16px">
              <TableHeaderOperation v-model:columns="columnChecks" :loading="loading" @refresh="getData">
                <template #default>
                  <span class="hidden" />
                </template>
              </TableHeaderOperation>
              <NDataTable
                :columns="columns"
                :data="data"
                size="small"
                :flex-height="!appStore.isMobile"
                :scroll-x="appStore.isMobile ? scrollX : undefined"
                :loading="loading"
                :row-key="row => `${row.method}-${row.path}`"
                class="sm:flex-1-hidden"
              />
            </div>
          </NTabPane>

          <NTabPane name="policies" :tab="$t('page.system.permission.rolePolicies')" class="h-full">
            <div class="h-full min-h-360px flex-col-stretch gap-16px">
              <NSpace align="center">
                <NSelect
                  v-model:value="roleId"
                  class="w-280px"
                  filterable
                  :options="roleOptions"
                  :placeholder="$t('page.system.permission.roleId')"
                />
                <NButton type="primary" ghost :loading="loadingPolicies" @click="loadPolicies">
                  {{ $t('common.search') }}
                </NButton>
              </NSpace>
              <NDataTable
                :columns="policyColumns"
                :data="policyData"
                size="small"
                :flex-height="!appStore.isMobile"
                :loading="loadingPolicies"
                :row-key="row => row.id"
                class="sm:flex-1-hidden"
              />
            </div>
          </NTabPane>
        </NTabs>
      </div>
    </NCard>
  </div>
</template>

<style scoped>
:deep(.n-tabs) {
  display: flex;
  flex-direction: column;
  height: 100%;
}

:deep(.n-tabs-pane-wrapper),
:deep(.n-tab-pane) {
  flex: 1;
  min-height: 0;
  height: 100%;
}
</style>
