import type { ItemDao, ItemRawRow, FrequentItemRawRow } from '@/core/db/daos/item-dao';
import { Item, type ItemUnit } from '@/features/inventory/models/item';

function rowToItem(row: ItemRawRow): Item {
  return new Item({
    id: row.id,
    name: row.name,
    sellingPrice: row.selling_price,
    totalPurchasePrice: row.total_purchase_price,
    purchasedQty: row.purchased_qty,
    currentStock: row.current_stock,
    unit: row.unit as ItemUnit,
    imagePath: row.image_path,
    lowStockThreshold: row.low_stock_threshold,
    isStarred: row.is_starred === 1,
    createdAt: new Date(row.created_at),
    updatedAt: row.updated_at ? new Date(row.updated_at) : null,
    deletedAt: row.deleted_at ? new Date(row.deleted_at) : null
  });
}

function frequentRowToItem(row: FrequentItemRawRow): Item {
  // sale_count is only for SQL ordering — cast to base row shape for model conversion.
  return rowToItem(row as unknown as ItemRawRow);
}

export class ItemRepository {
  constructor(private readonly dao: ItemDao) {}

  getAllItems(): Item[] {
    return this.dao.getAllActiveRaw().map(rowToItem);
  }

  getLowStockItems(): Item[] {
    return this.dao.getLowStockRaw().map(rowToItem);
  }

  getFrequentItems(limit = 8, withinDays = 30): Item[] {
    const since = new Date(Date.now() - withinDays * 86_400_000).toISOString();
    return this.dao.getFrequentRaw(limit, since).map(frequentRowToItem);
  }

  decrementStock(itemId: number, qty: number): void {
    this.dao.decrementStock(itemId, qty);
  }

  adjustStock(itemId: number, delta: number): void {
    this.dao.adjustStock(itemId, delta);
  }

  toggleStar(itemId: number, starred: boolean): void {
    this.dao.toggleStar(itemId, starred);
  }
}
