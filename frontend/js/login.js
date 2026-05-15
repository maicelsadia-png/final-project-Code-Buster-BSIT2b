// login.js - Restaurant ordering system login

document.addEventListener('DOMContentLoaded', function() {
    if (localStorage.getItem('isLoggedIn') === 'true') {
        const role = localStorage.getItem('userRole');
        window.location.href = role === 'admin' ? 'admin.html' : 'dashboard.html';
        return;
    }

    const form = document.getElementById('loginForm');
    if (!form) return;

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const identifier = document.getElementById('email')?.value.trim() || document.getElementById('username')?.value.trim();
        const password   = document.getElementById('password')?.value;

        if (!identifier || !password) {
            showNotification('Please enter your email/username and password', 'error'); return;
        }

        const btn  = form.querySelector('button[type="submit"]');
        const orig = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Signing in...';

        try {
            const response = await fetch((window.API_BASE_URL||(window.BACKEND_URL||'http://localhost:3000')+'/api')+'/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: identifier, password })
            });
            const data = await response.json();

            if (response.ok && data.success) {
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('token',      data.token);
                localStorage.setItem('userId',     data.userId);
                localStorage.setItem('userName',   data.name);
                localStorage.setItem('userEmail',  data.email);
                localStorage.setItem('userRole',   data.role || 'user');
                if (data.username) localStorage.setItem('userUsername', data.username);

                showNotification(`Welcome back, ${data.name}!`, 'success');

                setTimeout(() => {
                    const redirect = sessionStorage.getItem('redirectAfterLogin');
                    sessionStorage.removeItem('redirectAfterLogin');
                    if (data.role === 'admin') {
                        window.location.href = 'admin.html';
                    } else if (redirect) {
                        window.location.href = redirect;
                    } else {
                        window.location.href = 'dashboard.html';
                    }
                }, 1200);
            } else {
                showNotification(data.message || 'Invalid credentials. Please try again.', 'error');
                btn.disabled = false;
                btn.innerHTML = orig;
            }
        } catch (error) {
            showNotification('Connection error. Make sure the backend is running on port 3000.', 'error');
            btn.disabled = false;
            btn.innerHTML = orig;
        }
    });
});
