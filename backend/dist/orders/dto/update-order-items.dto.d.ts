declare class UpdateOrderItemInput {
    productId: string;
    quantity: number;
    price?: number;
}
export declare class UpdateOrderItemsDto {
    items: UpdateOrderItemInput[];
}
export {};
