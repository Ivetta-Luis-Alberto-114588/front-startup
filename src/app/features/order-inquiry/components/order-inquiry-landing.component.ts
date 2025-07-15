import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'app-order-inquiry-landing',
    template: `
    <div class="container my-5">
      <div class="row justify-content-center">
        <div class="col-md-8 col-lg-6">
          <div class="card shadow">
            <div class="card-header bg-primary text-white text-center">
              <h3 class="mb-0">
                <i class="fas fa-search me-2"></i>
                Consultar Estado de Orden
              </h3>
              <p class="mb-0 mt-2">Ingresa el ID de tu orden para ver su estado</p>
            </div>
            <div class="card-body p-4">
              
              <!-- Información introductoria -->
              <div class="alert alert-info mb-4">
                <i class="fas fa-info-circle me-2"></i>
                <strong>¿Tienes una orden y quieres saber su estado?</strong><br>
                Ingresa el ID de tu orden aquí para ver toda la información: estado actual, productos, método de entrega y más.
              </div>

              <!-- Formulario de búsqueda -->
              <div class="mb-3">
                <label for="orderId" class="form-label fw-bold">ID de la Orden:</label>
                <input 
                  type="text" 
                  class="form-control form-control-lg" 
                  id="orderId" 
                  [(ngModel)]="orderId"
                  placeholder="Ej: 68767f84e969706394f06e4a"
                  (keyup.enter)="consultarOrden()"
                >
                <div class="form-text">
                  El ID de la orden es un código único que recibiste en tu email de confirmación.
                </div>
              </div>
              
              <!-- Botones de acción -->
              <div class="d-grid gap-2 mb-3">
                <button 
                  class="btn btn-primary btn-lg" 
                  (click)="consultarOrden()"
                  [disabled]="!orderId || orderId.length < 20"
                >
                  <i class="fas fa-search me-2"></i>
                  Consultar Orden
                </button>
              </div>

              <div class="row">
                <div class="col-6">
                  <button 
                    class="btn btn-outline-secondary w-100" 
                    (click)="probarConEjemplo()"
                  >
                    <i class="fas fa-flask me-2"></i>
                    Ver Ejemplo
                  </button>
                </div>
                <div class="col-6">
                  <button 
                    class="btn btn-outline-info w-100" 
                    (click)="irATestAPI()"
                  >
                    <i class="fas fa-code me-2"></i>
                    Test API
                  </button>
                </div>
              </div>
              
              <!-- Mensaje de error -->
              <div class="alert alert-warning mt-3" *ngIf="error">
                <i class="fas fa-exclamation-triangle me-2"></i>
                {{ error }}
              </div>
            </div>
            
            <!-- Footer del card -->
            <div class="card-footer bg-light text-center">
              <small class="text-muted">
                <i class="fas fa-shield-alt me-1"></i>
                Esta consulta es segura y no requiere iniciar sesión
              </small>
            </div>
          </div>

          <!-- Información adicional -->
          <div class="mt-4">
            <div class="row">
              <div class="col-md-6 mb-3">
                <div class="card h-100">
                  <div class="card-body text-center">
                    <i class="fas fa-user-shield fa-2x text-success mb-2"></i>
                    <h6>Para Clientes Invitados</h6>
                    <p class="small text-muted">
                      No necesitas crear una cuenta para consultar tu orden.
                    </p>
                  </div>
                </div>
              </div>
              <div class="col-md-6 mb-3">
                <div class="card h-100">
                  <div class="card-body text-center">
                    <i class="fas fa-clock fa-2x text-info mb-2"></i>
                    <h6>Estado en Tiempo Real</h6>
                    <p class="small text-muted">
                      Información actualizada sobre el progreso de tu pedido.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .card {
      border: none;
      border-radius: 15px;
    }
    
    .card-header {
      border-radius: 15px 15px 0 0 !important;
    }
    
    .btn-lg {
      padding: 12px 30px;
      border-radius: 8px;
    }
    
    .form-control-lg {
      border-radius: 8px;
      border: 2px solid #e9ecef;
      transition: all 0.3s ease;
    }
    
    .form-control-lg:focus {
      border-color: #007bff;
      box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
    }
    
    .shadow {
      box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1) !important;
    }
    
    .fa-2x {
      font-size: 2rem;
    }
    
    .card.h-100 {
      border: 1px solid #e9ecef;
      transition: transform 0.2s ease;
    }
    
    .card.h-100:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    }
  `]
})
export class OrderInquiryLandingComponent {
    orderId: string = '';
    error: string = '';

    constructor(private router: Router) { }

    consultarOrden(): void {
        if (!this.orderId || this.orderId.length < 20) {
            this.error = 'Por favor ingresa un ID de orden válido (mínimo 20 caracteres)';
            return;
        }

        this.error = '';
        // Navegar a la ruta de consulta de orden específica
        this.router.navigate(['/order', this.orderId]);
    }

    probarConEjemplo(): void {
        this.orderId = '68767f84e969706394f06e4a';
        this.error = '';
    }

    irATestAPI(): void {
        this.router.navigate(['/test-order/api-test']);
    }
}
