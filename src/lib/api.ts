import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Printer API functions
export const printerAPI = {
  // Get all printers with optional location filter
  getAll: (location?: string) => {
    const params = location ? { location } : {};
    return api.get('/printers', { params });
  },
  
  // Get current user's printers (for provider management)
  getMyPrinters: () => api.get('/printers/my-printers'),
  
  // Create new printer
  create: (printerData: any) => api.post('/printers', printerData),
  
  // Update printer
  update: (id: string, printerData: any) => api.put(`/printers/${id}`, printerData),
  
  // Delete printer
  delete: (id: string) => api.delete(`/printers/${id}`)
};

export default api;
