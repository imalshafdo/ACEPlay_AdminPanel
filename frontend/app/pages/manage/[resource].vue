<script setup lang="ts">
import { getResource } from '~/utils/resources';
import { useAuth } from '~/composables/useAuth';

definePageMeta({
  layout: 'default',
  key: (route) => route.fullPath,
});

const route = useRoute();
const resourceKey = computed(() => route.params.resource as string);
const resource = computed(() => getResource(resourceKey.value));
const { isSuperadmin } = useAuth();

if (!resource.value) {
  throw createError({ statusCode: 404, statusMessage: 'Resource not found' });
}

if (resource.value.singleton) {
  await navigateTo('/manage/site-settings', { replace: true });
}

const listQuery = computed<Record<string, string>>(() => {
  const query: Record<string, string> = {};
  if (resourceKey.value === 'exclusive-banners') query.placement = 'exclusive';
  return query;
});

const dynamicDescription = computed(() => {
  if (resourceKey.value === 'casinos') {
    return isSuperadmin.value ? 'Global Master Network View' : 'Your Assigned Brand';
  }
  return resource.value?.description || '';
});

const api = useAdminApi();
const items = ref<Record<string, unknown>[]>([]);
const loading = ref(true);
const error = ref('');
const modalOpen = ref(false);
const editingId = ref<string | null>(null);
const saving = ref(false);
const form = ref<Record<string, unknown>>({});

const modalTitle = computed(() =>
  editingId.value ? `Edit ${resource.value?.label || ''}` : `New ${resource.value?.label || ''}`
);

const defaultForm = () => {
  const base: Record<string, unknown> = {};
  if (!resource.value) return base;
  for (const f of resource.value.fields) {
    if (f.type === 'boolean') base[f.key] = false;
    else if (f.key === 'status') base[f.key] = 'draft';
    else if (f.key === 'placement' && resourceKey.value === 'exclusive-banners') base[f.key] = 'exclusive';
    else base[f.key] = '';
  }
  return base;
};

const checkAutoEdit = () => {
  const editId = route.query.edit as string;
  if (editId && items.value.length > 0) {
    const item = items.value.find((i) => String(i._id) === editId);
    if (item) {
      openEdit(item);
    }
  }
};

const loadItems = async () => {
  loading.value = true;
  error.value = '';
  try {
    if (!resource.value) return;
    const endpoint = resourceKey.value === 'casinos' ? 'casinos/my-casinos' : resource.value.endpoint;
    const query = { ...listQuery.value };
    if (route.query.ownerId) {
      query.ownerId = route.query.ownerId as string;
      query.allTenants = 'true';
    }
    if (route.query.siteKey) {
      query.siteKey = route.query.siteKey as string;
    }
    const res = await api.list<Record<string, unknown>>(endpoint, query);
    items.value = res.data ?? [];
    checkAutoEdit();
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load data';
    items.value = [];
  } finally {
    loading.value = false;
  }
};

const openCreate = () => {
  editingId.value = null;
  form.value = defaultForm();
  modalOpen.value = true;
};

const openEdit = (item: Record<string, unknown>) => {
  editingId.value = String(item._id);
  form.value = { ...defaultForm(), ...item };
  modalOpen.value = true;
};

const closeModal = () => {
  modalOpen.value = false;
  editingId.value = null;
};

const saveItem = async () => {
  saving.value = true;
  error.value = '';
  try {
    if (!resource.value) return;
    const payload = { ...form.value };
    if (route.query.ownerId) {
      payload.ownerId = route.query.ownerId as string;
    }
    if (route.query.siteKey) {
      payload.siteKey = route.query.siteKey as string;
    }
    delete payload._id;
    delete payload.__v;
    delete payload.createdAt;
    delete payload.updatedAt;

    let savedId = editingId.value;
    const query: Record<string, string> = {};
    if (route.query.ownerId) {
      query.allTenants = 'true';
    }
    if (route.query.siteKey) {
      query.siteKey = route.query.siteKey as string;
    }
    if (editingId.value) {
      await api.update(resource.value.endpoint, editingId.value, payload, query);
    } else {
      const res = await api.create<any>(resource.value.endpoint, payload, query);
      savedId = res.data?._id ? String(res.data._id) : null;
    }
    closeModal();
    if (savedId) {
      let detailsUrl = `/manage/details?resource=${resourceKey.value}&id=${savedId}`;
      if (route.query.ownerId) detailsUrl += `&ownerId=${route.query.ownerId}`;
      if (route.query.siteKey) detailsUrl += `&siteKey=${route.query.siteKey}`;
      await navigateTo(detailsUrl);
    } else {
      await loadItems();
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Save failed';
  } finally {
    saving.value = false;
  }
};

const deleteItem = async (id: string) => {
  if (!confirm('Delete this item?')) return;
  error.value = '';
  try {
    if (!resource.value) return;
    const query: Record<string, string> = {};
    if (route.query.ownerId) {
      query.allTenants = 'true';
    }
    if (route.query.siteKey) {
      query.siteKey = route.query.siteKey as string;
    }
    await api.remove(resource.value.endpoint, id, query);
    await loadItems();
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Delete failed';
  }
};

const cellValue = (item: Record<string, unknown>, key: string) => {
  const v = item[key];
  if (v === null || v === undefined) return '—';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  return String(v);
};

onMounted(loadItems);
watch(resourceKey, loadItems);
</script>

<template>
  <div v-if="resource">
    <header class="page-header">
      <div>
        <NuxtLink :to="route.query.ownerId ? '/preview' : '/'" class="back">
          ← Back to {{ route.query.ownerId ? 'Preview Dashboard' : 'Dashboard' }}
        </NuxtLink>
        <h1>{{ resource.label }}</h1>
        <p v-if="dynamicDescription" class="desc">{{ dynamicDescription }}</p>
      </div>
      <button type="button" class="btn btn-primary" @click="openCreate">
        + Add {{ resource.label }}
      </button>
    </header>

    <p v-if="error" class="error">{{ error }}</p>

    <div v-if="loading" class="loading">Loading…</div>

    <div v-else-if="items.length === 0" class="empty">
      No records yet. Click “Add” to create one.
    </div>

    <div v-else class="table-wrap">
      <table>
        <thead>
          <tr>
            <th v-for="col in resource.listColumns" :key="col.key">{{ col.label }}</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="String(item._id)">
            <td v-for="col in resource.listColumns" :key="col.key">
              {{ cellValue(item, col.key) }}
            </td>
            <td class="actions">
              <button type="button" class="btn-sm" @click="openEdit(item)">Edit</button>
              <button type="button" class="btn-sm btn-danger" @click="deleteItem(String(item._id))">
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ResourceModal
      :open="modalOpen"
      :title="modalTitle"
      :resource="resource"
      :model-value="form"
      :saving="saving"
      @update:model-value="form = $event"
      @close="closeModal"
      @submit="saveItem"
    />
  </div>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.back {
  display: inline-block;
  font-size: 0.85rem;
  color: var(--muted);
  margin-bottom: 0.35rem;
}

.page-header h1 {
  margin: 0;
  font-size: 1.5rem;
}

.desc {
  margin: 0.35rem 0 0;
  color: var(--muted);
  font-size: 0.9rem;
}

.btn {
  padding: 0.55rem 1rem;
  border-radius: 6px;
  border: none;
  font-size: 0.9rem;
  font-weight: 500;
}

.btn-primary {
  background: var(--accent);
  color: white;
}

.btn-primary:hover {
  background: var(--accent-hover);
}

.error {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid var(--danger);
  color: #fca5a5;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.loading,
.empty {
  color: var(--muted);
  padding: 2rem;
  text-align: center;
  background: var(--surface);
  border-radius: 10px;
  border: 1px solid var(--border);
}

.table-wrap {
  overflow-x: auto;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

th,
td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--border);
}

th {
  color: var(--muted);
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

tr:last-child td {
  border-bottom: none;
}

.actions {
  white-space: nowrap;
}

.btn-sm {
  padding: 0.3rem 0.6rem;
  font-size: 0.8rem;
  border-radius: 4px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text);
  margin-right: 0.35rem;
}

.btn-sm:hover {
  background: var(--surface-hover);
}

.btn-danger {
  border-color: rgba(239, 68, 68, 0.4);
  color: #fca5a5;
}

.btn-danger:hover {
  background: rgba(239, 68, 68, 0.15);
}
</style>
