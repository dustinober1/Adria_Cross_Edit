// Frontend Authentication Handler

const Auth = {
    state: {
        isAuthenticated: false,
        user: null,
        loading: true
    },

    init: async function() {
        await this.checkStatus();
        this.updateUI();
        this.setupListeners();
    },

    checkStatus: async function() {
        try {
            const response = await fetch('/api/auth/status');
            const data = await response.json();
            
            this.state.isAuthenticated = data.authenticated;
            this.state.user = data.user;
            this.state.loading = false;
            
            return this.state;
        } catch (error) {
            console.error('Auth check failed:', error);
            this.state.loading = false;
            return this.state;
        }
    },

    updateUI: function() {
        const body = document.body;
        const authLinks = document.querySelectorAll('.auth-link'); // Login/Logout nav items
        const userDisplays = document.querySelectorAll('.auth-user-display'); // "Hi, Adria"
        const loginSections = document.querySelectorAll('.login-required-section');
        const adminElements = document.querySelectorAll('.admin-only');

        if (this.state.isAuthenticated) {
            body.classList.add('is-authenticated');
            body.classList.remove('not-authenticated');

            // Update user display
            userDisplays.forEach(el => {
                const name = this.state.user.displayName || this.state.user.username || 'Client';
                el.innerHTML = `<a href="/member-portal.html" style="text-decoration:none; color:inherit;">Hi, ${name.split(' ')[0]}</a>`;
                el.style.display = 'block';
            });

            // Update Auth Links (Change Login to Logout)
            authLinks.forEach(link => {
                if (link.dataset.type === 'login') {
                    link.textContent = 'Logout';
                    link.href = '#logout';
                    link.dataset.action = 'logout';
                }
            });
            
            // Show content requiring login
            loginSections.forEach(el => el.style.display = 'none'); // Hide "Please login" msg
            
            // Admin checks
            if (this.state.user.role === 'admin') {
                adminElements.forEach(el => el.style.display = 'block');
            }

        } else {
            body.classList.remove('is-authenticated');
            body.classList.add('not-authenticated');

            userDisplays.forEach(el => el.style.display = 'none');

            // Reset Auth Links
            authLinks.forEach(link => {
                if (link.dataset.action === 'logout') {
                    link.textContent = 'Login';
                    link.href = '/admin.html'; // Or modal trigger
                    link.dataset.type = 'login';
                    delete link.dataset.action;
                }
            });
            
             // Show login prompts
            loginSections.forEach(el => el.style.display = 'block');
            adminElements.forEach(el => el.style.display = 'none');
        }
    },

    setupListeners: function() {
        document.addEventListener('click', async (e) => {
            if (e.target.matches('[data-action="logout"]') || e.target.closest('[data-action="logout"]')) {
                e.preventDefault();
                await this.logout();
            }
        });

        // Check for login query param (e.g. /?login=failed)
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('login') === 'failed') {
            this.showToast('Login failed. Please try again.', 'error');
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
        } else if (urlParams.get('login') === 'required') {
            this.showToast('Please log in to access that page.', 'info');
        }
    },

    logout: async function() {
        try {
            const response = await fetch('/routes/auth/logout', { method: 'POST' }); 
            // Try standard route first, if 404 try api route (handling different router setups)
            if (!response.ok) {
                 await fetch('/api/auth/logout', { method: 'POST' });
            }
            
            window.location.reload();
        } catch (error) {
            console.error('Logout failed:', error);
            // Force reload anyway to clear client state if possible
            window.location.reload();
        }
    },

    showToast: function(message, type = 'info') {
        // Simple toast implementation or use existing if avail
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.right = '20px';
        toast.style.padding = '12px 24px';
        toast.style.background = type === 'error' ? '#ef4444' : '#333';
        toast.style.color = 'white';
        toast.style.borderRadius = '8px';
        toast.style.zIndex = '9999';
        toast.textContent = message;
        
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    Auth.init();
});
