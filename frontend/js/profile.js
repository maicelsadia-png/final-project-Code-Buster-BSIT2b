// profile.js - Handles user profile update and password change

document.addEventListener('DOMContentLoaded', function() {
    if (localStorage.getItem('isLoggedIn') !== 'true') {
        window.location.href = 'login.html';
        return;
    }

    // Pre-fill profile form with current data
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName');
    const userEmail = localStorage.getItem('userEmail');

    const fullNameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('email');
    if (fullNameInput && userName) fullNameInput.value = userName;
    if (emailInput && userEmail) emailInput.value = userEmail;

    // Load full profile from backend
    loadUserProfile(userId);

    // Handle profile update
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const name = document.getElementById('fullName')?.value.trim();
            const email = document.getElementById('email')?.value.trim();
            const phone = document.getElementById('phone')?.value.trim() || '';

            if (!name || !email) {
                showNotification('Name and email are required', 'error');
                return;
            }

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                showNotification('Please enter a valid email address', 'error');
                return;
            }

            const submitBtn = profileForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

            try {
                const token = localStorage.getItem('token');
                const headers = { 'Content-Type': 'application/json' };
                if (token) headers['Authorization'] = `Bearer ${token}`;
                headers['x-user-id'] = userId;

                const response = await fetch(`http://localhost:3000/api/users/${userId}`, {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify({ name, email, phone })
                });

                const data = await response.json();

                if (response.ok) {
                    localStorage.setItem('userName', name);
                    localStorage.setItem('userEmail', email);
                    showNotification('Profile updated successfully!', 'success');
                    updateNavbarDropdown();
                } else {
                    showNotification(data.message || 'Failed to update profile', 'error');
                }
            } catch (error) {
                showNotification('Connection error. Backend must be running on port 3000.', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }

    // Handle password change
    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const currentPassword = document.getElementById('currentPassword')?.value;
            const newPassword = document.getElementById('newPassword')?.value;
            const confirmPassword = document.getElementById('confirmPassword')?.value;

            if (!currentPassword || !newPassword || !confirmPassword) {
                showNotification('Please fill in all password fields', 'error');
                return;
            }

            if (newPassword.length < 6) {
                showNotification('New password must be at least 6 characters', 'error');
                return;
            }

            if (newPassword !== confirmPassword) {
                showNotification('New passwords do not match', 'error');
                return;
            }

            const submitBtn = passwordForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';

            try {
                const token = localStorage.getItem('token');
                const headers = { 'Content-Type': 'application/json' };
                if (token) headers['Authorization'] = `Bearer ${token}`;
                headers['x-user-id'] = userId;

                const response = await fetch(`http://localhost:3000/api/users/${userId}/password`, {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify({ currentPassword, newPassword })
                });

                const data = await response.json();

                if (response.ok) {
                    showNotification('Password changed! Please login again.', 'success');
                    setTimeout(() => {
                        logout();
                    }, 2000);
                } else {
                    showNotification(data.message || 'Failed to change password', 'error');
                }
            } catch (error) {
                showNotification('Connection error. Backend must be running on port 3000.', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }
});

async function loadUserProfile(userId) {
    if (!userId) return;
    try {
        const token = localStorage.getItem('token');
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        headers['x-user-id'] = userId;

        const res = await fetch(`http://localhost:3000/api/users/${userId}`, { headers });
        if (!res.ok) return;
        const user = await res.json();

        // Fill in additional fields if they exist
        const phoneInput = document.getElementById('phone');
        if (phoneInput && user.phone) phoneInput.value = user.phone;

        const streetInput = document.getElementById('street');
        if (streetInput && user.address?.street) streetInput.value = user.address.street;

        const cityInput = document.getElementById('city');
        if (cityInput && user.address?.city) cityInput.value = user.address.city;

        const postalInput = document.getElementById('postalCode');
        if (postalInput && user.address?.postalCode) postalInput.value = user.address.postalCode;

    } catch (err) {
        console.error('Profile load error:', err);
    }
}
