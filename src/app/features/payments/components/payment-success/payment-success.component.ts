import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { PaymentVerificationService, OrderStatusResponse } from '../../services/payment-verification.service';
import { OrderNotificationService } from '../../../orders/services/order-notification.service';
import { OrderService } from '../../../orders/services/order.service';
import { CartService } from '../../../cart/services/cart.service';
import { AuthService } from '../../../../auth/services/auth.service';
import { IOrder } from '../../../orders/models/iorder';

@Component({
  selector: 'app-payment-success',
  templateUrl: './payment-success.component.html',
  styleUrls: ['./payment-success.component.scss']
})
export class PaymentSuccessComponent implements OnInit, OnDestroy {

  public orderId: string | null = null; // Propiedad para guardar el ID
  public paymentId: string | null = null; // Propiedad para guardar el ID del pago de MercadoPago
  public isVerifying: boolean = false; // Estado de verificación
  public verificationComplete: boolean = false; // Verificación completada
  public notificationSent: boolean = false; // Notificación enviada
  public errorMessage: string | null = null; // Mensaje de error si algo falla
  public isUserAuthenticated: boolean = false;
  public orderDetails: IOrder | null = null; // Detalles de la orden con productos
  public showNavigationConfirmation: boolean = true; // Controlar si mostrar confirmación antes de navegar

  private routeSub: Subscription | null = null; // Para manejar la suscripción

  // Inyectar servicios en el constructor
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paymentVerificationService: PaymentVerificationService,
    private orderNotificationService: OrderNotificationService,
    private orderService: OrderService,
    private cartService: CartService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    // Prevenir redirecciones automáticas al inicializar
    this.preventAutoRedirect();

    // Suscribirse a los query parameters al iniciar el componente
    this.routeSub = this.route.queryParamMap.subscribe(params => {
      // Obtener el valor del parámetro 'saleId' de la URL
      this.orderId = params.get('saleId');
      // Obtener el payment_id de MercadoPago si existe
      this.paymentId = params.get('payment_id');

      // Si tenemos los datos necesarios, verificar el pago
      if (this.orderId) {
        this.verifyPaymentAndNotify();
        this.loadOrderDetails();
      }
    });
  }

  /**
   * Previene redirecciones automáticas manteniendo al usuario en la página
   */
  private preventAutoRedirect(): void {
    // Interceptar intentos de redirección con window.beforeunload
    window.addEventListener('beforeunload', (event) => {
      if (this.showNavigationConfirmation && this.orderId) {
        // Mostrar confirmación si el usuario intenta salir antes de usar los botones
        event.preventDefault();
        event.returnValue = '¿Estás seguro de que quieres salir? Aún puedes revisar los detalles de tu pago.';
        return event.returnValue;
      }
    });

    // Prevenir navegación del historial del navegador temporalmente
    window.history.pushState(null, '', window.location.pathname + window.location.search);
    window.addEventListener('popstate', (event) => {
      if (this.showNavigationConfirmation && this.orderId) {
        // Volver a empujar el estado actual
        window.history.pushState(null, '', window.location.pathname + window.location.search);

        // Opcional: mostrar mensaje al usuario
        if (confirm('¿Estás seguro de que quieres salir? Aún puedes revisar los detalles de tu pago.')) {
          this.showNavigationConfirmation = false;
          window.history.back();
        }
      }
    });
  }

  /**
   * Carga los detalles de la orden incluyendo productos
   */
  private loadOrderDetails(): void {
    if (!this.orderId) return;

    this.orderService.getOrderById(this.orderId).subscribe({
      next: (order) => {
        this.orderDetails = order;
        console.log('Detalles de la orden cargados:', order);
      },
      error: (error) => {
        console.warn('Error al cargar detalles de la orden:', error);
        // No es crítico si no se pueden cargar los productos
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

      // Verificar el estado de la orden para notificación
      let orderStatus: any = null;
      try {
        orderStatus = await this.paymentVerificationService.verifyOrderStatus(this.orderId!).toPromise();
        console.log('Estado de la venta obtenido:', orderStatus);
      } catch (orderError: any) {
        console.warn('Error al verificar venta, continuando sin verificación:', orderError);
        // Si el endpoint de ventas no existe, continuamos con un estado por defecto
        orderStatus = {
          saleId: this.orderId,
          status: 'pending',
          total: 0,
          customerEmail: 'cliente@ejemplo.com'
        };
      }

      this.verificationComplete = true;
      console.log('Verificación completada. Estado final:', {
        orderId: this.orderId,
        isUserAuthenticated: this.isUserAuthenticated,
        orderStatus: orderStatus?.status
      });

      // Si la orden está pagada, enviar notificación
      const statusCode = orderStatus?.status?.code || orderStatus?.status?.name || orderStatus?.status;
      const isPaymentSuccessful = this.isPaymentStatusSuccessful(statusCode);

      if (isPaymentSuccessful) {
        console.log('Orden pagada detectada, enviando notificación. Status:', statusCode);

        // Simular datos de pago para la notificación
        const paymentData = {
          status: 'approved',
          transactionAmount: orderStatus.total,
          paymentMethodId: this.paymentId ? 'mercadopago' : 'cash',
          paymentMethod: this.paymentId ? 'online' : 'cash',
          payer: {
            email: orderStatus.customer?.email || 'cliente@ejemplo.com'
          }
        };

        await this.sendOrderNotification(paymentData);
        // Limpiar el carrito solo cuando el pago es exitoso
        this.clearCartAfterSuccessfulPayment();
      } else {
        console.warn('Orden no pagada, no se enviará notificación. Status:', statusCode, orderStatus);
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
   * Determina si el estado del pago debe considerarse como exitoso
   * Maneja múltiples formatos de status: string, objeto con code/name, etc.
   */
  private isPaymentStatusSuccessful(status: any): boolean {
    if (!status) {
      return false;
    }

    // Lista de estados que se consideran exitosos/pagados
    const successStates = [
      'approved',
      'pagado',
      'paid',
      'success',
      'successful',
      'completed',
      'PAGADO',
      'PENDIENTE PAGADO',
      'APROVADO',
      'APROBADO'
    ];

    // Si es un string, comparar directamente
    if (typeof status === 'string') {
      return successStates.some(state =>
        status.toLowerCase().includes(state.toLowerCase()) ||
        state.toLowerCase().includes(status.toLowerCase())
      );
    }

    // Si es un objeto, verificar las propiedades comunes
    if (typeof status === 'object') {
      const statusCode = status.code || status.name || status.status;
      if (statusCode) {
        return this.isPaymentStatusSuccessful(statusCode);
      }
    }

    return false;
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
   * Navega al inicio del sitio
   */
  navigateToHome(): void {
    this.showNavigationConfirmation = false;
    this.router.navigate(['/']);
  }

  /**
   * Navega a la página de mis pedidos
   */
  navigateToMyOrders(): void {
    this.showNavigationConfirmation = false;
    this.router.navigate(['/my-orders']);
  }

  /**
   * Navega al dashboard para seguir comprando
   */
  navigateToDashboard(): void {
    this.showNavigationConfirmation = false;
    this.router.navigate(['/dashboard']);
  }

  ngOnDestroy(): void {
    // Desuscribirse para evitar memory leaks al destruir el componente
    this.routeSub?.unsubscribe();
  }

}