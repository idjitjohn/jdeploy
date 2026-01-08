const API_BASE = ''

interface ApiRequestOptions extends RequestInit {
  headers?: Record<string, string>
}

async function apiRequest<T = any>(url: string, options: ApiRequestOptions = {}): Promise<T> {
  const defaultOptions: ApiRequestOptions = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...defaultOptions,
    ...options
  })

  if (response.status === 401) {
    throw new Error('Unauthorized')
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || 'Request failed')
  }

  return response.json()
}

export const api = {
  auth: {
    login: (username: string, password: string) => apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    }),
    logout: () => apiRequest('/api/auth/logout', { method: 'POST' }),
    me: () => apiRequest('/api/auth/me')
  },

  applications: {
    list: () => apiRequest('/api/applications'),
    get: (id: string) => apiRequest(`/api/applications/${id}`),
    create: (data: any) => apiRequest('/api/applications', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    update: (id: string, data: any) => apiRequest(`/api/applications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    delete: (id: string) => apiRequest(`/api/applications/${id}`, {
      method: 'DELETE'
    }),
    getBranches: (id: string) => apiRequest(`/api/applications/${id}/branches`),
    switchBranch: (id: string, branch: string) => apiRequest(`/api/applications/${id}/branch`, {
      method: 'POST',
      body: JSON.stringify({ branch })
    }),
    checkName: (name: string, excludeId?: string) => apiRequest('/api/applications/check/name', {
      method: 'POST',
      body: JSON.stringify({ name, excludeId })
    }),
    checkSubdomain: (subdomain: string, domain: string, excludeId?: string) => apiRequest('/api/applications/check/subdomain', {
      method: 'POST',
      body: JSON.stringify({ subdomain, domain, excludeId })
    }),
    checkPort: (port: number, excludeId?: string) => apiRequest('/api/applications/check/port', {
      method: 'POST',
      body: JSON.stringify({ port, excludeId })
    })
  },

  deployments: {
    start: (repoName: string, query: Record<string, string> = {}) => {
      const qs = new URLSearchParams(query).toString()
      return apiRequest(`/api/deployments/${repoName}/start?${qs}`, {
        method: 'POST'
      })
    },
    stop: (repoName: string, query: Record<string, string> = {}) => {
      const qs = new URLSearchParams(query).toString()
      return apiRequest(`/api/deployments/${repoName}/stop?${qs}`, {
        method: 'POST'
      })
    },
    restart: (repoName: string, query: Record<string, string> = {}) => {
      const qs = new URLSearchParams(query).toString()
      return apiRequest(`/api/deployments/${repoName}/restart?${qs}`, {
        method: 'POST'
      })
    },
    reload: (repoName: string, query: Record<string, string> = {}) => {
      const qs = new URLSearchParams(query).toString()
      return apiRequest(`/api/deployments/${repoName}/reload?${qs}`, {
        method: 'POST'
      })
    },
    delete: (repoName: string, query: Record<string, string> = {}) => {
      const qs = new URLSearchParams(query).toString()
      return apiRequest(`/api/deployments/${repoName}?${qs}`, {
        method: 'DELETE'
      })
    }
  },

  domains: {
    list: () => apiRequest('/api/domains'),
    get: (id: string) => apiRequest(`/api/domains/${id}`),
    create: (data: any) => apiRequest('/api/domains', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    update: (id: string, data: any) => apiRequest(`/api/domains/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    delete: (id: string) => apiRequest(`/api/domains/${id}`, {
      method: 'DELETE'
    })
  },

  templates: {
    list: () => apiRequest('/api/templates'),
    get: (id: string) => apiRequest(`/api/templates/${id}`),
    create: (data: any) => apiRequest('/api/templates', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    update: (id: string, data: any) => apiRequest(`/api/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    delete: (id: string) => apiRequest(`/api/templates/${id}`, {
      method: 'DELETE'
    })
  },

  logs: {
    list: (repoName: string, query: Record<string, string> = {}) => {
      const qs = new URLSearchParams(query).toString()
      return apiRequest(`/api/logs/app/${repoName}?${qs}`)
    },
    get: (logId: string) => apiRequest(`/api/logs/deployment/${logId}`)
  },

  system: {
    status: () => apiRequest('/api/system/status'),
    pm2: () => apiRequest('/api/system/pm2'),
    nginxReload: (sudoPassword?: string) => apiRequest('/api/system/nginx/reload', {
      method: 'POST',
      body: JSON.stringify({ sudoPassword })
    }),
    nginxTest: () => apiRequest('/api/system/nginx/test', {
      method: 'POST'
    }),
    sudoAuth: (password: string) => apiRequest('/api/system/sudo/authenticate', {
      method: 'POST',
      body: JSON.stringify({ password })
    })
  },

  configuration: {
    get: () => apiRequest('/api/configuration'),
    update: (data: any) => apiRequest('/api/configuration', {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }
}
