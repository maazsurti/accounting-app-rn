import { action, computed, makeAutoObservable, observable, runInAction } from 'mobx';

import type { ViewState } from '@/core/state/view-state';
import type { ItemRepository } from '@/features/inventory/repository/ItemRepository';
import { Transaction } from '@/features/quick_record/models/transaction';
import type { TransactionRepository } from '@/features/quick_record/repository/TransactionRepository';
import { StatsEngine } from '@/features/transactions/engine/StatsEngine';
import { emptyStatsResult, type StatsResult } from '@/features/transactions/engine/stats-result';
import type {
  BatchEntry,
  TransactionListEntry
} from '@/features/transactions/models/transaction-list-entry';
import type { TransactionModificationRepository } from '@/features/transactions/repository/TransactionModificationRepository';

export class TransactionController {
  state: ViewState<TransactionListEntry[]> = { kind: 'initial' };
  todayStats: StatsResult = emptyStatsResult;
  calendarExpanded = false;
  exportLoading = false;
  filterDate = new Date();
  selectedTransactionIds = new Set<number>();
  expandedBatchIds = new Set<number>();
  displayMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  constructor(
    private readonly repo: TransactionRepository,
    private readonly itemRepo: ItemRepository,
    private readonly modRepo: TransactionModificationRepository,
    private readonly engine: StatsEngine = new StatsEngine(),
    private readonly onTransactionModified?: () => void
  ) {
    makeAutoObservable(this, {
      state: observable,
      todayStats: observable,
      calendarExpanded: observable,
      exportLoading: observable,
      filterDate: observable,
      selectedTransactionIds: observable,
      expandedBatchIds: observable,
      displayMonth: observable,
      entries: computed,
      transactions: computed,
      selectionActive: computed,
      selectedCount: computed,
      load: action,
      onTransactionAdded: action,
      editTransaction: action,
      deleteTransaction: action,
      deleteTransactions: action,
      toggleBatchExpanded: action,
      toggleSelection: action,
      toggleBatchSelection: action,
      clearSelection: action
    });
  }

  get entries(): TransactionListEntry[] {
    const s = this.state;
    return s.kind === 'loaded' ? s.data : [];
  }

  get transactions(): Transaction[] {
    return this.entries.flatMap((entry) =>
      entry.kind === 'single' ? [entry.tx] : entry.transactions
    );
  }

  get selectionActive(): boolean {
    return this.selectedTransactionIds.size > 0;
  }

  get selectedCount(): number {
    return this.selectedTransactionIds.size;
  }

  load(): void {
    if (this.state.kind === 'initial') {
      this.state = { kind: 'loading' };
    }
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      const all = this.repo.getAllTransactionEntries();
      const todayTx = this.repo.getTransactionsBetween(todayStart, todayEnd);
      runInAction(() => {
        this.todayStats = this.engine.calculate(todayTx);
        this.state = { kind: 'loaded', data: all };
      });
    } catch (error) {
      runInAction(() => {
        this.state = { kind: 'failed', error };
      });
    }
  }

  onTransactionAdded(tx: Transaction): void {
    runInAction(() => {
      this.state = { kind: 'loaded', data: [{ kind: 'single', tx }, ...this.entries] };
      if (isSameDay(tx.soldAt, new Date())) this.recalculateTodayStats();
    });
  }

  editTransaction(
    old: Transaction,
    params: { newQuantity: number; newSellingPrice: number }
  ): void {
    const id = requireId(old);
    this.repo.updateTransaction({
      id,
      quantity: params.newQuantity,
      sellingPriceAtTime: params.newSellingPrice
    });
    this.modRepo.logEdit({ old, ...params });

    const stockDelta = old.quantity - params.newQuantity;
    if (stockDelta !== 0) {
      this.itemRepo.adjustStock(old.itemId, stockDelta);
      this.onTransactionModified?.();
    }

    const updated = new Transaction({
      id: old.id,
      itemId: old.itemId,
      itemName: old.itemName,
      itemUnit: old.itemUnit,
      quantity: params.newQuantity,
      sellingPriceAtTime: params.newSellingPrice,
      costPriceAtTime: old.costPriceAtTime,
      soldAt: old.soldAt,
      batchId: old.batchId
    });

    runInAction(() => {
      this.state = { kind: 'loaded', data: replaceTransaction(this.entries, id, updated) };
      this.recalculateTodayStats();
    });
  }

  deleteTransaction(tx: Transaction): void {
    const id = requireId(tx);
    this.modRepo.logDelete(tx);
    this.repo.deleteTransaction(id);
    this.itemRepo.adjustStock(tx.itemId, tx.quantity);
    this.onTransactionModified?.();
    runInAction(() => {
      this.state = { kind: 'loaded', data: removeTransactions(this.entries, new Set([id])) };
      this.removeSelection(id);
      this.recalculateTodayStats();
    });
  }

  deleteTransactions(txList: readonly Transaction[]): void {
    const ids = new Set(txList.map((tx) => tx.id).filter((id): id is number => id !== null));
    if (ids.size === 0) return;

    for (const tx of txList) this.modRepo.logDelete(tx);
    this.repo.deleteTransactions(ids);

    const stockByItem = new Map<number, number>();
    for (const tx of txList) {
      stockByItem.set(tx.itemId, (stockByItem.get(tx.itemId) ?? 0) + tx.quantity);
    }
    for (const [itemId, qty] of stockByItem) this.itemRepo.adjustStock(itemId, qty);
    this.onTransactionModified?.();

    runInAction(() => {
      this.state = { kind: 'loaded', data: removeTransactions(this.entries, ids) };
      this.clearSelection();
      this.recalculateTodayStats();
    });
  }

  toggleBatchExpanded(batchId: number): void {
    const current = new Set(this.expandedBatchIds);
    if (current.has(batchId)) current.delete(batchId);
    else current.add(batchId);
    this.expandedBatchIds = current;
  }

  toggleSelection(tx: Transaction): void {
    if (tx.id === null) return;
    const selected = new Set(this.selectedTransactionIds);
    if (selected.has(tx.id)) selected.delete(tx.id);
    else selected.add(tx.id);
    this.selectedTransactionIds = selected;
  }

  toggleBatchSelection(batch: BatchEntry): void {
    const ids = batch.transactions.map((tx) => tx.id).filter((id): id is number => id !== null);
    if (ids.length === 0) return;
    const current = new Set(this.selectedTransactionIds);
    const allSelected = ids.every((id) => current.has(id));
    for (const id of ids) {
      if (allSelected) current.delete(id);
      else current.add(id);
    }
    this.selectedTransactionIds = current;
  }

  clearSelection(): void {
    if (this.selectedTransactionIds.size === 0) return;
    this.selectedTransactionIds = new Set();
  }

  private removeSelection(id: number): void {
    if (!this.selectedTransactionIds.has(id)) return;
    const selected = new Set(this.selectedTransactionIds);
    selected.delete(id);
    this.selectedTransactionIds = selected;
  }

  private recalculateTodayStats(): void {
    const todayTx = this.transactions.filter((tx) => isSameDay(tx.soldAt, new Date()));
    this.todayStats = this.engine.calculate(todayTx);
  }
}

function replaceTransaction(
  current: readonly TransactionListEntry[],
  id: number,
  updated: Transaction
): TransactionListEntry[] {
  return current.map((entry) => {
    if (entry.kind === 'single') {
      return entry.tx.id === id ? { kind: 'single', tx: updated } : entry;
    }
    if (!entry.transactions.some((tx) => tx.id === id)) return entry;
    return {
      ...entry,
      transactions: entry.transactions.map((tx) => (tx.id === id ? updated : tx))
    };
  });
}

function removeTransactions(
  current: readonly TransactionListEntry[],
  ids: ReadonlySet<number>
): TransactionListEntry[] {
  const result: TransactionListEntry[] = [];
  for (const entry of current) {
    if (entry.kind === 'single') {
      if (entry.tx.id !== null && ids.has(entry.tx.id)) continue;
      result.push(entry);
      continue;
    }
    const remaining = entry.transactions.filter((tx) => tx.id === null || !ids.has(tx.id));
    if (remaining.length > 0) result.push({ ...entry, transactions: remaining });
  }
  return result;
}

function requireId(tx: Transaction): number {
  if (tx.id === null) throw new Error('Cannot mutate transaction without id');
  return tx.id;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
