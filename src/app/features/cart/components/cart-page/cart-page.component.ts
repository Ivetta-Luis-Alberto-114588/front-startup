// src/app/features/cart/components/cart-page/cart-page.component.ts
import { Component, OnInit, OnDestroy, TemplateRef, ViewChild } from '@angular/core'; // Añadir TemplateRef, ViewChild
import { Router } from '@angular/router';
import { Subscription, Observable } from 'rxjs';
import { Location } from '@angular/common';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap'; // <--- IMPORTAR NgbModal y NgbModalRef

import { ICart } from '../../models/icart';
import { ICartItem } from '../../models/icart-item';
import { CartService } from '../../services/cart.service';
import { AuthService } from 'src/app/auth/services/auth.service';

@Component({
  selector: 'app-cart-page',
  templateUrl: './cart-page.component.html',
  styleUrls: ['./cart-page.component.scss']
})
export class CartPageComponent implements OnInit, OnDestroy {

  // Referencia a la plantilla del modal en el HTML
  @ViewChild('confirmClearCartModal') private modalContent!: TemplateRef<any>;
  private modalRef!: NgbModalRef; // Para guardar la referencia al modal abierto

  cart$: Observable<ICart | null>;
  isLoading: boolean = false;
  error: string | null = null;
  updatingItemId: string | null = null;
  clearingCart: boolean = false;
  private cartSubscription: Subscription | null = null;

  constructor(
    private cartService: CartService,
    private authService: AuthService,
    private router: Router,
    private location: Location,
    private modalService: NgbModal // <--- INYECTAR NgbModal
  ) {
    this.cart$ = this.cartService.cart$;
  }

  // ... (ngOnInit, ngOnDestroy, loadCart, increaseQuantity, etc. sin cambios) ...
  ngOnInit(): void { this.loadCart(); }
  ngOnDestroy(): void { this.cartSubscription?.unsubscribe(); }


  proceedToCheckout(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/checkout']);
    } else {
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: '/checkout' } });
    }
  }

  decreaseQuantity(item: ICartItem): void {
    if (this.updatingItemId) return;
    if (item.quantity <= 1) {
      this.removeItem(item.product.id); // Llama a removeItem si la cantidad es 1
    } else {
      this.updatingItemId = item.product.id;
      this.cartService.updateItemQuantity(item.product.id, item.quantity - 1)
        .subscribe({ complete: () => this.updatingItemId = null });
    }
  }

  getProductId(item: ICartItem): string { return item.product.id; }


  goBack(): void { this.location.back(); }

  increaseQuantity(item: ICartItem): void {
    if (this.updatingItemId) return;
    this.updatingItemId = item.product.id;
    this.cartService.updateItemQuantity(item.product.id, item.quantity + 1)
      .subscribe({ complete: () => this.updatingItemId = null });
  }

  loadCart(): void {
    this.isLoading = true;
    this.error = null;
    this.cartSubscription = this.cartService.getCart().subscribe({
      next: (cart) => {
        this.isLoading = false;
        if (!cart || cart.items.length === 0) {
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err.message || 'No se pudo cargar el carrito.';
      }
    });
  }

  removeItem(productId: string): void {
    // ***** AÑADIR ESTE LOG *****
    // ***** FIN LOG AÑADIDO *****

    if (this.updatingItemId) {
      return; // Evitar múltiples actualizaciones
    }
    this.updatingItemId = productId; // Usar el mismo flag para deshabilitar
    this.cartService.removeItem(productId)
      .subscribe({
        error: (err) => console.error('[CartPage] Error en subscribe de removeItem:', err), // Loguear error si la suscripción falla
        complete: () => {
          this.updatingItemId = null; // Resetear al completar
        }
      });
  }

  /** Abre el modal de confirmación para vaciar el carrito */
  openClearCartConfirmation(): void {
    if (this.clearingCart) return; // No abrir si ya se está procesando
    // Abre el modal usando la plantilla referenciada por #confirmClearCartModal
    this.modalRef = this.modalService.open(this.modalContent, { ariaLabelledBy: 'modal-basic-title', centered: true });

    // Maneja el resultado cuando el modal se cierra
    this.modalRef.result.then(
      (result) => {
        // Si se cierra haciendo clic en el botón "Aceptar" (o el que llame a modal.close())
        if (result === 'confirm') {
          this.executeClearCart(); // Llama a la función que realmente vacía el carrito
        }
      },
      (reason) => {
        // Si se cierra haciendo clic fuera, con Esc, o con el botón "Cancelar" (o el que llame a modal.dismiss())
        this.clearingCart = false; // Asegurarse de resetear el estado si se cancela
      }
    );
  }

  /** Ejecuta la lógica para vaciar el carrito (llamado después de confirmar en el modal) */
  private executeClearCart(): void {
    this.clearingCart = true; // Marcar como procesando
    this.cartService.clearCart().subscribe({
      next: () => {
        // El servicio ya muestra la notificación de éxito
        // No es necesario resetear clearingCart aquí si el modal ya se cerró
      },
      error: (err) => {
        // El servicio ya muestra la notificación de error
        console.error('Error al vaciar el carrito:', err);
        this.clearingCart = false; // Resetear estado en caso de error
      },
      complete: () => {
        // Se podría resetear aquí también, pero 'result.then' ya lo maneja implícitamente al cerrar
        // this.clearingCart = false;
      }
    });
  }

  // --- MÉTODO clearCart MODIFICADO ---
  // Ahora solo llama a openClearCartConfirmation
  clearCart(): void {
    this.openClearCartConfirmation();
  }
  // --- FIN MÉTODO clearCart MODIFICADO ---

}