import { HttpClient, HttpParams } from '@angular/common/http'; // Importar HttpParams
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IProduct } from '../../model/iproduct';
import { environment } from 'src/environments/environment';
import { PaginationDto } from 'src/app/shared/dtos/pagination.dto'; // Asumiendo que tienes un DTO similar o creas uno

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  // URL base para productos (sin ID o categoría)
  private productsApiUrl = `${environment.apiUrl}/api/products`; // Apunta a /api/products

  constructor(private http: HttpClient) { }

  // --- MÉTODO ACTUALIZADO ---
  // Obtiene productos por categoría con paginación
  getProductsByCategory(categoryId: string, pagination: PaginationDto): Observable<IProduct[]> {
    const { page, limit } = pagination;
    // El endpoint del backend es /api/products/by-category/:categoryId
    const url = `${this.productsApiUrl}/by-category/${categoryId}`;
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<IProduct[]>(url, { params });
  }

  // --- MÉTODO ACTUALIZADO ---
  // Obtiene un producto por su ID
  getProductsById(id: string): Observable<IProduct> {
    // El endpoint del backend es /api/products/:id
    const url = `${this.productsApiUrl}/${id}`;
    return this.http.get<IProduct>(url);
  }

  // --- MÉTODO ACTUALIZADO ---
  // Obtiene todos los productos con paginación
  getAllProducts(pagination: PaginationDto): Observable<IProduct[]> {
    const { page, limit } = pagination;
    // El endpoint del backend es /api/products
    const url = this.productsApiUrl;
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<IProduct[]>(url, { params });
  }

  // --- NUEVO MÉTODO (para búsqueda futura, Prioridad 13) ---
  searchProducts(searchParams: any): Observable<{ total: number; products: IProduct[] }> {
    // El endpoint del backend es /api/products/search
    const url = `${this.productsApiUrl}/search`;
    let params = new HttpParams();
    // Construir HttpParams a partir de searchParams (ej: q, categories, minPrice, etc.)
    for (const key in searchParams) {
      if (searchParams.hasOwnProperty(key) && searchParams[key] !== undefined && searchParams[key] !== null) {
        params = params.set(key, searchParams[key].toString());
      }
    }
    // El backend devuelve un objeto { total: number, products: IProduct[] }
    return this.http.get<{ total: number; products: IProduct[] }>(url, { params });
  }
}

// --- DTO de Paginación eliminado porque ya está importado ---