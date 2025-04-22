// src/app/features/products/components/product-list/product-list.component.ts
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, EMPTY } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';

import { IProduct } from '../../model/iproduct';
import { ICategory } from '../../model/icategory';
import { ProductService, PaginatedProductsResponse } from '../../services/product/product.service';
import { CategoryService } from '../../services/category/category.service';
import { PaginationDto } from 'src/app/shared/dtos/pagination.dto';
import { CartService } from '../../../cart/services/cart.service';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { AuthService } from 'src/app/auth/services/auth.service'; // <<<--- IMPORTAR AuthService

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent implements OnInit, OnDestroy {

  // ... (propiedades existentes: listProducts, category, idCategory, etc.) ...
  public listProducts: IProduct[] = [];
  public category: ICategory = { id: '', name: 'Cargando...', description: '', isActive: false };
  idCategory: string | null = null;
  public isLoading = false;
  error: string | null = null;
  private routeSubscription: Subscription | null = null;
  productsBeingAdded: { [productId: string]: boolean } = {};
  currentPage = 1;
  itemsPerPage = 8;
  totalItems = 0;
  totalPages = 0;


  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private cartService: CartService,
    private notificationService: NotificationService,
    private authService: AuthService // <<<--- INYECTAR AuthService
  ) { }

  // ... (ngOnInit, ngOnDestroy, loadProducts, loadPage, getCategoryDetails, viewProductDetail sin cambios)...
  ngOnInit(): void {
    this.routeSubscription = this.activatedRoute.paramMap.pipe(
      tap(params => {
        const newCategoryId = params.get('idCategory');
        if (newCategoryId && newCategoryId !== this.idCategory) {
          this.idCategory = newCategoryId;
          this.currentPage = 1;
          this.totalItems = 0;
          this.totalPages = 0;
          this.listProducts = [];
          this.isLoading = true;
          this.error = null;
          this.getCategoryDetails(this.idCategory);
          this.loadProducts();
        } else if (!newCategoryId) {
          console.error('[ProductList] No se encontró idCategory en la ruta.');
          this.error = "Categoría no especificada en la URL.";
          this.isLoading = false;
        }
      })
    ).subscribe();
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
  }

  loadProducts(): void {
    if (!this.idCategory) return;
    this.isLoading = true;
    this.error = null;
    const pagination: PaginationDto = { page: this.currentPage, limit: this.itemsPerPage };

    this.productService.getProductsByCategory(this.idCategory, pagination).pipe(
      catchError(err => {
        console.error('[ProductList] Error fetching products by category:', err);
        this.error = 'Error al cargar los productos. Por favor, intente más tarde.';
        this.listProducts = [];
        this.totalItems = 0;
        this.totalPages = 0;
        return EMPTY;
      }),
      finalize(() => { this.isLoading = false; })
    ).subscribe({
      next: (data: PaginatedProductsResponse) => {
        this.listProducts = data.products;
        this.totalItems = data.total;
        this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
      }
    });
  }

  loadPage(page: number): void {
    if (page === this.currentPage || this.isLoading) return;
    this.currentPage = page;
    this.loadProducts();
  }

  getCategoryDetails(id: string): void {
    if (!id) return;
    this.categoryService.getCategoryById(id).subscribe({
      next: (data: ICategory) => { this.category = data; },
      error: (error) => {
        console.error('[ProductList] Error fetching category details:', error);
        this.category = { id: '', name: 'Categoría Desconocida', description: 'No se pudo cargar la información.', isActive: false };
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
    // 1. VERIFICAR AUTENTICACIÓN
    if (!this.authService.isAuthenticated()) {
      this.notificationService.showInfo('Inicia sesión para añadir al carrito.', 'Inicio Requerido');
      // GUARDAR ACCIÓN PENDIENTE
      const pendingAction = { productId: product.id, quantity: 1 }; // Asumimos cantidad 1
      localStorage.setItem('pendingCartAction', JSON.stringify(pendingAction));
      // REDIRIGIR
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    // 2. SI ESTÁ AUTENTICADO
    if (!product || this.productsBeingAdded[product.id] || product.stock <= 0) return;

    this.productsBeingAdded[product.id] = true;
    this.cartService.addItem(product.id, 1).pipe( // Añadir 1 unidad
      finalize(() => { delete this.productsBeingAdded[product.id]; })
    ).subscribe({
      error: (err) => {
        console.error(`[ProductList] Error al añadir ${product.name} al carrito:`, err);
      }
    });
  }
}