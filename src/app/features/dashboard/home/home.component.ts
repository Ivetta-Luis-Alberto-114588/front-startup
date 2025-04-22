// src/app/features/dashboard/home/home.component.ts
import { Component, OnInit } from '@angular/core';
import { CategoryService } from '../../products/services/category/category.service';
import { ProductService, PaginatedProductsResponse } from '../../products/services/product/product.service';
import { ICategory } from '../../products/model/icategory';
import { IProduct } from '../../products/model/iproduct';
import { Observable, of } from 'rxjs';
import { catchError, map, finalize, tap } from 'rxjs/operators'; // Importar tap
import { CartService } from '../../cart/services/cart.service';
import { NotificationService } from 'src/app/shared/services/notification.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  public listCategories: ICategory[] = [];
  public popularProducts$: Observable<IProduct[]> = of([]);
  public comboProducts$: Observable<IProduct[]> = of([]);

  public isLoadingPopular = true;
  public isLoadingCombos = true;
  public errorPopular: string | null = null;
  public errorCombos: string | null = null;
  public productsBeingAdded: { [productId: string]: boolean } = {};

  constructor(
    private categoryService: CategoryService,
    private productService: ProductService,
    private cartService: CartService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.getAllCategories();
    this.loadPopularProducts();
    this.loadComboProducts();
    console.log('HomeComponent initialized');
  }

  getAllCategories() {
    this.categoryService.getAllCategories().subscribe({
      next: (data) => { this.listCategories = data; },
      error: (error) => { console.error("Error cargando categorías:", error); }
    });
  }

  loadPopularProducts() {
    this.isLoadingPopular = true; // Inicia carga
    this.errorPopular = null;
    this.popularProducts$ = this.productService.searchProducts({ tags: 'popular', limit: 4 })
      .pipe(
        tap(() => console.log('Popular products request started...')), // Log inicio
        map((response: PaginatedProductsResponse) => {
          console.log('Popular products received:', response.products.length); // Log éxito
          this.isLoadingPopular = false; // <-- Detener carga en éxito
          return response.products;
        }),
        catchError(err => {
          console.error("Error cargando productos populares:", err); // Log error
          this.errorPopular = "No se pudieron cargar los productos populares.";
          this.isLoadingPopular = false; // <-- Detener carga en error
          return of([]); // Devolver array vacío para que el async pipe no falle
        })
        // finalize(() => { // Finalize es bueno, pero asegurémonos en map/catchError primero
        //   console.log('Finalizing popular products stream');
        //   this.isLoadingPopular = false;
        // })
      );
  }

  loadComboProducts() {
    this.isLoadingCombos = true; // Inicia carga
    this.errorCombos = null;
    this.comboProducts$ = this.productService.searchProducts({ tags: 'combo', limit: 3 })
      .pipe(
        tap(() => console.log('Combo products request started...')), // Log inicio
        map((response: PaginatedProductsResponse) => {
          console.log('Combo products received:', response.products.length); // Log éxito
          this.isLoadingCombos = false; // <-- Detener carga en éxito
          return response.products;
        }),
        catchError(err => {
          console.error("Error cargando combos:", err); // Log error
          this.errorCombos = "No se pudieron cargar los combos.";
          this.isLoadingCombos = false; // <-- Detener carga en error
          return of([]); // Devolver array vacío
        })
        // finalize(() => {
        //   console.log('Finalizing combo products stream');
        //   this.isLoadingCombos = false;
        // })
      );
  }

  // Método addToCart (sin cambios respecto a la versión anterior)
  addToCart(product: IProduct): void {
    if (!product || this.productsBeingAdded[product.id]) return;
    this.productsBeingAdded[product.id] = true;

    this.cartService.addItem(product.id, 1).pipe(
      finalize(() => {
        delete this.productsBeingAdded[product.id];
      })
    ).subscribe({
      // next: () => {}, // El servicio notifica
      error: (err) => {
        console.error(`[HomeComponent] Error al añadir ${product.name} al carrito:`, err);
      }
    });
  }
}