// auth-guard.js - Auth utilities, route protection, and navbar updater



// ─── GET AUTH HEADERS ────────────────────────────────────────────────────────
function getAuthHeaders() {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (userId) headers['x-user-id'] = userId;
    return headers;
}

// ─── CART BADGE ──────────────────────────────────────────────────────────────
function updateCartBadge() {
    var uid   = localStorage.getItem('userId');
    var key   = uid ? 'quickServeCart_' + uid : 'quickServeCart_guest';
    var cart  = JSON.parse(localStorage.getItem(key) || '[]');
    var count = cart.reduce(function(sum, item) { return sum + (item.quantity || 1); }, 0);
    document.querySelectorAll('.cart-badge').forEach(function(badge) {
        badge.textContent = count;
    });
}

// ─── LOGOUT ──────────────────────────────────────────────────────────────────
function logout() {
    // Clear auth keys on logout (keep user-scoped cart so items persist on re-login)
    localStorage.removeItem('quickServeCart');   // legacy/guest key
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userUsername');
    window.location.href = 'index.html';
}

// ─── LOGIN GUARD ─────────────────────────────────────────────────────────────
function requireLogin() {
    if (localStorage.getItem('isLoggedIn') !== 'true') {
        sessionStorage.setItem('redirectAfterLogin', window.location.href);
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// ─── ADMIN GUARD ─────────────────────────────────────────────────────────────
function requireAdmin() {
    if (localStorage.getItem('isLoggedIn') !== 'true' ||
        localStorage.getItem('userRole') !== 'admin') {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// ─── NAVBAR DROPDOWN ─────────────────────────────────────────────────────────
function updateNavbarDropdown() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const userName   = localStorage.getItem('userName') || 'Account';
    const userRole   = localStorage.getItem('userRole');

    const userDropdown = document.getElementById('userDropdown');
    const dropdownMenu = document.getElementById('dropdownMenu')
                      || document.querySelector('#userDropdown + .dropdown-menu')
                      || document.querySelector('.navbar .dropdown-menu');

    if (!userDropdown || !dropdownMenu) return;

    if (isLoggedIn) {
        userDropdown.innerHTML = `<i class="fas fa-user${userRole === 'admin' ? '-shield' : ''}"></i> ${userName}`;

        if (userRole === 'admin') {
            dropdownMenu.innerHTML = `
                <li><a class="dropdown-item" href="admin.html"><i class="fas fa-tachometer-alt me-2"></i>Admin Panel</a></li>
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item" href="#" onclick="logout()"><i class="fas fa-sign-out-alt me-2"></i>Logout</a></li>
            `;
        } else {
            dropdownMenu.innerHTML = `
                <li><a class="dropdown-item" href="dashboard.html"><i class="fas fa-tachometer-alt me-2"></i>Dashboard</a></li>
                <li><a class="dropdown-item" href="profile.html"><i class="fas fa-user me-2"></i>Profile</a></li>
                <li><a class="dropdown-item" href="orders.html"><i class="fas fa-box me-2"></i>My Orders</a></li>
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item" href="#" onclick="logout()"><i class="fas fa-sign-out-alt me-2"></i>Logout</a></li>
            `;
        }
    } else {
        userDropdown.innerHTML = `<i class="fas fa-user"></i> Account`;
        dropdownMenu.innerHTML = `
            <li><a class="dropdown-item" href="login.html"><i class="fas fa-sign-in-alt me-2"></i>Login</a></li>
            <li><a class="dropdown-item" href="register.html"><i class="fas fa-user-plus me-2"></i>Register</a></li>
        `;
    }
}

// ─── AUTO-INIT ────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    // Bug 3 fix: Validate session on every page load to clear stale logins
    var token  = localStorage.getItem('token');
    var stored = localStorage.getItem('isLoggedIn');
    if (stored === 'true' && token) {
        try {
            var r = await fetch((window.API_BASE_URL||'http://localhost:3000/api')+'/auth/me', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            if (!r.ok) {
                // Token expired or invalid - force logout
                ['token','userId','userName','userEmail','userRole','userUsername','isLoggedIn']
                    .forEach(k => localStorage.removeItem(k));
            } else {
                // Session is valid - keep existing localStorage values (set by login.js)
                // Only update userId/role in case they changed server-side
                var data = await r.json();
                if (data && data._id) localStorage.setItem('userId', data._id);
                if (data && data.role) localStorage.setItem('userRole', data.role);
                // DO NOT overwrite userName - login.js sets it correctly from login response
            }
        } catch(e) { /* Network offline - keep existing session */ }
    } else if (stored === 'true' && !token) {
        // isLoggedIn flag with no token = stale ghost session, clear it
        ['token','userId','userName','userEmail','userRole','userUsername','isLoggedIn']
            .forEach(k => localStorage.removeItem(k));
    }
    updateNavbarDropdown();
    updateCartBadge();
    initLogoRedirectGuard();
});

// ─── LOGO REDIRECT (Fix #6) ───────────────────────────────────────────────────
function initLogoRedirectGuard() {
    const logos = document.querySelectorAll('.navbar-brand');
    logos.forEach(logo => {
        logo.addEventListener('click', function(e) {
            const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
            const role = localStorage.getItem('userRole');
            if (isLoggedIn) {
                e.preventDefault();
                window.location.href = role === 'admin' ? 'admin.html' : 'dashboard.html';
            }
        });
    });
}

// ─── FIX #3: REAL-TIME ORDER READY NOTIFICATION (Polling) ────────────────────
// Runs globally on every page — checks every 30s if any order is "ready"
// Uses localStorage to avoid re-notifying the same order

var _orderPollInterval = null;

function startOrderNotificationPolling() {
    if (!localStorage.getItem('isLoggedIn') === 'true') return;
    if (_orderPollInterval) return; // already running

    // Poll immediately, then every 30 seconds
    checkForReadyOrders();
    _orderPollInterval = setInterval(checkForReadyOrders, 30000);
}

function stopOrderNotificationPolling() {
    if (_orderPollInterval) {
        clearInterval(_orderPollInterval);
        _orderPollInterval = null;
    }
}

async function checkForReadyOrders() {
    var userId = localStorage.getItem('userId');
    var token  = localStorage.getItem('token');
    if (!userId || !token) return;

    try {
        var headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token };
        headers['x-user-id'] = userId;

        var response = await fetch((window.API_BASE_URL||'http://localhost:3000/api')+'/orders/user/' + userId, { headers: headers });
        if (!response.ok) return;

        var orders = await response.json();

        // Check for orders that just became "ready" and haven't been notified yet
        var notifiedKey = 'qs_notified_ready_' + userId;
        var notified    = JSON.parse(localStorage.getItem(notifiedKey) || '[]');

        orders.forEach(function(order) {
            if (order.status === 'ready' && !notified.includes(order._id)) {
                // Show global ready notification
                showReadyOrderNotification(order);
                notified.push(order._id);
                localStorage.setItem(notifiedKey, JSON.stringify(notified));
            }
        });

    } catch(e) {
        // Silently fail — polling is non-critical
    }
}

function showReadyOrderNotification(order) {
    // Remove any existing ready notification
    var existing = document.getElementById('qs-ready-notification');
    if (existing) existing.remove();

    var orderNum = order.orderNumber || ('#' + (order._id || '').slice(-6));

    var div = document.createElement('div');
    div.id = 'qs-ready-notification';
    div.style.cssText = [
        'position:fixed', 'bottom:24px', 'right:24px', 'z-index:99999',
        'background:#27AE60', 'color:#fff', 'border-radius:16px',
        'padding:18px 22px', 'box-shadow:0 8px 32px rgba(0,0,0,.25)',
        'max-width:340px', 'font-family:"Segoe UI",sans-serif',
        'animation:qs-slide-up .4s ease-out'
    ].join(';');

    div.innerHTML = [
        '<div style="display:flex;align-items:flex-start;gap:14px;">',
            '<i class="fas fa-bell fa-lg" style="margin-top:3px;flex-shrink:0;"></i>',
            '<div style="flex:1;">',
                '<strong style="font-size:1rem;display:block;margin-bottom:4px;">',
                    '🎉 Your order is ready!',
                '</strong>',
                '<div style="font-size:.88rem;opacity:.92;margin-bottom:10px;">',
                    'Order <strong>' + orderNum + '</strong> is ready for pickup.<br>',
                    'Please proceed to the counter to claim your order.',
                '</div>',
                '<div style="display:flex;gap:8px;">',
                    '<a href="orders.html" style="background:rgba(255,255,255,.25);color:#fff;',
                        'text-decoration:none;padding:5px 14px;border-radius:20px;font-size:.82rem;font-weight:600;">',
                        'View Order',
                    '</a>',
                    '<button onclick="document.getElementById(\'qs-ready-notification\').remove();" ',
                        'style="background:rgba(255,255,255,.15);border:none;color:#fff;',
                        'padding:5px 14px;border-radius:20px;font-size:.82rem;cursor:pointer;">',
                        'Dismiss',
                    '</button>',
                '</div>',
            '</div>',
        '</div>'
    ].join('');

    document.body.appendChild(div);

    // Auto-dismiss after 60 seconds
    setTimeout(function() {
        var el = document.getElementById('qs-ready-notification');
        if (el) el.style.animation = 'qs-slide-down .4s ease-in forwards';
        setTimeout(function() { var el = document.getElementById('qs-ready-notification'); if(el) el.remove(); }, 400);
    }, 60000);
}

// Inject notification animation CSS
(function() {
    if (document.getElementById('qs-ready-notif-styles')) return;
    var s = document.createElement('style');
    s.id = 'qs-ready-notif-styles';
    s.textContent = '@keyframes qs-slide-up{from{transform:translateY(120%);opacity:0}to{transform:translateY(0);opacity:1}}' +
                    '@keyframes qs-slide-down{from{transform:translateY(0);opacity:1}to{transform:translateY(120%);opacity:0}}';
    document.head.appendChild(s);
})();

// Start polling when logged in, stop on logout
document.addEventListener('DOMContentLoaded', function() {
    if (localStorage.getItem('isLoggedIn') === 'true' && localStorage.getItem('userRole') !== 'admin') {
        startOrderNotificationPolling();
    }
});
