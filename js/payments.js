/**
 * Square Payment Integration for Adria Cross
 * Handles payment form initialization and processing using Square Web Payments SDK
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
     */
    async processPayment(amount, customerEmail, description) {
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
                    description: description
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
     * Creates a payment modal with form
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

        // Create modal HTML
        const modal = document.createElement('div');
        modal.id = 'payment-modal';
        modal.className = 'payment-modal';
        modal.innerHTML = `
            <div class="payment-modal-content">
                <span class="payment-close">&times;</span>
                <h2>Complete Your Payment</h2>
                <p class="payment-amount">Amount: <strong>$${amount.toFixed(2)}</strong></p>
                <p class="payment-desc">${description}</p>
                
                <form id="payment-form">
                    <div class="payment-field">
                        <label for="payment-email">Email Address</label>
                        <input type="email" id="payment-email" required placeholder="your@email.com">
                    </div>
                    
                    <div class="payment-field">
                        <label>Card Details</label>
                        <div id="card-container"></div>
                    </div>
                    
                    <button type="submit" id="payment-submit" class="payment-btn">
                        ${buttonText}
                    </button>
                    
                    <div id="payment-status" class="payment-status"></div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        // Add styles
        this.addPaymentStyles();

        // Attach card
        this.attachCard('card-container');

        // Close button
        modal.querySelector('.payment-close').onclick = () => {
            modal.remove();
        };

        // Click outside to close
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };

        // Form submission
        document.getElementById('payment-form').onsubmit = async (e) => {
            e.preventDefault();

            const submitBtn = document.getElementById('payment-submit');
            const statusEl = document.getElementById('payment-status');
            const email = document.getElementById('payment-email').value;

            submitBtn.disabled = true;
            submitBtn.textContent = 'Processing...';
            statusEl.textContent = '';
            statusEl.className = 'payment-status';

            try {
                const result = await this.processPayment(amount, email, description);

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
                submitBtn.textContent = buttonText;
            }
        };

        return modal;
    }

    /**
     * Add payment modal styles
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
                background: rgba(0, 0, 0, 0.6);
                z-index: 10000;
                animation: fadeIn 0.3s ease;
            }

            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            .payment-modal-content {
                position: relative;
                max-width: 450px;
                margin: 5vh auto;
                background: white;
                border-radius: 16px;
                padding: 2rem;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                animation: slideUp 0.3s ease;
            }

            @keyframes slideUp {
                from { transform: translateY(20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }

            .payment-close {
                position: absolute;
                top: 1rem;
                right: 1.5rem;
                font-size: 2rem;
                cursor: pointer;
                color: #888;
                transition: color 0.3s;
            }

            .payment-close:hover {
                color: #333;
            }

            .payment-modal-content h2 {
                color: #c19a5d;
                margin-bottom: 0.5rem;
                font-family: 'Montserrat', sans-serif;
            }

            .payment-amount {
                font-size: 1.3rem;
                color: #333;
                margin-bottom: 0.5rem;
            }

            .payment-desc {
                color: #666;
                margin-bottom: 1.5rem;
            }

            .payment-field {
                margin-bottom: 1rem;
            }

            .payment-field label {
                display: block;
                font-weight: 600;
                color: #333;
                margin-bottom: 0.5rem;
                font-size: 0.9rem;
            }

            .payment-field input {
                width: 100%;
                padding: 0.8rem;
                border: 1px solid #ddd;
                border-radius: 8px;
                font-size: 1rem;
                transition: border-color 0.3s;
            }

            .payment-field input:focus {
                outline: none;
                border-color: #c19a5d;
            }

            #card-container {
                min-height: 50px;
                padding: 0.8rem;
                border: 1px solid #ddd;
                border-radius: 8px;
                background: #fafafa;
            }

            .payment-btn {
                width: 100%;
                padding: 1rem;
                background: linear-gradient(135deg, #d4a574 0%, #c19a5d 100%);
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 1.1rem;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.3s ease;
                margin-top: 1rem;
            }

            .payment-btn:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: 0 5px 20px rgba(193, 154, 93, 0.4);
            }

            .payment-btn:disabled {
                opacity: 0.7;
                cursor: not-allowed;
            }

            .payment-status {
                margin-top: 1rem;
                padding: 0.8rem;
                border-radius: 8px;
                text-align: center;
                font-weight: 600;
            }

            .payment-status.success {
                background: #d4edda;
                color: #155724;
            }

            .payment-status.error {
                background: #f8d7da;
                color: #721c24;
            }

            @media (max-width: 500px) {
                .payment-modal-content {
                    margin: 2vh 1rem;
                    padding: 1.5rem;
                }
            }
        `;
        document.head.appendChild(styles);
    }
}

// Create global instance
window.squarePayment = new SquarePayment();

// Helper function to open payment modal
function openPaymentModal(amount, description) {
    window.squarePayment.createPaymentModal({
        amount: amount,
        description: description,
        onSuccess: (result) => {
            console.log('Payment successful:', result);
        },
        onError: (err) => {
            console.error('Payment failed:', err);
        }
    });
}
