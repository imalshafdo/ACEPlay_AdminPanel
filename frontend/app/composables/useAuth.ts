export type AdminRole = 'client' | 'superadmin';

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: AdminRole;
  isTwoFactorEnabled?: boolean;
}

export const useAuth = () => {
  const config = useRuntimeConfig();
  const token = useCookie<string | null>('admin_token', { maxAge: 60 * 60 * 24 * 7 });
  const user = useState<AdminUser | null>('admin_user', () => null);

  const authBase = computed(() => {
    const admin = config.public.apiBase as string;
    return admin.replace(/\/api\/admin\/?$/, '/api/auth');
  });

  const setSession = (data: AdminUser & { token: string }) => {
    token.value = data.token;
    user.value = {
      _id: data._id,
      name: data.name,
      email: data.email,
      role: data.role ?? 'client',
      isTwoFactorEnabled: data.isTwoFactorEnabled ?? false,
    };
  };

  const clearSession = () => {
    token.value = null;
    user.value = null;
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await $fetch<{ success: boolean; data: AdminUser & { token: string } }>(
      `${authBase.value}/register`,
      { method: 'POST', body: { name, email, password } }
    );
    setSession(res.data);
    return res.data;
  };

  const login = async (email: string, password: string, twoFactorToken?: string) => {
    const res = await $fetch<{
      success: boolean;
      require2FA?: boolean;
      requiresPasswordChange?: boolean;
      userId?: string;
      qrCode?: string;
      secret?: string;
      data?: AdminUser & { token: string };
    }>(
      `${authBase.value}/login`,
      { method: 'POST', body: { email, password, twoFactorToken } }
    );
    if (res.requiresPasswordChange) {
      return {
        requiresPasswordChange: true,
        userId: res.userId,
        qrCode: res.qrCode,
        secret: res.secret,
      };
    }
    if (res.require2FA) {
      return { require2FA: true };
    }
    if (res.data) {
      setSession(res.data);
      return res.data;
    }
    throw new Error('Invalid login response');
  };

  const onboardingSetup = async (userId: string, newPassword: string, twoFactorToken: string) => {
    const res = await $fetch<{
      success: boolean;
      data: AdminUser & { token: string };
    }>(
      `${authBase.value}/onboarding-setup`,
      {
        method: 'POST',
        body: { userId, newPassword, twoFactorToken }
      }
    );
    if (res.data) {
      setSession(res.data);
      return res.data;
    }
    throw new Error('Onboarding setup failed');
  };

  const logout = () => {
    clearSession();
    navigateTo('/login');
  };

  const fetchMe = async () => {
    if (!token.value) return null;
    try {
      const res = await $fetch<{ success: boolean; data: AdminUser }>(`${authBase.value}/me`, {
        headers: { Authorization: `Bearer ${token.value}` },
      });
      user.value = {
        ...res.data,
        role: res.data.role ?? 'client',
        isTwoFactorEnabled: res.data.isTwoFactorEnabled ?? false,
      };
      return user.value;
    } catch {
      clearSession();
      return null;
    }
  };

  const isLoggedIn = computed(() => !!token.value);
  const isSuperadmin = computed(() => user.value?.role === 'superadmin');

  return {
    token,
    user,
    isLoggedIn,
    isSuperadmin,
    register,
    login,
    onboardingSetup,
    logout,
    fetchMe,
    setSession,
    clearSession,
  };
};
