import type { TransactionModificationDao } from '@/core/db/daos/transaction-modification-dao';
import type { Transaction } from '@/features/quick_record/models/transaction';

export class TransactionModificationRepository {
  constructor(private readonly dao: TransactionModificationDao) {}

  logEdit(params: { old: Transaction; newQuantity: number; newSellingPrice: number }): void {
    this.dao.insertModification({
      transactionId: requireId(params.old),
      action: 'edit',
      itemName: params.old.itemName,
      oldQuantity: params.old.quantity,
      newQuantity: params.newQuantity,
      oldSellingPrice: params.old.sellingPriceAtTime,
      newSellingPrice: params.newSellingPrice,
      modifiedAt: new Date()
    });
  }

  logDelete(tx: Transaction): void {
    this.dao.insertModification({
      transactionId: requireId(tx),
      action: 'delete',
      itemName: tx.itemName,
      oldQuantity: tx.quantity,
      oldSellingPrice: tx.sellingPriceAtTime,
      modifiedAt: new Date()
    });
  }
}

function requireId(tx: Transaction): number {
  if (tx.id === null) throw new Error('Cannot log modification for transaction without id');
  return tx.id;
}
