/**
 * Clothing Matcher - Main Application Logic
 * Clueless-inspired clothing matching system
 */

(function () {
    'use strict';

    // Debug logging
    console.log('Matcher script starting to load...');
    console.log('Current timestamp:', new Date().toISOString());

    // ============================================
    // Application State
    // ============================================
    let appState = {
        currentView: 'upload', // upload, wardrobe, matcher
        userItems: [],
        categories: [],
        currentMatch: null,
        matchHistory: [],
        isClient: false,
        sessionId: null,
        currentCategory: null,
        limits: {}
    };

    // ============================================
    // DOM Elements
    // ============================================
    const elements = {
        uploadView: null,
        wardrobeView: null,
        matcherView: null,
        limitsDisplay: null,
        verificationSection: null
    };

    // ============================================
    // API Functions
    // ============================================
    const api = {
        async request(endpoint, options = {}) {
            try {
                const url = `/api${endpoint}`;

                const response = await fetch(url, {
                    method: options.method || 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        ...options.headers
                    },
                    body: options.body ? JSON.stringify(options.body) : undefined
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                return await response.json();
            } catch (error) {
                console.error('API request failed:', error);
                throw error;
            }
        },

        async uploadImage(file, categoryId, tags) {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('category_id', categoryId);

            // Add tags to form data
            Object.keys(tags).forEach(key => {
                if (tags[key]) {
                    formData.append(key, tags[key]);
                }
            });

            const response = await fetch('/api/clothing/upload', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Upload failed');
            }

            return await response.json();
        },

        async getItems(categoryId = null) {
            const endpoint = categoryId ? `/clothing/?category_id=${categoryId}` : '/clothing/';
            return await this.request(endpoint);
        },

        async getCategories() {
            return await this.request('/clothing/categories');
        },

        async getLimits() {
            return await this.request('/clothing/check-limit');
        },

        async getMatch(excludeId = null) {
            const endpoint = excludeId ? `/matches/?exclude_id=${excludeId}` : '/matches/';
            return await this.request(endpoint);
        },

        async deleteItem(itemId) {
            return await this.request(`/clothing/${itemId}`, { method: 'DELETE' });
        },

        async requestVerification(email) {
            return await this.request('/clothing/request-verification', {
                method: 'POST',
                body: { email }
            });
        },

        async verifyClient(email, code) {
            return await this.request('/clothing/verify-client', {
                method: 'POST',
                body: { email, verification_code: code }
            });
        }
    };

    // ============================================
    // Utility Functions
    // ============================================
    const utils = {
        showNotification(message, type = 'info') {
            // Remove existing notifications
            const existing = document.querySelector('.matcher-notification');
            if (existing) existing.remove();

            const notification = document.createElement('div');
            notification.className = `matcher-notification notification-${type} fade-in`;
            notification.innerHTML = `
                <div class="notification-content">
                    <p>${message}</p>
                </div>
            `;

            document.body.appendChild(notification);

            // Show notification
            setTimeout(() => notification.classList.add('show'), 100);

            // Auto-hide after 4 seconds
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }, 4000);
        },

        formatLimitCount(count, limit) {
            if (limit === 'unlimited') {
                return '<span style="color: #28a745;">✓ Unlimited</span>';
            }
            const percentage = (count / limit) * 100;
            let className = '';
            if (percentage >= 100) className = 'maxed';
            else if (percentage >= 75) className = 'warning';

            return `<span class="limit-count ${className}">${count}/${limit}</span>`;
        },

        getMatchScoreDisplay(score) {
            if (score >= 80) return { text: 'Excellent Match!', color: '#28a745' };
            if (score >= 60) return { text: 'Good Match', color: '#ffc107' };
            if (score >= 40) return { text: 'Fair Match', color: '#fd7e14' };
            return { text: 'Poor Match', color: '#dc3545' };
        },

        debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }
    };

    // ============================================
    // State Management
    // ============================================
    const state = {
        async loadUserState() {
            try {
                const limits = await api.getLimits();
                appState.isClient = limits.isClient;
                appState.limits = limits.limits;

                const items = await api.getItems();
                appState.userItems = items.items;

                const categories = await api.getCategories();
                appState.categories = categories.categories;

                // Auto-navigate to upload if wardrobe is empty
                if (appState.userItems.length === 0) {
                    utils.showNotification('Welcome! Let\'s start by uploading some items to your wardrobe.', 'info');
                    views.show('upload');
                } else {
                    // Show wardrobe by default if items exist
                    views.show('wardrobe');
                }
            } catch (error) {
                console.error('Initial load failed:', error);
                utils.showNotification('Welcome! Head to the Upload tab to add items to your wardrobe.', 'info');

                // Hide loading so they can see the UI
                const initialLoading = document.getElementById('initialLoading');
                if (initialLoading) initialLoading.style.display = 'none';

                // Switch to upload view by default if data fails (often means it's empty)
                views.show('upload');
            }
        },

        async refreshItems() {
            try {
                const items = await api.getItems();
                appState.userItems = items.items;
                views.updateWardrobe();

                // If items were deleted and now empty, redirect to upload
                if (appState.userItems.length === 0 && appState.currentView !== 'upload') {
                    views.show('upload');
                }
            } catch (error) {
                utils.showNotification('Failed to refresh items', 'error');
            }
        }
    };

    // ============================================
    // View Management
    // ============================================
    const views = {
        show(viewName) {
            // Cache elements if they aren't already
            const uploadView = document.getElementById('uploadView');
            const wardrobeView = document.getElementById('wardrobeView');
            const matcherView = document.getElementById('matcherView');

            // Hide only the main views
            const viewElements = [uploadView, wardrobeView, matcherView];
            viewElements.forEach(el => {
                if (el) el.style.display = 'none';
            });

            // Update nav tabs
            const tabs = document.querySelectorAll('.nav-tab');
            tabs.forEach(tab => tab.classList.remove('active'));

            // Show selected view and activate tab
            const activeTab = document.querySelector(`[data-view="${viewName}"]`);
            if (activeTab) activeTab.classList.add('active');

            switch (viewName) {
                case 'upload':
                    if (uploadView) uploadView.style.display = 'block';
                    break;
                case 'wardrobe':
                    if (wardrobeView) {
                        wardrobeView.style.display = 'block';
                        this.updateWardrobe();
                    }
                    break;
                case 'matcher':
                    if (matcherView) {
                        matcherView.style.display = 'block';
                        this.startMatching();
                    }
                    break;
            }

            appState.currentView = viewName;
        },

        async updateWardrobe() {
            const grid = elements.wardrobeView?.querySelector('.wardrobe-grid');
            if (!grid) return;

            if (appState.userItems.length === 0) {
                grid.innerHTML = `
                    <div class="empty-state" style="text-align: center; padding: 3rem; color: var(--text-light);">
                        <p style="font-size: 1.2rem; margin-bottom: 1rem;">👗</p>
                        <p>Your wardrobe is empty. Upload some clothing items to get started!</p>
                        <button class="btn btn-primary" onclick="app.views.show('upload')" style="margin-top: 1rem;">
                            Upload Items
                        </button>
                    </div>
                `;
                return;
            }

            grid.innerHTML = appState.userItems.map(item => `
                <div class="wardrobe-item fade-in" data-id="${item.id}">
                    <img src="/uploads/${item.image_path}" alt="${item.category_name}" class="wardrobe-image">
                    <div class="wardrobe-info">
                        <div class="wardrobe-category">${item.category_name}</div>
                        ${item.brand ? `<div class="wardrobe-brand">${item.brand}</div>` : ''}
                        <div class="wardrobe-tags">
                            ${item.color_tags?.map(tag => `<span class="wardrobe-tag">${tag}</span>`).join('')}
                            ${item.style_tags?.map(tag => `<span class="wardrobe-tag">${tag}</span>`).join('')}
                        </div>
                    </div>
                    <button class="wardrobe-delete" onclick="app.actions.deleteItem(${item.id})" title="Delete item">
                        ×
                    </button>
                </div>
            `).join('');
        },

        async updateLimits() {
            const limitsGrid = elements.limitsDisplay?.querySelector('.limits-grid');
            if (!limitsGrid) return;

            limitsGrid.innerHTML = Object.entries(appState.limits).map(([category, limit]) => `
                <div class="limit-item">
                    <div class="limit-category">${category}</div>
                    <div class="limit-count">
                        ${utils.formatLimitCount(limit.used, limit.limit)}
                    </div>
                </div>
            `).join('');
        },

        async startMatching() {
            const matchContainer = elements.matcherView?.querySelector('.match-container');
            const controlsContainer = elements.matcherView?.querySelector('.match-controls');

            if (!matchContainer || !controlsContainer) return;

            if (appState.userItems.length < 2) {
                matchContainer.innerHTML = `
                    <div style="text-align: center; padding: 3rem;">
                        <p style="font-size: 1.2rem; margin-bottom: 1rem;">👗</p>
                        <p>You need at least 2 items to start matching!</p>
                        <button class="btn btn-primary" onclick="app.views.show('upload')" style="margin-top: 1rem;">
                            Upload More Items
                        </button>
                    </div>
                `;
                controlsContainer.innerHTML = '';
                return;
            }

            this.loadNextMatch();
        },

        async loadNextMatch() {
            const matchContainer = elements.matcherView?.querySelector('.match-container');
            const scoreDisplay = elements.matcherView?.querySelector('.match-score');

            if (!matchContainer) return;

            // Show loading
            matchContainer.innerHTML = `
                <div class="loading">
                    <div class="loading-spinner"></div>
                    <span class="loading-text">Creating your perfect outfit...</span>
                </div>
            `;

            try {
                // Generate outfit combinations from user's items instead of API call
                const outfitData = this.generateOutfitCombination();

                if (!outfitData.outfit || outfitData.outfit.items.length === 0) {
                    matchContainer.innerHTML = `
                        <div style="text-align: center; padding: 2rem;">
                            <p style="font-size: 1.1rem; margin-bottom: 1rem;">😊</p>
                            <p>Couldn't create an outfit. Try adding more items!</p>
                        </div>
                    `;
                    scoreDisplay.innerHTML = '';
                    return;
                }

                appState.currentMatch = outfitData;
                this.displayMatch(outfitData);

            } catch (error) {
                matchContainer.innerHTML = `
                    <div style="text-align: center; padding: 2rem; color: var(--text-light);">
                        <p>Failed to load match. Please try again.</p>
                        <button class="btn btn-secondary" onclick="app.views.startMatching()" style="margin-top: 1rem;">
                            Try Again
                        </button>
                    </div>
                `;
            }
        },

        displayMatch(matchData) {
            const matchContainer = elements.matcherView?.querySelector('.match-container');
            const scoreDisplay = elements.matcherView?.querySelector('.match-score');

            if (!matchContainer) return;

            const { outfit, score } = matchData;
            const scoreInfo = utils.getMatchScoreDisplay(score);

            // Create outfit preview showing multiple items
            matchContainer.innerHTML = `
                <div class="outfit-card fade-in">
                    <div class="outfit-header">
                        <h3>Today's Outfit 💕</h3>
                        <p>Perfect match for your style!</p>
                    </div>
                    <div class="outfit-items">
                        ${outfit.items.map(item => `
                            <div class="outfit-item">
                                <img src="/uploads/${item.image_path}" alt="${item.category_name}" class="outfit-item-image">
                                <div class="outfit-item-label">${item.category_name}</div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="outfit-details">
                        <div class="match-score">
                            Match Score: <span class="match-score-value" style="color: ${scoreInfo.color}">${score}%</span>
                            <div style="color: ${scoreInfo.color}; font-weight: 600;">${scoreInfo.text}</div>
                        </div>
                        ${outfit.occasion ? `<div class="outfit-occasion">Perfect for: ${outfit.occasion}</div>` : ''}
                    </div>
                </div>
            `;

            if (scoreDisplay) {
                scoreDisplay.innerHTML = `
                    <div class="match-summary">
                        <div class="match-score-large">${score}% Match</div>
                        <div class="match-label">${scoreInfo.text}</div>
                    </div>
                `;
            }

            // Add swipe functionality to the outfit card
            this.addSwipeFunctionality(matchContainer.querySelector('.outfit-card'));
        },

        generateOutfitCombination() {
            // Group items by category
            const itemsByCategory = {
                tops: [],
                bottoms: [],
                shoes: [],
                accessories: []
            };

            appState.userItems.forEach(item => {
                const categoryName = item.category_name.toLowerCase();
                if (itemsByCategory[categoryName]) {
                    itemsByCategory[categoryName].push(item);
                }
            });

            // Select random items for each category
            const selectedItems = [];
            let score = 0;

            // Always include at least a top or bottom
            if (itemsByCategory.tops.length > 0) {
                const randomTop = itemsByCategory.tops[Math.floor(Math.random() * itemsByCategory.tops.length)];
                selectedItems.push(randomTop);
                score += Math.random() * 30 + 20; // 20-50 points for having a top
            }

            if (itemsByCategory.bottoms.length > 0) {
                const randomBottom = itemsByCategory.bottoms[Math.floor(Math.random() * itemsByCategory.bottoms.length)];
                selectedItems.push(randomBottom);
                score += Math.random() * 30 + 20; // 20-50 points for having a bottom
            }

            // Randomly include shoes (80% chance)
            if (itemsByCategory.shoes.length > 0 && Math.random() > 0.2) {
                const randomShoes = itemsByCategory.shoes[Math.floor(Math.random() * itemsByCategory.shoes.length)];
                selectedItems.push(randomShoes);
                score += Math.random() * 20 + 10; // 10-30 points for shoes
            }

            // Randomly include accessories (60% chance)
            if (itemsByCategory.accessories.length > 0 && Math.random() > 0.4) {
                const randomAccessory = itemsByCategory.accessories[Math.floor(Math.random() * itemsByCategory.accessories.length)];
                selectedItems.push(randomAccessory);
                score += Math.random() * 15 + 5; // 5-20 points for accessories
            }

            // Color harmony bonus
            const hasColorHarmony = this.checkColorHarmony(selectedItems);
            if (hasColorHarmony) score += 15;

            // Pattern matching bonus
            const hasGoodPatternMix = this.checkPatternMix(selectedItems);
            if (hasGoodPatternMix) score += 10;

            // Ensure minimum score
            score = Math.max(score, 45);

            // Cap score at 95
            score = Math.min(Math.round(score), 95);

            // Determine occasion based on outfit composition
            const occasions = ['Casual Day', 'Work Meeting', 'Date Night', 'Weekend Brunch', 'Coffee Run'];
            const occasion = occasions[Math.floor(Math.random() * occasions.length)];

            return {
                outfit: {
                    items: selectedItems,
                    occasion: occasion,
                    totalItems: selectedItems.length
                },
                score: score
            };
        },

        checkColorHarmony(items) {
            // Simple color harmony check - in real implementation, this would be more sophisticated
            const colors = items.flatMap(item => {
                if (item.colors) {
                    return item.colors.split(',').map(c => c.trim().toLowerCase());
                }
                return [];
            });
            return colors.length >= 2; // Basic check
        },

        checkPatternMix(items) {
            // Check if patterns mix well
            const patterns = items.map(item => item.pattern || 'solid');
            const solidCount = patterns.filter(p => p === 'solid').length;
            const patternCount = patterns.length - solidCount;

            // Good mix if not too many competing patterns (max 2 patterned items)
            return patternCount <= 2 && solidCount >= Math.floor(patterns.length / 2);
        },

        addSwipeFunctionality(outfitCard) {
            if (!outfitCard) return;

            let startX = 0;
            let currentX = 0;
            let isDragging = false;

            const handleStart = (clientX) => {
                startX = clientX;
                isDragging = true;
                outfitCard.style.transition = 'none';
            };

            const handleMove = (clientX) => {
                if (!isDragging) return;
                currentX = clientX;
                const deltaX = currentX - startX;
                const rotate = deltaX * 0.1;
                outfitCard.style.transform = `translateX(${deltaX}px) rotate(${rotate}deg)`;
            };

            const handleEnd = () => {
                if (!isDragging) return;
                isDragging = false;
                const deltaX = currentX - startX;

                outfitCard.style.transition = 'transform 0.3s ease';

                if (Math.abs(deltaX) > 100) {
                    // Swipe detected
                    if (deltaX > 0) {
                        // Swipe right - LIKE
                        app.actions.handleMatch('like');
                    } else {
                        // Swipe left - DISLIKE
                        app.actions.handleMatch('dislike');
                    }
                } else {
                    // Return to center
                    outfitCard.style.transform = 'translateX(0) rotate(0deg)';
                }
            };

            // Mouse events
            outfitCard.addEventListener('mousedown', (e) => handleStart(e.clientX));
            document.addEventListener('mousemove', (e) => handleMove(e.clientX));
            document.addEventListener('mouseup', handleEnd);

            // Touch events
            outfitCard.addEventListener('touchstart', (e) => handleStart(e.touches[0].clientX), { passive: true });
            outfitCard.addEventListener('touchmove', (e) => handleMove(e.touches[0].clientX), { passive: true });
            outfitCard.addEventListener('touchend', handleEnd, { passive: true });
        }
    };

    // ============================================
    // User Actions
    // ============================================
    const actions = {
        async uploadItem(file, categoryId, tags) {
            try {
                utils.showNotification('Uploading item...', 'info');

                const result = await api.uploadImage(file, categoryId, tags);

                if (result.success) {
                    utils.showNotification('Item uploaded successfully!', 'success');

                    // Update state and refresh
                    await state.refreshItems();
                    views.updateLimits();

                    // Switch to wardrobe view to show the new item
                    views.show('wardrobe');
                } else {
                    utils.showNotification(result.error || 'Upload failed', 'error');
                }
            } catch (error) {
                utils.showNotification('Upload failed. Please try again.', 'error');
            }
        },

        async deleteItem(itemId) {
            if (!confirm('Are you sure you want to delete this item?')) return;

            try {
                await api.deleteItem(itemId);
                utils.showNotification('Item deleted successfully', 'success');
                await state.refreshItems();
                views.updateLimits();
            } catch (error) {
                utils.showNotification('Failed to delete item', 'error');
            }
        },

        async handleMatch(action) {
            if (!appState.currentMatch) return;

            try {
                switch (action) {
                    case 'like':
                        appState.matchHistory.push({
                            ...appState.currentMatch,
                            action: 'like',
                            timestamp: new Date()
                        });
                        const outfit = appState.currentMatch.outfit;
                        utils.showNotification(`💖 Love this ${outfit.occasion.toLowerCase()} outfit! Saved to favorites.`, 'success');
                        break;
                    case 'dislike':
                        utils.showNotification('👎 Not quite right. Finding you a better outfit...', 'info');
                        break;
                    case 'skip':
                        utils.showNotification('⏭️ Skipping to next outfit...', 'info');
                        break;
                }

                // Load next match
                views.loadNextMatch();

            } catch (error) {
                utils.showNotification('Failed to process match action', 'error');
            }
        },

        async requestVerification(email) {
            try {
                utils.showNotification('Sending verification code...', 'info');
                const result = await api.requestVerification(email);

                if (result.success) {
                    utils.showNotification('Verification code sent to your email!', 'success');
                } else {
                    utils.showNotification(result.error || 'Failed to send code', 'error');
                }
            } catch (error) {
                utils.showNotification('Failed to request verification', 'error');
            }
        },

        async verifyCode(email, code) {
            try {
                const result = await api.verifyClient(email, code);

                if (result.success) {
                    utils.showNotification('Welcome back! You now have unlimited access.', 'success');
                    await state.loadUserState();
                    views.updateLimits();
                } else {
                    utils.showNotification(result.error || 'Invalid verification code', 'error');
                }
            } catch (error) {
                utils.showNotification('Verification failed', 'error');
            }
        }
    };

    // ============================================
    // Touch/Swipe Support
    // ============================================
    const touch = {
        initSwipeGestures() {
            const matchCard = document.querySelector('.match-card');
            if (!matchCard) return;

            let startX = 0;
            let startY = 0;
            let isDragging = false;

            const handleTouchStart = (e) => {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                isDragging = true;
            };

            const handleTouchMove = (e) => {
                if (!isDragging) return;

                const currentX = e.touches[0].clientX;
                const deltaX = currentX - startX;

                // Visual feedback during swipe
                if (Math.abs(deltaX) > 50) {
                    matchCard.style.transform = `translateX(${deltaX * 0.3}px) rotate(${deltaX * 0.1}deg)`;
                    matchCard.style.opacity = 1 - Math.abs(deltaX) / 300;
                }
            };

            const handleTouchEnd = (e) => {
                if (!isDragging) return;

                const endX = e.changedTouches[0].clientX;
                const deltaX = endX - startX;

                // Reset card
                matchCard.style.transform = '';
                matchCard.style.opacity = '';

                // Determine swipe direction
                if (Math.abs(deltaX) > 100) {
                    if (deltaX > 0) {
                        // Swipe right - LIKE
                        actions.handleMatch('like');
                    } else {
                        // Swipe left - DISLIKE
                        actions.handleMatch('dislike');
                    }
                }

                isDragging = false;
            };

            // Add touch event listeners
            matchCard.addEventListener('touchstart', handleTouchStart, { passive: true });
            matchCard.addEventListener('touchmove', handleTouchMove, { passive: true });
            matchCard.addEventListener('touchend', handleTouchEnd, { passive: true });
        }
    };

    // ============================================
    // Upload Functionality
    // ============================================
    const upload = {
        selectedFile: null,

        initUploadHandlers() {
            const uploadArea = document.getElementById('uploadArea');
            const fileInput = document.getElementById('fileInput');
            const uploadForm = document.getElementById('uploadForm');
            const categorySelect = document.getElementById('categorySelect');

            // Populate categories
            this.populateCategories();

            // Upload area click handler
            uploadArea.addEventListener('click', () => fileInput.click());

            // File input change handler
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.handleFileSelect(e.target.files[0]);
                }
            });

            // Drag and drop handlers
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('dragging');
            });

            uploadArea.addEventListener('dragleave', () => {
                uploadArea.classList.remove('dragging');
            });

            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragging');
                if (e.dataTransfer.files.length > 0) {
                    this.handleFileSelect(e.dataTransfer.files[0]);
                }
            });

            // Form submission handler
            uploadForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleUpload();
            });

            // Category change handler
            categorySelect.addEventListener('change', () => {
                this.updateUploadButton();
            });
        },

        async populateCategories() {
            const categorySelect = document.getElementById('categorySelect');
            try {
                const categories = await api.getCategories();
                categorySelect.innerHTML = '<option value="">Select category...</option>' +
                    categories.categories.map(cat =>
                        `<option value="${cat.id}">${cat.name}</option>`
                    ).join('');
            } catch (error) {
                console.error('Failed to load categories:', error);
            }
        },

        handleFileSelect(file) {
            // Validate file
            if (!file.type.match(/image\/(jpeg|jpg|png|webp)/)) {
                utils.showNotification('Please select a valid image file (JPEG, PNG, or WebP)', 'error');
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                utils.showNotification('File size must be less than 5MB', 'error');
                return;
            }

            this.selectedFile = file;
            this.updateUploadButton();
            this.updateUploadPreview(file);
        },

        updateUploadPreview(file) {
            const uploadArea = document.getElementById('uploadArea');
            const reader = new FileReader();

            reader.onload = (e) => {
                uploadArea.innerHTML = `
                    <img src="${e.target.result}" style="max-width: 200px; max-height: 200px; border-radius: 8px; margin-bottom: 1rem;">
                    <p style="font-weight: 600; margin-bottom: 0.5rem;">${file.name}</p>
                    <p style="font-size: 0.9rem; color: var(--text-light);">${(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    <button type="button" class="btn btn-secondary" onclick="app.upload.resetUpload()" style="margin-top: 1rem;">
                        Choose Different File
                    </button>
                `;
            };

            reader.readAsDataURL(file);
        },

        updateUploadButton() {
            const uploadButton = document.getElementById('uploadButton');
            const categorySelect = document.getElementById('categorySelect');

            const canUpload = this.selectedFile && categorySelect.value;
            uploadButton.disabled = !canUpload;

            if (canUpload) {
                uploadButton.textContent = '📤 Upload Item';
            } else {
                uploadButton.textContent = '📤 Upload Item';
            }
        },

        async handleUpload() {
            if (!this.selectedFile) {
                utils.showNotification('Please select an image first', 'error');
                return;
            }

            const categoryId = document.getElementById('categorySelect').value;
            if (!categoryId) {
                utils.showNotification('Please select a category', 'error');
                return;
            }

            // Collect tags
            const tags = {
                color_tags: document.getElementById('colorsInput').value,
                style_tags: document.getElementById('stylesInput').value,
                season_tags: document.getElementById('seasonsInput').value,
                brand: document.getElementById('brandInput').value,
                pattern: document.getElementById('patternSelect').value
            };

            await actions.uploadItem(this.selectedFile, categoryId, tags);
            this.resetUpload();
        },

        resetUpload() {
            this.selectedFile = null;

            // Reset form
            document.getElementById('uploadForm').reset();

            // Reset upload area
            const uploadArea = document.getElementById('uploadArea');
            uploadArea.innerHTML = `
                <div class="upload-icon">📤</div>
                <p class="upload-text">Drag & drop images here or click to browse</p>
                <p style="font-size: 0.9rem; color: var(--text-lighter);">Maximum file size: 5MB</p>
                <input type="file" id="fileInput" accept="image/jpeg,image/jpg,image/png,image/webp" style="display: none;">
            `;

            // Re-attach file input handler
            document.getElementById('fileInput').addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.handleFileSelect(e.target.files[0]);
                }
            });

            this.updateUploadButton();
        }
    };

    // ============================================
    // Verification Functionality
    // ============================================
    const verification = {
        initVerificationHandlers() {
            const verificationForm = document.getElementById('verificationForm');

            verificationForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRequestCode();
            });
        },

        async handleRequestCode() {
            const email = document.getElementById('clientEmail').value;

            if (!email) {
                utils.showNotification('Please enter your email address', 'error');
                return;
            }

            await actions.requestVerification(email);

            // Show code entry section
            document.getElementById('codeEntrySection').style.display = 'block';
        }
    };

    // ============================================
    // Initialize Application
    // ============================================
    const init = async () => {
        try {
            console.log('Initializing matcher app...');
            console.log('Window object exists:', typeof window !== 'undefined');
            console.log('Document ready state:', document.readyState);

            // Cache DOM elements
            // Ensure structural elements are found
            const mainContainer = document.querySelector('.matcher-container');
            const mainNav = document.querySelector('.matcher-nav');

            // Cache other views
            elements.uploadView = document.querySelector('.upload-view');
            elements.wardrobeView = document.querySelector('.wardrobe-view');
            elements.matcherView = document.querySelector('.matcher-view');
            elements.limitsDisplay = document.querySelector('.limits-display');
            elements.verificationSection = document.querySelector('.verification-section');

            console.log('DOM Elements found:', {
                container: !!mainContainer,
                nav: !!mainNav,
                uploadView: !!elements.uploadView,
                wardrobeView: !!elements.wardrobeView,
                matcherView: !!elements.matcherView
            });

            // Load initial state
            await state.loadUserState();

            // Update UI with loaded data
            views.updateLimits();

            // Ensure structural elements are visible
            if (mainContainer) mainContainer.style.display = 'block';
            if (mainNav) mainNav.style.display = 'flex';
            if (elements.limitsDisplay) elements.limitsDisplay.style.display = 'block';

            const loadingEl = document.getElementById('initialLoading');
            if (loadingEl) loadingEl.style.display = 'none';

            // Show initial view
            if (appState.userItems && appState.userItems.length === 0) {
                views.show('upload');
            } else {
                views.show('wardrobe');
            }

            // Initialize upload functionality
            upload.initUploadHandlers();

            // Initialize swipe gestures for mobile
            if ('ontouchstart' in window) {
                touch.initSwipeGestures();
            }

            // Add global event listeners
            document.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowLeft' && appState.currentView === 'matcher') {
                    actions.handleMatch('dislike');
                } else if (e.key === 'ArrowRight' && appState.currentView === 'matcher') {
                    actions.handleMatch('like');
                } else if (e.key === 'ArrowDown' && appState.currentView === 'matcher') {
                    actions.handleMatch('skip');
                }
            });

            // Initialize verification form
            verification.initVerificationHandlers();


        } catch (error) {
            console.error('Failed to initialize app:', error);
            const loadingEl = document.getElementById('initialLoading');
            if (loadingEl) {
                loadingEl.innerHTML = `
                            <div style="text-align: center; padding: 3rem; color: #dc3545;">
                                <p>❌ Failed to load the application</p>
                                <p style="font-size: 0.9rem; margin-top: 1rem;">Please refresh the page or try again later</p>
                                <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: var(--primary-color); color: white; border: none; border-radius: 4px; cursor: pointer;">Refresh Page</button>
                            </div>
                        `;
            }
        }
    };

    // ============================================
    // Public API
    // ============================================
    window.app = {
        views,
        actions,
        state,
        touch,
        utils
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
