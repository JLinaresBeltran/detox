<?php
/**
 * Panel de Administración - Detox Sabeho
 * Gestión de pedidos con autenticación
 */

define('APP_ACCESS', true);
require_once __DIR__ . '/../api/config.php';

$authManager = new AuthManager();
$isAuthenticated = $authManager->isAuthenticated(false); // No verificar timeout aún
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Panel de Administración - Detox Sabeho</title>
    <link rel="stylesheet" href="admin.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>

    <?php if (!$isAuthenticated): ?>
    <!-- ========================================================================
         SECCIÓN DE LOGIN
    ========================================================================= -->
    <div id="loginSection" class="login-container">
        <div class="login-box">
            <div class="login-header">
                <i class="fas fa-lock"></i>
                <h1>Panel de Administración</h1>
                <p>Detox Sabeho - Gestión de Pedidos</p>
            </div>

            <form id="loginForm" class="login-form">
                <div class="form-group">
                    <label for="password">Contraseña</label>
                    <input type="password" id="password" name="password" required autofocus>
                </div>

                <div id="loginError" class="error-message" style="display: none;"></div>

                <button type="submit" class="btn btn-primary btn-block">
                    <i class="fas fa-sign-in-alt"></i> Ingresar
                </button>
            </form>

            <div class="login-footer">
                <small>Sistema de Gestión de Pedidos v1.0</small>
            </div>
        </div>
    </div>

    <?php else: ?>
    <!-- ========================================================================
         PANEL PRINCIPAL
    ========================================================================= -->
    <div id="adminPanel" class="admin-panel">
        <!-- Header -->
        <header class="admin-header">
            <div class="header-content">
                <div class="header-left">
                    <i class="fas fa-boxes"></i>
                    <h1>Panel de Administración</h1>
                </div>
                <div class="header-right">
                    <span class="user-info">
                        <i class="fas fa-user-shield"></i> Administrador
                    </span>
                    <button id="logoutBtn" class="btn btn-secondary">
                        <i class="fas fa-sign-out-alt"></i> Cerrar Sesión
                    </button>
                </div>
            </div>
        </header>

        <!-- Contenido principal -->
        <main class="admin-content">
            <!-- Estadísticas -->
            <section class="stats-section">
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon" style="background-color: #3b82f6;">
                            <i class="fas fa-shopping-cart"></i>
                        </div>
                        <div class="stat-info">
                            <h3 id="statTotal">0</h3>
                            <p>Total Pedidos</p>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon" style="background-color: #f59e0b;">
                            <i class="fas fa-clock"></i>
                        </div>
                        <div class="stat-info">
                            <h3 id="statPending">0</h3>
                            <p>Pendientes</p>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon" style="background-color: #10b981;">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <div class="stat-info">
                            <h3 id="statDelivered">0</h3>
                            <p>Entregados</p>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon" style="background-color: #2E7D32;">
                            <i class="fas fa-dollar-sign"></i>
                        </div>
                        <div class="stat-info">
                            <h3 id="statRevenue">$0</h3>
                            <p>Ingresos Totales</p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Filtros y acciones -->
            <section class="filters-section">
                <div class="filters-container">
                    <div class="filters-left">
                        <div class="filter-group">
                            <label for="searchInput">
                                <i class="fas fa-search"></i> Buscar
                            </label>
                            <input type="text" id="searchInput" placeholder="Nombre, email, teléfono o ID...">
                        </div>

                        <div class="filter-group">
                            <label for="statusFilter">
                                <i class="fas fa-filter"></i> Estado
                            </label>
                            <select id="statusFilter">
                                <option value="">Todos</option>
                                <option value="pending">Pendiente</option>
                                <option value="processing">En Proceso</option>
                                <option value="shipped">Enviado</option>
                                <option value="delivered">Entregado</option>
                                <option value="cancelled">Cancelado</option>
                            </select>
                        </div>

                        <div class="filter-group">
                            <label for="productFilter">
                                <i class="fas fa-box"></i> Producto
                            </label>
                            <select id="productFilter">
                                <option value="">Todos</option>
                                <option value="1">Kit Individual</option>
                                <option value="2">Plan Dúo</option>
                            </select>
                        </div>
                    </div>

                    <div class="filters-right">
                        <button id="exportCsvBtn" class="btn btn-success">
                            <i class="fas fa-file-excel"></i> Exportar CSV
                        </button>
                        <button id="refreshBtn" class="btn btn-secondary">
                            <i class="fas fa-sync-alt"></i> Actualizar
                        </button>
                    </div>
                </div>
            </section>

            <!-- Tabla de pedidos -->
            <section class="orders-section">
                <div class="orders-container">
                    <div class="section-header">
                        <h2>
                            <i class="fas fa-list"></i> Lista de Pedidos
                        </h2>
                        <span id="ordersCount" class="orders-count">0 pedidos</span>
                    </div>

                    <div id="loadingIndicator" class="loading-indicator" style="display: none;">
                        <i class="fas fa-spinner fa-spin"></i> Cargando pedidos...
                    </div>

                    <div id="ordersTableContainer" class="table-container">
                        <table id="ordersTable" class="orders-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Número</th>
                                    <th>Fecha</th>
                                    <th>Cliente</th>
                                    <th>Producto</th>
                                    <th>Total</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody id="ordersTableBody">
                                <!-- Las filas se cargarán dinámicamente -->
                            </tbody>
                        </table>

                        <div id="noOrdersMessage" class="no-orders-message" style="display: none;">
                            <i class="fas fa-inbox"></i>
                            <p>No hay pedidos para mostrar</p>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    </div>

    <!-- Modal de detalles del pedido -->
    <div id="orderModal" class="modal" style="display: none;">
        <div class="modal-overlay"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h2>
                    <i class="fas fa-receipt"></i> Detalles del Pedido
                </h2>
                <button class="modal-close" onclick="closeOrderModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <div class="modal-body" id="orderModalBody">
                <!-- El contenido se cargará dinámicamente -->
            </div>
        </div>
    </div>

    <?php endif; ?>

    <!-- JavaScript -->
    <script>
        // Pasar el estado de autenticación a JavaScript
        const IS_AUTHENTICATED = <?php echo $isAuthenticated ? 'true' : 'false'; ?>;
        <?php if ($isAuthenticated): ?>
        const CSRF_TOKEN = '<?php echo generateCSRFToken(); ?>';
        <?php endif; ?>
    </script>
    <script src="admin.js"></script>
</body>
</html>
