<script setup lang="ts">
import type { ResourceConfig } from '~/utils/resources';

defineProps<{
  open: boolean;
  title: string;
  resource: ResourceConfig;
  modelValue: Record<string, unknown>;
  saving?: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, unknown>];
  close: [];
  submit: [];
}>();
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="overlay" @click.self="emit('close')">
      <div class="modal">
        <header class="modal-header">
          <h2>{{ title }}</h2>
          <button type="button" class="close-btn" aria-label="Close" @click="emit('close')">×</button>
        </header>
        <div class="modal-body">
          <ResourceForm
            :resource="resource"
            :model-value="modelValue"
            @update:model-value="emit('update:modelValue', $event)"
            @submit="emit('submit')"
          >
            <div class="actions">
              <button type="button" class="btn btn-ghost" @click="emit('close')">Cancel</button>
              <button type="submit" class="btn btn-primary" :disabled="saving">
                {{ saving ? 'Saving…' : 'Save' }}
              </button>
            </div>
          </ResourceForm>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 1rem;
}

.modal {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border);
}

.modal-header h2 {
  margin: 0;
  font-size: 1.1rem;
}

.close-btn {
  background: none;
  border: none;
  color: var(--muted);
  font-size: 1.5rem;
  line-height: 1;
  padding: 0.25rem;
}

.close-btn:hover {
  color: var(--text);
}

.modal-body {
  padding: 1.25rem;
  overflow-y: auto;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: none;
  font-size: 0.9rem;
  font-weight: 500;
}

.btn-primary {
  background: var(--accent);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--accent-hover);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-ghost {
  background: transparent;
  color: var(--muted);
  border: 1px solid var(--border);
}

.btn-ghost:hover {
  background: var(--surface-hover);
  color: var(--text);
}
</style>
