// src/app/features/products/components/product-detail/product-detail.component.ts
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, switchMap, catchError, EMPTY } from 'rxjs';
import { Location } from '@angular/common';

import { ProductService } from '../../services/product/product.service';
import { IProduct } from '../../model/iproduct';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { CartService } from '../../../cart/services/cart.service'; // <--- IMPORTAR CartService

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss']
})
export class ProductDetailComponent implements OnInit, OnDestroy {

  product: IProduct | null = null;
  isLoading = false;
  error: string | null = null;
  quantity: number = 1;
  private routeSub: Subscription | null = null;
  isAddingToCart = false; // Para deshabilitar botón mientras se añade

  constructor(
    private productService: ProductService,
    private activatedRoute: ActivatedRoute,
    private notificationService: NotificationService,
    private location: Location,
    private router: Router,
    private cartService: CartService // <--- INYECTAR CartService
  ) { }

  ngOnInit(): void {
    // ... (tu lógica existente de ngOnInit para cargar el producto) ...
    this.routeSub = this.activatedRoute.paramMap.pipe(
      switchMap(params => {
        const productId = params.get('idProduct');
        this.isLoading = true;
        this.error = null;
        this.product = null;
        this.quantity = 1;

        if (productId) {
          return this.productService.getProductsById(productId).pipe(
            catchError(err => {
              console.error('Error fetching product details:', err);
              if (err.status === 404) {
                this.error = 'Producto no encontrado.';
              } else {
                this.error = 'No se pudo cargar el detalle del producto. Intente más tarde.';
              }
              this.isLoading = false;
              return EMPTY;
            })
          );
        } else {
          this.error = 'ID de producto no especificado en la ruta.';
          this.isLoading = false;
          return EMPTY;
        }
      })
    ).subscribe({
      next: (data) => {
        this.product = data;
        this.isLoading = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  increaseQuantity(): void {
    if (this.product && this.quantity < this.product.stock) {
      this.quantity++;
    }
  }

  decreaseQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  // --- MÉTODO addToCart ACTUALIZADO ---
  addToCart(): void {
    if (!this.product || this.isAddingToCart) return; // No hacer nada si no hay producto o ya se está añadiendo

    this.isAddingToCart = true; // Deshabilitar botón

    this.cartService.addItem(this.product.id, this.quantity).subscribe({
      next: (updatedCart) => {
        // Éxito: El servicio ya muestra la notificación
        this.isAddingToCart = false; // Habilitar botón
      },
      error: (err) => {
        // Error: El servicio ya muestra la notificación de error
        console.error('Error al añadir al carrito desde ProductDetail:', err);
        this.isAddingToCart = false; // Habilitar botón en caso de error
        // Podrías mostrar un mensaje más específico aquí si quieres,
        // pero el servicio ya lo hace con NotificationService.
        // this.error = err.message || 'No se pudo añadir el producto al carrito.';
      }
    });
  }
  // --- FIN MÉTODO addToCart ---

  goBack(): void {
    this.location.back();
  }
}