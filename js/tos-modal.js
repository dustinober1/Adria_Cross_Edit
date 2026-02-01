/**
 * Terms of Service Modal
 * Reusable component for TOS acceptance during registration
 */

class TosModal {
    constructor() {
        this.tosText = '';
        this.onAccept = null;
        this.onCancel = null;
    }

    /**
     * Load TOS text from server and show modal
     */
    async show(options = {}) {
        const {
            onAccept,
            onCancel,
            title = 'Terms of Service',
            message = 'Please read and accept the Terms of Service to continue.'
        } = options;

        this.onAccept = onAccept;
        this.onCancel = onCancel;

        // Load TOS content if not already loaded
        if (!this.tosText) {
            try {
                const response = await fetch('/terms-of-service.html');
                const html = await response.text();
                // Extract main content from TOS page
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const mainContent = doc.querySelector('.legal-content, main, .container');
                this.tosText = mainContent ? mainContent.innerHTML : '<p>Terms of Service not available</p>';
            } catch (err) {
                console.error('Failed to load TOS:', err);
                this.tosText = '<p>Terms of Service not available</p>';
            }
        }

        return new Promise((resolve, reject) => {
            this._createModal(title, message, resolve, reject);
        });
    }

    _createModal(title, message, resolve, reject) {
        // Remove existing TOS modal if any
        const existing = document.getElementById('tos-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'tos-modal';
        modal.className = 'tos-modal';
        modal.innerHTML = `
            <div class="tos-modal-content">
                <div class="tos-modal-header">
                    <h2>${title}</h2>
                    <button class="tos-close" aria-label="Close">&times;</button>
                </div>
                <div class="tos-modal-body">
                    <p class="tos-message">${message}</p>
                    <div class="tos-content-wrapper">
                        <div class="tos-content">
                            ${this.tosText}
                        </div>
                    </div>
                    <div class="tos-checkbox-wrapper">
                        <label class="tos-checkbox-label">
                            <input type="checkbox" id="tos-agree-checkbox">
                            <span>I have read and agree to the Terms of Service</span>
                        </label>
                    </div>
                </div>
                <div class="tos-modal-footer">
                    <button type="button" class="tos-btn tos-btn-cancel" disabled>Decline</button>
                    <button type="button" class="tos-btn tos-btn-accept" disabled>Accept & Continue</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this._addStyles();

        const checkbox = document.getElementById('tos-agree-checkbox');
        const acceptBtn = modal.querySelector('.tos-btn-accept');
        const declineBtn = modal.querySelector('.tos-btn-cancel');
        const closeBtn = modal.querySelector('.tos-close');

        // Enable/disable buttons based on checkbox
        checkbox.addEventListener('change', () => {
            acceptBtn.disabled = !checkbox.checked;
            declineBtn.disabled = !checkbox.checked;
        });

        // Scroll detection - require scrolling to bottom
        const contentWrapper = modal.querySelector('.tos-content-wrapper');
        let hasScrolledToBottom = false;

        contentWrapper.addEventListener('scroll', () => {
            const { scrollTop, scrollHeight, clientHeight } = contentWrapper;
            if (scrollTop + clientHeight >= scrollHeight - 10) {
                hasScrolledToBottom = true;
            }
        });

        // Close button
        closeBtn.addEventListener('click', () => {
            modal.remove();
            if (this.onCancel) this.onCancel();
            reject(new Error('TOS declined'));
        });

        // Decline button
        declineBtn.addEventListener('click', () => {
            modal.remove();
            if (this.onCancel) this.onCancel();
            reject(new Error('TOS declined'));
        });

        // Accept button
        acceptBtn.addEventListener('click', () => {
            if (!checkbox.checked) return;
            modal.remove();
            const acceptedAt = new Date().toISOString();
            if (this.onAccept) this.onAccept(acceptedAt);
            resolve(acceptedAt);
        });

        // Click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal && hasScrolledToBottom && checkbox.checked) {
                modal.remove();
                if (this.onCancel) this.onCancel();
                reject(new Error('TOS declined'));
            }
        });
    }

    _addStyles() {
        if (document.getElementById('tos-modal-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'tos-modal-styles';
        styles.textContent = `
            .tos-modal {
                display: flex;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.6);
                z-index: 10001;
                animation: tosFadeIn 0.3s ease;
            }

            @keyframes tosFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            .tos-modal-content {
                position: relative;
                width: 90%;
                max-width: 650px;
                max-height: 85vh;
                margin: auto;
                background: white;
                border-radius: 16px;
                display: flex;
                flex-direction: column;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                animation: tosSlideUp 0.3s ease;
            }

            @keyframes tosSlideUp {
                from { transform: translateY(30px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }

            .tos-modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1.5rem 2rem;
                border-bottom: 1px solid #eee;
                flex-shrink: 0;
            }

            .tos-modal-header h2 {
                margin: 0;
                color: #c19a5d;
                font-family: 'Montserrat', sans-serif;
                font-size: 1.5rem;
            }

            .tos-close {
                background: none;
                border: none;
                font-size: 1.8rem;
                cursor: pointer;
                color: #999;
                padding: 0;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
                transition: all 0.2s;
            }

            .tos-close:hover {
                background: #f0f0f0;
                color: #333;
            }

            .tos-modal-body {
                padding: 1.5rem 2rem;
                overflow-y: auto;
                flex: 1;
            }

            .tos-message {
                margin: 0 0 1rem 0;
                color: #666;
                font-weight: 500;
            }

            .tos-content-wrapper {
                border: 1px solid #ddd;
                border-radius: 8px;
                padding: 1.5rem;
                margin-bottom: 1.5rem;
                background: #fafafa;
                max-height: 300px;
                overflow-y: auto;
                scroll-behavior: smooth;
            }

            .tos-content {
                font-size: 0.9rem;
                line-height: 1.6;
                color: #2f2f2f;
            }

            .tos-content * {
                color: #2f2f2f;
            }

            .tos-content h1,
            .tos-content h2,
            .tos-content h3 {
                color: #c19a5d;
                margin-top: 1rem;
            }

            .tos-content a {
                color: #7b5a2d;
            }

            .tos-content p {
                margin-bottom: 0.75rem;
            }

            .tos-content ul,
            .tos-content ol {
                padding-left: 1.5rem;
                margin-bottom: 0.75rem;
            }

            .tos-checkbox-wrapper {
                padding: 1rem;
                background: #f5f0e8;
                border-radius: 8px;
                border: 1px solid #e8e4dd;
            }

            .tos-checkbox-label {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                cursor: pointer;
                font-weight: 500;
                color: #333;
                user-select: none;
            }

            .tos-checkbox-label input[type="checkbox"] {
                width: 20px;
                height: 20px;
                cursor: pointer;
                accent-color: #c19a5d;
            }

            .tos-modal-footer {
                display: flex;
                gap: 1rem;
                padding: 1.5rem 2rem;
                border-top: 1px solid #eee;
                flex-shrink: 0;
            }

            .tos-btn {
                flex: 1;
                padding: 1rem;
                border: none;
                border-radius: 8px;
                font-size: 1rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s;
                font-family: inherit;
            }

            .tos-btn-accept {
                background: linear-gradient(135deg, #d4a574 0%, #c19a5d 100%);
                color: white;
            }

            .tos-btn-accept:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(193, 154, 93, 0.3);
            }

            .tos-btn-cancel {
                background: #f5f5f5;
                color: #666;
                border: 1px solid #ddd;
            }

            .tos-btn-cancel:hover:not(:disabled) {
                background: #eee;
            }

            .tos-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            @media (max-width: 600px) {
                .tos-modal-content {
                    width: 95%;
                    max-height: 90vh;
                }

                .tos-modal-header,
                .tos-modal-body,
                .tos-modal-footer {
                    padding: 1rem 1.5rem;
                }

                .tos-content-wrapper {
                    max-height: 250px;
                    padding: 1rem;
                }

                .tos-modal-footer {
                    flex-direction: column-reverse;
                }

                .tos-btn {
                    width: 100%;
                }
            }
        `;

        document.head.appendChild(styles);
    }
}

// Create global instance
window.tosModal = new TosModal();
