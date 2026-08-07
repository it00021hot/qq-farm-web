<script setup lang="tsx">
import { ref } from 'vue';
import dayjs from 'dayjs';
import { NButton, NTag } from 'naive-ui';
import { useBoolean } from '@sa/hooks';
import { farmCardStatusRecord, farmCardTypeRecord } from '@/constants/business';
import { fetchGetFarmCardList } from '@/service/api';
import { useAppStore } from '@/store/modules/app';
import { useAuth } from '@/hooks/business/auth';
import { defaultTransform, useNaivePaginatedTable, useTableOperate } from '@/hooks/common/table';
import { $t } from '@/locales';
import CardOperateDrawer from './modules/card-operate-drawer.vue';
import CardRedeemDrawer from './modules/card-redeem-drawer.vue';
import CardSearch from './modules/card-search.vue';

defineOptions({
  name: 'FarmCard'
});

const appStore = useAppStore();
const { hasAuth } = useAuth();
const { bool: redeemVisible, setTrue: openRedeem } = useBoolean();

const searchParams = ref<Api.Farm.CardSearchParams>({
  current: 1,
  size: 10,
  keyword: null,
  cardType: null,
  status: null
});

const { columns, columnChecks, data, getData, getDataByPage, loading, mobilePagination } = useNaivePaginatedTable({
  api: () => fetchGetFarmCardList(searchParams.value),
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
      title: $t('page.farm.card.code'),
      align: 'center'
    },
    {
      key: 'cardType',
      title: $t('page.farm.card.cardType.label'),
      align: 'center',
      render: row => $t(farmCardTypeRecord[row.cardType])
    },
    {
      key: 'value',
      title: $t('page.farm.card.value'),
      align: 'center',
      render: row => (row.value === -1 ? '∞' : row.value)
    },
    {
      key: 'description',
      title: $t('page.farm.card.description'),
      align: 'center'
    },
    {
      key: 'status',
      title: $t('page.farm.card.cardStatus.label'),
      align: 'center',
      render: row => {
        const tagMap: Record<Api.Farm.CardStatus, NaiveUI.ThemeColor> = {
          1: 'success',
          2: 'info',
          3: 'warning'
        };
        return <NTag type={tagMap[row.status]}>{$t(farmCardStatusRecord[row.status])}</NTag>;
      }
    },
    {
      key: 'usedByTenant',
      title: $t('page.farm.card.usedByTenant'),
      align: 'center',
      render: row => row.usedByTenant || '-'
    },
    {
      key: 'usedAt',
      title: $t('page.farm.card.usedAt'),
      align: 'center',
      render: row => (row.usedAt ? dayjs.unix(row.usedAt).format('YYYY-MM-DD HH:mm') : '-')
    }
  ]
});

const { drawerVisible, handleAdd, checkedRowKeys } = useTableOperate(data, 'id', getData);
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <CardSearch v-model:model="searchParams" @search="getDataByPage" />
    <NCard :title="$t('page.farm.card.title')" :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
      <template #header-extra>
        <TableHeaderOperation
          v-model:columns="columnChecks"
          :disabled-delete="checkedRowKeys.length === 0"
          :loading="loading"
          @refresh="getDataByPage"
        >
          <template #default>
            <NButton v-if="hasAuth('farm-card:add')" size="small" ghost type="primary" @click="handleAdd">
              <template #icon>
                <icon-ic-round-plus class="text-icon" />
              </template>
              {{ $t('page.farm.card.addCard') }}
            </NButton>
            <NButton v-if="hasAuth('farm-card:redeem')" size="small" ghost type="info" @click="openRedeem">
              {{ $t('page.farm.card.redeem') }}
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
        :scroll-x="appStore.isMobile ? 1000 : undefined"
        :loading="loading"
        remote
        :row-key="row => row.id"
        :pagination="mobilePagination"
        class="sm:h-full"
      />
      <CardOperateDrawer v-model:visible="drawerVisible" @submitted="getDataByPage" />
      <CardRedeemDrawer v-model:visible="redeemVisible" @submitted="getDataByPage" />
    </NCard>
  </div>
</template>

<style scoped></style>
