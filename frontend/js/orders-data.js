// orders-data.js - Restaurant order history with image fix

// Fix #8: Ready = green, clear status colors
var STATUS_LABELS = {
    pending:   { label:'Pending',           color:'#D4A13E', icon:'fa-clock'        },
    preparing: { label:'Preparing',         color:'#E67E22', icon:'fa-fire'         },
    ready:     { label:'Ready for Pickup',  color:'#27AE60', icon:'fa-bell'         },  // GREEN
    completed: { label:'Completed',         color:'#6B8C5C', icon:'fa-check-circle' },
    cancelled: { label:'Cancelled',         color:'#C95A49', icon:'fa-times-circle' }
};

function statusBadge(status) {
    var cfg = STATUS_LABELS[status] || STATUS_LABELS.pending;
    return '<span style="background:'+cfg.color+';color:#fff;padding:4px 14px;border-radius:20px;font-size:.82rem;font-weight:600;display:inline-flex;align-items:center;gap:6px;">'+
           '<i class="fas '+cfg.icon+'"></i>'+cfg.label+'</span>';
}

// Fix #1: Resolve product image - handles backend /uploads/ paths, base64, and local filenames
var API_BASE = 'https://quickserve-j4u8.onrender.com';
function resolveOrderItemImage(item) {
    if (!item) return 'img/products/placeholder.jpg';
    // Full URL - use directly
    if (item.image && (item.image.startsWith('http://') || item.image.startsWith('https://'))) return item.image;
    // New: backend-uploaded image path
    if (item.image && item.image.startsWith('/uploads/')) return API_BASE + item.image;
    // Legacy: base64 stored on item
    if (item.imageData && item.imageData.startsWith('data:')) return item.imageData;
    if (item.image && item.image.startsWith('data:'))        return item.image;
    // Legacy: filename
    // Already resolved path
    if (item.image && item.image.startsWith('img/')) return item.image;
    // Plain filename
    if (item.image && item.image !== 'placeholder.jpg')      return 'img/products/' + item.image;
    return 'img/products/placeholder.jpg';
}

document.addEventListener('DOMContentLoaded', async function() {
    if (localStorage.getItem('isLoggedIn') !== 'true') {
        window.location.href = 'login.html'; return;
    }
    await loadAllOrders();
});

function ordersAuthHeaders() {
    var h = { 'Content-Type': 'application/json' };
    var token  = localStorage.getItem('token');
    var userId = localStorage.getItem('userId');
    if (token)  h['Authorization'] = 'Bearer ' + token;
    if (userId) h['x-user-id'] = userId;
    return h;
}

async function loadAllOrders() {
    await loadOrdersByStatus('all',       'ordersList');
    await loadOrdersByStatus('pending',   'pendingOrdersList');
    await loadOrdersByStatus('preparing', 'shippedOrdersList');
    await loadOrdersByStatus('ready',     'deliveredOrdersList');
    await loadOrdersByStatus('cancelled', 'cancelledOrdersList');
}

async function loadOrdersByStatus(status, containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;
    var userId = localStorage.getItem('userId');

    try {
        var response = await fetch('https://quickserve-j4u8.onrender.com/api/orders/user/' + userId, {
            headers: ordersAuthHeaders()
        });
        if (response.status === 401) { logout(); return; }
        if (!response.ok) throw new Error('Failed to fetch orders');

        var orders = await response.json();

        if (status === 'preparing') {
            orders = orders.filter(function(o){ return o.status === 'preparing'; });
        } else if (status === 'ready') {
            orders = orders.filter(function(o){ return o.status === 'ready' || o.status === 'completed'; });
        } else if (status !== 'all') {
            orders = orders.filter(function(o){ return o.status === status; });
        }

        if (orders.length === 0) {
            container.innerHTML =
                '<div class="text-center py-5">'+
                    '<i class="fas fa-utensils fa-3x mb-3" style="color:var(--primary);opacity:.35;"></i>'+
                    '<h5>No '+(status!=='all'?(STATUS_LABELS[status]||{label:status}).label:'')+' orders</h5>'+
                    (status==='all'?'<a href="products.html" class="btn btn-primary mt-2">Browse Menu</a>':'')+
                '</div>';
            return;
        }

        container.innerHTML = '';
        orders.forEach(function(order) {
            var productsHtml = (order.products||[]).map(function(item) {
                var imgSrc = resolveOrderItemImage(item);
                // Fix #1: use data URI inline to prevent broken path flicker
                return '<div class="order-item" style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">'+
                    '<img src="'+imgSrc+'" alt="'+escapeHtmlO(item.name)+'"'+
                    ' style="width:48px;height:48px;border-radius:8px;object-fit:cover;flex-shrink:0;"'+
                    ' onerror="this.onerror=null;this.src=\'img/products/placeholder.jpg\'">'+
                    '<div>'+
                        '<div style="font-weight:600;font-size:.92rem;">'+escapeHtmlO(item.name)+'</div>'+
                        '<div style="color:#888;font-size:.82rem;">Qty: '+item.quantity+' &times; &#8369;'+(item.price||0).toFixed(2)+'</div>'+
                    '</div>'+
                '</div>';
            }).join('');

            var card =
                '<div class="order-card" data-order-id="'+order._id+'">'+
                    '<div class="order-header">'+
                        '<div class="order-info">'+
                            '<span class="order-number">'+( order.orderNumber||'#'+order._id.slice(-8))+'</span>'+
                            '<span class="order-date"><i class="far fa-calendar-alt me-1"></i>'+new Date(order.createdAt).toLocaleString()+'</span>'+
                        '</div>'+
                        '<div>'+statusBadge(order.status)+'</div>'+
                    '</div>'+
                    '<div class="order-body">'+
                        '<div class="row">'+
                            '<div class="col-md-8">'+
                                productsHtml+
                                (order.specialInstructions?'<div class="mt-1"><small><i class="fas fa-comment-alt me-1"></i><em>'+escapeHtmlO(order.specialInstructions)+'</em></small></div>':'')+
                            '</div>'+
                            '<div class="col-md-4">'+
                                '<div class="order-summary">'+
                                    '<p><strong>Total:</strong> &#8369;'+(order.totalAmount||0).toFixed(2)+'</p>'+
                                    '<p><i class="fas fa-store me-1"></i>Pay at Counter</p>'+
                                    (order.status==='pending'?
                                        '<button class="btn btn-sm btn-danger cancel-order-btn mt-2" data-id="'+order._id+'">Cancel</button>':'')+
                                    (order.status==='ready'?
                                        '<div class="mt-2 p-2" style="background:#e8f5e9;color:#27ae60;border-radius:8px;font-size:.84rem;">'+
                                            '<i class="fas fa-bell me-1"></i><strong>Ready!</strong> Please claim at the counter.'+
                                        '</div>':'')+ 
                                '</div>'+
                            '</div>'+
                        '</div>'+
                    '</div>'+
                '</div>';
            container.insertAdjacentHTML('beforeend', card);
        });

        container.querySelectorAll('.cancel-order-btn').forEach(function(btn) {
            btn.addEventListener('click', async function() {
                if (!confirm('Cancel this order?')) return;
                var orderId = this.getAttribute('data-id');
                try {
                    var res = await fetch('https://quickserve-j4u8.onrender.com/api/orders/'+orderId+'/cancel',
                        {method:'PUT',headers:ordersAuthHeaders()});
                    if (res.ok) { showNotification('Order cancelled','info'); await loadAllOrders(); }
                    else { var d=await res.json(); showNotification(d.message||'Cannot cancel','error'); }
                } catch(e) { showNotification('Connection error','error'); }
            });
        });

    } catch(error) {
        container.innerHTML = '<div class="text-center py-5"><p>Failed to load. Make sure backend is running.</p>'+
            '<button class="btn btn-primary" onclick="loadAllOrders()">Retry</button></div>';
    }
}

function escapeHtmlO(s) {
    if (!s) return '';
    return String(s).replace(/[&<>"']/g, function(m){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m];});
}
