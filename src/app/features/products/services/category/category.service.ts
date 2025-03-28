import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ICategory } from '../../model/icategory';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  // private apiUrlCategory = 'https://sistema-mongo.onrender.com/api/products/by-category/67bb26204bb12979fc09e267?page=1&limit=10';
  private apiUrlCategory = 'https://sistema-mongo.onrender.com/api/categories';


  constructor(private http: HttpClient) { }

  getAllCategories(): Observable<ICategory[]> {
    return this.http.get<ICategory[]>(`${this.apiUrlCategory}`);
  }

  getCategoryById(id: String): Observable<ICategory> {
    return this.http.get<ICategory>(`${this.apiUrlCategory}/${id}`);
  }

  createCategory(category: ICategory): Observable<ICategory> {
    return this.http.post<ICategory>(this.apiUrlCategory, category);
  }

  updateCategory(id: String, category: ICategory): Observable<ICategory> {
    return this.http.put<ICategory>(`${this.apiUrlCategory}/${id}`, category);
  }

  deleteCategory(id: String): Observable<void> {
    return this.http.delete<void>(`${this.apiUrlCategory}/${id}`);
  }


}
