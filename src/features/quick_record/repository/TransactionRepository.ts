import type {
  TransactionDao,
  TransactionWithBatchInfoRawRow,
  TransactionWithItemUnitRawRow
} from '@/core/db/daos/transaction-dao';
import type { Item, ItemUnit } from '@/features/inventory/models/item';
import { Transaction } from '@/features/quick_record/models/transaction';
import {
  transactionListEntriesFromRows,
  type TransactionListEntry
} from '@/features/transactions/models/transaction-list-entry';

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

  recordTransactionWithBatchId(item: Item, quantity: number, batchId: number | null): Transaction {
    const now = new Date();
    const id = this.dao.insertTransaction({
      itemId: item.id!,
      itemName: item.name,
      quantity,
      sellingPriceAtTime: item.sellingPrice,
      costPriceAtTime: item.costPerUnit,
      soldAt: now,
      batchId
    });
    return new Transaction({
      id,
      itemId: item.id!,
      itemName: item.name,
      itemUnit: item.unit,
      quantity,
      sellingPriceAtTime: item.sellingPrice,
      costPriceAtTime: item.costPerUnit,
      soldAt: now,
      batchId
    });
  }

  deleteTransaction(id: number): void {
    this.dao.deleteTransactionById(id);
  }

  deleteTransactions(ids: Iterable<number>): void {
    this.dao.deleteTransactionsByIds([...ids]);
  }

  updateTransaction(params: { id: number; quantity: number; sellingPriceAtTime: number }): void {
    this.dao.updateTransaction(params);
  }

  getAllTransactions(): Transaction[] {
    return this.dao.getAllWithItemUnit().map(rowToTransaction);
  }

  getRecentTransactions(limit: number): Transaction[] {
    return this.dao.getRecentWithItemUnit(limit).map(rowToTransaction);
  }

  getTransactionsBetween(start: Date, end: Date): Transaction[] {
    return this.dao.getBetweenWithItemUnit(start, end).map(rowToTransaction);
  }

  getAllTransactionEntries(): TransactionListEntry[] {
    return transactionListEntriesFromRows(
      this.dao.getAllWithBatchInfo().map((row) => ({
        tx: rowToTransaction(row),
        customerName: row.customer_name,
        customerPhone: row.customer_phone
      }))
    );
  }

  topQuantitiesFor(itemId: number): number[] {
    return this.dao.getTopQuantitiesForItem(itemId);
  }
}

function rowToTransaction(
  row: TransactionWithItemUnitRawRow | TransactionWithBatchInfoRawRow
): Transaction {
  return new Transaction({
    id: row.id,
    itemId: row.item_id,
    itemName: row.item_name,
    itemUnit: row.item_unit as ItemUnit,
    quantity: row.quantity,
    sellingPriceAtTime: row.selling_price_at_time,
    costPriceAtTime: row.cost_price_at_time,
    soldAt: new Date(row.sold_at),
    batchId: row.batch_id
  });
}
