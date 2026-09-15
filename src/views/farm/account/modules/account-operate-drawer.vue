<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { farmEnableStatusOptions, farmPlatformOptions, translateStringOptions } from '@/constants/business';
import {
  fetchAddFarmAccount,
  fetchConfirmFarmWxLogin,
  fetchConfirmFarmWxQuickLogin,
  fetchCreateFarmWxLoginTask,
  fetchCreateFarmWxQuickLoginSession,
  fetchFarmWxLoginCode,
  fetchFarmWxLoginStatus,
  fetchModifyFarmAccount,
  fetchStartFarmAccount
} from '@/service/api';
import { getAuthorization } from '@/service/request/shared';
import { getServiceBaseURL } from '@/utils/service';
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
type LoginTab = 'code' | 'wx';
type WxMode = 'local' | 'qr';

const model = ref<Model>(createDefaultModel());
const urlHint = ref('');
const activeLoginTab = ref<LoginTab>('code');
const wxMode = ref<WxMode>('local');
const wxTaskId = ref('');
const wxSessionId = ref('');
const wxQuickPort = ref<number | null>(null);
const wxQuickProfile = ref<{ authorizeUuid?: string; nickname?: string; headimgurl?: string } | null>(null);
const wxQuickOAuth = ref<{ appid: string; scope: string; redirect_uri: string; state: string; ports: number[] } | null>(
  null
);
const wxStatus = ref('');
const wxError = ref('');
const wxLoading = ref(false);
const wxQrUrl = ref('');
const wxSubmitting = ref(false);
let wxPollTimer: ReturnType<typeof setTimeout> | undefined;
let wxQrObjectUrl = '';

function createDefaultModel(): Model {
  return {
    code: '',
    name: '',
    platform: 'qq',
    remark: '',
    status: '1'
  };
}

const rules = computed<Record<string, App.Global.FormRule | App.Global.FormRule[]>>(() => {
  const base: Record<string, App.Global.FormRule | App.Global.FormRule[]> = {
    platform: defaultRequiredRule
  };
  if (activeLoginTab.value !== 'wx') {
    base.code = defaultRequiredRule;
  }
  return base;
});

const statusOptions = computed(() => translateStringOptions(farmEnableStatusOptions));
const platformOptions = computed(() => translateStringOptions(farmPlatformOptions));
const isAddMode = computed(() => props.operateType === 'add');
const isWxTab = computed(() => activeLoginTab.value === 'wx');
const isWxLocalMode = computed(() => wxMode.value === 'local');

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

function stopWxPolling() {
  if (wxPollTimer) {
    clearTimeout(wxPollTimer);
    wxPollTimer = undefined;
  }
}

function resetWxLogin() {
  stopWxPolling();
  if (wxQrObjectUrl) {
    URL.revokeObjectURL(wxQrObjectUrl);
    wxQrObjectUrl = '';
  }
  wxTaskId.value = '';
  wxSessionId.value = '';
  wxQuickPort.value = null;
  wxQuickProfile.value = null;
  wxQuickOAuth.value = null;
  wxStatus.value = '';
  wxError.value = '';
  wxQrUrl.value = '';
  wxLoading.value = false;
  wxSubmitting.value = false;
}

async function fetchWxQrBlob(qrUrl: string) {
  const isHttpProxy = import.meta.env.DEV && import.meta.env.VITE_HTTP_PROXY === 'Y';
  const { baseURL } = getServiceBaseURL(import.meta.env, isHttpProxy);
  const headers: Record<string, string> = {};
  const Authorization = getAuthorization();
  if (Authorization) headers.Authorization = Authorization;
  const response = await fetch(`${baseURL}${qrUrl}`, { headers });
  if (!response.ok) {
    throw new Error('二维码获取失败');
  }
  return response.blob();
}

function authorizePosition() {
  const width = 360;
  const height = 263;
  const left = window.screenX || window.screenLeft || 0;
  const top = window.screenY || window.screenTop || 0;
  return {
    x: Math.round(left + (window.outerWidth || window.innerWidth) / 2 - width / 2),
    y: Math.round(top + (window.outerHeight || window.innerHeight) / 2 - height / 2)
  };
}

async function saveWxCode(codeInput: string) {
  wxSubmitting.value = true;
  wxStatus.value = '正在保存账号...';
  try {
    const code = String(codeInput).trim();
    const name = String(model.value.name || '').trim();
    const remark = model.value.remark;
    if (props.operateType === 'edit') {
      if (!model.value.id) {
        throw new Error('账号信息不完整');
      }
      const { error: modifyError } = await fetchModifyFarmAccount({
        id: model.value.id,
        code,
        name,
        platform: 'wx',
        remark,
        status: (Number(model.value.status || 1) === 2 ? 2 : 1) as unknown as Api.Farm.EnableStatus
      });
      if (modifyError) {
        throw new Error((modifyError as any)?.message || '更新账号失败');
      }
      // 后端刷新 code 时也会自动重启账号，但对已停止账号这是双保险
      const { error: startError } = await fetchStartFarmAccount(model.value.id);
      if (startError) {
        window.$message?.warning($t('common.updateSuccess') + '，自动启动失败，请手动重新登录');
      } else {
        window.$message?.success($t('common.updateSuccess') + '，已自动启动');
      }
    } else {
      const { data: added, error: addError } = await fetchAddFarmAccount({
        name,
        code,
        platform: 'wx',
        remark
      });
      if (addError) {
        throw new Error((addError as any)?.message || '保存账号失败');
      }
      if (added?.id) {
        const { error: startError } = await fetchStartFarmAccount(added.id);
        if (startError) {
          window.$message?.warning($t('common.addSuccess') + '，自动启动失败，请手动点击启动');
        } else {
          window.$message?.success($t('common.addSuccess') + '，已自动启动');
        }
      } else {
        window.$message?.success($t('common.addSuccess'));
      }
    }
    closeDrawer();
    emit('submitted');
  } finally {
    wxSubmitting.value = false;
  }
}

async function getWxCodeAndSave() {
  const { data, error } = await fetchFarmWxLoginCode(wxTaskId.value);
  if (error || !data?.code) {
    throw new Error((error as any)?.message || '未获取到登录 Code');
  }
  await saveWxCode(String(data.code));
}

// 本机微信本地 API（对齐 YYB-Go-Enhanced scan.html）：浏览器直连
// https://localhost.weixin.qq.com:<port>，微信本地服务按 TLS 指纹过滤客户端，
// 仅浏览器可通过；响应可能是 JSON 字符串再包一层，需二次解析。
interface LocalWechatPayload {
  errcode: number;
  jsdata: Record<string, any>;
}

function parseLocalWechatResponse(text: string): LocalWechatPayload {
  const raw = text.trim();
  if (!raw) throw new Error('本机微信返回空响应');
  let value: any;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error('本机微信返回了无法解析的响应');
  }
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch {
      throw new Error('本机微信返回了无法解析的响应');
    }
  }
  return { errcode: Number(value?.errcode ?? 0), jsdata: value?.jsdata ?? {} };
}

async function localWechatFetch(
  port: number,
  path: string,
  body: unknown,
  timeoutMs = 3000
): Promise<LocalWechatPayload> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`https://localhost.weixin.qq.com:${port}${path}`, {
      method: 'post',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`本机微信 HTTP ${response.status}（端口 ${port}）`);
    return parseLocalWechatResponse(await response.text());
  } catch (err: any) {
    if (err?.name === 'AbortError') throw new Error(`连接本机微信超时（端口 ${port}）`, { cause: err });
    if (String(err?.message || '').includes('本机微信')) throw err;
    throw new Error(`连接本机微信失败（端口 ${port}）`, { cause: err });
  } finally {
    clearTimeout(timer);
  }
}

async function detectLocalWechat() {
  wxLoading.value = true;
  wxError.value = '';
  wxQuickPort.value = null;
  wxQuickProfile.value = null;
  wxStatus.value = '正在检测本机微信...';
  try {
    const { data, error } = await fetchCreateFarmWxQuickLoginSession();
    if (error || !data?.session_id) {
      throw new Error((error as any)?.message || '创建快速授权会话失败');
    }
    wxSessionId.value = String(data.session_id);
    wxQuickOAuth.value = {
      appid: data.appid,
      scope: data.scope,
      redirect_uri: data.redirect_uri,
      state: data.state,
      ports: Array.isArray(data.ports) ? data.ports : []
    };
    const probes = await Promise.all(
      wxQuickOAuth.value.ports.map(async port => {
        try {
          const payload = await localWechatFetch(port, '/api/check-login', {
            apiname: 'qrconnectchecklogin',
            jsdata: {
              appid: data.appid,
              scope: data.scope,
              redirect_uri: data.redirect_uri,
              state: data.state
            }
          });
          return { port, payload };
        } catch {
          return null;
        }
      })
    );
    const match = probes.find(
      item => item && item.payload.errcode === 0 && String(item.payload.jsdata?.authorize_uuid ?? '').trim() !== ''
    );
    if (!match) {
      throw new Error('未检测到可用的桌面微信（请确认 Windows 桌面微信已登录且未锁定）');
    }
    wxQuickPort.value = match.port;
    wxQuickProfile.value = {
      authorizeUuid: String(match.payload.jsdata.authorize_uuid),
      nickname: match.payload.jsdata.nickname,
      headimgurl: match.payload.jsdata.headimgurl
    };
    wxStatus.value = wxQuickProfile.value.nickname
      ? `${wxQuickProfile.value.nickname} · 请在电脑微信中确认`
      : '本机微信已就绪，请点击授权';
  } catch (err: any) {
    // 微信 4.0（Weixin.exe）已封锁本机快速授权：非浏览器客户端 TLS 握手被直接
    // 断开，浏览器侧 CORS 也仅放行 weixin.qq.com 系页面（实测 2026-09）。
    // 检测失败自动回退扫码登录。
    wxError.value = err?.message || '本机微信不可用';
    wxStatus.value = '微信 4.0 已不支持本机快速授权，已自动切换到扫码登录';
    wxMode.value = 'qr';
    void startWxLogin();
  } finally {
    wxLoading.value = false;
  }
}

async function authorizeLocalWechat() {
  const port = wxQuickPort.value;
  const profile = wxQuickProfile.value;
  const oauth = wxQuickOAuth.value;
  if (!port || !profile?.authorizeUuid || !wxSessionId.value || !oauth) {
    wxError.value = '请先检测本机微信';
    return;
  }
  wxSubmitting.value = true;
  wxError.value = '';
  wxStatus.value = '等待电脑微信确认...';
  try {
    const pos = authorizePosition();
    const payload = await localWechatFetch(
      port,
      '/api/authorize',
      {
        apiname: 'qrconnectfastauthorize',
        jsdata: {
          data: JSON.stringify(pos),
          appid: oauth.appid,
          scope: oauth.scope,
          redirect_uri: oauth.redirect_uri,
          state: oauth.state,
          authorize_uuid: profile.authorizeUuid
        }
      },
      120_000
    );
    const errcode = Number(payload.errcode);
    if (errcode === 10050) throw new Error('已在微信中拒绝授权，请重新检测');
    if (errcode === 10046) throw new Error('授权已超时，请重新检测');
    if (errcode === 10057) {
      wxMode.value = 'qr';
      void startWxLogin();
      throw new Error('当前应用仅支持扫码授权');
    }
    const redirectUrl = String(payload.jsdata?.redirect_url ?? '').trim();
    if (errcode !== 0 || !redirectUrl) {
      throw new Error('桌面微信未返回有效授权结果，请重新检测');
    }
    const { data, error } = await fetchConfirmFarmWxQuickLogin(wxSessionId.value, redirectUrl);
    if (error || !data?.code) {
      throw new Error((error as any)?.message || '快速授权确认失败');
    }
    await saveWxCode(String(data.code));
  } catch (err: any) {
    wxError.value = err?.message || '快速授权失败';
    wxStatus.value = '快速授权失败';
  } finally {
    wxSubmitting.value = false;
  }
}

async function confirmWxLogin() {
  wxStatus.value = '正在建立登录会话...';
  const { error } = await fetchConfirmFarmWxLogin(wxTaskId.value);
  if (error) {
    throw new Error((error as any)?.message || '确认登录失败');
  }
  await getWxCodeAndSave();
}

async function pollWxLogin() {
  if (!wxTaskId.value) return;
  try {
    const { data, error } = await fetchFarmWxLoginStatus(wxTaskId.value);
    if (error) {
      wxError.value = (error as any)?.message || '登录状态检查失败';
      return;
    }
    const status = data?.status;
    if (status === 'waiting') wxStatus.value = '等待微信扫码';
    else if (status === 'scanned') wxStatus.value = '已扫码，请在手机上确认';
    else if (status === 'authorized') {
      stopWxPolling();
      await confirmWxLogin();
      return;
    } else if (['cancelled', 'expired', 'failed'].includes(String(status))) {
      wxError.value = '二维码已失效，请重新获取';
      return;
    }
    wxPollTimer = setTimeout(pollWxLogin, 1200);
  } catch (err: any) {
    wxError.value = err?.message || '登录状态检查失败';
  }
}

async function startWxLogin() {
  resetWxLogin();
  wxLoading.value = true;
  model.value.platform = 'wx';
  try {
    const { data, error } = await fetchCreateFarmWxLoginTask();
    if (error || !data?.task_id) {
      throw new Error((error as any)?.message || '未创建登录任务');
    }
    wxTaskId.value = data.task_id;
    const blob = await fetchWxQrBlob(data.qr_url || `/farm/wx-login/tasks/${data.task_id}/qr`);
    wxQrObjectUrl = URL.createObjectURL(blob);
    wxQrUrl.value = wxQrObjectUrl;
    wxStatus.value = '等待微信扫码';
    void pollWxLogin();
  } catch (err: any) {
    wxError.value = err?.message || '二维码获取失败';
  } finally {
    wxLoading.value = false;
  }
}

function onLoginTabChange(tab: string | number) {
  const next = (tab === 'wx' ? 'wx' : 'code') as LoginTab;
  activeLoginTab.value = next;
  if (next === 'wx') {
    model.value.platform = 'wx';
    if (wxMode.value === 'local') {
      void detectLocalWechat();
    } else {
      void startWxLogin();
    }
  } else {
    resetWxLogin();
  }
}

function onWxModeChange(mode: string | number) {
  wxMode.value = mode === 'qr' ? 'qr' : 'local';
  resetWxLogin();
  if (wxMode.value === 'local') {
    void detectLocalWechat();
  } else {
    void startWxLogin();
  }
}

function handleInitModel() {
  model.value = createDefaultModel();
  urlHint.value = '';
  activeLoginTab.value = 'code';
  wxMode.value = 'local';
  resetWxLogin();

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
  resetWxLogin();
  visible.value = false;
}

async function handleSubmit() {
  if (activeLoginTab.value === 'wx') {
    window.$message?.info(isAddMode.value ? '请使用微信授权完成添加' : '请使用微信授权完成更新');
    return;
  }

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
  } else {
    resetWxLogin();
  }
});

onBeforeUnmount(() => {
  resetWxLogin();
});
</script>

<template>
  <NDrawer v-model:show="visible" display-directive="if" to="body" :width="420">
    <NDrawerContent :title="title" :native-scrollbar="false" closable>
      <NForm ref="formRef" :model="model" :rules="rules" label-placement="top">
        <NFormItem :label="$t('page.farm.account.name')" path="name">
          <NInput v-model:value="model.name" :placeholder="$t('page.farm.account.namePlaceholder')" />
        </NFormItem>

        <NTabs :value="activeLoginTab" type="segment" class="mb-12px" @update:value="onLoginTabChange">
          <NTab name="code" tab="输入 code" />
          <NTab name="wx" tab="微信授权" />
        </NTabs>

        <template v-if="!isWxTab">
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
        </template>

        <template v-else>
          <NTabs :value="wxMode" type="line" class="mb-12px" @update:value="onWxModeChange">
            <NTab name="local" tab="本机微信" />
            <NTab name="qr" tab="扫码" />
          </NTabs>

          <div v-if="isWxLocalMode" class="mb-12px flex flex-col items-center gap-12px">
            <NSpin :show="wxLoading || wxSubmitting">
              <div
                class="min-h-180px w-full flex flex-col items-center justify-center gap-8px rounded-8px bg-#f5f5f5 p-16px"
              >
                <img
                  v-if="wxQuickProfile?.headimgurl"
                  :src="wxQuickProfile.headimgurl"
                  alt="微信头像"
                  class="h-72px w-72px rounded-full object-cover"
                />
                <span v-else class="text-40px">微</span>
                <p class="text-14px font-600">{{ wxQuickProfile?.nickname || '本机微信' }}</p>
                <p class="text-center text-13px text-#666">{{ wxStatus || '准备检测本机微信' }}</p>
              </div>
            </NSpin>
            <p v-if="wxError" class="text-13px text-error">{{ wxError }}</p>
            <NSpace>
              <NButton
                size="small"
                type="primary"
                :loading="wxSubmitting"
                :disabled="!wxQuickPort"
                @click="authorizeLocalWechat"
              >
                使用本机微信授权
              </NButton>
              <NButton size="small" :loading="wxLoading" @click="detectLocalWechat">重新检测</NButton>
            </NSpace>
          </div>

          <div v-else class="mb-12px flex flex-col items-center gap-12px">
            <NSpin :show="wxLoading || wxSubmitting">
              <div class="h-220px w-220px flex items-center justify-center overflow-hidden rounded-8px bg-#f5f5f5">
                <img v-if="wxQrUrl" :src="wxQrUrl" alt="微信登录二维码" class="h-full w-full object-contain" />
                <span v-else class="text-13px text-#999">二维码加载中</span>
              </div>
            </NSpin>
            <p class="text-13px text-primary">{{ wxStatus || '准备扫码登录' }}</p>
            <p v-if="wxError" class="text-13px text-error">{{ wxError }}</p>
            <NButton size="small" :loading="wxLoading" @click="startWxLogin">刷新二维码</NButton>
          </div>
        </template>

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
          <NButton v-if="!isWxTab" type="primary" @click="handleSubmit">
            {{ $t('common.confirm') }}
          </NButton>
        </NSpace>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped></style>
