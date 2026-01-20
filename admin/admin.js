/**
 * Admin Panel JavaScript
 * Gestión de pedidos - Detox Sabeho
 */

(function () {
    'use strict';

    // Variables globales
    let allOrders = [];
    let filteredOrders = [];
    let csrfToken = typeof CSRF_TOKEN !== 'undefined' ? CSRF_TOKEN : '';
    let refreshInterval = null;

    // ========================================================================
    // INICIALIZACIÓN
    // ========================================================================

    function init() {
        if (!IS_AUTHENTICATED) {
            setupLoginForm();
        } else {
            setupAdminPanel();
        }
    }

    // ========================================================================
    // LOGIN
    // ========================================================================

    function setupLoginForm() {
        const loginForm = document.getElementById('loginForm');
        if (!loginForm) return;

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const password = document.getElementById('password').value;
            const errorDiv = document.getElementById('loginError');
            const submitBtn = loginForm.querySelector('button[type="submit"]');

            // Limpiar errores previos
            errorDiv.style.display = 'none';
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Ingresando...';

            try {
                const response = await fetch('/api/admin-login.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ password })
                });

                const data = await response.json();

                if (data.success) {
                    // Login exitoso - recargar página
                    window.location.reload();
                } else {
                    // Mostrar error
                    errorDiv.textContent = data.error || 'Error al iniciar sesión';
                    errorDiv.style.display = 'block';
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Ingresar';
                }
            } catch (error) {
                console.error('Error en login:', error);
                errorDiv.textContent = 'Error de conexión. Intenta nuevamente.';
                errorDiv.style.display = 'block';
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Ingresar';
            }
        });
    }

    // ========================================================================
    // PANEL DE ADMINISTRACIÓN
    // ========================================================================

    function setupAdminPanel() {
        // Event listeners
        document.getElementById('logoutBtn').addEventListener('click', logout);
        document.getElementById('refreshBtn').addEventListener('click', () => loadOrders(true));
        document.getElementById('exportCsvBtn').addEventListener('click', exportCSV);

        // Filtros
        document.getElementById('searchInput').addEventListener('input', filterOrders);
        document.getElementById('statusFilter').addEventListener('change', filterOrders);
        document.getElementById('productFilter').addEventListener('change', filterOrders);

        // Cargar pedidos inicialmente
        loadOrders();
        loadStatistics();

        // Auto-refresh cada 30 segundos
        refreshInterval = setInterval(() => {
            loadOrders(false);
            loadStatistics();
        }, 30000);
    }

    // ========================================================================
    // LOGOUT
    // ========================================================================

    async function logout() {
        try {
            await fetch('/api/admin-login.php?action=logout', {
                method: 'POST'
            });
            window.location.reload();
        } catch (error) {
            console.error('Error en logout:', error);
            window.location.reload();
        }
    }

    // ========================================================================
    // CARGAR PEDIDOS
    // ========================================================================

    async function loadOrders(showLoading = true) {
        const loadingIndicator = document.getElementById('loadingIndicator');
        const ordersTableBody = document.getElementById('ordersTableBody');
        const noOrdersMessage = document.getElementById('noOrdersMessage');

        if (showLoading) {
            loadingIndicator.style.display = 'block';
            ordersTableBody.innerHTML = '';
            noOrdersMessage.style.display = 'none';
        }

        try {
            const response = await fetch('/api/admin-orders.php?action=list', {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (response.status === 401) {
                // No autenticado - recargar página
                window.location.reload();
                return;
            }

            const data = await response.json();

            if (data.success) {
                allOrders = data.orders;
                filterOrders();
            } else {
                console.error('Error al cargar pedidos:', data.error);
            }
        } catch (error) {
            console.error('Error al cargar pedidos:', error);
        } finally {
            if (showLoading) {
                loadingIndicator.style.display = 'none';
            }
        }
    }

    // ========================================================================
    // CARGAR ESTADÍSTICAS
    // ========================================================================

    async function loadStatistics() {
        try {
            const response = await fetch('/api/admin-orders.php?action=stats', {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            const data = await response.json();

            if (data.success) {
                const stats = data.stats;
                document.getElementById('statTotal').textContent = stats.total;
                document.getElementById('statPending').textContent = stats.pending;
                document.getElementById('statDelivered').textContent = stats.delivered;
                document.getElementById('statRevenue').textContent = formatPrice(stats.totalRevenue);
            }
        } catch (error) {
            console.error('Error al cargar estadísticas:', error);
        }
    }

    // ========================================================================
    // FILTRAR PEDIDOS
    // ========================================================================

    function filterOrders() {
        const search = document.getElementById('searchInput').value.toLowerCase();
        const statusFilter = document.getElementById('statusFilter').value;
        const productFilter = document.getElementById('productFilter').value;

        filteredOrders = allOrders.filter(order => {
            // Filtro de búsqueda
            if (search) {
                const searchFields = [
                    order.customer.name,
                    order.customer.email,
                    order.customer.phone,
                    order.id
                ].join(' ').toLowerCase();

                if (!searchFields.includes(search)) {
                    return false;
                }
            }

            // Filtro de estado
            if (statusFilter && order.status !== statusFilter) {
                return false;
            }

            // Filtro de producto
            if (productFilter && order.product.id != productFilter) {
                return false;
            }

            return true;
        });

        renderOrdersTable();
    }

    // ========================================================================
    // RENDERIZAR TABLA DE PEDIDOS
    // ========================================================================

    function renderOrdersTable() {
        const ordersTableBody = document.getElementById('ordersTableBody');
        const noOrdersMessage = document.getElementById('noOrdersMessage');
        const ordersCount = document.getElementById('ordersCount');

        ordersCount.textContent = `${filteredOrders.length} pedido${filteredOrders.length !== 1 ? 's' : ''}`;

        if (filteredOrders.length === 0) {
            ordersTableBody.innerHTML = '';
            noOrdersMessage.style.display = 'block';
            return;
        }

        noOrdersMessage.style.display = 'none';

        const html = filteredOrders.map(order => `
            <tr>
                <td>${order.id}</td>
                <td>#${order.orderNumber}</td>
                <td>${formatDate(order.timestamp)}</td>
                <td>
                    <strong>${escapeHtml(order.customer.name)}</strong><br>
                    <small>${escapeHtml(order.customer.email)}</small>
                </td>
                <td>${escapeHtml(order.product.name)}</td>
                <td><strong>${formatPrice(order.product.total)}</strong></td>
                <td>
                    <span class="status-badge status-${order.status}">
                        ${getStatusLabel(order.status)}
                    </span>
                </td>
                <td>
                    <button class="btn btn-info btn-sm" onclick="viewOrderDetails('${order.id}')">
                        <i class="fas fa-eye"></i> Ver
                    </button>
                    <button class="btn btn-primary btn-sm" onclick="changeOrderStatus('${order.id}', '${order.status}')">
                        <i class="fas fa-edit"></i> Estado
                    </button>
                </td>
            </tr>
        `).join('');

        ordersTableBody.innerHTML = html;
    }

    // ========================================================================
    // VER DETALLES DEL PEDIDO
    // ========================================================================

    window.viewOrderDetails = function (orderId) {
        const order = allOrders.find(o => o.id === orderId);
        if (!order) return;

        const modalBody = document.getElementById('orderModalBody');

        const html = `
            <div style="margin-bottom: 24px;">
                <h3 style="margin-bottom: 16px; color: #2E7D32;">
                    <i class="fas fa-info-circle"></i> Información General
                </h3>
                <div style="background: #f3f4f6; padding: 16px; border-radius: 6px;">
                    <p><strong>ID:</strong> ${order.id}</p>
                    <p><strong>Número de Pedido:</strong> #${order.orderNumber}</p>
                    <p><strong>Fecha:</strong> ${formatDate(order.timestamp)}</p>
                    <p><strong>Estado:</strong> <span class="status-badge status-${order.status}">${getStatusLabel(order.status)}</span></p>
                </div>
            </div>

            <div style="margin-bottom: 24px;">
                <h3 style="margin-bottom: 16px; color: #2E7D32;">
                    <i class="fas fa-user"></i> Cliente
                </h3>
                <div style="background: #f3f4f6; padding: 16px; border-radius: 6px;">
                    <p><strong>Nombre:</strong> ${escapeHtml(order.customer.name)}</p>
                    <p><strong>Teléfono:</strong> <a href="tel:${order.customer.phone}">${escapeHtml(order.customer.phone)}</a></p>
                    <p><strong>Email:</strong> <a href="mailto:${order.customer.email}">${escapeHtml(order.customer.email)}</a></p>
                </div>
            </div>

            <div style="margin-bottom: 24px;">
                <h3 style="margin-bottom: 16px; color: #2E7D32;">
                    <i class="fas fa-box"></i> Producto
                </h3>
                <div style="background: #f3f4f6; padding: 16px; border-radius: 6px;">
                    <p><strong>Producto:</strong> ${escapeHtml(order.product.name)}</p>
                    <p><strong>Cantidad:</strong> ${order.product.quantity}</p>
                    <p><strong>Precio producto:</strong> ${formatPrice(order.product.price)}</p>
                    <p><strong>Envío:</strong> ${order.product.shipping === 0 ? '<span style="color: #2E7D32; font-weight: bold;">GRATIS</span>' : formatPrice(order.product.shipping)}</p>
                    <p style="font-size: 16px; margin-top: 8px;"><strong>TOTAL:</strong> <span style="color: #2E7D32;">${formatPrice(order.product.total)}</span></p>
                </div>
            </div>

            <div style="margin-bottom: 24px;">
                <h3 style="margin-bottom: 16px; color: #2E7D32;">
                    <i class="fas fa-map-marker-alt"></i> Dirección de Entrega
                </h3>
                <div style="background: #fff3cd; padding: 16px; border-radius: 6px; border-left: 4px solid #f59e0b;">
                    <p style="margin-bottom: 4px;"><strong>${escapeHtml(order.customer.name)}</strong></p>
                    <p style="margin-bottom: 4px;">${escapeHtml(order.customer.address)}</p>
                    <p style="margin-bottom: 4px;">${escapeHtml(order.customer.city)}, ${escapeHtml(order.customer.department)}</p>
                    <p>Tel: ${escapeHtml(order.customer.phone)}</p>
                    ${order.customer.observations ? `<p style="margin-top: 12px; font-style: italic; color: #666;"><strong>Observaciones:</strong> ${escapeHtml(order.customer.observations)}</p>` : ''}
                </div>
            </div>

            <div>
                <h3 style="margin-bottom: 16px; color: #64748b;">
                    <i class="fas fa-code"></i> Metadata Técnica
                </h3>
                <div style="background: #f3f4f6; padding: 16px; border-radius: 6px; font-family: 'Courier New', monospace; font-size: 12px;">
                    <p><strong>IP:</strong> ${escapeHtml(order.metadata.ip)}</p>
                    <p><strong>User-Agent:</strong> ${escapeHtml(order.metadata.userAgent.substring(0, 100))}...</p>
                </div>
            </div>
        `;

        modalBody.innerHTML = html;
        document.getElementById('orderModal').style.display = 'block';
    };

    window.closeOrderModal = function () {
        document.getElementById('orderModal').style.display = 'none';
    };

    // Cerrar modal al hacer clic en el overlay
    document.addEventListener('click', (e) => {
        const modal = document.getElementById('orderModal');
        if (e.target.classList.contains('modal-overlay')) {
            closeOrderModal();
        }
    });

    // ========================================================================
    // CAMBIAR ESTADO DEL PEDIDO
    // ========================================================================

    window.changeOrderStatus = function (orderId, currentStatus) {
        const order = allOrders.find(o => o.id === orderId);
        if (!order) return;

        const statuses = [
            { value: 'pending', label: 'Pendiente' },
            { value: 'processing', label: 'En Proceso' },
            { value: 'shipped', label: 'Enviado' },
            { value: 'delivered', label: 'Entregado' },
            { value: 'cancelled', label: 'Cancelado' }
        ];

        const options = statuses.map(s =>
            `<option value="${s.value}" ${s.value === currentStatus ? 'selected' : ''}>${s.label}</option>`
        ).join('');

        const modalBody = document.getElementById('orderModalBody');
        modalBody.innerHTML = `
            <div style="margin-bottom: 20px;">
                <h3 style="margin-bottom: 12px;">Pedido #${order.orderNumber}</h3>
                <p style="color: #6b7280;">Cliente: ${escapeHtml(order.customer.name)}</p>
            </div>

            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 600;">
                    Nuevo Estado:
                </label>
                <select id="newStatusSelect" style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 6px; font-size: 14px;">
                    ${options}
                </select>
            </div>

            <div style="display: flex; gap: 12px; justify-content: flex-end;">
                <button class="btn btn-secondary" onclick="closeOrderModal()">
                    Cancelar
                </button>
                <button class="btn btn-primary" onclick="updateOrderStatus('${orderId}')">
                    <i class="fas fa-save"></i> Guardar
                </button>
            </div>
        `;

        document.getElementById('orderModal').style.display = 'block';
    };

    window.updateOrderStatus = async function (orderId) {
        const newStatus = document.getElementById('newStatusSelect').value;

        try {
            const response = await fetch('/api/admin-orders.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                    action: 'updateStatus',
                    orderId: orderId,
                    status: newStatus,
                    csrfToken: csrfToken
                })
            });

            const data = await response.json();

            if (data.success) {
                closeOrderModal();
                loadOrders();
                loadStatistics();
            } else {
                alert('Error al actualizar estado: ' + (data.error || 'Error desconocido'));
            }
        } catch (error) {
            console.error('Error al actualizar estado:', error);
            alert('Error de conexión');
        }
    };

    // ========================================================================
    // EXPORTAR CSV
    // ========================================================================

    function exportCSV() {
        const statusFilter = document.getElementById('statusFilter').value;
        const productFilter = document.getElementById('productFilter').value;

        let url = '/api/admin-orders.php?action=export&format=csv';

        if (statusFilter) {
            url += `&status=${encodeURIComponent(statusFilter)}`;
        }

        if (productFilter) {
            url += `&productId=${encodeURIComponent(productFilter)}`;
        }

        window.location.href = url;
    }

    // ========================================================================
    // UTILIDADES
    // ========================================================================

    function formatPrice(amount) {
        return '$' + amount.toLocaleString('es-CO');
    }

    function formatDate(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString('es-CO', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function getStatusLabel(status) {
        const labels = {
            'pending': 'Pendiente',
            'processing': 'En Proceso',
            'shipped': 'Enviado',
            'delivered': 'Entregado',
            'cancelled': 'Cancelado'
        };
        return labels[status] || status;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ========================================================================
    // INICIAR
    // ========================================================================

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Limpiar interval al cerrar
    window.addEventListener('beforeunload', () => {
        if (refreshInterval) {
            clearInterval(refreshInterval);
        }
    });

})();
