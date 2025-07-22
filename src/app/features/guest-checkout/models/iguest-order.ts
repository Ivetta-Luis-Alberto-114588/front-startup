import { IGuestCustomer } from './iguest-customer';

// Interface para item de pedido de invitado
export interface IGuestOrderItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

// Interface principal para request de orden de invitado
export interface IGuestOrderRequest {
  // Datos del cliente (requeridos)
  customerName: string;
  customerEmail: string;

  // Items del pedido (requeridos)
  items: IGuestOrderItem[];

  // Método de entrega (requerido)
  deliveryMethodId: string;

  // Campos opcionales
  notes?: string;
  couponCode?: string;

  // Solo para entrega a domicilio (cuando deliveryMethod.requiresAddress = true)
  shippingRecipientName?: string;
  shippingPhone?: string;
  shippingStreetAddress?: string;
  shippingNeighborhoodId?: string;
  shippingCityId?: string;
  shippingPostalCode?: string;
  shippingAdditionalInfo?: string;
}

// Interface para respuesta del backend
export interface IGuestOrderResponse {
  id: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    isActive: boolean;
    userId: null;
  };
  items: Array<{
    product: {
      id: string;
      name: string;
      price: number;
    };
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
  deliveryMethod: {
    id: string;
    name: string;
    code: string;
    requiresAddress: boolean;
  };
  status: {
    id: string;
    name: string;
    code: string;
  };
  total: number;
  subtotal: number;
  taxAmount: number;
  discountRate: number;
  discountAmount: number;
  createdAt: string;
  updatedAt: string;
}

// Interface para datos de carrito temporal de invitado
export interface IGuestCartItem {
  productId: string;
  productName: string;
  productPrice: number;
  quantity: number;
  subtotal: number;
}

export interface IGuestCart {
  items: IGuestCartItem[];
  total: number;
  totalItems: number;
  lastUpdated: string;
}
