<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { enableStatusOptions, translateNumberOptions } from '@/constants/business';
import { fetchCreatePlatformUser, fetchGetAssignableRoles, fetchGetTenantList } from '@/service/api';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';

defineOptions({
  name: 'PlatformUserDrawer'
});

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const visible = defineModel<boolean>('visible', { default: false });

const { formRef, validate, restoreValidation } = useNaiveForm();
const { defaultRequiredRule, formRules } = useFormRules();

type Model = {
  account: string;
  password: string;
  nickName: string;
  roleIdList: number[];
  tenantIdList: number[];
  status: Api.SystemManage.EnableStatus;
};

const model = ref<Model>(createDefaultModel());

function createDefaultModel(): Model {
  return {
    account: '',
    password: '',
    nickName: '',
    roleIdList: [],
    tenantIdList: [],
    status: 1
  };
}

const rules = computed(() => ({
  account: formRules.userName,
  password: formRules.pwd,
  nickName: defaultRequiredRule,
  roleIdList: defaultRequiredRule,
  status: defaultRequiredRule
}));

const roleOptions = ref<CommonType.Option<number, string>[]>([]);
const tenantOptions = ref<CommonType.Option<number, string>[]>([]);
const statusOptions = computed(() => translateNumberOptions(enableStatusOptions));

async function loadOptions() {
  const [rolesRes, tenantsRes] = await Promise.all([
    fetchGetAssignableRoles(),
    fetchGetTenantList({ current: 1, size: 500, status: 1 })
  ]);

  if (!rolesRes.error) {
    roleOptions.value = rolesRes.data.map(item => ({
      label: `${item.name} (${item.code})`,
      value: item.id
    }));
  }

  if (!tenantsRes.error) {
    tenantOptions.value = tenantsRes.data.records.map(item => ({
      label: `${item.name} (${item.code})`,
      value: item.id
    }));
  }
}

function closeDrawer() {
  visible.value = false;
}

async function handleSubmit() {
  await validate();

  const { error } = await fetchCreatePlatformUser({
    account: model.value.account,
    password: model.value.password,
    nickName: model.value.nickName,
    roleIds: model.value.roleIdList.join(','),
    tenantIds: model.value.tenantIdList.length ? model.value.tenantIdList : undefined,
    status: model.value.status
  });

  if (!error) {
    window.$message?.success($t('common.addSuccess'));
    closeDrawer();
    emit('submitted');
  }
}

watch(visible, () => {
  if (visible.value) {
    model.value = createDefaultModel();
    restoreValidation();
    loadOptions();
  }
});
</script>

<template>
  <NDrawer v-model:show="visible" display-directive="show" :width="360">
    <NDrawerContent :title="$t('page.system.admin.addPlatformUser')" :native-scrollbar="false" closable>
      <NForm ref="formRef" :model="model" :rules="rules" label-placement="left" :label-width="100">
        <NFormItem :label="$t('page.system.admin.account')" path="account">
          <NInput v-model:value="model.account" :placeholder="$t('page.system.admin.account')" />
        </NFormItem>
        <NFormItem :label="$t('page.system.admin.password')" path="password">
          <NInput
            v-model:value="model.password"
            type="password"
            show-password-on="click"
            :placeholder="$t('page.system.admin.password')"
          />
        </NFormItem>
        <NFormItem :label="$t('page.system.admin.nickName')" path="nickName">
          <NInput v-model:value="model.nickName" :placeholder="$t('page.system.admin.nickName')" />
        </NFormItem>
        <NFormItem :label="$t('page.system.admin.roles')" path="roleIdList">
          <NSelect
            v-model:value="model.roleIdList"
            :options="roleOptions"
            multiple
            :placeholder="$t('page.system.admin.roles')"
          />
        </NFormItem>
        <NFormItem :label="$t('page.system.admin.tenants')" path="tenantIdList">
          <NSelect
            v-model:value="model.tenantIdList"
            :options="tenantOptions"
            multiple
            :placeholder="$t('page.system.admin.tenants')"
          />
        </NFormItem>
        <NFormItem :label="$t('page.system.admin.status')" path="status">
          <NRadioGroup v-model:value="model.status">
            <NSpace>
              <NRadio v-for="item in statusOptions" :key="item.value" :value="item.value" :label="item.label" />
            </NSpace>
          </NRadioGroup>
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace :size="16">
          <NButton @click="closeDrawer">{{ $t('common.cancel') }}</NButton>
          <NButton type="primary" @click="handleSubmit">{{ $t('common.confirm') }}</NButton>
        </NSpace>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped></style>
