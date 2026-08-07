<script setup lang="tsx">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import {
  NButton,
  NCard,
  NDataTable,
  NEmpty,
  NPopconfirm,
  NSpace,
  NSpin,
  NTag,
  useMessage
} from 'naive-ui';
import {
  fetchFarmOperate,
  fetchGetFarmBag,
  fetchGetFarmLands,
  fetchGetFarmStatusDetail,
  fetchSellFarmBag
} from '@/service/api';
import { useFarmAccountStore } from '@/store/modules/farm-account';
import { resolveCatalogImage } from '@/views/farm/game-config/shared';
import {
  landCardClass,
  landGridStyle,
  landIdLabel,
  soilLabel,
  soilLevelClass,
  visibleLands
} from '@/views/farm/shared/land-display';
import { $t } from '@/locales';

defineOptions({
  name: 'FarmPersonal'
});

type OperateOp = Api.Farm.OperateParams['op'];

const farmAccountStore = useFarmAccountStore();
const message = useMessage();

const landsLoading = ref(false);
const bagLoading = ref(false);
const operating = ref(false);
const sellingId = ref<number | null>(null);
const batchSelling = ref(false);
const checkedBagKeys = ref<Array<string | number>>([]);
const statusLoading = ref(false);
const connected = ref(false);

const lands = ref<Api.Farm.LandRow[]>([]);
const summary = ref<Api.Farm.LandSummary | null>(null);
const bagItems = ref<Api.Farm.BagItem[]>([]);
const originalItems = ref<Api.Farm.BagOriginalItem[]>([]);

const operateOptions: { op: OperateOp; type: NaiveUI.ThemeColor }[] = [
  { op: 'harvest', type: 'success' },
  { op: 'clear', type: 'info' },
  { op: 'plant', type: 'primary' },
  { op: 'upgrade', type: 'warning' },
  { op: 'all', type: 'error' }
];

const summaryTags = computed(() => {
  const s = summary.value;
  if (!s) return [];
  return [
    { key: 'harvestable', label: $t('page.farm.personal.summaryHarvestable'), value: s.harvestable, type: 'warning' as const },
    { key: 'growing', label: $t('page.farm.personal.summaryGrowing'), value: s.growing, type: 'success' as const },
    { key: 'empty', label: $t('page.farm.personal.summaryEmpty'), value: s.empty, type: 'default' as const },
    { key: 'dead', label: $t('page.farm.personal.summaryDead'), value: s.dead, type: 'error' as const }
  ];
});

function landStatusTag(status: string, occupiedByMaster?: boolean): { type: NaiveUI.ThemeColor; label: string } {
  if (occupiedByMaster) {
    return { type: 'info', label: $t('page.farm.personal.statusOccupied') };
  }
  const map: Record<string, { type: NaiveUI.ThemeColor; label: string }> = {
    harvestable: { type: 'warning', label: $t('page.farm.personal.statusHarvestable') },
    growing: { type: 'success', label: $t('page.farm.personal.statusGrowing') },
    empty: { type: 'default', label: $t('page.farm.personal.statusEmpty') },
    dead: { type: 'error', label: $t('page.farm.personal.statusDead') },
    locked: { type: 'default', label: $t('page.farm.personal.statusLocked') },
    stealable: { type: 'info', label: $t('page.farm.personal.statusStealable') }
  };
  return map[status] || { type: 'default', label: status || '-' };
}

function landImageSrc(land: Api.Farm.LandRow) {
  return resolveCatalogImage(land.seedImage);
}

function bagImageSrc(item: Api.Farm.BagItem) {
  return resolveCatalogImage(item.image);
}

function growProgress(land: Api.Farm.LandRow) {
  const mature = Number(land.matureInSec || 0);
  const total = Number(land.totalGrowTime || 0);
  if (total <= 0 || mature <= 0) return 0;
  return Math.min(100, Math.max(0, (mature / total) * 100));
}

const displayLands = computed(() => visibleLands(lands.value));

function formatDuration(sec: number) {
  if (sec <= 0) return '';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${h > 0 ? `${h}:` : ''}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function canSell(item: Api.Farm.BagItem) {
  const t = Number(item.itemType || 0);
  return t === 17 || t === 6;
}

async function loadStatus() {
  if (!farmAccountStore.currentAccountId) {
    connected.value = false;
    return;
  }
  statusLoading.value = true;
  try {
    const { data, error } = await fetchGetFarmStatusDetail(farmAccountStore.currentAccountId);
    connected.value = !error && data?.runStatus === 1;
  } finally {
    statusLoading.value = false;
  }
}

async function loadLands() {
  if (!farmAccountStore.currentAccountId || !connected.value) {
    lands.value = [];
    summary.value = null;
    return;
  }
  landsLoading.value = true;
  try {
    const { data, error } = await fetchGetFarmLands(farmAccountStore.currentAccountId);
    if (!error && data) {
      lands.value = data.lands || [];
      summary.value = data.summary || null;
    }
  } finally {
    landsLoading.value = false;
  }
}

async function loadBag() {
  if (!farmAccountStore.currentAccountId || !connected.value) {
    bagItems.value = [];
    originalItems.value = [];
    return;
  }
  bagLoading.value = true;
  try {
    const { data, error } = await fetchGetFarmBag(farmAccountStore.currentAccountId);
    if (!error && data) {
      bagItems.value = data.items || [];
      originalItems.value = data.originalItems || [];
      checkedBagKeys.value = [];
    }
  } finally {
    bagLoading.value = false;
  }
}

async function refreshAll() {
  await farmAccountStore.loadAccounts();
  await loadStatus();
  await Promise.all([loadLands(), loadBag()]);
}

async function handleOperate(op: OperateOp) {
  if (!farmAccountStore.currentAccountId) return;
  operating.value = true;
  try {
    const { error } = await fetchFarmOperate({ accountId: farmAccountStore.currentAccountId, op });
    if (error) {
      message.error(error.message || $t('page.farm.personal.operateFailed'));
      return;
    }
    message.success($t('page.farm.personal.operateSuccess'));
    await Promise.all([loadLands(), loadBag()]);
  } finally {
    operating.value = false;
  }
}

async function handleSell(item: Api.Farm.BagItem) {
  if (!farmAccountStore.currentAccountId) return;
  const sellItems = originalItems.value.filter(it => Number(it.id) === Number(item.id));
  if (sellItems.length === 0) {
    message.warning($t('page.farm.personal.sellNotFound'));
    return;
  }
  sellingId.value = item.id;
  try {
    const { error } = await fetchSellFarmBag({
      accountId: farmAccountStore.currentAccountId,
      items: sellItems
    });
    if (error) {
      message.error(error.message || $t('page.farm.personal.sellFailed'));
      return;
    }
    message.success($t('page.farm.personal.sellSuccess'));
    await loadBag();
  } finally {
    sellingId.value = null;
  }
}

const sellableBagItems = computed(() => bagItems.value.filter(canSell));

const checkedSellableCount = computed(
  () => checkedBagKeys.value.filter(key => sellableBagItems.value.some(item => item.id === Number(key))).length
);

async function handleBatchSell() {
  if (!farmAccountStore.currentAccountId) return;
  const selectedIds = new Set(checkedBagKeys.value.map(Number));
  const sellItems = originalItems.value.filter(
    it => selectedIds.has(Number(it.id)) && sellableBagItems.value.some(bag => Number(bag.id) === Number(it.id))
  );
  if (sellItems.length === 0) {
    message.warning($t('page.farm.personal.batchSellEmpty'));
    return;
  }
  batchSelling.value = true;
  try {
    const { error } = await fetchSellFarmBag({
      accountId: farmAccountStore.currentAccountId,
      items: sellItems
    });
    if (error) {
      message.error(error.message || $t('page.farm.personal.sellFailed'));
      return;
    }
    message.success($t('page.farm.personal.batchSellSuccess'));
    checkedBagKeys.value = [];
    await loadBag();
  } finally {
    batchSelling.value = false;
  }
}

const bagColumns = computed<NaiveUI.TableColumn<Api.Farm.BagItem>[]>(() => [
  {
    type: 'selection',
    disabled: (row: Api.Farm.BagItem) => !canSell(row)
  },
  {
    key: 'index',
    title: $t('common.index'),
    align: 'center',
    width: 64,
    render: (_, index) => index + 1
  },
  {
    key: 'name',
    title: $t('page.farm.personal.itemName'),
    align: 'center',
    render: row => (
      <div class="flex-y-center justify-center gap-8px">
        {bagImageSrc(row) ? (
          <img src={bagImageSrc(row)} alt={row.name} class="h-28px w-28px object-contain" />
        ) : null}
        <span>{row.name || `#${row.id}`}</span>
      </div>
    )
  },
  {
    key: 'count',
    title: $t('page.farm.personal.itemCount'),
    align: 'center',
    render: row => row.hoursText || row.count
  },
  {
    key: 'price',
    title: $t('page.farm.personal.itemPrice'),
    align: 'center',
    render: row => (row.price ? `${row.price}${row.priceUnit || ''}` : '-')
  },
  {
    key: 'operate',
    title: $t('common.operate'),
    align: 'center',
    width: 120,
    render: row =>
      canSell(row) ? (
        <NPopconfirm onPositiveClick={() => handleSell(row)}>
          {{
            default: () => $t('page.farm.personal.sellConfirm'),
            trigger: () => (
              <NButton size="small" type="error" ghost loading={sellingId.value === row.id}>
                {$t('page.farm.personal.sell')}
              </NButton>
            )
          }}
        </NPopconfirm>
      ) : (
        '-'
      )
  }
]);

let tickTimer: ReturnType<typeof setInterval> | null = null;
let refreshTimer: ReturnType<typeof setInterval> | null = null;

function startTimers() {
  stopTimers();
  tickTimer = setInterval(() => {
    lands.value = lands.value.map(land =>
      land.matureInSec && land.matureInSec > 0 ? { ...land, matureInSec: land.matureInSec - 1 } : land
    );
  }, 1000);
  refreshTimer = setInterval(() => {
    void loadLands();
    void loadBag();
  }, 60000);
}

function stopTimers() {
  if (tickTimer) {
    clearInterval(tickTimer);
    tickTimer = null;
  }
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
}

watch(
  () => farmAccountStore.currentAccountId,
  () => {
    checkedBagKeys.value = [];
    void refreshAll();
  }
);

onMounted(async () => {
  await refreshAll();
  startTimers();
});

onUnmounted(() => {
  stopTimers();
});
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-auto">
    <div class="flex-y-center justify-between">
      <h2 class="text-18px font-medium">{{ $t('page.farm.personal.title') }}</h2>
      <NButton size="small" :loading="landsLoading || bagLoading || statusLoading" @click="refreshAll">
        {{ $t('common.refresh') }}
      </NButton>
    </div>

    <NCard v-if="!farmAccountStore.currentAccountId" :bordered="false" size="small" class="card-wrapper">
      <NEmpty :description="$t('page.farm.common.selectAccount')" />
    </NCard>

    <NCard v-else-if="!connected && !statusLoading" :bordered="false" size="small" class="card-wrapper">
      <NEmpty :description="$t('page.farm.personal.notRunning')" />
    </NCard>

    <template v-else>
      <NCard :title="$t('page.farm.personal.landsTitle')" :bordered="false" size="small" class="card-wrapper">
        <template #header-extra>
          <NSpace size="small">
            <NPopconfirm v-for="item in operateOptions" :key="item.op" @positive-click="handleOperate(item.op)">
              <template #trigger>
                <NButton size="small" :type="item.type" ghost :loading="operating" :disabled="!connected">
                  {{ $t(`page.farm.personal.op.${item.op}`) }}
                </NButton>
              </template>
              {{ $t(`page.farm.personal.confirm.${item.op}`) }}
            </NPopconfirm>
          </NSpace>
        </template>

        <NSpin :show="landsLoading || statusLoading">
          <NSpace v-if="summaryTags.length" class="mb-12px" size="small">
            <NTag v-for="tag in summaryTags" :key="tag.key" :type="tag.type" size="small">
              {{ tag.label }}: {{ tag.value }}
            </NTag>
          </NSpace>

          <div v-if="displayLands.length === 0" class="py-24px">
            <NEmpty :description="$t('common.noData')" />
          </div>

          <div v-else class="farm-land-grid">
            <div v-for="land in displayLands" :key="land.id" :class="landCardClass(land)" :style="landGridStyle(land)">
              <div class="flex-y-center justify-between gap-4px">
                <span class="text-12px opacity-50">{{ landIdLabel(land) }}</span>
                <div class="flex-y-center flex-wrap justify-end gap-4px">
                  <NTag v-if="land.plantSize && land.plantSize > 1" size="tiny" type="warning">
                    {{ $t('page.farm.personal.plantSizeBadge', { size: land.plantSize }) }}
                  </NTag>
                  <NTag size="small" :type="landStatusTag(land.status, land.occupiedByMaster).type">
                    {{ landStatusTag(land.status, land.occupiedByMaster).label }}
                  </NTag>
                </div>
              </div>
              <div class="farm-land-crop flex-center min-h-48px">
                <img
                  v-if="landImageSrc(land)"
                  :src="landImageSrc(land)"
                  :alt="land.plantName"
                  class="max-h-48px max-w-full object-contain"
                  loading="lazy"
                  referrerpolicy="no-referrer"
                />
                <span v-else class="text-24px opacity-40">🌱</span>
              </div>
              <div class="truncate text-center text-13px font-medium" :title="land.plantName">
                {{ land.plantName || '-' }}
              </div>
              <div class="text-center text-12px opacity-70">
                <span v-if="land.matureInSec && land.matureInSec > 0" class="text-orange-500">
                  {{ formatDuration(land.matureInSec) }}
                </span>
                <span v-else>{{ land.phaseName || '-' }}</span>
              </div>
              <div
                v-if="land.matureInSec && land.matureInSec > 0 && land.totalGrowTime"
                class="farm-progress"
                :class="soilLevelClass(land.level)"
              >
                <div class="farm-progress-fill" :style="{ width: `${growProgress(land)}%` }" />
              </div>
              <div class="flex-center flex-wrap gap-4px">
                <span v-if="soilLabel(land.level)" class="farm-soil-badge" :class="soilLevelClass(land.level)">
                  {{ soilLabel(land.level) }}
                </span>
                <NTag v-if="land.totalSeason && land.totalSeason > 1" size="tiny" type="info">
                  {{
                    $t('page.farm.personal.seasonBadge', {
                      current: land.currentSeason || 1,
                      total: land.totalSeason
                    })
                  }}
                </NTag>
                <NTag v-if="land.needWater" size="tiny" type="info">💧</NTag>
                <NTag v-if="land.needWeed" size="tiny" type="success">🌿</NTag>
                <NTag v-if="land.needBug" size="tiny" type="error">🐛</NTag>
              </div>
            </div>
          </div>
        </NSpin>
      </NCard>

      <NCard :title="$t('page.farm.personal.bagTitle')" :bordered="false" size="small" class="card-wrapper">
        <template #header-extra>
          <NPopconfirm :disabled="checkedSellableCount === 0" @positive-click="handleBatchSell">
            <template #trigger>
              <NButton size="small" type="error" ghost :loading="batchSelling" :disabled="checkedSellableCount === 0">
                {{ $t('page.farm.personal.batchSell') }}
                <span v-if="checkedSellableCount > 0" class="ml-4px">({{ checkedSellableCount }})</span>
              </NButton>
            </template>
            {{ $t('page.farm.personal.batchSellConfirm', { count: checkedSellableCount }) }}
          </NPopconfirm>
        </template>
        <NSpin :show="bagLoading || statusLoading">
          <NDataTable
            v-model:checked-row-keys="checkedBagKeys"
            :columns="bagColumns"
            :data="bagItems"
            size="small"
            :scroll-x="640"
            :row-key="row => row.id"
            :pagination="bagItems.length > 10 ? { pageSize: 10 } : false"
          />
        </NSpin>
      </NCard>
    </template>
  </div>
</template>
