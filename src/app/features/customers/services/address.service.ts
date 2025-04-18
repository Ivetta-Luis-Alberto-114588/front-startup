import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { IAddress } from '../models/iaddress'; // <-- Define esta interfaz

@Injectable({ providedIn: 'root' })
export class AddressService {
  private apiUrl = `${environment.apiUrl}/api/addresses`;

  constructor(private http: HttpClient) { }

  getAddresses(): Observable<IAddress[]> {
    return this.http.get<IAddress[]>(this.apiUrl);
  }

  createAddress(addressData: any): Observable<IAddress> { // Define un tipo/interfaz para addressData
    return this.http.post<IAddress>(this.apiUrl, addressData);
  }

  // Añade setDefaultAddress si lo necesitas aquí
}