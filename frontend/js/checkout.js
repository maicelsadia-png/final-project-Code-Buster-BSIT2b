// checkout.js - Handles order placement

document.addEventListener('DOMContentLoaded', function() {
    if (localStorage.getItem('isLoggedIn') !== 'true') {
        window.location.href = 'login.html';
        return;
    }

    const checkoutForm = document.getElementById('checkoutForm');
    if (!checkoutForm) return;

    checkoutForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const totalAmountEl = document.getElementById('hiddenTotalAmount');
        const cartItemsEl = document.getElementById('hiddenCartItems');
        const totalAmount = parseFloat(totalAmountEl?.value || 0);
        let cartItems = [];

        try {
            cartItems = JSON.parse(cartItemsEl?.value || '[]');
        } catch (err) {
            console.error('Cart parse error:', err);
        }

        if (!cartItems || cartItems.length === 0) {
            showNotification('Your cart is empty. Please add items first.', 'error');
            window.location.href = 'products.html';
            return;
        }

        if (isNaN(totalAmount) || totalAmount <= 0) {
            showNotification('Invalid order total', 'error');
            return;
        }

        const userId = localStorage.getItem('userId');
        const token = localStorage.getItem('token');

        if (!userId) {
            showNotification('Please login first to place an order', 'error');
            window.location.href = 'login.html';
            return;
        }

        // Get form values
        const paymentMethod = document.getElementById('paymentMethod')?.value || 'Cash on Delivery';
        const street = document.getElementById('deliveryStreet')?.value.trim() || '';
        const city = document.getElementById('deliveryCity')?.value.trim() || '';
        const postalCode = document.getElementById('deliveryPostal')?.value.trim() || '';

        const submitBtn = checkoutForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

        try {
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            headers['x-user-id'] = userId;

            const response = await fetch((window.API_BASE_URL||(window.BACKEND_URL||'http://localhost:3000')+'/api')+'/orders', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    userId,
                    products: cartItems,
                    totalAmount,
                    paymentMethod,
                    shippingAddress: { street, city, postalCode }
                })
            });

            const data = await response.json();

            if (response.ok) {
                showNotification('Order placed successfully!', 'success');
                // Clear both legacy and user-scoped cart keys
                var _uid = localStorage.getItem('userId');
                if (_uid) localStorage.removeItem('quickServeCart_' + _uid);
                localStorage.removeItem('quickServeCart');
                setTimeout(() => { window.location.href = 'orders.html'; }, 1500);
            } else {
                showNotification(data.message || 'Failed to place order', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        } catch (error) {
            showNotification('Connection error. Backend must be running on port 3000.', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });
});
