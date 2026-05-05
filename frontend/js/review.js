// review.js - Handles product review submission

document.addEventListener('DOMContentLoaded', function() {
    const reviewForm = document.getElementById('reviewForm');
    if (!reviewForm) return;

    // Pre-fill username if logged in
    const userName = localStorage.getItem('userName');
    const reviewNameInput = document.getElementById('reviewName');
    if (reviewNameInput && userName) reviewNameInput.value = userName;

    reviewForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const rating = parseInt(document.getElementById('reviewRating')?.value);
        const comment = document.getElementById('reviewComment')?.value.trim();
        const productId = document.getElementById('productIdReview')?.value;

        if (!comment) {
            showNotification('Please write your review', 'error');
            return;
        }

        if (!rating || rating < 1 || rating > 5) {
            showNotification('Please select a rating (1-5)', 'error');
            return;
        }

        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');

        if (!userId) {
            showNotification('Please login first to submit a review', 'error');
            setTimeout(() => { window.location.href = 'login.html'; }, 1500);
            return;
        }

        const submitBtn = reviewForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

        try {
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            headers['x-user-id'] = userId;

            const response = await fetch('http://localhost:3000/api/reviews', {
                method: 'POST',
                headers,
                body: JSON.stringify({ productId, rating, comment })
            });

            const data = await response.json();

            if (response.ok) {
                showNotification('Review submitted successfully! Thank you.', 'success');
                reviewForm.reset();
                if (reviewNameInput && userName) reviewNameInput.value = userName;
                setTimeout(() => { location.reload(); }, 1500);
            } else {
                showNotification(data.message || 'Failed to submit review', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        } catch (error) {
            showNotification('Connection error. Backend must be running on port 3000.', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });
});
