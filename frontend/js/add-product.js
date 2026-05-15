// add-product.js - Admin: add product (used if loaded separately, but admin.html handles inline)

document.addEventListener('DOMContentLoaded', function() {
    const addProductForm = document.getElementById('addProductForm');
    if (!addProductForm) return;

    addProductForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        if (localStorage.getItem('userRole') !== 'admin') {
            showNotification('Only admins can add products', 'error');
            return;
        }

        const name = document.getElementById('productName')?.value.trim();
        const price = parseFloat(document.getElementById('productPrice')?.value);
        const description = document.getElementById('productDesc')?.value.trim();
        const stock = parseInt(document.getElementById('productStock')?.value);
        const image = document.getElementById('productImage')?.value.trim() || 'placeholder.jpg';
        const category = document.getElementById('productCategory')?.value || 'other';

        if (!name || isNaN(price) || !description || isNaN(stock)) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }

        if (price <= 0) {
            showNotification('Price must be greater than 0', 'error');
            return;
        }

        const submitBtn = addProductForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';

        try {
            const token = localStorage.getItem('token');
            const userId = localStorage.getItem('userId');
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            if (userId) headers['x-user-id'] = userId;

            const response = await fetch((window.API_BASE_URL || 'http://localhost:3000/api') + '/products', {
                method: 'POST',
                headers,
                body: JSON.stringify({ name, price, description, stock, image, category })
            });

            const data = await response.json();

            if (response.ok) {
                showNotification('Product added successfully!', 'success');
                addProductForm.reset();
                const modal = bootstrap.Modal.getInstance(document.getElementById('addProductModal'));
                if (modal) modal.hide();
                setTimeout(() => location.reload(), 1000);
            } else {
                showNotification(data.message || 'Failed to add product', 'error');
            }
        } catch (error) {
            showNotification('Connection error. Backend must be running on port 3000.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });
});
