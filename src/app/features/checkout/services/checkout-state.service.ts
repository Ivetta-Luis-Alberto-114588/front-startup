import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import { IAddress } from '../../customers/models/iaddress'; // Asume que existe
import { IDeliveryMethod } from 'src/app/shared/models/idelivery-method';
import { IGuestCustomer } from 'src/app/features/guest-checkout/models';

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

  // Estados para guest checkout
  private isGuestCheckoutSubject = new BehaviorSubject<boolean>(false);
  isGuestCheckout$ = this.isGuestCheckoutSubject.asObservable();

  private guestCustomerInfoSubject = new BehaviorSubject<IGuestCustomer | null>(null);
  guestCustomerInfo$ = this.guestCustomerInfoSubject.asObservable();

  // Observable derivado: determina si se debe mostrar la sección de dirección
  shouldShowAddressSection$: Observable<boolean> = this.selectedDeliveryMethod$.pipe(
    map(method => method?.requiresAddress || false)
  );

  // Observable derivado: valida si el checkout está completo (actualizado para guests)
  isCheckoutValid$: Observable<boolean> = combineLatest([
    this.selectedDeliveryMethod$,
    this.selectedPaymentMethodId$,
    this.shippingAddress$,
    this.shouldShowAddressSection$,
    this.isGuestCheckout$,
    this.guestCustomerInfo$
  ]).pipe(
    map(([deliveryMethod, paymentMethodId, shippingAddress, shouldShowAddress, isGuest, guestInfo]) => {
      // Debe tener método de entrega seleccionado
      if (!deliveryMethod) return false;

      // Debe tener método de pago seleccionado
      if (!paymentMethodId) return false;

      // Si es guest, debe tener información de cliente
      if (isGuest && (!guestInfo || !guestInfo.customerName || !guestInfo.customerEmail)) {
        return false;
      }

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
    this.setIsGuestCheckout(false);
    this.setGuestCustomerInfo(null);
  }

  // Método para obtener el payload del checkout
  getCheckoutPayload(): {
    deliveryMethod: string | null;
    shippingInfo: ShippingAddressOption | null;
    guestInfo: IGuestCustomer | null;
    isGuest: boolean;
  } {
    const method = this.getSelectedDeliveryMethod();
    const shipping = this.getSelectedShippingAddress();
    const guestInfo = this.getGuestCustomerInfo();
    const isGuest = this.getIsGuestCheckout();

    return {
      deliveryMethod: method?.id || null,
      shippingInfo: method?.requiresAddress ? shipping : null,
      guestInfo: isGuest ? guestInfo : null,
      isGuest
    };
  }

  // Nuevos métodos para método de pago
  setSelectedPaymentMethodId(paymentMethodId: string | null) {
    this.selectedPaymentMethodIdSubject.next(paymentMethodId);
  }

  getSelectedPaymentMethodId(): string | null {
    return this.selectedPaymentMethodIdSubject.value;
  }

  // Nuevos métodos para guest checkout
  setIsGuestCheckout(isGuest: boolean) {
    this.isGuestCheckoutSubject.next(isGuest);
    // Si cambia a no-guest, limpiar info de guest
    if (!isGuest) {
      this.setGuestCustomerInfo(null);
    }
  }

  getIsGuestCheckout(): boolean {
    return this.isGuestCheckoutSubject.value;
  }

  setGuestCustomerInfo(info: IGuestCustomer | null) {
    this.guestCustomerInfoSubject.next(info);
  }

  getGuestCustomerInfo(): IGuestCustomer | null {
    return this.guestCustomerInfoSubject.value;
  }
}