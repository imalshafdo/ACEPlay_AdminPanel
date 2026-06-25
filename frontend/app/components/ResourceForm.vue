<script setup lang="ts">
import type { FieldConfig, ResourceConfig } from '~/utils/resources';

const props = defineProps<{
  resource: ResourceConfig;
  modelValue: Record<string, unknown>;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, unknown>];
  submit: [];
}>();

const form = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

const setField = (key: string, value: unknown) => {
  form.value = { ...form.value, [key]: value };
};

const onFieldInput = (field: FieldConfig, event: Event) => {
  const target = event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
  let value: unknown = target.value;
  if (field.type === 'number') value = target.value === '' ? undefined : Number(target.value);
  if (field.type === 'boolean') value = (target as HTMLInputElement).checked;
  setField(field.key, value);
};
</script>

<template>
  <form class="form" @submit.prevent="emit('submit')">
    <div v-for="field in resource.fields" :key="field.key" class="field">
      <label :for="field.key">{{ field.label }}</label>

      <select
        v-if="field.type === 'select'"
        :id="field.key"
        :value="String(form[field.key] ?? '')"
        @change="onFieldInput(field, $event)"
      >
        <option value="">—</option>
        <option v-for="opt in field.options" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>

      <textarea
        v-else-if="field.type === 'textarea' || field.type === 'lines'"
        :id="field.key"
        :value="String(form[field.key] ?? '')"
        :rows="field.type === 'lines' ? 6 : 4"
        :placeholder="field.hint"
        @input="onFieldInput(field, $event)"
      />

      <label v-else-if="field.type === 'boolean'" class="checkbox-row">
        <input
          type="checkbox"
          :checked="Boolean(form[field.key])"
          @change="onFieldInput(field, $event)"
        />
        <span>Enabled</span>
      </label>

      <input
        v-else
        :id="field.key"
        :type="field.type === 'number' ? 'number' : 'text'"
        :value="form[field.key] ?? ''"
        :required="field.required"
        @input="onFieldInput(field, $event)"
      />
    </div>
    <slot />
  </form>
</template>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field label {
  display: block;
  font-size: 0.8rem;
  color: var(--muted);
  margin-bottom: 0.35rem;
}

.field input,
.field select,
.field textarea {
  width: 100%;
  padding: 0.55rem 0.75rem;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text);
}

.field input:focus,
.field select:focus,
.field textarea:focus {
  outline: none;
  border-color: var(--accent);
}

.checkbox-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.checkbox-row input {
  width: auto;
}

.hint {
  margin: 0.25rem 0 0;
  font-size: 0.75rem;
  color: var(--muted);
}
</style>
