<script setup lang="ts">
import { ref, computed } from 'vue';

definePageMeta({ layout: 'auth' });

const name = ref('');
const email = ref('');
const phone = ref('');
const password = ref('');
const confirmPassword = ref('');
const error = ref('');
const loading = ref(false);

const show2FASetup = ref(false);
const userId = ref('');
const qrCodeUrl = ref('');
const manualSecret = ref('');
const smsCode = ref('');
const verificationCode = ref('');
const verificationLoading = ref(false);

const { setSession } = useAuth();
const config = useRuntimeConfig();

const authBase = computed(() => {
  const apiUrl = (config.public.apiUrl as string || 'http://localhost:5000').replace(/\/$/, '');
  return `${apiUrl}/api/auth`;
});

const submit = async () => {
  error.value = '';
  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match';
    return;
  }
  if (password.value.length < 6) {
    error.value = 'Password must be at least 6 characters';
    return;
  }
  loading.value = true;
  try {
    const res = await $fetch<{
      success: boolean;
      requireSetup?: boolean;
      data: {
        userId: string;
        email: string;
        phone: string;
        qrCode: string;
        secret: string;
        smsCode?: string;
      }
    }>(`${authBase.value}/register`, {
      method: 'POST',
      body: {
        name: name.value,
        email: email.value,
        phone: phone.value,
        password: password.value,
      },
    });

    if (res.success && res.requireSetup) {
      userId.value = res.data.userId;
      qrCodeUrl.value = res.data.qrCode;
      manualSecret.value = res.data.secret;
      smsCode.value = res.data.smsCode || '';
      show2FASetup.value = true;
    }
  } catch (e) {
    error.value = e instanceof Error ? (e as any).data?.message || e.message : 'Registration failed';
  } finally {
    loading.value = false;
  }
};

const verify2FA = async () => {
  if (!verificationCode.value) return;
  verificationLoading.value = true;
  error.value = '';
  try {
    const res = await $fetch<{
      success: boolean;
      data: any;
    }>(`${authBase.value}/register/verify`, {
      method: 'POST',
      body: {
        userId: userId.value,
        token: verificationCode.value,
      },
    });

    if (res.success && res.data) {
      setSession(res.data);
      navigateTo('/');
    }
  } catch (e) {
    error.value = e instanceof Error ? (e as any).data?.message || e.message : 'Verification failed';
  } finally {
    verificationLoading.value = false;
  }
};

const copyToClipboard = async (text: string, successMessage: string) => {
  try {
    await navigator.clipboard.writeText(text);
    alert(successMessage);
  } catch (err) {
    console.error('Failed to copy text: ', err);
  }
};
</script>

<template>
  <div class="auth-card">
    <div class="auth-brand">
      <span class="icon">♤</span>
      <template v-if="!show2FASetup">
        <h1>Create admin account</h1>
        <p>Register to manage ACEPlay content</p>
      </template>
      <template v-else>
        <h1>Two-Factor Verification</h1>
        <p>Secure your account with 2FA setup</p>
      </template>
    </div>

    <!-- Step 1: Registration Form -->
    <form v-if="!show2FASetup" class="auth-form" @submit.prevent="submit">
      <p v-if="error" class="error">{{ error }}</p>

      <label>
        Full name
        <input v-model="name" type="text" required autocomplete="name" />
      </label>

      <label>
        Email
        <input v-model="email" type="email" required autocomplete="email" />
      </label>

      <label>
        Phone number
        <input v-model="phone" type="tel" placeholder="+66 81 234 5678" required autocomplete="tel" />
      </label>

      <label>
        Password
        <input v-model="password" type="password" required autocomplete="new-password" />
      </label>

      <label>
        Confirm password
        <input v-model="confirmPassword" type="password" required autocomplete="new-password" />
      </label>

      <button type="submit" class="btn-primary" :disabled="loading">
        {{ loading ? 'Creating account…' : 'Register' }}
      </button>

      <p class="auth-footer">
        Already have an account?
        <NuxtLink to="/login">Sign in</NuxtLink>
      </p>
    </form>

    <!-- Step 2: 2FA Setup -->
    <div v-else class="auth-form">
      <div class="two-factor-prompt">
        <span class="icon">🔒</span>
        <h3>Scan QR Code</h3>
        <p>Scan the code in Google Authenticator or enter the secret key manually.</p>
      </div>

      <p v-if="error" class="error">{{ error }}</p>

      <!-- Simulated Dev Mode SMS Box -->
      <div v-if="smsCode" class="dev-sms-banner">
        <span class="dev-sms-badge">Simulated SMS</span>
        <p class="dev-sms-text">
          A verification code has been simulated and sent to <strong>{{ phone }}</strong>:
          <code class="dev-code" title="Click to copy" @click="copyToClipboard(smsCode, 'Copied code!')">{{ smsCode }}</code>
        </p>
      </div>

      <div class="qr-code-section">
        <img v-if="qrCodeUrl" :src="qrCodeUrl" alt="2FA QR Code" class="qr-img-register" />
        <div class="secret-key-section">
          <span class="secret-label">Setup Key:</span>
          <code class="secret-value" title="Click to copy" @click="copyToClipboard(manualSecret, 'Copied secret key!')">{{ manualSecret }}</code>
        </div>
      </div>

      <form @submit.prevent="verify2FA" class="auth-form">
        <label>
          Enter 6-digit code
          <input
            v-model="verificationCode"
            type="text"
            placeholder="000000"
            required
            pattern="[0-9]{6}"
            inputmode="numeric"
            maxlength="6"
            class="tfa-input"
            autofocus
          />
        </label>

        <button type="submit" class="btn-primary" :disabled="verificationLoading">
          {{ verificationLoading ? 'Verifying…' : 'Verify & Complete Setup' }}
        </button>

        <button type="button" class="btn-secondary" @click="show2FASetup = false; error = ''">
          Back to Registration
        </button>
      </form>
    </div>
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

.btn-primary {
  margin-top: 0.5rem;
  padding: 0.75rem;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
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

/* 2FA Setup Sections */
.qr-code-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 0.5rem;
}

.qr-img-register {
  width: 150px;
  height: 150px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: white;
  padding: 4px;
}

.secret-key-section {
  font-size: 0.8rem;
  color: var(--muted);
  text-align: center;
}

.secret-label {
  display: block;
  margin-bottom: 0.25rem;
}

.secret-value {
  display: block;
  font-family: monospace;
  background: var(--surface-hover);
  color: var(--text);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  word-break: break-all;
}

.secret-value:hover {
  background: var(--border);
}

/* Simulated SMS elements */
.dev-sms-banner {
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.25);
  border-radius: 8px;
  padding: 0.75rem;
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
}

.dev-sms-badge {
  background: #f59e0b;
  color: #0b0f19;
  font-size: 0.65rem;
  font-weight: 800;
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  text-transform: uppercase;
  display: inline-block;
  margin-bottom: 0.25rem;
}

.dev-sms-text {
  margin: 0;
  color: var(--text);
  line-height: 1.4;
}

.dev-code {
  font-family: monospace;
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
  padding: 0.1rem 0.3rem;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
}

.dev-code:hover {
  background: rgba(245, 158, 11, 0.25);
}
</style>
