// src/app/shared/models/iorder-status.ts
export interface IOrderStatus {
    id: string;
    code: string;
    name: string;
    description: string;
    color: string;
    order: number;
    isActive: boolean;
    isDefault: boolean;
    canTransitionTo: string[];
}

export interface IOrderStatusesResponse {
    total: number;
    orderStatuses: IOrderStatus[];
}
