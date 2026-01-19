<?php
/**
 * EmailService - Integración con Resend.com
 *
 * Maneja:
 * - Envío de emails de confirmación al cliente
 * - Envío de notificaciones al administrador
 * - Envío de backups por email
 * - Retry automático en caso de fallo
 * - Renderizado de templates HTML
 */

class EmailService
{
    private $resend;
    private $fromEmail;
    private $fromName;
    private $maxRetries = 3;

    public function __construct($apiKey = null)
    {
        $apiKey = $apiKey ?: RESEND_API_KEY;

        if (empty($apiKey)) {
            throw new Exception('RESEND_API_KEY no está configurada');
        }

        // Inicializar cliente de Resend
        $this->resend = \Resend::client($apiKey);
        $this->fromEmail = 'pedidos@' . EMAIL_FROM_DOMAIN;
        $this->fromName = 'Detox Sabeho';
    }

    /**
     * Envía email de confirmación al cliente
     *
     * @param array $order Datos del pedido
     * @return bool True si se envió correctamente
     */
    public function sendCustomerEmail($order)
    {
        try {
            $html = $this->renderCustomerTemplate($order);

            $emailData = [
                'from' => "{$this->fromName} <{$this->fromEmail}>",
                'to' => [$order['customer']['email']],
                'subject' => "¡Gracias por tu pedido! - Pedido #{$order['orderNumber']}",
                'html' => $html,
                'reply_to' => ADMIN_EMAIL
            ];

            return $this->sendWithRetry($emailData, 'cliente');

        } catch (Exception $e) {
            logMessage("Error al enviar email al cliente: " . $e->getMessage(), 'ERROR');
            return false;
        }
    }

    /**
     * Envía email de notificación al administrador
     *
     * @param array $order Datos del pedido
     * @return bool True si se envió correctamente
     */
    public function sendAdminEmail($order)
    {
        try {
            $html = $this->renderAdminTemplate($order);

            $emailData = [
                'from' => "{$this->fromName} <{$this->fromEmail}>",
                'to' => [ADMIN_EMAIL],
                'subject' => "🔔 Nuevo Pedido #{$order['orderNumber']} - {$order['customer']['name']}",
                'html' => $html,
                'reply_to' => $order['customer']['email']
            ];

            return $this->sendWithRetry($emailData, 'administrador');

        } catch (Exception $e) {
            logMessage("Error al enviar email al administrador: " . $e->getMessage(), 'ERROR');
            return false;
        }
    }

    /**
     * Envía backup del JSON por email
     *
     * @param string $to Email destino
     * @param string $subject Asunto
     * @param string $text Contenido de texto
     * @param string $jsonContent Contenido JSON
     * @return bool True si se envió correctamente
     */
    public function sendBackupEmail($to, $subject, $text, $jsonContent)
    {
        try {
            $emailData = [
                'from' => "Sistema Detox <sistema@" . EMAIL_FROM_DOMAIN . ">",
                'to' => [$to],
                'subject' => $subject,
                'text' => $text,
                'attachments' => [
                    [
                        'filename' => 'orders_backup_' . date('Y-m-d_His') . '.json',
                        'content' => base64_encode($jsonContent)
                    ]
                ]
            ];

            return $this->sendWithRetry($emailData, 'backup');

        } catch (Exception $e) {
            logMessage("Error al enviar backup por email: " . $e->getMessage(), 'ERROR');
            return false;
        }
    }

    /**
     * Envía un email con retry automático
     *
     * @param array $emailData Datos del email
     * @param string $type Tipo de email (para logging)
     * @return bool True si se envió correctamente
     */
    private function sendWithRetry($emailData, $type = 'email')
    {
        $attempts = 0;
        $lastError = null;

        while ($attempts < $this->maxRetries) {
            $attempts++;

            try {
                $result = $this->resend->emails->send($emailData);

                if (isset($result->id)) {
                    logMessage("Email {$type} enviado correctamente (intento {$attempts}): {$result->id}", 'INFO');
                    return true;
                }

            } catch (Exception $e) {
                $lastError = $e->getMessage();
                logMessage("Error al enviar email {$type} (intento {$attempts}): {$lastError}", 'WARNING');

                // Esperar antes de reintentar (backoff exponencial)
                if ($attempts < $this->maxRetries) {
                    sleep(pow(2, $attempts)); // 2, 4, 8 segundos
                }
            }
        }

        logMessage("Fallo definitivo al enviar email {$type} después de {$attempts} intentos: {$lastError}", 'ERROR');
        return false;
    }

    /**
     * Renderiza la plantilla de email para el cliente
     *
     * @param array $order Datos del pedido
     * @return string HTML del email
     */
    private function renderCustomerTemplate($order)
    {
        ob_start();
        include TEMPLATE_DIR . '/email-customer.php';
        return ob_get_clean();
    }

    /**
     * Renderiza la plantilla de email para el administrador
     *
     * @param array $order Datos del pedido
     * @return string HTML del email
     */
    private function renderAdminTemplate($order)
    {
        ob_start();
        include TEMPLATE_DIR . '/email-admin.php';
        return ob_get_clean();
    }

    /**
     * Formatea un precio para mostrar en emails
     *
     * @param int|float $amount Cantidad
     * @return string Precio formateado
     */
    private function formatEmailPrice($amount)
    {
        return '$' . number_format($amount, 0, ',', '.');
    }

    /**
     * Formatea una fecha para mostrar en emails
     *
     * @param string $timestamp Timestamp ISO 8601
     * @return string Fecha formateada
     */
    private function formatEmailDate($timestamp)
    {
        $dt = new DateTime($timestamp);
        $dt->setTimezone(new DateTimeZone('America/Bogota'));
        return $dt->format('d/m/Y H:i:s');
    }
}
