<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import type { VNode } from 'vue';
import { fetchChangePassword } from '@/service/api';
import { useAuthStore } from '@/store/modules/auth';
import { useAuth } from '@/hooks/business/auth';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { useRouterPush } from '@/hooks/common/router';
import { useSvgIcon } from '@/hooks/common/icon';
import { $t } from '@/locales';
import CardRedeemDrawer from '@/views/farm/card/modules/card-redeem-drawer.vue';

defineOptions({
  name: 'UserAvatar'
});

const authStore = useAuthStore();
const { hasAuth } = useAuth();
const { toLogin } = useRouterPush();
const { SvgIconVNode } = useSvgIcon();

const showPwdModal = ref(false);
const redeemVisible = ref(false);
const submitting = ref(false);
const { formRef, validate, restoreValidation } = useNaiveForm();

interface PwdFormModel {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const pwdModel = reactive<PwdFormModel>({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
});

const pwdRules = computed(() => {
  const { formRules, createConfirmPwdRule, createRequiredRule } = useFormRules();

  return {
    oldPassword: [createRequiredRule($t('common.oldPasswordRequired'))],
    newPassword: formRules.pwd,
    confirmPassword: createConfirmPwdRule(computed(() => pwdModel.newPassword))
  };
});

function loginOrRegister() {
  toLogin();
}

type DropdownKey = 'password' | 'redeem' | 'logout';

type DropdownOption =
  | {
      key: DropdownKey;
      label: string;
      icon?: () => VNode;
    }
  | {
      type: 'divider';
      key: string;
    };

const options = computed(() => {
  const opts: DropdownOption[] = [
    {
      label: $t('common.changePassword'),
      key: 'password',
      icon: SvgIconVNode({ icon: 'ph:lock-key', fontSize: 18 })
    }
  ];

  if (hasAuth('farm-card:redeem')) {
    opts.push({
      label: $t('page.farm.card.redeem'),
      key: 'redeem',
      icon: SvgIconVNode({ icon: 'mdi:ticket-confirmation-outline', fontSize: 18 })
    });
  }

  opts.push(
    { type: 'divider', key: 'divider' },
    {
      label: $t('common.logout'),
      key: 'logout',
      icon: SvgIconVNode({ icon: 'ph:sign-out', fontSize: 18 })
    }
  );

  return opts;
});

function resetPwdForm() {
  pwdModel.oldPassword = '';
  pwdModel.newPassword = '';
  pwdModel.confirmPassword = '';
  restoreValidation();
}

function openPwdModal() {
  resetPwdForm();
  showPwdModal.value = true;
}

function logout() {
  window.$dialog?.info({
    title: $t('common.tip'),
    content: $t('common.logoutConfirm'),
    positiveText: $t('common.confirm'),
    negativeText: $t('common.cancel'),
    onPositiveClick: () => authStore.resetStore()
  });
}

function handleDropdown(key: DropdownKey) {
  if (key === 'logout') {
    logout();
    return;
  }
  if (key === 'password') {
    openPwdModal();
    return;
  }
  if (key === 'redeem') {
    redeemVisible.value = true;
  }
}

async function handleChangePassword() {
  await validate();
  submitting.value = true;
  const { error } = await fetchChangePassword({
    oldPassword: pwdModel.oldPassword,
    newPassword: pwdModel.newPassword
  });
  submitting.value = false;

  if (!error) {
    showPwdModal.value = false;
    window.$message?.success($t('common.changePasswordSuccess'));
    authStore.resetStore();
  }
}
</script>

<template>
  <NButton v-if="!authStore.isLogin" quaternary @click="loginOrRegister">
    {{ $t('page.login.common.loginOrRegister') }}
  </NButton>
  <template v-else>
    <NDropdown placement="bottom" trigger="click" :options="options" @select="handleDropdown">
      <div>
        <ButtonIcon>
          <SvgIcon icon="ph:user-circle" class="text-icon-large" />
          <span class="text-16px font-medium">{{ authStore.userInfo.userName }}</span>
        </ButtonIcon>
      </div>
    </NDropdown>

    <NModal
      v-model:show="showPwdModal"
      preset="card"
      :title="$t('common.changePassword')"
      class="w-420px"
      :mask-closable="false"
      @after-leave="resetPwdForm"
    >
      <NForm
        ref="formRef"
        :model="pwdModel"
        :rules="pwdRules"
        label-placement="left"
        :label-width="96"
        @keyup.enter="handleChangePassword"
      >
        <NFormItem :label="$t('common.oldPassword')" path="oldPassword">
          <NInput
            v-model:value="pwdModel.oldPassword"
            type="password"
            show-password-on="click"
            :placeholder="$t('common.oldPassword')"
          />
        </NFormItem>
        <NFormItem :label="$t('common.newPassword')" path="newPassword">
          <NInput
            v-model:value="pwdModel.newPassword"
            type="password"
            show-password-on="click"
            :placeholder="$t('common.newPassword')"
          />
        </NFormItem>
        <NFormItem :label="$t('common.confirmNewPassword')" path="confirmPassword">
          <NInput
            v-model:value="pwdModel.confirmPassword"
            type="password"
            show-password-on="click"
            :placeholder="$t('common.confirmNewPassword')"
          />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showPwdModal = false">{{ $t('common.cancel') }}</NButton>
          <NButton type="primary" :loading="submitting" @click="handleChangePassword">
            {{ $t('common.confirm') }}
          </NButton>
        </NSpace>
      </template>
    </NModal>

    <CardRedeemDrawer v-model:visible="redeemVisible" />
  </template>
</template>

<style scoped></style>
