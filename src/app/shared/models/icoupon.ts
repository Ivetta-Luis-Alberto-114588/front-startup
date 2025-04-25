// src/app/shared/models/icoupon.ts (o similar)

// Reutiliza el enum del backend si es posible, o defínelo aquí
export enum DiscountType {
    PERCENTAGE = 'percentage',
    FIXED = 'fixed'
}

export interface ICoupon {
    id: string;
    code: string;
    discountType: DiscountType;
    discountValue: number;
    description?: string;
    isActive: boolean;
    validFrom?: string | Date | null; // Puede venir como string ISO
    validUntil?: string | Date | null; // Puede venir como string ISO
    minPurchaseAmount?: number | null;
    usageLimit?: number | null;
    timesUsed: number;
    createdAt?: string | Date; // Puede venir como string ISO
    updatedAt?: string | Date; // Puede venir como string ISO
}