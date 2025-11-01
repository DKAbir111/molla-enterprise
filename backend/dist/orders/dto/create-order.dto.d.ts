declare class OrderItemInput {
    productId: string;
    quantity: number;
}
export declare class CreateOrderDto {
    customerId: string;
    deliveryAddress?: string;
    items: OrderItemInput[];
    discount?: number;
    paidAmount?: number;
    transportPerTrip?: number;
    transportTrips?: number;
}
export {};
