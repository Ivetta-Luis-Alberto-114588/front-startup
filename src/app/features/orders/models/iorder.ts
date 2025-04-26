import { IProduct } from "../../products/model/iproduct";
import { IOrderItem } from "./iorderItem";
import { IShippingDetails } from "./ishippingdetails";

export interface IOrder {
    id: string;
    customer: any; // Deberías tener una interfaz ICustomer o IUser aquí
    items: IOrderItem[]; // Deberías tener una interfaz IOrderItem aquí
    subtotal: number;
    // taxRate: number; // Probablemente no necesario en el frontend
    taxAmount: number;
    discountRate: number;
    discountAmount: number;
    total: number;
    date: string | Date; // O solo Date si lo conviertes en el servicio
    status: 'pending' | 'completed' | 'cancelled' | 'shipped';
    notes?: string;
    shippingDetails?: IShippingDetails; // Deberías tener una interfaz IShippingDetails aquí
    createdAt?: string | Date;
    updatedAt?: string | Date;
}
