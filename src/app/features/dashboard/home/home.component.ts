// src/app/features/dashboard/home/home.component.ts
import { Component, OnInit } from '@angular/core';
import { CategoryService } from '../../products/services/category/category.service';
import { ProductService, PaginatedProductsResponse } from '../../products/services/product/product.service';
import { ICategory } from '../../products/model/icategory';
import { IProduct } from '../../products/model/iproduct';
import { Observable, of, Subscription } from 'rxjs';
import { catchError, map, finalize, tap } from 'rxjs/operators';
import { CartService } from '../../cart/services/cart.service';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { AuthService } from 'src/app/auth/services/auth.service'; // <<<--- IMPORTAR AuthService
import { Router } from '@angular/router'; // <<<--- IMPORTAR Router

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  // ... (propiedades existentes) ...
  public listCategories: ICategory[] = [];
  public popularProducts$: Observable<IProduct[]> = of([]);
  public comboProducts$: Observable<IProduct[]> = of([]);
  public isLoadingPopular = true;
  public isLoadingCombos = true;
  public errorPopular: string | null = null;
  public errorCombos: string | null = null;
  public productsBeingAdded: { [productId: string]: boolean } = {};
  private popularSubscription: Subscription | null = null;
  private comboSubscription: Subscription | null = null;

  constructor(
    private categoryService: CategoryService,
    private productService: ProductService,
    private cartService: CartService,
    private notificationService: NotificationService,
    private authService: AuthService, // <<<--- INYECTAR AuthService
    private router: Router // <<<--- INYECTAR Router
  ) { }

  // ... (ngOnInit, ngOnDestroy, getAllCategories, loadPopularProducts, loadComboProducts sin cambios) ...
  ngOnInit(): void {
    this.getAllCategories();
    this.loadPopularProducts();
    this.loadComboProducts();
  }

  // Opcional: Añadir ngOnDestroy para limpiar suscripciones
  // ngOnDestroy(): void {
  //   this.popularSubscription?.unsubscribe();
  //   this.comboSubscription?.unsubscribe();
  // }

  getAllCategories() {
    this.categoryService.getAllCategories().subscribe({
      next: (data) => { this.listCategories = data; },
      error: (error) => { console.error("Error cargando categorías:", error); }
    });
  }

  loadPopularProducts() {
    this.isLoadingPopular = true;
    this.errorPopular = null;
    this.popularSubscription?.unsubscribe();
    this.popularSubscription = this.productService.searchProducts({ tags: 'popular', limit: 4 })
      .subscribe({
        next: (response) => {
          console.log('RESPUESTA POPULAR RECIBIDA:', response.products.length);
          this.popularProducts$ = of(response.products);
          this.isLoadingPopular = false;
        },
        error: (err) => {
          console.error("ERROR POPULAR RECIBIDO:", err);
          this.errorPopular = "No se pudieron cargar los productos populares.";
          this.isLoadingPopular = false;
          this.popularProducts$ = of([]);
        },
        complete: () => {
          console.log('Observable Popular completado');
          if (this.isLoadingPopular) {
            this.isLoadingPopular = false;
            console.warn("isLoadingPopular forzado a false en complete()");
          }
        }
      });
  }

  loadComboProducts() {
    this.isLoadingCombos = true;
    this.errorCombos = null;
    this.comboSubscription?.unsubscribe();
    this.comboSubscription = this.productService.searchProducts({ tags: 'combo', limit: 3 })
      .subscribe({
        next: (response) => {
          console.log('RESPUESTA COMBOS RECIBIDA:', response.products.length);
          this.comboProducts$ = of(response.products);
          this.isLoadingCombos = false;
        },
        error: (err) => {
          console.error("ERROR COMBOS RECIBIDO:", err);
          this.errorCombos = "No se pudieron cargar los combos.";
          this.isLoadingCombos = false;
          this.comboProducts$ = of([]);
        },
        complete: () => {
          console.log('Observable Combos completado');
          if (this.isLoadingCombos) {
            this.isLoadingCombos = false;
            console.warn("isLoadingCombos forzado a false en complete()");
          }
        }
      });
  }


  addToCart(product: IProduct): void {
    // 1. VERIFICAR AUTENTICACIÓN
    if (!this.authService.isAuthenticated()) {
      this.notificationService.showInfo('Inicia sesión para añadir al carrito.', 'Inicio Requerido');
      // GUARDAR ACCIÓN PENDIENTE
      const pendingAction = { productId: product.id, quantity: 1 };
      localStorage.setItem('pendingCartAction', JSON.stringify(pendingAction));
      // REDIRIGIR
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    // 2. SI ESTÁ AUTENTICADO
    if (!product || this.productsBeingAdded[product.id] || product.stock <= 0) return;

    this.productsBeingAdded[product.id] = true;
    this.cartService.addItem(product.id, 1).pipe(
      finalize(() => { delete this.productsBeingAdded[product.id]; })
    ).subscribe({
      error: (err) => {
        console.error(`[HomeComponent] Error al añadir ${product.name} al carrito:`, err);
      }
    });
  }
}