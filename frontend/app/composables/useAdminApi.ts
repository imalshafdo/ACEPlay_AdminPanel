export interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  message?: string;
}

export const useAdminApi = () => {
  const config = useRuntimeConfig();
  const base = (config.public.apiUrl as string || 'http://localhost:5000').replace(/\/$/, '');
  const { token } = useAuth();

  const headers = () => ({
    'Content-Type': 'application/json',
    ...(token.value ? { Authorization: `Bearer ${token.value}` } : {}),
  });

  const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
    const res = await fetch(`${base}${path}`, {
      ...options,
      headers: { ...headers(), ...options.headers },
    });
    const json = await res.json();
    if (!res.ok || json.success === false) {
      if (res.status === 401) {
        const { clearSession } = useAuth();
        clearSession();
        navigateTo('/login');
      }
      throw new Error(json.message || `Request failed (${res.status})`);
    }
    return json;
  };

  // ==========================================
  // ✨ ADD THIS NEW HELPER FOR LOGIN & 2FA ✨
  // ==========================================
  const authRequest = <T>(endpoint: string, method: string, body: Record<string, unknown>) => {
    return request<ApiResponse<T>>(`/api/auth/${endpoint.replace(/^\//, '')}`, {
      method,
      body: JSON.stringify(body)
    });
  };

  // Existing Admin routes (Leave these exactly as they are!)
  const list = <T>(endpoint: string, query?: Record<string, string>) => {
    const qs = query ? `?${new URLSearchParams(query)}` : '';
    return request<ApiResponse<T[]>>(`/api/admin/${endpoint}${qs}`);
  };

  const getOne = <T>(endpoint: string, id: string) =>
    request<ApiResponse<T>>(`/api/admin/${endpoint}/${id}`);

  const create = <T>(endpoint: string, body: Record<string, unknown>, query?: Record<string, string>) => {
    const qs = query ? `?${new URLSearchParams(query)}` : '';
    return request<ApiResponse<T>>(`/api/admin/${endpoint}${qs}`, { method: 'POST', body: JSON.stringify(body) });
  };

  const update = <T>(endpoint: string, id: string, body: Record<string, unknown>, query?: Record<string, string>) => {
    const qs = query ? `?${new URLSearchParams(query)}` : '';
    return request<ApiResponse<T>>(`/api/admin/${endpoint}/${id}${qs}`, { method: 'PUT', body: JSON.stringify(body) });
  };

  const updateSingleton = <T>(endpoint: string, body: Record<string, unknown>) =>
    request<ApiResponse<T>>(`/api/admin/${endpoint}`, { method: 'PUT', body: JSON.stringify(body) });

  const getSingleton = <T>(endpoint: string) => request<ApiResponse<T>>(`/api/admin/${endpoint}`);

  const remove = (endpoint: string, id: string, query?: Record<string, string>) => {
    const qs = query ? `?${new URLSearchParams(query)}` : '';
    return request<ApiResponse<unknown>>(`/api/admin/${endpoint}/${id}${qs}`, { method: 'DELETE' });
  };

  const getAuditLogs = <T>() => request<ApiResponse<T[]>>('/api/admin/logs');

  // Return authRequest along with the others
  return { authRequest, list, getOne, create, update, updateSingleton, getSingleton, remove, getAuditLogs };
};