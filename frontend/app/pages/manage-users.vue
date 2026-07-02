<script setup lang="ts">
import { ref, onMounted } from 'vue';

definePageMeta({
  layout: 'default',
  middleware: ['superadmin'],
});

const config = useRuntimeConfig();
const token = useCookie<string | null>('admin_token');
const apiRoot = (config.public.apiUrl as string || 'http://localhost:5000').replace(/\/$/, '');

interface UserRow {
  _id: string;
  name: string;
  email: string;
  role: string;
  isTwoFactorEnabled: boolean;
}

const users = ref<UserRow[]>([]);
const loading = ref(true);
const error = ref('');
const resettingId = ref<string | null>(null);

const loadUsers = async () => {
  loading.value = true;
  error.value = '';
  try {
    const res = await $fetch<{ success: boolean; data: UserRow[] }>(`${apiRoot}/api/admin/users`, {
      headers: { Authorization: `Bearer ${token.value}` },
    });
    users.value = res.data ?? [];
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load user accounts';
    users.value = [];
  } finally {
    loading.value = false;
  }
};

const handleReset2FA = async (userId: string, email: string) => {
  if (!confirm(`Are you sure you want to reset the 2FA secret for ${email}? This will log them out and force them to re-register their device next time they sign in.`)) {
    return;
  }

  resettingId.value = userId;
  try {
    const res = await $fetch<{ success: boolean; message: string }>(`${apiRoot}/api/admin/reset-2fa/${userId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token.value}` },
    });
    if (res.success) {
      alert(res.message || '2FA reset successfully');
      await loadUsers();
    } else {
      throw new Error('Reset failed');
    }
  } catch (e) {
    alert(e instanceof Error ? e.message : 'Failed to reset 2FA');
  } finally {
    resettingId.value = null;
  }
};

onMounted(loadUsers);
</script>

<template>
  <div class="user-management-page">
    <header class="page-header">
      <div>
        <h1>User Account Management</h1>
        <p class="subtitle">
          Manage client administrative accounts and reset 2FA devices if clients get locked out.
        </p>
      </div>
      <button type="button" class="btn-refresh" :disabled="loading" @click="loadUsers">
        {{ loading ? 'Loading...' : 'Refresh' }}
      </button>
    </header>

    <div v-if="error" class="error-panel">
      <span class="panel-icon">⚠️</span>
      <h2>Failed to Load Users</h2>
      <p>{{ error }}</p>
      <button type="button" class="btn-retry" @click="loadUsers">Try Again</button>
    </div>

    <div v-else class="table-container">
      <div v-if="loading && users.length === 0" class="table-loading">
        <div class="spinner"></div>
        <p>Loading user list...</p>
      </div>

      <table v-else class="users-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>2FA Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u._id">
            <td class="user-name">
              <span class="user-avatar">{{ u.name.substring(0, 1).toUpperCase() }}</span>
              {{ u.name }}
            </td>
            <td class="user-email">{{ u.email }}</td>
            <td>
              <span class="role-badge" :class="u.role">{{ u.role }}</span>
            </td>
            <td>
              <span class="tfa-badge" :class="{ enabled: u.isTwoFactorEnabled }">
                {{ u.isTwoFactorEnabled ? '🛡️ Enabled' : '⚠️ Disabled' }}
              </span>
            </td>
            <td>
              <button
                v-if="u.isTwoFactorEnabled"
                type="button"
                class="btn-reset-2fa"
                :disabled="resettingId === u._id"
                @click="handleReset2FA(u._id, u.email)"
              >
                {{ resettingId === u._id ? 'Resetting...' : 'Reset 2FA' }}
              </button>
              <span v-else class="text-disabled">No action required</span>
            </td>
          </tr>
          <tr v-if="users.length === 0">
            <td colspan="5" class="empty-row">No administrative accounts found.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.user-management-page {
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  color: #f1f5f9;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 2rem;
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
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-refresh:hover:not(:disabled) {
  border-color: var(--accent);
  color: var(--accent);
}

.btn-refresh:disabled {
  opacity: 0.5;
}

.error-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
}

.panel-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.error-panel h2 {
  color: var(--danger);
  margin-bottom: 0.5rem;
  font-size: 1.25rem;
}

.error-panel p {
  color: var(--muted);
  margin-bottom: 1.5rem;
}

.btn-retry {
  padding: 0.5rem 1.25rem;
  border-radius: 6px;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  background: var(--bg);
  color: var(--text);
  border: 1px solid var(--border);
  transition: all 0.2s;
}

.btn-retry:hover {
  border-color: var(--accent);
}

.table-container {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.table-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: var(--muted);
}

.spinner {
  width: 30px;
  height: 30px;
  border: 3px solid rgba(59, 130, 246, 0.1);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.users-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.9rem;
}

.users-table th {
  background: rgba(255, 255, 255, 0.02);
  padding: 1rem 1.25rem;
  font-weight: 600;
  color: var(--muted);
  border-bottom: 1px solid var(--border);
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.05rem;
}

.users-table td {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border);
  color: var(--text);
}

.users-table tr:last-child td {
  border-bottom: none;
}

.user-name {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 600;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--accent);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  font-weight: 700;
  box-shadow: 0 2px 5px rgba(59, 130, 246, 0.3);
}

.user-email {
  color: var(--muted);
}

.role-badge {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.role-badge.superadmin {
  background: rgba(59, 130, 246, 0.15);
  color: var(--accent);
  border: 1px solid rgba(59, 130, 246, 0.25);
}

.role-badge.client {
  background: rgba(167, 139, 250, 0.15);
  color: #a78bfa;
  border: 1px solid rgba(167, 139, 250, 0.25);
}

.tfa-badge {
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}

.tfa-badge.enabled {
  background: rgba(34, 197, 94, 0.1);
  color: var(--success);
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.tfa-badge:not(.enabled) {
  background: rgba(100, 116, 139, 0.1);
  color: #94a3b8;
  border: 1px solid rgba(100, 116, 139, 0.2);
}

.btn-reset-2fa {
  background: rgba(239, 68, 68, 0.12);
  color: var(--danger);
  border: 1px solid rgba(239, 68, 68, 0.25);
  padding: 0.4rem 0.85rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-reset-2fa:hover:not(:disabled) {
  background: var(--danger);
  color: white;
  border-color: var(--danger);
  box-shadow: 0 4px 10px rgba(239, 68, 68, 0.3);
}

.btn-reset-2fa:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.text-disabled {
  color: var(--muted);
  font-size: 0.8rem;
  font-style: italic;
}

.empty-row {
  text-align: center;
  color: var(--muted);
  padding: 2.5rem !important;
}
</style>
