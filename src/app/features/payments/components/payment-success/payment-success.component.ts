import { Component, OnInit, OnDestroy } from '@angular/core'; // Importar OnInit y OnDestroy
import { ActivatedRoute } from '@angular/router'; // Importar ActivatedRoute
import { Subscription } from 'rxjs'; // Importar Subscription
import { PaymentVerificationService, OrderStatusResponse } from '../../services/payment-verification.service';
import { OrderNotificationService } from '../../../orders/services/order-notification.service';
import { CartService } from '../../../cart/services/cart.service';
import { PaymentService } from '../../services/payment.service';
import { IPaymentStatusResponse } from '../../models/IPaymentStatusResponse';
import { AuthService } from '../../../../auth/services/auth.service';

@Component({
  selector: 'app-payment-success',
  templateUrl: './payment-success.component.html',
  styleUrls: ['./payment-success.component.scss']
})
export class PaymentSuccessComponent implements OnInit, OnDestroy { // Implementar interfaces

  public orderId: string | null = null; // Propiedad para guardar el ID
  public MP_Id: string | null = null; // Propiedad para guardar el ID
  public paymentId: string | null = null; // Propiedad para guardar el ID del pago de MercadoPago
  public paymentStatus: string | null = null; // Estado del pago
  public isVerifying: boolean = false; // Estado de verificación
  public verificationComplete: boolean = false; // Verificación completada
  public notificationSent: boolean = false; // Notificación enviada
  public errorMessage: string | null = null; // Mensaje de error si algo falla

  // Nuevos campos para mostrar información completa del pago
  public externalReference: string | null = null;
  public idempotencyKey: string | null = null;
  public paymentAmount: number | null = null;
  public oauthVerified: boolean = false;
  public isUserAuthenticated: boolean = false;

  private routeSub: Subscription | null = null; // Para manejar la suscripción

  // Inyectar servicios en el constructor
  constructor(
    private route: ActivatedRoute,
    private paymentVerificationService: PaymentVerificationService,
    private orderNotificationService: OrderNotificationService,
    private cartService: CartService,
    private paymentService: PaymentService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    // Suscribirse a los query parameters al iniciar el componente
    this.routeSub = this.route.queryParamMap.subscribe(params => {
      // Obtener el valor del parámetro 'saleId' de la URL
      this.orderId = params.get('saleId');
      // Obtener el payment_id de MercadoPago si existe
      this.paymentId = params.get('payment_id');

      // Si tenemos los datos necesarios, verificar el pago
      if (this.orderId) {
        this.verifyPaymentAndNotify();
      }
    });
  }

  /**
   * Verifica el estado del pago y envía la notificación si está aprobado
   */
  private async verifyPaymentAndNotify(): Promise<void> {
    try {
      this.isVerifying = true;
      this.errorMessage = null;

      // Verificar estado de autenticación
      this.isUserAuthenticated = this.authService.isAuthenticated();

      // Primero, verificar el estado de la orden (con manejo de errores)
      let orderStatus: any = null;
      try {
        orderStatus = await this.paymentVerificationService.verifyOrderStatus(this.orderId!).toPromise();
        // Asegurar que el status sea un string
        this.paymentStatus = orderStatus?.status ? String(orderStatus.status) : 'unknown';
        console.log('Estado de la venta obtenido:', this.paymentStatus, orderStatus);
      } catch (orderError: any) {
        console.warn('Error al verificar venta, continuando sin verificación:', orderError);
        // Si el endpoint de ventas no existe, continuamos con un estado por defecto
        this.paymentStatus = 'pending';
        orderStatus = {
          saleId: this.orderId,
          status: 'pending',
          total: 0,
          customerEmail: 'cliente@ejemplo.com'
        };
      }

      // Luego, obtener información completa del pago usando el nuevo endpoint
      // Solo si el usuario está autenticado
      if (this.orderId && this.authService.isAuthenticated()) {
        try {
          const paymentStatusResponse = await this.paymentService.getPaymentStatusBySale(this.orderId).toPromise();

          if (paymentStatusResponse?.success && paymentStatusResponse.payment) {
            // Actualizar todos los campos con la información del pago
            this.externalReference = paymentStatusResponse.payment.externalReference;
            this.idempotencyKey = paymentStatusResponse.payment.idempotencyKey || null;
            this.paymentAmount = paymentStatusResponse.payment.amount;
            this.paymentId = paymentStatusResponse.payment.mercadoPagoPaymentId || this.paymentId;

            // Información de verificación OAuth
            if (paymentStatusResponse.verification) {
              this.oauthVerified = paymentStatusResponse.verification.oauthVerified;
              // Asegurar que realStatus sea un string
              const realStatus = paymentStatusResponse.verification.realStatus;
              this.paymentStatus = realStatus ? String(realStatus) : this.paymentStatus;
            }
            console.log('Información completa del pago obtenida:', paymentStatusResponse);
          } else {
            console.warn('Respuesta de pago incompleta:', paymentStatusResponse);
          }
        } catch (paymentError: any) {
          console.warn('No se pudo obtener información detallada del pago:', paymentError);

          // Si es error 401, el usuario no está autenticado o el token expiró
          if (paymentError.status === 401) {
            console.warn('Usuario no autenticado para obtener detalles del pago. Se continuará con información básica.');
            this.errorMessage = 'No se pudieron obtener todos los detalles del pago. Sesión no válida.';
          }
          // Continuar con la verificación básica aunque falle la información detallada
        }
      } else if (this.orderId && !this.authService.isAuthenticated()) {
        console.warn('Usuario no autenticado, no se pueden obtener detalles completos del pago');
        this.errorMessage = 'Para ver los detalles completos del pago, inicia sesión.';
      }

      this.verificationComplete = true;
      console.log('Verificación completada. Estado final:', {
        paymentStatus: this.paymentStatus,
        isUserAuthenticated: this.isUserAuthenticated,
        externalReference: this.externalReference,
        paymentId: this.paymentId
      });

      // Si la orden está pagada (status: 'Pendiente pagado' o 'Pagado'), enviar notificación
      if (orderStatus?.status === 'Pendiente pagado' || orderStatus?.status === 'Pagado') {
        // Simular datos de pago para la notificación
        const paymentData = {
          status: 'approved',
          transactionAmount: this.paymentAmount || orderStatus.total,
          paymentMethodId: this.paymentId ? 'mercadopago' : 'cash',
          paymentMethod: this.paymentId ? 'online' : 'cash',
          payer: {
            email: orderStatus.customerEmail || 'cliente@ejemplo.com'
          }
        };

        await this.sendOrderNotification(paymentData);
        // Limpiar el carrito solo cuando el pago es exitoso
        this.clearCartAfterSuccessfulPayment();
      } else {
        console.warn('Orden no pagada, no se enviará notificación:', orderStatus);
      }

    } catch (error) {
      console.error('Error al verificar la venta:', error);
      this.errorMessage = 'Error al verificar el estado de la venta';
      this.verificationComplete = true;
    } finally {
      this.isVerifying = false;
    }
  }

  /**
   * Envía la notificación de orden pagada
   */
  private async sendOrderNotification(paymentData: any): Promise<void> {
    try {
      // Preparar payload base
      const basePayload = {
        orderId: this.orderId!,
        customerName: paymentData.payer?.email || 'Cliente',
        customerEmail: paymentData.payer?.email || '',
        total: paymentData.transactionAmount || 0,
        paymentMethod: paymentData.paymentMethodId || 'unknown',
        items: [] // Por ahora vacío, se podría obtener del backend si es necesario
      };

      if (paymentData.paymentMethod === 'cash') {
        // Notificación para pagos en efectivo en el local
        await this.orderNotificationService.sendCashOrderNotification(basePayload).toPromise();
      } else {
        // Notificación para pagos con MercadoPago u otros métodos electrónicos
        const onlinePaymentPayload = {
          ...basePayload,
          paymentId: this.paymentId || undefined
        };
        await this.orderNotificationService.sendOrderPaidNotification(onlinePaymentPayload).toPromise();
      }

      this.notificationSent = true;
      console.log('Notificación de Telegram enviada exitosamente');

    } catch (error) {
      console.error('Error al enviar notificación de Telegram:', error);
      // No mostramos error al usuario ya que el pago ya fue exitoso
      // La notificación es secundaria
    }
  }

  /**
   * Método público para confirmar un pago en efectivo en el local
   * Este método se puede llamar desde otros componentes cuando el cliente pague en efectivo
   */
  public confirmCashPayment(orderData: {
    orderId: string;
    customerName: string;
    customerEmail: string;
    total: number;
    items: any[];
  }): void {
    this.orderId = orderData.orderId;
    this.paymentStatus = 'approved';
    this.verificationComplete = true;

    // Simular datos de pago en efectivo
    const cashPaymentData = {
      paymentMethod: 'cash',
      status: 'approved',
      transactionAmount: orderData.total,
      payer: {
        email: orderData.customerEmail
      },
      items: orderData.items
    };

    // Enviar notificación para pago en efectivo
    this.sendOrderNotification(cashPaymentData);
  }

  /**
   * Limpia el carrito después de un pago exitoso
   */
  private clearCartAfterSuccessfulPayment(): void {
    this.cartService.clearCart().subscribe({
      next: () => {
        console.log('Carrito limpiado exitosamente después del pago');
      },
      error: (error) => {
        console.error('Error al limpiar el carrito:', error);
        // No mostramos error al usuario ya que el pago fue exitoso
      }
    });
  }

  /**
   * Obtiene la clase CSS para el badge del estado del pago
   */
  getStatusBadgeClass(status: string | null): string {
    // Verificar que status sea un string válido
    if (!status || typeof status !== 'string') {
      return 'bg-secondary';
    }

    // Convertir a string y luego a lowercase de forma segura
    const statusStr = String(status).toLowerCase();

    switch (statusStr) {
      case 'approved':
      case 'pagado':
        return 'bg-success';
      case 'pending':
      case 'pendiente':
      case 'pendiente pagado':
        return 'bg-warning text-dark';
      case 'rejected':
      case 'cancelled':
      case 'rechazado':
      case 'cancelado':
        return 'bg-danger';
      case 'in_process':
      case 'processing':
        return 'bg-info';
      default:
        return 'bg-secondary';
    }
  }

  ngOnDestroy(): void {
    // Desuscribirse para evitar memory leaks al destruir el componente
    this.routeSub?.unsubscribe();
  }

}