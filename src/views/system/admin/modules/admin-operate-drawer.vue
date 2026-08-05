<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { enableStatusOptions, translateNumberOptions } from '@/constants/business';
import { fetchCreateAdmin, fetchGetAssignableRoles, fetchUpdateAdmin } from '@/service/api';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';

defineOptions({
  name: 'AdminOperateDrawer'
});

interface Props {
  operateType: NaiveUI.TableOperateType;
  rowData?: Api.SystemManage.Admin | null;
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
    add: $t('page.system.admin.addAdmin'),
    edit: $t('page.system.admin.editAdmin')
  };
  return titles[props.operateType];
});

type Model = {
  id?: number;
  account: string;
  password: string;
  nickName: string;
  realName: string;
  phone: string;
  email: string;
  roleIdList: number[];
  status: Api.SystemManage.EnableStatus;
};

const model = ref<Model>(createDefaultModel());

function createDefaultModel(): Model {
  return {
    account: '',
    password: '',
    nickName: '',
    realName: '',
    phone: '',
    email: '',
    roleIdList: [],
    status: 1
  };
}

const rules = computed(() => {
  const base: Record<string, App.Global.FormRule | App.Global.FormRule[]> = {
    nickName: defaultRequiredRule,
    status: defaultRequiredRule,
    roleIdList: defaultRequiredRule
  };

  if (props.operateType === 'add') {
    base.account = formRules.userName;
    base.password = formRules.pwd;
  }

  return base;
});

const roleOptions = ref<CommonType.Option<number, string>[]>([]);
const statusOptions = computed(() => translateNumberOptions(enableStatusOptions));

async function getRoleOptions() {
  const { error, data } = await fetchGetAssignableRoles();

  if (!error) {
    roleOptions.value = data.map(item => ({
      label: item.name,
      value: item.id
    }));
  }
}

function parseRoleIds(roleIds: string): number[] {
  if (!roleIds) return [];
  return roleIds
    .split(',')
    .map(id => Number(id.trim()))
    .filter(id => !Number.isNaN(id));
}

function handleInitModel() {
  model.value = createDefaultModel();

  if (props.operateType === 'edit' && props.rowData) {
    const { id, account, nickName, realName, phone, email, roleIds, status } = props.rowData;
    Object.assign(model.value, {
      id,
      account,
      nickName,
      realName: realName || '',
      phone: phone || '',
      email: email || '',
      roleIdList: parseRoleIds(roleIds),
      status
    });
  }
}

function closeDrawer() {
  visible.value = false;
}

async function handleSubmit() {
  await validate();

  const roleIds = model.value.roleIdList.join(',');

  if (props.operateType === 'add') {
    const { error } = await fetchCreateAdmin({
      account: model.value.account,
      password: model.value.password,
      nickName: model.value.nickName,
      realName: model.value.realName || undefined,
      phone: model.value.phone || undefined,
      email: model.value.email || undefined,
      roleIds,
      status: model.value.status
    });

    if (!error) {
      window.$message?.success($t('common.addSuccess'));
      closeDrawer();
      emit('submitted');
    }
  } else {
    const { error } = await fetchUpdateAdmin({
      id: model.value.id!,
      nickName: model.value.nickName,
      realName: model.value.realName || undefined,
      phone: model.value.phone || undefined,
      email: model.value.email || undefined,
      roleIds,
      status: model.value.status,
      password: model.value.password || undefined
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
    getRoleOptions();
  }
});
</script>

<template>
  <NDrawer v-model:show="visible" display-directive="show" :width="360">
    <NDrawerContent :title="title" :native-scrollbar="false" closable>
      <NForm ref="formRef" :model="model" :rules="rules" label-placement="left" :label-width="100">
        <NFormItem v-if="operateType === 'add'" :label="$t('page.system.admin.account')" path="account">
          <NInput v-model:value="model.account" :placeholder="$t('page.system.admin.account')" />
        </NFormItem>
        <NFormItem v-else :label="$t('page.system.admin.account')">
          <NInput :value="model.account" disabled />
        </NFormItem>
        <NFormItem
          :label="operateType === 'add' ? $t('page.system.admin.password') : $t('page.system.admin.newPassword')"
          :path="operateType === 'add' ? 'password' : undefined"
        >
          <NInput
            v-model:value="model.password"
            type="password"
            show-password-on="click"
            :placeholder="
              operateType === 'add' ? $t('page.system.admin.password') : $t('page.system.admin.newPassword')
            "
          />
        </NFormItem>
        <NFormItem :label="$t('page.system.admin.nickName')" path="nickName">
          <NInput v-model:value="model.nickName" :placeholder="$t('page.system.admin.nickName')" />
        </NFormItem>
        <NFormItem :label="$t('page.system.admin.realName')" path="realName">
          <NInput v-model:value="model.realName" :placeholder="$t('page.system.admin.realName')" />
        </NFormItem>
        <NFormItem :label="$t('page.system.admin.phone')" path="phone">
          <NInput v-model:value="model.phone" :placeholder="$t('page.system.admin.phone')" />
        </NFormItem>
        <NFormItem :label="$t('page.system.admin.email')" path="email">
          <NInput v-model:value="model.email" :placeholder="$t('page.system.admin.email')" />
        </NFormItem>
        <NFormItem :label="$t('page.system.admin.roles')" path="roleIdList">
          <NSelect
            v-model:value="model.roleIdList"
            :options="roleOptions"
            multiple
            :placeholder="$t('page.system.admin.roles')"
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
