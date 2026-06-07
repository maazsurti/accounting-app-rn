import type { TransactionDao } from '@/core/db/daos/transaction-dao';
import type { Item } from '@/features/inventory/models/item';
import { Transaction } from '@/features/quick_record/models/transaction';

export class TransactionRepository {
  constructor(private readonly dao: TransactionDao) {}

  recordTransaction(item: Item, quantity: number): Transaction {
    const now = new Date();
    const id = this.dao.insertTransaction({
      itemId: item.id!,
      itemName: item.name,
      quantity,
      sellingPriceAtTime: item.sellingPrice,
      costPriceAtTime: item.costPerUnit,
      soldAt: now,
      batchId: null
    });
    return new Transaction({
      id,
      itemId: item.id!,
      itemName: item.name,
      itemUnit: item.unit,
      quantity,
      sellingPriceAtTime: item.sellingPrice,
      costPriceAtTime: item.costPerUnit,
      soldAt: now
    });
  }

  topQuantitiesFor(itemId: number): number[] {
    return this.dao.getTopQuantitiesForItem(itemId);
  }
}
