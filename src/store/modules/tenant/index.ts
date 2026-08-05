import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { SetupStoreId } from '@/enum';
import { localStg } from '@/utils/storage';
import { useAuthStore } from '../auth';
import { fetchGetTenantList } from '@/service/api';

export const useTenantStore = defineStore(SetupStoreId.Tenant, () => {
  const authStore = useAuthStore();

  const currentTenantId = ref<string>(localStg.get('tenantId') || '');
  const tenantOptions = ref<CommonType.Option<string>[]>([]);

  const isPlatformUser = computed(() => Number(authStore.userInfo.tenantId || 0) === 0);

  const showSwitcher = computed(() => isPlatformUser.value);

  const hasTenantContext = computed(() => {
    if (!isPlatformUser.value) {
      return Boolean(authStore.userInfo.tenantId);
    }
    return Boolean(currentTenantId.value) && currentTenantId.value !== '0';
  });

  function setTenantId(id: string | number | null | undefined) {
    const value = id === null || id === undefined || id === '' ? '' : String(id);
    currentTenantId.value = value;
    if (value) {
      localStg.set('tenantId', value);
    } else {
      localStg.remove('tenantId');
    }
  }

  async function loadTenantOptions() {
    if (!isPlatformUser.value) {
      tenantOptions.value = [];
      setTenantId(authStore.userInfo.tenantId || '');
      return;
    }
    const { data, error } = await fetchGetTenantList({ current: 1, size: 500 });
    if (error || !data) {
      tenantOptions.value = [];
      return;
    }
    tenantOptions.value = (data.records || []).map(item => ({
      label: `${item.name} (${item.code})`,
      value: String(item.id)
    }));

    // 超管首次登录：无缓存租户时自动选中列表第一条
    const cached = currentTenantId.value || localStg.get('tenantId') || '';
    const validCached = tenantOptions.value.some(item => item.value === cached);
    if (validCached) {
      setTenantId(cached);
      return;
    }
    if (tenantOptions.value.length > 0) {
      setTenantId(tenantOptions.value[0].value);
    }
  }

  function initFromAuth() {
    if (!isPlatformUser.value) {
      setTenantId(authStore.userInfo.tenantId || '');
      return;
    }
    if (!currentTenantId.value) {
      const cached = localStg.get('tenantId');
      if (cached) {
        currentTenantId.value = cached;
      }
    }
  }

  return {
    currentTenantId,
    tenantOptions,
    isPlatformUser,
    showSwitcher,
    hasTenantContext,
    setTenantId,
    loadTenantOptions,
    initFromAuth
  };
});
