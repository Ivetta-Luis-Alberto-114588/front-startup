import { Component } from '@angular/core';

@Component({
    selector: 'app-order-test',
    template: `
    <div class="container my-5">
      <div class="row">
        <div class="col-md-8 offset-md-2">
          <div class="card">
            <div class="card-header bg-primary text-white">
              <h4 class="mb-0">
                <i class="fas fa-search me-2"></i>
                Consultar Orden Pública
              </h4>
            </div>
            <div class="card-body">
              <p class="mb-3">
                Utiliza esta funcionalidad para consultar una orden específica sin necesidad de autenticación.
                Esto es útil para clientes invitados que quieren verificar el estado de sus pedidos.
              </p>
              
              <div class="mb-3">
                <label for="orderId" class="form-label">ID de la Orden:</label>
                <input 
                  type="text" 
                  class="form-control" 
                  id="orderId" 
                  [(ngModel)]="orderId"
                  placeholder="Ej: 68767f84e969706394f06e4a"
                >
              </div>
              
              <div class="mb-3">
                <button 
                  class="btn btn-primary me-2" 
                  (click)="consultarOrden()"
                  [disabled]="!orderId || orderId.length < 20"
                >
                  <i class="fas fa-search me-2"></i>
                  Consultar Orden
                </button>
                <button 
                  class="btn btn-secondary" 
                  (click)="probarConEjemplo()"
                >
                  <i class="fas fa-flask me-2"></i>
                  Probar con Ejemplo
                </button>
              </div>
              
              <div class="alert alert-info">
                <i class="fas fa-info-circle me-2"></i>
                <strong>Nota:</strong> Esta ruta es pública y no requiere autenticación.
                La URL sería: <code>/order/{{ orderId || 'ORDER_ID' }}</code>
              </div>
              
              <div class="alert alert-warning" *ngIf="error">
                <i class="fas fa-exclamation-triangle me-2"></i>
                {{ error }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .card {
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
  `]
})
export class OrderTestComponent {
    orderId: string = '';
    error: string = '';

    consultarOrden(): void {
        if (!this.orderId || this.orderId.length < 20) {
            this.error = 'Por favor ingresa un ID de orden válido (mínimo 20 caracteres)';
            return;
        }

        this.error = '';
        // Navegar a la ruta de consulta
        window.open(`/order/${this.orderId}`, '_blank');
    }

    probarConEjemplo(): void {
        this.orderId = '68767f84e969706394f06e4a';
        this.error = '';
    }
}
