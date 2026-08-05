<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { useTenantStore } from '@/store/modules/tenant';
import { $t } from '@/locales';

defineOptions({ name: 'TenantSwitcher' });

const tenantStore = useTenantStore();

onMounted(() => {
  if (tenantStore.showSwitcher) {
    tenantStore.loadTenantOptions();
  }
});

watch(
  () => tenantStore.currentTenantId,
  () => {
    // trigger reloads by emitting storage event consumers listen via store
  }
);

function handleUpdate(value: string | null) {
  tenantStore.setTenantId(value || '');
  window.$message?.success($t('common.updateSuccess'));
  // soft reload current page data
  window.dispatchEvent(new CustomEvent('tenant-changed'));
}
</script>

<template>
  <div v-if="tenantStore.showSwitcher" class="mx-8px flex-y-center">
    <NSelect
      :value="tenantStore.currentTenantId || null"
      :options="tenantStore.tenantOptions"
      :placeholder="$t('page.system.tenant.switchPlaceholder')"
      clearable
      filterable
      class="w-220px"
      size="small"
      @update:value="handleUpdate"
    />
  </div>
</template>
