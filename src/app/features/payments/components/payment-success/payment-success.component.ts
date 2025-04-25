// src/app/features/payments/components/payment-success/payment-success.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core'; // Importar OnInit y OnDestroy
import { ActivatedRoute } from '@angular/router'; // Importar ActivatedRoute
import { Subscription } from 'rxjs'; // Importar Subscription

@Component({
  selector: 'app-payment-success',
  templateUrl: './payment-success.component.html',
  styleUrls: ['./payment-success.component.scss']
})
export class PaymentSuccessComponent implements OnInit, OnDestroy { // Implementar interfaces

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
    });
  }

  ngOnDestroy(): void {
    // Desuscribirse para evitar memory leaks al destruir el componente
    this.routeSub?.unsubscribe();
  }

}