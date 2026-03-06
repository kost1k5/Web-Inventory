// API base URL — set VITE_API_URL in Vercel environment variables
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    throw new Error(payload?.error || payload?.message || `Request failed: ${response.status}`);
  }

  return payload;
}

export const api = {
  categories: {
    getAll: () => request('/inventories/categories'),
  },

  tags: {
    suggest: (q = '') => request(`/inventories/tags/suggest?q=${encodeURIComponent(q)}`),
  },

  inventories: {
    getAll: () => request('/inventories'),
    getById: (id) => request(`/inventories/${id}`),
    create: (data) => request('/inventories', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data, version) => request(`/inventories/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...data, version }),
    }),
    delete: (id) => request(`/inventories/${id}`, { method: 'DELETE' }),
    search: (query) => request(`/inventories/search?q=${encodeURIComponent(query)}`),
    getTagCloud: () => request('/inventories/tags/cloud'),
    suggestUsers: (query) => request(`/inventories/users/suggest?q=${encodeURIComponent(query)}`),
  },

  items: {
    getByInventoryId: (inventoryId) => request(`/inventories/${inventoryId}/items`),
    create: (inventoryId, data) => request(`/inventories/${inventoryId}/items`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (inventoryId, itemId, data) => request(`/inventories/${inventoryId}/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (inventoryId, itemId) => request(`/inventories/${inventoryId}/items/${itemId}`, {
      method: 'DELETE',
    }),
    getLikes: (inventoryId, itemId) => request(`/inventories/${inventoryId}/items/${itemId}/likes`),
    toggleLike: (inventoryId, itemId) => request(`/inventories/${inventoryId}/items/${itemId}/likes`, {
      method: 'POST',
    }),
  },

  fields: {
    getByInventoryId: (inventoryId) => request(`/inventories/${inventoryId}/fields`),
    create: (inventoryId, data) => request(`/inventories/${inventoryId}/fields`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (inventoryId, fieldId, data) => request(`/inventories/${inventoryId}/fields/${fieldId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (inventoryId, fieldId) => request(`/inventories/${inventoryId}/fields/${fieldId}`, {
      method: 'DELETE',
    }),
  },

  access: {
    getByInventoryId: (inventoryId) => request(`/inventories/${inventoryId}/access`),
    update: (inventoryId, userIds) => request(`/inventories/${inventoryId}/access`, {
      method: 'PUT',
      body: JSON.stringify({ userIds }),
    }),
  },

  discussions: {
    getByInventoryId: (inventoryId) => request(`/inventories/${inventoryId}/discussions`),
    create: (inventoryId, text) => request(`/inventories/${inventoryId}/discussions`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),
  },

  users: {
    getById: (userId) => request(`/auth/users/${userId}`),
  },

  admin: {
    getUsers: () => request('/admin/users'),
    updateUser: (userId, data) => request(`/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    deleteUser: (userId) => request(`/admin/users/${userId}`, {
      method: 'DELETE',
    }),
  },
};
