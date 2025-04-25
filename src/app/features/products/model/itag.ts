// src/app/features/products/model/itag.ts (o similar)
export interface ITag {
    id: string;
    name: string;
    description?: string; // Opcional
    isActive: boolean;
    createdAt?: Date; // Opcional
    updatedAt?: Date; // Opcional
}