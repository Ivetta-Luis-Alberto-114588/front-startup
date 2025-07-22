import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-order-confirmation',
  template: `
    <div class="container mt-5">
      <div class="row justify-content-center">
        <div class="col-md-8">
          <div class="card shadow-lg">
            <div class="card-body text-center py-5">
              <i class="fas fa-check-circle text-success" style="font-size: 4rem;"></i>
              <h2 class="mt-4 text-success">¡Pedido Confirmado!</h2>
              <p class="lead mt-3">Su pedido ha sido procesado exitosamente</p>
              
              <div *ngIf="orderId" class="alert alert-info">
                <strong>Número de pedido:</strong> {{orderId}}
              </div>
              
              <div *ngIf="isGuest" class="alert alert-warning">
                <i class="fas fa-info-circle me-2"></i>
                Como invitado, recibirá una confirmación por email con los detalles de su pedido.
              </div>
              
              <div class="mt-4">
                <button class="btn btn-primary me-3" (click)="goToProducts()">
                  <i class="fas fa-shopping-bag me-2"></i>Seguir Comprando
                </button>
                <button class="btn btn-outline-secondary" (click)="goHome()">
                  <i class="fas fa-home me-2"></i>Ir al Inicio
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class OrderConfirmationComponent implements OnInit {

  orderId: string | null = null;
  isGuest: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.orderId = params['orderId'] || null;
      this.isGuest = params['isGuest'] === 'true';
    });
  }

  goToProducts(): void {
    this.router.navigate(['/products']);
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}
