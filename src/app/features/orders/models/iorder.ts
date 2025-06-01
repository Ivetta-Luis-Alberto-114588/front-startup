// src/app/features/orders/models/iorder.ts
import { ICustomer } from "../../customers/models/icustomer"; // Asegúrate que ICustomer esté bien definida
import { IOrderItem } from "./iorderItem";
import { IShippingDetails } from "./ishippingdetails";
import { IOrderStatus } from "src/app/shared/models/iorder-status"; // <--- IMPORTAR

export interface IOrder {
    id: string;                   // El ID de la orden en sí
    customer: ICustomer;          // Objeto ICustomer poblado
    items: IOrderItem[];
    subtotal: number;
    taxAmount: number;
    discountRate: number;
    discountAmount: number;
    total: number;
    date: string | Date;
    status: IOrderStatus;         // <--- CAMBIADO: Debe ser el objeto IOrderStatus completo
    notes?: string;
    shippingDetails?: IShippingDetails;
    createdAt?: string | Date;
    updatedAt?: string | Date;
}