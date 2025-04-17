// src/app/features/products/components/product-list/product-list.component.ts
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, switchMap, catchError, EMPTY, tap, finalize } from 'rxjs'; // Importar finalize

import { IProduct } from '../../model/iproduct';
import { ICategory } from '../../model/icategory';
import { ProductService, PaginatedProductsResponse } from '../../services/product/product.service'; // Importar interfaz
import { CategoryService } from '../../services/category/category.service';
import { PaginationDto } from 'src/app/shared/dtos/pagination.dto';
import { CartService } from '../../../cart/services/cart.service';
import { NotificationService } from 'src/app/shared/services/notification.service';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent implements OnInit, OnDestroy {

  public listProducts: IProduct[] = [];
  public category: ICategory = { id: '', name: 'Cargando...', description: '', isActive: false };
  idCategory: string | null = null;
  public isLoading = false;
  error: string | null = null;
  private routeSubscription: Subscription | null = null;
  productsBeingAdded: { [productId: string]: boolean } = {};

  // <<<--- ESTADO DE PAGINACIÓN --- >>>
  currentPage = 1;
  itemsPerPage = 8; // <--- Definido aquí como 8
  totalItems = 0;
  totalPages = 0;
  // <<<--- FIN ESTADO DE PAGINACIÓN --- >>>

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private cartService: CartService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.routeSubscription = this.activatedRoute.paramMap.pipe(
      tap(params => {
        const newCategoryId = params.get('idCategory');
        // Si la categoría cambia, reseteamos la paginación y cargamos
        if (newCategoryId && newCategoryId !== this.idCategory) {
          this.idCategory = newCategoryId;
          this.currentPage = 1; // Resetear a página 1 al cambiar categoría
          this.totalItems = 0;
          this.totalPages = 0;
          this.listProducts = []; // Limpiar lista anterior
          this.isLoading = true; // Mostrar carga
          this.error = null;
          this.getCategoryDetails(this.idCategory); // Obtener detalles de la nueva categoría
          this.loadProducts(); // Cargar productos para la nueva categoría y página 1
        } else if (!newCategoryId) {
          console.error('[ProductList] No se encontró idCategory en la ruta.');
          this.error = "Categoría no especificada en la URL.";
          this.isLoading = false;
        } else {
          // Opcional: Log si la categoría no cambió
          // console.log(`[ProductList] Misma categoría (${this.idCategory}), no se recarga por cambio de ruta.`);
        }
      })
    ).subscribe(); // Solo nos suscribimos para reaccionar a cambios de ruta
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
  }

  // <<<--- MÉTODO PARA CARGAR PRODUCTOS (CORREGIDO) --- >>>
  loadProducts(): void {
    if (!this.idCategory) {
      return;
    }

    this.isLoading = true;
    this.error = null;
    // Usa el valor de itemsPerPage definido en la clase (8)
    const pagination: PaginationDto = { page: this.currentPage, limit: this.itemsPerPage };

    this.productService.getProductsByCategory(this.idCategory, pagination).pipe(
      catchError(err => {
        console.error('[ProductList] Error fetching products by category:', err);
        this.error = 'Error al cargar los productos. Por favor, intente más tarde.';
        this.listProducts = []; // Limpiar en caso de error
        this.totalItems = 0;
        this.totalPages = 0;
        return EMPTY; // Terminar el observable en caso de error
      }),
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe({
      next: (data: PaginatedProductsResponse) => {
        this.listProducts = data.products; // Reemplaza la lista con los nuevos productos
        this.totalItems = data.total;
        // Calcula totalPages usando el itemsPerPage de la clase (8)
        this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);

        if (data.total === 0) {
          // Opcional: Mostrar mensaje si no hay productos
        }
      }
    });
  }
  // <<<--- FIN MÉTODO PARA CARGAR PRODUCTOS --- >>>

  // <<<--- MÉTODO PARA CAMBIAR DE PÁGINA --- >>>
  loadPage(page: number): void {
    if (page === this.currentPage || this.isLoading) {
      return; // No recargar si es la misma página o ya está cargando
    }
    this.currentPage = page;
    this.loadProducts(); // Llamar al método que carga los productos para la nueva página
  }
  // <<<--- FIN MÉTODO PARA CAMBIAR DE PÁGINA --- >>>

  getCategoryDetails(id: string): void {
    if (!id) return;
    this.categoryService.getCategoryById(id).subscribe({
      next: (data: ICategory) => {
        this.category = data;
      },
      error: (error) => {
        console.error('[ProductList] Error fetching category details:', error);
        this.category = { id: '', name: 'Categoría Desconocida', description: 'No se pudo cargar la información.', isActive: false };
        // Considerar si mostrar un error más prominente al usuario
        // this.error = 'No se pudo cargar la información de la categoría.';
      }
    });
  }

  viewProductDetail(productId: string): void {
    if (this.idCategory && productId) {
      this.router.navigate(['/products', this.idCategory, productId]);
    } else {
      console.error("[ProductList] No se puede navegar al detalle: falta idCategory o productId.", { category: this.idCategory, product: productId });
      this.error = "No se pudo abrir el detalle del producto.";
    }
  }

  addToCart(product: IProduct): void {
    if (!product || this.productsBeingAdded[product.id]) return;
    this.productsBeingAdded[product.id] = true;
    this.cartService.addItem(product.id, 1).pipe(
      finalize(() => {
        delete this.productsBeingAdded[product.id]; // Asegurar que se limpia el flag
      })
    ).subscribe({
      // next: ya no es necesario hacer nada aquí, el servicio notifica
      error: (err) => {
        console.error('[ProductList] Error al añadir al carrito desde ProductList:', err);
        // El servicio ya muestra la notificación de error
      }
    });
  }
}