// login.js - Handles user login with JWT

document.addEventListener('DOMContentLoaded', function() {
    // If already logged in, redirect
    if (localStorage.getItem('isLoggedIn') === 'true') {
        const role = localStorage.getItem('userRole');
        window.location.href = role === 'admin' ? 'admin.html' : 'dashboard.html';
        return;
    }

    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        if (!email || !password) {
            showNotification('Please enter email and password', 'error');
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showNotification('Please enter a valid email address', 'error');
            return;
        }

        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';

        try {
            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Store session data in localStorage
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('token', data.token);
                localStorage.setItem('userId', data.userId);
                localStorage.setItem('userName', data.name);
                localStorage.setItem('userEmail', data.email);
                localStorage.setItem('userRole', data.role || 'user');

                showNotification(`Welcome back, ${data.name}!`, 'success');

                // Redirect based on role
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
                showNotification(data.message || 'Invalid email or password.', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        } catch (error) {
            console.error('Login error:', error);
            showNotification('Connection error. Make sure the backend server is running on port 3000.', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    });
});
