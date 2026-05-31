import { AUTH_TOKEN_KEY, MVC_API_BASE_URL } from '../config/env.js';

async function request(path, options = {}) {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const headers = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${MVC_API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || 'Request failed');
  }

  return payload.data ?? payload;
}

async function downloadFile(path, filename) {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const response = await fetch(`${MVC_API_BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message || 'Download failed');
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export const mvcApi = {
  register(body) {
    return request('/auth/register', { method: 'POST', body: JSON.stringify(body) });
  },
  login(body) {
    return request('/auth/login', { method: 'POST', body: JSON.stringify(body) });
  },
  me() {
    return request('/auth/me');
  },
  updateProfile(body) {
    return request('/users/me', { method: 'PUT', body: JSON.stringify(body) });
  },
  dashboardOverview() {
    return request('/dashboard/overview');
  },
  nearestClinics(limit = 5) {
    return request(`/clinics/nearest?limit=${limit}`);
  },
  createScan(notes = null) {
    return request('/scans', {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  },
  uploadScanImages(scanId, files) {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    return request(`/scans/${scanId}/images`, {
      method: 'POST',
      body: formData,
    });
  },
  listScans(page = 1, pageSize = 20) {
    return request(`/scans?page=${page}&page_size=${pageSize}`);
  },
  getScan(scanId) {
    return request(`/scans/${scanId}`);
  },
  deleteScan(scanId) {
    return request(`/scans/${scanId}`, { method: 'DELETE' });
  },
  downloadScanReport(scanId) {
    return downloadFile(`/scans/${scanId}/report`, `dermascan-report-${scanId}.pdf`);
  },
  listAdminUsers(page = 1, pageSize = 20) {
    return request(`/admin/users?page=${page}&page_size=${pageSize}`);
  },
  getAdminUser(userId, scanPage = 1, scanPageSize = 20) {
    return request(`/admin/users/${userId}?scan_page=${scanPage}&scan_page_size=${scanPageSize}`);
  },
  downloadAdminUserScanReport(userId, scanId) {
    return downloadFile(
      `/admin/users/${userId}/scans/${scanId}/report`,
      `dermascan-report-${scanId}.pdf`,
    );
  },
  listAdminClinics(page = 1, pageSize = 20) {
    return request(`/admin/clinics?page=${page}&page_size=${pageSize}`);
  },
  getAdminClinic(clinicId) {
    return request(`/admin/clinics/${clinicId}`);
  },
  createClinic(body) {
    return request('/admin/clinics', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  updateClinic(clinicId, body) {
    return request(`/admin/clinics/${clinicId}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },
  deleteClinic(clinicId) {
    return request(`/admin/clinics/${clinicId}`, { method: 'DELETE' });
  },
};

export function scanImageUrl(imageUrl) {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('http')) return imageUrl;
  return imageUrl;
}

export function riskBadgeClass(riskLevel) {
  if (!riskLevel) return 'secondary';
  const value = riskLevel.toLowerCase();
  if (value.includes('high')) return 'danger';
  if (value.includes('moderate')) return 'warning';
  return 'success';
}
