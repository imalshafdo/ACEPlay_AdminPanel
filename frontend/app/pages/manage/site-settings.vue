<script setup lang="ts">
import { getResource } from '~/utils/resources';

definePageMeta({ layout: 'default' });

const resource = getResource('site-settings')!;
const api = useAdminApi();
const form = ref<Record<string, unknown>>({});
const loading = ref(true);
const saving = ref(false);
const error = ref('');
const success = ref('');

const linesToArray = (val: unknown): string[] => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') return val.split('\n').map((s) => s.trim()).filter(Boolean);
  return [];
};

const arrayToLines = (val: unknown): string => linesToArray(val).join('\n');

const route = useRoute();
const id = computed(() => route.query.id as string | undefined);
const ownerId = computed(() => route.query.ownerId as string | undefined);

const load = async () => {
  loading.value = true;
  error.value = '';
  try {
    let res;
    if (id.value) {
      res = await api.getOne<Record<string, unknown>>(resource.endpoint, id.value);
    } else if (ownerId.value) {
      const listRes = await api.list<any>('site-settings/all', { ownerId: ownerId.value });
      if (listRes.data && listRes.data.length > 0) {
        const siteKey = route.query.siteKey as string | undefined;
        const matched = siteKey 
          ? listRes.data.find((s: any) => s.siteKey === siteKey)
          : listRes.data[0];
        res = { data: matched || listRes.data[0] };
      } else {
        throw new Error('No site settings found for this owner.');
      }
    } else {
      res = await api.getSingleton<Record<string, unknown>>(resource.endpoint);
    }
    const data = res.data ?? {};
    form.value = {
      ...data,
      features: arrayToLines(data.features),
      endorsementLogos: arrayToLines(data.endorsementLogos),
    };
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load settings';
  } finally {
    loading.value = false;
  }
};

const save = async () => {
  saving.value = true;
  error.value = '';
  success.value = '';
  try {
    const payload: Record<string, any> = {
      ...form.value,
      features: linesToArray(form.value.features),
      endorsementLogos: linesToArray(form.value.endorsementLogos),
    };
    delete payload._id;
    delete payload.__v;
    delete payload.createdAt;
    delete payload.updatedAt;
    delete payload.siteKey;

    const docId = id.value || (form.value._id as string | undefined);

    const res = docId
      ? await api.update<Record<string, unknown>>(resource.endpoint, docId, payload)
      : await api.updateSingleton<Record<string, unknown>>(resource.endpoint, payload);
    const data = res.data ?? {};
    form.value = {
      ...data,
      features: arrayToLines(data.features),
      endorsementLogos: arrayToLines(data.endorsementLogos),
    };
    success.value = 'Site settings saved successfully';
    
    // Redirect to the details preview page after successful save
    const activeId = docId || (data._id as string | undefined);
    const activeOwnerId = ownerId.value || (data.ownerId as string | undefined);
    const activeSiteKey = route.query.siteKey as string | undefined || (data.siteKey as string | undefined);
    if (activeId) {
      let detailsUrl = `/manage/details?resource=site-settings&id=${activeId}`;
      if (activeOwnerId) detailsUrl += `&ownerId=${activeOwnerId}`;
      if (activeSiteKey) detailsUrl += `&siteKey=${activeSiteKey}`;
      await navigateTo(detailsUrl);
    } else {
      let detailsUrl = '/manage/details?resource=site-settings';
      if (activeSiteKey) detailsUrl += `&siteKey=${activeSiteKey}`;
      await navigateTo(detailsUrl);
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Save failed';
  } finally {
    saving.value = false;
  }
};

onMounted(load);
</script>

<template>
  <div>
    <header class="page-header">
      <div>
        <NuxtLink to="/" class="back">← Dashboard</NuxtLink>
        <h1>{{ resource.label }}</h1>
        <p class="desc">{{ resource.description }}</p>
      </div>
    </header>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="success" class="success">{{ success }}</p>

    <div v-if="loading" class="loading">Loading…</div>

    <div v-else class="panel">
      <ResourceForm
        :model-value="form"
        @update:model-value="form = $event"
        :resource="resource"
        @submit="save"
      >
        <div class="actions">
          <button type="submit" class="btn btn-primary" :disabled="saving">
            {{ saving ? 'Saving…' : 'Save site settings' }}
          </button>
        </div>
      </ResourceForm>
    </div>
  </div>
</template>

<style scoped>
.page-header h1 {
  margin: 0.25rem 0;
}

.desc {
  color: var(--muted);
  margin: 0;
  font-size: 0.9rem;
}

.back {
  font-size: 0.85rem;
  color: var(--muted);
}

.panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 1.5rem;
  max-width: 640px;
}

.actions {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
}

.btn-primary {
  padding: 0.6rem 1.25rem;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
}

.error {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid var(--danger);
  color: #fca5a5;
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.success {
  background: rgba(34, 197, 94, 0.15);
  border: 1px solid var(--success);
  color: #86efac;
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.loading {
  color: var(--muted);
  padding: 2rem;
}
</style>
