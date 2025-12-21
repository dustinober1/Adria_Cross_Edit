/**
 * Adria Cross - Main JavaScript
 * Centralized script for all common functionality
 */

(function () {
    'use strict';

    // ============================================
    // Mobile Navigation Toggle
    // ============================================
    const initMobileNav = () => {
        const navToggle = document.getElementById('navToggle');
        const navMenu = document.getElementById('navMenu');
        const navLinks = document.querySelectorAll('#navMenu a');

        if (!navToggle || !navMenu) return;

        navToggle.addEventListener('click', () => {
            const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
            navToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
            navToggle.setAttribute('aria-expanded', !isExpanded);
        });

        // Close menu when a link is clicked
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
                navToggle.setAttribute('aria-expanded', 'false');
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.top-nav')) {
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
                navToggle.setAttribute('aria-expanded', 'false');
            }
        });

        // Keyboard navigation - close on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navMenu.classList.contains('active')) {
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
                navToggle.setAttribute('aria-expanded', 'false');
                navToggle.focus();
            }
        });
    };

    // ============================================
    // Dark Mode Toggle
    // ============================================
    const initDarkMode = () => {
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (!darkModeToggle) return;

        const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
        const currentTheme = localStorage.getItem('theme');

        // Apply initial theme
        if (currentTheme === 'dark' || (!currentTheme && prefersDarkScheme.matches)) {
            document.body.classList.add('dark-mode');
            darkModeToggle.textContent = '☀️';
            darkModeToggle.setAttribute('aria-label', 'Switch to light mode');
        } else {
            darkModeToggle.setAttribute('aria-label', 'Switch to dark mode');
        }

        darkModeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            darkModeToggle.textContent = isDark ? '☀️' : '🌙';
            darkModeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        });

        // Listen for system theme changes
        prefersDarkScheme.addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                if (e.matches) {
                    document.body.classList.add('dark-mode');
                    darkModeToggle.textContent = '☀️';
                } else {
                    document.body.classList.remove('dark-mode');
                    darkModeToggle.textContent = '🌙';
                }
            }
        });
    };

    // ============================================
    // FAQ Accordion
    // ============================================
    const initFaqAccordion = () => {
        const faqQuestions = document.querySelectorAll('.faq-question');
        if (faqQuestions.length === 0) return;

        faqQuestions.forEach(question => {
            question.addEventListener('click', () => {
                const answer = question.nextElementSibling;
                const toggle = question.querySelector('.faq-toggle');

                if (answer.classList.contains('show')) {
                    answer.classList.remove('show');
                    if (toggle) toggle.textContent = '+';
                    question.setAttribute('aria-expanded', 'false');
                } else {
                    // Close other open FAQ items
                    document.querySelectorAll('.faq-answer.show').forEach(item => {
                        item.classList.remove('show');
                    });
                    document.querySelectorAll('.faq-toggle').forEach(t => {
                        t.textContent = '+';
                    });
                    document.querySelectorAll('.faq-question').forEach(q => {
                        q.setAttribute('aria-expanded', 'false');
                    });

                    answer.classList.add('show');
                    if (toggle) toggle.textContent = '−';
                    question.setAttribute('aria-expanded', 'true');
                }
            });

            // Keyboard support
            question.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    question.click();
                }
            });
        });
    };

    // ============================================
    // Global Validation Helpers
    // ============================================
    window.validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // ============================================
    // Newsletter Form Handling
    // ============================================
    const initNewsletterForm = () => {
        const form = document.querySelector('.newsletter-form');
        if (!form) return;

        const emailInput = form.querySelector('input[type="email"]');
        const submitBtn = form.querySelector('button[type="submit"]');

        // Real-time validation
        emailInput.addEventListener('input', () => {
            if (emailInput.value && !window.validateEmail(emailInput.value)) {
                emailInput.style.borderColor = '#dc3545';
            } else {
                emailInput.style.borderColor = '';
            }
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = emailInput.value;

            if (!window.validateEmail(email)) {
                showNotification('Please enter a valid email address.', 'error');
                emailInput.focus();
                return;
            }

            // Disable form during submission
            submitBtn.disabled = true;
            submitBtn.textContent = 'Subscribing...';

            try {
                // Simulate API call - replace with actual newsletter service integration
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Show success message
                showNotification('Thank you for subscribing! Check your inbox for a welcome email.', 'success');
                form.reset();
            } catch (error) {
                showNotification('Subscription failed. Please try again.', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Subscribe';
            }
        });
    };

    // ============================================
    // Notification System
    // ============================================
    const showNotification = (message, type = 'info') => {
        // Remove existing notifications
        const existingNotification = document.querySelector('.site-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = `site-notification site-notification--${type}`;
        notification.setAttribute('role', 'alert');
        notification.setAttribute('aria-live', 'polite');
        notification.innerHTML = `
            <span>${message}</span>
            <button class="notification-close" aria-label="Close notification">&times;</button>
        `;

        document.body.appendChild(notification);

        // Add close functionality
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        });

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.classList.add('fade-out');
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);

        // Trigger entrance animation
        requestAnimationFrame(() => {
            notification.classList.add('visible');
        });
    };

    // ============================================
    // Form Toggle (Intake Forms)
    // ============================================
    const initFormToggle = () => {
        const toggleBtns = document.querySelectorAll('.form-toggle-btn');
        if (toggleBtns.length === 0) return;

        toggleBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const target = btn.getAttribute('data-target');
                const formWrapper = document.getElementById(target);

                if (formWrapper) {
                    // Hide all form wrappers
                    document.querySelectorAll('.form-wrapper').forEach(wrapper => {
                        wrapper.style.display = 'none';
                    });

                    // Deactivate all toggle buttons
                    toggleBtns.forEach(b => b.classList.remove('active'));

                    // Show target and activate button
                    formWrapper.style.display = 'block';
                    btn.classList.add('active');
                }
            });
        });
    };

    // ============================================
    // Smooth Scroll for Anchor Links
    // ============================================
    const initSmoothScroll = () => {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const href = this.getAttribute('href');
                if (href === '#') return;

                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                    // Set focus to target for accessibility
                    target.setAttribute('tabindex', '-1');
                    target.focus();
                }
            });
        });
    };

    // ============================================
    // Lazy Loading for Instagram Iframes with Fallback
    // ============================================
    const initLazyInstagram = () => {
        const instagramPosts = document.querySelectorAll('.instagram-post');
        if (instagramPosts.length === 0) return;

        // Add fallback for each Instagram post
        instagramPosts.forEach(post => {
            const iframe = post.querySelector('iframe');
            if (!iframe) return;

            // Set a timeout for iframe load
            const loadTimeout = setTimeout(() => {
                // If iframe hasn't loaded properly, show fallback
                if (!iframe.contentWindow || iframe.offsetHeight < 100) {
                    showInstagramFallback(post);
                }
            }, 8000);

            // Clear timeout on successful load
            iframe.addEventListener('load', () => {
                clearTimeout(loadTimeout);
            });

            // Handle iframe error
            iframe.addEventListener('error', () => {
                clearTimeout(loadTimeout);
                showInstagramFallback(post);
            });
        });

        // Handle data-src lazy loading
        const lazyIframes = document.querySelectorAll('.instagram-post iframe[data-src]');
        if (lazyIframes.length === 0) return;

        const loadInstagram = (entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const iframe = entry.target;
                    iframe.src = iframe.dataset.src;
                    iframe.removeAttribute('data-src');
                    observer.unobserve(iframe);
                }
            });
        };

        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver(loadInstagram, {
                rootMargin: '100px',
                threshold: 0.1
            });

            lazyIframes.forEach(post => observer.observe(post));
        } else {
            // Fallback for older browsers
            lazyIframes.forEach(post => {
                post.src = post.dataset.src;
                post.removeAttribute('data-src');
            });
        }
    };

    // Instagram fallback display
    const showInstagramFallback = (postElement) => {
        postElement.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; 
                        height: 100%; min-height: 280px; background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%); 
                        border-radius: 8px; padding: 1.5rem; text-align: center;">
                <span style="font-size: 2.5rem; margin-bottom: 0.5rem;">📸</span>
                <p style="color: #666; margin-bottom: 1rem; font-size: 0.9rem;">Instagram content couldn't load</p>
                <a href="https://www.instagram.com/adriacrossedit/" target="_blank" rel="noopener noreferrer"
                   style="background: linear-gradient(135deg, #d4a574 0%, #c19a5d 100%); color: white; 
                          padding: 0.6rem 1.2rem; border-radius: 20px; text-decoration: none; font-weight: 600;
                          font-size: 0.85rem; transition: transform 0.2s;">
                    View on Instagram
                </a>
            </div>
        `;
    };

    // ============================================
    // Google Forms Loading States
    // ============================================
    const initFormLoadingStates = () => {
        const formIframes = document.querySelectorAll('iframe[src*="docs.google.com/forms"]');
        if (formIframes.length === 0) return;

        formIframes.forEach(iframe => {
            const wrapper = iframe.parentElement;

            // Add loading state
            const loadingIndicator = document.createElement('div');
            loadingIndicator.className = 'form-loading';
            loadingIndicator.innerHTML = '<div class="loading-spinner"></div><span>Loading form...</span>';
            loadingIndicator.setAttribute('aria-live', 'polite');
            wrapper.insertBefore(loadingIndicator, iframe);

            // Handle successful load
            iframe.addEventListener('load', () => {
                loadingIndicator.remove();
                iframe.style.opacity = '1';
            });

            // Handle load timeout/error
            const timeout = setTimeout(() => {
                if (loadingIndicator.parentNode) {
                    loadingIndicator.innerHTML = `
                        <div class="form-error">
                            <p>The form is taking longer than expected to load.</p>
                            <button onclick="location.reload()" class="btn-cta btn-secondary-cta">Refresh Page</button>
                        </div>
                    `;
                }
            }, 15000);

            iframe.addEventListener('load', () => clearTimeout(timeout));
        });
    };

    // ============================================
    // Initialize All Modules
    // ============================================
    const init = () => {
        initMobileNav();
        initDarkMode();
        initFaqAccordion();
        initNewsletterForm();
        initFormToggle();
        initSmoothScroll();
        initLazyInstagram();
        initFormLoadingStates();
    };

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Export showNotification for external use
    window.showNotification = showNotification;

    // ============================================
    // Search Functionality
    // ============================================
    const initSearch = () => {
        // 1. Inject Search Modal
        const searchModalHTML = `
            <div id="searchModal" class="search-modal" role="dialog" aria-modal="true" aria-label="Search">
                <div class="search-container">
                    <div class="search-header">
                        <h3>Search Adria Cross</h3>
                        <button id="closeSearch" class="close-search" aria-label="Close search">&times;</button>
                    </div>
                    <div class="search-input-wrapper">
                        <span class="search-icon-input">🔍</span>
                        <input type="text" id="searchInput" class="search-input" placeholder="What are you looking for..." aria-label="Search site content">
                    </div>
                    <div id="searchResults" class="search-results">
                        <!-- Results will appear here -->
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', searchModalHTML);

        const modal = document.getElementById('searchModal');
        const input = document.getElementById('searchInput');
        const resultsContainer = document.getElementById('searchResults');
        const closeBtn = document.getElementById('closeSearch');
        let searchIndex = [];

        // 2. Fetch Index
        const loadSearchIndex = async () => {
            if (searchIndex.length > 0) return;
            try {
                const response = await fetch('/search.json');
                searchIndex = await response.json();
            } catch (err) {
                console.error('Failed to load search index', err);
            }
        };

        // 3. Search Logic
        const performSearch = (query) => {
            if (!query) {
                resultsContainer.innerHTML = '';
                return;
            }

            const lowerQuery = query.toLowerCase();
            const results = searchIndex.filter(item => {
                return item.title.toLowerCase().includes(lowerQuery) ||
                    item.keywords.toLowerCase().includes(lowerQuery) ||
                    item.summary.toLowerCase().includes(lowerQuery);
            });

            if (results.length === 0) {
                resultsContainer.innerHTML = `<p style="text-align:center; color:#888;">No results found for "${query}"</p>`;
            } else {
                resultsContainer.innerHTML = results.map(item => `
                    <a href="${item.url}" class="search-result-item">
                        <span class="search-result-title">
                            <span class="search-result-category">${item.category}</span>
                            ${item.title}
                        </span>
                        <span class="search-result-summary">${item.summary}</span>
                    </a>
                `).join('');
            }
        };

        // 4. Event Listeners
        document.addEventListener('click', (e) => {
            // Open Search
            if (e.target.closest('.search-trigger')) {
                e.preventDefault();
                loadSearchIndex(); // Load data only when needed
                modal.classList.add('active');
                input.focus();
                document.body.style.overflow = 'hidden'; // Prevent scrolling
            }

            // Close Search (Button or Overlay)
            if (e.target === modal || e.target.closest('#closeSearch')) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });

        // Close on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });

        // Type to Search
        input.addEventListener('input', (e) => {
            performSearch(e.target.value);
        });
    };

    // Initialize Search
    initSearch();

    // ============================================
    // Service Worker Registration
    // ============================================
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then((registration) => {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                }, (err) => {
                    console.log('ServiceWorker registration failed: ', err);
                });
        });
    }

    // ============================================
    // PWA Install Tracking
    // ============================================
    window.addEventListener('appinstalled', () => {
        console.log('PWA was installed');
        if (typeof gtag === 'function') {
            gtag('event', 'pwa_install', {
                'event_category': 'pwa',
                'event_label': 'install',
                'value': 0
            });
        }
    });

})();
