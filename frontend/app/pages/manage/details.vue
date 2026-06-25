<script setup lang="ts">
import { getResource } from '~/utils/resources';

definePageMeta({ layout: 'default' });

const route = useRoute();
const api = useAdminApi();

const resourceKey = computed(() => route.query.resource as string);
const itemId = computed(() => route.query.id as string | undefined);
const resource = computed(() => (resourceKey.value ? getResource(resourceKey.value) : null));

const loading = ref(true);
const error = ref('');
const details = ref<Record<string, any>>({});

if (!resource.value) {
  error.value = 'Resource config not found or invalid resource parameter.';
  loading.value = false;
}

const loadDetails = async () => {
  if (!resource.value) return;
  loading.value = true;
  error.value = '';
  try {
    if (resource.value.singleton && !itemId.value) {
      const res = await api.getSingleton<Record<string, unknown>>(resource.value.endpoint);
      details.value = res.data ?? {};
    } else if (itemId.value) {
      const res = await api.getOne<Record<string, unknown>>(resource.value.endpoint, itemId.value);
      details.value = res.data ?? {};
    } else {
      throw new Error('Item ID is required for non-singleton resources.');
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load details';
  } finally {
    loading.value = false;
  }
};

const formatValue = (val: unknown) => {
  if (val === null || val === undefined || val === '') return '—';
  return val;
};

const isImageUrl = (key: string, value: unknown) => {
  if (typeof value !== 'string') return false;
  const isImageField = /image|logo|icon/i.test(key);
  const hasImageExtension = /\.(jpeg|jpg|gif|png|webp|svg)/i.test(value) || value.startsWith('data:image/');
  const isHttpUrl = value.startsWith('http://') || value.startsWith('https://');
  return isImageField && (hasImageExtension || isHttpUrl);
};

const isUrl = (key: string, value: unknown) => {
  if (typeof value !== 'string') return false;
  if (isImageUrl(key, value)) return false;
  const isLinkField = /url|link/i.test(key);
  const isHttpUrl = value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/');
  return isLinkField && isHttpUrl;
};

const getBackPath = () => {
  if (!resource.value) return '/';
  const ownerId = route.query.ownerId as string | undefined;
  const siteKey = route.query.siteKey as string | undefined;
  const path = resource.value.singleton ? '/manage/site-settings' : `/manage/${resource.value.key}`;
  let queryStr = '';
  if (ownerId) queryStr += `ownerId=${ownerId}`;
  if (siteKey) queryStr += `${queryStr ? '&' : ''}siteKey=${siteKey}`;
  return queryStr ? `${path}?${queryStr}` : path;
};

const getEditPath = () => {
  if (!resource.value) return '/';
  const ownerId = route.query.ownerId as string | undefined;
  const siteKey = route.query.siteKey as string | undefined;
  if (resource.value.singleton) {
    let queryStr = '';
    if (itemId.value) queryStr += `id=${itemId.value}`;
    if (ownerId) queryStr += `${queryStr ? '&' : ''}ownerId=${ownerId}`;
    if (siteKey) queryStr += `${queryStr ? '&' : ''}siteKey=${siteKey}`;
    return queryStr ? `/manage/site-settings?${queryStr}` : '/manage/site-settings';
  }
  const path = `/manage/${resource.value.key}?edit=${itemId.value}`;
  let queryStr = '';
  if (ownerId) queryStr += `ownerId=${ownerId}`;
  if (siteKey) queryStr += `${queryStr ? '&' : ''}siteKey=${siteKey}`;
  return queryStr ? `${path}&${queryStr}` : path;
};

onMounted(loadDetails);
watch([resourceKey, itemId], loadDetails);
</script>

<template>
  <div class="details-page animate-fade-in">
    <header class="page-header">
      <div>
        <NuxtLink :to="getBackPath()" class="back">
          ← Back to {{ resource?.label ?? 'Dashboard' }}
        </NuxtLink>
        <h1>{{ resource?.label }} - Saved Details</h1>
        <p class="desc">Review the updated details and configurations below.</p>
      </div>
      <div class="actions" v-if="resource && !error && !loading">
        <NuxtLink :to="getEditPath()" class="btn btn-primary">
          ✏️ Edit Details
        </NuxtLink>
      </div>
    </header>

    <div v-if="error" class="error-panel">
      <span class="error-icon">⚠️</span>
      <div class="error-msg">
        <h3>Unable to load details</h3>
        <p>{{ error }}</p>
      </div>
      <NuxtLink to="/" class="btn btn-secondary mt-3">Back to Dashboard</NuxtLink>
    </div>

    <div v-else-if="loading" class="loading-wrap">
      <div class="spinner"></div>
      <p>Loading details...</p>
    </div>

    <div v-else class="details-container">
      <div class="panel details-panel">
        <h2 class="panel-title">Configuration Values</h2>
        
        <div class="fields-list">
          <div 
            v-for="field in resource?.fields" 
            :key="field.key" 
            class="field-row"
          >
            <div class="field-label">
              {{ field.label }}
              <span class="field-key">{{ field.key }}</span>
            </div>
            
            <div class="field-value">
              <!-- Special Display: Status -->
              <span 
                v-if="field.key === 'status'" 
                :class="['status-badge', details[field.key] || 'draft']"
              >
                {{ details[field.key] || 'draft' }}
              </span>

              <!-- Special Display: Boolean -->
              <span 
                v-else-if="field.type === 'boolean'" 
                :class="['bool-badge', details[field.key] ? 'true' : 'false']"
              >
                {{ details[field.key] ? 'Enabled' : 'Disabled' }}
              </span>

              <!-- Special Display: Lines / Arrays -->
              <div v-else-if="field.type === 'lines' || Array.isArray(details[field.key])" class="lines-list">
                <template v-if="details[field.key] && details[field.key].length > 0">
                  <div 
                    v-for="(line, idx) in details[field.key]" 
                    :key="idx" 
                    class="line-item"
                  >
                    <span class="line-bullet">•</span>
                    <!-- Nested image preview inside lines if it is a list of logo/image urls -->
                    <div v-if="isImageUrl(field.key, line)" class="nested-image-preview">
                      <img :src="line" alt="Endorsement/Feature Logo" />
                      <a :href="line" target="_blank" rel="noopener" class="link-secondary">{{ line }}</a>
                    </div>
                    <span v-else>{{ line }}</span>
                  </div>
                </template>
                <span v-else class="text-muted">—</span>
              </div>

              <!-- Special Display: Image URL -->
              <div v-else-if="isImageUrl(field.key, details[field.key])" class="image-preview-block">
                <img 
                  :src="String(details[field.key])" 
                  alt="Preview" 
                  class="image-preview" 
                  @error="(e) => (e.target as HTMLImageElement).style.display = 'none'"
                />
                <a 
                  :href="String(details[field.key])" 
                  target="_blank" 
                  rel="noopener" 
                  class="link-primary"
                >
                  {{ details[field.key] }} ↗
                </a>
              </div>

              <!-- Special Display: Hyperlink -->
              <a 
                v-else-if="isUrl(field.key, details[field.key])" 
                :href="String(details[field.key])" 
                target="_blank" 
                rel="noopener" 
                class="link-primary"
              >
                {{ details[field.key] }} ↗
              </a>

              <!-- Textarea / Long Text -->
              <p v-else-if="field.type === 'textarea'" class="text-area-value">
                {{ formatValue(details[field.key]) }}
              </p>

              <!-- Regular text/number -->
              <span v-else class="text-val">
                {{ formatValue(details[field.key]) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Metadata Panel (Timestamps, IDs, etc) -->
      <div class="panel metadata-panel">
        <h2 class="panel-title">Record Info</h2>
        <div class="metadata-grid">
          <div class="meta-item" v-if="details._id">
            <span class="meta-label">ID</span>
            <span class="meta-val code">{{ details._id }}</span>
          </div>
          <div class="meta-item" v-if="details.createdAt">
            <span class="meta-label">Created At</span>
            <span class="meta-val">{{ new Date(details.createdAt).toLocaleString() }}</span>
          </div>
          <div class="meta-item" v-if="details.updatedAt">
            <span class="meta-label">Last Updated</span>
            <span class="meta-val">{{ new Date(details.updatedAt).toLocaleString() }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.details-page {
  max-width: 1000px;
  margin: 0 auto;
}

.animate-fade-in {
  animation: fadeIn 0.4s ease-out forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.back {
  display: inline-block;
  font-size: 0.9rem;
  color: var(--muted);
  margin-bottom: 0.5rem;
  transition: color 0.2s;
}

.back:hover {
  color: var(--accent);
  text-decoration: none;
}

.page-header h1 {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 700;
  background: linear-gradient(135deg, #ffffff 0%, var(--muted) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.desc {
  margin: 0.35rem 0 0;
  color: var(--muted);
  font-size: 0.95rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.25rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  transition: background 0.2s, transform 0.1s, box-shadow 0.2s;
  cursor: pointer;
  border: none;
  text-decoration: none;
}

.btn-primary {
  background: var(--accent);
  color: white;
}

.btn-primary:hover {
  background: var(--accent-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-secondary {
  background: var(--surface-hover);
  color: var(--text);
  border: 1px solid var(--border);
}

.btn-secondary:hover {
  background: var(--border);
}

.mt-3 {
  margin-top: 1rem;
}

.details-container {
  display: grid;
  grid-template-columns: 2.2fr 1fr;
  gap: 1.5rem;
}

@media (max-width: 768px) {
  .details-container {
    grid-template-columns: 1fr;
  }
}

.panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.panel-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin-top: 0;
  margin-bottom: 1.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border);
  color: var(--text);
}

.fields-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.field-row {
  display: grid;
  grid-template-columns: 1fr 2.5fr;
  gap: 1.5rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid rgba(45, 58, 79, 0.5);
}

.field-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

@media (max-width: 576px) {
  .field-row {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
}

.field-label {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text);
  display: flex;
  flex-direction: column;
}

.field-key {
  font-size: 0.75rem;
  color: var(--muted);
  font-family: monospace;
  margin-top: 0.2rem;
}

.field-value {
  font-size: 0.95rem;
  color: var(--text);
  word-break: break-word;
}

.text-val {
  white-space: pre-wrap;
}

.text-area-value {
  margin: 0;
  padding: 0.75rem;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 0.9rem;
  white-space: pre-wrap;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.65rem;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  border-radius: 20px;
  letter-spacing: 0.05em;
}

.status-badge.published {
  background: rgba(34, 197, 94, 0.15);
  border: 1px solid var(--success);
  color: #86efac;
}

.status-badge.draft {
  background: rgba(139, 156, 179, 0.15);
  border: 1px solid var(--border);
  color: var(--muted);
}

.bool-badge {
  display: inline-block;
  padding: 0.25rem 0.65rem;
  font-size: 0.75rem;
  font-weight: 700;
  border-radius: 4px;
}

.bool-badge.true {
  background: rgba(34, 197, 94, 0.15);
  border: 1px solid var(--success);
  color: #86efac;
}

.bool-badge.false {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid var(--danger);
  color: #fca5a5;
}

.lines-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.line-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.line-bullet {
  color: var(--accent);
}

.nested-image-preview {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.nested-image-preview img {
  max-width: 120px;
  max-height: 40px;
  object-fit: contain;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.05);
  padding: 4px;
  border: 1px solid var(--border);
}

.link-secondary {
  font-size: 0.8rem;
  color: var(--muted);
  text-decoration: underline;
}

.link-secondary:hover {
  color: var(--accent);
}

.image-preview-block {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.image-preview {
  max-width: 100%;
  max-height: 180px;
  object-fit: contain;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.02);
  padding: 6px;
  align-self: flex-start;
}

.link-primary {
  color: var(--accent);
  text-decoration: none;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
}

.link-primary:hover {
  text-decoration: underline;
}

.text-muted {
  color: var(--muted);
}

/* Metadata Panel styles */
.metadata-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.meta-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--muted);
}

.meta-val {
  font-size: 0.85rem;
  color: var(--text);
}

.meta-val.code {
  font-family: monospace;
  background: var(--bg);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  border: 1px solid var(--border);
}

/* Loading state */
.loading-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: var(--muted);
  background: var(--surface);
  border-radius: 12px;
  border: 1px solid var(--border);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(59, 130, 246, 0.1);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Error panel */
.error-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 12px;
  text-align: center;
}

.error-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.error-msg h3 {
  margin: 0 0 0.5rem;
  color: #fca5a5;
}

.error-msg p {
  margin: 0;
  color: var(--muted);
  max-width: 480px;
}
</style>
