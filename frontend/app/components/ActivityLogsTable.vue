<script setup lang="ts">
export interface AuditLogRow {
  _id: string;
  adminEmail: string;
  action: 'UPDATE_REQUEST' | 'APPROVED' | 'REJECTED';
  brandName: string;
  fieldChanged: string;
  oldValue: unknown;
  newValue: unknown;
  createdAt: string;
}

defineProps<{
  logs: AuditLogRow[];
  loading?: boolean;
}>();

const formatValue = (value: unknown) => {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const actionClass = (action: string) => {
  if (action === 'APPROVED') return 'badge-approved';
  if (action === 'REJECTED') return 'badge-rejected';
  return 'badge-update';
};
</script>

<template>
  <div class="table-wrap">
    <div v-if="loading" class="state">Loading activity logs…</div>
    <div v-else-if="!logs.length" class="state">No activity recorded yet.</div>
    <table v-else>
      <thead>
        <tr>
          <th>Timestamp</th>
          <th>Administrator</th>
          <th>Casino</th>
          <th>Action</th>
          <th>Field</th>
          <th>Previous value</th>
          <th>New value</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="log in logs" :key="log._id">
          <td class="timestamp">{{ formatDate(log.createdAt) }}</td>
          <td class="email">{{ log.adminEmail }}</td>
          <td class="brand">{{ log.brandName }}</td>
          <td>
            <span class="badge" :class="actionClass(log.action)">{{ log.action }}</span>
          </td>
          <td class="field"><code>{{ log.fieldChanged }}</code></td>
          <td class="value-cell">
            <pre>{{ formatValue(log.oldValue) }}</pre>
          </td>
          <td class="value-cell">
            <pre class="new">{{ formatValue(log.newValue) }}</pre>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.table-wrap {
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
  overflow: hidden;
}

.state {
  padding: 3rem;
  text-align: center;
  color: var(--muted);
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
}

th {
  text-align: left;
  padding: 0.85rem 1rem;
  background: rgba(0, 0, 0, 0.2);
  color: var(--muted);
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}

td {
  padding: 0.85rem 1rem;
  border-bottom: 1px solid var(--border);
  vertical-align: top;
}

tr:last-child td {
  border-bottom: none;
}

tr:hover td {
  background: rgba(59, 130, 246, 0.04);
}

.timestamp {
  white-space: nowrap;
  color: var(--muted);
  font-size: 0.82rem;
}

.email {
  font-weight: 500;
}

.brand {
  font-weight: 600;
  color: var(--accent);
}

.field code {
  font-size: 0.8rem;
  background: var(--bg);
  padding: 0.2rem 0.45rem;
  border-radius: 4px;
  color: #a5b4fc;
}

.value-cell {
  max-width: 220px;
}

.value-cell pre {
  margin: 0;
  font-size: 0.78rem;
  white-space: pre-wrap;
  word-break: break-word;
  color: #fca5a5;
  background: rgba(239, 68, 68, 0.08);
  padding: 0.45rem 0.55rem;
  border-radius: 6px;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.value-cell pre.new {
  color: #86efac;
  background: rgba(34, 197, 94, 0.08);
  border-color: rgba(34, 197, 94, 0.2);
}

.badge {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.03em;
}

.badge-update {
  background: rgba(59, 130, 246, 0.15);
  color: #93c5fd;
}

.badge-approved {
  background: rgba(34, 197, 94, 0.15);
  color: #86efac;
}

.badge-rejected {
  background: rgba(239, 68, 68, 0.15);
  color: #fca5a5;
}
</style>
