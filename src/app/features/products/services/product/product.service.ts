import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IProduct } from '../../model/iproduct';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  // private apiUrlCategory = 'http://localhost:3000/api/products/by-category/67bb26204bb12979fc09e267?page=1&limit=10';
  private apiUrlCategory = 'https://sistema-mongo.onrender.com/api/products/by-category';

  // private apiUrlCategory = 'http://localhost:3000/api/products/67bb66e150cbedc32c59ad6b';
  private apiUrlById = 'https://sistema-mongo.onrender.com/api/products';


  // private apiUrlGetAll = 'https://sistema-mongo.onrender.com/api/products?page=1&limit=10';
  private apiUrlGetAll = 'https://sistema-mongo.onrender.com/api/products?page=1&limit=10';



  constructor(private http: HttpClient) { }

  getProductsByCategory(category: String): Observable<IProduct[]> {
    return this.http.get<IProduct[]>(`${this.apiUrlCategory}/${category}?page=1&limit=10`);
  }

  getProductsById(id: String): Observable<IProduct> {
    return this.http.get<IProduct>(`${this.apiUrlById}/${id}`);
  }


  getAllProducts(): Observable<IProduct[]> {
    return this.http.get<IProduct[]>(this.apiUrlGetAll);
  }
}
