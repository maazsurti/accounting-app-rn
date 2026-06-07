import { action, computed, makeAutoObservable, observable, runInAction } from 'mobx';

import type { ViewState } from '@/core/state/view-state';
import type { Item } from '@/features/inventory/models/item';
import type { ItemRepository } from '@/features/inventory/repository/ItemRepository';

export class InventoryController {
  state: ViewState<Item[]> = { kind: 'initial' };
  changeStamp = 0;

  constructor(private readonly repo: ItemRepository) {
    makeAutoObservable(this, {
      state: observable,
      changeStamp: observable,
      items: computed,
      lowStockItems: computed,
      load: action,
      addItem: action,
      updateItem: action,
      restockItem: action,
      deleteItem: action,
      toggleStar: action
    });
  }

  get items(): Item[] {
    const s = this.state;
    return s.kind === 'loaded' ? s.data : [];
  }

  get lowStockItems(): Item[] {
    return this.items.filter((item) => item.isLowStock);
  }

  load(): void {
    if (this.state.kind !== 'loaded') {
      this.state = { kind: 'loading' };
    }
    try {
      const data = this.repo.getAllItems();
      runInAction(() => {
        this.state = { kind: 'loaded', data };
      });
    } catch (error) {
      runInAction(() => {
        this.state = { kind: 'failed', error };
      });
    }
  }

  addItem(item: Item): Item {
    const saved = this.repo.addItem(item);
    runInAction(() => {
      this.state = { kind: 'loaded', data: [...this.currentList, saved] };
      this.markChanged();
    });
    return saved;
  }

  updateItem(item: Item): void {
    const updated = item.copyWith({ updatedAt: new Date() });
    this.repo.updateItem(updated);
    runInAction(() => {
      this.state = {
        kind: 'loaded',
        data: this.currentList.map((current) => (current.id === updated.id ? updated : current))
      };
      this.markChanged();
    });
  }

  restockItem(params: { item: Item; quantity: number; totalCost: number }): void {
    const updated = params.item.copyWith({
      purchasedQty: params.item.purchasedQty + params.quantity,
      currentStock: params.item.currentStock + params.quantity,
      totalPurchasePrice: params.item.totalPurchasePrice + params.totalCost
    });
    this.updateItem(updated);
  }

  deleteItem(id: number): void {
    this.repo.deleteItem(id);
    runInAction(() => {
      this.state = { kind: 'loaded', data: this.currentList.filter((item) => item.id !== id) };
      this.markChanged();
    });
  }

  toggleStar(item: Item): void {
    if (item.id === null) throw new Error('Cannot toggle star for item without id');
    const updated = item.copyWith({ isStarred: !item.isStarred, updatedAt: new Date() });
    this.repo.toggleStar(item.id, updated.isStarred);
    runInAction(() => {
      this.state = {
        kind: 'loaded',
        data: this.currentList.map((current) => (current.id === item.id ? updated : current))
      };
      this.markChanged();
    });
  }

  private markChanged(): void {
    this.changeStamp += 1;
  }

  private get currentList(): Item[] {
    const s = this.state;
    return s.kind === 'loaded' ? s.data : [];
  }
}
