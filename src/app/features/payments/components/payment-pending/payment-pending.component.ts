// src/app/features/payments/components/payment-pending/payment-pending.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core'; // Importar OnInit y OnDestroy
import { ActivatedRoute } from '@angular/router'; // Importar ActivatedRoute
import { Subscription } from 'rxjs'; // Importar Subscription

@Component({
  selector: 'app-payment-pending',
  templateUrl: './payment-pending.component.html',
  styleUrls: ['./payment-pending.component.scss']
})
export class PaymentPendingComponent implements OnInit, OnDestroy { // Implementar interfaces

  public orderId: string | null = null; // Propiedad para guardar el ID
  private routeSub: Subscription | null = null; // Para manejar la suscripción

  // Inyectar ActivatedRoute en el constructor
  constructor(private route: ActivatedRoute) { }

  ngOnInit(): void {
    // Suscribirse a los query parameters al iniciar el componente
    this.routeSub = this.route.queryParamMap.subscribe(params => {
      // Obtener el valor del parámetro 'saleId' de la URL
      this.orderId = params.get('saleId');
      // Opcional: Log para verificar
      console.log('PaymentPendingComponent - Order ID from URL:', this.orderId);
    });
  }

  ngOnDestroy(): void {
    // Desuscribirse para evitar memory leaks al destruir el componente
    this.routeSub?.unsubscribe();
  }

}