import { Component, OnInit } from '@angular/core';
import { OrderInquiryService } from '../services/order-inquiry.service';

@Component({
    selector: 'app-api-test',
    template: `
    <div class="container my-5">
      <div class="row">
        <div class="col-md-10 offset-md-1">
          <div class="card">
            <div class="card-header bg-success text-white">
              <h4 class="mb-0">
                <i class="fas fa-code me-2"></i>
                Test API - Consulta de Orden Pública
              </h4>
            </div>
            <div class="card-body">
              <div class="alert alert-info">
                <i class="fas fa-info-circle me-2"></i>
                <strong>API Endpoint:</strong> 
                <code>{{ apiUrl }}/orders/{{ orderId }}</code>
                <br>
                <strong>Método:</strong> GET (Sin autenticación)
              </div>
              
              <div class="row mb-3">
                <div class="col-md-8">
                  <label for="orderId" class="form-label">ID de la Orden:</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    id="orderId" 
                    [(ngModel)]="orderId"
                    placeholder="Ej: 68767f84e969706394f06e4a"
                  >
                </div>
                <div class="col-md-4 d-flex align-items-end">
                  <button 
                    class="btn btn-primary w-100" 
                    (click)="testAPI()"
                    [disabled]="!orderId || isLoading"
                  >
                    <i class="fas fa-play me-2" *ngIf="!isLoading"></i>
                    <span class="spinner-border spinner-border-sm me-2" *ngIf="isLoading"></span>
                    {{ isLoading ? 'Consultando...' : 'Probar API' }}
                  </button>
                </div>
              </div>
              
              <div class="mb-3">
                <button 
                  class="btn btn-secondary me-2" 
                  (click)="useExampleId()"
                >
                  <i class="fas fa-flask me-2"></i>
                  Usar ID de Ejemplo
                </button>
                <button 
                  class="btn btn-outline-secondary" 
                  (click)="clearResults()"
                >
                  <i class="fas fa-trash me-2"></i>
                  Limpiar
                </button>
              </div>
              
              <!-- Resultados -->
              <div *ngIf="response || error" class="mt-4">
                <h5>Respuesta de la API:</h5>
                
                <!-- Success -->
                <div *ngIf="response" class="alert alert-success">
                  <h6><i class="fas fa-check-circle me-2"></i>Éxito - Status 200</h6>
                  <pre class="bg-light p-3 rounded">{{ response | json }}</pre>
                </div>
                
                <!-- Error -->
                <div *ngIf="error" class="alert alert-danger">
                  <h6><i class="fas fa-exclamation-circle me-2"></i>Error</h6>
                  <p>{{ error }}</p>
                  <small class="text-muted">
                    Verifica que el ID de la orden sea correcto y que el backend esté funcionando.
                  </small>
                </div>
              </div>
              
              <!-- Info adicional -->
              <div class="mt-4">
                <h5>Información sobre la implementación:</h5>
                <ul class="list-group">
                  <li class="list-group-item">
                    <i class="fas fa-shield-alt me-2 text-success"></i>
                    <strong>Ruta no protegida:</strong> Esta consulta NO requiere autenticación JWT
                  </li>
                  <li class="list-group-item">
                    <i class="fas fa-user-secret me-2 text-info"></i>
                    <strong>Para clientes invitados:</strong> Permite consultar órdenes sin login
                  </li>
                  <li class="list-group-item">
                    <i class="fas fa-route me-2 text-warning"></i>
                    <strong>URL del frontend:</strong> <code>/order/{{ orderId || 'ORDER_ID' }}</code>
                  </li>
                  <li class="list-group-item">
                    <i class="fas fa-server me-2 text-primary"></i>
                    <strong>Backend configurado:</strong> {{ apiUrl }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    pre {
      max-height: 400px;
      overflow-y: auto;
      font-size: 0.9rem;
    }
    .list-group-item {
      border: none;
      padding: 0.75rem 0;
    }
    .card {
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    code {
      background-color: #f8f9fa;
      padding: 2px 4px;
      border-radius: 3px;
    }
  `]
})
export class ApiTestComponent implements OnInit {
    orderId: string = '';
    response: any = null;
    error: string = '';
    isLoading: boolean = false;
    apiUrl: string = '';

    constructor(private orderInquiryService: OrderInquiryService) { }

    ngOnInit(): void {
        // Obtener la URL de la API del environment
        this.apiUrl = 'https://sistema-mongo.onrender.com/api';
    }

    testAPI(): void {
        if (!this.orderId) {
            this.error = 'Por favor ingresa un ID de orden';
            return;
        }

        this.isLoading = true;
        this.response = null;
        this.error = '';

        this.orderInquiryService.getOrderById(this.orderId).subscribe({
            next: (data) => {
                this.response = data;
                this.isLoading = false;
            },
            error: (err) => {
                this.error = err.message || 'Error al consultar la API';
                this.isLoading = false;
            }
        });
    }

    useExampleId(): void {
        this.orderId = '68767f84e969706394f06e4a';
        this.clearResults();
    }

    clearResults(): void {
        this.response = null;
        this.error = '';
    }
}
