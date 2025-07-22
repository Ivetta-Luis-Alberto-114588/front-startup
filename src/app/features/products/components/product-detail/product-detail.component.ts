// src/app/features/products/components/product-detail/product-detail.component.ts
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, switchMap, catchError, EMPTY, finalize, of } from 'rxjs';
import { Location } from '@angular/common';

import { ProductService } from '../../services/product/product.service';
import { IProduct } from '../../model/iproduct';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { CartService } from '../../../cart/services/cart.service';
import { AuthService } from 'src/app/auth/services/auth.service'; // Importar AuthService

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
  isAddingToCart = false;

  constructor(
    private productService: ProductService,
    private activatedRoute: ActivatedRoute,
    private notificationService: NotificationService,
    private location: Location,
    private router: Router,
    private cartService: CartService,
    private authService: AuthService // Inyectar AuthService
  ) { }

  ngOnInit(): void {
    // ... (lógica ngOnInit sin cambios) ...
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
              if (err.status === 404) {
                this.error = 'Producto no encontrado.';
              } else {
                this.error = 'No se pudo cargar el detalle del producto. Intente más tarde.';
              }
              this.isLoading = false;
              return EMPTY; // Detener el flujo si hay error
            })
          );
        } else {
          this.error = 'ID de producto no especificado en la ruta.';
          this.isLoading = false;
          return EMPTY; // Detener el flujo
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

  goBack(): void {
    this.location.back();
  }

  addToCart(): void {
    if (!this.product || this.isAddingToCart || this.product.stock <= 0 || this.quantity <= 0 || this.quantity > this.product.stock) {
      // Validaciones de producto y cantidad
      if (this.product && this.quantity <= 0) {
        this.notificationService.showWarning('La cantidad debe ser mayor a cero.');
      }
      if (this.product && this.quantity > this.product.stock) {
        this.notificationService.showWarning(`Solo hay ${this.product.stock} unidades disponibles.`);
      }
      return;
    }

    // Agregar al carrito (funciona tanto para usuarios autenticados como invitados)
    this.isAddingToCart = true;
    this.cartService.addItem(this.product.id, this.quantity).pipe(
      finalize(() => { this.isAddingToCart = false; })
    ).subscribe({
      next: () => {
        // El servicio ya maneja las notificaciones
        // Resetear cantidad a 1 después de agregar exitosamente
        this.quantity = 1;
      },
      error: (err) => {
        console.error('[ProductDetail] Error al añadir al carrito:', err);
        // El servicio ya muestra el error, no necesitamos duplicar notificación
      }
    });
  }


}