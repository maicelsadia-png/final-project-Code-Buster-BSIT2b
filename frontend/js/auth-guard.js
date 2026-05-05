// auth-guard.js - Auth utilities, route protection, and navbar updater

const API_BASE = 'http://localhost:3000/api';

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
    const cart = JSON.parse(localStorage.getItem('quickServeCart') || '[]');
    const count = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    document.querySelectorAll('.cart-badge').forEach(badge => {
        badge.textContent = count;
    });
}

// ─── LOGOUT ──────────────────────────────────────────────────────────────────
function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    localStorage.removeItem('quickServeCart');
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
document.addEventListener('DOMContentLoaded', () => {
    updateNavbarDropdown();
    updateCartBadge();
});
