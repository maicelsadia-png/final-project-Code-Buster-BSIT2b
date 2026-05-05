// dashboard-data.js - Dynamic user dashboard

document.addEventListener('DOMContentLoaded', async function() {
    // Auth guard - redirect if not logged in
    if (localStorage.getItem('isLoggedIn') !== 'true') {
        window.location.href = 'login.html';
        return;
    }

    // Update welcome name
    const userName = localStorage.getItem('userName') || 'User';
    const welcomeSpan = document.getElementById('welcomeUserName');
    if (welcomeSpan) {
        welcomeSpan.textContent = userName.split(' ')[0] + '!';
    }

    await loadUserOrders();
});

async function loadUserOrders() {
    const orderList = document.getElementById('orderList');
    const userId = localStorage.getItem('userId');
    const token  = localStorage.getItem('token');

    if (!orderList) return;

    // No userId — show login prompt
    if (!userId) {
        orderList.innerHTML = `
            <div class="text-center py-4">
                <p>Please <a href="login.html">login</a> to view your orders.</p>
            </div>`;
        return;
    }

    try {
        const headers = { 'Content-Type': 'application/json' };
        if (token)  headers['Authorization'] = `Bearer ${token}`;
        headers['x-user-id'] = userId;

        const response = await fetch(`http://localhost:3000/api/orders/user/${userId}`, { headers });

        if (response.status === 401) { logout(); return; }
        if (!response.ok) throw new Error('Failed to fetch orders');

        const orders = await response.json();

        // Update stat cards from real data
        const totalOrdersElem    = document.getElementById('totalOrders');
        const totalSpentElem     = document.getElementById('totalSpent');
        const pendingDeliveryElem = document.getElementById('pendingDelivery');

        if (totalOrdersElem) totalOrdersElem.textContent = orders.length;

        const totalSpent = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        if (totalSpentElem) totalSpentElem.textContent = `₱${totalSpent.toFixed(2)}`;

        const pendingCount = orders.filter(o => o.status === 'pending' || o.status === 'shipped').length;
        if (pendingDeliveryElem) pendingDeliveryElem.textContent = pendingCount;

        // Show empty state if no orders
        if (!orders || orders.length === 0) {
            orderList.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-shopping-bag fa-2x mb-3" style="color: var(--primary);"></i>
                    <p class="mb-2">No orders yet.</p>
                    <a href="products.html" class="btn btn-primary btn-sm">Start Shopping</a>
                </div>`;
            return;
        }

        // Show up to 5 most recent orders
        const recentOrders = orders.slice(0, 5);

        orderList.innerHTML = `
            <div class="table-responsive">
                <table class="table orders-table">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Date</th>
                            <th>Total</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${recentOrders.map(order => `
                            <tr>
                                <td>#${order._id.slice(-6)}</td>
                                <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                                <td>₱${(order.totalAmount || 0).toFixed(2)}</td>
                                <td><span class="badge-${order.status || 'pending'}">${order.status || 'pending'}</span></td>
                                <td><a href="orders.html" class="btn btn-sm btn-outline">View</a></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>`;

    } catch (error) {
        console.error('Dashboard error:', error);
        if (orderList) {
            orderList.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-exclamation-triangle mb-2" style="color:var(--danger);"></i>
                    <p class="mb-2">Could not load orders.</p>
                    <button class="btn btn-sm btn-primary" onclick="loadUserOrders()">Retry</button>
                </div>`;
        }
    }
}
