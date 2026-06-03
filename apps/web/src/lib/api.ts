import axios from 'axios';

// Create axios instance with base URL from environment
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' && localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // Handle common errors
    if (error.response) {
      // Server responded with error status
      switch (error.response.status) {
        case 401:
          // Unauthorized - redirect to login
          if (typeof window !== 'undefined') {
            localStorage.removeItem('access_token');
            window.location.href = '/auth/login';
          }
          break;
        case 403:
          // Forbidden - show error
          return Promise.reject(new Error('Access denied'));
        case 404:
          // Not found
          return Promise.reject(new Error('Resource not found'));
        case 500:
          // Server error
          return Promise.reject(new Error('Server error. Please try again later.'));
        default:
          return Promise.reject(error);
      }
    } else if (error.request) {
      // Request made but no response
      return Promise.reject(new Error('Network error. Please check your connection.'));
    } else {
      // Error in setting up request
      return Promise.reject(new Error('Request setup error'));
    }
    return Promise.reject(error);
  }
);

// Helper functions for common API calls
export const api = {
  // Auth
  auth: {
    login: (credentials: { email: string; password: string }) =>
      apiClient.post('/auth/login', credentials),
    register: (userData: any) =>
      apiClient.post('/auth/register', userData),
    refresh: () => apiClient.post('/auth/refresh'),
    logout: () => apiClient.post('/auth/logout'),
    getProfile: () => apiClient.get('/auth/profile'),
    updateProfile: (data: any) => apiClient.put('/auth/profile', data),
  },

  // FPO
  fpo: {
    getAll: (params?: any) => apiClient.get('/fpo', { params }),
    getById: (id: string) => apiClient.get(`/fpo/${id}`),
    create: (data: any) => apiClient.post('/fpo', data),
    update: (id: string, data: any) => apiClient.patch(`/fpo/${id}`, data),
    delete: (id: string) => apiClient.delete(`/fpo/${id}`),
    verify: (id: string) => apiClient.put(`/fpo/${id}/verify`),
    getStats: (id: string) => apiClient.get(`/fpo/${id}/stats`),
    getNationalDashboard: () => apiClient.get('/fpo/national-dashboard'),
  },

  // Farmer
  farmer: {
    getAll: (params?: any) => apiClient.get('/farmers', { params }),
    getById: (id: string) => apiClient.get(`/farmers/${id}`),
    create: (data: any) => apiClient.post('/farmers', data),
    update: (id: string, data: any) => apiClient.patch(`/farmers/${id}`, data),
    delete: (id: string) => apiClient.delete(`/farmers/${id}`),
    bulkUpload: (file: File, fpoId: string) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fpoId', fpoId);
      return apiClient.post('/farmers/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    getCrops: (farmerId: string) => apiClient.get(`/farmers/${farmerId}/crops`),
    addCrop: (farmerId: string, data: any) =>
      apiClient.post(`/farmers/${farmerId}/crops`, data),
    getTransactions: (farmerId: string) =>
      apiClient.get(`/farmers/${farmerId}/transactions`),
    getStats: (farmerId: string) =>
      apiClient.get(`/farmers/${farmerId}/stats`),
  },

  // Buyer
  buyer: {
    getAll: (params?: any) => apiClient.get('/buyers', { params }),
    getById: (id: string) => apiClient.get(`/buyers/${id}`),
    create: (data: any) => apiClient.post('/buyers', data),
    update: (id: string, data: any) => apiClient.patch(`/buyers/${id}`, data),
    delete: (id: string) => apiClient.delete(`/buyers/${id}`),
  },

  // Demand
  demand: {
    getAll: (params?: any) => apiClient.get('/demands', { params }),
    getById: (id: string) => apiClient.get(`/demands/${id}`),
    create: (data: any) => apiClient.post('/demands', data),
    update: (id: string, data: any) => apiClient.patch(`/demands/${id}`, data),
    delete: (id: string) => apiClient.delete(`/demands/${id}`),
    getMatches: (id: string) => apiClient.get(`/demands/${id}/match`),
    getInquiries: (id: string) => apiClient.get(`/demands/${id}/inquiries`),
    getTrending: () => apiClient.get('/demands/trending'),
  },

  // Demand Matching
  demandMatching: {
    getMatches: (demandId: string, params?: any) =>
      apiClient.get(`/demand-matching/${demandId}/matches`, { params }),
    getSavedMatches: (demandId: string) =>
      apiClient.get(`/demand-matching/${demandId}/saved-matches`),
    saveMatches: (demandId: string, params?: any) =>
      apiClient.post(`/demand-matching/${demandId}/save-matches`, {}, { params }),
  },

  // Commodity
  commodity: {
    getAll: (params?: any) => apiClient.get('/commodities', { params }),
    getById: (id: string) => apiClient.get(`/commodities/${id}`),
    create: (data: any) => apiClient.post('/commodities', data),
    update: (id: string, data: any) => apiClient.patch(`/commodities/${id}`, data),
    delete: (id: string) => apiClient.delete(`/commodities/${id}`),
    getPriceTrends: (id: string) =>
      apiClient.get(`/commodities/${id}/price-trends`),
    getAvailability: (id: string) =>
      apiClient.get(`/commodities/${id}/availability`),
  },

  // Logistics
  logistics: {
    getAll: (params?: any) => apiClient.get('/logistics', { params }),
    getById: (id: string) => apiClient.get(`/logistics/${id}`),
    create: (data: any) => apiClient.post('/logistics', data),
    update: (id: string, data: any) => apiClient.patch(`/logistics/${id}`, data),
    delete: (id: string) => apiClient.delete(`/logistics/${id}`),
    getVehicles: (logisticsId: string) =>
      apiClient.get(`/logistics/${logisticsId}/vehicles`),
    addVehicle: (logisticsId: string, data: any) =>
      apiClient.post(`/logistics/${logisticsId}/vehicles`, data),
  },

  // Quote
  quote: {
    getAll: (params?: any) => apiClient.get('/quotes', { params }),
    getById: (id: string) => apiClient.get(`/quotes/${id}`),
    create: (data: any) => apiClient.post('/quotes', data),
    update: (id: string, data: any) => apiClient.patch(`/quotes/${id}`, data),
    delete: (id: string) => apiClient.delete(`/quotes/${id}`),
    accept: (id: string) => apiClient.post(`/quotes/${id}/accept`),
    reject: (id: string) => apiClient.post(`/quotes/${id}/reject`),
    track: (id: string) => apiClient.get(`/quotes/${id}/track`),
  },

  // Shipment
  shipment: {
    getAll: (params?: any) => apiClient.get('/shipments', { params }),
    getById: (id: string) => apiClient.get(`/shipments/${id}`),
    create: (data: any) => apiClient.post('/shipments', data),
    update: (id: string, data: any) => apiClient.patch(`/shipments/${id}`, data),
    delete: (id: string) => apiClient.delete(`/shipments/${id}`),
    confirmDelivery: (id: string) =>
      apiClient.post(`/shipments/${id}/delivery-confirm`),
    track: (id: string) => apiClient.get(`/shipments/${id}/track`),
  },

  // Transaction
  transaction: {
    getAll: (params?: any) => apiClient.get('/transactions', { params }),
    getById: (id: string) => apiClient.get(`/transactions/${id}`),
    create: (data: any) => apiClient.post('/transactions', data),
    update: (id: string, data: any) => apiClient.patch(`/transactions/${id}`, data),
    delete: (id: string) => apiClient.delete(`/transactions/${id}`),
    negotiate: (id: string, data: any) =>
      apiClient.post(`/transactions/${id}/negotiate`, data),
    agree: (id: string, data: any) =>
      apiClient.post(`/transactions/${id}/agree`, data),
    assignLogistics: (id: string, data: any) =>
      apiClient.post(`/transactions/${id}/logistics`, data),
    processPayment: (id: string, data: any) =>
      apiClient.post(`/transactions/${id}/payment`, data),
    getDocuments: (id: string) =>
      apiClient.get(`/transactions/${id}/documents`),
    complete: (id: string) =>
      apiClient.post(`/transactions/${id}/complete`),
    dispute: (id: string, reason: string) =>
      apiClient.post(`/transactions/${id}/dispute`, { reason }),
    getSummary: () => apiClient.get('/transactions/summary'),
    getTrends: (params?: any) =>
      apiClient.get('/transactions/trends', { params }),
  },

  // Agreement
  agreement: {
    getById: (id: string) => apiClient.get(`/agreements/${id}`),
    sign: (id: string) => apiClient.post(`/agreements/${id}/sign`),
    download: (id: string) =>
      apiClient.get(`/agreements/${id}/download`, {
        responseType: 'blob',
      }),
    amend: (id: string, data: any) =>
      apiClient.post(`/agreements/${id}/amend`, data),
    getTemplates: () => apiClient.get('/agreements/templates'),
  },

  // Analytics
  analytics: {
    getDashboard: (params?: any) =>
      apiClient.get('/analytics/dashboard', { params }),
    getFpoPerformance: (params?: any) =>
      apiClient.get('/analytics/fpo-performance', { params }),
    getCommodityTrends: (params?: any) =>
      apiClient.get('/analytics/commodity-trends', { params }),
    getBuyerDemand: (params?: any) =>
      apiClient.get('/analytics/buyer-demand', { params }),
    getTransactionVolume: (params?: any) =>
      apiClient.get('/analytics/transaction-volume', { params }),
    getGeographicDistribution: (params?: any) =>
      apiClient.get('/analytics/geographic-distribution', { params }),
    getMonthlySnapshot: (params?: any) =>
      apiClient.get('/analytics/monthly-snapshot', { params }),
  },

  // Notification
  notification: {
    getAll: (params?: any) =>
      apiClient.get('/notifications', { params }),
    markAsRead: (id: string) =>
      apiClient.put(`/notifications/${id}/read`),
    markAllAsRead: () =>
      apiClient.put('/notifications/read-all'),
    delete: (id: string) =>
      apiClient.delete(`/notifications/${id}`),
    getUnreadCount: () =>
      apiClient.get('/notifications/unread-count'),
    setPreferences: (prefs: any) =>
      apiClient.post('/notifications/preferences', prefs),
    getPreferences: () =>
      apiClient.get('/notifications/preferences'),
    sendTest: () => apiClient.post('/notifications/test'),
  },

  // Admin
  admin: {
    getUsers: (params?: any) =>
      apiClient.get('/admin/users', { params }),
    updateUserStatus: (id: string, status: boolean) =>
      apiClient.put(`/admin/users/${id}/status`, { status }),
    updateUserRole: (id: string, role: string) =>
      apiClient.put(`/admin/users/${id}/role`, { role }),
    getFpoVerificationQueue: () =>
      apiClient.get('/admin/fpo/verification-queue'),
    getBuyerVerificationQueue: () =>
      apiClient.get('/admin/buyer/verification-queue'),
    getLogisticsVerificationQueue: () =>
      apiClient.get('/admin/logistics/verification-queue'),
    verifyFpo: (id: string) =>
      apiClient.post(`/admin/fpo/${id}/verify`),
    verifyBuyer: (id: string) =>
      apiClient.post(`/admin/buyer/${id}/verify`),
    verifyLogistics: (id: string) =>
      apiClient.post(`/admin/logistics/${id}/verify`),
    getSystemStats: () =>
      apiClient.get('/admin/system/stats'),
    getAuditLogs: (params?: any) =>
      apiClient.get('/admin/audit-logs', { params }),
    getHealth: () =>
      apiClient.get('/admin/health'),
    toggleMaintenance: (enabled: boolean) =>
      apiClient.post('/admin/maintenance-mode', { enabled }),
    getSettings: () =>
      apiClient.get('/admin/settings'),
    updateSettings: (settings: any) =>
      apiClient.put('/admin/settings', settings),
  },
};

export default apiClient;