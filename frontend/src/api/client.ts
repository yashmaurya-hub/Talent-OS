const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('talentos_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `HTTP error ${response.status}`);
  }

  return data;
}

export const api = {
  auth: {
    login: (credentials: { email: string; password: string }) =>
      request<any>('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    register: (payload: any) =>
      request<any>('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
    getMe: () => request<any>('/auth/me'),
    getDemoAccounts: () => request<any>('/auth/demo-accounts'),
  },

  hierarchy: {
    getTree: () => request<any>('/hierarchy'),
    createNode: (payload: { name: string; nodeType: string; parentId?: string | null }) =>
      request<any>('/hierarchy/nodes', { method: 'POST', body: JSON.stringify(payload) }),
    updateNode: (id: string, payload: { name?: string; nodeType?: string }) =>
      request<any>(`/hierarchy/nodes/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    deleteNode: (id: string) =>
      request<any>(`/hierarchy/nodes/${id}`, { method: 'DELETE' }),
  },

  profiles: {
    list: (params: Record<string, any> = {}) => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          searchParams.append(k, String(v));
        }
      });
      const q = searchParams.toString();
      return request<any>(`/profiles${q ? `?${q}` : ''}`);
    },
    getById: (id: string) => request<any>(`/profiles/${id}`),
    createPerson: (payload: any) =>
      request<any>('/profiles', { method: 'POST', body: JSON.stringify(payload) }),
    addRecord: (profileId: string, record: any) =>
      request<any>(`/profiles/${profileId}/records`, { method: 'POST', body: JSON.stringify(record) }),
    addSkill: (profileId: string, skill: any) =>
      request<any>(`/profiles/${profileId}/skills`, { method: 'POST', body: JSON.stringify(skill) }),
    addActivity: (profileId: string, activity: any) =>
      request<any>(`/profiles/${profileId}/activities`, { method: 'POST', body: JSON.stringify(activity) }),
    addAchievement: (profileId: string, achievement: any) =>
      request<any>(`/profiles/${profileId}/achievements`, { method: 'POST', body: JSON.stringify(achievement) }),
  },

  tasks: {
    list: () => request<any>('/tasks'),
    getById: (id: string) => request<any>(`/tasks/${id}`),
    create: (task: any) =>
      request<any>('/tasks', { method: 'POST', body: JSON.stringify(task) }),
    recommend: (taskId: string) =>
      request<any>(`/tasks/${taskId}/recommend`, { method: 'POST' }),
  },

  analytics: {
    getOverview: () => request<any>('/analytics/overview'),
  },
};
