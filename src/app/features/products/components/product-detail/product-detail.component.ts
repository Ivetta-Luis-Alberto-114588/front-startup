import { Component, OnDestroy, OnInit } from '@angular/core';
import { ProductService } from '../../services/product/product.service';
import { ActivatedRoute } from '@angular/router';
import { IProduct } from '../../model/iproduct';
import { Subscription, switchMap } from 'rxjs';
import { NotificationService } from 'src/app/shared/services/notification.service';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss']
})
export class ProductDetailComponent implements OnInit, OnDestroy {

  product: IProduct | null = null;
  isLoading = false;
  error: string | null = null;
  // --- NUEVA VARIABLE para la cantidad ---
  quantity: number = 1; // Inicializamos la cantidad en 1
  private routeSub: Subscription | null = null; // Para desuscripción

  constructor(
    private productService: ProductService,
    private activatedRoute: ActivatedRoute,
    private notificationService: NotificationService
  ) { }



  ngOnInit(): void {
    this.routeSub = this.activatedRoute.paramMap.pipe(
      switchMap(params => {
        const productId = params.get('idProduct');
        this.isLoading = true;
        this.error = null;
        this.product = null; // Limpiar producto anterior
        this.quantity = 1; // Resetear cantidad

        if (productId) {
          return this.productService.getProductsById(productId);
        } else {
          this.error = 'ID de producto no especificado';
          this.isLoading = false;
          return []; // O throwError(() => new Error('ID...'))
        }
      })
    ).subscribe({
      next: (data) => {
        this.product = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching product details:', err);
        this.error = 'No se pudo cargar el detalle del producto. Intente más tarde.';
        this.isLoading = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }


  // --- NUEVOS MÉTODOS para controlar la cantidad ---
  increaseQuantity(): void {
    // Solo incrementa si hay un producto cargado y la cantidad es menor que el stock
    if (this.product && this.quantity < this.product.stock) {
      this.quantity++;
    }
    // Si no hay límite de stock (product.stock es null o undefined), simplemente incrementa
    // (Aunque pusiste [disabled] en el HTML, es bueno tener la lógica aquí también)
    else if (this.product && this.product.stock === null) {
      this.quantity++;
    }
    console.log("Cantidad incrementada a:", this.quantity);
  }

  decreaseQuantity(): void {
    // Solo decrementa si la cantidad es mayor que 1
    if (this.quantity > 1) {
      this.quantity--;
      console.log("Cantidad decrementada a:", this.quantity);
    }
  }

  // --- MÉTODO PLACEHOLDER para añadir al carrito (lo implementaremos después) ---
  addToCart(): void {
    if (!this.product) return; // No hacer nada si el producto no está cargado

    console.log(`Intentando agregar ${this.quantity} unidad(es) de ${this.product.name} (ID: ${this.product.id}) al carrito.`);
    // Aquí irá la lógica para llamar al servicio del carrito
    this.notificationService.showInfo(`Simulación: ${this.quantity} x ${this.product.name} añadido(s).`, 'Carrito');
  }


}
