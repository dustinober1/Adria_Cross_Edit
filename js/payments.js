/**
 * Square Payment Integration for Adria Cross
 * Handles payment form initialization and processing using Square Web Payments SDK
 * with a professional, multi-step checkout experience
 */

class SquarePayment {
    constructor() {
        this.payments = null;
        this.card = null;
        this.initialized = false;
    }

    /**
     * Initialize the Square Web Payments SDK
     */
    async init() {
        try {
            // Fetch Square configuration from server
            const configRes = await fetch('/api/square/config');
            if (!configRes.ok) {
                console.warn('Square not configured');
                return false;
            }

            const config = await configRes.json();

            // Load Square Web SDK if not already loaded
            if (!window.Square) {
                await this.loadSquareScript(config.environment);
            }

            // Initialize payments
            this.payments = window.Square.payments(config.applicationId, config.locationId);
            this.initialized = true;

            return true;
        } catch (err) {
            console.error('Failed to initialize Square:', err);
            return false;
        }
    }

    /**
     * Dynamically load the Square Web Payments SDK
     */
    loadSquareScript(environment) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = environment === 'production'
                ? 'https://web.squarecdn.com/v1/square.js'
                : 'https://sandbox.web.squarecdn.com/v1/square.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * Attach card input to a container element
     * @param {string} containerId - The ID of the container element
     */
    async attachCard(containerId) {
        if (!this.initialized) {
            const success = await this.init();
            if (!success) return null;
        }

        try {
            this.card = await this.payments.card();
            await this.card.attach(`#${containerId}`);
            return this.card;
        } catch (err) {
            console.error('Failed to attach card:', err);
            return null;
        }
    }

    /**
     * Process a payment
     * @param {number} amount - Amount in dollars
     * @param {string} customerEmail - Customer's email
     * @param {string} description - Payment description
     * @param {Object} customerInfo - Customer information (name, address, etc.)
     */
    async processPayment(amount, customerEmail, description, customerInfo = {}) {
        if (!this.card) {
            throw new Error('Card not attached');
        }

        try {
            // Tokenize the card
            const tokenResult = await this.card.tokenize();

            if (tokenResult.status !== 'OK') {
                throw new Error(tokenResult.errors?.[0]?.message || 'Card tokenization failed');
            }

            // Send payment to server
            const response = await fetch('/api/payments/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sourceId: tokenResult.token,
                    amount: amount,
                    customerEmail: customerEmail,
                    description: description,
                    customerInfo: customerInfo
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Payment failed');
            }

            return result;
        } catch (err) {
            console.error('Payment error:', err);
            throw err;
        }
    }

    /**
     * Creates a professional multi-step payment modal
     * @param {Object} options - Configuration options
     */
    createPaymentModal(options = {}) {
        const {
            amount = 0,
            description = 'Style Consultation',
            buttonText = 'Pay Now',
            onSuccess = () => { },
            onError = () => { }
        } = options;

        // Create modal HTML with multi-step checkout
        const modal = document.createElement('div');
        modal.id = 'payment-modal';
        modal.className = 'payment-modal';
        modal.innerHTML = `
            <div class="payment-modal-content">
                <span class="payment-close">&times;</span>
                <div class="payment-header">
                    <h2>Secure Checkout</h2>
                    <div class="payment-steps">
                        <div class="payment-step active" data-step="1">
                            <div class="step-number">1</div>
                            <div class="step-label">Details</div>
                        </div>
                        <div class="payment-step-line"></div>
                        <div class="payment-step" data-step="2">
                            <div class="step-number">2</div>
                            <div class="step-label">Address</div>
                        </div>
                        <div class="payment-step-line"></div>
                        <div class="payment-step" data-step="3">
                            <div class="step-number">3</div>
                            <div class="step-label">Payment</div>
                        </div>
                    </div>
                </div>

                <form id="payment-form">
                    <!-- Step 1: Order Details & Customer Info -->
                    <div class="payment-step-content active" data-step="1">
                        <div class="payment-section">
                            <h3>Order Summary</h3>
                            <div class="order-items">
                                <div class="order-item">
                                    <span class="item-name">${description}</span>
                                    <span class="item-price">$${amount.toFixed(2)}</span>
                                </div>
                            </div>
                            <div class="order-total">
                                <span>Total</span>
                                <span class="total-amount">$${amount.toFixed(2)}</span>
                            </div>
                        </div>

                        <div class="payment-section">
                            <h3>Your Information</h3>
                            <div class="payment-field">
                                <label for="payment-fullname">Full Name *</label>
                                <input type="text" id="payment-fullname" name="fullname" required placeholder="John Doe">
                            </div>
                            <div class="payment-field">
                                <label for="payment-email">Email Address *</label>
                                <input type="email" id="payment-email" name="email" required placeholder="you@example.com">
                            </div>
                            <div class="payment-field">
                                <label for="payment-phone">Phone Number (optional)</label>
                                <input type="tel" id="payment-phone" name="phone" placeholder="(123) 456-7890">
                            </div>
                        </div>
                    </div>

                    <!-- Step 2: Billing Address -->
                    <div class="payment-step-content" data-step="2">
                        <div class="payment-section">
                            <h3>Billing Address</h3>
                            <div class="payment-field">
                                <label for="payment-address">Street Address *</label>
                                <input type="text" id="payment-address" name="address" required placeholder="123 Main St">
                            </div>
                            <div class="payment-row">
                                <div class="payment-field">
                                    <label for="payment-city">City *</label>
                                    <input type="text" id="payment-city" name="city" required placeholder="New York">
                                </div>
                                <div class="payment-field">
                                    <label for="payment-state">State/Province *</label>
                                    <input type="text" id="payment-state" name="state" required placeholder="NY">
                                </div>
                            </div>
                            <div class="payment-row">
                                <div class="payment-field">
                                    <label for="payment-zip">Postal Code *</label>
                                    <input type="text" id="payment-zip" name="zip" required placeholder="10001">
                                </div>
                                <div class="payment-field">
                                    <label for="payment-country">Country *</label>
                                    <input type="text" id="payment-country" name="country" required placeholder="United States" value="United States">
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Step 3: Payment Method -->
                    <div class="payment-step-content" data-step="3">
                        <div class="payment-section">
                            <h3>Payment Method</h3>
                            <div class="payment-field">
                                <label>Card Details *</label>
                                <div id="card-container"></div>
                            </div>
                            <div class="payment-security">
                                <span class="security-icon">🔒</span>
                                <span>Your payment information is secure and encrypted</span>
                            </div>
                        </div>
                    </div>

                    <!-- Navigation and Submit -->
                    <div class="payment-actions">
                        <button type="button" id="payment-prev" class="payment-btn-secondary" style="display: none;">← Back</button>
                        <button type="button" id="payment-next" class="payment-btn-primary">Continue →</button>
                        <button type="submit" id="payment-submit" class="payment-btn-primary" style="display: none;">
                            Pay $${amount.toFixed(2)}
                        </button>
                    </div>

                    <div id="payment-status" class="payment-status"></div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        // Add styles
        this.addPaymentStyles();

        // Close button
        modal.querySelector('.payment-close').onclick = () => {
            modal.remove();
        };

        // Click outside to close
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };

        // Step navigation
        let currentStep = 1;
        let cardAttached = false;
        const nextBtn = document.getElementById('payment-next');
        const prevBtn = document.getElementById('payment-prev');
        const submitBtn = document.getElementById('payment-submit');
        const form = document.getElementById('payment-form');

        const updateStepUI = async (step) => {
            // Hide all step contents
            document.querySelectorAll('.payment-step-content').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.payment-step').forEach(el => el.classList.remove('active'));

            // Show current step
            document.querySelector(`[data-step="${step}"].payment-step-content`).classList.add('active');
            document.querySelector(`[data-step="${step}"].payment-step`).classList.add('active');

            // Show next button for step 1 and 2
            if (step < 3) {
                nextBtn.style.display = 'block';
                submitBtn.style.display = 'none';
            } else {
                nextBtn.style.display = 'none';
                submitBtn.style.display = 'block';
                // Attach card only when needed
                if (!cardAttached) {
                    await this.attachCard('card-container');
                    cardAttached = true;
                }
            }

            // Show prev button for step 2 and 3
            if (step > 1) {
                prevBtn.style.display = 'block';
            } else {
                prevBtn.style.display = 'none';
            }

            // Update step indicators
            for (let i = 1; i <= 3; i++) {
                const stepEl = document.querySelector(`.payment-step[data-step="${i}"]`);
                if (i < step) {
                    stepEl.classList.add('completed');
                } else if (i === step) {
                    stepEl.classList.add('active');
                } else {
                    stepEl.classList.remove('active', 'completed');
                }
            }
        };

        updateStepUI(1);

        const validateStep = (step) => {
            const requiredFields = {
                1: ['payment-fullname', 'payment-email'],
                2: ['payment-address', 'payment-city', 'payment-state', 'payment-zip', 'payment-country'],
                3: []
            };

            for (const fieldId of requiredFields[step] || []) {
                const field = document.getElementById(fieldId);
                if (!field.value.trim()) {
                    field.focus();
                    const label = field.parentElement.querySelector('label').textContent;
                    alert(`Please fill in ${label}`);
                    return false;
                }
            }
            return true;
        };

        nextBtn.onclick = (e) => {
            e.preventDefault();
            if (validateStep(currentStep)) {
                currentStep++;
                updateStepUI(currentStep);
            }
        };

        prevBtn.onclick = (e) => {
            e.preventDefault();
            currentStep--;
            updateStepUI(currentStep);
        };

        // Form submission
        form.onsubmit = async (e) => {
            e.preventDefault();

            const statusEl = document.getElementById('payment-status');
            const email = document.getElementById('payment-email').value;
            const fullname = document.getElementById('payment-fullname').value;

            submitBtn.disabled = true;
            submitBtn.textContent = 'Processing...';
            statusEl.textContent = '';
            statusEl.className = 'payment-status';

            try {
                const customerInfo = {
                    name: fullname,
                    address: document.getElementById('payment-address').value,
                    city: document.getElementById('payment-city').value,
                    state: document.getElementById('payment-state').value,
                    zip: document.getElementById('payment-zip').value,
                    country: document.getElementById('payment-country').value,
                    phone: document.getElementById('payment-phone').value
                };

                const result = await this.processPayment(amount, email, description, customerInfo);

                statusEl.textContent = '✓ Payment successful! Check your email for confirmation.';
                statusEl.className = 'payment-status success';

                onSuccess(result);

                setTimeout(() => modal.remove(), 3000);
            } catch (err) {
                statusEl.textContent = `✗ ${err.message}`;
                statusEl.className = 'payment-status error';
                onError(err);
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = `Pay $${amount.toFixed(2)}`;
            }
        };

        return modal;
    }

    /**
     * Add payment modal styles with professional design
     */
    addPaymentStyles() {
        if (document.getElementById('payment-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'payment-styles';
        styles.textContent = `
            .payment-modal {
                display: block;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                z-index: 10000;
                animation: fadeIn 0.3s ease;
                overflow-y: auto;
            }

            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            .payment-modal-content {
                position: relative;
                max-width: 650px;
                margin: 40px auto;
                background: white;
                border-radius: 16px;
                padding: 2.5rem;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                animation: slideUp 0.3s ease;
            }

            @keyframes slideUp {
                from { transform: translateY(20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }

            .payment-close {
                position: absolute;
                top: 1.5rem;
                right: 1.5rem;
                font-size: 1.8rem;
                cursor: pointer;
                color: #999;
                transition: color 0.3s;
                border: none;
                background: none;
                padding: 0;
            }

            .payment-close:hover {
                color: #333;
            }

            .payment-header {
                margin-bottom: 2rem;
                border-bottom: 1px solid #eee;
                padding-bottom: 1.5rem;
            }

            .payment-header h2 {
                color: #c19a5d;
                margin: 0 0 1.5rem 0;
                font-family: 'Montserrat', sans-serif;
                font-size: 1.8rem;
            }

            .payment-steps {
                display: flex;
                align-items: center;
                justify-content: space-between;
                max-width: 400px;
            }

            .payment-step {
                display: flex;
                flex-direction: column;
                align-items: center;
                flex: 0 0 auto;
            }

            .step-number {
                width: 40px;
                height: 40px;
                background: #f0f0f0;
                border: 2px solid #ddd;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 700;
                color: #999;
                margin-bottom: 0.5rem;
                transition: all 0.3s;
            }

            .payment-step.active .step-number {
                background: #c19a5d;
                color: white;
                border-color: #c19a5d;
                box-shadow: 0 4px 12px rgba(193, 154, 93, 0.3);
            }

            .payment-step.completed .step-number {
                background: #4caf50;
                color: white;
                border-color: #4caf50;
            }

            .step-label {
                font-size: 0.75rem;
                color: #999;
                font-weight: 600;
                text-transform: uppercase;
                transition: color 0.3s;
            }

            .payment-step.active .step-label {
                color: #c19a5d;
            }

            .payment-step.completed .step-label {
                color: #4caf50;
            }

            .payment-step-line {
                flex: 1;
                height: 2px;
                background: #ddd;
                margin: 0 1rem;
                margin-bottom: 2.5rem;
            }

            .payment-step-content {
                display: none;
                animation: fadeIn 0.3s ease;
            }

            .payment-step-content.active {
                display: block;
            }

            .payment-section {
                margin-bottom: 2rem;
            }

            .payment-section h3 {
                font-size: 1.1rem;
                color: #333;
                margin: 0 0 1.5rem 0;
                font-weight: 600;
            }

            .order-items {
                background: #f9f9f9;
                border-radius: 12px;
                padding: 1.5rem;
                margin-bottom: 1.5rem;
            }

            .order-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding-bottom: 1rem;
                border-bottom: 1px solid #eee;
            }

            .order-item:last-child {
                border-bottom: none;
                padding-bottom: 0;
            }

            .item-name {
                font-weight: 500;
                color: #333;
            }

            .item-price {
                font-weight: 600;
                color: #c19a5d;
            }

            .order-total {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1rem 1.5rem;
                background: linear-gradient(135deg, #f5f0e8 0%, #faf8f5 100%);
                border-radius: 12px;
                font-weight: 600;
            }

            .total-amount {
                color: #c19a5d;
                font-size: 1.3rem;
            }

            .payment-field {
                margin-bottom: 1.5rem;
            }

            .payment-field label {
                display: block;
                font-weight: 600;
                color: #333;
                margin-bottom: 0.6rem;
                font-size: 0.95rem;
            }

            .payment-field input {
                width: 100%;
                padding: 0.9rem 1rem;
                border: 1.5px solid #ddd;
                border-radius: 8px;
                font-size: 1rem;
                font-family: inherit;
                transition: all 0.3s;
                box-sizing: border-box;
            }

            .payment-field input:focus {
                outline: none;
                border-color: #c19a5d;
                box-shadow: 0 0 0 3px rgba(193, 154, 93, 0.1);
                background: #fafafa;
            }

            .payment-field input::placeholder {
                color: #bbb;
            }

            .payment-row {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 1rem;
            }

            #card-container {
                min-height: 56px;
                padding: 0.9rem 1rem;
                border: 1.5px solid #ddd;
                border-radius: 8px;
                background: white;
                transition: all 0.3s;
            }

            #card-container:focus-within {
                border-color: #c19a5d;
                box-shadow: 0 0 0 3px rgba(193, 154, 93, 0.1);
            }

            .payment-security {
                display: flex;
                align-items: center;
                gap: 0.8rem;
                padding: 1rem;
                background: #f0f9ff;
                border-radius: 8px;
                margin-top: 1rem;
                font-size: 0.9rem;
                color: #0066cc;
            }

            .security-icon {
                font-size: 1.2rem;
            }

            .payment-actions {
                display: flex;
                gap: 1rem;
                margin-top: 2.5rem;
                padding-top: 1.5rem;
                border-top: 1px solid #eee;
            }

            .payment-btn-primary,
            .payment-btn-secondary {
                padding: 1rem 2rem;
                border-radius: 8px;
                font-weight: 700;
                font-size: 1rem;
                cursor: pointer;
                transition: all 0.3s ease;
                border: none;
                font-family: inherit;
            }

            .payment-btn-primary {
                background: linear-gradient(135deg, #d4a574 0%, #c19a5d 100%);
                color: white;
                flex: 1;
            }

            .payment-btn-primary:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(193, 154, 93, 0.3);
            }

            .payment-btn-primary:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }

            .payment-btn-secondary {
                background: white;
                color: #666;
                border: 1.5px solid #ddd;
                flex: 0 0 auto;
            }

            .payment-btn-secondary:hover {
                background: #f5f5f5;
                border-color: #999;
            }

            .payment-status {
                margin-top: 1.5rem;
                padding: 1rem;
                border-radius: 8px;
                text-align: center;
                font-weight: 600;
                display: none;
            }

            .payment-status.success {
                background: #d4edda;
                color: #155724;
                border: 1px solid #c3e6cb;
            }

            .payment-status.error {
                background: #f8d7da;
                color: #721c24;
                border: 1px solid #f5c6cb;
            }

            @media (max-width: 600px) {
                .payment-modal-content {
                    margin: 20px 1rem;
                    padding: 1.5rem;
                }

                .payment-header h2 {
                    font-size: 1.5rem;
                }

                .payment-steps {
                    max-width: 100%;
                }

                .payment-step-line {
                    height: 1px;
                    margin: 0 0.5rem;
                    margin-bottom: 2.5rem;
                }

                .step-number {
                    width: 32px;
                    height: 32px;
                    font-size: 0.9rem;
                }

                .step-label {
                    font-size: 0.65rem;
                }

                .payment-row {
                    grid-template-columns: 1fr;
                }

                .payment-actions {
                    flex-direction: column-reverse;
                }

                .payment-btn-primary,
                .payment-btn-secondary {
                    width: 100%;
                }
            }
        `;
        document.head.appendChild(styles);
    }

    /**
     * Show email collection modal before payment
     * Checks if user exists and branches accordingly
     */
    showEmailCheckModal(amount, description) {
        return new Promise((resolve, reject) => {
            const modal = document.createElement('div');
            modal.id = 'email-check-modal';
            modal.className = 'payment-modal';
            modal.innerHTML = `
                <div class="payment-modal-content" style="max-width: 500px;">
                    <span class="payment-close">&times;</span>
                    <div class="payment-header">
                        <h2>Before We Continue</h2>
                    </div>
                    <form id="email-check-form">
                        <div class="payment-section">
                            <p style="margin-bottom: 1rem;">Please enter your email address to continue with your purchase:</p>
                            <div class="payment-field">
                                <label for="check-email">Email Address *</label>
                                <input type="email" id="check-email" name="email" required
                                       placeholder="you@example.com" autocomplete="email">
                            </div>
                        </div>
                        <div class="payment-actions">
                            <button type="submit" class="payment-btn-primary">Continue</button>
                        </div>
                        <div id="email-check-status" class="payment-status"></div>
                    </form>
                </div>
            `;

            document.body.appendChild(modal);
            this.addPaymentStyles();

            const form = document.getElementById('email-check-form');
            const statusEl = document.getElementById('email-check-status');
            const emailInput = document.getElementById('check-email');

            // Close handlers
            modal.querySelector('.payment-close').onclick = () => {
                modal.remove();
                reject(new Error('Email check cancelled'));
            };

            modal.onclick = (e) => {
                if (e.target === modal) {
                    modal.remove();
                    reject(new Error('Email check cancelled'));
                }
            };

            // Form submission
            form.onsubmit = async (e) => {
                e.preventDefault();
                const email = emailInput.value.trim();

                if (!email) {
                    statusEl.textContent = 'Please enter your email address';
                    statusEl.className = 'payment-status error';
                    statusEl.style.display = 'block';
                    return;
                }

                const btn = form.querySelector('button[type="submit"]');
                btn.disabled = true;
                btn.textContent = 'Checking...';
                statusEl.style.display = 'none';

                try {
                    // Check if email exists
                    const response = await fetch('/api/check-email-exists', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email })
                    });

                    const data = await response.json();

                    modal.remove();

                    if (data.exists) {
                        // Email exists - send payment link via email
                        resolve({
                            action: 'send-link',
                            email: email,
                            amount: amount,
                            description: description
                        });
                    } else {
                        // No account - require registration
                        resolve({
                            action: 'require-registration',
                            email: email,
                            amount: amount,
                            description: description
                        });
                    }
                } catch (err) {
                    statusEl.textContent = 'Failed to check email. Please try again.';
                    statusEl.className = 'payment-status error';
                    statusEl.style.display = 'block';
                    btn.disabled = false;
                    btn.textContent = 'Continue';
                }
            };

            // Auto-focus email input
            setTimeout(() => emailInput.focus(), 100);
        });
    }
}

// Create global instance
window.squarePayment = new SquarePayment();

// Helper function to show payment link sent modal
function showPaymentLinkSentModal(email) {
    const modal = document.createElement('div');
    modal.id = 'link-sent-modal';
    modal.className = 'payment-modal';
    modal.innerHTML = `
        <div class="payment-modal-content" style="max-width: 500px; text-align: center;">
            <span class="payment-close">&times;</span>
            <div style="font-size: 3rem; margin-bottom: 1rem;">✉️</div>
            <h2 style="color: #c19a5d; margin-bottom: 1rem;">Payment Link Sent!</h2>
            <p style="margin-bottom: 1.5rem;">We've sent a secure payment link to:</p>
            <p style="background: #f9f9f9; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; font-weight: 600;">${email}</p>
            <p style="color: #666; font-size: 0.9rem;">The link will expire in 24 hours. Please check your inbox and spam folder.</p>
            <button class="payment-btn-primary" style="margin-top: 1.5rem;" onclick="this.closest('.payment-modal').remove()">Close</button>
        </div>
    `;

    document.body.appendChild(modal);
    window.squarePayment.addPaymentStyles();

    modal.querySelector('.payment-close').onclick = () => modal.remove();
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
}

// Helper function to open payment modal with email check
async function openPaymentModal(amount, description) {
    try {
        // Show email check modal first
        const emailResult = await window.squarePayment.showEmailCheckModal(amount, description);

        if (emailResult.action === 'send-link') {
            // Send payment link to existing user
            const linkResponse = await fetch('/api/payments/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: emailResult.amount,
                    description: emailResult.description,
                    customerEmail: emailResult.email,
                    customerName: emailResult.email.split('@')[0]
                })
            });

            const linkData = await linkResponse.json();

            if (linkResponse.ok && linkData.success) {
                // Show success message
                showPaymentLinkSentModal(emailResult.email);
            } else {
                alert(`Failed to send payment link: ${linkData.error || 'Unknown error'}`);
            }
        } else if (emailResult.action === 'require-registration') {
            // Redirect to registration with context
            const params = new URLSearchParams({
                tab: 'register',
                redirect: encodeURIComponent('/services.html'),
                purchase: encodeURIComponent(JSON.stringify({
                    amount: emailResult.amount,
                    description: emailResult.description,
                    email: emailResult.email
                }))
            });
            window.location.href = `/login.html?${params.toString()}`;
        }
    } catch (err) {
        // User cancelled or error
        console.log('Payment flow cancelled:', err.message);
    }
}
