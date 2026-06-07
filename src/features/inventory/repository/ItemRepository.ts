import type {
  ItemDao,
  ItemRawRow,
  FrequentItemRawRow,
  ItemRow,
  NewItemRow
} from '@/core/db/daos/item-dao';
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

  addItem(item: Item): Item {
    const saved = item.copyWith({ updatedAt: item.updatedAt ?? item.createdAt });
    const id = this.dao.insertItem(itemToNewRow(saved));
    return saved.copyWith({ id });
  }

  updateItem(item: Item): void {
    if (item.id === null) throw new Error('Cannot update item without id');
    this.dao.updateItemRow(itemToRow(item));
  }

  deleteItem(id: number): void {
    this.dao.softDelete(id);
  }

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

function itemToNewRow(item: Item): NewItemRow {
  return {
    name: item.name,
    sellingPrice: item.sellingPrice,
    totalPurchasePrice: item.totalPurchasePrice,
    purchasedQty: item.purchasedQty,
    currentStock: item.currentStock,
    unit: item.unit,
    imagePath: item.imagePath,
    lowStockThreshold: item.lowStockThreshold,
    isStarred: item.isStarred ? 1 : 0,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    deletedAt: item.deletedAt
  };
}

function itemToRow(item: Item): ItemRow {
  if (item.id === null) throw new Error('Cannot map item without id');
  return {
    id: item.id,
    name: item.name,
    sellingPrice: item.sellingPrice,
    totalPurchasePrice: item.totalPurchasePrice,
    purchasedQty: item.purchasedQty,
    currentStock: item.currentStock,
    unit: item.unit,
    imagePath: item.imagePath,
    lowStockThreshold: item.lowStockThreshold,
    isStarred: item.isStarred ? 1 : 0,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    deletedAt: item.deletedAt
  };
}
