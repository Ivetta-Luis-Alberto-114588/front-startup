// src/app/shared/models/iorder-status.ts
export interface IOrderStatus {
    _id: string;
    name: string;
    description?: string;
    color: string;
    priority: number;
    isFinal: boolean;
    allowedTransitions?: string[];
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IOrderStatusesResponse {
    total: number;
    orderStatuses: IOrderStatus[];
}
