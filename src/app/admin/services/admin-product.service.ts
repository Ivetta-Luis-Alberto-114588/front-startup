// src/app/admin/services/admin-product.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { IProduct } from 'src/app/features/products/model/iproduct';
import { PaginationDto } from 'src/app/shared/dtos/pagination.dto';
import { AuthService } from 'src/app/auth/services/auth.service';

export interface PaginatedAdminProductsResponse {
  total: number;
  products: IProduct[];
}

export interface ProductFormData {
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  unit: string;
  taxRate: number;
  isActive?: boolean;
  tags?: string[];
  imgUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminProductService {

  private adminApiUrl = `${environment.apiUrl.trim()}/api/admin/products`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  getProducts(pagination: PaginationDto): Observable<PaginatedAdminProductsResponse> {
    const token = this.authService.getToken();
    console.log('[AdminProductService] getProducts - Token actual:', token ? 'Token Existe' : 'NO HAY TOKEN');
    let params = new HttpParams()
      .set('page', pagination.page.toString())
      .set('limit', pagination.limit.toString());
    return this.http.get<PaginatedAdminProductsResponse>(this.adminApiUrl, { params });
  }

  getProductById(id: string): Observable<IProduct> {
    return this.http.get<IProduct>(`${this.adminApiUrl}/${id}`);
  }

  createProduct(productData: ProductFormData, imageFile?: File): Observable<IProduct> {
    const formData = new FormData();
    // --- NO convertir números/booleanos a string explícitamente ---
    formData.append('name', productData.name);
    formData.append('description', productData.description);
    formData.append('price', productData.price as any); // Dejar que FormData lo maneje
    formData.append('stock', productData.stock as any); // Dejar que FormData lo maneje
    formData.append('category', productData.category);
    formData.append('unit', productData.unit);
    formData.append('taxRate', productData.taxRate as any); // Dejar que FormData lo maneje
    formData.append('isActive', productData.isActive !== undefined ? (productData.isActive ? 'true' : 'false') : 'true'); // Booleano a string 'true'/'false'

    if (productData.tags && productData.tags.length > 0) {
      formData.append('tags', productData.tags.join(','));
    } else {
      formData.append('tags', '');
    }
    if (imageFile) {
      formData.append('image', imageFile, imageFile.name);
    }
    return this.http.post<IProduct>(this.adminApiUrl, formData);
  }

  updateProduct(id: string, productData: Partial<ProductFormData>, imageFile?: File | null): Observable<IProduct> {
    const formData = new FormData();
    Object.keys(productData).forEach(key => {
      const value = (productData as any)[key];
      if (value !== undefined && value !== null) {
        if (key === 'tags' && Array.isArray(value)) {
          formData.append(key, value.join(','));
        } else if (key === 'isActive' && typeof value === 'boolean') {
          formData.append(key, value ? 'true' : 'false'); // Booleano a string 'true'/'false'
        } else if (typeof value === 'number' || typeof value === 'string') {
          // --- NO convertir números a string explícitamente ---
          formData.append(key, value as any); // Dejar que FormData lo maneje
        }
        // Ignorar otros tipos si los hubiera
      }
    });
    if (imageFile) {
      formData.append('image', imageFile, imageFile.name);
    }
    // --- CORRECCIÓN: Enviar imgUrl solo si es explícitamente '' para borrar ---
    if (productData.imgUrl === '') {
      formData.append('imgUrl', '');
    }
    // --- FIN CORRECCIÓN ---

    return this.http.put<IProduct>(`${this.adminApiUrl}/${id}`, formData);
  }

  deleteProduct(id: string): Observable<IProduct> {
    return this.http.delete<IProduct>(`${this.adminApiUrl}/${id}`);
  }
}