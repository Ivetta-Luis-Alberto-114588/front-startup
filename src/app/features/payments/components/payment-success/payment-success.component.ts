// src/app/features/payments/components/payment-success/payment-success.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core'; // Importar OnInit y OnDestroy
import { ActivatedRoute } from '@angular/router'; // Importar ActivatedRoute
import { Subscription } from 'rxjs'; // Importar Subscription
import { PaymentVerificationService, OrderStatusResponse } from '../../services/payment-verification.service';
import { OrderNotificationService } from '../../../orders/services/order-notification.service';
import { CartService } from '../../../cart/services/cart.service';

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

  private routeSub: Subscription | null = null; // Para manejar la suscripción

  // Inyectar servicios en el constructor
  constructor(
    private route: ActivatedRoute,
    private paymentVerificationService: PaymentVerificationService,
    private orderNotificationService: OrderNotificationService,
    private cartService: CartService
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

      // Verificar el estado de la orden en lugar del pago directamente
      const orderStatus = await this.paymentVerificationService.verifyOrderStatus(this.orderId!).toPromise();

      console.log(JSON.stringify(orderStatus))

      this.paymentStatus = orderStatus?.status || 'unknown';
      this.verificationComplete = true;

      // Si la orden está pagada (status: 'Pendiente pagado' o 'Pagado'), enviar notificación
      if (orderStatus?.status === 'Pendiente pagado' || orderStatus?.status === 'Pagado') {
        // Simular datos de pago para la notificación
        const paymentData = {
          status: 'approved',
          transactionAmount: orderStatus.total,
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
      console.error('Error al verificar la orden:', error);
      this.errorMessage = 'Error al verificar el estado de la orden';
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

  ngOnDestroy(): void {
    // Desuscribirse para evitar memory leaks al destruir el componente
    this.routeSub?.unsubscribe();
  }

}