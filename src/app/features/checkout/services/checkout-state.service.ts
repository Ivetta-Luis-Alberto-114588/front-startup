import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { IAddress } from '../../customers/models/iaddress'; // Asume que existe

export type ShippingAddressOption = { type: 'existing'; address: IAddress } | { type: 'new'; addressData: any }; // Define un tipo para la opción

@Injectable({ providedIn: 'root' })
export class CheckoutStateService {
  private shippingAddressSubject = new BehaviorSubject<ShippingAddressOption | null>(null);
  shippingAddress$ = this.shippingAddressSubject.asObservable();

  setSelectedShippingAddress(option: ShippingAddressOption | null) {
    this.shippingAddressSubject.next(option);
  }

  getSelectedShippingAddress(): ShippingAddressOption | null {
    return this.shippingAddressSubject.value;
  }

  // Puedes añadir estado para método de pago, etc.
}