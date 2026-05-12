/**
 * QuickServe - app.js
 * Fix #2: Cart isolated per user via userId-scoped localStorage key
 */

document.addEventListener('DOMContentLoaded', function() {
    loadCartFromStorage();
    initCartCounter();
    initQuantitySelectors();
    initAddToCartButtons();
    initCancelOrderButtons();
    initProfileMenu();
    initPasswordValidation();
    initProductFilters();
    if (onCartPage()) renderCartPage();
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function onCartPage() { return window.location.pathname.includes('cart.html'); }

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, function(m) {
        return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m];
    });
}

// Fix #2: Cart key is scoped to userId so each user has their own cart
function getCartKey() {
    var uid = localStorage.getItem('userId');
    return uid ? 'quickServeCart_' + uid : 'quickServeCart_guest';
}

// ── Cart State ────────────────────────────────────────────────────────────────
var cart = [];

function loadCartFromStorage() {
    try {
        var key = getCartKey();
        var stored = localStorage.getItem(key);
        // Bug 5 fix: if user just logged in and has no scoped cart, check guest cart
        if (!stored || stored === '[]') {
            var guestCart = localStorage.getItem('quickServeCart_guest');
            if (guestCart && guestCart !== '[]') {
                stored = guestCart;
                localStorage.removeItem('quickServeCart_guest'); // consume guest cart on login
            }
        }
        cart = JSON.parse(stored || '[]');
    } catch(e) { cart = []; }
    updateCartBadges();
}

function saveCartToStorage() {
    // Bug 3 fix: strip base64 images before saving to avoid localStorage quota overflow
    var cartToSave = cart.map(function(item) {
        var img = item.image || '';
        // Strip base64 (too large for localStorage) - mark for re-fetch on next render
        if (img.startsWith('data:')) img = '__needsfetch__';
        return Object.assign({}, item, {image: img});
    });
    try {
        localStorage.setItem(getCartKey(), JSON.stringify(cartToSave));
        localStorage.setItem('quickServeCart', JSON.stringify(cartToSave));
    } catch(e) {
        // Quota exceeded - try saving without images
        var minimal = cartToSave.map(function(i){ return Object.assign({}, i, {image:'placeholder.jpg'}); });
        localStorage.setItem(getCartKey(), JSON.stringify(minimal));
        localStorage.setItem('quickServeCart', JSON.stringify(minimal));
    }
}

function updateCartBadges() {
    var total = cart.reduce(function(s,i){ return s+(i.quantity||1); }, 0);
    document.querySelectorAll('.cart-badge').forEach(function(b){ b.textContent=total; });
}

function getCartTotal() {
    return cart.reduce(function(s,i){ return s+i.price*(i.quantity||1); }, 0);
}

// ── Cart CRUD ─────────────────────────────────────────────────────────────────
function addToCart(id, name, price, quantity, image) {
    quantity = quantity || 1;
    image    = image    || null;
    var ex = cart.find(function(i){ return i.id==id; });
    if (ex) { ex.quantity+=quantity; if(image&&!ex.image) ex.image=image; }
    else cart.push({id:id,name:name,price:price,quantity:quantity,image:image});
    saveCartToStorage();
    updateCartBadges();
    if (onCartPage()) renderCartPage();
    showNotification(name+' added to cart!', 'success');
}

function removeFromCart(id) {
    cart = cart.filter(function(i){ return i.id!=id; });
    saveCartToStorage();
    updateCartBadges();
    if (onCartPage()) renderCartPage();
    showNotification('Item removed', 'info');
}

function updateCartQuantity(id, qty) {
    if (qty<=0) { removeFromCart(id); return; }
    var item = cart.find(function(i){ return i.id==id; });
    if (item) {
        item.quantity = qty;
        saveCartToStorage();
        updateCartBadges();
        updateOrderSummaryDisplay(getCartTotal());
    }
}

// Fix #1: Image resolution for cart items - handles /uploads/, full URLs, base64, relative, and local filenames
function resolveImage(item) {
    if (!item || !item.image) return 'img/products/placeholder.jpg';
    // Needs re-fetch (base64 was stripped to save localStorage space)
    if (item.image === '__needsfetch__') return 'img/products/placeholder.jpg';
    // Full URL (http://...) - use directly
    if (item.image.startsWith('http://') || item.image.startsWith('https://')) return item.image;
    // Backend /uploads/ path
    if (item.image.startsWith('/uploads/')) return 'https://quickserve-j4u8.onrender.com' + item.image;
    // Base64 (still in memory, not yet saved)
    if (item.image.startsWith('data:')) return item.image;
    // Already has relative path prefix (img/products/...)
    if (item.image.startsWith('img/')) return item.image;
    // Plain filename - prepend products folder
    if (item.image !== 'placeholder.jpg') return 'img/products/' + item.image;
    return 'img/products/placeholder.jpg';
}

// ── Render cart page ──────────────────────────────────────────────────────────
function renderCartPage() {
    var container = document.getElementById('cartItemsContainer');
    var emptyMsg  = document.getElementById('emptyCartMessage');
    var cartCard  = document.getElementById('cartItemsCard');
    var cartCount = document.getElementById('cartItemsCount');
    if (!container) return;

    if (cart.length===0) {
        if (cartCard)  cartCard.style.display  = 'none';
        if (emptyMsg)  emptyMsg.classList.remove('d-none');
        if (cartCount) cartCount.textContent    = '0';
        updateOrderSummaryDisplay(0);
        return;
    }
    if (cartCard)  cartCard.style.display  = 'block';
    if (emptyMsg)  emptyMsg.classList.add('d-none');
    if (cartCount) cartCount.textContent   = cart.length;

    var html = '';
    cart.forEach(function(item) {
        var imgSrc = resolveImage(item);
        html += '<div class="cart-item" data-id="'+escapeHtml(item.id)+'">'+
            '<div class="row align-items-center">'+
                '<div class="col-md-2 col-4">'+
                    '<img src="'+escapeHtml(imgSrc)+'" alt="'+escapeHtml(item.name)+'" class="cart-item-img"'+
                    ' onerror="this.onerror=null;this.src=\'img/products/placeholder.jpg\'">'+
                '</div>'+
                '<div class="col-md-4 col-8">'+
                    '<h5 class="cart-item-title">'+escapeHtml(item.name)+'</h5>'+
                    '<p class="cart-item-price">&#8369;'+item.price.toFixed(2)+' each</p>'+
                '</div>'+
                '<div class="col-md-3 col-5">'+
                    '<div class="cart-quantity">'+
                        '<button class="qty-btn-mini" data-action="minus" data-id="'+escapeHtml(item.id)+'">&#8722;</button>'+
                        '<input type="number" value="'+item.quantity+'" min="1" class="cart-qty-input" data-id="'+escapeHtml(item.id)+'">'+
                        '<button class="qty-btn-mini" data-action="plus" data-id="'+escapeHtml(item.id)+'">&#43;</button>'+
                    '</div>'+
                '</div>'+
                '<div class="col-md-2 col-4">'+
                    '<p class="cart-item-subtotal">&#8369;'+(item.price*item.quantity).toFixed(2)+'</p>'+
                '</div>'+
                '<div class="col-md-1 col-3">'+
                    '<button class="remove-item" data-action="remove" data-id="'+escapeHtml(item.id)+'">'+
                        '<i class="fas fa-trash-alt"></i></button>'+
                '</div>'+
            '</div>'+
        '</div>';
    });
    container.innerHTML = html;
    updateOrderSummaryDisplay(getCartTotal());

    // Fetch images for cart items that had base64 stripped (too large for localStorage)
    fetchMissingCartImages();
}

async function fetchMissingCartImages() {
    var needsFetch = cart.filter(function(item) {
        return item.image === '__needsfetch__' || !item.image;
    });
    if (needsFetch.length === 0) return;

    for (var i = 0; i < needsFetch.length; i++) {
        var item = needsFetch[i];
        try {
            var resp = await fetch('https://quickserve-j4u8.onrender.com/api/products/' + item.id);
            if (!resp.ok) continue;
            var product = await resp.json();
            var imgSrc = '';
            if (product.image && product.image.startsWith('/uploads/')) {
                imgSrc = 'https://quickserve-j4u8.onrender.com' + product.image;
            } else if (product.imageData && product.imageData.startsWith('data:')) {
                imgSrc = product.imageData;
            } else if (product.image && product.image !== 'placeholder.jpg') {
                imgSrc = 'img/products/' + product.image;
            }
            if (imgSrc) {
                // Update in-memory cart
                item.image = imgSrc;
                // Update the img element on page
                var imgEl = document.querySelector('.cart-item[data-id="' + item.id + '"] .cart-item-img');
                if (imgEl) imgEl.src = imgSrc;
            }
        } catch(e) { /* skip */ }
    }
}

// Event delegation — no stacking/glitch
document.addEventListener('click', function(e) {
    if (!onCartPage()) return;
    var btn = e.target.closest('[data-action]');
    if (!btn) return;
    var action = btn.getAttribute('data-action');
    var id     = btn.getAttribute('data-id');
    var item   = cart.find(function(i){ return i.id==id; });

    if (action==='minus' && item) {
        var nq = item.quantity-1;
        if (nq>=1) {
            var inp = document.querySelector('.cart-qty-input[data-id="'+id+'"]');
            if (inp) inp.value=nq;
            updateCartQuantity(id,nq);
            var row=btn.closest('.cart-item');
            if(row&&item){var sub=row.querySelector('.cart-item-subtotal');if(sub)sub.textContent='₱'+(item.price*item.quantity).toFixed(2);}
        } else removeFromCart(id);
    }
    if (action==='plus' && item) {
        var nq=item.quantity+1;
        var inp=document.querySelector('.cart-qty-input[data-id="'+id+'"]');
        if(inp)inp.value=nq;
        updateCartQuantity(id,nq);
        var row=btn.closest('.cart-item');
        if(row&&item){var sub=row.querySelector('.cart-item-subtotal');if(sub)sub.textContent='₱'+(item.price*item.quantity).toFixed(2);}
    }
    if (action==='remove') removeFromCart(id);
});

document.addEventListener('change', function(e) {
    if (!onCartPage()) return;
    if (!e.target.classList.contains('cart-qty-input')) return;
    var id=e.target.getAttribute('data-id');
    var val=parseInt(e.target.value);
    if(isNaN(val)||val<1){val=1;e.target.value=1;}
    updateCartQuantity(id,val);
    var item=cart.find(function(i){return i.id==id;});
    var row=e.target.closest('.cart-item');
    if(row&&item){var sub=row.querySelector('.cart-item-subtotal');if(sub)sub.textContent='₱'+(item.price*item.quantity).toFixed(2);}
});

// Order summary (no tax, ₱50 delivery)
function updateOrderSummaryDisplay(subtotal) {
    var delivery = cart.length > 0 ? 50 : 0;  // Bug 4 fix: no delivery fee on empty cart
    var total    = subtotal + delivery;
    var subEl    = document.getElementById('subtotalAmount');
    var taxRow   = document.getElementById('taxRow');
    var totalEl  = document.getElementById('totalAmount');
    var delivEl  = document.getElementById('deliveryAmount');
    var hidTotal = document.getElementById('hiddenTotalAmount');
    var hidItems = document.getElementById('hiddenCartItems');
    if(subEl)   subEl.textContent   = '₱'+subtotal.toFixed(2);
    if(taxRow)  taxRow.style.display= 'none';
    if(delivEl) delivEl.textContent = '₱'+delivery.toFixed(2);
    if(totalEl) totalEl.textContent = '₱'+total.toFixed(2);
    if(hidTotal)hidTotal.value      = total.toFixed(2);
    if(hidItems)hidItems.value      = JSON.stringify(cart.map(function(i){return{productId:i.id,quantity:i.quantity};}));
}

// ── Add-to-cart buttons ───────────────────────────────────────────────────────
function initCartCounter() { updateCartBadges(); }
function initAddToCartButtons() {
    document.querySelectorAll('.add-to-cart,.add-to-cart-quick').forEach(function(btn){
        btn.removeEventListener('click',handleAddToCart);
        btn.addEventListener('click',handleAddToCart);
    });
}
function handleAddToCart(e) {
    e.preventDefault();
    var id    = this.getAttribute('data-product-id')||this.getAttribute('data-id');
    var name  = this.getAttribute('data-product-name')||this.getAttribute('data-name');
    var price = parseFloat(this.getAttribute('data-product-price')||this.getAttribute('data-price')||0);
    var image = this.getAttribute('data-image')||this.getAttribute('data-product-image')||null;
    var qty   = 1;
    var inp   = document.getElementById('quantity');
    if(inp) qty=parseInt(inp.value)||1;
    addToCart(id,name,price,qty,image);
}

// ── Product filters + sorting ─────────────────────────────────────────────────
function initProductFilters() {
    var searchInput=document.getElementById('searchInput');
    var catFilter  =document.getElementById('categoryFilter');
    var sortFilter =document.getElementById('sortFilter');
    var resetBtn   =document.getElementById('resetFilters');
    var noResults  =document.getElementById('noResults');

    function filterProducts() {
        var items=Array.from(document.querySelectorAll('#productList .product-item'));
        if(!items.length) return;
        var search  =searchInput ?searchInput.value.toLowerCase():'';
        var category=catFilter   ?catFilter.value               :'all';
        var sort    =sortFilter  ?sortFilter.value              :'default';
        var visible=items.filter(function(p){
            return (p.getAttribute('data-name')||'').toLowerCase().includes(search) &&
                   (category==='all'||p.getAttribute('data-category')===category);
        });
        if(sort!=='default'&&visible.length>1){
            var parent=document.getElementById('productList');
            visible.sort(function(a,b){
                if(sort==='price-asc')  return parseFloat(a.getAttribute('data-price'))-parseFloat(b.getAttribute('data-price'));
                if(sort==='price-desc') return parseFloat(b.getAttribute('data-price'))-parseFloat(a.getAttribute('data-price'));
                if(sort==='name')       return (a.getAttribute('data-name')||'').localeCompare(b.getAttribute('data-name')||'');
                return 0;
            });
            visible.forEach(function(p){parent.appendChild(p);});
        }
        items.forEach(function(p){p.style.display='none';});
        visible.forEach(function(p){p.style.display='';});
        if(noResults) noResults.classList.toggle('d-none',visible.length>0);
    }

    if(searchInput)    searchInput.addEventListener('input',filterProducts);
    if(catFilter)      catFilter.addEventListener('change',filterProducts);
    if(sortFilter)     sortFilter.addEventListener('change',filterProducts);
    if(resetBtn) resetBtn.addEventListener('click',function(){
        if(searchInput)searchInput.value='';
        if(catFilter)  catFilter.value='all';
        if(sortFilter) sortFilter.value='default';
        filterProducts();
    });
    var list=document.getElementById('productList');
    if(list) new MutationObserver(function(){setTimeout(filterProducts,60);}).observe(list,{childList:true});
}

// ── Misc ──────────────────────────────────────────────────────────────────────
function initQuantitySelectors(){
    var minus=document.getElementById('qtyMinus'),plus=document.getElementById('qtyPlus'),inp=document.getElementById('quantity');
    if(minus&&plus&&inp){
        minus.addEventListener('click',function(){var v=parseInt(inp.value);if(v>1)inp.value=v-1;});
        plus.addEventListener('click',function(){inp.value=parseInt(inp.value)+1;});
    }
}
function initCancelOrderButtons(){}
function initProfileMenu(){
    var items=document.querySelectorAll('.profile-menu-item');
    var sections=document.querySelectorAll('.profile-content-section');
    items.forEach(function(item){
        item.addEventListener('click',function(e){
            e.preventDefault();
            var t=this.getAttribute('data-section');
            items.forEach(function(i){i.classList.remove('active');});
            this.classList.add('active');
            sections.forEach(function(s){s.classList.remove('active');if(s.id===t)s.classList.add('active');});
        });
    });
}
function initPasswordValidation(){
    var form=document.getElementById('passwordForm');
    if(form) form.addEventListener('submit',function(e){
        e.preventDefault();
        var np=document.getElementById('newPassword'),cp=document.getElementById('confirmPassword');
        if(np&&cp){
            if(np.value!==cp.value){showNotification('Passwords do not match!','error');return;}
            if(np.value.length<6){showNotification('Password must be at least 6 characters','error');return;}
        }
    });
}
function initRemoveCartItems(){}

// ── Notifications ─────────────────────────────────────────────────────────────
function showNotification(message, type) {
    type=type||'info';
    var colors={success:'#6B8C5C',error:'#C95A49',warning:'#D4A13E',info:'#5A8498'};
    var icons ={success:'fa-check-circle',error:'fa-exclamation-circle',warning:'fa-exclamation-triangle',info:'fa-info-circle'};
    var container=document.querySelector('.notification-container');
    if(!container){
        container=document.createElement('div');
        container.className='notification-container';
        container.style.cssText='position:fixed;top:20px;right:20px;z-index:9999;pointer-events:none;';
        document.body.appendChild(container);
    }
    var n=document.createElement('div');
    n.style.cssText='background:'+(colors[type]||colors.info)+';color:#fff;padding:12px 20px;'+
        'margin-bottom:10px;border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,.18);'+
        'display:flex;align-items:center;gap:10px;font-family:"Segoe UI",sans-serif;'+
        'min-width:260px;animation:slideIn .3s ease-out;pointer-events:auto;';
    n.innerHTML='<i class="fas '+(icons[type]||icons.info)+'"></i><span>'+message+'</span>';
    container.appendChild(n);
    setTimeout(function(){n.style.animation='slideOut .3s ease-in';setTimeout(function(){n.remove();},300);},3500);
}
(function(){
    if(document.getElementById('qs-notif-styles'))return;
    var s=document.createElement('style');s.id='qs-notif-styles';
    s.textContent='@keyframes slideIn{from{transform:translateX(110%);opacity:0}to{transform:translateX(0);opacity:1}}@keyframes slideOut{from{transform:translateX(0);opacity:1}to{transform:translateX(110%);opacity:0}}';
    document.head.appendChild(s);
})();

var API_BASE_URL='https://quickserve-j4u8.onrender.com/api';
function loginUser(){}function registerUser(){}function fetchProducts(){}function createOrder(){}function fetchUserOrders(){}
