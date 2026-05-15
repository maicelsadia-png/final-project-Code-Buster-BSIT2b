// register.js - Restaurant ordering system registration

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('registerForm');
    if (!form) return;

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const name            = document.getElementById('name')?.value.trim();
        const username        = document.getElementById('username')?.value.trim();
        const email           = document.getElementById('email')?.value.trim();
        const password        = document.getElementById('password')?.value;
        const confirmPassword = document.getElementById('confirmPassword')?.value;
        const terms           = document.getElementById('termsCheckbox');

        if (!name || !email || !password || !confirmPassword) {
            showNotification('Please fill in all required fields', 'error'); return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showNotification('Please enter a valid email address', 'error'); return;
        }
        if (password.length < 6) {
            showNotification('Password must be at least 6 characters', 'error'); return;
        }
        if (password !== confirmPassword) {
            showNotification('Passwords do not match!', 'error'); return;
        }
        if (terms && !terms.checked) {
            showNotification('Please accept the Terms and Conditions', 'error'); return;
        }

        const btn = form.querySelector('button[type="submit"]');
        const orig = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Creating Account...';

        try {
            const response = await fetch((window.API_BASE_URL||(window.BACKEND_URL||'http://localhost:3000')+'/api')+'/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, username, email, password })
            });
            const data = await response.json();

            if (response.ok && data.success) {
                showNotification('Account created! Redirecting to login...', 'success');
                form.reset();
                setTimeout(() => { window.location.href = 'login.html'; }, 2000);
            } else {
                showNotification(data.message || 'Registration failed. Please try again.', 'error');
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
