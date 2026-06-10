import { computed, makeAutoObservable, observable, runInAction } from 'mobx';

import type { RecentCustomer } from '@/core/db/daos/sale-batch-dao';
import type { ViewState } from '@/core/state/view-state';
import type { Item } from '@/features/inventory/models/item';
import type { ItemRepository } from '@/features/inventory/repository/ItemRepository';
import type { TransactionRepository } from '@/features/quick_record/repository/TransactionRepository';
import type { SaleBatchRepository } from '@/features/quick_record/repository/SaleBatchRepository';

interface CartEntry {
  readonly item: Item;
  readonly qty: number;
}

export class BatchSaleController {
  cartItems: Map<number, CartEntry> = new Map();
  customerName = '';
  customerPhone = '';
  searchQuery = '';
  allItemsState: ViewState<Item[]> = { kind: 'initial' };
  recentCustomers: RecentCustomer[] = [];
  confirmState: ViewState<undefined> = { kind: 'initial' };

  constructor(
    private readonly itemRepo: ItemRepository,
    private readonly txRepo: TransactionRepository,
    private readonly batchRepo: SaleBatchRepository,
    private readonly onBatchRecorded?: () => void
  ) {
    makeAutoObservable(this, {
      cartItems: observable,
      customerName: observable,
      customerPhone: observable,
      searchQuery: observable,
      allItemsState: observable,
      recentCustomers: observable,
      confirmState: observable,
      cartTotal: computed,
      cartCount: computed,
      allItems: computed,
      sortedItems: computed,
      filteredItems: computed
    });
  }

  get cartTotal(): number {
    let total = 0;
    for (const { item, qty } of this.cartItems.values()) {
      total += item.sellingPrice * qty;
    }
    return total;
  }

  get cartCount(): number {
    return this.cartItems.size;
  }

  get allItems(): Item[] {
    const s = this.allItemsState;
    return s.kind === 'loaded' ? s.data : [];
  }

  // In-cart items float to top; within each group, original load order preserved.
  get sortedItems(): Item[] {
    const items = this.allItems;
    return [
      ...items.filter((i) => this.cartItems.has(i.id!)),
      ...items.filter((i) => !this.cartItems.has(i.id!))
    ];
  }

  get filteredItems(): Item[] {
    const query = this.searchQuery.trim().toLowerCase();
    const items = this.sortedItems;
    if (query === '') return items;
    return items.filter((i) => i.name.toLowerCase().includes(query));
  }

  isInCart(itemId: number): boolean {
    return this.cartItems.has(itemId);
  }

  qtyFor(itemId: number): number {
    return this.cartItems.get(itemId)?.qty ?? 1;
  }

  addItem(item: Item): void {
    if (this.cartItems.has(item.id!)) return;
    this.cartItems.set(item.id!, { item, qty: 1 });
  }

  removeItem(itemId: number): void {
    this.cartItems.delete(itemId);
  }

  setQty(itemId: number, qty: number): void {
    const entry = this.cartItems.get(itemId);
    if (!entry) return;
    this.cartItems.set(itemId, { ...entry, qty });
  }

  loadAllItems(): void {
    if (this.allItemsState.kind === 'initial') {
      this.allItemsState = { kind: 'loading' };
    }
    try {
      const data = this.itemRepo.getAllItems();
      runInAction(() => {
        this.allItemsState = { kind: 'loaded', data };
      });
    } catch (error) {
      runInAction(() => {
        this.allItemsState = { kind: 'failed', error };
      });
    }
  }

  loadRecentCustomers(): void {
    try {
      const customers = this.batchRepo.getRecentCustomers();
      runInAction(() => {
        this.recentCustomers = customers;
      });
    } catch {
      // Non-critical — autocomplete simply won't appear.
    }
  }

  confirm(): void {
    if (this.cartItems.size === 0) return;
    this.confirmState = { kind: 'loading' };
    try {
      const name = this.customerName.trim();
      const phone = this.customerPhone.trim();
      const batchId = this.batchRepo.insertBatch({
        name: name === '' ? null : name,
        phone: phone === '' ? null : phone
      });
      for (const { item, qty } of this.cartItems.values()) {
        this.txRepo.recordTransactionWithBatchId(item, qty, batchId);
        this.itemRepo.decrementStock(item.id!, qty);
      }
      // Clear fields but keep confirmState — screen reacts to 'loaded' then calls reset().
      this.cartItems.clear();
      this.customerName = '';
      this.customerPhone = '';
      this.searchQuery = '';
      runInAction(() => {
        this.confirmState = { kind: 'loaded', data: undefined };
      });
      this.onBatchRecorded?.();
    } catch (error) {
      runInAction(() => {
        this.confirmState = { kind: 'failed', error };
      });
    }
  }

  reset(): void {
    this.cartItems.clear();
    this.customerName = '';
    this.customerPhone = '';
    this.searchQuery = '';
    this.confirmState = { kind: 'initial' };
  }
}
