export declare class CreateTransactionDto {
    description: string;
    type: 'income' | 'expense';
    amount: number;
    category: string;
    date?: string;
}
