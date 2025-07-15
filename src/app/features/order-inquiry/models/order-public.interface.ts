// Interfaces para la consulta pública de órdenes
export interface PublicOrderItem {
    product: {
        id: string;
        name: string;
        price: number;
        stock: number;
        category: {
            id: string;
            name: string;
            description: string;
            isActive: boolean;
        };
        unit: {
            id: string;
            name: string;
            description: string;
            isActive: boolean;
        };
        imgUrl: string;
        isActive: boolean;
        description: string;
        taxRate: number;
        priceWithTax: number;
        tags: string[];
    };
    quantity: number;
    unitPrice: number;
    subtotal: number;
}

export interface PublicCustomer {
    id: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    isActive: boolean;
    userId: string | null;
}

export interface PublicPaymentMethod {
    id: string;
    description: string;
    isActive: boolean;
    requiresOnlinePayment: boolean;
    allowsManualConfirmation: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface PublicOrderStatus {
    id: string;
    code: string;
    name: string;
    description: string;
    color: string;
    order: number;
    isActive: boolean;
    isDefault: boolean;
    canTransitionTo: string[];
    createdAt: string;
    updatedAt: string;
}

export interface PublicOrderResponse {
    id: string;
    customer: PublicCustomer;
    items: PublicOrderItem[];
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    discountRate: number;
    discountAmount: number;
    total: number;
    date: string; // El backend devuelve 'date' no 'createdAt'
    status: PublicOrderStatus;
    paymentMethod: PublicPaymentMethod;
    notes?: string;
    // Campos opcionales que pueden no estar presentes
    deliveryMethod?: {
        id: string;
        name: string;
        code: string;
        requiresAddress: boolean;
    };
    shippingRecipientName?: string;
    shippingPhone?: string;
    shippingStreetAddress?: string;
    shippingPostalCode?: string;
    createdAt?: string;
    updatedAt?: string;
}
