import { action, computed, makeAutoObservable, observable, runInAction } from 'mobx';

import type { ViewState } from '@/core/state/view-state';
import type { Item } from '@/features/inventory/models/item';
import type { Transaction } from '@/features/quick_record/models/transaction';
import type { ItemRepository } from '@/features/inventory/repository/ItemRepository';
import type { TransactionRepository } from '@/features/quick_record/repository/TransactionRepository';

export class QuickRecordController {
  frequentState: ViewState<Item[]> = { kind: 'initial' };
  allItemsState: ViewState<Item[]> = { kind: 'initial' };
  lastRecorded: Transaction | null = null;

  constructor(
    private readonly itemRepo: ItemRepository,
    private readonly txRepo: TransactionRepository,
    private readonly onSaleRecorded?: (tx: Transaction) => void
  ) {
    makeAutoObservable(this, {
      frequentState: observable,
      allItemsState: observable,
      lastRecorded: observable,
      frequentItems: computed,
      allItems: computed,
      loadFrequentItems: action,
      loadAllItems: action,
      recordSale: action
    });
  }

  get frequentItems(): Item[] {
    const s = this.frequentState;
    return s.kind === 'loaded' ? s.data : [];
  }

  get allItems(): Item[] {
    const s = this.allItemsState;
    return s.kind === 'loaded' ? s.data : [];
  }

  loadFrequentItems(): void {
    if (this.frequentState.kind === 'initial') {
      this.frequentState = { kind: 'loading' };
    }
    try {
      const data = this.itemRepo.getFrequentItems();
      runInAction(() => {
        this.frequentState = { kind: 'loaded', data };
      });
    } catch (error) {
      runInAction(() => {
        this.frequentState = { kind: 'failed', error };
      });
    }
  }

  loadAllItems(): void {
    this.allItemsState = { kind: 'loading' };
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

  topQuantitiesFor(itemId: number): number[] {
    return this.txRepo.topQuantitiesFor(itemId);
  }

  recordSale(item: Item, quantity: number): Transaction {
    const tx = this.txRepo.recordTransaction(item, quantity);
    this.itemRepo.decrementStock(item.id!, quantity);
    runInAction(() => {
      this.lastRecorded = tx;
      this._updateStockInPlace(item.id!, quantity);
    });
    this.onSaleRecorded?.(tx);
    return tx;
  }

  // Update currentStock without reloading — preserves grid order for the session.
  private _updateStockInPlace(itemId: number, soldQty: number): void {
    const s = this.frequentState;
    if (s.kind !== 'loaded') return;
    this.frequentState = {
      kind: 'loaded',
      data: s.data.map((item) => {
        if (item.id !== itemId) return item;
        return item.copyWith({ currentStock: Math.max(0, item.currentStock - soldQty) });
      })
    };
  }
}
