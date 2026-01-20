<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirmación de Pedido - Detox Sabeho</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Arial', 'Helvetica', sans-serif; background-color: #f5f5f5;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
        <tr>
            <td style="padding: 40px 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

                    <!-- Header con gradiente verde -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #2E7D32 0%, #388E3C 100%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                                ¡Gracias por tu pedido!
                            </h1>
                            <p style="margin: 10px 0 0; color: #E8F5E9; font-size: 16px;">
                                Pedido #<?php echo $order['orderNumber']; ?>
                            </p>
                        </td>
                    </tr>

                    <!-- Contenido principal -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <!-- Saludo -->
                            <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                                Hola <strong><?php echo htmlspecialchars($order['customer']['name']); ?></strong>,
                            </p>

                            <p style="margin: 0 0 30px; color: #555555; font-size: 15px; line-height: 1.6;">
                                Hemos recibido tu pedido correctamente y está siendo procesado. A continuación encontrarás el resumen de tu compra:
                            </p>

                            <!-- Resumen del pedido -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #F1F8E9; border-radius: 6px; margin-bottom: 30px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <h2 style="margin: 0 0 15px; color: #2E7D32; font-size: 18px; font-weight: bold;">
                                            📦 Resumen del Pedido
                                        </h2>

                                        <!-- Producto -->
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <td style="padding: 8px 0; color: #333333; font-size: 14px;">
                                                    <strong>Producto:</strong>
                                                </td>
                                                <td style="padding: 8px 0; color: #555555; font-size: 14px; text-align: right;">
                                                    <?php echo htmlspecialchars($order['product']['name']); ?>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; color: #333333; font-size: 14px;">
                                                    <strong>Cantidad:</strong>
                                                </td>
                                                <td style="padding: 8px 0; color: #555555; font-size: 14px; text-align: right;">
                                                    <?php echo $order['product']['quantity']; ?> unidad<?php echo $order['product']['quantity'] > 1 ? 'es' : ''; ?>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; color: #333333; font-size: 14px;">
                                                    <strong>Precio del producto:</strong>
                                                </td>
                                                <td style="padding: 8px 0; color: #555555; font-size: 14px; text-align: right;">
                                                    <?php echo formatPrice($order['product']['price']); ?>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; color: #333333; font-size: 14px;">
                                                    <strong>Costo de envío:</strong>
                                                </td>
                                                <td style="padding: 8px 0; font-size: 14px; text-align: right; <?php echo $order['product']['shipping'] == 0 ? 'color: #2E7D32; font-weight: bold;' : 'color: #555555;'; ?>">
                                                    <?php echo $order['product']['shipping'] == 0 ? 'GRATIS' : formatPrice($order['product']['shipping']); ?>
                                                </td>
                                            </tr>
                                            <tr style="border-top: 2px solid #2E7D32;">
                                                <td style="padding: 12px 0 0; color: #2E7D32; font-size: 16px; font-weight: bold;">
                                                    TOTAL A PAGAR:
                                                </td>
                                                <td style="padding: 12px 0 0; color: #2E7D32; font-size: 18px; font-weight: bold; text-align: right;">
                                                    <?php echo formatPrice($order['product']['total']); ?>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- Dirección de entrega -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #F5F5F5; border-radius: 6px; margin-bottom: 30px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <h2 style="margin: 0 0 15px; color: #2E7D32; font-size: 18px; font-weight: bold;">
                                            📍 Dirección de Entrega
                                        </h2>
                                        <p style="margin: 0; color: #555555; font-size: 14px; line-height: 1.6;">
                                            <strong><?php echo htmlspecialchars($order['customer']['name']); ?></strong><br>
                                            <?php echo htmlspecialchars($order['customer']['address']); ?><br>
                                            <?php echo htmlspecialchars($order['customer']['city']); ?>, <?php echo htmlspecialchars($order['customer']['department']); ?><br>
                                            Tel: <?php echo htmlspecialchars($order['customer']['phone']); ?>
                                        </p>
                                        <?php if (!empty($order['customer']['observations'])): ?>
                                        <p style="margin: 10px 0 0; color: #777777; font-size: 13px; font-style: italic;">
                                            <strong>Observaciones:</strong> <?php echo htmlspecialchars($order['customer']['observations']); ?>
                                        </p>
                                        <?php endif; ?>
                                    </td>
                                </tr>
                            </table>

                            <!-- Información de entrega -->
                            <div style="background-color: #E3F2FD; border-left: 4px solid #2196F3; padding: 15px 20px; margin-bottom: 30px; border-radius: 4px;">
                                <p style="margin: 0; color: #1565C0; font-size: 14px; line-height: 1.6;">
                                    <strong>⏱️ Tiempo estimado de entrega:</strong> 3-5 días hábiles<br>
                                    <strong>💵 Método de pago:</strong> Pago contra entrega (efectivo al recibir)
                                </p>
                            </div>

                            <!-- Mensaje de soporte -->
                            <p style="margin: 0 0 10px; color: #555555; font-size: 15px; line-height: 1.6;">
                                Si tienes alguna pregunta sobre tu pedido, no dudes en contactarnos respondiendo a este email o escribiéndonos a <a href="mailto:<?php echo ADMIN_EMAIL; ?>" style="color: #2E7D32; text-decoration: none;"><?php echo ADMIN_EMAIL; ?></a>.
                            </p>

                            <p style="margin: 0; color: #555555; font-size: 15px; line-height: 1.6;">
                                ¡Estamos aquí para ayudarte en tu proceso de reinicio intestinal! 🌿
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #F5F5F5; padding: 30px; text-align: center; border-radius: 0 0 8px 8px;">
                            <p style="margin: 0 0 10px; color: #2E7D32; font-size: 20px; font-weight: bold;">
                                Detox Sabeho
                            </p>
                            <p style="margin: 0 0 15px; color: #777777; font-size: 13px;">
                                Protocolo de Reinicio Intestinal
                            </p>
                            <p style="margin: 0; color: #999999; font-size: 12px;">
                                © <?php echo date('Y'); ?> Detox Sabeho. Todos los derechos reservados.<br>
                                Este es un email automático, por favor no responder directamente.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
