// Ejemplo de componente para verificación de órdenes
// Nota: Ajustar importaciones según tu estructura de proyecto

import { Component } from '@angular/core';
import { PaymentVerificationService } from '../../payments/services/payment-verification.service';

@Component({
  selector: 'app-order-verification',
  template: `
    <div class="container mt-4">
      <h3>Verificación de Órdenes</h3>
      
      <div class="card">
        <div class="card-body">
          <div class="mb-3">
            <label for="orderId" class="form-label">ID de la Orden:</label>
            <input 
              type="text" 
              class="form-control" 
              id="orderId" 
              [(ngModel)]="orderId"
              placeholder="Ingresa el ID de la orden a verificar">
          </div>
          
          <button 
            class="btn btn-primary me-2" 
            (click)="verifyOrderStatus()" 
            [disabled]="isVerifying || !orderId">
            Verificar Estado
          </button>
          
          <button 
            class="btn btn-warning" 
            (click)="forceVerifyAndUpdate()" 
            [disabled]="isVerifying || !orderId">
            Forzar Verificación y Actualizar
          </button>
        </div>
      </div>

      <!-- Resultados -->
      <div *ngIf="verificationResult" class="card mt-3">
        <div class="card-header">
          <h5 class="mb-0">Resultado de Verificación</h5>
        </div>
        <div class="card-body">
          <p><strong>Estado:</strong> {{ verificationResult.status }}</p>
          <p><strong>Total:</strong> {{ verificationResult.total | currency }}</p>
          <p><strong>Email Cliente:</strong> {{ verificationResult.customerEmail }}</p>
        </div>
      </div>

      <!-- Error -->
      <div *ngIf="errorMessage" class="alert alert-danger mt-3">
        {{ errorMessage }}
      </div>
    </div>
  `
})
export class OrderVerificationComponent {
  orderId: string = '';
  isVerifying: boolean = false;
  verificationResult: any = null;
  errorMessage: string = '';

  constructor(
    private paymentVerificationService: PaymentVerificationService
  ) { }

  verifyOrderStatus(): void {
    if (!this.orderId.trim()) {
      alert('Por favor ingresa un ID de orden válido');
      return;
    }

    this.isVerifying = true;
    this.errorMessage = '';
    this.verificationResult = null;

    this.paymentVerificationService.getPaymentStatusWithVerification(this.orderId)
      .subscribe({
        next: (result: any) => {
          this.verificationResult = result;
          console.log('Verificación completada:', result);
          this.isVerifying = false;
        },
        error: (error: any) => {
          this.errorMessage = error.error?.message || 'Error al verificar la orden';
          console.error('Error en verificación:', error);
          this.isVerifying = false;
        }
      });
  }

  forceVerifyAndUpdate(): void {
    if (!this.orderId.trim()) {
      alert('Por favor ingresa un ID de orden válido');
      return;
    }

    this.isVerifying = true;
    this.errorMessage = '';

    this.paymentVerificationService.manualVerifyAndUpdate(this.orderId)
      .subscribe({
        next: (result: any) => {
          console.log('Verificación forzada completada:', result);
          // Después de forzar la verificación, obtener el estado actualizado
          this.verifyOrderStatus();
        },
        error: (error: any) => {
          this.errorMessage = error.error?.message || 'Error al forzar la verificación';
          console.error('Error en verificación forzada:', error);
          this.isVerifying = false;
        }
      });
  }
}
