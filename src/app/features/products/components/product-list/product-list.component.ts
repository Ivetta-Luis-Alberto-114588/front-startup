import { Component, OnDestroy, OnInit } from '@angular/core';
import { IProduct } from '../../model/iproduct';
import { ProductService } from '../../services/product/product.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, switchMap } from 'rxjs';
import { ICategory } from '../../model/icategory';
import { CategoryService } from '../../services/category/category.service';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent implements OnInit, OnDestroy {

  public listProducts: IProduct[] = []
  public category: ICategory = {} as ICategory;

  idCategory: string | null = null;
  productSelected: IProduct | null = null;
  public isLoading = false;
  error: string | null = null;
  private routeSubscription: Subscription | null = null;


  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) { }



  ngOnInit(): void {
    this.isLoading = true;
    // Escucha los cambios en los parámetros de la ruta (para obtener la categoría)

    this.routeSubscription = this.getParamsFromUrl();


    this.getCategory(this.idCategory!);
  }


  ngOnDestroy(): void {
    // Desuscribirse para evitar fugas de memoria
    this.routeSubscription?.unsubscribe();
  }

  getParamsFromUrl(): any {
    this.activatedRoute.paramMap.pipe(
      switchMap(params => {
        this.idCategory = params.get('idCategory');

        if (!this.idCategory) {
          // Decide qué hacer si no hay categoría (¿mostrar todo? ¿redirigir?)
          // Por ahora, lanzamos un error o devolvemos un observable vacío
          this.error = "Categoría no especificada.";
          this.isLoading = false;

          return []; // O throwError(() => new Error('Categoría no especificada'))
        }

        // Llama al servicio para obtener los productos de esa categoría
        return this.productService.getProductsByCategory(this.idCategory);
      })
    ).subscribe({
      next: (data) => {
        this.listProducts = data;
        this.isLoading = false;
        this.error = null;
      },
      error: (err) => {
        console.error('Error fetching products:', err);
        this.error = 'Error al cargar los productos. Intente más tarde.';
        this.isLoading = false;
      }
    });
  }

  getCategory(id: string) {
    if (!id) return;
    this.categoryService.getCategoryById(id).subscribe({
      next: (data: ICategory) => { // Usar ICategory
        this.category = data;
      },
      error: (error) => {
        console.log('Error fetching category', error);
        // Considera mostrar un error al usuario si la categoría no carga
      }
    });
  }

  viewProductDetail(productId: string): void {
    this.router.navigate(['/products', this.idCategory, productId]);
  }

  addToCart(product: IProduct): void {
    // Lógica para añadir al carrito (necesitarás un CartService)
    console.log('Añadir al carrito:', product);
    // Ejemplo: this.cartService.addItem(product, 1);
  }






}
