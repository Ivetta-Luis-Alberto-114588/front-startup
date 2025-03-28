import { Component, OnInit } from '@angular/core';
import { ProductService } from '../../services/product/product.service';
import { ActivatedRoute } from '@angular/router';
import { IProduct } from '../../model/iproduct';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss']
})
export class ProductDetailComponent implements OnInit {

  product: IProduct | null = null;
  isLoading = false;
  error: string | null = null;
  // --- NUEVA VARIABLE para la cantidad ---
  quantity: number = 1; // Inicializamos la cantidad en 1

  constructor(
    private productService: ProductService,
    private activatedRoute: ActivatedRoute,
  ) { }

  ngOnInit(): void {
    this.isLoading = true;

    // Get the product ID from the route parameters
    const productId = this.activatedRoute.snapshot.paramMap.get('idProduct');

    if (productId) {
      this.productService.getProductsById(productId).subscribe({
        next: (data) => {
          this.product = data;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error fetching product details:', err);
          this.error = 'No se pudo cargar el detalle del producto. Intente más tarde.';
          this.isLoading = false;
        }
      });
    } else {
      this.error = 'ID de producto no especificado';
      this.isLoading = false;
    }
  }


  // --- NUEVOS MÉTODOS para controlar la cantidad ---
  increaseQuantity(): void {
    // Solo incrementa si hay un producto cargado y la cantidad es menor que el stock
    if (this.product && this.quantity < this.product.stock) {
      this.quantity++;
    }
    // Si no hay límite de stock (product.stock es null o undefined), simplemente incrementa
    // (Aunque pusiste [disabled] en el HTML, es bueno tener la lógica aquí también)
    else if (this.product && this.product.stock === null) {
      this.quantity++;
    }
    console.log("Cantidad incrementada a:", this.quantity);
  }

  decreaseQuantity(): void {
    // Solo decrementa si la cantidad es mayor que 1
    if (this.quantity > 1) {
      this.quantity--;
      console.log("Cantidad decrementada a:", this.quantity);
    }
  }

  // --- MÉTODO PLACEHOLDER para añadir al carrito (lo implementaremos después) ---
  addToCart(): void {
    if (!this.product) return; // No hacer nada si el producto no está cargado

    console.log(`Intentando agregar ${this.quantity} unidad(es) de ${this.product.name} (ID: ${this.product.id}) al carrito.`);
    // Aquí irá la lógica para llamar al servicio del carrito
    alert(`Simulación: Agregando ${this.quantity} x ${this.product.name} al carrito.`); // Mensaje temporal
  }


}
