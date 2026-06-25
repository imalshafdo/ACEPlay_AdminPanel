<script setup lang="ts">
import { ref, onMounted } from 'vue';

definePageMeta({ layout: 'auth' });

const { onboardingSetup } = useAuth();

interface OnboardingData {
  userId: string;
  qrCode: string;
  secret: string;
}

const onboardingData = useState<OnboardingData | null>('onboarding_data', () => null);

const newPassword = ref('');
const confirmPassword = ref('');
const twoFactorToken = ref('');
const loading = ref(false);
const error = ref('');
const success = ref('');

// Step tracking for beautiful multi-step indicator
const currentStep = ref(1);

onMounted(() => {
  if (!onboardingData.value || !onboardingData.value.userId) {
    navigateTo('/login');
  }
});

const nextStep = () => {
  error.value = '';
  if (currentStep.value === 1) {
    if (!newPassword.value) {
      error.value = 'New password is required';
      return;
    }
    if (newPassword.value.length < 6) {
      error.value = 'Password must be at least 6 characters';
      return;
    }
    if (newPassword.value !== confirmPassword.value) {
      error.value = 'Passwords do not match';
      return;
    }
    currentStep.value = 2;
  }
};

const prevStep = () => {
  currentStep.value = 1;
};

const handleSubmit = async () => {
  error.value = '';
  success.value = '';

  if (!twoFactorToken.value || twoFactorToken.value.length !== 6) {
    error.value = 'Please enter a valid 6-digit 2FA token';
    return;
  }

  if (!onboardingData.value || !onboardingData.value.userId) {
    error.value = 'Session expired. Please log in again.';
    return;
  }

  loading.value = true;
  try {
    await onboardingSetup(
      onboardingData.value.userId,
      newPassword.value,
      twoFactorToken.value
    );
    success.value = 'Account successfully configured!';
    onboardingData.value = null; // Clear onboarding state
    
    // Short delay for successful feel/animation
    setTimeout(() => {
      navigateTo('/');
    }, 1000);
  } catch (err: any) {
    error.value = err.data?.message || err.message || 'Verification failed';
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="auth-card onboarding-card">
    <div class="auth-brand">
      <span class="icon animate-glow">♤</span>
      <h1>Account Setup</h1>
      <p>Configure your new credentials and enable two-factor security.</p>
    </div>

    <!-- Step Progress Indicator -->
    <div class="step-progress">
      <div class="step-line">
        <div class="step-line-fill" :style="{ width: currentStep === 2 ? '100%' : '0%' }"></div>
      </div>
      <div class="step-node" :class="{ active: currentStep >= 1, completed: currentStep > 1 }">
        <span class="step-number" v-if="currentStep === 1">1</span>
        <span class="step-check" v-else>✓</span>
        <span class="step-label">Password</span>
      </div>
      <div class="step-node" :class="{ active: currentStep >= 2 }">
        <span class="step-number">2</span>
        <span class="step-label">2FA Setup</span>
      </div>
    </div>

    <form class="auth-form" @submit.prevent="handleSubmit">
      <p v-if="error" class="error animate-shake">{{ error }}</p>
      <p v-if="success" class="success">{{ success }}</p>

      <!-- Step 1: Change Password -->
      <div v-if="currentStep === 1" class="step-content animate-fade-in">
        <label>
          Enter New Password
          <input
            v-model="newPassword"
            type="password"
            placeholder="Min. 6 characters"
            required
            autocomplete="new-password"
            class="input-premium"
          />
        </label>

        <label>
          Confirm New Password
          <input
            v-model="confirmPassword"
            type="password"
            placeholder="Repeat password"
            required
            autocomplete="new-password"
            class="input-premium"
          />
        </label>

        <button type="button" class="btn-primary btn-premium btn-next" @click="nextStep">
          Continue to 2FA Setup →
        </button>
      </div>

      <!-- Step 2: 2FA Setup and Verify -->
      <div v-else-if="currentStep === 2" class="step-content animate-fade-in">
        <div class="two-factor-setup-info">
          <p class="instruction-text">
            Scan the QR code below using Google Authenticator, Duo, or any TOTP application to link your account.
          </p>

          <div class="qr-container" v-if="onboardingData?.qrCode">
            <img :src="onboardingData.qrCode" alt="2FA QR Code" class="qr-image" />
            <div class="secret-wrapper">
              <span class="secret-label">Can't scan? Use manual key:</span>
              <div class="secret-key-display" title="Click to copy text">{{ onboardingData.secret }}</div>
            </div>
          </div>
        </div>

        <label>
          6-digit Authentication Code
          <input
            v-model="twoFactorToken"
            type="text"
            placeholder="000000"
            required
            pattern="[0-9]{6}"
            inputmode="numeric"
            maxlength="6"
            autocomplete="one-time-code"
            class="tfa-input input-premium"
            autofocus
          />
        </label>

        <div class="button-group">
          <button type="button" class="btn-secondary btn-premium" :disabled="loading" @click="prevStep">
            ← Back
          </button>
          <button type="submit" class="btn-primary btn-premium btn-submit" :disabled="loading">
            {{ loading ? 'Configuring…' : 'Complete Onboarding' }}
          </button>
        </div>
      </div>
    </form>
  </div>
</template>

<style scoped>
/* Main Card & Layout Modifications */
.onboarding-card {
  width: 100%;
  max-width: 580px;
  background: linear-gradient(135deg, var(--surface) 0%, rgba(26, 35, 50, 0.95) 100%);
  border: 1px solid var(--border);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  padding: 3rem;
  border-radius: 16px;
}

.auth-brand {
  text-align: center;
  margin-bottom: 1.75rem;
}

.auth-brand .icon {
  font-size: 3rem;
}

.auth-brand h1 {
  margin: 0.5rem 0 0.5rem;
  font-size: 2rem;
  background: linear-gradient(90deg, #60a5fa, #3b82f6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.auth-brand p {
  margin: 0;
  color: var(--muted);
  font-size: 1.1rem;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.auth-form label {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 1.05rem;
  color: var(--muted);
}

.auth-form input {
  padding: 0.85rem 1.1rem;
  border-radius: 8px;
  color: var(--text);
  font-size: 1.1rem;
}

/* Step Progress styles */
.step-progress {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  margin: 1.75rem 0 2.5rem;
  padding: 0 2rem;
}

.step-line {
  position: absolute;
  top: 20px;
  left: 3.5rem;
  right: 3.5rem;
  height: 2px;
  background: var(--border);
  z-index: 1;
}

.step-line-fill {
  height: 100%;
  background: var(--accent);
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.step-node {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.step-number, .step-check {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--bg);
  border: 2px solid var(--border);
  color: var(--muted);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.05rem;
  transition: all 0.3s ease;
}

.step-label {
  font-size: 0.9rem;
  color: var(--muted);
  font-weight: 500;
  transition: color 0.3s ease;
}

.step-node.active .step-number {
  border-color: var(--accent);
  color: white;
  background: var(--surface);
  box-shadow: 0 0 12px rgba(59, 130, 246, 0.4);
}

.step-node.active .step-label {
  color: white;
}

.step-node.completed .step-check {
  border-color: var(--success);
  background: var(--success);
  color: white;
}

.step-node.completed .step-label {
  color: var(--success);
}

/* Premium Inputs */
.input-premium {
  border: 1px solid var(--border);
  background: rgba(15, 20, 25, 0.7);
  transition: all 0.25s ease;
}

.input-premium:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
  background: var(--bg);
}

/* QR Code Display styles */
.two-factor-setup-info {
  margin-bottom: 1.25rem;
}

.instruction-text {
  color: var(--muted);
  font-size: 1.05rem;
  line-height: 1.5;
  text-align: center;
  margin: 0 0 1.5rem;
}

.qr-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px dashed var(--border);
  border-radius: 8px;
  margin-bottom: 1rem;
}

.qr-image {
  background: white;
  padding: 10px;
  border-radius: 10px;
  margin-bottom: 1rem;
  width: 200px;
  height: 200px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.secret-wrapper {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.45rem;
}

.secret-label {
  font-size: 0.85rem;
  color: var(--muted);
}

.secret-key-display {
  font-family: monospace;
  font-size: 0.95rem;
  color: #60a5fa;
  word-break: break-all;
  text-align: center;
  background: rgba(0, 0, 0, 0.25);
  padding: 0.6rem 1rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  user-select: all;
  letter-spacing: 0.07rem;
}

/* Buttons and layouts */
.button-group {
  display: grid;
  grid-template-columns: 100px 1fr;
  gap: 0.75rem;
  margin-top: 1rem;
}

.btn-primary {
  padding: 0.9rem;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  font-size: 1.1rem;
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
  padding: 0.9rem;
  background: transparent;
  color: var(--muted);
  border: 1px solid var(--border);
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  font-size: 1.1rem;
  transition: all 0.2s;
}

.btn-secondary:hover:not(:disabled) {
  background: var(--surface-hover);
  color: var(--text);
}

.btn-premium {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-next {
  margin-top: 1rem;
  width: 100%;
}

.tfa-input {
  text-align: center;
  font-size: 2rem;
  letter-spacing: 0.8rem;
  font-family: monospace;
  padding: 1rem 1.2rem;
}

.success {
  background: rgba(34, 197, 94, 0.15);
  border: 1px solid var(--success);
  color: #86efac;
  padding: 0.7rem 0.9rem;
  border-radius: 6px;
  margin: 0 0 1rem;
  font-size: 0.95rem;
  text-align: center;
}

.error {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid var(--danger);
  color: #fca5a5;
  padding: 0.7rem 0.9rem;
  border-radius: 6px;
  margin: 0 0 1rem;
  font-size: 0.95rem;
  text-align: center;
}

/* Animations */
.animate-glow {
  display: inline-block;
  animation: glow 3s ease-in-out infinite;
}

@keyframes glow {
  0%, 100% {
    transform: scale(1);
    filter: drop-shadow(0 0 0px rgba(59, 130, 246, 0));
  }
  50% {
    transform: scale(1.05);
    filter: drop-shadow(0 0 10px rgba(59, 130, 246, 0.6));
  }
}

.animate-fade-in {
  animation: fadeIn 0.4s ease-out forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-shake {
  animation: shake 0.4s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-6px); }
  75% { transform: translateX(6px); }
}
</style>
