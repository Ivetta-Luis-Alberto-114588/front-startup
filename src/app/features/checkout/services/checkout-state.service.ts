import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import { IAddress } from '../../customers/models/iaddress'; // Asume que existe
import { IDeliveryMethod } from 'src/app/shared/models/idelivery-method';

export type ShippingAddressOption = { type: 'existing'; address: IAddress } | { type: 'new'; addressData: any }; // Define un tipo para la opción

@Injectable({ providedIn: 'root' })
export class CheckoutStateService {
  // Estados existentes
  private shippingAddressSubject = new BehaviorSubject<ShippingAddressOption | null>(null);
  shippingAddress$ = this.shippingAddressSubject.asObservable();

  // Nuevos estados para método de entrega
  private selectedDeliveryMethodSubject = new BehaviorSubject<IDeliveryMethod | null>(null);
  selectedDeliveryMethod$ = this.selectedDeliveryMethodSubject.asObservable();

  private availableDeliveryMethodsSubject = new BehaviorSubject<IDeliveryMethod[]>([]);
  availableDeliveryMethods$ = this.availableDeliveryMethodsSubject.asObservable();

  // Nuevo estado para método de pago
  private selectedPaymentMethodIdSubject = new BehaviorSubject<string | null>(null);
  selectedPaymentMethodId$ = this.selectedPaymentMethodIdSubject.asObservable();

  // Observable derivado: determina si se debe mostrar la sección de dirección
  shouldShowAddressSection$: Observable<boolean> = this.selectedDeliveryMethod$.pipe(
    map(method => method?.requiresAddress || false)
  );

  // Observable derivado: valida si el checkout está completo
  isCheckoutValid$: Observable<boolean> = combineLatest([
    this.selectedDeliveryMethod$,
    this.selectedPaymentMethodId$,
    this.shippingAddress$,
    this.shouldShowAddressSection$
  ]).pipe(
    map(([deliveryMethod, paymentMethodId, shippingAddress, shouldShowAddress]) => {
      // Debe tener método de entrega seleccionado
      if (!deliveryMethod) return false;

      // Debe tener método de pago seleccionado
      if (!paymentMethodId) return false;

      // Si requiere dirección, debe tener una dirección seleccionada
      if (shouldShowAddress && !shippingAddress) return false;

      return true;
    })
  );

  // Métodos existentes para dirección de envío
  setSelectedShippingAddress(option: ShippingAddressOption | null) {
    this.shippingAddressSubject.next(option);
  }

  getSelectedShippingAddress(): ShippingAddressOption | null {
    return this.shippingAddressSubject.value;
  }

  // Nuevos métodos para método de entrega
  setSelectedDeliveryMethod(method: IDeliveryMethod | null) {
    this.selectedDeliveryMethodSubject.next(method);

    // Si el nuevo método no requiere dirección, limpiar la dirección seleccionada
    if (method && !method.requiresAddress) {
      this.setSelectedShippingAddress(null);
    }
  }

  getSelectedDeliveryMethod(): IDeliveryMethod | null {
    return this.selectedDeliveryMethodSubject.value;
  }

  setAvailableDeliveryMethods(methods: IDeliveryMethod[]) {
    this.availableDeliveryMethodsSubject.next(methods);
  }

  getAvailableDeliveryMethods(): IDeliveryMethod[] {
    return this.availableDeliveryMethodsSubject.value;
  }

  // Método utilitario para validar si requiere dirección
  doesSelectedMethodRequireAddress(): boolean {
    const selectedMethod = this.getSelectedDeliveryMethod();
    return selectedMethod?.requiresAddress || false;
  }

  // Método para resetear todo el estado del checkout
  resetCheckoutState() {
    this.setSelectedDeliveryMethod(null);
    this.setSelectedPaymentMethodId(null);
    this.setSelectedShippingAddress(null);
    this.setAvailableDeliveryMethods([]);
  }

  // Método para obtener el payload del checkout
  getCheckoutPayload(): { deliveryMethod: string | null; shippingInfo: ShippingAddressOption | null } {
    const method = this.getSelectedDeliveryMethod();
    const shipping = this.getSelectedShippingAddress();

    return {
      deliveryMethod: method?.id || null,
      shippingInfo: method?.requiresAddress ? shipping : null
    };
  }

  // Nuevos métodos para método de pago
  setSelectedPaymentMethodId(paymentMethodId: string | null) {
    this.selectedPaymentMethodIdSubject.next(paymentMethodId);
  }

  getSelectedPaymentMethodId(): string | null {
    return this.selectedPaymentMethodIdSubject.value;
  }
}