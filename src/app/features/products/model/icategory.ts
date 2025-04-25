// src/app/features/products/model/icategory.ts
export interface ICategory {
    id: string;
    name: string; // 
    description: string;
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}