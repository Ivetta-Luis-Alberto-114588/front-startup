// src/app/features/products/model/iproduct.ts
import { ICategory } from "./icategory";
import { IUnit } from "./iunit";

export interface IProduct {
    id: string;
    name: string;
    price: number;
    stock: number;
    category: ICategory; // <-- ¿Es ICategory o any? Debe ser ICategory
    unit: IUnit;     // <-- ¿Es IUnit o any? Debe ser IUnit
    isActive: boolean; // <-- ¿Es boolean?
    description: string;
    taxRate: number;
    priceWithTax: number; // <-- ¿Es number?
    tags?: string[];
    imgUrl?: string;
    createdAt?: Date;
    updatedAt?: Date;
}