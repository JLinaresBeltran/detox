<?php
/**
 * OrderManager - Gestión de pedidos en JSON
 *
 * Maneja:
 * - Creación de pedidos
 * - Lectura de pedidos con filtros
 * - Actualización de estado
 * - Exportación a CSV
 * - Backup automático por email
 * - File locking para prevenir corrupción
 */

class OrderManager
{
    private $ordersFile;
    private $emailService;

    public function __construct()
    {
        $this->ordersFile = ORDERS_FILE;
        $this->initializeOrdersFile();
    }

    /**
     * Inicializa el archivo de pedidos si no existe
     */
    private function initializeOrdersFile()
    {
        if (!file_exists($this->ordersFile)) {
            $initialData = [
                'orders' => [],
                'metadata' => [
                    'lastOrderNumber' => 0,
                    'totalOrders' => 0,
                    'lastUpdated' => $this->getCurrentTimestamp()
                ]
            ];
            $this->writeOrdersFile($initialData);
        }
    }

    /**
     * Lee el archivo de pedidos con file locking
     *
     * @return array Datos de pedidos
     */
    private function readOrdersFile()
    {
        $handle = fopen($this->ordersFile, 'c+');
        if (!$handle) {
            throw new Exception('No se pudo abrir el archivo de pedidos');
        }

        // Lock compartido para lectura
        if (!flock($handle, LOCK_SH)) {
            fclose($handle);
            throw new Exception('No se pudo obtener lock de lectura');
        }

        $content = stream_get_contents($handle);
        flock($handle, LOCK_UN);
        fclose($handle);

        $data = json_decode($content, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception('Error al decodificar JSON: ' . json_last_error_msg());
        }

        return $data;
    }

    /**
     * Escribe el archivo de pedidos con file locking
     *
     * @param array $data Datos a escribir
     */
    private function writeOrdersFile($data)
    {
        $handle = fopen($this->ordersFile, 'c+');
        if (!$handle) {
            throw new Exception('No se pudo abrir el archivo de pedidos');
        }

        // Lock exclusivo para escritura
        if (!flock($handle, LOCK_EX)) {
            fclose($handle);
            throw new Exception('No se pudo obtener lock de escritura');
        }

        ftruncate($handle, 0);
        rewind($handle);
        $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        fwrite($handle, $json);
        fflush($handle);
        flock($handle, LOCK_UN);
        fclose($handle);
    }

    /**
     * Genera un ID único para el pedido
     *
     * @return string ID del pedido (formato: ORD-{timestamp}-{random})
     */
    private function generateOrderId()
    {
        $timestamp = time();
        $random = strtoupper(substr(bin2hex(random_bytes(2)), 0, 4));
        return "ORD-{$timestamp}-{$random}";
    }

    /**
     * Obtiene timestamp actual en formato ISO 8601 con zona horaria de Colombia
     *
     * @return string Timestamp formateado
     */
    private function getCurrentTimestamp()
    {
        $dt = new DateTime('now', new DateTimeZone('America/Bogota'));
        return $dt->format('c'); // ISO 8601
    }

    /**
     * Agrega un nuevo pedido
     *
     * @param array $orderData Datos del pedido
     * @return array Datos del pedido creado
     * @throws Exception Si hay error al guardar
     */
    public function addOrder($orderData)
    {
        try {
            // Leer datos actuales
            $data = $this->readOrdersFile();

            // Generar ID y número de pedido
            $orderId = $this->generateOrderId();
            $orderNumber = $data['metadata']['lastOrderNumber'] + 1;

            // Crear estructura del pedido
            $order = [
                'id' => $orderId,
                'orderNumber' => $orderNumber,
                'timestamp' => $this->getCurrentTimestamp(),
                'status' => ORDER_STATUS_PENDING,
                'product' => [
                    'id' => $orderData['product']['id'],
                    'name' => $orderData['product']['name'],
                    'quantity' => $orderData['product']['quantity'],
                    'price' => $orderData['product']['price'],
                    'shipping' => $orderData['product']['shipping'],
                    'total' => $orderData['product']['total']
                ],
                'customer' => [
                    'name' => $orderData['customer']['nombre'],
                    'phone' => $orderData['customer']['telefono'],
                    'email' => $orderData['customer']['correo'],
                    'department' => $orderData['customer']['departamento'],
                    'city' => $orderData['customer']['ciudad'],
                    'address' => $orderData['customer']['direccion'],
                    'observations' => $orderData['customer']['observaciones'] ?? ''
                ],
                'metadata' => [
                    'ip' => $orderData['metadata']['ip'] ?? getClientIP(),
                    'userAgent' => $orderData['metadata']['userAgent'] ?? getUserAgent()
                ]
            ];

            // Agregar pedido al array
            $data['orders'][] = $order;

            // Actualizar metadata
            $data['metadata']['lastOrderNumber'] = $orderNumber;
            $data['metadata']['totalOrders'] = count($data['orders']);
            $data['metadata']['lastUpdated'] = $this->getCurrentTimestamp();

            // Guardar cambios
            $this->writeOrdersFile($data);

            // Log del pedido creado
            logMessage("Pedido creado: {$orderId} - Cliente: {$order['customer']['name']}", 'INFO');

            return $order;

        } catch (Exception $e) {
            logMessage("Error al crear pedido: " . $e->getMessage(), 'ERROR');
            throw $e;
        }
    }

    /**
     * Obtiene todos los pedidos con filtros opcionales
     *
     * @param array $filters Filtros a aplicar
     * @return array Lista de pedidos
     */
    public function getOrders($filters = [])
    {
        try {
            $data = $this->readOrdersFile();
            $orders = $data['orders'];

            // Aplicar filtros
            if (!empty($filters)) {
                $orders = array_filter($orders, function ($order) use ($filters) {
                    // Filtro por estado
                    if (isset($filters['status']) && $filters['status'] !== '') {
                        if ($order['status'] !== $filters['status']) {
                            return false;
                        }
                    }

                    // Filtro por producto
                    if (isset($filters['productId']) && $filters['productId'] !== '') {
                        if ($order['product']['id'] != $filters['productId']) {
                            return false;
                        }
                    }

                    // Filtro por búsqueda de texto
                    if (isset($filters['search']) && $filters['search'] !== '') {
                        $search = strtolower($filters['search']);
                        $searchIn = strtolower(
                            $order['customer']['name'] . ' ' .
                            $order['customer']['email'] . ' ' .
                            $order['customer']['phone'] . ' ' .
                            $order['id']
                        );
                        if (strpos($searchIn, $search) === false) {
                            return false;
                        }
                    }

                    return true;
                });
            }

            // Ordenar por timestamp descendente (más recientes primero)
            usort($orders, function ($a, $b) {
                return strcmp($b['timestamp'], $a['timestamp']);
            });

            return array_values($orders); // Re-indexar array

        } catch (Exception $e) {
            logMessage("Error al obtener pedidos: " . $e->getMessage(), 'ERROR');
            return [];
        }
    }

    /**
     * Obtiene un pedido por ID
     *
     * @param string $orderId ID del pedido
     * @return array|null Datos del pedido o null si no existe
     */
    public function getOrderById($orderId)
    {
        try {
            $data = $this->readOrdersFile();
            foreach ($data['orders'] as $order) {
                if ($order['id'] === $orderId) {
                    return $order;
                }
            }
            return null;
        } catch (Exception $e) {
            logMessage("Error al obtener pedido {$orderId}: " . $e->getMessage(), 'ERROR');
            return null;
        }
    }

    /**
     * Actualiza el estado de un pedido
     *
     * @param string $orderId ID del pedido
     * @param string $newStatus Nuevo estado
     * @return bool True si se actualizó correctamente
     */
    public function updateOrderStatus($orderId, $newStatus)
    {
        try {
            // Validar estado
            $validStatuses = [
                ORDER_STATUS_PENDING,
                ORDER_STATUS_PROCESSING,
                ORDER_STATUS_SHIPPED,
                ORDER_STATUS_DELIVERED,
                ORDER_STATUS_CANCELLED
            ];

            if (!in_array($newStatus, $validStatuses)) {
                throw new Exception("Estado inválido: {$newStatus}");
            }

            // Leer datos
            $data = $this->readOrdersFile();
            $updated = false;

            // Buscar y actualizar pedido
            foreach ($data['orders'] as &$order) {
                if ($order['id'] === $orderId) {
                    $oldStatus = $order['status'];
                    $order['status'] = $newStatus;
                    $order['statusUpdatedAt'] = $this->getCurrentTimestamp();
                    $updated = true;

                    logMessage("Pedido {$orderId} actualizado: {$oldStatus} → {$newStatus}", 'INFO');
                    break;
                }
            }

            if (!$updated) {
                throw new Exception("Pedido no encontrado: {$orderId}");
            }

            // Actualizar metadata
            $data['metadata']['lastUpdated'] = $this->getCurrentTimestamp();

            // Guardar cambios
            $this->writeOrdersFile($data);

            return true;

        } catch (Exception $e) {
            logMessage("Error al actualizar estado del pedido {$orderId}: " . $e->getMessage(), 'ERROR');
            return false;
        }
    }

    /**
     * Exporta pedidos a CSV
     *
     * @param array $filters Filtros a aplicar
     * @return string Contenido CSV
     */
    public function exportToCSV($filters = [])
    {
        $orders = $this->getOrders($filters);

        // Crear CSV en memoria
        $output = fopen('php://temp', 'r+');

        // Encabezados
        $headers = [
            'ID Pedido',
            'Número',
            'Fecha',
            'Estado',
            'Producto',
            'Cantidad',
            'Precio Producto',
            'Envío',
            'Total',
            'Cliente',
            'Teléfono',
            'Email',
            'Departamento',
            'Ciudad',
            'Dirección',
            'Observaciones',
            'IP',
            'User Agent'
        ];

        fputcsv($output, $headers);

        // Datos
        foreach ($orders as $order) {
            $row = [
                $order['id'],
                $order['orderNumber'],
                $order['timestamp'],
                $order['status'],
                $order['product']['name'],
                $order['product']['quantity'],
                $order['product']['price'],
                $order['product']['shipping'],
                $order['product']['total'],
                $order['customer']['name'],
                $order['customer']['phone'],
                $order['customer']['email'],
                $order['customer']['department'],
                $order['customer']['city'],
                $order['customer']['address'],
                $order['customer']['observations'],
                $order['metadata']['ip'],
                $order['metadata']['userAgent']
            ];
            fputcsv($output, $row);
        }

        rewind($output);
        $csv = stream_get_contents($output);
        fclose($output);

        return $csv;
    }

    /**
     * Envía backup del JSON completo por email
     *
     * @param EmailService $emailService Servicio de email
     * @return bool True si se envió correctamente
     */
    public function backupToEmail($emailService)
    {
        try {
            $data = $this->readOrdersFile();
            $jsonContent = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

            $subject = 'Backup de Pedidos - ' . date('Y-m-d H:i:s');
            $textContent = 'Backup automático del archivo de pedidos adjunto.';

            $result = $emailService->sendBackupEmail(
                ADMIN_EMAIL,
                $subject,
                $textContent,
                $jsonContent
            );

            if ($result) {
                logMessage('Backup enviado por email correctamente', 'INFO');
            }

            return $result;

        } catch (Exception $e) {
            logMessage("Error al enviar backup por email: " . $e->getMessage(), 'ERROR');
            return false;
        }
    }

    /**
     * Obtiene estadísticas de pedidos
     *
     * @return array Estadísticas
     */
    public function getStatistics()
    {
        try {
            $orders = $this->getOrders();

            $stats = [
                'total' => count($orders),
                'pending' => 0,
                'processing' => 0,
                'shipped' => 0,
                'delivered' => 0,
                'cancelled' => 0,
                'totalRevenue' => 0,
                'averageOrderValue' => 0
            ];

            foreach ($orders as $order) {
                // Contar por estado
                switch ($order['status']) {
                    case ORDER_STATUS_PENDING:
                        $stats['pending']++;
                        break;
                    case ORDER_STATUS_PROCESSING:
                        $stats['processing']++;
                        break;
                    case ORDER_STATUS_SHIPPED:
                        $stats['shipped']++;
                        break;
                    case ORDER_STATUS_DELIVERED:
                        $stats['delivered']++;
                        break;
                    case ORDER_STATUS_CANCELLED:
                        $stats['cancelled']++;
                        break;
                }

                // Sumar ingresos (solo pedidos no cancelados)
                if ($order['status'] !== ORDER_STATUS_CANCELLED) {
                    $stats['totalRevenue'] += $order['product']['total'];
                }
            }

            // Calcular promedio
            if ($stats['total'] > 0) {
                $stats['averageOrderValue'] = round($stats['totalRevenue'] / $stats['total']);
            }

            return $stats;

        } catch (Exception $e) {
            logMessage("Error al calcular estadísticas: " . $e->getMessage(), 'ERROR');
            return [];
        }
    }
}
