export const TRANSACTION_MODIFICATION_ACTIONS = ['edit', 'delete'] as const;

export type TransactionModificationAction = (typeof TRANSACTION_MODIFICATION_ACTIONS)[number];

export interface TransactionModification {
  readonly id: number | null;
  readonly transactionId: number;
  readonly action: TransactionModificationAction;
  readonly itemName: string;
  readonly oldQuantity: number;
  readonly newQuantity: number | null;
  readonly oldSellingPrice: number;
  readonly newSellingPrice: number | null;
  readonly modifiedAt: Date;
}
