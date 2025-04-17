import { ICategory } from "./icategory";
import { IUnit } from "./iunit";

export interface IProduct {
    id: string;
    name: string;
    price: number;
    stock: number;
    category: ICategory; // el uuid de  'pizzas', 'empanadas', 'lomitos', 'bebidas'
    unit: IUnit; // el uuid de 'unidad', 'docena', 'litro'
    isActive: boolean;
    description: string;
    taxRate: number;
    priceWithTax: number; // Precio CON IVA
    imgUrl?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
