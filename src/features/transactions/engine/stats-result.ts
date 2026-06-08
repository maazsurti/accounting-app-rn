export interface ItemStats {
  readonly itemId: number;
  readonly itemName: string;
  readonly unitsSold: number;
  readonly revenue: number;
  readonly profit: number;
}

export interface StatsResult {
  readonly totalRevenue: number;
  readonly totalProfit: number;
  readonly byItem: ItemStats[];
}

export const emptyStatsResult: StatsResult = {
  totalRevenue: 0,
  totalProfit: 0,
  byItem: []
};
