const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:9000/api/v1';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  statusCode?: number;
}

// Flag to prevent multiple simultaneous refresh requests
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve();
    }
  });
  failedQueue = [];
};

export const apiCall = async <T>(
  endpoint: string,
  options: RequestInit & { skipRedirect?: boolean; _retry?: boolean } = {}
): Promise<ApiResponse<T>> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include', // Send cookies with every request
  });

  // Handle 401 Unauthorized - try to refresh token
  if (response.status === 401 && !options._retry && !endpoint.includes('/auth/')) {
    if (isRefreshing) {
      // Wait for the current refresh to complete
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => {
        // Retry the original request
        return apiCall<T>(endpoint, { ...options, _retry: true });
      });
    }

    isRefreshing = true;

    try {
      // Attempt to refresh the token
      const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (refreshResponse.ok) {
        // Token refreshed successfully
        processQueue();
        isRefreshing = false;

        // Retry the original request with new token
        return apiCall<T>(endpoint, { ...options, _retry: true });
      } else {
        // Refresh failed - both tokens expired
        processQueue(new Error('Session expired'));
        isRefreshing = false;

        if (!options.skipRedirect) {
          // Clear any user state and redirect to login
          localStorage.removeItem('user');
          window.location.href = '/login';
        }

        throw new Error('Session expired. Please log in again.');
      }
    } catch (error) {
      processQueue(error);
      isRefreshing = false;

      if (!options.skipRedirect) {
        localStorage.removeItem('user');
        window.location.href = '/login';
      }

      throw error;
    }
  }

  // Handle other errors
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || `API Error: ${response.statusText}`);
  }

  return response.json();
};

// Auth APIs
export const authApi = {
  login: (email: string, password: string) =>
    apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      skipRedirect: true,
    }),

  register: (data: any) =>
    apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
      skipRedirect: true,
    }),


  logout: (refreshToken?: string) =>
    apiCall('/auth/logout', {
      method: 'POST',
      body: refreshToken ? JSON.stringify({ refreshToken }) : undefined,
    }),

  refreshToken: (refreshToken?: string) =>
    apiCall('/auth/refresh-token', {
      method: 'POST',
      body: refreshToken ? JSON.stringify({ refreshToken }) : undefined,
    }),
};

// User APIs
export const userApi = {
  getProfile: () => apiCall('/users/profile', { skipRedirect: true }),

  updateProfile: (data: any) =>
    apiCall('/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  getAll: () => apiCall('/users'),

  getDonors: () => apiCall('/users/donors'),
};

// Requests APIs
export const requestApi = {
  create: (data: any) =>
    apiCall('/requests', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getAll: () => apiCall('/requests'),

  getMyRequests: () => apiCall('/requests/my-requests'),

  getById: (id: string) => apiCall(`/requests/${id}`),

  getMapData: () => apiCall('/requests/map-data'),
};

// Donations APIs
export const donationApi = {
  accept: (requestId: string) =>
    apiCall('/donations/accept', {
      method: 'POST',
      body: JSON.stringify({ requestId }),
    }),

  getAll: () => apiCall('/donations'),

  getById: (id: string) => apiCall(`/donations/${id}`),
};

// Admin APIs
export const adminApi = {
  getStats: () => apiCall('/admin/stats'),
};
