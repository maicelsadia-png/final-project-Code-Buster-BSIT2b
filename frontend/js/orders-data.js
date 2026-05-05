// orders-data.js - Fetch and display user order history

document.addEventListener('DOMContentLoaded', async function() {
    if (localStorage.getItem('isLoggedIn') !== 'true') {
        window.location.href = 'login.html';
        return;
    }
    await loadAllOrders();
});

async function loadAllOrders() {
    await loadOrdersByStatus('all', 'ordersList');
    await loadOrdersByStatus('pending', 'pendingOrdersList');
    await loadOrdersByStatus('shipped', 'shippedOrdersList');
    await loadOrdersByStatus('delivered', 'deliveredOrdersList');
    await loadOrdersByStatus('cancelled', 'cancelledOrdersList');
}

async function loadOrdersByStatus(status, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');

    try {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        if (userId) headers['x-user-id'] = userId;

        const response = await fetch(`http://localhost:3000/api/orders/user/${userId}`, { headers });

        if (response.status === 401) { logout(); return; }
        if (!response.ok) throw new Error('Failed to fetch orders');

        let orders = await response.json();

        if (status !== 'all') {
            orders = orders.filter(order => order.status === status);
        }

        if (orders.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-box-open fa-3x mb-3" style="color: var(--primary);"></i>
                    <h4>No ${status !== 'all' ? status : ''} orders</h4>
                    <p>You have no ${status !== 'all' ? status : ''} orders yet.</p>
                    ${status === 'all' ? '<a href="products.html" class="btn btn-primary">Start Shopping</a>' : ''}
                </div>`;
            return;
        }

        container.innerHTML = '';

        orders.forEach(order => {
            const orderCard = `
                <div class="order-card" id="order-${order._id}">
                    <div class="order-header">
                        <div class="order-info">
                            <span class="order-number">Order #${order._id.slice(-8)}</span>
                            <span class="order-date"><i class="far fa-calendar-alt me-1"></i>${new Date(order.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div class="order-status">
                            <span class="badge-${order.status}">${order.status}</span>
                        </div>
                    </div>
                    <div class="order-body">
                        <div class="row">
                            <div class="col-md-8">
                                <div class="order-items">
                                    ${order.products.map(item => `
                                        <div class="order-item">
                                            <img src="img/products/${item.image || 'placeholder.jpg'}" alt="${item.name}" class="order-item-img" onerror="this.src='img/products/placeholder.jpg'">
                                            <div class="order-item-details">
                                                <h6>${item.name || 'Product'}</h6>
                                                <p>Qty: ${item.quantity} × ₱${(item.price || 0).toFixed(2)}</p>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="order-summary">
                                    <p><strong>Total:</strong> ₱${(order.totalAmount || 0).toFixed(2)}</p>
                                    <p><strong>Payment:</strong> ${order.paymentMethod || 'Cash on Delivery'}</p>
                                    <div class="order-actions">
                                        <a href="products.html" class="btn btn-sm btn-outline">Reorder</a>
                                        ${order.status === 'pending' ? `<button class="btn btn-sm btn-danger cancel-order-btn" data-id="${order._id}">Cancel Order</button>` : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`;
            container.insertAdjacentHTML('beforeend', orderCard);
        });

        // Attach cancel order handlers
        container.querySelectorAll('.cancel-order-btn').forEach(btn => {
            btn.addEventListener('click', async function() {
                if (!confirm('Are you sure you want to cancel this order?')) return;
                const orderId = this.getAttribute('data-id');
                try {
                    const headers = { 'Content-Type': 'application/json' };
                    if (token) headers['Authorization'] = `Bearer ${token}`;
                    if (userId) headers['x-user-id'] = userId;

                    const res = await fetch(`http://localhost:3000/api/orders/${orderId}/cancel`, {
                        method: 'PUT', headers
                    });
                    if (res.ok) {
                        showNotification('Order cancelled successfully', 'info');
                        setTimeout(() => loadAllOrders(), 1000);
                    } else {
                        const d = await res.json();
                        showNotification(d.message || 'Could not cancel order', 'error');
                    }
                } catch (err) {
                    showNotification('Connection error', 'error');
                }
            });
        });

    } catch (error) {
        console.error('Orders error:', error);
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-exclamation-triangle fa-3x mb-3"></i>
                <h4>Failed to load orders</h4>
                <p>Make sure the backend server is running on port 3000.</p>
                <button class="btn btn-primary" onclick="loadAllOrders()">Retry</button>
            </div>`;
    }
}
