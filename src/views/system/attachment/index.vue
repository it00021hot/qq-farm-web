<script setup lang="tsx">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { NButton, NPopconfirm, NTag, NUpload } from 'naive-ui';
import type { UploadFileInfo } from 'naive-ui';
import { attachmentStatusRecord } from '@/constants/business';
import {
  fetchAttachmentAccessURL,
  fetchDeleteAttachment,
  fetchGetAttachmentList,
  fetchUpdateAttachmentStatus,
  fetchUploadAttachment
} from '@/service/api';
import { useAppStore } from '@/store/modules/app';
import { useTenantStore } from '@/store/modules/tenant';
import { useAuth } from '@/hooks/business/auth';
import { defaultTransform, useNaivePaginatedTable } from '@/hooks/common/table';
import { formatFileSizeMB } from '@/utils/common';
import { $t } from '@/locales';
import AttachmentSearch from './modules/attachment-search.vue';

defineOptions({
  name: 'SystemAttachment'
});

const appStore = useAppStore();
const tenantStore = useTenantStore();
const { hasAuth } = useAuth();
const uploading = ref(false);
const previewVisible = ref(false);
const previewUrl = ref('');
const previewTitle = ref('');

const searchParams = ref<Api.SystemManage.AttachmentSearchParams>({
  current: 1,
  size: 10,
  keyword: null,
  status: null,
  attachType: null
});

function isImageAttachment(row: Api.SystemManage.Attachment) {
  const mime = (row.attachMimetype || '').toLowerCase();
  if (mime.startsWith('image/')) return true;
  const ext = (row.attachExtension || '').toLowerCase().replace(/^\./, '');
  return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext);
}

const { columns, columnChecks, data, getDataByPage, loading, mobilePagination } = useNaivePaginatedTable({
  api: async () => {
    if (!tenantStore.hasTenantContext) {
      return {
        data: { records: [], current: 1, size: 10, total: 0 },
        error: null,
        response: null
      } as unknown as Awaited<ReturnType<typeof fetchGetAttachmentList>>;
    }
    return fetchGetAttachmentList(searchParams.value);
  },
  transform: response => defaultTransform(response),
  onPaginationParamsChange: params => {
    searchParams.value.current = params.page;
    searchParams.value.size = params.pageSize;
  },
  columns: () => [
    {
      key: 'index',
      title: $t('common.index'),
      align: 'center',
      width: 64,
      render: (_, index) => index + 1
    },
    {
      key: 'attachOriginName',
      title: $t('page.system.attachment.originName'),
      align: 'center',
      ellipsis: { tooltip: true }
    },
    {
      key: 'attachExtension',
      title: $t('page.system.attachment.extension'),
      align: 'center'
    },
    {
      key: 'attachSize',
      title: $t('page.system.attachment.size'),
      align: 'center',
      render: row => formatFileSizeMB(row.attachSize)
    },
    {
      key: 'status',
      title: $t('page.system.attachment.status'),
      align: 'center',
      render: row => {
        const tagMap: Record<1 | 0, NaiveUI.ThemeColor> = {
          1: 'success',
          0: 'error'
        };
        const status = row.status as 1 | 0;

        return <NTag type={tagMap[status] ?? 'default'}>{$t(attachmentStatusRecord[status] ?? 'common.noData')}</NTag>;
      }
    },
    {
      key: 'operate',
      title: $t('common.operate'),
      align: 'center',
      width: 220,
      render: row => (
        <div class="flex-center gap-8px">
          {hasAuth('attachment:access-url') && (
            <NButton type="info" ghost size="small" onClick={() => handlePreview(row)}>
              {$t('page.system.attachment.preview')}
            </NButton>
          )}
          {row.status === 1 && hasAuth('attachment:status') && (
            <NPopconfirm onPositiveClick={() => handleMarkDeleted(row.id)}>
              {{
                default: () => $t('page.system.attachment.markDeletedConfirm'),
                trigger: () => (
                  <NButton type="warning" ghost size="small">
                    {$t('page.system.attachment.markDeleted')}
                  </NButton>
                )
              }}
            </NPopconfirm>
          )}
          {hasAuth('attachment:delete') && (
            <NPopconfirm onPositiveClick={() => handleDelete(row.id)}>
              {{
                default: () => $t('common.confirmDelete'),
                trigger: () => (
                  <NButton type="error" ghost size="small">
                    {$t('common.delete')}
                  </NButton>
                )
              }}
            </NPopconfirm>
          )}
        </div>
      )
    }
  ]
});

async function handlePreview(row: Api.SystemManage.Attachment) {
  const { error, data: access } = await fetchAttachmentAccessURL(row.attachUrl);

  if (error || !access?.signedUrl) {
    return;
  }

  if (isImageAttachment(row)) {
    previewTitle.value = row.attachOriginName || row.attachName || $t('page.system.attachment.preview');
    previewUrl.value = access.signedUrl;
    previewVisible.value = true;
    return;
  }

  window.open(access.signedUrl, '_blank');
}

async function handleMarkDeleted(id: number) {
  const { error } = await fetchUpdateAttachmentStatus(id, 0);

  if (!error) {
    window.$message?.success($t('common.updateSuccess'));
    await getDataByPage();
  }
}

async function handleDelete(id: number) {
  const { error } = await fetchDeleteAttachment(id);

  if (!error) {
    window.$message?.success($t('common.deleteSuccess'));
    await getDataByPage();
  }
}

async function handleUpload(options: { file: UploadFileInfo }) {
  if (!tenantStore.hasTenantContext) {
    window.$message?.warning($t('page.system.tenant.selectRequired'));
    return;
  }

  const rawFile = options.file.file;

  if (!rawFile) return;

  uploading.value = true;
  const { error } = await fetchUploadAttachment(rawFile);
  uploading.value = false;

  if (!error) {
    window.$message?.success($t('page.system.attachment.uploadSuccess'));
    await getDataByPage();
  }
}

function handleTenantChanged() {
  getDataByPage();
}

watch(
  () => tenantStore.currentTenantId,
  () => {
    getDataByPage();
  }
);

onMounted(() => {
  window.addEventListener('tenant-changed', handleTenantChanged);
});

onUnmounted(() => {
  window.removeEventListener('tenant-changed', handleTenantChanged);
});
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <NAlert v-if="!tenantStore.hasTenantContext" type="warning" :bordered="false">
      {{ $t('page.system.tenant.selectRequired') }}
    </NAlert>
    <AttachmentSearch v-model:model="searchParams" @search="getDataByPage" />
    <NCard
      :title="$t('page.system.attachment.title')"
      :bordered="false"
      size="small"
      class="card-wrapper sm:flex-1-hidden"
    >
      <template #header-extra>
        <TableHeaderOperation v-model:columns="columnChecks" :loading="loading" @refresh="getDataByPage">
          <template #default>
            <NUpload v-if="hasAuth('attachment:upload')" :show-file-list="false" :custom-request="handleUpload">
              <NButton size="small" ghost type="primary" :loading="uploading">
                <template #icon>
                  <icon-ic-round-upload class="text-icon" />
                </template>
                {{ $t('page.system.attachment.upload') }}
              </NButton>
            </NUpload>
          </template>
        </TableHeaderOperation>
      </template>
      <NDataTable
        :columns="columns"
        :data="data"
        size="small"
        :flex-height="!appStore.isMobile"
        :scroll-x="appStore.isMobile ? 960 : undefined"
        :loading="loading"
        remote
        :row-key="row => row.id"
        :pagination="mobilePagination"
        class="sm:h-full"
      />
    </NCard>

    <NModal
      v-model:show="previewVisible"
      preset="card"
      :title="previewTitle"
      class="w-90vw max-w-900px"
      :bordered="false"
      display-directive="show"
    >
      <div class="flex-center min-h-200px">
        <NImage v-if="previewUrl" :src="previewUrl" object-fit="contain" class="max-h-70vh" />
      </div>
    </NModal>
  </div>
</template>

<style scoped></style>
