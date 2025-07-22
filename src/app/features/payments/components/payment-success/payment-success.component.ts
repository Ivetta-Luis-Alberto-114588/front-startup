import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { PaymentVerificationService, OrderStatusResponse } from '../../services/payment-verification.service';
import { OrderNotificationService } from '../../../orders/services/order-notification.service';
import { OrderService } from '../../../orders/services/order.service';
import { OrderInquiryService } from '../../../order-inquiry/services/order-inquiry.service';
import { CartService } from '../../../cart/services/cart.service';
import { AuthService } from '../../../../auth/services/auth.service';
import { IOrder } from '../../../orders/models/iorder';
import { PublicOrderResponse } from '../../../order-inquiry/models/order-public.interface';

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
  public orderDetails: IOrder | PublicOrderResponse | null = null; // Detalles de la orden con productos
  public showNavigationConfirmation: boolean = false; // Controlar si mostrar confirmación antes de navegar

  private routeSub: Subscription | null = null; // Para manejar la suscripción

  // Inyectar servicios en el constructor
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paymentVerificationService: PaymentVerificationService,
    private orderNotificationService: OrderNotificationService,
    private orderService: OrderService,
    private orderInquiryService: OrderInquiryService,
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
   * Usa diferentes servicios según si el usuario está autenticado o no
   */
  private loadOrderDetails(): void {
    if (!this.orderId) return;

    // Verificar si el usuario está autenticado
    const isAuthenticated = this.authService.isAuthenticated();
    console.log('🔍 Usuario autenticado:', isAuthenticated);

    if (isAuthenticated) {
      // Usuario autenticado: usar servicio privado con más detalles
      console.log('🔍 Cargando detalles con servicio autenticado...');
      this.orderService.getOrderById(this.orderId).subscribe({
        next: (order) => {
          this.orderDetails = order;
          console.log('✅ Detalles de la orden cargados (autenticado):', order);
        },
        error: (error) => {
          console.warn('⚠️ Error al cargar detalles de la orden (autenticado):', error);
          // Fallback: intentar con servicio público
          this.loadPublicOrderDetails();
        }
      });
    } else {
      // Usuario invitado: usar servicio público
      console.log('🔍 Cargando detalles con servicio público...');
      this.loadPublicOrderDetails();
    }
  }

  /**
   * Carga los detalles de la orden usando el servicio público (sin autenticación)
   */
  private loadPublicOrderDetails(): void {
    if (!this.orderId) return;

    this.orderInquiryService.getOrderById(this.orderId).subscribe({
      next: (order) => {
        this.orderDetails = order;
        console.log('✅ Detalles de la orden cargados (público):', order);

        // Para usuarios invitados, redirigir automáticamente después de un breve delay
        console.log('🔄 Programando redirección automática para usuario invitado...');
        setTimeout(() => {
          if (!this.authService.isAuthenticated() && this.orderId) {
            console.log('🔄 Redirigiendo a /order/' + this.orderId);
            this.router.navigate(['/order', this.orderId]);
          }
        }, 3000); // 3 segundos para que el usuario vea la pantalla de éxito
      },
      error: (error) => {
        console.error('❌ Error al cargar detalles de la orden (público):', error);
        // No es crítico si no se pueden cargar los productos
        // Pero aún así redirigir al usuario invitado
        if (!this.authService.isAuthenticated() && this.orderId) {
          console.log('🔄 Redirigiendo a /order/' + this.orderId + ' (con error)');
          setTimeout(() => {
            this.router.navigate(['/order', this.orderId]);
          }, 2000);
        }
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
        console.log('Orden pagada detectada. Status:', statusCode);

        // ✅ NOTIFICACIÓN AHORA SE ENVÍA DESDE EL BACKEND (webhook de MercadoPago)
        // Ya no necesitamos enviar desde el frontend para evitar duplicados

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
      // Preparar payload base para el nuevo endpoint manual
      const basePayload = {
        orderId: this.orderId!,
        customerName: paymentData.payer?.email || 'Cliente',
        customerEmail: paymentData.payer?.email || '',
        total: paymentData.transactionAmount || 0,
        paymentMethod: paymentData.paymentMethodId || 'unknown',
        paymentId: this.paymentId || undefined,
        items: [] // Por ahora vacío, se podría obtener del backend si es necesario
      };

      const subject = paymentData.paymentMethod === 'cash'
        ? `Nueva orden en efectivo #${this.orderId}`
        : `Orden pagada online #${this.orderId}`;
      const message = JSON.stringify(basePayload);
      const payload = {
        subject,
        message,
        emailTo: basePayload.customerEmail // opcional
      };

      await this.orderNotificationService.sendManualNotification(payload).toPromise();
      this.notificationSent = true;
      console.log('Notificación manual enviada exitosamente');

    } catch (error) {
      console.error('Error al enviar notificación manual:', error);
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

    // ✅ NOTIFICACIÓN PARA PAGOS EN EFECTIVO AHORA SE MANEJA DESDE EL BACKEND
    // Comentado para evitar notificaciones duplicadas
    // this.sendOrderNotification(cashPaymentData);
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

    if (this.isUserAuthenticated) {
      // Usuario autenticado: ir a mis pedidos
      this.router.navigate(['/my-orders']);
    } else {
      // Usuario invitado: ir a consulta pública de orden
      if (this.orderId) {
        this.router.navigate(['/order', this.orderId]);
      } else {
        this.router.navigate(['/']);
      }
    }
  }

  /**
   * Navega al dashboard para seguir comprando
   */
  navigateToDashboard(): void {
    this.showNavigationConfirmation = false;
    this.router.navigate(['/dashboard']);
  }

  // Helper methods para normalizar el acceso a datos entre IOrder y PublicOrderResponse

  /**
   * Obtiene los items de la orden de forma normalizada
   */
  getOrderItems(): any[] {
    if (!this.orderDetails) return [];
    return this.orderDetails.items || [];
  }

  /**
   * Obtiene el total de la orden de forma normalizada
   */
  getOrderTotal(): number {
    if (!this.orderDetails) return 0;
    return this.orderDetails.total || 0;
  }

  /**
   * Obtiene el nombre del producto de un item de forma normalizada
   */
  getItemProductName(item: any): string {
    return item.product?.name || 'Producto';
  }

  /**
   * Obtiene la descripción del producto de un item de forma normalizada
   */
  getItemProductDescription(item: any): string {
    return item.product?.description || '';
  }

  /**
   * Obtiene el precio unitario de un item de forma normalizada
   */
  getItemUnitPrice(item: any): number {
    return item.unitPrice || 0;
  }

  /**
   * Obtiene la cantidad de un item de forma normalizada
   */
  getItemQuantity(item: any): number {
    return item.quantity || 0;
  }

  /**
   * Obtiene el subtotal de un item de forma normalizada
   */
  getItemSubtotal(item: any): number {
    return item.subtotal || (this.getItemUnitPrice(item) * this.getItemQuantity(item));
  }

  ngOnDestroy(): void {
    // Desuscribirse para evitar memory leaks al destruir el componente
    this.routeSub?.unsubscribe();
  }

}