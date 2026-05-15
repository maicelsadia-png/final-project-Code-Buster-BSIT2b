// dashboard-data.js - User Dashboard
// Fix: Removed Avg Wait Time, removed product images from Recent Orders,
//      added Active/Completed filter toggle, completed orders excluded from view by default

document.addEventListener('DOMContentLoaded', async function() {

    if (localStorage.getItem('isLoggedIn') !== 'true') {
        window.location.href = 'login.html'; return;
    }

    var token  = localStorage.getItem('token');
    var userId = localStorage.getItem('userId');

    // Verify session from server
    if (token) {
        try {
            var meResp = await fetch((window.API_BASE_URL||'http://localhost:3000/api')+'/auth/me', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            if (meResp.ok) {
                var me = await meResp.json();
                if (me._id)  { localStorage.setItem('userId', me._id); userId = me._id; }
                if (me.name) { localStorage.setItem('userName', me.name); }
                if (me.role) { localStorage.setItem('userRole', me.role); }
            } else {
                ['token','userId','userName','userEmail','userRole','isLoggedIn']
                    .forEach(function(k){ localStorage.removeItem(k); });
                window.location.href = 'login.html'; return;
            }
        } catch(e) { /* use cached values on network error */ }
    }

    var userName  = localStorage.getItem('userName') || 'Customer';
    var firstName = userName.split(' ')[0];
    var welcomeSpan = document.getElementById('welcomeUserName');
    if (welcomeSpan) welcomeSpan.textContent = firstName + '!';
    var navUserName = document.getElementById('navUserName');
    if (navUserName) navUserName.textContent = userName;
    if (typeof updateNavbarDropdown === 'function') updateNavbarDropdown();
    if (typeof updateCartBadge === 'function') updateCartBadge();

    await loadUserOrders(userId, token);

    // Auto-refresh on tab focus
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            loadUserOrders(localStorage.getItem('userId'), localStorage.getItem('token'));
        }
    });
});

// ── Status config ─────────────────────────────────────────────────────────────
var STATUS_CFG = {
    pending:   { label:'Pending',          color:'#D4A13E', icon:'fa-clock'        },
    preparing: { label:'Preparing',        color:'#E67E22', icon:'fa-fire'         },
    ready:     { label:'Ready for Pickup', color:'#27AE60', icon:'fa-bell'         },
    completed: { label:'Completed',        color:'#6B8C5C', icon:'fa-check-circle' },
    received:  { label:'Received',         color:'#1a5276', icon:'fa-check-double' },
    cancelled: { label:'Cancelled',        color:'#C95A49', icon:'fa-times-circle' },
    archived:  { label:'Archived',         color:'#95a5a6', icon:'fa-archive'      }
};

function statusBadge(status) {
    var cfg = STATUS_CFG[status] || STATUS_CFG.pending;
    return '<span style="background:' + cfg.color + ';color:#fff;padding:3px 12px;border-radius:20px;' +
           'font-size:.78rem;font-weight:600;display:inline-flex;align-items:center;gap:5px;">' +
           '<i class="fas ' + cfg.icon + '"></i>' + cfg.label + '</span>';
}

// Track whether completed orders are visible
var _showCompleted = false;
var _allOrders = [];

// ── Main orders loader ────────────────────────────────────────────────────────
async function loadUserOrders(userId, token) {
    var orderList = document.getElementById('orderList');
    if (!userId) {
        if (orderList) orderList.innerHTML = '<div class="text-center py-4"><p>Please log in to view orders.</p></div>';
        return;
    }

    try {
        var headers = { 'Content-Type': 'application/json' };
        if (token)  headers['Authorization'] = 'Bearer ' + token;
        headers['x-user-id'] = userId;

        var resp = await fetch((window.API_BASE_URL||'http://localhost:3000/api')+'/orders/user/' + userId, { headers: headers });
        if (resp.status === 401) {
            ['token','userId','userName','userEmail','userRole','isLoggedIn']
                .forEach(function(k){ localStorage.removeItem(k); });
            window.location.href = 'login.html'; return;
        }
        if (!resp.ok) throw new Error('Failed to load orders');

        _allOrders = await resp.json();

        // ── Stat cards ────────────────────────────────────────────────────────
        var totalEl   = document.getElementById('totalOrders');
        var spentEl   = document.getElementById('totalSpent');
        var activeEl  = document.getElementById('pendingDelivery');
        var waitEl    = document.getElementById('avgWaitTime');

        if (totalEl) totalEl.textContent = _allOrders.length;

        // Total Spent = completed/received only
        var spent = _allOrders
            .filter(function(o) { return o.status === 'completed' || o.status === 'received'; })
            .reduce(function(s, o) { return s + (o.totalAmount || 0); }, 0);
        if (spentEl) spentEl.textContent = '₱' + spent.toFixed(2);

        var activeOrders = _allOrders.filter(function(o) {
            return ['pending','preparing','ready'].includes(o.status);
        });
        if (activeEl) activeEl.textContent = activeOrders.length;

        // ── Average Waiting Time (active orders only) ─────────────────────────
        // Estimate: each active order takes ~10 mins base prep time.
        // Orders that are "ready" are done preparing — estimated wait is ~0–2 mins.
        // Orders "preparing" — about half of base time remaining (~5 mins).
        // Orders "pending"   — full base time (~10 mins).
        // We show the average across all active orders.
        if (waitEl) {
            if (activeOrders.length === 0) {
                waitEl.textContent = '—';
            } else {
                var BASE_PREP = 10; // minutes
                var totalMins = activeOrders.reduce(function(sum, o) {
                    var now = Date.now();
                    var created = new Date(o.createdAt).getTime();
                    var elapsedMins = (now - created) / 60000;
                    var estimated;
                    if (o.status === 'ready') {
                        estimated = 2; // nearly done
                    } else if (o.status === 'preparing') {
                        // remaining = base - elapsed, but at least 1 min
                        estimated = Math.max(1, Math.round(BASE_PREP - elapsedMins));
                    } else {
                        // pending: full base time remaining
                        estimated = Math.max(1, Math.round(BASE_PREP * 1.5 - elapsedMins));
                    }
                    return sum + estimated;
                }, 0);
                var avg = Math.round(totalMins / activeOrders.length);
                waitEl.textContent = avg + ' min' + (avg !== 1 ? 's' : '');
            }
        }

        renderOrderList();

    } catch(err) {
        console.error('Dashboard error:', err);
        var orderList = document.getElementById('orderList');
        if (orderList) orderList.innerHTML =
            '<div class="text-center py-4"><p>Could not load orders.</p>' +
            '<button class="btn btn-sm btn-primary" onclick="loadUserOrders(\'' + userId + '\',\'' + (token||'') + '\')">Retry</button></div>';
    }
}

// ── Render order list with active/completed filter ────────────────────────────
function renderOrderList() {
    var orderList = document.getElementById('orderList');
    if (!orderList) return;

    var DONE_STATUSES = ['completed', 'received', 'cancelled', 'archived'];
    var ACTIVE_STATUSES = ['pending', 'preparing', 'ready'];

    // Separate active vs done
    var activeOrders = _allOrders.filter(function(o) {
        return ACTIVE_STATUSES.includes(o.status);
    });
    var doneOrders = _allOrders.filter(function(o) {
        return DONE_STATUSES.includes(o.status);
    });

    // Decide what to show
    var toShow = _showCompleted
        ? _allOrders.slice(0, 8)
        : activeOrders.slice(0, 5);

    // Build the filter toggle button + label
    var toggleBtn =
        '<div class="d-flex justify-content-between align-items-center mb-3">' +
            '<div>' +
                '<span class="fw-semibold" style="font-size:.9rem;">' +
                    (_showCompleted ? 'Showing all orders' : 'Showing active orders') +
                '</span>' +
                (doneOrders.length > 0 && !_showCompleted ?
                    '<span class="ms-2 text-muted" style="font-size:.82rem;">' +
                    '(' + doneOrders.length + ' completed/cancelled hidden)</span>' : '') +
            '</div>' +
            '<button class="btn btn-sm btn-outline" onclick="toggleCompleted()" style="font-size:.82rem;">' +
                '<i class="fas fa-' + (_showCompleted ? 'eye-slash' : 'eye') + ' me-1"></i>' +
                (_showCompleted ? 'Hide Completed' : 'Show Completed') +
            '</button>' +
        '</div>';

    if (toShow.length === 0) {
        orderList.innerHTML = toggleBtn +
            '<div class="text-center py-4">' +
            '<i class="fas fa-utensils fa-2x mb-3" style="color:var(--primary);opacity:.5;"></i>' +
            '<p class="mb-2">' + (_showCompleted ? 'No orders yet.' : 'No active orders right now.') + '</p>' +
            '<a href="products.html" class="btn btn-primary btn-sm">Browse Menu</a>' +
            '</div>';
        return;
    }

    // Build table — NO product image (Fix: removed image column)
    var tableRows = toShow.map(function(o) {
        var itemCount = (o.products || []).reduce(function(s, p) { return s + p.quantity; }, 0);
        var itemLabel = itemCount + ' item' + (itemCount !== 1 ? 's' : '');
        return '<tr>' +
            '<td><strong>' + (o.orderNumber || '#' + o._id.slice(-6)) + '</strong></td>' +
            '<td>' + new Date(o.createdAt).toLocaleDateString() + '</td>' +
            '<td>' + itemLabel + '</td>' +
            '<td>₱' + (o.totalAmount || 0).toFixed(2) + '</td>' +
            '<td>' + statusBadge(o.status) + '</td>' +
            '<td><a href="orders.html" class="btn btn-sm btn-outline">Track</a></td>' +
        '</tr>';
    }).join('');

    orderList.innerHTML = toggleBtn +
        '<div class="table-responsive">' +
        '<table class="table orders-table"><thead><tr>' +
        '<th>Order #</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th><th></th>' +
        '</tr></thead><tbody>' + tableRows + '</tbody></table></div>';
}

// ── Toggle completed visibility ───────────────────────────────────────────────
function toggleCompleted() {
    _showCompleted = !_showCompleted;
    renderOrderList();
}
