// product-details-data.js - Fetch and display single product details

var BACKEND_URL = 'https://quickserve-j4u8.onrender.com';

// Resolve product image to a public URL
function getProductImageSrc(product) {
    if (product.image && product.image.startsWith('/uploads/')) {
        return BACKEND_URL + product.image;
    }
    if (product.imageData && product.imageData.startsWith('data:')) {
        return product.imageData;
    }
    if (product.image && product.image !== 'placeholder.jpg') {
        return 'img/products/' + product.image;
    }
    return 'img/products/placeholder.jpg';
}


document.addEventListener('DOMContentLoaded', async function() {
    await loadProductDetails();
    await loadProductReviews();
    await loadRelatedProducts();
});

async function loadProductDetails() {
    const container = document.getElementById('productDetailsContainer');
    if (!container) return;
    
    // Get product ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    if (!productId) {
        container.innerHTML = `<div class="alert alert-danger">Product ID not found</div>`;
        return;
    }
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/products/${productId}`);
        
        if (!response.ok) {
            throw new Error('Product not found');
        }
        
        const product = await response.json();
        
        // Update page title
        document.title = `QuickServe | ${product.name}`;
        
        // Update breadcrumb
        const breadcrumb = document.getElementById('breadcrumbProductName');
        if (breadcrumb) breadcrumb.textContent = product.name;
        
        // Display product details
        container.innerHTML = `
            <div class="row">
                <div class="col-lg-6 mb-4">
                    <div class="product-main-image">
                        <img src="${getProductImageSrc(product)}" onerror="this.src='img/products/placeholder.jpg'" alt="${product.name}" class="img-fluid">
                    </div>
                </div>
                <div class="col-lg-6">
                    <div class="product-info">
                        <h1 class="product-title">${product.name}</h1>
                        <div class="product-price">₱${product.price.toFixed(2)}</div>

                        <div class="product-description">
                            <h4>Description</h4>
                            <p>${product.description || 'No description available.'}</p>
                        </div>
                        <div class="product-quantity">
                            <label for="quantity">Quantity:</label>
                            <div class="quantity-selector">
                                <button type="button" class="qty-btn" id="qtyMinus">-</button>
                                <input type="number" id="quantity" name="quantity" value="1" min="1" max="99">
                                <button type="button" class="qty-btn" id="qtyPlus">+</button>
                            </div>
                        </div>
                        <button class="btn btn-primary btn-lg w-100 add-to-cart mt-3" 
                                data-product-id="${product._id}" 
                                data-product-name="${product.name}" 
                                data-product-price="${product.price}"
                                data-image="${getProductImageSrc(product)}">
                            <i class="fas fa-cart-plus me-2"></i>Add to Cart
                        </button>
                        <div class="product-meta mt-4">
                            <p><strong>Category:</strong> ${product.category || 'General'}</p>

                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Re-initialize quantity selectors and add to cart
        initQuantitySelectors();
        if (typeof initAddToCartButtons === 'function') {
            initAddToCartButtons();
        }
        
        // Update hidden form fields for review
        const productIdReview = document.getElementById('productIdReview');
        if (productIdReview) productIdReview.value = product._id;
        
        console.log('✅ Product details loaded successfully');
        
    } catch (error) {
        console.error('Error loading product:', error);
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-exclamation-triangle fa-3x mb-3"></i>
                <h4>Product not found</h4>
                <a href="products.html" class="btn btn-primary">Back to Products</a>
            </div>
        `;
    }
}

async function loadProductReviews() {
    const reviewsContainer = document.getElementById('reviewsContainer');
    if (!reviewsContainer) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    if (!productId) return;
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/reviews/product/${productId}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch reviews');
        }
        
        const reviews = await response.json();
        
        if (!reviews || reviews.length === 0) {
            reviewsContainer.innerHTML = `<div class="text-center py-4">No reviews yet. Be the first to review!</div>`;
            return;
        }
        
        reviewsContainer.innerHTML = '';
        
        reviews.forEach(review => {
            const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
            const reviewHtml = `
                <div class="review-card">
                    <div class="review-header">
                        <div class="reviewer-info">
                            <strong>${review.userName || 'Anonymous'}</strong>
                            <div class="review-stars">${stars}</div>
                        </div>
                        <span class="review-date">${new Date(review.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p class="review-text">"${review.comment}"</p>
                </div>
            `;
            reviewsContainer.insertAdjacentHTML('beforeend', reviewHtml);
        });
        
        console.log('✅ Reviews loaded successfully');
        
    } catch (error) {
        console.error('Error loading reviews:', error);
        reviewsContainer.innerHTML = `<div class="text-center py-4">Failed to load reviews.</div>`;
    }
}

async function loadRelatedProducts() {
    const relatedContainer = document.getElementById('relatedProductsContainer');
    if (!relatedContainer) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const currentProductId = urlParams.get('id');
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/products`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch related products');
        }
        
        let products = await response.json();
        
        // Filter out current product and get first 4
        products = products.filter(p => p._id !== currentProductId).slice(0, 4);
        
        if (products.length === 0) {
            relatedContainer.innerHTML = `<div class="col-12 text-center">No related products found.</div>`;
            return;
        }
        
        relatedContainer.innerHTML = '';
        
        products.forEach(product => {
            const productHtml = `
                <div class="col-md-3">
                    <div class="product-card">
                        <div class="product-img">
                            <img src="${getProductImageSrc(product)}" onerror="this.src='img/products/placeholder.jpg'" alt="${product.name}" class="img-fluid">
                        </div>
                        <div class="product-body">
                            <h5>${product.name}</h5>
                            <div class="product-price">₱${product.price.toFixed(2)}</div>
                            <a href="product-details.html?id=${product._id}" class="btn btn-sm btn-primary w-100">View Details</a>
                        </div>
                    </div>
                </div>
            `;
            relatedContainer.insertAdjacentHTML('beforeend', productHtml);
        });
        
        console.log('✅ Related products loaded successfully');
        
    } catch (error) {
        console.error('Error loading related products:', error);
        relatedContainer.innerHTML = `<div class="col-12 text-center">Failed to load recommendations.</div>`;
    }
}

function initQuantitySelectors() {
    const qtyMinus = document.getElementById('qtyMinus');
    const qtyPlus = document.getElementById('qtyPlus');
    const quantityInput = document.getElementById('quantity');
    
    if (qtyMinus && qtyPlus && quantityInput) {
        // Remove old listeners by cloning
        const newMinus = qtyMinus.cloneNode(true);
        const newPlus = qtyPlus.cloneNode(true);
        qtyMinus.parentNode.replaceChild(newMinus, qtyMinus);
        qtyPlus.parentNode.replaceChild(newPlus, qtyPlus);
        
        const finalMinus = document.getElementById('qtyMinus');
        const finalPlus = document.getElementById('qtyPlus');
        const finalInput = document.getElementById('quantity');
        
        finalMinus.onclick = () => {
            let val = parseInt(finalInput.value);
            if (val > 1) finalInput.value = val - 1;
        };
        
        finalPlus.onclick = () => {
            let val = parseInt(finalInput.value);
            let max = parseInt(finalInput.max) || 99;
            if (val < max) finalInput.value = val + 1;
        };
    }
}