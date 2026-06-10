import { action, computed, makeAutoObservable, observable, runInAction } from 'mobx';

import type { ViewState } from '@/core/state/view-state';
import type { Item } from '@/features/inventory/models/item';
import type { ItemRepository } from '@/features/inventory/repository/ItemRepository';

export type RestockFieldError = 'enterQtyAboveZero' | 'enterValidAmount';

export class InventoryController {
  state: ViewState<Item[]> = { kind: 'initial' };
  changeStamp = 0;
  searchQuery = '';
  restockItemId: number | null = null;
  restockQuantityText = '';
  restockTotalCostText = '';
  restockQuantityError: RestockFieldError | null = null;
  restockCostError: RestockFieldError | null = null;

  constructor(private readonly repo: ItemRepository) {
    makeAutoObservable(this, {
      state: observable,
      changeStamp: observable,
      searchQuery: observable,
      restockItemId: observable,
      restockQuantityText: observable,
      restockTotalCostText: observable,
      restockQuantityError: observable,
      restockCostError: observable,
      items: computed,
      lowStockItems: computed,
      displayedLowStockItems: computed,
      visibleItems: computed,
      totalStockValue: computed,
      selectedRestockItem: computed,
      restockNewLotCost: computed,
      load: action,
      setSearchQuery: action,
      clearSearchQuery: action,
      openRestockSheet: action,
      closeRestockSheet: action,
      setRestockQuantityText: action,
      setRestockTotalCostText: action,
      submitRestock: action,
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

  get displayedLowStockItems(): Item[] {
    return this.searchQuery.trim() === '' ? this.lowStockItems : [];
  }

  get visibleItems(): Item[] {
    const normalized = this.searchQuery.trim().toLowerCase();
    if (normalized === '') return this.items;
    return this.items.filter((item) => item.name.toLowerCase().includes(normalized));
  }

  get totalStockValue(): number {
    return this.items.reduce((sum, item) => sum + item.sellingPrice * item.currentStock, 0);
  }

  get selectedRestockItem(): Item | null {
    if (this.restockItemId === null) return null;
    return this.items.find((item) => item.id === this.restockItemId) ?? null;
  }

  get restockNewLotCost(): number {
    const quantity = Number(this.restockQuantityText);
    const totalCost = Number(this.restockTotalCostText);
    return Number.isFinite(quantity) && quantity > 0 && Number.isFinite(totalCost)
      ? totalCost / quantity
      : 0;
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

  setSearchQuery(value: string): void {
    this.searchQuery = value;
  }

  clearSearchQuery(): void {
    this.searchQuery = '';
  }

  openRestockSheet(item: Item): void {
    this.restockItemId = item.id;
    this.restockQuantityText = '';
    this.restockTotalCostText = '';
    this.restockQuantityError = null;
    this.restockCostError = null;
  }

  closeRestockSheet(): void {
    this.restockItemId = null;
    this.restockQuantityText = '';
    this.restockTotalCostText = '';
    this.restockQuantityError = null;
    this.restockCostError = null;
  }

  setRestockQuantityText(value: string): void {
    this.restockQuantityText = value;
    this.restockQuantityError = null;
  }

  setRestockTotalCostText(value: string): void {
    this.restockTotalCostText = value;
    this.restockCostError = null;
  }

  submitRestock(): boolean {
    const item = this.selectedRestockItem;
    if (item === null) return false;

    const quantity = Number(this.restockQuantityText);
    const totalCost = Number(this.restockTotalCostText);
    this.restockQuantityError =
      !Number.isFinite(quantity) || quantity <= 0 ? 'enterQtyAboveZero' : null;
    this.restockCostError =
      !Number.isFinite(totalCost) || totalCost < 0 ? 'enterValidAmount' : null;
    if (this.restockQuantityError !== null || this.restockCostError !== null) return false;

    this.restockItem({ item, quantity, totalCost });
    this.closeRestockSheet();
    return true;
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
