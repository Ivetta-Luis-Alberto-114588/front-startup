// src/app/features/dashboard/home/home.component.ts
import { Component, OnInit } from '@angular/core';
import { CategoryService } from '../../products/services/category/category.service';
import { ProductService, PaginatedProductsResponse } from '../../products/services/product/product.service'; // Importar ProductService y PaginatedProductsResponse
import { ICategory } from '../../products/model/icategory';
import { IProduct } from '../../products/model/iproduct';
import { Observable, of } from 'rxjs'; // Importar Observable y of
import { catchError, map, finalize } from 'rxjs/operators'; // Asegúrate de importar map y finalize
import { CartService } from '../../cart/services/cart.service'; // Importa CartService
import { NotificationService } from 'src/app/shared/services/notification.service'; // Importa NotificationService

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  public listCategories: ICategory[] = [];
  // Observables para productos destacados (inicializados con array vacío)
  public popularProducts$: Observable<IProduct[]> = of([]);
  public comboProducts$: Observable<IProduct[]> = of([]);

  // Flags de carga y error para cada sección
  public isLoadingPopular = true;
  public isLoadingCombos = true;
  public errorPopular: string | null = null;
  public errorCombos: string | null = null;

  // Para manejar el estado de "añadiendo" por producto
  public productsBeingAdded: { [productId: string]: boolean } = {};

  constructor(
    private categoryService: CategoryService,
    private productService: ProductService, // Inyectar ProductService
    private cartService: CartService, // Inyectar CartService
    private notificationService: NotificationService // Inyectar NotificationService
  ) { }

  ngOnInit(): void {
    this.getAllCategories();
    this.loadPopularProducts(); // Cargar productos populares
    this.loadComboProducts();   // Cargar combos
  }

  getAllCategories() {
    this.categoryService.getAllCategories().subscribe({
      next: (data) => { this.listCategories = data; },
      error: (error) => { console.error("Error cargando categorías:", error); }
    });
  }

  loadPopularProducts() {
    this.isLoadingPopular = true;
    this.errorPopular = null;
    // Llamar al servicio para buscar productos con tag 'popular', limitando a 4
    this.popularProducts$ = this.productService.searchProducts({ tags: 'popular', limit: 4 })
      .pipe(
        map((response: PaginatedProductsResponse) => response.products), // Extraer solo el array de productos
        catchError(err => {
          console.error("Error cargando productos populares:", err);
          this.errorPopular = "No se pudieron cargar los productos populares.";
          return of([]); // Devolver un array vacío en caso de error
        }),
        finalize(() => this.isLoadingPopular = false) // Asegurar que el loading se quite
      );
  }

  loadComboProducts() {
    this.isLoadingCombos = true;
    this.errorCombos = null;
    // Llamar al servicio para buscar productos con tag 'combo', limitando a 3
    this.comboProducts$ = this.productService.searchProducts({ tags: 'combo', limit: 3 })
      .pipe(
        map((response: PaginatedProductsResponse) => response.products), // Extraer solo el array de productos
        catchError(err => {
          console.error("Error cargando combos:", err);
          this.errorCombos = "No se pudieron cargar los combos.";
          return of([]); // Devolver array vacío
        }),
        finalize(() => this.isLoadingCombos = false) // Asegurar que el loading se quite
      );
  }

  // Método para añadir al carrito (similar al de ProductListComponent)
  addToCart(product: IProduct): void {
    if (!product || this.productsBeingAdded[product.id]) return;

    this.productsBeingAdded[product.id] = true; // Marcar como añadiendo

    this.cartService.addItem(product.id, 1).pipe( // Añadir 1 unidad por defecto desde la home
      finalize(() => {
        // Este bloque se ejecuta siempre, al completar o al dar error
        delete this.productsBeingAdded[product.id]; // Quitar marca de añadiendo
      })
    ).subscribe({
      // next: (updatedCart) => { // No necesitas hacer nada en next si CartService ya notifica
      // El servicio ya muestra la notificación de éxito
      // },
      error: (err) => { // El servicio ya muestra la notificación de error
        console.error(`[HomeComponent] Error al añadir ${product.name} al carrito:`, err);
        // Podrías querer mostrar un error específico aquí si el servicio no lo hace
        // this.notificationService.showError(`No se pudo añadir ${product.name} al carrito.`);
      }
    });
  }
}