<script setup lang="ts">
import { ref, watch } from 'vue';
import { fetchGetMenuTree, fetchGetRoleAuth, fetchSetRoleAuth } from '@/service/api';
import { $t } from '@/locales';

defineOptions({
  name: 'RoleAuthModal'
});

interface Props {
  roleId: number;
  roleName?: string;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const visible = defineModel<boolean>('visible', { default: false });

const loading = ref(false);
const submitting = ref(false);
const treeData = ref<Api.SystemManage.Menu[]>([]);
const checkedKeys = ref<Array<string | number>>([]);
const expandedKeys = ref<Array<string | number>>([]);

type MenuTreeNode = Api.SystemManage.Menu & { children?: MenuTreeNode[] };

function buildMenuTree(items: Api.SystemManage.Menu[]): MenuTreeNode[] {
  const map = new Map<number, MenuTreeNode>();
  const roots: MenuTreeNode[] = [];

  items.forEach(item => {
    map.set(item.id, { ...item, children: [] });
  });

  items.forEach(item => {
    const node = map.get(item.id)!;
    if (item.parentId && map.has(item.parentId)) {
      map.get(item.parentId)!.children!.push(node);
    } else {
      roots.push(node);
    }
  });

  function prune(nodes: MenuTreeNode[]) {
    nodes.forEach(node => {
      if (node.children?.length === 0) {
        delete node.children;
      } else if (node.children) {
        prune(node.children);
      }
    });
  }

  prune(roots);
  return roots;
}

function parseResourceIds(resourceIds: string | number[]): number[] {
  if (Array.isArray(resourceIds)) {
    return resourceIds.map(Number).filter(id => !Number.isNaN(id));
  }

  if (!resourceIds) return [];

  return resourceIds
    .split(',')
    .map(id => Number(id.trim()))
    .filter(id => !Number.isNaN(id));
}

async function loadData() {
  loading.value = true;

  const [menuRes, authRes] = await Promise.all([fetchGetMenuTree(), fetchGetRoleAuth(props.roleId)]);

  if (!menuRes.error) {
    treeData.value = buildMenuTree(menuRes.data);
    expandedKeys.value = menuRes.data.map(item => item.id);
  }

  if (!authRes.error) {
    checkedKeys.value = parseResourceIds(authRes.data.resourceIds);
  }

  loading.value = false;
}

function closeModal() {
  visible.value = false;
}

async function handleSubmit() {
  submitting.value = true;

  const { error } = await fetchSetRoleAuth({
    roleId: props.roleId,
    resourceIds: checkedKeys.value.join(',')
  });

  submitting.value = false;

  if (!error) {
    window.$message?.success($t('common.updateSuccess'));
    closeModal();
    emit('submitted');
  }
}

watch(visible, () => {
  if (visible.value && props.roleId > 0) {
    checkedKeys.value = [];
    loadData();
  }
});
</script>

<template>
  <NModal
    v-model:show="visible"
    preset="card"
    :title="`${$t('page.system.role.auth')} - ${roleName || roleId}`"
    class="w-700px"
  >
    <NSpin :show="loading">
      <NScrollbar style="max-height: 60vh">
        <NTree
          v-model:checked-keys="checkedKeys"
          v-model:expanded-keys="expandedKeys"
          block-line
          checkable
          cascade
          key-field="id"
          label-field="name"
          children-field="children"
          :data="treeData"
        />
      </NScrollbar>
    </NSpin>
    <template #footer>
      <NSpace justify="end">
        <NButton @click="closeModal">{{ $t('common.cancel') }}</NButton>
        <NButton type="primary" :loading="submitting" @click="handleSubmit">{{ $t('common.confirm') }}</NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<style scoped></style>
