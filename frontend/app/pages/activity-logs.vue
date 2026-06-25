<script setup lang="ts">
import type { AuditLogRow } from '~/components/ActivityLogsTable.vue';

definePageMeta({
  layout: 'default',
  middleware: ['superadmin'],
});

const api = useAdminApi();
const logs = ref<AuditLogRow[]>([]);
const loading = ref(true);
const error = ref('');

const loadLogs = async () => {
  loading.value = true;
  error.value = '';
  try {
    const res = await api.getAuditLogs<AuditLogRow>();
    logs.value = res.data ?? [];
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load activity logs';
    logs.value = [];
  } finally {
    loading.value = false;
  }
};

onMounted(loadLogs);
</script>

<template>
  <div>
    <header class="page-header">
      <div>
        <h1>Activity Logs</h1>
        <p class="subtitle">
          Audit trail of casino modifications. Visible to superadmins only.
        </p>
      </div>
      <button type="button" class="btn-refresh" :disabled="loading" @click="loadLogs">
        Refresh
      </button>
    </header>

    <p v-if="error" class="error">{{ error }}</p>

    <ActivityLogsTable :logs="logs" :loading="loading" />
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

.page-header h1 {
  margin: 0 0 0.35rem;
  font-size: 1.75rem;
}

.subtitle {
  margin: 0;
  color: var(--muted);
  font-size: 0.9rem;
}

.btn-refresh {
  padding: 0.5rem 1rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text);
  font-size: 0.9rem;
}

.btn-refresh:hover:not(:disabled) {
  border-color: var(--accent);
  color: var(--accent);
}

.btn-refresh:disabled {
  opacity: 0.5;
}

.error {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid var(--danger);
  color: #fca5a5;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}
</style>
