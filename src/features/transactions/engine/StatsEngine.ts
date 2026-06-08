import type { Transaction } from '@/features/quick_record/models/transaction';

import { emptyStatsResult, type ItemStats, type StatsResult } from './stats-result';

interface Accumulator {
  itemId: number;
  itemName: string;
  unitsSold: number;
  revenue: number;
  profit: number;
}

export class StatsEngine {
  calculate(transactions: readonly Transaction[]): StatsResult {
    if (transactions.length === 0) return emptyStatsResult;

    const byItemId = new Map<number, Accumulator>();
    for (const tx of transactions) {
      let acc = byItemId.get(tx.itemId);
      if (!acc) {
        acc = { itemId: tx.itemId, itemName: tx.itemName, unitsSold: 0, revenue: 0, profit: 0 };
        byItemId.set(tx.itemId, acc);
      }
      acc.unitsSold += tx.quantity;
      acc.revenue += tx.revenue;
      acc.profit += tx.profit;
    }

    const byItem: ItemStats[] = [...byItemId.values()]
      .map((acc) => ({ ...acc }))
      .sort((a, b) => b.unitsSold - a.unitsSold);

    return {
      totalRevenue: byItem.reduce((sum, item) => sum + item.revenue, 0),
      totalProfit: byItem.reduce((sum, item) => sum + item.profit, 0),
      byItem
    };
  }
}
