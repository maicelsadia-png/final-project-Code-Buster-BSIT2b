// profile.js - Fix #5: Profile editing now works with username

document.addEventListener('DOMContentLoaded', function() {
    if (localStorage.getItem('isLoggedIn') !== 'true') {
        window.location.href = 'login.html'; return;
    }

    var userId    = localStorage.getItem('userId');
    var userName  = localStorage.getItem('userName');
    var userEmail = localStorage.getItem('userEmail');

    // Pre-fill from localStorage immediately (no flash)
    var nameInput  = document.getElementById('fullName');
    var emailInput = document.getElementById('email');
    if (nameInput  && userName)  nameInput.value  = userName;
    if (emailInput && userEmail) emailInput.value = userEmail;

    // Load full profile from backend (fills username, phone, etc.)
    loadUserProfile(userId);

    // ── Profile update form ────────────────────────────────────────────────
    var profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            var name     = document.getElementById('fullName')?.value.trim();
            var email    = document.getElementById('email')?.value.trim();
            var username = document.getElementById('username')?.value.trim() || '';
            var phone    = document.getElementById('phone')?.value.trim()    || '';

            if (!name || !email) {
                showNotification('Full name and email are required', 'error'); return;
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                showNotification('Please enter a valid email address', 'error'); return;
            }

            var btn = profileForm.querySelector('button[type="submit"]');
            var orig = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Saving...';

            try {
                var token = localStorage.getItem('token');
                var headers = { 'Content-Type': 'application/json' };
                if (token)  headers['Authorization'] = 'Bearer ' + token;
                headers['x-user-id'] = userId;

                var response = await fetch((window.API_BASE_URL||'http://localhost:3000/api')+'/users/' + userId, {
                    method: 'PUT',
                    headers: headers,
                    body: JSON.stringify({ name: name, email: email, username: username, phone: phone })
                });
                var data = await response.json();

                if (response.ok) {
                    localStorage.setItem('userName',   name);
                    localStorage.setItem('userEmail',  email);
                    if (username) localStorage.setItem('userUsername', username);
                    showNotification('Profile updated successfully!', 'success');
                    if (typeof updateNavbarDropdown === 'function') updateNavbarDropdown();
                    // Update welcome name if on dashboard
                    var ws = document.getElementById('welcomeUserName');
                    if (ws) ws.textContent = name.split(' ')[0] + '!';
                } else {
                    showNotification(data.message || 'Failed to update profile', 'error');
                }
            } catch (err) {
                showNotification('Connection error. Please try again.', 'error');
            } finally {
                btn.disabled = false;
                btn.innerHTML = orig;
            }
        });
    }

    // ── Password change form ───────────────────────────────────────────────
    var passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            var currentPassword = document.getElementById('currentPassword')?.value;
            var newPassword     = document.getElementById('newPassword')?.value;
            var confirmPassword = document.getElementById('confirmPassword')?.value;

            if (!currentPassword || !newPassword || !confirmPassword) {
                showNotification('Please fill in all password fields', 'error'); return;
            }
            if (newPassword.length < 6) {
                showNotification('New password must be at least 6 characters', 'error'); return;
            }
            if (newPassword !== confirmPassword) {
                showNotification('New passwords do not match', 'error'); return;
            }

            var btn = passwordForm.querySelector('button[type="submit"]');
            var orig = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Updating...';

            try {
                var token = localStorage.getItem('token');
                var headers = { 'Content-Type': 'application/json' };
                if (token) headers['Authorization'] = 'Bearer ' + token;
                headers['x-user-id'] = userId;

                var response = await fetch((window.API_BASE_URL||'http://localhost:3000/api')+'/users/' + userId + '/password', {
                    method: 'PUT',
                    headers: headers,
                    body: JSON.stringify({ currentPassword: currentPassword, newPassword: newPassword })
                });
                var data = await response.json();

                if (response.ok) {
                    showNotification('Password changed! Please login again.', 'success');
                    setTimeout(function() { logout(); }, 2000);
                } else {
                    showNotification(data.message || 'Failed to change password', 'error');
                    btn.disabled = false;
                    btn.innerHTML = orig;
                }
            } catch (err) {
                showNotification('Connection error. Please try again.', 'error');
                btn.disabled = false;
                btn.innerHTML = orig;
            }
        });
    }
});

async function loadUserProfile(userId) {
    if (!userId) return;
    try {
        var token   = localStorage.getItem('token');
        var headers = {};
        if (token) headers['Authorization'] = 'Bearer ' + token;
        headers['x-user-id'] = userId;

        var res = await fetch((window.API_BASE_URL||'http://localhost:3000/api')+'/users/' + userId, { headers: headers });
        if (!res.ok) return;
        var user = await res.json();

        // Fill all fields with live data from DB
        var nameInput  = document.getElementById('fullName');
        var emailInput = document.getElementById('email');
        var unameInput = document.getElementById('username');
        var phoneInput = document.getElementById('phone');
        var roleInput  = document.getElementById('role');
        var memberSince= document.getElementById('memberSince');

        if (nameInput  && user.name)     nameInput.value  = user.name;
        if (emailInput && user.email)    emailInput.value = user.email;
        if (unameInput && user.username) unameInput.value = user.username;
        if (phoneInput && user.phone)    phoneInput.value = user.phone;
        if (roleInput)                   roleInput.value  = user.role === 'admin' ? 'Admin' : 'Customer';
        if (memberSince && user.createdAt) {
            memberSince.value = new Date(user.createdAt).toLocaleDateString('en-US', {year:'numeric',month:'long',day:'numeric'});
        }

        // Update localStorage
        if (user.name)     localStorage.setItem('userName',    user.name);
        if (user.email)    localStorage.setItem('userEmail',   user.email);
        if (user.username) localStorage.setItem('userUsername',user.username);

    } catch(err) {
        console.error('Profile load error:', err);
    }
}
