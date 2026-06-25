<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';

definePageMeta({
  layout: 'default',
});

const { user, logout, isSuperadmin } = useAuth();
const api = useAdminApi();
const loading = ref(true);
const error = ref('');
const siteSettingsList = ref<any[]>([]);
const selectedCasino = ref<any | null>(null);

const config = useRuntimeConfig();
const token = useCookie<string | null>('admin_token');
const authBase = computed(() => {
  const admin = config.public.apiBase as string;
  return admin.replace(/\/api\/admin\/?$/, '/api/auth');
});

const qrCodeUrl = ref('');
const manualSecret = ref('');
const twoFactorSetupCode = ref('');
const setupError = ref('');
const setupLoading = ref(false);

const load2FASetup = async () => {
  setupError.value = '';
  try {
    const res = await $fetch<any>(`${authBase.value}/2fa/setup`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token.value}` }
    });
    if (res.success) {
      qrCodeUrl.value = res.data.qrCode;
      manualSecret.value = res.data.secret;
    } else {
      throw new Error(res.message || 'Failed to load QR code');
    }
  } catch (e) {
    setupError.value = e instanceof Error ? e.message : 'Failed to load 2FA setup QR Code';
  }
};

const handleVerifySetup = async () => {
  if (!twoFactorSetupCode.value) return;
  setupLoading.value = true;
  setupError.value = '';
  try {
    const res = await $fetch<any>(`${authBase.value}/2fa/verify`, {
      method: 'POST',
      body: { token: twoFactorSetupCode.value },
      headers: { Authorization: `Bearer ${token.value}` }
    });
    if (res.success) {
      if (user.value) {
        user.value.isTwoFactorEnabled = true;
      }
      alert('2FA enabled successfully!');
    } else {
      throw new Error(res.message || 'Verification failed');
    }
  } catch (e) {
    setupError.value = e instanceof Error ? e.message : 'Verification failed';
  } finally {
    setupLoading.value = false;
  }
};

const isCreating = ref(false);
const handleAddNewCasino = async () => {
  if (isCreating.value) return;
  isCreating.value = true;
  try {
    const res = await api.create<any>('site-settings', {
      siteName: 'New Casino Brand',
      launchYear: '2026',
      depositMin: '100 THB',
      depositMax: '100,000 THB',
      tagline: 'Best Online Casino Experience',
      features: [
        'Direct automatic deposit-withdrawal system',
        'Supports all platforms, play anytime, anywhere',
        '24-hour customer care support'
      ]
    });
    if (res.data && res.data._id) {
      await navigateTo(`/manage/site-settings?id=${res.data._id}&ownerId=${res.data.ownerId}&siteKey=${res.data.siteKey}`);
    } else {
      throw new Error('Failed to retrieve new casino ID');
    }
  } catch (e) {
    alert(e instanceof Error ? e.message : 'Failed to create new casino');
  } finally {
    isCreating.value = false;
  }
};

const loadSiteSettings = async () => {
  loading.value = true;
  error.value = '';
  try {
    const res = await api.list<any>('site-settings/all');
    siteSettingsList.value = res.data ?? [];
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load Site & Header list';
  } finally {
    loading.value = false;
  }
};

const confirmDelete = async (id: string, siteName: string) => {
  if (confirm(`Confirm to delete ${siteName || 'this site'}?`)) {
    try {
      await api.remove('site-settings', id);
      await loadSiteSettings();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Delete failed');
    }
  }
};

const filteredSettings = computed(() => {
  return siteSettingsList.value;
});

onMounted(() => {
  loadSiteSettings();
  if (user.value && user.value.role === 'client' && !user.value.isTwoFactorEnabled) {
    load2FASetup();
  }
});
</script>

<template>
  <div class="preview-dashboard-layout">
    <!-- Header control bar -->
    <div class="admin-control-bar">
      <div class="control-left">
        <span class="pulse-dot"></span>
        <span class="preview-tag">Casinos Preview Dashboard</span>
      </div>
      <div class="control-right">
        <button 
          type="button" 
          class="btn-add-casino" 
          @click="handleAddNewCasino" 
          :disabled="isCreating"
        >
          {{ isCreating ? 'Creating...' : '+ Add a New Casino' }}
        </button>
        <div class="logout-wrapper">
          <button 
            type="button" 
            class="btn-logout" 
            @click="logout"
          >
            Sign out
          </button>
          <span v-if="user" class="welcome-text">Welcome {{ user.name }}</span>
        </div>
      </div>
    </div>

    <div class="dashboard-container">
      <div class="dashboard-header">
        <h1>Welcome to ACEPlay Admin Panel</h1>
        <p>Preview any of the casinos configured in your Site & Header settings.</p>
      </div>

      <!-- 2FA Setup Form Enforced for Clients -->
      <div v-if="user && user.role === 'client' && !user.isTwoFactorEnabled" class="two-factor-setup-panel animate-slide-up">
        <div class="tfa-setup-card">
          <div class="tfa-setup-header">
            <span class="lock-icon">🔒</span>
            <h2>Enable Two-Factor Authentication</h2>
            <p>To secure client logins and ensure compliance with our security policy, two-factor authentication (2FA) is mandatory. Please scan the QR code using Google Authenticator or another TOTP app to activate 2FA.</p>
          </div>

          <div v-if="setupError" class="error-box">
            {{ setupError }}
            <button type="button" class="btn-retry-tfa" @click="load2FASetup">Retry Setup</button>
          </div>

          <div v-else class="tfa-setup-body">
            <div class="qr-code-wrapper">
              <div v-if="!qrCodeUrl" class="qr-placeholder">
                <div class="spinner-small"></div>
                <span>Generating QR Code...</span>
              </div>
              <img v-else :src="qrCodeUrl" alt="2FA QR Code" class="qr-image" />
            </div>

            <div class="tfa-setup-instructions">
              <ol>
                <li>Scan the QR code above with Google Authenticator or your preferred TOTP app.</li>
                <li>If you cannot scan, manually enter the setup key:
                  <code class="secret-key" title="Click to copy" @click="navigator.clipboard.writeText(manualSecret); alert('Copied secret key to clipboard!')">{{ manualSecret || 'Loading...' }}</code>
                </li>
                <li>Enter the 6-digit code displayed in your app below to complete the setup.</li>
              </ol>
            </div>

            <form class="tfa-verify-form" @submit.prevent="handleVerifySetup">
              <input
                v-model="twoFactorSetupCode"
                type="text"
                placeholder="000000"
                required
                pattern="[0-9]{6}"
                inputmode="numeric"
                maxlength="6"
                class="tfa-input-box"
              />
              <button type="submit" class="btn-verify-tfa" :disabled="setupLoading || !twoFactorSetupCode">
                {{ setupLoading ? 'Verifying...' : 'Verify & Enable 2FA' }}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div v-else>
        <!-- Loading State -->
        <div v-if="loading" class="loading-panel">
          <div class="spinner"></div>
          <p>Loading Site & Header list...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="error-panel">
          <span class="panel-icon">⚠️</span>
          <h2>Failed to Load</h2>
          <p>{{ error }}</p>
          <button type="button" class="btn-retry" @click="loadSiteSettings">Try Again</button>
        </div>

        <!-- Empty State -->
        <div v-else-if="filteredSettings.length === 0" class="empty-panel">
          <span class="panel-icon">🏜️</span>
          <h2>No Site Configurations Found</h2>
          <p>Create a Site & Header configuration to get started.</p>
          <button 
            type="button" 
            class="btn-add-casino" 
            @click="handleAddNewCasino" 
            :disabled="isCreating"
            style="padding: 0.6rem 1.25rem; font-size: 0.9rem;"
          >
            {{ isCreating ? 'Creating...' : '+ Add a New Casino' }}
          </button>
        </div>

        <!-- Site Settings Grid -->
        <div v-else class="casinos-grid">
          <div v-for="s in filteredSettings" :key="s._id" class="casino-preview-card">
            <div class="card-header">
              <div class="logo-box-small">
                <img v-if="s.logoUrl" :src="s.logoUrl" :alt="s.siteName || 'Casino Logo'" class="casino-logo" />
                <div v-else class="fallback-logo-small">
                  {{ (s.siteName || 'CAS').substring(0, 3).toUpperCase() }}
                </div>
              </div>
              <div class="title-wrap">
                <h3>{{ s.siteName || 'Unnamed Casino' }}</h3>
                <span class="badge-status" :class="s.status">{{ s.status }}</span>
              </div>
            </div>

            <div class="card-body">
              <div class="meta-item tagline-item">
                <span class="value tagline-text">{{ s.tagline || 'No tagline configured' }}</span>
              </div>
              <div class="meta-item">
                <span class="label">Launch Year:</span>
                <span class="value">{{ s.launchYear || '—' }}</span>
              </div>
              <div class="meta-item">
                <span class="label">Deposit Range:</span>
                <span class="value">{{ s.depositMin || '—' }} - {{ s.depositMax || '—' }}</span>
              </div>
              <div class="features-preview" v-if="s.features && s.features.length > 0">
                <span class="features-label">Key Features:</span>
                <ul class="features-list">
                  <li v-for="(feat, idx) in s.features.slice(0, 2)" :key="idx" class="feature-item">
                    ✓ {{ feat }}
                  </li>
                </ul>
              </div>
            </div>

            <div class="card-footer">
              <NuxtLink 
                v-if="s.siteName"
                :to="`/preview/${s.siteName.toLowerCase().replace(/\s+/g, '-')}`" 
                class="btn-preview-link"
              >
                Preview Page ↗
              </NuxtLink>
              <div v-else class="btn-preview-link disabled" style="opacity: 0.5; cursor: not-allowed;">
                Preview Unavailable
              </div>
              <div class="card-actions-row">
                <button type="button" @click="selectedCasino = s" class="btn-action-edit">
                  ✏️ Edit
                </button>
                <button type="button" @click="confirmDelete(s._id, s.siteName)" class="btn-action-delete">
                  🗑️ Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Options Modal -->
    <div v-if="selectedCasino" class="modal-overlay" @click.self="selectedCasino = null">
      <div class="modal-content animate-slide-up">
        <div class="modal-header">
          <h2>Manage settings for {{ selectedCasino.siteName || 'Unnamed Casino' }}</h2>
          <button type="button" @click="selectedCasino = null" class="btn-close-modal">×</button>
        </div>
        <div class="modal-body">
          <p class="modal-hint">Select a section below to configure settings specifically for this casino.</p>
          <div class="options-list">
            <NuxtLink :to="`/manage/site-settings?id=${selectedCasino._id}&ownerId=${selectedCasino.ownerId}&siteKey=${selectedCasino.siteKey}`" class="option-btn">
              <span class="option-icon">⚙️</span>
              <div class="option-info">
                <h3>Site & Header</h3>
                <p>Manage casino name, tagline, launch year, logos, and features</p>
              </div>
              <span class="option-arrow">→</span>
            </NuxtLink>

            <NuxtLink :to="`/manage/navigation?ownerId=${selectedCasino.ownerId}&siteKey=${selectedCasino.siteKey}`" class="option-btn">
              <span class="option-icon">🧭</span>
              <div class="option-info">
                <h3>Navigation Menu</h3>
                <p>Manage category links like Slots, Live Casino, Sports</p>
              </div>
              <span class="option-arrow">→</span>
            </NuxtLink>

            <NuxtLink :to="`/manage/exclusive-banners?ownerId=${selectedCasino.ownerId}&siteKey=${selectedCasino.siteKey}`" class="option-btn">
              <span class="option-icon">🖼️</span>
              <div class="option-info">
                <h3>Promotion Banners</h3>
                <p>Manage interactive main promotional banners</p>
              </div>
              <span class="option-arrow">→</span>
            </NuxtLink>

            <NuxtLink :to="`/manage/big-wins?ownerId=${selectedCasino.ownerId}&siteKey=${selectedCasino.siteKey}`" class="option-btn">
              <span class="option-icon">🏆</span>
              <div class="option-info">
                <h3>Big Wins</h3>
                <p>Celebrate player wins, multipliers, and payouts</p>
              </div>
              <span class="option-arrow">→</span>
            </NuxtLink>

            <NuxtLink :to="`/manage/popular-games?ownerId=${selectedCasino.ownerId}&siteKey=${selectedCasino.siteKey}`" class="option-btn">
              <span class="option-icon">🎮</span>
              <div class="option-info">
                <h3>Popular Games</h3>
                <p>Manage highest rated games and win rates</p>
              </div>
              <span class="option-arrow">→</span>
            </NuxtLink>

            <NuxtLink :to="`/manage/exclusive-promotions?ownerId=${selectedCasino.ownerId}&siteKey=${selectedCasino.siteKey}`" class="option-btn">
              <span class="option-icon">🎁</span>
              <div class="option-info">
                <h3>Exclusive Promotions</h3>
                <p>Manage welcome bonus package and rollover settings</p>
              </div>
              <span class="option-arrow">→</span>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.preview-dashboard-layout {
  min-height: 100vh;
  background: #0b0f19;
  color: #f1f5f9;
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  position: relative;
  padding-top: 70px;
}

/* Control Bar Styles */
.admin-control-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 70px;
  background: #111827;
  border-bottom: 2px solid #3b82f6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  z-index: 1000;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
}

.logout-wrapper {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.welcome-text {
  font-size: 0.75rem;
  color: #9ca3af;
  font-weight: 600;
}

.control-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  background-color: #3b82f6;
  border-radius: 50%;
  box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
  animation: pulse 1.6s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
  }
  70% {
    transform: scale(1);
    box-shadow: 0 0 0 6px rgba(59, 130, 246, 0);
  }
  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
  }
}

.preview-tag {
  font-weight: 700;
  font-size: 0.85rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #3b82f6;
}

.control-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.btn-add-casino {
  background: #10b981;
  color: white;
  padding: 0.55rem 1.25rem;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
}

.btn-add-casino:hover:not(:disabled) {
  background: #059669;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
}

.btn-add-casino:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-logout {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
  padding: 0.55rem 1.25rem;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-logout:hover {
  background: #ef4444;
  color: white;
  border-color: #ef4444;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.35);
  transform: translateY(-1px);
}

/* Dashboard Container */
.dashboard-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 3rem 1.5rem;
}

.dashboard-header {
  text-align: center;
  margin-bottom: 3rem;
}

.dashboard-header h1 {
  font-size: 2.2rem;
  font-weight: 800;
  color: white;
  margin-bottom: 0.5rem;
}

.dashboard-header p {
  color: #9ca3af;
  font-size: 1rem;
}

/* Loading & Error States */
.loading-panel,
.error-panel,
.empty-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6rem 2rem;
  text-align: center;
  background: #111827;
  border: 1px solid #1e293b;
  border-radius: 16px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(59, 130, 246, 0.1);
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1.5rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.panel-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error-panel h2 {
  color: #ef4444;
  margin-bottom: 0.5rem;
}

.error-panel p,
.empty-panel p {
  color: #9ca3af;
  margin-bottom: 1.5rem;
}

.btn-retry {
  padding: 0.55rem 1.25rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 700;
  border: none;
  cursor: pointer;
  background: #1f2937;
  color: #e5e7eb;
  border: 1px solid #374151;
}

.btn-retry:hover {
  background: #374151;
}

/* Grid Layout */
.casinos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 2rem;
}

.casino-preview-card {
  background: #111827;
  border: 1px solid #1e293b;
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s, border-color 0.2s;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
}

.casino-preview-card:hover {
  transform: translateY(-4px);
  border-color: #3b82f6;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.logo-box-small {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  background: #1f2937;
  border: 1px solid #374151;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.casino-logo {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.fallback-logo-small {
  font-size: 1.1rem;
  font-weight: 800;
  color: #3b82f6;
}

.title-wrap h3 {
  font-size: 1.15rem;
  font-weight: 700;
  color: white;
  margin: 0 0 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.badge-status {
  font-size: 0.65rem;
  font-weight: 800;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: inline-block;
}

.badge-status.published {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.badge-status.draft {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.01);
  border: 1px solid rgba(255, 255, 255, 0.03);
  padding: 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  margin-bottom: 1.5rem;
}

.tagline-item {
  margin-bottom: 0.5rem;
}

.tagline-text {
  font-style: italic;
  color: #a78bfa;
}

.meta-item {
  display: flex;
  justify-content: space-between;
}

.meta-item .label {
  color: #9ca3af;
}

.meta-item .value {
  color: white;
  font-weight: 600;
}

.features-preview {
  margin-top: 0.5rem;
  border-top: 1px solid rgba(255,255,255,0.05);
  padding-top: 0.5rem;
}

.features-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  color: #64748b;
  display: block;
  margin-bottom: 0.25rem;
}

.features-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.feature-item {
  font-size: 0.75rem;
  color: #cbd5e1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-footer {
  margin-top: auto;
}

.btn-preview-link {
  display: block;
  text-align: center;
  background: #1f2937;
  color: white;
  padding: 0.6rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 700;
  text-decoration: none;
  border: 1px solid #374151;
  transition: all 0.2s;
}

.btn-preview-link:hover {
  background: #3b82f6;
  border-color: #3b82f6;
  box-shadow: 0 4px 10px rgba(59, 130, 246, 0.25);
}

.card-actions-row {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.75rem;
}

.btn-action-edit {
  flex: 1;
  text-align: center;
  text-decoration: none;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 0.5rem;
  border-radius: 6px;
  color: #3b82f6;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  transition: all 0.2s;
}

.btn-action-edit:hover {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
  box-shadow: 0 4px 10px rgba(59, 130, 246, 0.2);
}

.btn-action-delete {
  flex: 1;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 0.5rem;
  border-radius: 6px;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  cursor: pointer;
  transition: all 0.2s;
}

.btn-action-delete:hover {
  background: #ef4444;
  color: white;
  border-color: #ef4444;
  box-shadow: 0 4px 10px rgba(239, 68, 68, 0.2);
}

/* Modal overlay and content */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-content {
  background: #111827;
  border: 1px solid #1e293b;
  border-radius: 16px;
  width: 100%;
  max-width: 580px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}

.modal-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #1e293b;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header h2 {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
  color: white;
}

.btn-close-modal {
  background: transparent;
  border: none;
  font-size: 1.75rem;
  color: #9ca3af;
  cursor: pointer;
  line-height: 1;
}

.btn-close-modal:hover {
  color: white;
}

.modal-body {
  padding: 1.5rem;
}

.modal-hint {
  color: #9ca3af;
  font-size: 0.85rem;
  margin-bottom: 1.25rem;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 380px;
  overflow-y: auto;
  padding-right: 0.25rem;
}

.options-list::-webkit-scrollbar {
  width: 6px;
}

.options-list::-webkit-scrollbar-thumb {
  background: #374151;
  border-radius: 3px;
}

.option-btn {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: #1f2937;
  border: 1px solid #374151;
  border-radius: 10px;
  padding: 0.85rem 1.1rem;
  text-decoration: none;
  color: white;
  transition: all 0.2s;
}

.option-btn:hover {
  background: #3b82f6;
  border-color: #3b82f6;
  transform: translateX(4px);
}

.option-btn:hover .option-arrow {
  color: white;
}

.option-btn:hover p {
  color: rgba(255, 255, 255, 0.8);
}

.option-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.option-info {
  flex: 1;
}

.option-info h3 {
  font-size: 0.95rem;
  font-weight: 700;
  margin: 0 0 0.15rem;
}

.option-info p {
  font-size: 0.78rem;
  color: #9ca3af;
  margin: 0;
  line-height: 1.3;
}

.option-arrow {
  font-size: 1.25rem;
  color: #6b7280;
  transition: color 0.2s;
}

.animate-slide-up {
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 2FA Setup Panel Styles */
.two-factor-setup-panel {
  max-width: 600px;
  margin: 0 auto 3rem;
  background: #111827;
  border: 1px solid #1e293b;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
  overflow: hidden;
}

.tfa-setup-card {
  padding: 2.5rem;
}

.tfa-setup-header {
  text-align: center;
  margin-bottom: 2rem;
}

.tfa-setup-header .lock-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 0.75rem;
}

.tfa-setup-header h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  margin: 0 0 0.5rem;
}

.tfa-setup-header p {
  color: #9ca3af;
  font-size: 0.88rem;
  line-height: 1.5;
  margin: 0;
}

.tfa-setup-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.qr-code-wrapper {
  width: 180px;
  height: 180px;
  background: white;
  padding: 10px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.qr-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.qr-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: #9ca3af;
  font-size: 0.8rem;
}

.spinner-small {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(59, 130, 246, 0.1);
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.tfa-setup-instructions {
  width: 100%;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  padding: 1.25rem;
  border-radius: 10px;
}

.tfa-setup-instructions ol {
  margin: 0;
  padding-left: 1.25rem;
  color: #cbd5e1;
  font-size: 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.secret-key {
  display: inline-block;
  background: #1f2937;
  color: #3b82f6;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  font-weight: 700;
  font-family: monospace;
  cursor: pointer;
  margin-top: 0.25rem;
  border: 1px dashed rgba(59, 130, 246, 0.3);
}

.secret-key:hover {
  background: rgba(59, 130, 246, 0.1);
}

.tfa-verify-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  margin-top: 0.5rem;
}

.tfa-input-box {
  width: 100%;
  max-width: 240px;
  padding: 0.75rem;
  background: #1f2937;
  border: 1px solid #374151;
  border-radius: 8px;
  color: white;
  text-align: center;
  font-size: 1.35rem;
  font-family: monospace;
  letter-spacing: 0.4rem;
}

.tfa-input-box:focus {
  border-color: #3b82f6;
  outline: none;
}

.btn-verify-tfa {
  width: 100%;
  max-width: 240px;
  background: #10b981;
  color: white;
  padding: 0.75rem;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.95rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
}

.btn-verify-tfa:hover:not(:disabled) {
  background: #059669;
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
}

.btn-verify-tfa:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

.error-box {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid #ef4444;
  color: #fca5a5;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
  font-size: 0.9rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.btn-retry-tfa {
  background: #1f2937;
  border: 1px solid #374151;
  color: white;
  padding: 0.45rem 1rem;
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
}
</style>
