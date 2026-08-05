<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { jsonClone } from '@sa/utils';
import { enableStatusOptions, resourceTypeOptions, translateNumberOptions } from '@/constants/business';
import { fetchCreateMenu, fetchGetMenuTree, fetchUpdateMenu } from '@/service/api';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';

defineOptions({
  name: 'MenuOperateDrawer'
});

interface Props {
  operateType: NaiveUI.TableOperateType;
  rowData?: Api.SystemManage.Menu | null;
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
    add: $t('page.system.menu.addMenu'),
    edit: $t('page.system.menu.editMenu')
  };
  return titles[props.operateType];
});

type Model = Api.SystemManage.MenuCreateParams & { id?: number };

const model = ref<Model>(createDefaultModel());

function createDefaultModel(): Model {
  return {
    parentId: props.parentId ?? 0,
    name: '',
    alias: '',
    desc: '',
    fUrl: '',
    bUrl: '',
    methods: '',
    path: '',
    resourceType: 2,
    icon: '',
    hideInMenu: 1,
    status: 1,
    sortOrder: 0
  };
}

const rules = computed(() => ({
  name: defaultRequiredRule,
  alias: defaultRequiredRule,
  resourceType: defaultRequiredRule,
  hideInMenu: defaultRequiredRule,
  status: defaultRequiredRule
}));

const parentOptions = ref<CommonType.Option<number, string>[]>([]);
const statusOptions = computed(() => translateNumberOptions(enableStatusOptions));
const resourceTypeSelectOptions = computed(() => translateNumberOptions(resourceTypeOptions));

async function getParentOptions() {
  const { error, data } = await fetchGetMenuTree();

  if (!error) {
    parentOptions.value = [
      { label: $t('page.system.menu.rootParent'), value: 0 },
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

  const payload = {
    name: model.value.name,
    alias: model.value.alias,
    desc: model.value.desc,
    fUrl: model.value.fUrl,
    bUrl: model.value.bUrl,
    methods: model.value.methods,
    parentId: model.value.parentId || 0,
    path: model.value.path,
    resourceType: model.value.resourceType,
    icon: model.value.icon,
    hideInMenu: model.value.hideInMenu,
    status: model.value.status,
    sortOrder: model.value.sortOrder
  };

  if (props.operateType === 'add') {
    const { error } = await fetchCreateMenu(payload);

    if (!error) {
      window.$message?.success($t('common.addSuccess'));
      closeDrawer();
      emit('submitted');
    }
  } else {
    const { error } = await fetchUpdateMenu({
      id: model.value.id!,
      ...payload
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
  <NDrawer v-model:show="visible" display-directive="show" :width="400">
    <NDrawerContent :title="title" :native-scrollbar="false" closable>
      <NForm ref="formRef" :model="model" :rules="rules" label-placement="left" :label-width="100">
        <NFormItem :label="$t('page.system.menu.parentId')" path="parentId">
          <NSelect
            v-model:value="model.parentId"
            :options="parentOptions"
            :placeholder="$t('page.system.menu.parentId')"
          />
        </NFormItem>
        <NFormItem :label="$t('page.system.menu.name')" path="name">
          <NInput v-model:value="model.name" :placeholder="$t('page.system.menu.name')" />
        </NFormItem>
        <NFormItem :label="$t('page.system.menu.alias')" path="alias">
          <NInput v-model:value="model.alias" :placeholder="$t('page.system.menu.alias')" />
        </NFormItem>
        <NFormItem :label="$t('page.system.menu.typeLabel')" path="resourceType">
          <NRadioGroup v-model:value="model.resourceType">
            <NSpace>
              <NRadio
                v-for="item in resourceTypeSelectOptions"
                :key="item.value"
                :value="item.value"
                :label="item.label"
              />
            </NSpace>
          </NRadioGroup>
        </NFormItem>
        <NFormItem :label="$t('page.system.menu.fUrl')" path="fUrl">
          <NInput v-model:value="model.fUrl" :placeholder="$t('page.system.menu.fUrl')" />
        </NFormItem>
        <NFormItem :label="$t('page.system.menu.bUrl')" path="bUrl">
          <NInput v-model:value="model.bUrl" :placeholder="$t('page.system.menu.bUrl')" />
        </NFormItem>
        <NFormItem :label="$t('page.system.menu.methods')" path="methods">
          <NInput v-model:value="model.methods" :placeholder="$t('page.system.menu.methods')" />
        </NFormItem>
        <NFormItem :label="$t('page.system.menu.path')" path="path">
          <NInput v-model:value="model.path" :placeholder="$t('page.system.menu.path')" />
        </NFormItem>
        <NFormItem :label="$t('page.system.menu.icon')" path="icon">
          <NInput v-model:value="model.icon" :placeholder="$t('page.system.menu.icon')" />
        </NFormItem>
        <NFormItem :label="$t('page.system.menu.hideInMenu')" path="hideInMenu">
          <NRadioGroup v-model:value="model.hideInMenu">
            <NSpace>
              <NRadio :value="1" :label="$t('page.system.menu.hideInMenuShow')" />
              <NRadio :value="2" :label="$t('page.system.menu.hideInMenuHide')" />
            </NSpace>
          </NRadioGroup>
        </NFormItem>
        <NFormItem :label="$t('page.system.menu.sortOrder')" path="sortOrder">
          <NInputNumber v-model:value="model.sortOrder" class="w-full" :min="0" />
        </NFormItem>
        <NFormItem :label="$t('page.system.menu.desc')" path="desc">
          <NInput v-model:value="model.desc" type="textarea" :placeholder="$t('page.system.menu.desc')" />
        </NFormItem>
        <NFormItem :label="$t('page.system.menu.status')" path="status">
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
