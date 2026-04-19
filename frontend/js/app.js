/**
 * ========================================
 * QuickServe Ordering System
 * Frontend JavaScript - Phase 3 (FIXED)
 * Theme: Warm & Cozy
 * 
 * FIXES:
 * - Cart items now properly display on cart page
 * - Cart count updates correctly when adding/deleting
 * - Empty cart message shows when cart is empty
 * - Order summary updates dynamically
 * - Cart images now show for products 1-4
 * ========================================
 */

// ========================================
// Wait for DOM to be fully loaded
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('QuickServe Frontend Loaded - Phase 3 (FIXED)');
    
    // Load cart from localStorage FIRST
    loadCartFromStorage();
    
    // Initialize all components
    initCartCounter();
    initQuantitySelectors();
    initAddToCartButtons();
    initRemoveCartItems();
    initCartPageControls();
    initCancelOrderButtons();
    initProfileMenu();
    initPasswordValidation();
    initProductFilters();
    
    // Update cart display if on cart page
    if (window.location.pathname.includes('cart.html')) {
        renderCartPage();
    }
});

// ========================================
// Global Variables
// ========================================
let cart = [];

// ========================================
// Cart Functions
// ========================================

function addToCart(id, name, price, quantity = 1) {
    // Check if product already in cart
    const existingItem = cart.find(item => item.id == id);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: id,
            name: name,
            price: price,
            quantity: quantity
        });
    }
    
    // Save to localStorage
    saveCartToStorage();
    
    // Update UI
    updateCartBadges();
    
    // Re-render cart page if on cart page
    if (window.location.pathname.includes('cart.html')) {
        renderCartPage();
    }
    
    showNotification(`${name} added to cart!`, 'success');
    console.log('Cart:', cart);
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id != productId);
    saveCartToStorage();
    updateCartBadges();
    
    // Re-render cart page if on cart page
    if (window.location.pathname.includes('cart.html')) {
        renderCartPage();
    }
    
    showNotification('Item removed from cart', 'info');
}

function updateCartQuantity(productId, newQuantity) {
    const item = cart.find(item => item.id == productId);
    if (item) {
        if (newQuantity <= 0) {
            removeFromCart(productId);
        } else {
            item.quantity = newQuantity;
            saveCartToStorage();
            updateCartBadges();
            
            if (window.location.pathname.includes('cart.html')) {
                renderCartPage();
            }
        }
    }
}

function getCartTotal() {
    let subtotal = 0;
    cart.forEach(item => {
        subtotal += item.price * item.quantity;
    });
    return subtotal;
}

function saveCartToStorage() {
    localStorage.setItem('quickServeCart', JSON.stringify(cart));
}

function loadCartFromStorage() {
    const savedCart = localStorage.getItem('quickServeCart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
    } else {
        cart = [];
    }
    updateCartBadges();
}

function updateCartBadges() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartBadges = document.querySelectorAll('.cart-badge');
    cartBadges.forEach(badge => {
        badge.textContent = totalItems;
    });
}

function renderCartPage() {
    const cartContainer = document.getElementById('cartItemsContainer');
    const emptyCartMessage = document.getElementById('emptyCartMessage');
    const cartItemsCard = document.querySelector('.cart-items-card');
    const cartItemsCount = document.getElementById('cartItemsCount');
    
    if (!cartContainer) return;
    
    if (cart.length === 0) {
        // Show empty cart message
        if (cartItemsCard) cartItemsCard.style.display = 'none';
        if (emptyCartMessage) emptyCartMessage.classList.remove('d-none');
        if (cartItemsCount) cartItemsCount.textContent = '0';
        
        // Update order summary to zero
        updateOrderSummaryDisplay(0);
    } else {
        // Hide empty cart message
        if (cartItemsCard) cartItemsCard.style.display = 'block';
        if (emptyCartMessage) emptyCartMessage.classList.add('d-none');
        if (cartItemsCount) cartItemsCount.textContent = cart.length;
        
        // Clear and rebuild cart items
        cartContainer.innerHTML = '';
        
        cart.forEach(item => {
            // ========================================
            // MAP PRODUCT ID TO ACTUAL IMAGE FILENAME
            // ========================================
            let productImage = 'placeholder.jpg';
            if (item.id == 1) productImage = 'Signature-Coffee.jpg';
            else if (item.id == 2) productImage = 'Gourmet-Burger.jpg';
            else if (item.id == 3) productImage = 'Italian-Pizza.jpg';
            else if (item.id == 4) productImage = 'Iced-Caramel-Macchiato.jpg';
            
            const cartItemHTML = `
                <div class="cart-item" data-product-id="${item.id}">
                    <div class="row align-items-center">
                        <div class="col-md-2 col-4">
                            <img src="img/products/${productImage}" alt="${escapeHtml(item.name)}" class="cart-item-img">
                        </div>
                        <div class="col-md-4 col-8">
                            <h5 class="cart-item-title">${escapeHtml(item.name)}</h5>
                            <p class="cart-item-price">₱${item.price.toFixed(2)} each</p>
                        </div>
                        <div class="col-md-3 col-5">
                            <div class="cart-quantity">
                                <button class="qty-btn-mini qty-minus" data-id="${item.id}">-</button>
                                <input type="number" value="${item.quantity}" min="1" class="cart-qty-input" data-id="${item.id}">
                                <button class="qty-btn-mini qty-plus" data-id="${item.id}">+</button>
                            </div>
                        </div>
                        <div class="col-md-2 col-4">
                            <p class="cart-item-subtotal">₱${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                        <div class="col-md-1 col-3">
                            <button class="remove-item" data-id="${item.id}">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            cartContainer.insertAdjacentHTML('beforeend', cartItemHTML);
        });
        
        // Re-attach event listeners for cart controls
        attachCartItemEvents();
        
        // Update order summary
        const subtotal = getCartTotal();
        updateOrderSummaryDisplay(subtotal);
    }
}

function updateOrderSummaryDisplay(subtotal) {
    const deliveryFee = 50;
    const tax = subtotal * 0.12;
    const total = subtotal + deliveryFee + tax;
    
    const subtotalElement = document.getElementById('subtotalAmount');
    const taxElement = document.getElementById('taxAmount');
    const totalElement = document.getElementById('totalAmount');
    const hiddenTotalInput = document.getElementById('hiddenTotalAmount');
    const hiddenCartItems = document.getElementById('hiddenCartItems');
    
    if (subtotalElement) subtotalElement.textContent = `₱${subtotal.toFixed(2)}`;
    if (taxElement) taxElement.textContent = `₱${tax.toFixed(2)}`;
    if (totalElement) totalElement.textContent = `₱${total.toFixed(2)}`;
    if (hiddenTotalInput) hiddenTotalInput.value = total.toFixed(2);
    
    // Update hidden cart items JSON
    if (hiddenCartItems) {
        const cartItemsJson = cart.map(item => ({
            productId: item.id,
            quantity: item.quantity
        }));
        hiddenCartItems.value = JSON.stringify(cartItemsJson);
    }
}

function attachCartItemEvents() {
    // Minus buttons
    document.querySelectorAll('.qty-minus').forEach(btn => {
        btn.removeEventListener('click', handleMinusClick);
        btn.addEventListener('click', handleMinusClick);
    });
    
    // Plus buttons
    document.querySelectorAll('.qty-plus').forEach(btn => {
        btn.removeEventListener('click', handlePlusClick);
        btn.addEventListener('click', handlePlusClick);
    });
    
    // Quantity inputs
    document.querySelectorAll('.cart-qty-input').forEach(input => {
        input.removeEventListener('change', handleQtyChange);
        input.addEventListener('change', handleQtyChange);
    });
    
    // Remove buttons
    document.querySelectorAll('.remove-item').forEach(btn => {
        btn.removeEventListener('click', handleRemoveClick);
        btn.addEventListener('click', handleRemoveClick);
    });
}

function handleMinusClick(e) {
    const id = e.currentTarget.getAttribute('data-id');
    const input = document.querySelector(`.cart-qty-input[data-id="${id}"]`);
    if (input) {
        let newValue = parseInt(input.value) - 1;
        if (newValue >= 1) {
            input.value = newValue;
            updateCartQuantity(id, newValue);
        }
    }
}

function handlePlusClick(e) {
    const id = e.currentTarget.getAttribute('data-id');
    const input = document.querySelector(`.cart-qty-input[data-id="${id}"]`);
    if (input) {
        let newValue = parseInt(input.value) + 1;
        input.value = newValue;
        updateCartQuantity(id, newValue);
    }
}

function handleQtyChange(e) {
    const id = e.currentTarget.getAttribute('data-id');
    let newValue = parseInt(e.currentTarget.value);
    if (isNaN(newValue) || newValue < 1) {
        newValue = 1;
        e.currentTarget.value = 1;
    }
    updateCartQuantity(id, newValue);
}

function handleRemoveClick(e) {
    const id = e.currentTarget.getAttribute('data-id');
    removeFromCart(id);
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

// ========================================
// Cart Counter
// ========================================
function initCartCounter() {
    updateCartBadges();
}

// ========================================
// Cart Page Controls
// ========================================
function initCartPageControls() {
    if (window.location.pathname.includes('cart.html')) {
        renderCartPage();
    }
}

// ========================================
// Quantity Selectors (Product Details)
// ========================================
function initQuantitySelectors() {
    const qtyMinus = document.getElementById('qtyMinus');
    const qtyPlus = document.getElementById('qtyPlus');
    const quantityInput = document.getElementById('quantity');
    
    if (qtyMinus && qtyPlus && quantityInput) {
        qtyMinus.addEventListener('click', () => {
            let value = parseInt(quantityInput.value);
            if (value > 1) {
                quantityInput.value = value - 1;
            }
        });
        
        qtyPlus.addEventListener('click', () => {
            let value = parseInt(quantityInput.value);
            quantityInput.value = value + 1;
        });
    }
}

// ========================================
// Add to Cart Buttons
// ========================================
function initAddToCartButtons() {
    const addButtons = document.querySelectorAll('.add-to-cart, .add-to-cart-quick');
    
    addButtons.forEach(btn => {
        btn.removeEventListener('click', addToCartHandler);
        btn.addEventListener('click', addToCartHandler);
    });
}

function addToCartHandler(e) {
    e.preventDefault();
    
    const productId = this.getAttribute('data-product-id') || this.getAttribute('data-id');
    const productName = this.getAttribute('data-product-name') || this.getAttribute('data-name');
    const productPrice = parseFloat(this.getAttribute('data-product-price') || this.getAttribute('data-price'));
    
    let quantity = 1;
    const quantityInput = document.getElementById('quantity');
    if (quantityInput) {
        quantity = parseInt(quantityInput.value);
    }
    
    addToCart(productId, productName, productPrice, quantity);
}

// ========================================
// Remove Cart Items (Legacy - kept for compatibility)
// ========================================
function initRemoveCartItems() {
    // This is now handled by attachCartItemEvents and renderCartPage
    // Kept for compatibility with existing code
}

// ========================================
// Product Filters (Products Page)
// ========================================
function initProductFilters() {
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const sortFilter = document.getElementById('sortFilter');
    const resetBtn = document.getElementById('resetFilters');
    const productsGrid = document.getElementById('productsGrid');
    const noResults = document.getElementById('noResults');
    
    if (!productsGrid) return;
    
    function filterProducts() {
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        const category = categoryFilter ? categoryFilter.value : 'all';
        const sort = sortFilter ? sortFilter.value : 'default';
        
        let products = Array.from(document.querySelectorAll('.product-item'));
        
        products = products.filter(product => {
            const name = product.getAttribute('data-name') || '';
            return name.toLowerCase().includes(searchTerm);
        });
        
        if (category !== 'all') {
            products = products.filter(product => {
                return product.getAttribute('data-category') === category;
            });
        }
        
        if (sort !== 'default') {
            products.sort((a, b) => {
                if (sort === 'price-asc') {
                    return parseFloat(a.getAttribute('data-price')) - parseFloat(b.getAttribute('data-price'));
                } else if (sort === 'price-desc') {
                    return parseFloat(b.getAttribute('data-price')) - parseFloat(a.getAttribute('data-price'));
                } else if (sort === 'name') {
                    const nameA = a.getAttribute('data-name') || '';
                    const nameB = b.getAttribute('data-name') || '';
                    return nameA.localeCompare(nameB);
                }
                return 0;
            });
        }
        
        // Show/hide products
        const allProducts = Array.from(document.querySelectorAll('.product-item'));
        allProducts.forEach(product => {
            product.style.display = '';
        });
        
        allProducts.forEach(product => {
            if (!products.includes(product)) {
                product.style.display = 'none';
            }
        });
        
        if (noResults) {
            const visibleProducts = products.filter(p => p.style.display !== 'none');
            if (visibleProducts.length === 0) {
                if (productsGrid) productsGrid.style.display = 'none';
                noResults.classList.remove('d-none');
            } else {
                if (productsGrid) productsGrid.style.display = '';
                noResults.classList.add('d-none');
            }
        }
    }
    
    if (searchInput) searchInput.addEventListener('input', filterProducts);
    if (categoryFilter) categoryFilter.addEventListener('change', filterProducts);
    if (sortFilter) sortFilter.addEventListener('change', filterProducts);
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            if (categoryFilter) categoryFilter.value = 'all';
            if (sortFilter) sortFilter.value = 'default';
            filterProducts();
        });
    }
}

// ========================================
// Cancel Order Buttons
// ========================================
function initCancelOrderButtons() {
    const cancelButtons = document.querySelectorAll('.cancel-order');
    
    cancelButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            if (confirm('Are you sure you want to cancel this order?')) {
                const orderCard = this.closest('.order-card');
                if (orderCard) {
                    const statusSpan = orderCard.querySelector('.order-status span');
                    if (statusSpan) {
                        statusSpan.className = 'badge-cancelled';
                        statusSpan.textContent = 'Cancelled';
                    }
                    this.remove();
                    showNotification('Order cancelled successfully', 'warning');
                }
            }
        });
    });
}

// ========================================
// Profile Menu Navigation
// ========================================
function initProfileMenu() {
    const menuItems = document.querySelectorAll('.profile-menu-item');
    const sections = document.querySelectorAll('.profile-content-section');
    
    if (menuItems.length > 0) {
        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = item.getAttribute('data-section');
                
                menuItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                
                sections.forEach(section => {
                    section.classList.remove('active');
                    if (section.id === targetId) {
                        section.classList.add('active');
                    }
                });
            });
        });
    }
}

// ========================================
// Password Validation (Register/Profile)
// ========================================
function initPasswordValidation() {
    const passwordForm = document.getElementById('passwordForm');
    
    if (passwordForm) {
        passwordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const newPassword = document.getElementById('newPassword');
            const confirmPassword = document.getElementById('confirmPassword');
            
            if (newPassword && confirmPassword) {
                if (newPassword.value !== confirmPassword.value) {
                    showNotification('Passwords do not match!', 'error');
                    return false;
                }
                
                if (newPassword.value.length < 6) {
                    showNotification('Password must be at least 6 characters', 'error');
                    return false;
                }
            }
            
            showNotification('Password updated successfully!', 'success');
            this.reset();
        });
    }
    
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const password = document.getElementById('password');
            const confirmPassword = document.getElementById('confirmPassword');
            const termsCheckbox = document.getElementById('termsCheckbox');
            
            if (password && confirmPassword) {
                if (password.value !== confirmPassword.value) {
                    showNotification('Passwords do not match!', 'error');
                    return false;
                }
                
                if (password.value.length < 6) {
                    showNotification('Password must be at least 6 characters', 'error');
                    return false;
                }
            }
            
            if (termsCheckbox && !termsCheckbox.checked) {
                showNotification('Please accept the Terms and Conditions', 'error');
                return false;
            }
            
            showNotification('Registration successful! Redirecting to login...', 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        });
    }
    
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email');
            const password = document.getElementById('password');
            
            if (email && password) {
                if (!email.value.includes('@')) {
                    showNotification('Please enter a valid email address', 'error');
                    return false;
                }
                
                if (password.value.length === 0) {
                    showNotification('Please enter your password', 'error');
                    return false;
                }
            }
            
            showNotification('Login successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        });
    }
}

// ========================================
// Notification System
// ========================================
function showNotification(message, type = 'info') {
    let container = document.querySelector('.notification-container');
    
    if (!container) {
        container = document.createElement('div');
        container.className = 'notification-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
        `;
        document.body.appendChild(container);
    }
    
    const notification = document.createElement('div');
    
    let bgColor, icon;
    switch(type) {
        case 'success':
            bgColor = '#6B8C5C';
            icon = 'fa-check-circle';
            break;
        case 'error':
            bgColor = '#C95A49';
            icon = 'fa-exclamation-circle';
            break;
        case 'warning':
            bgColor = '#D4A13E';
            icon = 'fa-exclamation-triangle';
            break;
        default:
            bgColor = '#5A8498';
            icon = 'fa-info-circle';
    }
    
    notification.style.cssText = `
        background-color: ${bgColor};
        color: white;
        padding: 12px 20px;
        margin-bottom: 10px;
        border-radius: 12px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        gap: 10px;
        font-family: 'Segoe UI', sans-serif;
        animation: slideIn 0.3s ease-out;
        min-width: 250px;
        z-index: 10000;
    `;
    
    notification.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Add animation styles if not already present
if (!document.querySelector('#notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

// ========================================
// PHASE 4 PLACEHOLDER FUNCTIONS
// ========================================

const API_BASE_URL = 'http://localhost:5000/api';

async function loginUser(email, password) {
    console.log('Phase 4: Login API call to:', `${API_BASE_URL}/auth/login`);
}

async function registerUser(userData) {
    console.log('Phase 4: Register API call to:', `${API_BASE_URL}/auth/register`);
}

async function fetchProducts() {
    console.log('Phase 4: Fetch products from:', `${API_BASE_URL}/products`);
}

async function fetchProductById(productId) {
    console.log('Phase 4: Fetch product', productId);
}

async function addProduct(productData) {
    console.log('Phase 4: Add product to:', `${API_BASE_URL}/products`);
}

async function updateProduct(productId, productData) {
    console.log('Phase 4: Update product', productId);
}

async function deleteProduct(productId) {
    console.log('Phase 4: Delete product', productId);
}

async function createOrder(orderData) {
    console.log('Phase 4: Create order at:', `${API_BASE_URL}/orders`);
}

async function fetchUserOrders(userId) {
    console.log('Phase 4: Fetch orders for user:', `${API_BASE_URL}/orders/user/${userId}`);
}

async function updateOrderStatus(orderId, status) {
    console.log('Phase 4: Update order', orderId, 'status to:', status);
}

async function addReview(reviewData) {
    console.log('Phase 4: Add review to:', `${API_BASE_URL}/reviews`);
}

async function fetchProductReviews(productId) {
    console.log('Phase 4: Fetch reviews for product:', `${API_BASE_URL}/reviews/product/${productId}`);
}

async function deleteReview(reviewId) {
    console.log('Phase 4: Delete review', reviewId);
}

async function updateUserProfile(userId, userData) {
    console.log('Phase 4: Update user', userId, 'profile');
}

async function changePassword(userId, passwordData) {
    console.log('Phase 4: Change password for user:', userId);
}