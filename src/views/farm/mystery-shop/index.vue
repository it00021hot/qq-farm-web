<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NButton, NCard, NEmpty, NSpin, NTag } from 'naive-ui';
import dayjs from 'dayjs';
import { fetchGetFarmMysteryShop } from '@/service/api';
import { useFarmAccountStore } from '@/store/modules/farm-account';
import { resolveCatalogImage } from '@/views/farm/game-config/shared';

defineOptions({ name: 'FarmMysteryShop' });

const farmAccountStore = useFarmAccountStore();
const loading = ref(false);
const shop = ref<Api.Farm.MysteryShop | null>(null);
let requestSeq = 0;

const accountId = computed(() => farmAccountStore.currentAccountId);

async function loadShop() {
  if (!accountId.value) {
    shop.value = null;
    return;
  }
  const seq = ++requestSeq;
  loading.value = true;
  try {
    const { data, error } = await fetchGetFarmMysteryShop(accountId.value);
    if (seq !== requestSeq) return;
    if (!error && data) shop.value = data;
  } finally {
    if (seq === requestSeq) loading.value = false;
  }
}

function formatTime(ms?: number) {
  if (!ms) return '-';
  return dayjs(ms).format('YYYY-MM-DD HH:mm:ss');
}

watch(
  accountId,
  () => {
    void loadShop();
  },
  { immediate: true }
);
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <NCard :bordered="false" class="card-wrapper" title="神秘商人">
      <template #header-extra>
        <NButton size="small" :loading="loading" @click="loadShop">刷新</NButton>
      </template>

      <NSpin :show="loading">
        <NEmpty v-if="!accountId" description="请先选择农场账号" />
        <NEmpty v-else-if="!shop?.active || !shop.npc" description="当前没有活跃的神秘商人" />
        <div v-else class="max-w-480px flex flex-col gap-12px rounded-8px bg-#fafafa p-16px dark:bg-#222">
          <div class="flex items-center gap-12px">
            <img
              v-if="resolveCatalogImage(shop.npc.reward.image)"
              :src="resolveCatalogImage(shop.npc.reward.image)"
              class="h-72px w-72px object-contain"
              alt=""
            />
            <span v-else class="text-28px">🛒</span>
            <div>
              <div class="text-16px font-medium">{{ shop.npc.reward.name }}</div>
              <div class="text-12px text-#888">x{{ shop.npc.reward.count }}</div>
            </div>
          </div>
          <NTag type="info" size="small">库存 {{ shop.npc.stock }}</NTag>
          <div>
            现价：{{ shop.npc.price.count }} {{ shop.npc.price.name || `#${shop.npc.price.id}` }}
            <span v-if="shop.npc.price.balance != null" class="ml-8px text-12px text-#888">
              余额 {{ shop.npc.price.balance }}
            </span>
          </div>
          <div v-if="shop.npc.discountPercent > 0" class="text-12px text-error">
            {{ shop.npc.discountPercent }}% 折扣 · 原价 {{ shop.npc.originalPrice }}
          </div>
          <div class="text-12px text-#888">活动开始：{{ formatTime(shop.activeTime) }}</div>
          <div class="text-12px text-#888">活动结束：{{ formatTime(shop.expireTime) }}</div>
          <div class="text-12px text-warning">购买协议尚未接入，当前仅支持查询</div>
        </div>
      </NSpin>
    </NCard>
  </div>
</template>
