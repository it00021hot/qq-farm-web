<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { enableStatusOptions, translateNumberOptions } from '@/constants/business';
import { fetchCreateTenant, fetchUpdateTenant } from '@/service/api';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';

defineOptions({
  name: 'TenantOperateDrawer'
});

interface Props {
  operateType: NaiveUI.TableOperateType;
  rowData?: Api.SystemManage.Tenant | null;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const visible = defineModel<boolean>('visible', { default: false });

const { formRef, validate, restoreValidation } = useNaiveForm();
const { defaultRequiredRule, formRules } = useFormRules();

const title = computed(() => {
  const titles: Record<NaiveUI.TableOperateType, string> = {
    add: $t('page.system.tenant.addTenant'),
    edit: $t('page.system.tenant.editTenant')
  };
  return titles[props.operateType];
});

type Model = Api.SystemManage.TenantCreateParams & Partial<Pick<Api.SystemManage.TenantUpdateParams, 'id' | 'status'>>;

const model = ref<Model>(createDefaultModel());

function createDefaultModel(): Model {
  return {
    code: '',
    name: '',
    maxUsers: undefined,
    maxAccounts: undefined,
    expireAt: undefined,
    contactName: '',
    contactPhone: '',
    remark: '',
    adminAccount: '',
    adminPassword: '',
    adminNickName: '',
    status: 1
  };
}

const rules = computed(() => {
  const base: Record<string, App.Global.FormRule | App.Global.FormRule[]> = {
    name: defaultRequiredRule,
    status: defaultRequiredRule
  };

  if (props.operateType === 'add') {
    base.code = defaultRequiredRule;
    base.adminAccount = formRules.userName;
    base.adminPassword = formRules.pwd;
  }

  return base;
});

const statusOptions = computed(() => translateNumberOptions(enableStatusOptions));

function handleInitModel() {
  model.value = createDefaultModel();

  if (props.operateType === 'edit' && props.rowData) {
    const { id, name, maxUsers, maxAccounts, expireAt, contactName, contactPhone, remark, status } = props.rowData;
    Object.assign(model.value, {
      id,
      name,
      maxUsers,
      maxAccounts,
      expireAt: expireAt || undefined,
      contactName,
      contactPhone,
      remark,
      status
    });
  }
}

function closeDrawer() {
  visible.value = false;
}

async function handleSubmit() {
  await validate();

  if (props.operateType === 'add') {
    const { error } = await fetchCreateTenant({
      code: model.value.code,
      name: model.value.name,
      maxUsers: model.value.maxUsers,
      maxAccounts: model.value.maxAccounts,
      expireAt: model.value.expireAt,
      contactName: model.value.contactName,
      contactPhone: model.value.contactPhone,
      remark: model.value.remark,
      adminAccount: model.value.adminAccount,
      adminPassword: model.value.adminPassword,
      adminNickName: model.value.adminNickName
    });

    if (!error) {
      window.$message?.success($t('common.addSuccess'));
      closeDrawer();
      emit('submitted');
    }
  } else {
    const { error } = await fetchUpdateTenant({
      id: model.value.id!,
      name: model.value.name,
      maxUsers: model.value.maxUsers,
      maxAccounts: model.value.maxAccounts,
      expireAt: model.value.expireAt,
      contactName: model.value.contactName,
      contactPhone: model.value.contactPhone,
      remark: model.value.remark,
      status: model.value.status!
    });

    if (!error) {
      window.$message?.success($t('common.updateSuccess'));
      closeDrawer();
      emit('submitted');
    }
  }
}

watch(visible, () => {
  if (visible.value) {
    handleInitModel();
    restoreValidation();
  }
});
</script>

<template>
  <NDrawer v-model:show="visible" display-directive="show" :width="360">
    <NDrawerContent :title="title" :native-scrollbar="false" closable>
      <NForm ref="formRef" :model="model" :rules="rules" label-placement="left" :label-width="100">
        <NFormItem v-if="operateType === 'add'" :label="$t('page.system.tenant.code')" path="code">
          <NInput v-model:value="model.code" :placeholder="$t('page.system.tenant.code')" />
        </NFormItem>
        <NFormItem :label="$t('page.system.tenant.name')" path="name">
          <NInput v-model:value="model.name" :placeholder="$t('page.system.tenant.name')" />
        </NFormItem>
        <NFormItem :label="$t('page.system.tenant.maxUsers')" path="maxUsers">
          <NInputNumber v-model:value="model.maxUsers" class="w-full" :min="0" />
        </NFormItem>
        <NFormItem :label="$t('page.system.tenant.maxAccounts')" path="maxAccounts">
          <NInputNumber v-model:value="model.maxAccounts" class="w-full" :min="0" />
        </NFormItem>
        <NFormItem :label="$t('page.system.tenant.expireAt')" path="expireAt">
          <NDatePicker v-model:value="model.expireAt" type="datetime" class="w-full" clearable />
        </NFormItem>
        <NFormItem :label="$t('page.system.tenant.contactName')" path="contactName">
          <NInput v-model:value="model.contactName" :placeholder="$t('page.system.tenant.contactName')" />
        </NFormItem>
        <NFormItem :label="$t('page.system.tenant.contactPhone')" path="contactPhone">
          <NInput v-model:value="model.contactPhone" :placeholder="$t('page.system.tenant.contactPhone')" />
        </NFormItem>
        <NFormItem :label="$t('page.system.tenant.remark')" path="remark">
          <NInput v-model:value="model.remark" type="textarea" :placeholder="$t('page.system.tenant.remark')" />
        </NFormItem>
        <template v-if="operateType === 'add'">
          <NFormItem :label="$t('page.system.tenant.adminAccount')" path="adminAccount">
            <NInput v-model:value="model.adminAccount" :placeholder="$t('page.system.tenant.adminAccount')" />
          </NFormItem>
          <NFormItem :label="$t('page.system.tenant.adminPassword')" path="adminPassword">
            <NInput
              v-model:value="model.adminPassword"
              type="password"
              show-password-on="click"
              :placeholder="$t('page.system.tenant.adminPassword')"
            />
          </NFormItem>
          <NFormItem :label="$t('page.system.tenant.adminNickName')" path="adminNickName">
            <NInput v-model:value="model.adminNickName" :placeholder="$t('page.system.tenant.adminNickName')" />
          </NFormItem>
        </template>
        <NFormItem v-if="operateType === 'edit'" :label="$t('page.system.tenant.status')" path="status">
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
