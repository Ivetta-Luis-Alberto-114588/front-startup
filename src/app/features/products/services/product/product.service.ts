// src/app/features/products/services/product/product.service.ts
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IProduct } from '../../model/iproduct';
import { environment } from 'src/environments/environment';
import { PaginationDto } from 'src/app/shared/dtos/pagination.dto';

// <<<--- INTERFAZ MODIFICADA PARA SEARCH --- >>>
export interface SearchParams {
  page?: number;
  limit?: number;
  q?: string;                 // Término de búsqueda
  categories?: string | string[]; // IDs de categoría (CSV o array)
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'price' | 'createdAt' | 'name' | 'relevance';
  sortOrder?: 'asc' | 'desc';
  tags?: string | string[];   // <<<--- AÑADIDO: Tags (CSV o array)
}

// Interfaz para la respuesta paginada (sin cambios)
export interface PaginatedProductsResponse {
  total: number;
  products: IProduct[];
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private productsApiUrl = `${environment.apiUrl}/api/products`;

  constructor(private http: HttpClient) { }

  // <<<--- MÉTODO ACTUALIZADO PARA SEARCH --- >>>
  searchProducts(searchParams: SearchParams): Observable<PaginatedProductsResponse> {
    const url = `${this.productsApiUrl}/search`;
    let params = new HttpParams();

    // Construir HttpParams dinámicamente
    for (const key in searchParams) {
      if (searchParams.hasOwnProperty(key)) {
        const value = (searchParams as any)[key];
        // Solo añadir si el valor no es null, undefined o string vacío
        if (value !== undefined && value !== null && value !== '') {
          // Convertir arrays (como categories o tags) a string CSV
          if (Array.isArray(value)) {
            // Solo añadir si el array no está vacío
            if (value.length > 0) {
              params = params.set(key, value.join(','));
            }
          } else {
            params = params.set(key, value.toString());
          }
        }
      }
    }


    // La respuesta del backend ya coincide con PaginatedProductsResponse
    return this.http.get<PaginatedProductsResponse>(url, { params });
  }
  // <<<--- FIN MÉTODO ACTUALIZADO --- >>>

  // --- Métodos existentes (sin cambios necesarios) ---
  getProductsByCategory(categoryId: string, pagination: PaginationDto): Observable<PaginatedProductsResponse> {
    const { page, limit } = pagination;
    const url = `${this.productsApiUrl}/by-category/${categoryId}`;
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    return this.http.get<PaginatedProductsResponse>(url, { params });
  }

  getProductsById(id: string): Observable<IProduct> {
    const url = `${this.productsApiUrl}/${id}`;
    return this.http.get<IProduct>(url);
  }

  getAllProducts(pagination: PaginationDto): Observable<IProduct[]> {
    // NOTA: Este método podría devolver PaginatedProductsResponse si quieres paginar
    const { page, limit } = pagination;
    const url = this.productsApiUrl;
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    return this.http.get<IProduct[]>(url, { params });
  }
  // --- Fin Métodos existentes ---
}