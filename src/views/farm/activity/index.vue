<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { NButton, NCard, NEmpty, NInputNumber, NModal, NProgress, NSpace, NSpin, NTag, useMessage } from 'naive-ui';
import {
  fetchClaimFarmActivityPass,
  fetchClaimFarmActivitySolarTerm,
  fetchExchangeFarmActivityShop,
  fetchGetFarmActivitySnapshot,
  fetchLightFarmActivityConstellation
} from '@/service/api';
import { useFarmAccountStore } from '@/store/modules/farm-account';
import { useAuth } from '@/hooks/business/auth';
import { resolveCatalogImage } from '@/views/farm/game-config/shared';
import { $t } from '@/locales';

defineOptions({
  name: 'FarmActivity'
});

type ActivityTab = 'travel' | 'constellation' | 'shop' | 'solar';
type RewardItem = {
  id?: string | number;
  name?: string;
  count?: number | string;
  image?: string;
  rarity?: number;
  locked?: boolean;
};
type PassNode = {
  id?: string | number;
  level?: number;
  claimable?: boolean;
  claimed?: boolean;
  current?: boolean;
  locked?: boolean;
  keyLevel?: boolean;
  rewards?: RewardItem[];
};
type ShopGoods = {
  id?: string | number;
  name?: string;
  category?: string;
  categoryId?: string;
  categoryName?: string;
  exchangeable?: boolean;
  soldOut?: boolean;
  owned?: boolean;
  balanceKnown?: boolean;
  maxExchangeCountKnown?: boolean;
  maxExchangeCount?: string | number;
  item?: RewardItem;
  cost?: { count?: string | number; image?: string; name?: string };
};
type ShopCategory = { id: string; name: string };
type SolarTerm = {
  id?: string;
  name?: string;
  title?: string;
  englishName?: string;
  description?: string;
  rewardTitle?: string;
  rewardDescription?: string;
  claimable?: boolean;
  claimed?: boolean;
  canClaim?: boolean;
  locked?: boolean;
  current?: boolean;
  startTime?: number;
  endTime?: number;
  rewards?: RewardItem[];
};
type ConstellationGroup = {
  id?: string;
  name?: string;
  order?: number;
  visualState?: string;
  claimStatus?: string;
  rewards?: RewardItem[];
};

const farmAccountStore = useFarmAccountStore();
const { hasAuth } = useAuth();
const message = useMessage();

const activeTab = ref<ActivityTab>('travel');
const loading = ref(false);
const pendingKey = ref<string | null>(null);
const season = ref<Record<string, unknown>>({});
const constellation = ref<Record<string, unknown>>({});
const shop = ref<Record<string, unknown>>({});
const solarTerms = ref<Record<string, unknown>>({});
const capabilities = ref<Record<string, boolean>>({});
const actions = ref<Record<string, Api.Farm.ActivityAction>>({});
const clockNow = ref(Date.now());
const selectedSolarId = ref('');
const selectedConstellationId = ref('');
const shopCategory = ref('__all__');
const exchangeOpen = ref(false);
const exchangeGoods = ref<ShopGoods | null>(null);
const exchangeCount = ref(1);

let clockTimer: ReturnType<typeof setInterval> | null = null;

const tabs: Array<{ key: ActivityTab; labelKey: App.I18n.I18nKey }> = [
  { key: 'travel', labelKey: 'page.farm.activity.tabTravel' },
  { key: 'constellation', labelKey: 'page.farm.activity.tabConstellation' },
  { key: 'shop', labelKey: 'page.farm.activity.tabShop' },
  { key: 'solar', labelKey: 'page.farm.activity.tabSolar' }
];

const pass = computed(() => (season.value.pass as Record<string, unknown> | undefined) || {});
const passNodes = computed(() => ((pass.value.nodes as PassNode[]) || []).slice());
const passProgress = computed(() => Number(pass.value.progress ?? 0));
const passProgressMax = computed(() => Number(pass.value.progressMax ?? 0));
const passLevel = computed(() => pass.value.level ?? '--');
const passPercent = computed(() => {
  if (!passProgressMax.value) return 0;
  return Math.min(100, Math.max(0, (passProgress.value / passProgressMax.value) * 100));
});
const hasClaimablePass = computed(() => passNodes.value.some(node => node.claimable));

const constellationGroups = computed(() => {
  const groups = ((constellation.value.groups as ConstellationGroup[]) || []).slice();
  return groups.sort((a, b) => Number(a.order ?? 999) - Number(b.order ?? 999));
});
const selectedConstellation = computed(
  () => constellationGroups.value.find(g => g.id === selectedConstellationId.value) || null
);
const canLightConstellation = computed(() => {
  const state = selectedConstellation.value?.visualState || '';
  return ['lightable', 'claimableUnknown'].includes(state) && actionEnabled('lightConstellation');
});

const shopGoods = computed(() => (shop.value.goods as ShopGoods[]) || []);
const shopCategories = computed(() => {
  const raw = shop.value.categories;
  if (!Array.isArray(raw)) return [] as ShopCategory[];
  const list: ShopCategory[] = [];
  for (const item of raw) {
    if (typeof item === 'string') {
      const name = item.trim();
      if (name) list.push({ id: name, name });
      continue;
    }
    if (item && typeof item === 'object') {
      const row = item as { id?: string; name?: string };
      const id = String(row.id ?? row.name ?? '').trim();
      const name = String(row.name ?? row.id ?? '').trim();
      if (id || name) list.push({ id: id || name, name: name || id });
    }
  }
  return list;
});
const shopBalance = computed(() => {
  if (shop.value.balanceKnown === false) return '--';
  const currencies = (shop.value.currencies as Array<{ balance?: string | number | null }> | undefined) || [];
  const currency = shop.value.currency as { balance?: string | number | null; count?: string | number } | undefined;
  const value = shop.value.balance ?? currencies[0]?.balance ?? currency?.balance ?? currency?.count;
  if (value === undefined || value === null || value === '') return '--';
  return String(value);
});
function goodsCategory(goods: ShopGoods) {
  return String(goods.categoryId || goods.categoryName || goods.category || '').trim();
}
const visibleShopGoods = computed(() => {
  if (shopCategory.value === '__all__') return shopGoods.value;
  return shopGoods.value.filter(item => goodsCategory(item) === shopCategory.value);
});

const solarTermList = computed(() => (solarTerms.value.terms as SolarTerm[]) || []);
const selectedSolar = computed(() => solarTermList.value.find(term => term.id === selectedSolarId.value) || null);

const pageTitle = computed(() => {
  if (activeTab.value === 'shop') {
    return String(shop.value.title || shop.value.name || $t('page.farm.activity.tabShop'));
  }
  if (activeTab.value === 'constellation') {
    return String(
      constellation.value.title || constellation.value.displayName || $t('page.farm.activity.tabConstellation')
    );
  }
  if (activeTab.value === 'solar') {
    return String(
      selectedSolar.value?.title ||
        selectedSolar.value?.name ||
        solarTerms.value.title ||
        $t('page.farm.activity.tabSolar')
    );
  }
  return String(season.value.title || $t('page.farm.activity.tabTravel'));
});

const remainingText = computed(() => {
  let endTime: number | undefined;
  if (activeTab.value === 'shop') endTime = Number(shop.value.endTime || 0) || undefined;
  else if (activeTab.value === 'constellation') {
    endTime = Number(constellation.value.endTime || season.value.endTime || 0) || undefined;
  } else if (activeTab.value === 'solar') {
    endTime = Number(selectedSolar.value?.endTime || season.value.endTime || 0) || undefined;
  } else endTime = Number(season.value.endTime || 0) || undefined;
  if (!endTime) return '';
  // Support both ms and sec timestamps.
  const endMs = endTime > 1e12 ? endTime : endTime * 1000;
  const diff = Math.max(0, endMs - clockNow.value);
  if (diff === 0) return $t('page.farm.activity.ended');
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  return days > 0
    ? $t('page.farm.activity.remainingDays', { days, hours })
    : $t('page.farm.activity.remainingHours', { hours, minutes });
});

const tabBadges = computed(() => ({
  travel: hasClaimablePass.value && actionEnabled('claimPass'),
  constellation: constellationGroups.value.some(g =>
    ['lightable', 'claimableUnknown'].includes(String(g.visualState || ''))
  ),
  shop: shopGoods.value.some(g => g.exchangeable),
  solar: solarTermList.value.some(t => t.claimable || t.canClaim)
}));

function actionEnabled(key: string): boolean {
  const action = actions.value[key];
  if (action && typeof action.enabled === 'boolean') return action.enabled;
  return capabilities.value[key] === true;
}

function rewardImage(item?: RewardItem) {
  return resolveCatalogImage(item?.image);
}

function formatRewardLabel(item: RewardItem) {
  const name = item.name || item.id || '?';
  const count = item.count == null ? '' : `×${item.count}`;
  return `${name}${count}`;
}

function claimSuccessMessage(data: Record<string, unknown> | null | undefined) {
  if (data?.message && typeof data.message === 'string') {
    return String(data.message);
  }
  const rewards = (data?.rewards as RewardItem[] | undefined) || [];
  const labels = rewards.map(item => formatRewardLabel(item)).filter(Boolean);
  if (labels.length) {
    return $t('page.farm.activity.claimRewardsSuccess', { items: labels.join('、') });
  }
  return $t('page.farm.activity.claimSuccess');
}

function notifyClaimResult(data: Record<string, unknown> | null | undefined) {
  const text = claimSuccessMessage(data);
  if (data?.noClaimable || data?.outcome === 'nothingToClaim') {
    message.info(text);
    return;
  }
  message.success(text);
}

function shopDisabledReason(item: ShopGoods) {
  if (pendingKey.value === 'shop') return $t('page.farm.activity.exchanging');
  if (item.owned || item.soldOut) return $t('page.farm.activity.alreadyExchanged');
  if (!item.exchangeable) return $t('page.farm.activity.notExchangeable');
  if (!actionEnabled('exchange')) return $t('page.farm.activity.exchangeUnavailable');
  return '';
}

function solarButtonLabel(term: SolarTerm | null) {
  if (!term) return $t('page.farm.activity.claimUnavailable');
  if (pendingKey.value === 'solar') return $t('page.farm.activity.claiming');
  if (term.claimed) return $t('page.farm.activity.claimed');
  if (term.locked) return $t('page.farm.activity.notStarted');
  if (term.claimable || term.canClaim) return $t('page.farm.activity.claim');
  return $t('page.farm.activity.claimUnavailable');
}

function constellationStateLabel(group: ConstellationGroup | null) {
  if (!group) return '';
  if (group.visualState === 'lit') {
    return group.claimStatus === 'confirmed-no-claimable'
      ? $t('page.farm.activity.claimedToday')
      : $t('page.farm.activity.lit');
  }
  if (group.visualState === 'locked') return $t('page.farm.activity.locked');
  if (group.visualState === 'lightable' || group.visualState === 'claimableUnknown') {
    return $t('page.farm.activity.lightable');
  }
  return String(group.visualState || '');
}

/** Prefer today's lightable node, then currentDay, then latest progress — not the first star. */
function pickConstellationFocus(groups: ConstellationGroup[]) {
  const sorted = groups.slice().sort((a, b) => Number(a.order ?? 999) - Number(b.order ?? 999));
  const actionable = sorted.find(g => ['lightable', 'claimableUnknown'].includes(String(g.visualState || '')));
  if (actionable?.id) return actionable.id;

  const currentDay = Number(constellation.value.currentDay || 0);
  if (currentDay > 0) {
    const byDay = sorted.find(g => Number(g.order) === currentDay);
    if (byDay?.id) return byDay.id;
  }

  const inProgress = sorted.find(g => g.visualState === 'unknown');
  if (inProgress?.id) return inProgress.id;

  const latestLit = [...sorted].reverse().find(g => g.visualState === 'lit');
  if (latestLit?.id) return latestLit.id;

  return sorted[0]?.id || '';
}

function applySnapshot(data: Api.Farm.ActivitySnapshot) {
  const snap = (data.snapshot || data) as Api.Farm.ActivitySnapshot;
  season.value = (snap.season as Record<string, unknown>) || {};
  constellation.value = (snap.constellation as Record<string, unknown>) || {};
  shop.value = (snap.shop as Record<string, unknown>) || {};
  solarTerms.value = (snap.solarTerms as Record<string, unknown>) || {};
  capabilities.value = snap.capabilities || data.capabilities || {};
  actions.value = snap.actions || data.actions || {};

  const groups = (constellation.value.groups as ConstellationGroup[]) || [];
  selectedConstellationId.value = pickConstellationFocus(groups);
  const terms = (solarTerms.value.terms as SolarTerm[]) || [];
  const currentTermId = String(solarTerms.value.currentTermId || '');
  if (!terms.some(t => t.id === selectedSolarId.value)) {
    selectedSolarId.value = currentTermId || terms.find(t => t.current)?.id || terms[0]?.id || '';
  }
}

async function loadActivities() {
  if (!farmAccountStore.currentAccountId) {
    season.value = {};
    constellation.value = {};
    shop.value = {};
    solarTerms.value = {};
    return;
  }
  loading.value = true;
  try {
    const { error, data } = await fetchGetFarmActivitySnapshot(farmAccountStore.currentAccountId);
    if (!error && data) applySnapshot(data);
  } finally {
    loading.value = false;
  }
}

async function claimPass() {
  if (!farmAccountStore.currentAccountId || !actionEnabled('claimPass')) return;
  const fallbackRewards = passNodes.value.filter(n => n.claimable).flatMap(n => n.rewards || []);
  pendingKey.value = 'pass';
  try {
    const { error, data } = await fetchClaimFarmActivityPass({
      accountId: farmAccountStore.currentAccountId
    });
    if (error) {
      message.error(error.message || $t('page.farm.activity.claimFailed'));
      return;
    }
    const payload = { ...(data as Record<string, unknown>) };
    if ((!Array.isArray(payload.rewards) || !(payload.rewards as unknown[]).length) && fallbackRewards.length) {
      payload.rewards = fallbackRewards;
    }
    notifyClaimResult(payload);
    if (data) applySnapshot(data as Api.Farm.ActivitySnapshot);
    else await loadActivities();
  } finally {
    pendingKey.value = null;
  }
}

async function lightConstellation() {
  if (!farmAccountStore.currentAccountId || !canLightConstellation.value) return;
  pendingKey.value = 'constellation';
  try {
    const { error, data } = await fetchLightFarmActivityConstellation({
      accountId: farmAccountStore.currentAccountId
    });
    if (error) {
      message.error(error.message || $t('page.farm.activity.claimFailed'));
      return;
    }
    notifyClaimResult(data as Record<string, unknown>);
    if (data) applySnapshot(data as Api.Farm.ActivitySnapshot);
    else await loadActivities();
  } finally {
    pendingKey.value = null;
  }
}

function openExchange(goods: ShopGoods) {
  if (shopDisabledReason(goods)) return;
  exchangeGoods.value = goods;
  exchangeCount.value = 1;
  exchangeOpen.value = true;
}

async function confirmExchange() {
  if (!farmAccountStore.currentAccountId || !exchangeGoods.value?.id) return;
  const exchanging = exchangeGoods.value;
  pendingKey.value = 'shop';
  try {
    const { error, data } = await fetchExchangeFarmActivityShop({
      accountId: farmAccountStore.currentAccountId,
      itemId: String(exchanging.id),
      count: exchangeCount.value || 1
    });
    if (error) {
      message.error(error.message || $t('page.farm.activity.claimFailed'));
      return;
    }
    const payload = { ...(data as Record<string, unknown>) };
    if (!Array.isArray(payload.rewards) || !(payload.rewards as unknown[]).length) {
      const fallbackItem = exchanging.item
        ? {
            ...exchanging.item,
            count: Number(exchanging.item.count || 1) * Number(exchangeCount.value || 1)
          }
        : { id: exchanging.id, name: exchanging.name, count: exchangeCount.value || 1 };
      payload.rewards = [fallbackItem];
    }
    notifyClaimResult(payload);
    exchangeOpen.value = false;
    exchangeGoods.value = null;
    if (data) applySnapshot(data as Api.Farm.ActivitySnapshot);
    else await loadActivities();
  } finally {
    pendingKey.value = null;
  }
}

async function claimSolar() {
  const term = selectedSolar.value;
  if (!farmAccountStore.currentAccountId || !term?.id) return;
  if (!(term.claimable || term.canClaim) || term.claimed) return;
  pendingKey.value = 'solar';
  try {
    const { error, data } = await fetchClaimFarmActivitySolarTerm({
      accountId: farmAccountStore.currentAccountId,
      termId: term.id
    });
    if (error) {
      message.error(error.message || $t('page.farm.activity.claimFailed'));
      return;
    }
    const payload = { ...(data as Record<string, unknown>) };
    if ((!Array.isArray(payload.rewards) || !(payload.rewards as unknown[]).length) && term.rewards?.length) {
      payload.rewards = term.rewards;
    }
    notifyClaimResult(payload);
    if (data) applySnapshot(data as Api.Farm.ActivitySnapshot);
    else await loadActivities();
  } finally {
    pendingKey.value = null;
  }
}

watch(
  () => farmAccountStore.currentAccountId,
  () => {
    void loadActivities();
  }
);

onMounted(async () => {
  if (!farmAccountStore.accounts.length) {
    await farmAccountStore.loadAccounts();
  }
  await loadActivities();
  clockTimer = setInterval(() => {
    clockNow.value = Date.now();
  }, 1000);
});

onUnmounted(() => {
  if (clockTimer) clearInterval(clockTimer);
});
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-auto">
    <NEmpty
      v-if="!farmAccountStore.currentAccountId"
      class="py-48px"
      :description="$t('page.farm.common.selectAccount')"
    />

    <template v-else>
      <div class="flex flex-wrap items-center justify-between gap-12px">
        <div>
          <div class="text-18px font-medium">{{ pageTitle }}</div>
          <div v-if="remainingText" class="mt-4px text-12px text-gray-500">{{ remainingText }}</div>
        </div>
        <NSpace align="center">
          <span v-if="activeTab === 'shop' || activeTab === 'travel'" class="text-13px text-amber-600">
            {{ $t('page.farm.activity.starSand') }} {{ shopBalance }}
          </span>
          <NButton size="small" :loading="loading" @click="loadActivities">
            {{ $t('common.refresh') }}
          </NButton>
        </NSpace>
      </div>

      <div class="flex flex-wrap gap-8px border-b border-gray-200 pb-12px dark:border-gray-700">
        <NButton
          v-for="tab in tabs"
          :key="tab.key"
          size="small"
          :type="activeTab === tab.key ? 'primary' : 'default'"
          secondary
          @click="activeTab = tab.key"
        >
          <NSpace :size="6" align="center">
            <span>{{ $t(tab.labelKey) }}</span>
            <NTag v-if="tabBadges[tab.key]" size="tiny" type="error" :bordered="false" round>•</NTag>
          </NSpace>
        </NButton>
      </div>

      <NSpin :show="loading">
        <!-- 千星游记 -->
        <NCard v-show="activeTab === 'travel'" :bordered="false" size="small" class="card-wrapper">
          <div
            class="mb-16px flex flex-wrap items-center gap-16px rounded-8px bg-blue-50 px-16px py-14px dark:bg-blue-900/20"
          >
            <div class="h-64px w-64px flex flex-col items-center justify-center rounded-full bg-blue-500 text-white">
              <div class="text-22px font-semibold">{{ passLevel }}</div>
              <div class="text-11px opacity-80">{{ $t('page.farm.activity.level') }}</div>
            </div>
            <div class="min-w-200px flex-1">
              <div class="mb-6px text-13px font-medium">{{ $t('page.farm.activity.travelScore') }}</div>
              <div class="mb-8px text-15px">{{ passProgress }} / {{ passProgressMax || '--' }}</div>
              <NProgress type="line" :percentage="passPercent" :show-indicator="false" />
            </div>
          </div>

          <div class="mb-12px text-12px text-gray-500">{{ $t('page.farm.activity.travelTip') }}</div>

          <NEmpty v-if="!passNodes.length" class="py-24px" :description="$t('common.noData')" />
          <div v-else class="flex-col gap-10px">
            <div
              v-for="node in passNodes"
              :key="String(node.id ?? node.level)"
              class="flex flex-wrap items-center justify-between gap-12px rounded-8px border border-gray-200 px-12px py-10px dark:border-gray-700"
              :class="{
                'border-primary': node.current || node.level === passLevel,
                'opacity-70': node.claimed
              }"
            >
              <div class="flex items-center gap-12px">
                <div
                  class="h-44px w-44px flex flex-col items-center justify-center rounded-8px bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200"
                >
                  <div class="text-16px font-semibold">{{ node.level ?? '--' }}</div>
                  <div class="text-10px">{{ $t('page.farm.activity.level') }}</div>
                </div>
                <div class="flex flex-wrap gap-8px">
                  <div
                    v-for="(reward, idx) in node.rewards || []"
                    :key="String(reward.id ?? idx)"
                    class="flex items-center gap-6px rounded-6px bg-gray-50 px-8px py-4px text-12px dark:bg-gray-800"
                  >
                    <img
                      v-if="rewardImage(reward)"
                      :src="rewardImage(reward)"
                      class="h-24px w-24px object-contain"
                      loading="lazy"
                    />
                    <span>{{ formatRewardLabel(reward) }}</span>
                  </div>
                </div>
              </div>
              <NTag v-if="node.claimed" size="small" :bordered="false">{{ $t('page.farm.activity.claimed') }}</NTag>
              <NTag v-else-if="node.claimable" size="small" type="success" :bordered="false">
                {{ $t('page.farm.activity.claimable') }}
              </NTag>
            </div>
          </div>

          <div class="mt-16px flex justify-center">
            <NButton
              v-if="hasAuth(['farm-activity:pass-claim'])"
              type="primary"
              :loading="pendingKey === 'pass'"
              :disabled="!actionEnabled('claimPass') || !hasClaimablePass"
              @click="claimPass"
            >
              {{ pendingKey === 'pass' ? $t('page.farm.activity.claiming') : $t('page.farm.activity.claimAll') }}
            </NButton>
          </div>
        </NCard>

        <!-- 观星礼录 -->
        <NCard v-show="activeTab === 'constellation'" :bordered="false" size="small" class="card-wrapper">
          <NEmpty v-if="!constellationGroups.length" class="py-24px" :description="$t('common.noData')" />
          <template v-else>
            <div class="mb-12px flex flex-wrap gap-8px">
              <NButton
                v-for="group in constellationGroups"
                :key="String(group.id)"
                size="small"
                :type="selectedConstellationId === group.id ? 'primary' : 'default'"
                secondary
                @click="selectedConstellationId = group.id || ''"
              >
                {{ group.name || group.id }}
              </NButton>
            </div>

            <div class="rounded-8px border border-gray-200 p-16px dark:border-gray-700">
              <div class="mb-8px text-16px font-medium">
                {{ selectedConstellation?.name || selectedConstellation?.id || '-' }}
              </div>
              <div class="mb-12px text-12px text-gray-500">
                {{ constellationStateLabel(selectedConstellation) }}
              </div>
              <div class="mb-16px flex flex-wrap gap-8px">
                <div
                  v-for="(reward, idx) in selectedConstellation?.rewards || []"
                  :key="String(reward.id ?? idx)"
                  class="flex items-center gap-6px rounded-6px bg-gray-50 px-8px py-4px text-12px dark:bg-gray-800"
                >
                  <img
                    v-if="rewardImage(reward)"
                    :src="rewardImage(reward)"
                    class="h-24px w-24px object-contain"
                    loading="lazy"
                  />
                  <span>{{ formatRewardLabel(reward) }}</span>
                </div>
                <span v-if="!(selectedConstellation?.rewards || []).length" class="text-12px text-gray-400">
                  {{ $t('page.farm.activity.noRewards') }}
                </span>
              </div>
              <NButton
                v-if="hasAuth(['farm-activity:constellation'])"
                type="primary"
                :loading="pendingKey === 'constellation'"
                :disabled="!canLightConstellation"
                @click="lightConstellation"
              >
                {{
                  pendingKey === 'constellation'
                    ? $t('page.farm.activity.claiming')
                    : $t('page.farm.activity.lightConstellation')
                }}
              </NButton>
            </div>
          </template>
        </NCard>

        <!-- 星砂商店 -->
        <NCard v-show="activeTab === 'shop'" :bordered="false" size="small" class="card-wrapper">
          <div class="mb-12px rounded-8px bg-sky-50 px-14px py-12px dark:bg-sky-900/20">
            <div class="text-16px font-medium">
              {{ shop.title || shop.name || $t('page.farm.activity.tabShop') }}
            </div>
            <div class="mt-4px text-12px text-gray-500">
              {{ shop.description || $t('page.farm.activity.shopHint') }}
            </div>
          </div>

          <div class="mb-12px flex flex-wrap gap-8px">
            <NButton
              size="tiny"
              :type="shopCategory === '__all__' ? 'primary' : 'default'"
              secondary
              @click="shopCategory = '__all__'"
            >
              {{ $t('page.farm.activity.allCategories') }}
            </NButton>
            <NButton
              v-for="category in shopCategories"
              :key="String(category.id)"
              size="tiny"
              :type="shopCategory === category.id ? 'primary' : 'default'"
              secondary
              @click="shopCategory = category.id || ''"
            >
              {{ category.name || category.id }}
            </NButton>
          </div>

          <NEmpty v-if="!visibleShopGoods.length" class="py-24px" :description="$t('common.noData')" />
          <div v-else class="grid gap-12px sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <div
              v-for="goods in visibleShopGoods"
              :key="String(goods.id)"
              class="relative rounded-8px border border-gray-200 p-12px dark:border-gray-700"
              :class="{ 'opacity-60': !!shopDisabledReason(goods) }"
            >
              <NTag
                v-if="goods.owned || goods.soldOut"
                size="tiny"
                type="success"
                :bordered="false"
                class="absolute right-8px top-8px z-1"
              >
                {{ $t('page.farm.activity.alreadyExchanged') }}
              </NTag>
              <div class="mb-8px flex-center h-72px rounded-6px bg-gray-50 dark:bg-gray-800">
                <img
                  v-if="rewardImage(goods.item)"
                  :src="rewardImage(goods.item)"
                  class="max-h-56px max-w-56px object-contain"
                  loading="lazy"
                />
                <span v-else class="text-24px opacity-40">🎁</span>
              </div>
              <div class="mb-4px truncate text-13px font-medium">
                {{ goods.name || goods.item?.name || goods.id }}
              </div>
              <div class="mb-8px flex items-center gap-6px text-12px text-amber-600">
                <img
                  v-if="resolveCatalogImage(goods.cost?.image)"
                  :src="resolveCatalogImage(goods.cost?.image)"
                  class="h-16px w-16px object-contain"
                  loading="lazy"
                />
                <span>{{ goods.cost?.count ?? '--' }}</span>
              </div>
              <NButton
                v-if="hasAuth(['farm-activity:shop'])"
                block
                size="small"
                :disabled="!!shopDisabledReason(goods)"
                @click="openExchange(goods)"
              >
                {{ shopDisabledReason(goods) || $t('page.farm.activity.exchange') }}
              </NButton>
            </div>
          </div>
        </NCard>

        <!-- 节令小札 -->
        <NCard v-show="activeTab === 'solar'" :bordered="false" size="small" class="card-wrapper">
          <NEmpty v-if="!solarTermList.length" class="py-24px" :description="$t('common.noData')" />
          <div v-else class="grid gap-16px lg:grid-cols-[140px_1fr]">
            <div class="flex flex-col gap-8px lg:max-h-520px lg:overflow-auto">
              <NButton
                v-for="term in solarTermList"
                :key="String(term.id)"
                size="small"
                :type="selectedSolarId === term.id ? 'primary' : 'default'"
                secondary
                @click="selectedSolarId = term.id || ''"
              >
                <span>{{ term.name || term.id }}</span>
                <NTag
                  v-if="term.claimable || term.canClaim"
                  size="tiny"
                  type="error"
                  :bordered="false"
                  class="ml-6px"
                  round
                >
                  •
                </NTag>
              </NButton>
            </div>

            <div class="rounded-8px border border-gray-200 p-16px dark:border-gray-700">
              <div v-if="selectedSolar?.englishName" class="mb-4px text-12px tracking-2px text-gray-400">
                {{ selectedSolar.englishName }}
              </div>
              <div class="mb-8px text-22px font-semibold">
                {{ selectedSolar?.title || selectedSolar?.name || '-' }}
              </div>
              <div class="mb-16px whitespace-pre-line text-13px text-gray-500">
                {{ selectedSolar?.description || solarTerms.description || '' }}
              </div>
              <div v-if="selectedSolar?.rewardTitle" class="mb-4px text-15px font-medium">
                {{ selectedSolar.rewardTitle }}
              </div>
              <div v-if="selectedSolar?.rewardDescription" class="mb-12px text-12px text-gray-500">
                {{ selectedSolar.rewardDescription }}
              </div>
              <div class="mb-16px flex flex-wrap gap-8px">
                <div
                  v-for="(reward, idx) in selectedSolar?.rewards || []"
                  :key="String(reward.id ?? idx)"
                  class="flex items-center gap-6px rounded-6px bg-gray-50 px-8px py-4px text-12px dark:bg-gray-800"
                >
                  <img
                    v-if="rewardImage(reward)"
                    :src="rewardImage(reward)"
                    class="h-24px w-24px object-contain"
                    loading="lazy"
                  />
                  <span>{{ formatRewardLabel(reward) }}</span>
                </div>
                <span v-if="!(selectedSolar?.rewards || []).length" class="text-12px text-gray-400">
                  {{ $t('page.farm.activity.noRewards') }}
                </span>
              </div>
              <NButton
                v-if="hasAuth(['farm-activity:solar'])"
                type="primary"
                :loading="pendingKey === 'solar'"
                :disabled="!(selectedSolar?.claimable || selectedSolar?.canClaim) || !!selectedSolar?.claimed"
                @click="claimSolar"
              >
                {{ solarButtonLabel(selectedSolar) }}
              </NButton>
            </div>
          </div>
        </NCard>
      </NSpin>
    </template>

    <NModal
      v-model:show="exchangeOpen"
      preset="card"
      :title="$t('page.farm.activity.exchangeConfirm')"
      class="w-420px"
      :bordered="false"
    >
      <div class="mb-12px text-13px">
        {{ exchangeGoods?.name || exchangeGoods?.item?.name || exchangeGoods?.id }}
      </div>
      <div class="mb-16px flex-y-center gap-8px">
        <span class="text-13px text-gray-500">{{ $t('page.farm.activity.count') }}</span>
        <NInputNumber v-model:value="exchangeCount" class="w-120px" :min="1" :max="99" />
      </div>
      <div class="flex justify-end gap-8px">
        <NButton @click="exchangeOpen = false">{{ $t('common.cancel') }}</NButton>
        <NButton type="primary" :loading="pendingKey === 'shop'" @click="confirmExchange">
          {{ $t('page.farm.activity.exchange') }}
        </NButton>
      </div>
    </NModal>
  </div>
</template>

<style scoped></style>
