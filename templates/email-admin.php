<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nuevo Pedido - Detox Sabeho Admin</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Courier New', 'Consolas', monospace; background-color: #1a1a1a;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #1a1a1a;">
        <tr>
            <td style="padding: 40px 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="650" style="margin: 0 auto; background-color: #2d2d2d; border-radius: 8px; border: 2px solid #3b82f6;">

                    <!-- Header con alerta -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; text-align: center; border-radius: 6px 6px 0 0;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">
                                🔔 NUEVO PEDIDO RECIBIDO
                            </h1>
                            <p style="margin: 10px 0 0; color: #bfdbfe; font-size: 18px; font-weight: bold;">
                                Pedido #<?php echo $order['orderNumber']; ?>
                            </p>
                            <p style="margin: 5px 0 0; color: #e0e7ff; font-size: 13px;">
                                <?php
                                    $dt = new DateTime($order['timestamp']);
                                    $dt->setTimezone(new DateTimeZone('America/Bogota'));
                                    echo $dt->format('d/m/Y H:i:s');
                                ?> COT
                            </p>
                        </td>
                    </tr>

                    <!-- Alerta de acción requerida -->
                    <tr>
                        <td style="padding: 0;">
                            <div style="background-color: #dc2626; padding: 15px 30px; text-align: center;">
                                <p style="margin: 0; color: #ffffff; font-size: 14px; font-weight: bold; letter-spacing: 1px;">
                                    ⚠️ ACCIÓN REQUERIDA - PROCESAR ENVÍO
                                </p>
                            </div>
                        </td>
                    </tr>

                    <!-- Contenido principal -->
                    <tr>
                        <td style="padding: 30px; background-color: #2d2d2d;">

                            <!-- Información del cliente -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #1e293b; border: 1px solid #475569; border-radius: 6px; margin-bottom: 20px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <h2 style="margin: 0 0 15px; color: #60a5fa; font-size: 16px; font-weight: bold; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
                                            👤 INFORMACIÓN DEL CLIENTE
                                        </h2>
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <td style="padding: 5px 0; color: #94a3b8; font-size: 13px; width: 30%;">
                                                    Nombre:
                                                </td>
                                                <td style="padding: 5px 0; color: #ffffff; font-size: 13px; font-weight: bold;">
                                                    <?php echo htmlspecialchars($order['customer']['name']); ?>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 5px 0; color: #94a3b8; font-size: 13px;">
                                                    Teléfono:
                                                </td>
                                                <td style="padding: 5px 0; color: #ffffff; font-size: 13px;">
                                                    <a href="tel:<?php echo htmlspecialchars($order['customer']['phone']); ?>" style="color: #60a5fa; text-decoration: none;">
                                                        <?php echo htmlspecialchars($order['customer']['phone']); ?>
                                                    </a>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 5px 0; color: #94a3b8; font-size: 13px;">
                                                    Email:
                                                </td>
                                                <td style="padding: 5px 0; color: #ffffff; font-size: 13px;">
                                                    <a href="mailto:<?php echo htmlspecialchars($order['customer']['email']); ?>" style="color: #60a5fa; text-decoration: none;">
                                                        <?php echo htmlspecialchars($order['customer']['email']); ?>
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- Detalles del pedido -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #1e293b; border: 1px solid #475569; border-radius: 6px; margin-bottom: 20px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <h2 style="margin: 0 0 15px; color: #34d399; font-size: 16px; font-weight: bold; border-bottom: 2px solid #10b981; padding-bottom: 10px;">
                                            📦 DETALLES DEL PEDIDO
                                        </h2>
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <td style="padding: 5px 0; color: #94a3b8; font-size: 13px; width: 30%;">
                                                    Producto:
                                                </td>
                                                <td style="padding: 5px 0; color: #ffffff; font-size: 13px; font-weight: bold;">
                                                    <?php echo htmlspecialchars($order['product']['name']); ?>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 5px 0; color: #94a3b8; font-size: 13px;">
                                                    Cantidad:
                                                </td>
                                                <td style="padding: 5px 0; color: #ffffff; font-size: 13px;">
                                                    <?php echo $order['product']['quantity']; ?> unidad<?php echo $order['product']['quantity'] > 1 ? 'es' : ''; ?>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 5px 0; color: #94a3b8; font-size: 13px;">
                                                    Precio producto:
                                                </td>
                                                <td style="padding: 5px 0; color: #ffffff; font-size: 13px;">
                                                    <?php echo formatPrice($order['product']['price']); ?>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 5px 0; color: #94a3b8; font-size: 13px;">
                                                    Envío:
                                                </td>
                                                <td style="padding: 5px 0; color: <?php echo $order['product']['shipping'] == 0 ? '#34d399' : '#ffffff'; ?>; font-size: 13px; font-weight: <?php echo $order['product']['shipping'] == 0 ? 'bold' : 'normal'; ?>;">
                                                    <?php echo $order['product']['shipping'] == 0 ? 'GRATIS' : formatPrice($order['product']['shipping']); ?>
                                                </td>
                                            </tr>
                                            <tr style="border-top: 1px solid #475569;">
                                                <td style="padding: 10px 0 0; color: #fbbf24; font-size: 14px; font-weight: bold;">
                                                    TOTAL:
                                                </td>
                                                <td style="padding: 10px 0 0; color: #fbbf24; font-size: 16px; font-weight: bold;">
                                                    <?php echo formatPrice($order['product']['total']); ?>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- Dirección de entrega -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #1e293b; border: 1px solid #475569; border-radius: 6px; margin-bottom: 20px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <h2 style="margin: 0 0 15px; color: #f59e0b; font-size: 16px; font-weight: bold; border-bottom: 2px solid #f59e0b; padding-bottom: 10px;">
                                            📍 DIRECCIÓN DE ENTREGA
                                        </h2>
                                        <div style="background-color: #0f172a; padding: 15px; border-radius: 4px; border-left: 4px solid #f59e0b;">
                                            <p style="margin: 0 0 8px; color: #ffffff; font-size: 14px; font-weight: bold;">
                                                <?php echo htmlspecialchars($order['customer']['name']); ?>
                                            </p>
                                            <p style="margin: 0 0 5px; color: #e2e8f0; font-size: 13px; line-height: 1.5;">
                                                <?php echo htmlspecialchars($order['customer']['address']); ?>
                                            </p>
                                            <p style="margin: 0 0 5px; color: #e2e8f0; font-size: 13px;">
                                                <?php echo htmlspecialchars($order['customer']['city']); ?>, <?php echo htmlspecialchars($order['customer']['department']); ?>
                                            </p>
                                            <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                                                Tel: <?php echo htmlspecialchars($order['customer']['phone']); ?>
                                            </p>
                                        </div>
                                        <?php if (!empty($order['customer']['observations'])): ?>
                                        <div style="margin-top: 15px; background-color: #fef3c7; padding: 12px; border-radius: 4px; border-left: 4px solid #f59e0b;">
                                            <p style="margin: 0; color: #92400e; font-size: 12px;">
                                                <strong>⚠️ OBSERVACIONES:</strong><br>
                                                <?php echo htmlspecialchars($order['customer']['observations']); ?>
                                            </p>
                                        </div>
                                        <?php endif; ?>
                                    </td>
                                </tr>
                            </table>

                            <!-- Metadata técnica -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #0f172a; border: 1px solid #334155; border-radius: 6px; margin-bottom: 25px;">
                                <tr>
                                    <td style="padding: 15px;">
                                        <h2 style="margin: 0 0 10px; color: #64748b; font-size: 12px; font-weight: bold; text-transform: uppercase;">
                                            📊 Metadata Técnica
                                        </h2>
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <td style="padding: 3px 0; color: #64748b; font-size: 11px; width: 25%;">
                                                    ID Pedido:
                                                </td>
                                                <td style="padding: 3px 0; color: #94a3b8; font-size: 11px; font-family: monospace;">
                                                    <?php echo $order['id']; ?>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 3px 0; color: #64748b; font-size: 11px;">
                                                    IP Cliente:
                                                </td>
                                                <td style="padding: 3px 0; color: #94a3b8; font-size: 11px; font-family: monospace;">
                                                    <?php echo htmlspecialchars($order['metadata']['ip']); ?>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 3px 0; color: #64748b; font-size: 11px;">
                                                    User-Agent:
                                                </td>
                                                <td style="padding: 3px 0; color: #94a3b8; font-size: 11px; font-family: monospace; word-break: break-all;">
                                                    <?php echo htmlspecialchars(substr($order['metadata']['userAgent'], 0, 80)); ?><?php echo strlen($order['metadata']['userAgent']) > 80 ? '...' : ''; ?>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- Botón de acción -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 20px;">
                                <tr>
                                    <td style="text-align: center;">
                                        <a href="<?php echo APP_URL; ?>/admin" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; font-size: 14px; font-weight: bold; text-decoration: none; padding: 15px 40px; border-radius: 6px; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
                                            VER EN PANEL DE ADMINISTRACIÓN
                                        </a>
                                    </td>
                                </tr>
                            </table>

                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #0f172a; padding: 20px; text-align: center; border-radius: 0 0 6px 6px; border-top: 1px solid #334155;">
                            <p style="margin: 0; color: #64748b; font-size: 11px;">
                                Sistema de Gestión de Pedidos - Detox Sabeho<br>
                                Email automático generado el <?php echo date('d/m/Y H:i:s'); ?> COT
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
