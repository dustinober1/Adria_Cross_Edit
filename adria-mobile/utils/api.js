import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// Change this to your actual local IP when testing on a physical device, 
// or 10.0.2.2 for Android Emulator, or localhost for iOS simulator.
const BASE_URL = 'http://localhost:3000/api';

export const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Automatically attach the JWT token if available
apiClient.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor: Handle global errors like 401 Unauthorized
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Auto-logout the user if their token expires
            useAuthStore.getState().logout();
        }
        return Promise.reject(error);
    }
);
