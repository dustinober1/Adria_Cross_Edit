import { create } from 'zustand';

export const useAuthStore = create((set) => ({
    user: null,
    token: null,
    isAuthenticated: false,

    // Action to log in user
    login: (userData, jwtToken) => set(() => ({
        user: userData,
        token: jwtToken,
        isAuthenticated: true,
    })),

    // Action to log out user
    logout: () => set(() => ({
        user: null,
        token: null,
        isAuthenticated: false,
    })),
}));
