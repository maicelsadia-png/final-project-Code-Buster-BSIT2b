// products-data.js - Fetch and display products from backend API

console.log('🔥 products-data.js loaded');

document.addEventListener('DOMContentLoaded', async function() {
    await loadProducts();
});

async function loadProducts() {
    const productList = document.getElementById('productList');
    const loadingElement = document.getElementById('loadingProducts');
    
    if (!productList) {
        console.error('productList element not found!');
        return;
    }
    
    try {
        console.log('Fetching products from API...');
        const response = await fetch('http://localhost:3000/api/products');
        
        if (!response.ok) {
            throw new Error('Failed to fetch products');
        }
        
        const products = await response.json();
        console.log('Products received:', products.length);
        
        // Remove loading spinner
        if (loadingElement) loadingElement.remove();
        
        if (products.length === 0) {
            productList.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-box-open fa-3x mb-3"></i>
                    <h4>No products found</h4>
                    <p>Check back later for new items!</p>
                </div>
            `;
            return;
        }
        
        // Clear and display products
        productList.innerHTML = '';
        
        products.forEach(product => {
            const productCard = `
                <div class="col-12 col-sm-6 col-md-4 col-lg-3 product-item" 
                     data-category="${product.category || 'food'}" 
                     data-price="${product.price}" 
                     data-name="${product.name}">
                    <div class="product-card">
                        <div class="product-img">
                            <img src="img/products/${product.image || 'placeholder.jpg'}" alt="${product.name}" class="img-fluid" onerror="this.src='img/products/placeholder.jpg'">
                        </div>
                        <div class="product-body">
                            <h5>${escapeHtml(product.name)}</h5>
                            <p class="product-desc">${escapeHtml(product.description || 'Delicious product')}</p>
                            <div class="product-price">₱${product.price.toFixed(2)}</div>
                            <div class="product-stock">In Stock: ${product.stock || 0}</div>
                            <div class="product-buttons">
                                <a href="product-details.html?id=${product._id}" class="btn btn-sm btn-outline">View Details</a>
                                <button class="btn btn-sm btn-primary add-to-cart" 
                                        data-product-id="${product._id}" 
                                        data-product-name="${escapeHtml(product.name)}" 
                                        data-product-price="${product.price}">
                                    <i class="fas fa-cart-plus"></i> Add
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            productList.insertAdjacentHTML('beforeend', productCard);
        });
        
        console.log('✅ Products displayed successfully');
        
        // Re-initialize add to cart buttons
        if (typeof initAddToCartButtons === 'function') {
            initAddToCartButtons();
        }
        
    } catch (error) {
        console.error('Error loading products:', error);
        if (loadingElement) {
            loadingElement.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-exclamation-triangle fa-3x mb-3"></i>
                    <h4>Failed to load products</h4>
                    <p>Error: ${error.message}</p>
                    <p>Make sure backend is running on port 3000.</p>
                    <button class="btn btn-primary mt-3" onclick="location.reload()">Try Again</button>
                </div>
            `;
        }
    }
}

// Helper function to escape HTML
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}