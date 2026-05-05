// register.js - Handles user registration

document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    if (!registerForm) return;

    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const termsCheckbox = document.getElementById('termsCheckbox');

        // Validations
        if (!name || !email || !password || !confirmPassword) {
            showNotification('Please fill in all fields', 'error');
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showNotification('Please enter a valid email address', 'error');
            return;
        }

        if (password.length < 6) {
            showNotification('Password must be at least 6 characters', 'error');
            return;
        }

        if (password !== confirmPassword) {
            showNotification('Passwords do not match!', 'error');
            return;
        }

        if (termsCheckbox && !termsCheckbox.checked) {
            showNotification('Please accept the Terms and Conditions', 'error');
            return;
        }

        const submitBtn = registerForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registering...';

        try {
            const response = await fetch('http://localhost:3000/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                showNotification('Registration successful! Redirecting to login...', 'success');
                registerForm.reset();
                setTimeout(() => { window.location.href = 'login.html'; }, 2000);
            } else {
                showNotification(data.message || 'Registration failed. Please try again.', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        } catch (error) {
            console.error('Register error:', error);
            showNotification('Connection error. Make sure the backend server is running on port 3000.', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    });
});
