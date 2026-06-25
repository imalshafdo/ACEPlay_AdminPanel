<script setup lang="ts">
definePageMeta({ layout: 'auth' });

const email = ref('');
const password = ref('');
const twoFactorToken = ref('');
const require2FA = ref(false);
const error = ref('');
const loading = ref(false);
const { login } = useAuth();

const submit = async () => {
  error.value = '';
  loading.value = true;
  try {
    const res = await login(
      email.value,
      password.value,
      require2FA.value ? twoFactorToken.value : undefined
    );
    if (res && 'requiresPasswordChange' in res && res.requiresPasswordChange) {
      const onboardingData = useState('onboarding_data');
      onboardingData.value = {
        userId: res.userId,
        qrCode: res.qrCode,
        secret: res.secret,
      };
      navigateTo('/forced-setup');
    } else if (res && 'require2FA' in res && res.require2FA) {
      require2FA.value = true;
      twoFactorToken.value = '';
    } else {
      navigateTo('/');
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Login failed';
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="auth-card">
    <div class="auth-brand">
      <span class="icon">♤</span>
      <h1>ACEPlay Admin</h1>
      <p>Sign in to manage ACEPlay content</p>
    </div>

    <form class="auth-form" @submit.prevent="submit">
      <p v-if="error" class="error">{{ error }}</p>

      <template v-if="!require2FA">
        <label>
          Email
          <input v-model="email" type="email" required autocomplete="email" />
        </label>

        <label>
          Password
          <input v-model="password" type="password" required autocomplete="current-password" />
        </label>
      </template>

      <template v-else>
        <div class="two-factor-prompt">
          <span class="icon">🔒</span>
          <h3>Two-Factor Verification</h3>
          <p>Please enter the 6-digit code from Google Authenticator to verify your identity.</p>
        </div>
        <label>
          6-digit Google Auth Code
          <input
            v-model="twoFactorToken"
            type="text"
            placeholder="000000"
            required
            pattern="[0-9]{6}"
            inputmode="numeric"
            maxlength="6"
            autocomplete="one-time-code"
            class="tfa-input"
            autofocus
          />
        </label>
      </template>

      <button type="submit" class="btn-primary" :disabled="loading">
        {{ loading ? 'Processing…' : require2FA ? 'Verify & Sign in' : 'Sign in' }}
      </button>

      <button v-if="require2FA" type="button" class="btn-secondary" @click="require2FA = false; twoFactorToken = ''">
        Back to Login
      </button>
    </form>

    <p class="auth-footer">
      No account?
      <NuxtLink to="/register">Register</NuxtLink>
    </p>
  </div>
</template>

<style scoped>
.auth-card {
  width: 100%;
  max-width: 440px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 2.25rem;
}

.auth-brand {
  text-align: center;
  margin-bottom: 1.75rem;
}

.auth-brand .icon {
  font-size: 2.5rem;
}

.auth-brand h1 {
  margin: 0.5rem 0 0.25rem;
  font-size: 1.6rem;
}

.auth-brand p {
  margin: 0;
  color: var(--muted);
  font-size: 0.95rem;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
}

.auth-form label {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  font-size: 0.92rem;
  color: var(--muted);
}

.auth-form input {
  padding: 0.7rem 0.9rem;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text);
  font-size: 1rem;
}

.tfa-input {
  text-align: center;
  font-size: 1.6rem;
  letter-spacing: 0.6rem;
  font-family: monospace;
  padding: 0.8rem 1rem;
}

.two-factor-prompt {
  text-align: center;
  margin-bottom: 0.75rem;
  background: rgba(59, 130, 246, 0.05);
  border: 1px solid rgba(59, 130, 246, 0.1);
  padding: 1.1rem;
  border-radius: 8px;
}

.two-factor-prompt .icon {
  font-size: 2rem;
  display: block;
  margin-bottom: 0.35rem;
}

.two-factor-prompt h3 {
  margin: 0 0 0.35rem;
  font-size: 1.25rem;
  color: white;
}

.two-factor-prompt p {
  margin: 0;
  color: var(--muted);
  font-size: 0.9rem;
  line-height: 1.5;
}

.btn-primary {
  margin-top: 0.5rem;
  padding: 0.75rem;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: var(--accent-hover);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 0.75rem;
  background: transparent;
  color: var(--muted);
  border: 1px solid var(--border);
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: var(--surface-hover);
  color: var(--text);
}

.error {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid var(--danger);
  color: #fca5a5;
  padding: 0.7rem 0.9rem;
  border-radius: 6px;
  margin: 0;
  font-size: 0.95rem;
}

.auth-footer {
  text-align: center;
  margin: 1.5rem 0 0;
  font-size: 0.95rem;
  color: var(--muted);
}
</style>
