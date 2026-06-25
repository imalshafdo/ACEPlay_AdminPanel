<script setup lang="ts">
import { computed } from 'vue';
import { resourceSections, resourcesBySection } from '~/utils/resources';

const route = useRoute();
const { user, logout, isSuperadmin } = useAuth();

const activeOwnerId = computed(() => {
  if (route.query.ownerId) return route.query.ownerId as string;
  return null;
});

const linkFor = (key: string, singleton?: boolean) => {
  const basePath = singleton ? '/manage/site-settings' : `/manage/${key}`;
  return activeOwnerId.value ? `${basePath}?ownerId=${activeOwnerId.value}` : basePath;
};

const isActive = (key: string, singleton?: boolean) => {
  const path = singleton ? '/manage/site-settings' : `/manage/${key}`;
  return route.path === path || route.path.startsWith(`${path}/`);
};
</script>

<template>
  <div class="layout" :class="{ 'no-sidebar': route.path.startsWith('/preview') || route.path === '/' }">
    <aside class="sidebar" v-if="!route.path.startsWith('/preview') && route.path !== '/'">
      <div class="brand">
        <span class="brand-icon">♤</span>
        <span>ACEPlay Admin</span>
      </div>
      <nav class="nav">
        <NuxtLink to="/" class="nav-link" :class="{ active: route.path === '/' }">
          👁️ Casinos Dashboard
        </NuxtLink>
        <NuxtLink
          v-if="isSuperadmin"
          to="/activity-logs"
          class="nav-link"
          :class="{ active: route.path === '/activity-logs' }"
        >
          Activity Logs
        </NuxtLink>
        <NuxtLink
          v-if="isSuperadmin"
          to="/manage-users"
          class="nav-link"
          :class="{ active: route.path === '/manage-users' }"
        >
          👤 Manage Users
        </NuxtLink>
        <template v-for="section in resourceSections" :key="section">
          <p class="nav-section">{{ section }}</p>
          <NuxtLink
            v-for="r in resourcesBySection(section)"
            :key="r.key"
            :to="linkFor(r.key, r.singleton)"
            class="nav-link"
            :class="{ active: isActive(r.key, r.singleton) }"
          >
            {{ r.label }}
          </NuxtLink>
        </template>
      </nav>
      <div class="sidebar-footer">
        <p v-if="user" class="user">
          {{ user.name }}
          <span v-if="isSuperadmin" class="role-badge">superadmin</span>
        </p>
        <button type="button" class="logout-btn" @click="logout">Sign out</button>
      </div>
    </aside>
    <main class="main">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: var(--sidebar-width);
  background: var(--surface);
  border-right: 1px solid var(--border);
  padding: 1.25rem 0;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0 1.25rem 1.25rem;
  font-weight: 700;
  font-size: 1.05rem;
  border-bottom: 1px solid var(--border);
  margin-bottom: 1rem;
}

.brand-icon {
  font-size: 1.25rem;
}

.nav {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0 0.5rem;
  flex: 1;
  overflow-y: auto;
}

.nav-section {
  margin: 1rem 0.75rem 0.35rem;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted);
}

.nav-link {
  display: block;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  color: var(--muted);
  text-decoration: none;
  font-size: 0.88rem;
  transition: background 0.15s, color 0.15s;
}

.nav-link:hover {
  background: var(--surface-hover);
  color: var(--text);
  text-decoration: none;
}

.nav-link.active {
  background: rgba(59, 130, 246, 0.15);
  color: var(--accent);
}

.nav-link.text-preview {
  color: #cbd5e1;
}

.nav-link.text-preview:hover {
  color: #a78bfa;
}

.nav-link.text-preview.active {
  background: rgba(167, 139, 250, 0.15);
  color: #c084fc;
}

.sidebar-footer {
  padding: 1rem 1.25rem 0;
  border-top: 1px solid var(--border);
  margin-top: 1rem;
}

.user {
  margin: 0 0 0.5rem;
  font-size: 0.85rem;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.role-badge {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  background: rgba(59, 130, 246, 0.2);
  color: var(--accent);
}

.logout-btn {
  width: 100%;
  padding: 0.45rem;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--muted);
  font-size: 0.85rem;
}

.logout-btn:hover {
  background: var(--surface-hover);
  color: var(--text);
}

.main {
  flex: 1;
  padding: 2rem;
  overflow-x: auto;
}

.layout.no-sidebar {
  display: block;
}

.layout.no-sidebar .main {
  padding: 0;
}
</style>
