<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { farmEnableStatusOptions, farmPlatformOptions, translateStringOptions } from '@/constants/business';
import { fetchAddFarmAccount, fetchModifyFarmAccount } from '@/service/api';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';

defineOptions({
  name: 'FarmAccountOperateDrawer'
});

interface Props {
  operateType: NaiveUI.TableOperateType;
  rowData?: Api.Farm.Account | null;
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
    add: $t('page.farm.account.addAccount'),
    edit: $t('page.farm.account.editAccount')
  };
  return titles[props.operateType];
});

type Model = Api.Farm.AccountCreateParams & Partial<Pick<Api.Farm.AccountUpdateParams, 'id' | 'status'>>;

const model = ref<Model>(createDefaultModel());
const urlHint = ref('');

function createDefaultModel(): Model {
  return {
    code: '',
    name: '',
    platform: 'qq',
    remark: '',
    status: '1'
  };
}

const rules: Record<string, App.Global.FormRule | App.Global.FormRule[]> = {
  code: defaultRequiredRule,
  platform: defaultRequiredRule
};

const statusOptions = computed(() => translateStringOptions(farmEnableStatusOptions));
const platformOptions = computed(() => translateStringOptions(farmPlatformOptions));

function decodeParam(value: string | null | undefined): string {
  const raw = String(value || '').trim();
  if (!raw) return '';
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function looksLikeLoginUrl(raw: string): boolean {
  return /^https?:\/\//i.test(raw) || /^wss?:\/\//i.test(raw) || /[?&](?:code|platform|os|ver)=/i.test(raw);
}

function parseLoginInput(rawInput: string): {
  code: string;
  platform: '' | Api.Farm.Platform;
  os: string;
  ver: string;
} {
  const raw = String(rawInput || '').trim();
  const result: { code: string; platform: '' | Api.Farm.Platform; os: string; ver: string } = {
    code: raw,
    platform: '',
    os: '',
    ver: ''
  };
  if (!raw || !looksLikeLoginUrl(raw)) {
    return result;
  }

  try {
    let href = raw;
    if (!/^[a-z][a-z0-9+.-]*:/i.test(href)) {
      href = href.startsWith('/') ? `http://127.0.0.1${href}` : `http://127.0.0.1/prod/ws?${href.replace(/^\?/, '')}`;
    }
    const url = new URL(href);
    const code = decodeParam(url.searchParams.get('code'));
    const platform = decodeParam(url.searchParams.get('platform')).toLowerCase();
    result.os = decodeParam(url.searchParams.get('os'));
    result.ver = decodeParam(url.searchParams.get('ver'));
    if (code) result.code = code;
    if (platform === 'qq' || platform === 'wx') result.platform = platform;
    return result;
  } catch {
    const codeMatch = raw.match(/[?&]code=([^&\s#]+)/i);
    if (codeMatch?.[1]) result.code = decodeParam(codeMatch[1]);
    const platformMatch = raw.match(/[?&]platform=([^&\s#]+)/i);
    if (platformMatch?.[1]) {
      const platform = decodeParam(platformMatch[1]).toLowerCase();
      if (platform === 'qq' || platform === 'wx') result.platform = platform;
    }
    const osMatch = raw.match(/[?&]os=([^&\s#]+)/i);
    if (osMatch?.[1]) result.os = decodeParam(osMatch[1]);
    const verMatch = raw.match(/[?&]ver=([^&\s#]+)/i);
    if (verMatch?.[1]) result.ver = decodeParam(verMatch[1]);
    return result;
  }
}

function onCodeInput(value: string | null) {
  const raw = String(value ?? '');
  model.value.code = raw;
  if (!looksLikeLoginUrl(raw)) {
    urlHint.value = '';
    return;
  }
  const parsed = parseLoginInput(raw);
  if (parsed.platform) {
    model.value.platform = parsed.platform;
  }
  const parts: string[] = [];
  if (parsed.platform) {
    parts.push(`${$t('page.farm.account.platform')} ${parsed.platform === 'wx' ? '微信' : 'QQ'}`);
  }
  if (parsed.os) parts.push(`os ${parsed.os}`);
  if (parsed.ver) parts.push(`ver ${parsed.ver}`);
  urlHint.value = parts.length ? $t('page.farm.account.urlHint', { detail: parts.join(' / ') }) : '';
}

function handleInitModel() {
  model.value = createDefaultModel();
  urlHint.value = '';

  if (props.operateType === 'edit' && props.rowData) {
    const { id, name, code, platform, remark, status } = props.rowData;
    Object.assign(model.value, {
      id,
      name: name || '',
      code: code || '',
      platform: platform || 'qq',
      remark: remark || '',
      status: status !== undefined && status !== null ? (String(status) as Api.Farm.EnableStatus) : '1'
    });
  }
}

function closeDrawer() {
  visible.value = false;
}

async function handleSubmit() {
  try {
    await validate();
  } catch {
    return;
  }

  const rawInput = String(model.value.code || '').trim();
  if (!rawInput) {
    window.$message?.warning($t('page.farm.account.codeRequired'));
    return;
  }

  const parsed = parseLoginInput(rawInput);
  const codeForApi = looksLikeLoginUrl(rawInput) ? rawInput : parsed.code || rawInput;
  const platform = parsed.platform || model.value.platform || 'qq';

  if (props.operateType === 'add') {
    const { error } = await fetchAddFarmAccount({
      code: codeForApi,
      name: String(model.value.name || '').trim(),
      platform,
      remark: model.value.remark
    });

    if (!error) {
      window.$message?.success($t('common.addSuccess'));
      closeDrawer();
      emit('submitted');
    }
  } else {
    const { error } = await fetchModifyFarmAccount({
      id: model.value.id!,
      code: codeForApi,
      name: String(model.value.name || '').trim(),
      platform,
      remark: model.value.remark,
      status: (Number(model.value.status || 1) === 2 ? 2 : 1) as unknown as Api.Farm.EnableStatus
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
  <NDrawer v-model:show="visible" display-directive="if" to="body" :width="420">
    <NDrawerContent :title="title" :native-scrollbar="false" closable>
      <NForm ref="formRef" :model="model" :rules="rules" label-placement="top">
        <NFormItem :label="$t('page.farm.account.name')" path="name">
          <NInput v-model:value="model.name" :placeholder="$t('page.farm.account.namePlaceholder')" />
        </NFormItem>
        <NFormItem :label="$t('page.farm.account.code')" path="code">
          <NInput
            :value="model.code"
            type="textarea"
            :rows="4"
            :placeholder="$t('page.farm.account.codePlaceholder')"
            @update:value="onCodeInput"
          />
        </NFormItem>
        <p v-if="urlHint" class="mb-12px text-12px text-primary">{{ urlHint }}</p>
        <NFormItem :label="$t('page.farm.account.platform')" path="platform">
          <NRadioGroup v-model:value="model.platform">
            <NSpace>
              <NRadio v-for="item in platformOptions" :key="item.value" :value="item.value" :label="item.label" />
            </NSpace>
          </NRadioGroup>
        </NFormItem>
        <NFormItem :label="$t('page.farm.account.remark')" path="remark">
          <NInput v-model:value="model.remark" type="textarea" :placeholder="$t('page.farm.account.remark')" />
        </NFormItem>
        <NFormItem v-if="operateType === 'edit'" :label="$t('page.farm.account.status')" path="status">
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
