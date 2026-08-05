<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { jsonClone } from '@sa/utils';
import { enableStatusOptions, roleTypeOptions, translateNumberOptions } from '@/constants/business';
import { fetchCreateRole, fetchGetRoleTree, fetchUpdateRole } from '@/service/api';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';

defineOptions({
  name: 'RoleOperateDrawer'
});

interface Props {
  operateType: NaiveUI.TableOperateType;
  rowData?: Api.SystemManage.Role | null;
  parentId?: number;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const visible = defineModel<boolean>('visible', { default: false });

const { formRef, validate, restoreValidation } = useNaiveForm();
const { defaultRequiredRule } = useFormRules();

const title = computed(() => {
  const titles: Record<NaiveUI.TableOperateType, string> = {
    add: $t('page.system.role.addRole'),
    edit: $t('page.system.role.editRole')
  };
  return titles[props.operateType];
});

type Model = Api.SystemManage.RoleCreateParams & { id?: number };

const model = ref<Model>(createDefaultModel());

function createDefaultModel(): Model {
  return {
    parentId: props.parentId ?? 0,
    name: '',
    code: '',
    desc: '',
    roleType: 2,
    status: 1
  };
}

const rules = computed(() => ({
  name: defaultRequiredRule,
  code: defaultRequiredRule,
  roleType: defaultRequiredRule,
  status: defaultRequiredRule
}));

const parentOptions = ref<CommonType.Option<number, string>[]>([]);
const statusOptions = computed(() => translateNumberOptions(enableStatusOptions));
const roleTypeSelectOptions = computed(() => translateNumberOptions(roleTypeOptions));

async function getParentOptions() {
  const { error, data } = await fetchGetRoleTree();

  if (!error) {
    parentOptions.value = [
      { label: $t('page.system.role.rootParent'), value: 0 },
      ...data.map(item => ({
        label: item.name,
        value: item.id
      }))
    ];
  }
}

function handleInitModel() {
  model.value = createDefaultModel();

  if (props.operateType === 'edit' && props.rowData) {
    Object.assign(model.value, jsonClone(props.rowData));
  } else if (props.parentId !== undefined) {
    model.value.parentId = props.parentId;
  }
}

function closeDrawer() {
  visible.value = false;
}

async function handleSubmit() {
  await validate();

  if (props.operateType === 'add') {
    const { error } = await fetchCreateRole({
      parentId: model.value.parentId || 0,
      name: model.value.name,
      code: model.value.code,
      desc: model.value.desc,
      roleType: model.value.roleType,
      status: model.value.status
    });

    if (!error) {
      window.$message?.success($t('common.addSuccess'));
      closeDrawer();
      emit('submitted');
    }
  } else {
    const { error } = await fetchUpdateRole({
      id: model.value.id!,
      parentId: model.value.parentId || 0,
      name: model.value.name,
      code: model.value.code,
      desc: model.value.desc,
      roleType: model.value.roleType,
      status: model.value.status
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
    getParentOptions();
  }
});
</script>

<template>
  <NDrawer v-model:show="visible" display-directive="show" :width="360">
    <NDrawerContent :title="title" :native-scrollbar="false" closable>
      <NForm ref="formRef" :model="model" :rules="rules" label-placement="left" :label-width="100">
        <NFormItem :label="$t('page.system.role.parentId')" path="parentId">
          <NSelect
            v-model:value="model.parentId"
            :options="parentOptions"
            :placeholder="$t('page.system.role.parentId')"
          />
        </NFormItem>
        <NFormItem :label="$t('page.system.role.name')" path="name">
          <NInput v-model:value="model.name" :placeholder="$t('page.system.role.name')" />
        </NFormItem>
        <NFormItem :label="$t('page.system.role.code')" path="code">
          <NInput v-model:value="model.code" :placeholder="$t('page.system.role.code')" />
        </NFormItem>
        <NFormItem :label="$t('page.system.role.desc')" path="desc">
          <NInput v-model:value="model.desc" type="textarea" :placeholder="$t('page.system.role.desc')" />
        </NFormItem>
        <NFormItem :label="$t('page.system.role.typeLabel')" path="roleType">
          <NRadioGroup v-model:value="model.roleType">
            <NSpace>
              <NRadio v-for="item in roleTypeSelectOptions" :key="item.value" :value="item.value" :label="item.label" />
            </NSpace>
          </NRadioGroup>
        </NFormItem>
        <NFormItem :label="$t('page.system.role.status')" path="status">
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
