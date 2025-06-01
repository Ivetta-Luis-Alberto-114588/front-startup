// src/app/shared/models/iorder-status.ts
export interface IOrderStatus {
    _id: string;         // ID de MongoDB
    name: string;        // Nombre legible (e.g., "Pendiente")
    code: string;        // Código único (e.g., "PENDING") - Asegúrate que el backend lo envíe
    description?: string;
    color: string;       // Color hexadecimal (e.g., "#FFC107")
    priority: number;    // Para ordenar (antes era 'order', ahora 'priority')
    isActive: boolean;   // Si el estado está activo y se puede usar
    isDefault: boolean;  // Si es el estado por defecto para nuevas órdenes
    isFinal: boolean;    // Si es un estado final (calculado o desde backend)
    allowedTransitions: string[]; // Array de _id's de otros IOrderStatus
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IOrderStatusesResponse {
    total: number;
    orderStatuses: IOrderStatus[]; // El backend devuelve un array de IOrderStatus
}