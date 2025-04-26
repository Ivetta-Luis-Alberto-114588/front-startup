import { IOrder } from "./iorder";

export interface PaginatedOrdersResponse {
    total: number;
    orders: IOrder[];
}