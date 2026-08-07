<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { farmCardTypeOptions, translateNumberOptions } from '@/constants/business';
import { fetchAddFarmCard } from '@/service/api';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';

defineOptions({
  name: 'FarmCardOperateDrawer'
});

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const visible = defineModel<boolean>('visible', { default: false });

const { formRef, validate, restoreValidation } = useNaiveForm();
const { defaultRequiredRule } = useFormRules();

const title = computed(() => $t('page.farm.card.addCard'));

type Model = Api.Farm.CardCreateParams;

const model = ref<Model>(createDefaultModel());

function createDefaultModel(): Model {
  return {
    cardType: 1,
    value: 30,
    description: '',
    count: 1
  };
}

const rules: Record<string, App.Global.FormRule | App.Global.FormRule[]> = {
  cardType: defaultRequiredRule,
  value: defaultRequiredRule,
  count: defaultRequiredRule
};

const typeOptions = computed(() => translateNumberOptions(farmCardTypeOptions));

function handleInitModel() {
  model.value = createDefaultModel();
}

function closeDrawer() {
  visible.value = false;
}

async function handleSubmit() {
  await validate();

  const { error } = await fetchAddFarmCard({
    cardType: model.value.cardType,
    value: model.value.value,
    description: model.value.description,
    count: model.value.count
  });

  if (!error) {
    window.$message?.success($t('common.addSuccess'));
    closeDrawer();
    emit('submitted');
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
        <NFormItem :label="$t('page.farm.card.cardType.label')" path="cardType">
          <NSelect v-model:value="model.cardType" :options="typeOptions" />
        </NFormItem>
        <NFormItem :label="$t('page.farm.card.value')" path="value">
          <NInputNumber v-model:value="model.value" class="w-full" :min="-1" />
        </NFormItem>
        <NFormItem :label="$t('page.farm.card.count')" path="count">
          <NInputNumber v-model:value="model.count" class="w-full" :min="1" :max="500" />
        </NFormItem>
        <NFormItem :label="$t('page.farm.card.description')" path="description">
          <NInput v-model:value="model.description" type="textarea" :placeholder="$t('page.farm.card.description')" />
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
