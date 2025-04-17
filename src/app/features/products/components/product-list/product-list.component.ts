// src/app/features/products/components/product-list/product-list.component.ts
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, switchMap, catchError, EMPTY, tap } from 'rxjs';

import { IProduct } from '../../model/iproduct';
import { ICategory } from '../../model/icategory';
import { ProductService } from '../../services/product/product.service';
import { CategoryService } from '../../services/category/category.service';
import { PaginationDto } from 'src/app/shared/dtos/pagination.dto';
import { CartService } from '../../../cart/services/cart.service'; // <--- IMPORTAR CartService
import { NotificationService } from 'src/app/shared/services/notification.service'; // <--- IMPORTAR (Opcional, si quieres feedback extra)

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
  productsBeingAdded: { [productId: string]: boolean } = {}; // Para deshabilitar botones individuales

  currentPage = 1;
  itemsPerPage = 12;
  totalItems = 0;

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private cartService: CartService, // <--- INYECTAR CartService
    private notificationService: NotificationService // <--- INYECTAR (Opcional)
  ) { }

  ngOnInit(): void {
    // ... (tu lógica existente de ngOnInit para cargar productos) ...
    this.isLoading = true;
    this.routeSubscription = this.activatedRoute.paramMap.pipe(
      tap(params => {
        this.idCategory = params.get('idCategory');
        this.isLoading = true;
        this.error = null;
        this.listProducts = [];
        this.currentPage = 1;
        if (this.idCategory) {
          this.getCategoryDetails(this.idCategory);
        } else {
          this.error = "Categoría no especificada en la URL.";
          this.isLoading = false;
        }
      }),
      switchMap(params => {
        if (!this.idCategory) return EMPTY;
        const pagination: PaginationDto = { page: this.currentPage, limit: this.itemsPerPage };
        return this.productService.getProductsByCategory(this.idCategory, pagination).pipe(
          catchError(err => {
            console.error('Error fetching products by category:', err);
            this.error = 'Error al cargar los productos. Por favor, intente más tarde.';
            this.isLoading = false;
            return EMPTY;
          })
        );
      })
    ).subscribe({
      next: (data) => {
        this.listProducts = data;
        this.isLoading = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
  }

  getCategoryDetails(id: string): void {
    // ... (lógica existente) ...
    if (!id) return;
    this.categoryService.getCategoryById(id).subscribe({
      next: (data: ICategory) => {
        this.category = data;
      },
      error: (error) => {
        console.error('Error fetching category details:', error);
        this.category = { id: '', name: 'Categoría Desconocida', description: 'No se pudo cargar la información.', isActive: false };
      }
    });
  }

  viewProductDetail(productId: string): void {
    // ... (lógica existente) ...
    if (this.idCategory && productId) {
      this.router.navigate(['/products', this.idCategory, productId]);
    } else {
      console.error("No se puede navegar al detalle: falta idCategory o productId.", { category: this.idCategory, product: productId });
      this.error = "No se pudo abrir el detalle del producto.";
    }
  }

  // --- MÉTODO addToCart ACTUALIZADO ---
  addToCart(product: IProduct): void {
    if (!product || this.productsBeingAdded[product.id]) return; // Evitar doble click

    this.productsBeingAdded[product.id] = true; // Marcar como añadiendo
    console.log('Añadiendo al carrito desde lista:', product.name);

    this.cartService.addItem(product.id, 1) // Añadir 1 unidad por defecto desde la lista
      .subscribe({
        next: (updatedCart) => {
          // Éxito: El servicio ya muestra notificación
          console.log('Producto añadido/actualizado en el carrito:', updatedCart);
          delete this.productsBeingAdded[product.id]; // Desmarcar
        },
        error: (err) => {
          // Error: El servicio ya muestra notificación
          console.error('Error al añadir al carrito desde ProductList:', err);
          delete this.productsBeingAdded[product.id]; // Desmarcar en caso de error
          // Opcional: Mostrar error específico si quieres
          // this.notificationService.showError(`No se pudo añadir ${product.name}.`, 'Error');
        }
      });
  }
  // --- FIN MÉTODO addToCart ---
}